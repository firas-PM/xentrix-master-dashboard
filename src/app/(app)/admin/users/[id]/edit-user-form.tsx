"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateUser,
  adminResetPassword,
  setUserDeactivated,
  deleteUser,
  upsertMembership,
  removeMembership,
} from "@/lib/actions/user-actions";
import { ROLES, type Role } from "@/models/types";

type BrandOpt = { slug: string; name: string };

export type EditableUser = {
  id: string;
  name: string;
  email: string;
  isFounder: boolean;
  deactivatedAt: string | null;
  memberships: { brandSlug: string; brandName: string; role: Role }[];
};

export function EditUserForm({
  user,
  isSelf,
  allBrands,
}: {
  user: EditableUser;
  isSelf: boolean;
  allBrands: BrandOpt[];
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [isFounder, setIsFounder] = useState(user.isFounder);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-8">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          start(async () => {
            const res = await updateUser({ userId: user.id, name, isFounder });
            if (res.ok) {
              setMsg({ ok: true, text: "Saved." });
              router.refresh();
            } else setMsg({ ok: false, text: res.error });
          });
        }}
      >
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          </Field>
          <Field label="Email (read-only)">
            <input
              value={user.email}
              disabled
              className="w-full rounded-md bg-[var(--bg-sunken)] border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-subtle)]"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFounder}
            onChange={(e) => setIsFounder(e.target.checked)}
            disabled={isSelf && user.isFounder}
            className="accent-[color:var(--accent)]"
          />
          Founder (sees every brand + admin section)
          {isSelf && user.isFounder && (
            <span className="text-[10px] text-[var(--text-subtle)]">
              (can&apos;t demote yourself)
            </span>
          )}
        </label>

        <div className="flex items-center gap-3 pt-1">
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
                msg.ok
                  ? "text-xs text-[var(--success)]"
                  : "text-xs text-[var(--danger)]"
              }
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>

      <MembershipsSection
        userId={user.id}
        memberships={user.memberships}
        allBrands={allBrands}
        onChange={() => router.refresh()}
      />

      <SecuritySection
        userId={user.id}
        deactivated={Boolean(user.deactivatedAt)}
        isSelf={isSelf}
      />
    </div>
  );
}

function MembershipsSection({
  userId,
  memberships,
  allBrands,
  onChange,
}: {
  userId: string;
  memberships: { brandSlug: string; brandName: string; role: Role }[];
  allBrands: BrandOpt[];
  onChange: () => void;
}) {
  const [addSlug, setAddSlug] = useState("");
  const [addRole, setAddRole] = useState<Role>("worker");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const availableBrands = allBrands.filter(
    (b) => !memberships.some((m) => m.brandSlug === b.slug)
  );

  return (
    <div className="border-t border-[var(--border)] pt-6">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-3">
        Brand access
      </h3>

      {memberships.length === 0 ? (
        <div className="text-xs text-[var(--text-subtle)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-sunken)] rounded-md py-6 text-center">
          No memberships — add one below.
        </div>
      ) : (
        <div className="space-y-2">
          {memberships.map((m) => (
            <div
              key={m.brandSlug}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
            >
              <span className="text-sm font-medium flex-1 min-w-0 truncate">
                {m.brandName}
              </span>
              <select
                value={m.role}
                onChange={(e) => {
                  const next = e.target.value as Role;
                  start(async () => {
                    await upsertMembership({
                      userId,
                      brandSlug: m.brandSlug,
                      role: next,
                    });
                    onChange();
                  });
                }}
                className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1 text-xs capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {ROLES.filter((r) => r !== "founder").map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Remove access to ${m.brandName}?`)) return;
                  start(async () => {
                    await removeMembership({ userId, brandSlug: m.brandSlug });
                    onChange();
                  });
                }}
                aria-label="Remove membership"
                className="text-[var(--text-muted)] hover:text-[var(--danger)] text-sm px-2 transition disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {availableBrands.length > 0 && (
        <div className="flex items-end gap-2 mt-3">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
              Add brand
            </label>
            <select
              value={addSlug}
              onChange={(e) => setAddSlug(e.target.value)}
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">Pick a brand…</option>
              {availableBrands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
              Role
            </label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as Role)}
              className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {ROLES.filter((r) => r !== "founder").map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={pending || !addSlug}
            onClick={() => {
              setError(null);
              start(async () => {
                try {
                  await upsertMembership({
                    userId,
                    brandSlug: addSlug,
                    role: addRole,
                  });
                  setAddSlug("");
                  onChange();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                }
              });
            }}
            className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
          >
            Add
          </button>
        </div>
      )}
      {error && <p className="text-xs text-[var(--danger)] mt-2">{error}</p>}
    </div>
  );
}

function SecuritySection({
  userId,
  deactivated,
  isSelf,
}: {
  userId: string;
  deactivated: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="border-t border-[var(--border)] pt-6 space-y-4">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-[var(--danger)] mb-3">
        Security & danger zone
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            setNewPassword(null);
            start(async () => {
              const res = await adminResetPassword({ userId });
              if (res.ok) setNewPassword(res.newPassword);
              else setError(res.error);
            });
          }}
          className="text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition disabled:opacity-50"
        >
          {pending && !newPassword ? "Resetting…" : "Reset password"}
        </button>

        {!isSelf && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await setUserDeactivated({
                  userId,
                  deactivated: !deactivated,
                });
                router.refresh();
              });
            }}
            className="text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition disabled:opacity-50"
          >
            {deactivated ? "Reactivate account" : "Deactivate account"}
          </button>
        )}

        {!isSelf && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  "Permanently delete this user? Their tasks will be unassigned. This cannot be undone."
                )
              )
                return;
              start(async () => {
                await deleteUser({ userId });
                router.push("/admin/users");
              });
            }}
            className="text-sm font-medium rounded-md border border-[var(--danger)]/40 hover:border-[var(--danger)] hover:bg-[var(--danger)]/5 text-[var(--danger)] px-3 py-1.5 transition disabled:opacity-50"
          >
            Delete user
          </button>
        )}
      </div>

      {newPassword && (
        <div className="rounded-md border border-[var(--accent)]/50 bg-[var(--accent)]/10 p-3 text-sm">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-ink)] mb-1">
            New password (shown once — copy it now)
          </div>
          <div className="font-mono text-base select-all">{newPassword}</div>
        </div>
      )}
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
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
