"use client";

import { useState, useTransition } from "react";
import { updateProfile, changePassword } from "@/lib/actions/user-actions";

export function AccountForms({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [pending, start] = useTransition();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwPending, startPw] = useTransition();
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-8">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setProfileMsg(null);
          start(async () => {
            await updateProfile({ name });
            setProfileMsg("Saved.");
          });
        }}
      >
        <Field label="Email (read-only)">
          <input
            value={email}
            disabled
            className="w-full rounded-md bg-[var(--bg-sunken)] border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-subtle)]"
          />
        </Field>
        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
          {profileMsg && <span className="text-xs text-[var(--success)]">{profileMsg}</span>}
        </div>
      </form>

      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
          Change password
        </h3>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPwMsg(null);
            startPw(async () => {
              const res = await changePassword({ current: cur, next, confirm });
              if (res.ok) {
                setPwMsg({ ok: true, text: "Password updated." });
                setCur("");
                setNext("");
                setConfirm("");
              } else {
                setPwMsg({ ok: false, text: res.error });
              }
            });
          }}
        >
          <Field label="Current password">
            <input
              type="password"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          </Field>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
            >
              {pwPending ? "Updating…" : "Update password"}
            </button>
            {pwMsg && (
              <span className={pwMsg.ok ? "text-xs text-[var(--success)]" : "text-xs text-[var(--danger)]"}>
                {pwMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
