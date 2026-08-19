"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions/project-actions";
import { PROJECT_STAGES, type ProjectStage } from "@/models/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function NewProjectForm({ brandSlug }: { brandSlug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [stage, setStage] = useState<ProjectStage>("discovery");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await createProject({
            brandSlug,
            name,
            slug: slug || slugify(name),
            stage,
          });
          if (res.ok) {
            setName("");
            setSlug("");
            setSlugEdited(false);
            router.push(`/b/${brandSlug}/projects/${res.slug}`);
          } else {
            setMsg({ ok: false, text: res.error });
          }
        });
      }}
    >
      <div className="flex-1 min-w-[240px]">
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
          New project
        </label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          required
          placeholder="Landing page rebuild"
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </div>
      <div className="min-w-[180px]">
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
          Slug
        </label>
        <input
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugEdited(true);
          }}
          required
          placeholder="landing-page-rebuild"
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
          Stage
        </label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as ProjectStage)}
          className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          {PROJECT_STAGES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending || !name.trim() || !slug}
        className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
      >
        {pending ? "Creating…" : "Add project"}
      </button>
      {msg && !msg.ok && (
        <span className="text-xs text-[var(--danger)] w-full">{msg.text}</span>
      )}
    </form>
  );
}
