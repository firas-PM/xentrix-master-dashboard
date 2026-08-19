"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, PlusCircle, ListTodo, FolderKanban, Building2 } from "lucide-react";
import { globalSearch, type SearchHit } from "@/lib/actions/search-actions";
import { createTask } from "@/lib/actions/task-actions";

type BrandOpt = { slug: string; name: string };

type Props = {
  brands: BrandOpt[];
};

type Mode = "search" | "capture";

export function CommandBar({ brands }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("search");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const modKey = e.metaKey || e.ctrlKey;
      if (modKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMode(e.shiftKey ? "capture" : "search");
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-xl rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-[var(--border)]">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={
              "flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition " +
              (mode === "search"
                ? "border-[var(--accent)] text-[var(--text)]"
                : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]")
            }
          >
            <Search className="size-3.5" />
            Search
          </button>
          <button
            type="button"
            onClick={() => setMode("capture")}
            className={
              "flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition " +
              (mode === "capture"
                ? "border-[var(--accent)] text-[var(--text)]"
                : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]")
            }
          >
            <PlusCircle className="size-3.5" />
            Quick task
          </button>
          <div className="ml-auto pr-3 text-[10px] text-[var(--text-subtle)]">
            {mode === "search" ? "⌘K" : "⌘⇧K"} · ESC to close
          </div>
        </div>

        {mode === "search" ? (
          <SearchPanel onClose={() => setOpen(false)} />
        ) : (
          <CapturePanel brands={brands} onClose={() => setOpen(false)} />
        )}
      </div>
    </div>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{
    tasks: SearchHit[];
    projects: SearchHit[];
    brands: SearchHit[];
  }>({ tasks: [], projects: [], brands: [] });
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults({ tasks: [], projects: [], brands: [] });
      return;
    }
    const t = setTimeout(() => {
      start(async () => {
        const r = await globalSearch({ q });
        setResults(r);
      });
    }, 120);
    return () => clearTimeout(t);
  }, [q]);

  const flat = [...results.brands, ...results.projects, ...results.tasks];
  const [cursor, setCursor] = useState(0);
  useEffect(() => setCursor(0), [q]);

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && flat[cursor]) {
      router.push(flat[cursor].href);
      onClose();
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <Search className="size-4 text-[var(--text-subtle)]" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search tasks, projects, brands…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-subtle)]"
        />
        {pending && <span className="text-[10px] text-[var(--text-subtle)]">…</span>}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {q.trim() && flat.length === 0 && !pending && (
          <div className="px-4 py-8 text-sm text-[var(--text-subtle)] text-center">
            No matches for &ldquo;{q}&rdquo;.
          </div>
        )}

        {results.brands.length > 0 && (
          <Section title="Brands">
            {results.brands.map((h, i) => (
              <ResultRow
                key={h.id}
                hit={h}
                icon={<Building2 className="size-4" />}
                active={cursor === i}
                onSelect={() => onClose()}
              />
            ))}
          </Section>
        )}
        {results.projects.length > 0 && (
          <Section title="Projects">
            {results.projects.map((h, i) => (
              <ResultRow
                key={h.id}
                hit={h}
                icon={<FolderKanban className="size-4" />}
                active={cursor === i + results.brands.length}
                onSelect={() => onClose()}
              />
            ))}
          </Section>
        )}
        {results.tasks.length > 0 && (
          <Section title="Tasks">
            {results.tasks.map((h, i) => (
              <ResultRow
                key={h.id}
                hit={h}
                icon={<ListTodo className="size-4" />}
                active={
                  cursor === i + results.brands.length + results.projects.length
                }
                onSelect={() => onClose()}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <div className="px-4 pb-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  hit,
  icon,
  active,
  onSelect,
}: {
  hit: SearchHit;
  icon: React.ReactNode;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={hit.href}
      onClick={onSelect}
      className={
        "flex items-center gap-3 px-4 py-2 text-sm transition " +
        (active
          ? "bg-[var(--bg-sunken)] text-[var(--text)]"
          : "text-[var(--text)] hover:bg-[var(--bg-sunken)]")
      }
    >
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{hit.title}</span>
      {hit.hint && (
        <span className="text-[11px] text-[var(--text-subtle)] shrink-0">
          {hit.hint}
        </span>
      )}
    </Link>
  );
}

function CapturePanel({
  brands,
  onClose,
}: {
  brands: BrandOpt[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brandSlug, setBrandSlug] = useState(brands[0]?.slug ?? "");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">(
    "normal"
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!brandSlug) {
    return (
      <div className="p-8 text-sm text-[var(--text-muted)] text-center">
        No brands available. Create one from Admin → Manage brands.
      </div>
    );
  }

  return (
    <form
      className="p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          try {
            await createTask({
              brandSlug,
              title: title.trim(),
              priority,
              kind: "ops",
            });
            router.push(`/b/${brandSlug}/tasks`);
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create");
          }
        });
      }}
    >
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
          What needs to happen?
        </label>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Send follow-up to client, ship the migration…"
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Brand
          </label>
          <select
            value={brandSlug}
            onChange={(e) => setBrandSlug(e.target.value)}
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "low" | "normal" | "high" | "urgent")
            }
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          {pending ? "Creating…" : "Add task ↵"}
        </button>
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    </form>
  );
}
