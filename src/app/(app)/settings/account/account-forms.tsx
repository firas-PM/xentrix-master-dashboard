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
            className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-500"
          />
        </Field>
        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
          />
        </Field>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm px-4 py-2"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
          {profileMsg && <span className="text-xs text-emerald-400">{profileMsg}</span>}
        </div>
      </form>

      <div className="border-t border-neutral-900 pt-6">
        <h3 className="text-sm uppercase tracking-wide text-neutral-500 mb-4">
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
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
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
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
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
              className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
            />
          </Field>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm px-4 py-2"
            >
              {pwPending ? "Updating…" : "Update password"}
            </button>
            {pwMsg && (
              <span className={pwMsg.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
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
      <span className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
