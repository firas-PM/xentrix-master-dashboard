"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions/task-actions";
import { TASK_KINDS, TASK_PRIORITIES, type TaskKind, type TaskPriority } from "@/models/types";

type Member = { id: string; name: string; email: string };

export function NewTaskForm({
  brandSlug,
  members,
}: {
  brandSlug: string;
  members: Member[];
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TaskKind>("ops");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          try {
            await createTask({
              brandSlug,
              title: title.trim(),
              kind,
              priority,
              assignedToId: assignedToId || null,
              dueAt: dueAt || null,
            });
            setTitle("");
            setDueAt("");
            setAssignedToId("");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create");
          }
        });
      }}
    >
      <div className="flex-1 min-w-[240px]">
        <label className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
          New task
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="What needs to happen?"
          className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <SelectField label="Kind" value={kind} onChange={(v) => setKind(v as TaskKind)} options={TASK_KINDS} />
      <SelectField label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={TASK_PRIORITIES} />

      <div>
        <label className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
          Assignee
        </label>
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm"
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
        <label className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
          Due
        </label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending || title.trim().length === 0}
        className="rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm px-4 py-2"
      >
        {pending ? "Creating…" : "Add task"}
      </button>

      {error && <span className="text-xs text-red-400 w-full">{error}</span>}
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
      <label className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm capitalize"
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
