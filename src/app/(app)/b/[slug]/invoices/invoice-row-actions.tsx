"use client";

import { useState, useTransition } from "react";
import {
  setInvoiceStatus,
  deleteInvoice,
} from "@/lib/actions/invoice-actions";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/models/Invoice";
import { EditInvoiceRow, type InvoiceDraft } from "./edit-invoice-row";

export function InvoiceRowActions({
  brandSlug,
  invoiceId,
  current,
  editable,
}: {
  brandSlug: string;
  invoiceId: string;
  current: InvoiceStatus;
  editable: InvoiceDraft;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);

  return (
    <>
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
          onClick={() => setEditing(true)}
          className="text-xs font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-2 py-1 transition"
        >
          Edit
        </button>
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

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={() => setEditing(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative w-full max-w-2xl rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-3 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Edit invoice
            </div>
            <EditInvoiceRow
              brandSlug={brandSlug}
              initial={editable}
              onDone={() => setEditing(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
