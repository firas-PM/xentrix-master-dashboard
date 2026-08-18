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
      className="w-full rounded-md border border-red-500/40 hover:border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm px-3 py-2 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete task"}
    </button>
  );
}
