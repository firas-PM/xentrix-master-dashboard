"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBrand } from "@/lib/actions/brand-actions";
import { BRAND_SECTORS, type BrandSector } from "@/models/types";

const PRESET_COLORS = [
  "#FFC801",
  "#153B50",
  "#007891",
  "#489EB5",
  "#8B5CF6",
  "#F43F5E",
  "#22C55E",
  "#F97316",
  "#EAB308",
  "#0EA5E9",
];

export type EditBrandInitial = {
  slug: string;
  name: string;
  sector: BrandSector;
  color: string;
  description: string;
  timezone: string;
};

export function EditBrandForm({ initial }: { initial: EditBrandInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [sector, setSector] = useState<BrandSector>(initial.sector);
  const [color, setColor] = useState(initial.color);
  const [description, setDescription] = useState(initial.description);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await updateBrand({
            slug: initial.slug,
            name,
            sector,
            color,
            description: description || null,
            timezone,
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
        <Field label="Brand name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="URL slug (read-only)">
          <input
            value={initial.slug}
            disabled
            className="w-full rounded-md bg-[var(--bg-sunken)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono text-[var(--text-subtle)]"
          />
        </Field>

        <Field label="Sector">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as BrandSector)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {BRAND_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Timezone">
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </Field>

      <Field label="Brand color">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value.toUpperCase())}
            className="h-9 w-12 rounded-md border border-[var(--border-strong)] cursor-pointer bg-transparent"
          />
          <input
            value={color}
            onChange={(e) => setColor(e.target.value.toUpperCase())}
            className="w-28 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Pick ${c}`}
                className="h-6 w-6 rounded-md border border-[var(--border)]"
                style={{
                  background: c,
                  outline: color.toUpperCase() === c ? "2px solid var(--text)" : "none",
                }}
              />
            ))}
          </div>
        </div>
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
