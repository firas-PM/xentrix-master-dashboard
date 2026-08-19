"use client";

import { useState, useTransition } from "react";
import { sendDigestNow } from "@/lib/actions/digest-actions";

export function SendDigestButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const res = await sendDigestNow();
            if (res.ok) {
              setMsg({ ok: true, text: `Sent to ${res.sent} founder${res.sent === 1 ? "" : "s"}.` });
            } else {
              setMsg({ ok: false, text: res.error });
            }
          });
        }}
        className="rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] text-sm font-medium px-3 py-1.5 transition disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send weekly digest now"}
      </button>
      {msg && (
        <span
          className={
            "text-xs " + (msg.ok ? "text-[var(--success)]" : "text-[var(--danger)]")
          }
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
