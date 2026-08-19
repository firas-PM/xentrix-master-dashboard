"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setBrandMemberByEmail,
  removeBrandMember,
} from "@/lib/actions/brand-member-actions";
import { ROLES, type Role } from "@/models/types";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: Role;
};

export function MembersEditor({
  brandSlug,
  members,
  selfUserId,
}: {
  brandSlug: string;
  members: Member[];
  selfUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("worker");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          start(async () => {
            const res = await setBrandMemberByEmail({
              brandSlug,
              email: email.trim(),
              role,
            });
            if (res.ok) {
              setMsg({
                ok: true,
                text: res.added ? "Added." : "Role updated.",
              });
              setEmail("");
              router.refresh();
            } else {
              setMsg({ ok: false, text: res.error });
            }
          });
        }}
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Add or update by email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="person@example.com"
            className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {ROLES.filter((r) => r !== "founder").map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending || !email}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
        >
          {pending ? "…" : "Set"}
        </button>
        {msg && (
          <span
            className={
              "text-xs w-full " +
              (msg.ok ? "text-[var(--success)]" : "text-[var(--danger)]")
            }
          >
            {msg.text}
          </span>
        )}
      </form>

      <div className="space-y-2">
        {members.map((m) => (
          <MemberRow
            key={m.userId}
            brandSlug={brandSlug}
            member={m}
            isSelf={m.userId === selfUserId}
            onChange={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}

function MemberRow({
  brandSlug,
  member,
  isSelf,
  onChange,
}: {
  brandSlug: string;
  member: Member;
  isSelf: boolean;
  onChange: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
      <div className="h-8 w-8 rounded-full bg-[var(--bg-sunken)] border border-[var(--border)] grid place-items-center text-xs uppercase font-semibold text-[var(--text-muted)]">
        {(member.name ?? member.email).slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{member.name}</div>
        <div className="text-[11px] text-[var(--text-subtle)] truncate">
          {member.email}
        </div>
      </div>
      <select
        value={member.role}
        disabled={isSelf || pending}
        onChange={(e) => {
          const next = e.target.value as Role;
          start(async () => {
            await setBrandMemberByEmail({
              brandSlug,
              email: member.email,
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
        disabled={isSelf || pending}
        title={isSelf ? "Can't remove yourself here" : "Remove from brand"}
        onClick={() => {
          if (!confirm(`Remove ${member.name} from this brand?`)) return;
          start(async () => {
            await removeBrandMember({ brandSlug, userId: member.userId });
            onChange();
          });
        }}
        aria-label="Remove member"
        className="text-[var(--text-muted)] hover:text-[var(--danger)] text-sm px-2 transition disabled:opacity-30"
      >
        ×
      </button>
    </div>
  );
}
