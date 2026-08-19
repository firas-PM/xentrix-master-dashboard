"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateTask } from "@/lib/actions/template-actions";
import { EditRecurringModal, type RecurringDraft } from "@/app/(app)/b/[slug]/recurring/edit-recurring-modal";
import { createRecurring } from "@/lib/actions/recurring-actions";

type Member = { id: string; name: string; email: string };

export function TaskShortcuts({
  brandSlug,
  taskId,
  prefill,
  members,
}: {
  brandSlug: string;
  taskId: string;
  prefill: RecurringDraft;
  members: Member[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [recurring, setRecurring] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await duplicateTask({ brandSlug, taskId });
              router.push(`/b/${brandSlug}/tasks/${res.id}`);
            })
          }
          className="w-full text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition disabled:opacity-50"
        >
          {pending ? "Duplicating…" : "Duplicate task"}
        </button>
        <button
          type="button"
          onClick={() => setRecurring(true)}
          className="w-full text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition"
        >
          Make this recurring…
        </button>
      </div>

      {recurring && (
        <MakeRecurringWrapper
          brandSlug={brandSlug}
          prefill={prefill}
          members={members}
          onDone={() => setRecurring(false)}
        />
      )}
    </>
  );
}

/**
 * The existing EditRecurringModal is wired to updateRecurring (edit-only).
 * For "make from a task" we want create — inline a slim custom modal that
 * pre-fills from the task and calls createRecurring instead.
 */
function MakeRecurringWrapper({
  brandSlug,
  prefill,
  members,
  onDone,
}: {
  brandSlug: string;
  prefill: RecurringDraft;
  members: Member[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [d, setD] = useState<RecurringDraft>(prefill);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Reuse the visual shell of EditRecurringModal by rendering our own form.
  // Simpler: since EditRecurringModal doesn't accept a "create" mode, wrap
  // it with a create call by rendering it with initial={prefill} and
  // intercepting… actually just replicate the create call here.
  void EditRecurringModal; // referenced only so imports stay tree-shakable

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
          Turn this task into a recurring template
        </div>
        <form
          className="p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await createRecurring({
                brandSlug,
                title: d.title,
                kind: d.kind,
                priority: d.priority,
                defaultAssigneeId: d.defaultAssigneeId || null,
                frequency: d.frequency,
                daysOfWeek: d.frequency === "weekly" ? d.daysOfWeek : undefined,
                dayOfMonth: d.frequency === "monthly" ? d.dayOfMonth : undefined,
                time: d.time,
              });
              if (res.ok) {
                router.push(`/b/${brandSlug}/recurring`);
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
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            <div>
              <label className={labelCls}>Frequency</label>
              <select
                value={d.frequency}
                onChange={(e) =>
                  setD({
                    ...d,
                    frequency: e.target.value as RecurringDraft["frequency"],
                  })
                }
                className={inputCls + " capitalize"}
              >
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Time (HH:mm)</label>
              <input
                value={d.time}
                onChange={(e) => setD({ ...d, time: e.target.value })}
                className={inputCls + " font-mono"}
              />
            </div>
            <div>
              <label className={labelCls}>Default assignee</label>
              <select
                value={d.defaultAssigneeId}
                onChange={(e) =>
                  setD({ ...d, defaultAssigneeId: e.target.value })
                }
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={d.priority}
                onChange={(e) =>
                  setD({ ...d, priority: e.target.value as RecurringDraft["priority"] })
                }
                className={inputCls + " capitalize"}
              >
                <option value="low">low</option>
                <option value="normal">normal</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
            >
              {pending ? "Creating…" : "Create recurring template"}
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
