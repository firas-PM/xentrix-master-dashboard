import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage() {
  const magicLinkEnabled = Boolean(process.env.RESEND_API_KEY);
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <XentrixMark className="h-10 w-auto" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold">
              Xentrix
            </div>
            <div className="text-base font-semibold">Reset your password</div>
          </div>
        </div>

        {magicLinkEnabled ? (
          <>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              We&apos;ll email you a sign-in link. Once you&apos;re in, change your
              password from <span className="font-mono text-xs">Settings → Account</span>.
            </p>
            <ForgotForm />
          </>
        ) : (
          <div className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-sunken)] p-4 text-sm text-[var(--text-muted)]">
            Automated password reset isn&apos;t enabled on this deploy
            (RESEND_API_KEY not set). Please contact a founder to reset your
            password.
          </div>
        )}

        <p className="text-xs text-[var(--text-subtle)] text-center pt-6">
          <Link href="/login" className="hover:text-[var(--text)] transition">
            ← Back to sign in
          </Link>
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
