import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForms } from "./login-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect(params.from ?? "/");

  const magicLinkEnabled = Boolean(process.env.RESEND_API_KEY);
  const from = params.from ?? "/";
  const errorMsg = errorMessageFor(params.error);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-indigo-500/20 border border-indigo-500/40 grid place-items-center text-indigo-300 text-sm font-semibold">
            X
          </div>
          <div>
            <div className="text-sm text-neutral-400">Xentrix</div>
            <div className="text-base font-medium">Master Dashboard</div>
          </div>
        </div>

        <LoginForms from={from} errorMsg={errorMsg} magicLinkEnabled={magicLinkEnabled} />

        <p className="text-xs text-neutral-500 text-center pt-6">
          Access is invite-only. Ask your brand admin.
        </p>
      </div>
    </main>
  );
}

function errorMessageFor(code?: string) {
  if (!code) return null;
  switch (code) {
    case "CredentialsSignin":
    case "CallbackRouteError":
      return "Wrong email or password. Try again.";
    case "MissingCSRF":
      return "Session expired. Try again.";
    case "EmailSignin":
      return "Couldn't send the login email. Check the address and try again.";
    case "Verification":
      return "That sign-in link is expired or was already used.";
    default:
      return "Something went wrong. Try again.";
  }
}
