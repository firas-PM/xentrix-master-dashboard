"use client";

import { useMemo } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { parseTaskTitle, parseDateExpression } from "@/lib/task-parse";
import type { TaskKind, TaskPriority } from "@/models/types";

/**
 * Chips that fill an ISO datetime-local value on click.
 * Used both in the kanban create form and the ⌘⇧K quick capture.
 */
export function DateChips({
  onPick,
}: {
  onPick: (isoLocal: string) => void;
}) {
  const chips = useMemo(
    () => [
      { label: "Today", expr: "today" },
      { label: "Tomorrow", expr: "tomorrow" },
      { label: "+3d", expr: "+3d" },
      { label: "Next Mon", expr: "next mon" },
    ],
    []
  );
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => {
            const d = parseDateExpression(c.expr);
            if (!d) return;
            onPick(toLocalInputValue(d));
          }}
          className="text-[10px] font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2 py-0.5 transition"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A row of gold chips that summarise what the smart-parser extracted
 * from the title string. Purely visual — the parent form is what
 * actually sends the parsed fields to the server.
 */
export function ParseHints({ title }: { title: string }) {
  const parsed = useMemo(() => parseTaskTitle(title), [title]);
  const chips: string[] = [];
  if (parsed.assigneeToken) chips.push(`@${parsed.assigneeToken}`);
  if (parsed.projectSlug) chips.push(`#${parsed.projectSlug}`);
  if (parsed.kind) chips.push(`:${parsed.kind}`);
  if (parsed.priority && parsed.priority !== "normal")
    chips.push(`!${parsed.priority}`);
  if (parsed.dueAt) {
    const rel = formatDistanceToNowStrict(parsed.dueAt, { addSuffix: true });
    chips.push(`due ${rel} (${format(parsed.dueAt, "d MMM HH:mm")})`);
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      <span className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wider">
        Detected:
      </span>
      {chips.map((c) => (
        <span
          key={c}
          className="text-[10px] font-medium rounded-full border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent-ink)] px-2 py-0.5"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

export function toLocalInputValue(d: Date): string {
  // yyyy-mm-ddThh:mm in local time — the format <input type="datetime-local"> wants
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export type ParseSnapshot = {
  cleanTitle: string;
  assigneeToken: string | null;
  projectSlug: string | null;
  priority: TaskPriority | null;
  kind: TaskKind | null;
  dueAt: Date | null;
};

export function useTitleParse(title: string): ParseSnapshot {
  return useMemo(() => parseTaskTitle(title), [title]);
}
