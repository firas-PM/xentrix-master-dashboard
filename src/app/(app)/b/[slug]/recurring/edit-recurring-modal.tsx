"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRecurring } from "@/lib/actions/recurring-actions";
import {
  RECURRENCE_FREQS,
  TASK_KINDS,
  TASK_PRIORITIES,
  type RecurrenceFreq,
  type TaskKind,
  type TaskPriority,
} from "@/models/types";

type Member = { id: string; name: string; email: string };

export type RecurringDraft = {
  id: string;
  title: string;
  kind: TaskKind;
  priority: TaskPriority;
  defaultAssigneeId: string;
  frequency: RecurrenceFreq;
  time: string;
  daysOfWeek: number[];
  dayOfMonth: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EditRecurringModal({
  brandSlug,
  members,
  initial,
  onDone,
}: {
  brandSlug: string;
  members: Member[];
  initial: RecurringDraft;
  onDone: () => void;
}) {
  const router = useRouter();
  const [d, setD] = useState<RecurringDraft>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onDone}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-2xl rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-3 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
          Edit recurring template
        </div>

        <form
          className="p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await updateRecurring({
                brandSlug,
                templateId: d.id,
                title: d.title.trim(),
                kind: d.kind,
                priority: d.priority,
                defaultAssigneeId: d.defaultAssigneeId || null,
                frequency: d.frequency,
                daysOfWeek: d.frequency === "weekly" ? d.daysOfWeek : undefined,
                dayOfMonth: d.frequency === "monthly" ? d.dayOfMonth : undefined,
                time: d.time,
              });
              if (res.ok) {
                router.refresh();
                onDone();
              } else setError(res.error);
            });
          }}
        >
          <Field label="Title">
            <input
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              required
              className={inputCls}
            />
          </Field>

          <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
            <Sel
              label="Kind"
              value={d.kind}
              onChange={(v) => setD({ ...d, kind: v as TaskKind })}
              options={TASK_KINDS as readonly string[]}
            />
            <Sel
              label="Priority"
              value={d.priority}
              onChange={(v) => setD({ ...d, priority: v as TaskPriority })}
              options={TASK_PRIORITIES as readonly string[]}
            />
            <div>
              <label className={labelCls}>Assignee</label>
              <select
                value={d.defaultAssigneeId}
                onChange={(e) => setD({ ...d, defaultAssigneeId: e.target.value })}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <Sel
              label="Frequency"
              value={d.frequency}
              onChange={(v) => setD({ ...d, frequency: v as RecurrenceFreq })}
              options={RECURRENCE_FREQS as readonly string[]}
            />
            <div>
              <label className={labelCls}>Time (HH:mm)</label>
              <input
                value={d.time}
                onChange={(e) => setD({ ...d, time: e.target.value })}
                className={inputCls + " font-mono"}
              />
            </div>
          </div>

          {d.frequency === "weekly" && (
            <div>
              <label className={labelCls}>Days of week</label>
              <div className="flex items-center gap-1">
                {DAYS.map((label, i) => {
                  const on = d.daysOfWeek.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setD({
                          ...d,
                          daysOfWeek: on
                            ? d.daysOfWeek.filter((x) => x !== i)
                            : [...d.daysOfWeek, i].sort(),
                        })
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

          {d.frequency === "monthly" && (
            <div className="max-w-[160px]">
              <label className={labelCls}>Day of month</label>
              <input
                type="number"
                min={1}
                max={31}
                value={d.dayOfMonth}
                onChange={(e) => setD({ ...d, dayOfMonth: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              Cancel
            </button>
            {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

const labelCls =
  "block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1";

const inputCls =
  "w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Sel({
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
      <label className={labelCls}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls + " capitalize"}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace("_", " ")}</option>
        ))}
      </select>
    </div>
  );
}
