"use client";

import { useTransition } from "react";
import { setInvoiceStatus, deleteInvoice } from "@/lib/actions/invoice-actions";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/models/Invoice";

export function InvoiceRowActions({
  brandSlug,
  invoiceId,
  current,
}: {
  brandSlug: string;
  invoiceId: string;
  current: InvoiceStatus;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={pending}
        value={current}
        onChange={(e) => {
          const next = e.target.value as InvoiceStatus;
          start(async () => {
            await setInvoiceStatus({ brandSlug, invoiceId, status: next });
          });
        }}
        className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1 text-xs capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        {INVOICE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this invoice?")) return;
          start(async () => {
            await deleteInvoice({ brandSlug, invoiceId });
          });
        }}
        aria-label="Delete invoice"
        className="text-[var(--text-muted)] hover:text-[var(--danger)] text-sm px-2 py-1 transition disabled:opacity-50"
      >
        ×
      </button>
    </div>
  );
}
