"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions/task-actions";
import { TASK_STATUSES, type TaskStatus } from "@/models/types";

export function TaskStatusMenu({
  brandSlug,
  taskId,
  current,
}: {
  brandSlug: string;
  taskId: string;
  current: TaskStatus;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      disabled={pending}
      value={current}
      onChange={(e) => {
        const next = e.target.value as TaskStatus;
        start(async () => {
          await updateTaskStatus({ brandSlug, taskId, status: next });
        });
      }}
      className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1 text-[11px] capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
