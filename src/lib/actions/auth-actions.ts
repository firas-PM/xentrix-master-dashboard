"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function credentialsSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/") || "/";
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: from,
    });
  } catch (error) {
    // NextAuth throws AuthError on invalid credentials. On success, it
    // internally throws a NEXT_REDIRECT sentinel that we must let bubble.
    if (error instanceof AuthError) {
      redirect(`/login?error=CredentialsSignin&from=${encodeURIComponent(from)}`);
    }
    throw error;
  }
}

export async function magicLinkSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const from = String(formData.get("from") ?? "/") || "/";
  try {
    await signIn("nodemailer", {
      email,
      redirectTo: from,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=EmailSignin&from=${encodeURIComponent(from)}`);
    }
    throw error;
  }
}
