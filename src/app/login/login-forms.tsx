"use client";

import { useEffect, useState } from "react";

type Props = {
  from: string;
  errorMsg: string | null;
  magicLinkEnabled: boolean;
};

// Plain HTML forms that POST directly to NextAuth's built-in endpoints.
// Bypasses Server Actions, which are unreliable with signIn() in Next 16
// beta + NextAuth v5 beta. CSRF token is fetched client-side on mount so
// the browser cookie and the form value match.
export function LoginForms({ from, errorMsg, magicLinkEnabled }: Props) {
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { csrfToken?: string }) => setCsrfToken(d.csrfToken ?? ""))
      .catch(() => setCsrfToken(""));
  }, []);

  const disabled = !csrfToken;

  return (
    <>
      <form
        method="post"
        action="/api/auth/callback/credentials"
        className="space-y-4"
      >
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="callbackUrl" value={from} />

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            placeholder="you@xentrix.xyz"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </label>

        {errorMsg && <p className="text-sm text-[var(--danger)]">{errorMsg}</p>}

        <div className="text-right">
          <a
            href="/login/forgot"
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] transition"
          >
            Forgot your password?
          </a>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold py-2 transition"
        >
          {disabled ? "Loading…" : "Sign in"}
        </button>
      </form>

      {magicLinkEnabled && (
        <>
          <div className="flex items-center gap-3 my-6 text-[10px] uppercase tracking-widest text-[var(--text-subtle)] font-semibold">
            <div className="flex-1 h-px bg-[var(--border)]" />
            or
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form
            method="post"
            action="/api/auth/signin/nodemailer"
            className="space-y-3"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value={from} />
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Or get a magic link
              </span>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                placeholder="you@xentrix.xyz"
              />
            </label>
            <button
              type="submit"
              disabled={disabled}
              className="w-full rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] disabled:opacity-50 text-[var(--text)] text-sm font-medium py-2 transition"
            >
              Email me a login link
            </button>
          </form>
        </>
      )}
    </>
  );
}
