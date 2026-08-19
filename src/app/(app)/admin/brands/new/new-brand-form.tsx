"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrand } from "@/lib/actions/brand-actions";
import { BRAND_SECTORS, type BrandSector } from "@/models/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export function NewBrandForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [sector, setSector] = useState<BrandSector>("other");
  const [color, setColor] = useState("#FFC801");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("Africa/Tunis");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await createBrand({
            name,
            slug: slug || slugify(name),
            sector,
            color,
            description: description || null,
            timezone,
          });
          if (res.ok) {
            setMsg({ ok: true, text: `Created "${name}". Redirecting…` });
            setTimeout(() => router.push("/admin/brands"), 800);
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
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            required
            placeholder="Property Motion"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="URL slug">
          <input
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugEdited(true);
            }}
            required
            placeholder="property-motion"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
          <p className="text-[11px] text-[var(--text-subtle)] mt-1">
            Used in the URL: /b/{slug || "…"}
          </p>
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
            placeholder="Africa/Tunis"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="One-liner — what does this brand do?"
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
                style={{ background: c, outline: color === c ? "2px solid var(--text)" : "none" }}
              />
            ))}
          </div>
        </div>
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || !name || !slug}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
        >
          {pending ? "Creating…" : "Create brand"}
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
