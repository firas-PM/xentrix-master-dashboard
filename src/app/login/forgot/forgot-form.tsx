"use client";

import { useEffect, useState } from "react";

export function ForgotForm() {
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/csrf", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { csrfToken?: string }) => setCsrfToken(d.csrfToken ?? ""))
      .catch(() => setCsrfToken(""));
  }, []);

  const disabled = !csrfToken;

  return (
    <form
      method="post"
      action="/api/auth/signin/nodemailer"
      className="space-y-3"
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value="/settings/account" />
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
          Email
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
        className="w-full rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold py-2 transition"
      >
        {disabled ? "Loading…" : "Email me a reset link"}
      </button>
    </form>
  );
}
