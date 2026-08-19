"use client";

import { useState, useTransition } from "react";
import { updateTaskDetails } from "@/lib/actions/task-actions";
import { TASK_KINDS, TASK_PRIORITIES, type TaskKind, type TaskPriority } from "@/models/types";

type Member = { id: string; name: string; email: string };

type TaskLink = { label: string; url: string };

type Task = {
  id: string;
  title: string;
  description: string;
  kind: string;
  priority: string;
  assignedToId: string;
  dueAt: string;
  links: TaskLink[];
};

export function TaskDetailForm({
  brandSlug,
  task,
  members,
}: {
  brandSlug: string;
  task: Task;
  members: Member[];
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [kind, setKind] = useState<TaskKind>(task.kind as TaskKind);
  const [priority, setPriority] = useState<TaskPriority>(task.priority as TaskPriority);
  const [assignedToId, setAssignedToId] = useState<string>(task.assignedToId);
  const [dueAt, setDueAt] = useState<string>(task.dueAt);
  const [links, setLinks] = useState<TaskLink[]>(task.links);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          await updateTaskDetails({
            brandSlug,
            taskId: task.id,
            title,
            description,
            kind,
            priority,
            assignedToId: assignedToId || null,
            dueAt: dueAt || null,
            links: links.filter((l) => l.label.trim() && l.url.trim()),
          });
          setMsg("Saved.");
        });
      }}
    >
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="What's involved? Any links, files, or context."
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </Field>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SelectField label="Kind" value={kind} onChange={(v) => setKind(v as TaskKind)} options={TASK_KINDS} />
        <SelectField label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={TASK_PRIORITIES} />
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Assignee
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
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
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Due
          </label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Links
          </span>
          <button
            type="button"
            onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
            className="text-xs rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] font-medium px-2 py-1 transition"
          >
            + Add link
          </button>
        </div>
        {links.length === 0 ? (
          <p className="text-xs text-[var(--text-subtle)]">
            Figma, GitHub, Google Doc, spec — anything worth clicking to.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={l.label}
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Label"
                  className="w-40 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <input
                  value={l.url}
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, url: e.target.value } : x
                      )
                    )
                  }
                  placeholder="https://…"
                  className="flex-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLinks((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove link"
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] text-sm px-2 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {msg && <span className="text-xs text-[var(--success)]">{msg}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({
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
