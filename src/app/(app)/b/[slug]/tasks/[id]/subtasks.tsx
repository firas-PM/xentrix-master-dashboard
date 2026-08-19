"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask, updateTaskStatus } from "@/lib/actions/task-actions";
import type { TaskStatus } from "@/models/types";

export type SubtaskView = {
  id: string;
  title: string;
  status: TaskStatus;
};

export function Subtasks({
  brandSlug,
  parentTaskId,
  subtasks,
}: {
  brandSlug: string;
  parentTaskId: string;
  subtasks: SubtaskView[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();

  const doneCount = subtasks.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-3">
      {subtasks.length > 0 && (
        <div className="text-[11px] text-[var(--text-subtle)]">
          {doneCount} of {subtasks.length} done
          <div className="h-1 rounded-full bg-[var(--bg-sunken)] overflow-hidden mt-1">
            <div
              className="h-full bg-[var(--accent)]"
              style={{
                width: `${
                  subtasks.length ? (doneCount / subtasks.length) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      <ul className="space-y-1">
        {subtasks.map((s) => {
          const done = s.status === "done";
          return (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={done}
                disabled={pending}
                onChange={() =>
                  start(async () => {
                    await updateTaskStatus({
                      brandSlug,
                      taskId: s.id,
                      status: done ? "todo" : "done",
                    });
                  })
                }
                className="accent-[color:var(--accent)]"
              />
              <Link
                href={`/b/${brandSlug}/tasks/${s.id}`}
                className={
                  "flex-1 min-w-0 truncate transition " +
                  (done
                    ? "line-through text-[var(--text-subtle)]"
                    : "hover:underline")
                }
              >
                {s.title}
              </Link>
            </li>
          );
        })}
      </ul>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const t = title.trim();
          setTitle("");
          start(async () => {
            await createTask({
              brandSlug,
              title: t,
              parentTaskId,
              kind: "chore",
            });
            router.refresh();
          });
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-xs font-semibold px-3 py-1.5 transition"
        >
          Add
        </button>
      </form>
    </div>
  );
}
