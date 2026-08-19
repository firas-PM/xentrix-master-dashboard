"use client";

import { useState, useTransition } from "react";
import { logTaskTime, deleteTaskTime } from "@/lib/actions/time-actions";
import { formatDistanceToNowStrict } from "date-fns";

export type TimeEntryView = {
  id: string;
  minutes: number;
  note: string | null;
  workedAt: string;
  authorName: string;
  authorId: string;
};

export function TaskTime({
  brandSlug,
  taskId,
  entries,
  currentUserId,
}: {
  brandSlug: string;
  taskId: string;
  entries: TimeEntryView[];
  currentUserId: string;
}) {
  const [minutes, setMinutes] = useState("30");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = entries.reduce((s, e) => s + e.minutes, 0);
  const mine = entries.filter((e) => e.authorId === currentUserId).reduce((s, e) => s + e.minutes, 0);

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const m = Number(minutes);
          if (!Number.isFinite(m) || m <= 0) {
            setError("Enter a positive number of minutes.");
            return;
          }
          start(async () => {
            const res = await logTaskTime({
              brandSlug,
              taskId,
              minutes: Math.min(24 * 60, Math.round(m)),
              note: note.trim() || null,
            });
            if (res.ok) {
              setMinutes("30");
              setNote("");
            } else {
              setError(res.error);
            }
          });
        }}
      >
        <div className="w-24">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Minutes
          </label>
          <input
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            required
            inputMode="numeric"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Note (optional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you work on?"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          {pending ? "Logging…" : "Log time"}
        </button>
        {error && <span className="text-xs text-[var(--danger)] w-full">{error}</span>}
      </form>

      <div className="flex items-center gap-4 text-xs text-[var(--text-subtle)]">
        <span>
          Total: <strong className="text-[var(--text)]">{formatMinutes(total)}</strong>
        </span>
        <span>
          Mine: <strong className="text-[var(--text)]">{formatMinutes(mine)}</strong>
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-[var(--text-subtle)]">No time logged yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 text-sm border-b border-[var(--border)] last:border-b-0 pb-1.5"
            >
              <span className="tabular-nums font-semibold text-[var(--accent-ink)] w-16">
                {formatMinutes(e.minutes)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{e.note ?? <em className="text-[var(--text-subtle)]">no note</em>}</div>
                <div className="text-[10px] text-[var(--text-subtle)]">
                  {e.authorName} · {formatDistanceToNowStrict(new Date(e.workedAt), { addSuffix: true })}
                </div>
              </div>
              {e.authorId === currentUserId && (
                <DeleteButton brandSlug={brandSlug} taskId={taskId} entryId={e.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeleteButton({
  brandSlug,
  taskId,
  entryId,
}: {
  brandSlug: string;
  taskId: string;
  entryId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Delete entry"
      onClick={() =>
        start(async () => {
          await deleteTaskTime({ brandSlug, taskId, entryId });
        })
      }
      className="text-[var(--text-muted)] hover:text-[var(--danger)] text-xs px-2 transition disabled:opacity-50"
    >
      ×
    </button>
  );
}

function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}
