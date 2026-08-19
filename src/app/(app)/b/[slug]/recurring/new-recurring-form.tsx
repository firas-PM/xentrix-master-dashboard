"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRecurring } from "@/lib/actions/recurring-actions";
import {
  RECURRENCE_FREQS,
  TASK_KINDS,
  TASK_PRIORITIES,
  type RecurrenceFreq,
  type TaskKind,
  type TaskPriority,
} from "@/models/types";

type Member = { id: string; name: string; email: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function NewRecurringForm({
  brandSlug,
  members,
}: {
  brandSlug: string;
  members: Member[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TaskKind>("chore");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assignee, setAssignee] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFreq>("daily");
  const [time, setTime] = useState("09:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await createRecurring({
            brandSlug,
            title: title.trim(),
            kind,
            priority,
            defaultAssigneeId: assignee || null,
            frequency,
            daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
            dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
            time,
          });
          if (res.ok) {
            setTitle("");
            router.refresh();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
          New recurring task
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Opening checklist, weekly stock take, monthly report…"
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </div>

      <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
        <Select label="Kind" value={kind} onChange={(v) => setKind(v as TaskKind)} options={TASK_KINDS} />
        <Select label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={TASK_PRIORITIES} />
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Default assignee
          </label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <Select
          label="Frequency"
          value={frequency}
          onChange={(v) => setFrequency(v as RecurrenceFreq)}
          options={RECURRENCE_FREQS}
        />
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Time (HH:mm)
          </label>
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="09:00"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {frequency === "weekly" && (
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Days of week
          </label>
          <div className="flex items-center gap-1">
            {DAYS.map((label, i) => {
              const on = daysOfWeek.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setDaysOfWeek((prev) =>
                      prev.includes(i)
                        ? prev.filter((x) => x !== i)
                        : [...prev, i].sort()
                    )
                  }
                  className={
                    "rounded-md border px-2 py-1 text-xs font-medium transition " +
                    (on
                      ? "bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]"
                      : "border-[var(--border-strong)] hover:bg-[var(--bg-sunken)] text-[var(--text-muted)]")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {frequency === "monthly" && (
        <div className="max-w-[160px]">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Day of month
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
        >
          {pending ? "Creating…" : "Add recurring"}
        </button>
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
