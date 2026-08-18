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
      className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-2 py-1 text-[11px] capitalize"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
