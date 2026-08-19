import Link from "next/link";
import { getBrandBySlug } from "@/lib/brands";
import { canManageBrand } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Invoice } from "@/models";
import { PageHeader, Card, EmptyState, Pill, StatTile } from "@/components/primitives";
import { NewInvoiceForm } from "./new-invoice-form";
import { InvoiceRowActions } from "./invoice-row-actions";
import type { InvoiceStatus, InvoiceCurrency } from "@/models/Invoice";
import { format } from "date-fns";

const PAGE_SIZE = 50;

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const brand = await getBrandBySlug(slug);
  const canManage = await canManageBrand(slug);
  await connectDb();

  const listFilter: Record<string, unknown> = { brandId: brand._id };
  if (
    sp.status &&
    (["draft", "sent", "paid", "overdue", "void"] as string[]).includes(sp.status)
  ) {
    listFilter.status = sp.status;
  }

  const [invoices, total, totalsByStatusAgg] = await Promise.all([
    Invoice.find(listFilter)
      .sort({ issuedAt: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Invoice.countDocuments(listFilter),
    // Totals across ALL invoices for this brand (not paginated / not
    // filtered by status), so the stat tiles stay stable.
    Invoice.aggregate([
      { $match: { brandId: brand._id } },
      {
        $group: {
          _id: { status: "$status", currency: "$currency" },
          total: { $sum: "$amountCents" },
        },
      },
    ]),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const totalsByStatus = new Map<InvoiceStatus, Map<string, number>>();
  for (const row of totalsByStatusAgg as Array<{
    _id: { status: InvoiceStatus; currency: string };
    total: number;
  }>) {
    const s = totalsByStatus.get(row._id.status) ?? new Map();
    s.set(row._id.currency, (s.get(row._id.currency) ?? 0) + row.total);
    totalsByStatus.set(row._id.status, s);
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${total} invoice${total === 1 ? "" : "s"} for ${brand.name}.`}
      >
        {canManage && (
          <a
            href={`/api/export/invoices/${slug}`}
            className="text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition"
          >
            Export CSV
          </a>
        )}
      </PageHeader>
      <div className="p-8 space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatTile
            label="Outstanding"
            value={formatTotals(totalsByStatus.get("sent"))}
            hint="Sent, not yet paid"
          />
          <StatTile
            label="Overdue"
            value={formatTotals(totalsByStatus.get("overdue"))}
            hint="Past due date"
          />
          <StatTile
            label="Paid"
            value={formatTotals(totalsByStatus.get("paid"))}
            hint="All-time"
          />
        </div>

        {canManage && (
          <Card>
            <NewInvoiceForm brandSlug={slug} />
          </Card>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 border border-[var(--border)] rounded-md p-0.5 bg-[var(--bg-elevated)] w-fit">
          {[
            { key: "", label: "All" },
            { key: "draft", label: "Draft" },
            { key: "sent", label: "Sent" },
            { key: "paid", label: "Paid" },
            { key: "overdue", label: "Overdue" },
            { key: "void", label: "Void" },
          ].map((f) => {
            const active = (sp.status ?? "") === f.key;
            const href = f.key
              ? `/b/${slug}/invoices?status=${f.key}`
              : `/b/${slug}/invoices`;
            return (
              <Link
                key={f.key || "all"}
                href={href}
                className={
                  "text-xs font-semibold px-2.5 py-1 rounded transition " +
                  (active
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]")
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices in this view"
            hint="Try clearing the filter, or log a new invoice above."
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-sunken)]">
                  <Th>Number</Th>
                  <Th>Client</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th>Status</Th>
                  {canManage && <Th className="text-right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={String(inv._id)}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <Td className="font-mono">{inv.number}</Td>
                    <Td>{inv.clientName ?? <span className="text-[var(--text-subtle)]">—</span>}</Td>
                    <Td className="text-right tabular-nums font-semibold">
                      {formatMoney(inv.amountCents, inv.currency)}
                    </Td>
                    <Td>
                      {inv.issuedAt
                        ? format(new Date(inv.issuedAt), "d MMM yyyy")
                        : "—"}
                    </Td>
                    <Td>
                      {inv.dueAt ? (
                        <span
                          className={
                            inv.status !== "paid" &&
                            inv.status !== "void" &&
                            new Date(inv.dueAt) < new Date()
                              ? "text-[var(--danger)] font-semibold"
                              : ""
                          }
                        >
                          {format(new Date(inv.dueAt), "d MMM yyyy")}
                        </span>
                      ) : (
                        <span className="text-[var(--text-subtle)]">—</span>
                      )}
                    </Td>
                    <Td>
                      <Pill tone={statusTone(inv.status as InvoiceStatus)}>
                        {inv.status}
                      </Pill>
                    </Td>
                    {canManage && (
                      <Td className="text-right">
                        <div className="flex justify-end">
                          <InvoiceRowActions
                            brandSlug={slug}
                            invoiceId={String(inv._id)}
                            current={inv.status as InvoiceStatus}
                            editable={{
                              id: String(inv._id),
                              number: inv.number,
                              amountCents: inv.amountCents,
                              currency: inv.currency as InvoiceCurrency,
                              status: inv.status as InvoiceStatus,
                              clientName: inv.clientName ?? "",
                              notes: inv.notes ?? "",
                              issuedAt: inv.issuedAt
                                ? new Date(inv.issuedAt).toISOString().slice(0, 10)
                                : "",
                              dueAt: inv.dueAt
                                ? new Date(inv.dueAt).toISOString().slice(0, 10)
                                : "",
                            }}
                          />
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              Page {page} of {pageCount} · {total} invoice{total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/b/${slug}/invoices?${new URLSearchParams({
                  ...(sp.status ? { status: sp.status } : {}),
                  page: String(Math.max(1, page - 1)),
                }).toString()}`}
                aria-disabled={page === 1}
                className={
                  "text-xs font-medium rounded-md border border-[var(--border-strong)] px-2.5 py-1 transition " +
                  (page === 1
                    ? "opacity-40 pointer-events-none"
                    : "hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)]")
                }
              >
                ← Prev
              </Link>
              <Link
                href={`/b/${slug}/invoices?${new URLSearchParams({
                  ...(sp.status ? { status: sp.status } : {}),
                  page: String(Math.min(pageCount, page + 1)),
                }).toString()}`}
                aria-disabled={page >= pageCount}
                className={
                  "text-xs font-medium rounded-md border border-[var(--border-strong)] px-2.5 py-1 transition " +
                  (page >= pageCount
                    ? "opacity-40 pointer-events-none"
                    : "hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)]")
                }
              >
                Next →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "px-4 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] " +
        (className ?? "")
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={"px-4 py-3 align-middle " + (className ?? "")}>{children}</td>;
}

function statusTone(s: InvoiceStatus) {
  switch (s) {
    case "paid":
      return "green" as const;
    case "sent":
      return "gold" as const;
    case "overdue":
      return "red" as const;
    case "void":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function formatMoney(cents: number, currency: string) {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatTotals(map: Map<string, number> | undefined): string {
  if (!map || map.size === 0) return "—";
  const parts: string[] = [];
  for (const [currency, cents] of map) {
    parts.push(formatMoney(cents, currency));
  }
  return parts.join(" · ");
}
