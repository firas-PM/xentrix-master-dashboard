"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskFromTemplate } from "@/lib/actions/template-actions";

type TemplateOpt = { id: string; title: string; kind: string };

export function TemplatePicker({
  brandSlug,
  templates,
}: {
  brandSlug: string;
  templates: TemplateOpt[];
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (templates.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[240px]">
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
          Start from a template
        </label>
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="">Pick a template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.kind})
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={pending || !id}
        onClick={() => {
          setError(null);
          start(async () => {
            try {
              const res = await createTaskFromTemplate({
                brandSlug,
                templateId: id,
              });
              setId("");
              router.push(`/b/${brandSlug}/tasks/${res.id}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          });
        }}
        className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
      >
        {pending ? "Creating…" : "Spawn task"}
      </button>
      {error && <span className="text-xs text-[var(--danger)] w-full">{error}</span>}
    </div>
  );
}
