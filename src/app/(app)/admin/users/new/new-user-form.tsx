"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/actions/user-actions";
import { ROLES, type Role } from "@/models/types";

type BrandOpt = { slug: string; name: string };

type BrandRow = { brandSlug: string; role: Role; title?: string };

function randomPassword(len = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

export function NewUserForm({ brands }: { brands: BrandOpt[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => randomPassword());
  const [isFounder, setIsFounder] = useState(false);
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await createUser({
            name,
            email,
            password,
            isFounder,
            memberships: rows.filter((r) => r.brandSlug),
          });
          if (res.ok) {
            setMsg({
              ok: true,
              text: `Created. Share these credentials with them privately: ${email} / ${password}`,
            });
            setTimeout(() => router.push("/admin/users"), 1500);
          } else {
            setMsg({ ok: false, text: res.error });
          }
        });
      }}
    >
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Initial password">
          <div className="flex gap-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="flex-1 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setPassword(randomPassword())}
              className="rounded-md border border-neutral-800 hover:border-neutral-600 text-xs px-3"
            >
              Regenerate
            </button>
          </div>
        </Field>
        <Field label="Role">
          <label className="flex items-center gap-2 text-sm py-2">
            <input
              type="checkbox"
              checked={isFounder}
              onChange={(e) => setIsFounder(e.target.checked)}
              className="accent-indigo-500"
            />
            Founder (sees every brand)
          </label>
        </Field>
      </div>

      <div className="border-t border-neutral-900 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm uppercase tracking-wide text-neutral-500">
              Brand access
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {isFounder
                ? "Founders see every brand — this list is optional."
                : "Add at least one brand or the user won't see anything."}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setRows((r) => [...r, { brandSlug: brands[0]?.slug ?? "", role: "worker" }])
            }
            className="rounded-md border border-neutral-800 hover:border-neutral-600 text-xs px-3 py-1.5"
          >
            + Add brand
          </button>
        </div>

        <div className="space-y-2">
          {rows.length === 0 && (
            <div className="text-xs text-neutral-600 border border-dashed border-neutral-900 rounded-md py-6 text-center">
              No brand access yet.
            </div>
          )}
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
                  Brand
                </label>
                <select
                  value={r.brandSlug}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((row, idx) => (idx === i ? { ...row, brandSlug: e.target.value } : row))
                    )
                  }
                  className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm"
                >
                  {brands.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
                  Role
                </label>
                <select
                  value={r.role}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((row, idx) =>
                        idx === i ? { ...row, role: e.target.value as Role } : row
                      )
                    )
                  }
                  className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-2 text-sm capitalize"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-neutral-400 hover:text-red-400 text-sm px-2 py-2"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm px-4 py-2"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
        {msg && (
          <span className={msg.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
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
      <span className="block text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
