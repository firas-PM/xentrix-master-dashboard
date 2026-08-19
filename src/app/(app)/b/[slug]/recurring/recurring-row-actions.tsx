"use client";

import { useTransition } from "react";
import { setRecurringActive, deleteRecurring } from "@/lib/actions/recurring-actions";

export function RecurringRowActions({
  brandSlug,
  templateId,
  active,
}: {
  brandSlug: string;
  templateId: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await setRecurringActive({ brandSlug, templateId, active: !active });
          })
        }
        className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2 py-1 transition disabled:opacity-50"
      >
        {active ? "Pause" : "Resume"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this recurring template? Materialized tasks stay put.")) return;
          start(async () => {
            await deleteRecurring({ brandSlug, templateId });
          });
        }}
        className="text-xs font-medium rounded-md border border-[var(--danger)]/40 hover:border-[var(--danger)] hover:bg-[var(--danger)]/5 text-[var(--danger)] px-2 py-1 transition disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
