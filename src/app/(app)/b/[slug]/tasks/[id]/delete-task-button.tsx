"use client";

import { useTransition } from "react";
import { deleteTask } from "@/lib/actions/task-actions";

export function DeleteTaskButton({
  brandSlug,
  taskId,
}: {
  brandSlug: string;
  taskId: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this task and all its comments? This cannot be undone.")) return;
        start(async () => {
          await deleteTask({ brandSlug, taskId });
        });
      }}
      className="w-full rounded-md border border-[var(--danger)]/40 hover:border-[var(--danger)] bg-[var(--danger)]/5 hover:bg-[var(--danger)]/10 text-[var(--danger)] text-sm font-medium px-3 py-2 disabled:opacity-50 transition"
    >
      {pending ? "Deleting…" : "Delete task"}
    </button>
  );
}
