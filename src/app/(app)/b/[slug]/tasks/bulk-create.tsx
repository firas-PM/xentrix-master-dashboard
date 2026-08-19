"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateTasks } from "@/lib/actions/template-actions";
import {
  TASK_KINDS,
  TASK_PRIORITIES,
  type TaskKind,
  type TaskPriority,
} from "@/models/types";

type Member = { id: string; name: string; email: string };
type ProjectOpt = { id: string; name: string };

export function BulkCreate({
  brandSlug,
  members,
  projects,
}: {
  brandSlug: string;
  members: Member[];
  projects: ProjectOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<TaskKind>("ops");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assignedToId, setAssignedToId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const titles = text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2.5 py-1 transition"
      >
        + Bulk create
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative w-full max-w-2xl rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-3 flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Bulk create tasks
              </div>
              <div className="ml-auto text-[10px] text-[var(--text-subtle)]">
                One title per line · max 50
              </div>
            </div>

            <form
              className="p-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setMsg(null);
                start(async () => {
                  const res = await bulkCreateTasks({
                    brandSlug,
                    titles: titles.slice(0, 50),
                    kind,
                    priority,
                    assignedToId: assignedToId || null,
                    projectId: projectId || null,
                  });
                  if (res.ok) {
                    setMsg({
                      ok: true,
                      text: `Created ${res.count} task${res.count === 1 ? "" : "s"}.`,
                    });
                    setText("");
                    router.refresh();
                    setTimeout(() => setOpen(false), 900);
                  } else {
                    setMsg({ ok: false, text: res.error });
                  }
                });
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={"Paste one title per line, e.g.\n\nCheck fridge temp\nRestock cups\nWipe espresso wands\nLog daily count into POS"}
                className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                <Sel
                  label="Kind"
                  value={kind}
                  onChange={(v) => setKind(v as TaskKind)}
                  options={TASK_KINDS as readonly string[]}
                />
                <Sel
                  label="Priority"
                  value={priority}
                  onChange={(v) => setPriority(v as TaskPriority)}
                  options={TASK_PRIORITIES as readonly string[]}
                />
                <div>
                  <label className={labelCls}>Assign all to</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— none —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— none —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending || titles.length === 0}
                  className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
                >
                  {pending
                    ? "Creating…"
                    : `Create ${titles.length || 0} task${titles.length === 1 ? "" : "s"}`}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
                >
                  Cancel
                </button>
                {msg && (
                  <span
                    className={
                      "text-xs " +
                      (msg.ok ? "text-[var(--success)]" : "text-[var(--danger)]")
                    }
                  >
                    {msg.text}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const labelCls =
  "block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1";
const inputCls =
  "w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

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
