"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveBrand, restoreBrand } from "@/lib/actions/brand-actions";

export function BrandRowMenu({
  slug,
  isArchived,
}: {
  slug: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={() => router.push(`/admin/brands/${slug}`)}
        className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2.5 py-1 transition"
      >
        Edit
      </button>
      {isArchived ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await restoreBrand({ slug });
            })
          }
          className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2.5 py-1 transition disabled:opacity-50"
        >
          {pending ? "Restoring…" : "Restore"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                `Archive "${slug}"? It will hide from all founder and worker views but data is preserved.`
              )
            )
              return;
            start(async () => {
              await archiveBrand({ slug });
            });
          }}
          className="text-xs font-medium rounded-md border border-[var(--danger)]/40 hover:border-[var(--danger)] hover:bg-[var(--danger)]/5 text-[var(--danger)] px-2.5 py-1 transition disabled:opacity-50"
        >
          {pending ? "Archiving…" : "Archive"}
        </button>
      )}
    </div>
  );
}
