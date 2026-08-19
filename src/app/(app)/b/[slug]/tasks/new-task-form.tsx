"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions/task-actions";
import {
  TASK_KINDS,
  TASK_PRIORITIES,
  type TaskKind,
  type TaskPriority,
} from "@/models/types";
import { parseTaskTitle } from "@/lib/task-parse";
import { ParseHints, DateChips } from "@/components/task-create-widgets";

type Member = { id: string; name: string; email: string };
type ProjectOpt = { id: string; slug: string; name: string };

export function NewTaskForm({
  brandSlug,
  members,
  projects,
}: {
  brandSlug: string;
  members: Member[];
  projects: ProjectOpt[];
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TaskKind>("ops");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [estimate, setEstimate] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          try {
            const parsed = parseTaskTitle(title);
            await createTask({
              brandSlug,
              title: parsed.cleanTitle || title.trim(),
              kind: parsed.kind ?? kind,
              priority: parsed.priority ?? priority,
              assignedToId: assignedToId || null,
              assigneeToken: parsed.assigneeToken ?? undefined,
              projectId: projectId || null,
              projectSlug: parsed.projectSlug ?? undefined,
              dueAt: parsed.dueAt
                ? parsed.dueAt.toISOString()
                : dueAt || null,
              description: description || null,
              estimateMinutes: estimate ? Number(estimate) : null,
            });
            setTitle("");
            setDueAt("");
            setAssignedToId("");
            setDescription("");
            setProjectId("");
            setEstimate("");
            setExpanded(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create");
          }
        });
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            New task
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="What needs to happen? Try `@wendy #onboarding !urgent by tomorrow`"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </div>

        <SelectField label="Kind" value={kind} onChange={(v) => setKind(v as TaskKind)} options={TASK_KINDS} />
        <SelectField label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={TASK_PRIORITIES} />

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Assignee
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm"
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
            className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={pending || title.trim().length === 0}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
        >
          {pending ? "Creating…" : "Add task"}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <ParseHints title={title} />
        <DateChips onPick={setDueAt} />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition ml-auto"
        >
          {expanded ? "− Less" : "+ More fields"}
        </button>
      </div>

      {expanded && (
        <div className="grid gap-2 grid-cols-1 md:grid-cols-3 pt-2 border-t border-[var(--border)]">
          <div className="md:col-span-3">
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Any links, context, acceptance criteria…"
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm"
            >
              <option value="">— none —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
              Estimate (minutes)
            </label>
            <input
              type="number"
              min={0}
              step={15}
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="e.g. 60"
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </form>
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
        className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize"
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
