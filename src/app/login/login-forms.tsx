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
          <span className="text-xs uppercase tracking-wide text-neutral-400">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="you@xentrix.xyz"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </label>

        {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-medium py-2 transition"
        >
          {disabled ? "Loading…" : "Sign in"}
        </button>
      </form>

      {magicLinkEnabled && (
        <>
          <div className="flex items-center gap-3 my-6 text-[10px] uppercase tracking-widest text-neutral-600">
            <div className="flex-1 h-px bg-neutral-900" />
            or
            <div className="flex-1 h-px bg-neutral-900" />
          </div>

          <form
            method="post"
            action="/api/auth/signin/nodemailer"
            className="space-y-3"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value={from} />
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-neutral-400">
                Or get a magic link
              </span>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@xentrix.xyz"
              />
            </label>
            <button
              type="submit"
              disabled={disabled}
              className="w-full rounded-md border border-neutral-800 hover:border-neutral-600 disabled:opacity-50 text-neutral-300 text-sm font-medium py-2 transition"
            >
              Email me a login link
            </button>
          </form>
        </>
      )}
    </>
  );
}
