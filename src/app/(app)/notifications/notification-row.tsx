"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead } from "@/lib/actions/notification-actions";
import { formatDistanceToNowStrict } from "date-fns";

export type NotificationView = {
  id: string;
  kind: string;
  summary: string;
  href: string;
  brandName?: string;
  createdAt: string;
  readAt: string | null;
};

export function NotificationRow({ n }: { n: NotificationView }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Link
      href={n.href}
      onClick={() =>
        !n.readAt &&
        start(async () => {
          await markNotificationRead({ id: n.id });
        })
      }
      className={
        "flex items-start gap-3 rounded-md border px-4 py-3 transition " +
        (n.readAt
          ? "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]"
          : "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:border-[var(--accent)]")
      }
    >
      {!n.readAt && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]"
          aria-label="Unread"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm">{n.summary}</div>
        <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
          {n.brandName && <>{n.brandName} · </>}
          {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
          {pending && " · marking read…"}
        </div>
      </div>
    </Link>
  );
  void router; // keep import if we later need it
}
