"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertTaskTemplate,
  deleteTaskTemplate,
} from "@/lib/actions/template-actions";
import {
  TASK_KINDS,
  TASK_PRIORITIES,
  type TaskKind,
  type TaskPriority,
} from "@/models/types";

type Member = { id: string; name: string; email: string };
type ProjectOpt = { id: string; name: string };

export type TemplateDraft = {
  id?: string;
  title: string;
  description: string;
  kind: TaskKind;
  priority: TaskPriority;
  defaultAssigneeId: string;
  projectId: string;
  estimateMinutes: string;
};

export function TemplateEditor({
  brandSlug,
  members,
  projects,
  initial,
  onSaved,
}: {
  brandSlug: string;
  members: Member[];
  projects: ProjectOpt[];
  initial?: TemplateDraft;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [d, setD] = useState<TemplateDraft>(
    initial ?? {
      title: "",
      description: "",
      kind: "ops",
      priority: "normal",
      defaultAssigneeId: "",
      projectId: "",
      estimateMinutes: "",
    }
  );
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await upsertTaskTemplate({
            brandSlug,
            templateId: d.id ?? null,
            title: d.title.trim(),
            description: d.description || null,
            kind: d.kind,
            priority: d.priority,
            defaultAssigneeId: d.defaultAssigneeId || null,
            projectId: d.projectId || null,
            estimateMinutes: d.estimateMinutes ? Number(d.estimateMinutes) : null,
          });
          if (res.ok) {
            setMsg({ ok: true, text: d.id ? "Saved." : "Created." });
            if (!d.id) {
              setD({
                title: "",
                description: "",
                kind: "ops",
                priority: "normal",
                defaultAssigneeId: "",
                projectId: "",
                estimateMinutes: "",
              });
            }
            router.refresh();
            onSaved?.();
          } else setMsg({ ok: false, text: res.error });
        });
      }}
    >
      <div className="grid gap-2 grid-cols-1 md:grid-cols-4">
        <Field label="Template title" className="md:col-span-2">
          <input
            value={d.title}
            onChange={(e) => setD({ ...d, title: e.target.value })}
            required
            placeholder="Landlord onboarding video shoot"
            className={inputCls}
          />
        </Field>
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
      </div>

      <Field label="Default description">
        <textarea
          value={d.description}
          onChange={(e) => setD({ ...d, description: e.target.value })}
          rows={2}
          className={inputCls}
        />
      </Field>

      <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
        <div>
          <label className={labelCls}>Default assignee</label>
          <select
            value={d.defaultAssigneeId}
            onChange={(e) => setD({ ...d, defaultAssigneeId: e.target.value })}
            className={inputCls}
          >
            <option value="">— none —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Default project</label>
          <select
            value={d.projectId}
            onChange={(e) => setD({ ...d, projectId: e.target.value })}
            className={inputCls}
          >
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Default estimate (min)</label>
          <input
            type="number"
            min={0}
            step={15}
            value={d.estimateMinutes}
            onChange={(e) => setD({ ...d, estimateMinutes: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending || !d.title.trim()}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          {pending ? "Saving…" : d.id ? "Save changes" : "Add template"}
        </button>
        {d.id && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Delete template "${d.title}"?`)) return;
              start(async () => {
                await deleteTaskTemplate({ brandSlug, templateId: d.id! });
                router.refresh();
                onSaved?.();
              });
            }}
            className="ml-auto text-xs font-medium rounded-md border border-[var(--danger)]/40 hover:border-[var(--danger)] hover:bg-[var(--danger)]/5 text-[var(--danger)] px-2 py-1 transition disabled:opacity-50"
          >
            Delete template
          </button>
        )}
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

const labelCls =
  "block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1";
const inputCls =
  "w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={"block " + (className ?? "")}>
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
