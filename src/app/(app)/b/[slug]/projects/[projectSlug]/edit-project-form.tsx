"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/project-actions";
import { PROJECT_STAGES, type ProjectStage } from "@/models/types";

export type EditProjectInitial = {
  brandSlug: string;
  projectSlug: string;
  name: string;
  stage: ProjectStage;
  description: string;
  brief: string;
  progress: number;
  liveUrl: string;
  repoUrl: string;
};

export function EditProjectForm({ initial }: { initial: EditProjectInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [stage, setStage] = useState<ProjectStage>(initial.stage);
  const [description, setDescription] = useState(initial.description);
  const [brief, setBrief] = useState(initial.brief);
  const [progress, setProgress] = useState(initial.progress);
  const [liveUrl, setLiveUrl] = useState(initial.liveUrl);
  const [repoUrl, setRepoUrl] = useState(initial.repoUrl);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await updateProject({
            brandSlug: initial.brandSlug,
            projectSlug: initial.projectSlug,
            name,
            stage,
            description: description || null,
            brief: brief || null,
            progress,
            liveUrl: liveUrl || null,
            repoUrl: repoUrl || null,
          });
          if (res.ok) {
            setMsg({ ok: true, text: "Saved." });
            router.refresh();
          } else {
            setMsg({ ok: false, text: res.error });
          }
        });
      }}
    >
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Field label="Project name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="Stage">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as ProjectStage)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {PROJECT_STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Live URL">
          <input
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="Repo URL">
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/…"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
      </div>

      <Field label="Short description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </Field>

      <Field label="Brief / scope of work">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={12}
          placeholder="What are we building, why, and for whom? Constraints, deliverables, out-of-scope. Markdown OK."
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </Field>

      <Field label={`Progress (${progress}%)`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full accent-[color:var(--accent)]"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {msg && (
          <span
            className={
              msg.ok ? "text-xs text-[var(--success)]" : "text-xs text-[var(--danger)]"
            }
          >
            {msg.text}
          </span>
        )}
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
