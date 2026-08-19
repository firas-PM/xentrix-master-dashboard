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
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <XentrixMark className="h-10 w-auto" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold">
              Xentrix
            </div>
            <div className="text-base font-semibold">Master Dashboard</div>
          </div>
        </div>

        <LoginForms from={from} errorMsg={errorMsg} magicLinkEnabled={magicLinkEnabled} />

        <p className="text-xs text-[var(--text-subtle)] text-center pt-6">
          Access is invite-only. Ask your brand admin.
        </p>
      </div>
    </main>
  );
}

function XentrixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 315 398"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Xentrix"
    >
      <path
        d="M129.912 221.819L8.62251 59.1134H61.0761L157.361 190.684L253.933 59.1134H306.386L185.096 221.819L315.009 397.868H262.412L157.361 252.667L52.5973 397.868H0L129.912 221.819Z"
        fill="currentColor"
      />
      <path d="M56.4774 0H258.388L157.504 139.031L56.4774 0Z" fill="#FFC800" />
    </svg>
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
