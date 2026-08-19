"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllRead } from "@/lib/actions/notification-actions";

export function MarkAllReadButton({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (unreadCount === 0) return null;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllRead();
          router.refresh();
        })
      }
      className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition disabled:opacity-50"
    >
      {pending ? "Marking…" : `Mark ${unreadCount} as read`}
    </button>
  );
}
