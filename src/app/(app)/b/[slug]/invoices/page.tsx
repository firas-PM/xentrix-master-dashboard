import { getBrandBySlug } from "@/lib/brands";
import { canManageBrand } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Invoice } from "@/models";
import { PageHeader, Card, EmptyState, Pill, StatTile } from "@/components/primitives";
import { NewInvoiceForm } from "./new-invoice-form";
import { InvoiceRowActions } from "./invoice-row-actions";
import type { InvoiceStatus } from "@/models/Invoice";
import { format } from "date-fns";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  const canManage = await canManageBrand(slug);
  await connectDb();
  const invoices = await Invoice.find({ brandId: brand._id })
    .sort({ issuedAt: -1, createdAt: -1 })
    .lean();

  const totalsByStatus = new Map<InvoiceStatus, Map<string, number>>();
  for (const inv of invoices) {
    const s = totalsByStatus.get(inv.status as InvoiceStatus) ?? new Map();
    s.set(inv.currency, (s.get(inv.currency) ?? 0) + inv.amountCents);
    totalsByStatus.set(inv.status as InvoiceStatus, s);
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} for ${brand.name}.`}
      />
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

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            hint="Log the first one to start tracking cashflow per brand."
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
