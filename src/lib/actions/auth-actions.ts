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
  console.log("[signIn] start", { email, from });

  try {
    await signIn("credentials", { email, password, redirect: false });
    console.log("[signIn] ok");
  } catch (error) {
    console.error("[signIn] error", error);
    if (error instanceof AuthError) {
      redirect(`/login?error=CredentialsSignin&from=${encodeURIComponent(from)}`);
    }
    throw error;
  }

  redirect(from);
}

export async function magicLinkSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const from = String(formData.get("from") ?? "/") || "/";

  try {
    await signIn("nodemailer", {
      email,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=EmailSignin&from=${encodeURIComponent(from)}`);
    }
    throw error;
  }

  redirect("/login/check-email");
}
