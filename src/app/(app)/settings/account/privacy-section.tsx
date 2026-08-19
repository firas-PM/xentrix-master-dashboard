"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount } from "@/lib/actions/user-actions";

export function PrivacySection({
  email,
  isFounder,
}: {
  email: string;
  isFounder: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2">
          Your data
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Download a full JSON export of your profile, memberships, tasks,
          comments, time entries, notifications, and activity events.
        </p>
        <a
          href="/api/export/me"
          className="text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition inline-block"
        >
          Download my data (JSON)
        </a>
      </div>

      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--danger)] mb-2">
          Delete my account
        </h3>
        {isFounder ? (
          <p className="text-sm text-[var(--text-muted)]">
            Founder accounts can&apos;t self-delete for safety. Ask a
            co-founder to delete you from{" "}
            <span className="font-mono text-xs">Admin → Manage users</span>.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Permanent. Your memberships and comments are wiped; tasks you were
              assigned become unassigned. Type your email to confirm.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={email}
                className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[var(--danger)]"
              />
              <button
                type="button"
                disabled={pending || confirm.toLowerCase() !== email.toLowerCase()}
                onClick={() => {
                  if (
                    !confirm.match(/./) ||
                    !window.confirm(
                      "Really delete your account? This cannot be undone."
                    )
                  )
                    return;
                  setError(null);
                  start(async () => {
                    try {
                      await deleteMyAccount({ confirmEmail: confirm });
                      router.push("/login");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed");
                    }
                  });
                }}
                className="text-sm font-medium rounded-md border border-[var(--danger)]/40 hover:border-[var(--danger)] hover:bg-[var(--danger)]/5 text-[var(--danger)] px-3 py-1.5 transition disabled:opacity-40"
              >
                {pending ? "Deleting…" : "Delete my account"}
              </button>
            </div>
            {error && <p className="text-xs text-[var(--danger)] mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
