import Link from "next/link";
import { requireFounder } from "@/lib/access";
import { getCrossBrandActivity } from "@/lib/queries";
import { PageHeader, Card, EmptyState } from "@/components/primitives";
import { formatDistanceToNowStrict } from "date-fns";

export default async function ActivityPage() {
  await requireFounder();
  const rows = await getCrossBrandActivity(80);

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle={`The last ${rows.length} events across every brand.`}
      />
      <div className="p-8 max-w-3xl">
        {rows.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <Card>
            <ul className="divide-y divide-[var(--border)]">
              {rows.map((r) => (
                <li key={r._id} className="py-2 first:pt-0 last:pb-0 flex items-baseline gap-3">
                  <span
                    className="h-6 w-6 shrink-0 rounded-md grid place-items-center text-[10px] font-semibold uppercase"
                    style={{
                      background: `${r.brand.color}22`,
                      color: r.brand.color,
                      border: `1px solid ${r.brand.color}55`,
                    }}
                    title={r.brand.name}
                  >
                    {r.brand.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm">
                      <Link
                        href={`/b/${r.brand.slug}`}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] transition"
                      >
                        {r.brand.name}
                      </Link>
                      {" · "}
                      <span className="font-medium">
                        {r.actor?.name ?? "System"}
                      </span>{" "}
                      {r.href ? (
                        <Link href={r.href} className="hover:underline">
                          {r.summary}
                        </Link>
                      ) : (
                        <span>{r.summary}</span>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-subtle)] shrink-0">
                    {formatDistanceToNowStrict(new Date(r.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
