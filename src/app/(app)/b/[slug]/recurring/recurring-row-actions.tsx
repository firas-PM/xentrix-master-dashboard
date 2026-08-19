"use client";

import { useState, useTransition } from "react";
import {
  setRecurringActive,
  deleteRecurring,
} from "@/lib/actions/recurring-actions";
import { EditRecurringModal, type RecurringDraft } from "./edit-recurring-modal";

type Member = { id: string; name: string; email: string };

export function RecurringRowActions({
  brandSlug,
  templateId,
  active,
  editable,
  members,
}: {
  brandSlug: string;
  templateId: string;
  active: boolean;
  editable: RecurringDraft;
  members: Member[];
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2 py-1 transition"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setRecurringActive({
                brandSlug,
                templateId,
                active: !active,
              });
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

      {editing && (
        <EditRecurringModal
          brandSlug={brandSlug}
          initial={editable}
          members={members}
          onDone={() => setEditing(false)}
        />
      )}
    </>
  );
}
