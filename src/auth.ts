import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { z } from "zod";
import bcrypt from "bcryptjs";
import mongoClientPromise from "@/lib/mongo-client";
import { connectDb } from "@/lib/mongoose";
import { User, Membership } from "@/models";
import type { Role } from "@/models/types";
import { magicLinkEmail, sendEmailViaResend } from "@/lib/email";

export type SessionMembership = {
  brandId: string;
  brandSlug: string;
  brandName: string;
  role: Role;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isFounder: boolean;
      memberships: SessionMembership[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth" {
  interface User {
    id?: string;
    isFounder?: boolean;
  }
}

type AppJWT = {
  userId: string;
  isFounder: boolean;
  memberships: SessionMembership[];
  [key: string]: unknown;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadMemberships(userId: string): Promise<SessionMembership[]> {
  await connectDb();
  const rows = await Membership.find({ userId }).populate("brandId").lean();
  return rows
    .map((m) => {
      const b = m.brandId as unknown as {
        _id: { toString(): string };
        slug: string;
        name: string;
      } | null;
      if (!b) return null;
      return {
        brandId: b._id.toString(),
        brandSlug: b.slug,
        brandName: b.name,
        role: m.role as Role,
      };
    })
    .filter((x): x is SessionMembership => x !== null);
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      await connectDb();
      const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).lean();
      if (!user || !user.passwordHash) return null;
      if (user.deactivatedAt) return null;
      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        isFounder: user.isFounder ?? false,
      };
    },
  }),
];

// Only register the email/magic-link provider if Resend is configured.
if (process.env.RESEND_API_KEY) {
  providers.push(
    Nodemailer({
      // We're not actually using nodemailer's SMTP; sendVerificationRequest
      // fully overrides the delivery path with Resend's HTTP API.
      server: { host: "unused", port: 0, auth: { user: "", pass: "" } },
      from: process.env.EMAIL_FROM ?? "Xentrix <no-reply@xentrix.xyz>",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const host = new URL(url).host;
        const { subject, html, text } = magicLinkEmail({ url, host });
        await sendEmailViaResend({
          from: provider.from as string,
          to: identifier,
          subject,
          html,
          text,
        });
      },
    })
  );
}

const config: NextAuthConfig = {
  // Use the Mongo adapter so email verification tokens have a place to live.
  // JWT session strategy means we don't need session records in the DB.
  adapter: MongoDBAdapter(mongoClientPromise, {
    databaseName: undefined, // use db from URI
  }),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", verifyRequest: "/login/check-email" },
  providers,
  callbacks: {
    // First-time sign-in via magic link creates a User row via the adapter,
    // but with no isFounder / password. Auto-link them if a matching email
    // was pre-created by an admin.
    signIn: async ({ user, account }) => {
      if (account?.provider === "nodemailer") {
        await connectDb();
        const existing = await User.findOne({ email: (user.email ?? "").toLowerCase() }).lean();
        if (existing) {
          // Populate id so JWT callback can load memberships correctly.
          user.id = existing._id.toString();
          user.isFounder = existing.isFounder ?? false;
        }
      }
      return true;
    },
    jwt: async ({ token, user, trigger }) => {
      const t = token as AppJWT;
      if (user?.id) {
        t.userId = user.id;
        t.isFounder = user.isFounder ?? false;
        t.memberships = await loadMemberships(user.id);
      } else if (trigger === "update" && t.userId) {
        t.memberships = await loadMemberships(t.userId);
      }
      return t;
    },
    session: async ({ session, token }) => {
      const t = token as AppJWT;
      if (session.user) {
        session.user.id = t.userId;
        session.user.isFounder = t.isFounder;
        session.user.memberships = t.memberships ?? [];
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
