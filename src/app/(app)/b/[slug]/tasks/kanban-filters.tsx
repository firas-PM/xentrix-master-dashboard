"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { TASK_KINDS, TASK_PRIORITIES } from "@/models/types";

type Member = { id: string; name: string; email: string };

export function KanbanFilters({ members }: { members: Member[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();

  const assignee = params.get("assignee") ?? "";
  const kind = params.get("kind") ?? "";
  const priority = params.get("priority") ?? "";
  const search = params.get("q") ?? "";

  function set(key: string, val: string) {
    const next = new URLSearchParams(params.toString());
    if (val) next.set(key, val);
    else next.delete(key);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const activeFilters = [assignee, kind, priority, search].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        value={search}
        onChange={(e) => set("q", e.target.value)}
        placeholder="Search titles…"
        className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <select
        value={assignee}
        onChange={(e) => set("assignee", e.target.value)}
        className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        <option value="">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <select
        value={kind}
        onChange={(e) => set("kind", e.target.value)}
        className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        <option value="">All kinds</option>
        {TASK_KINDS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(e) => set("priority", e.target.value)}
        className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {activeFilters > 0 && (
        <button
          type="button"
          onClick={() => start(() => router.replace(pathname, { scroll: false }))}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
