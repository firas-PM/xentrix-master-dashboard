"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoice } from "@/lib/actions/invoice-actions";
import {
  INVOICE_CURRENCIES,
  INVOICE_STATUSES,
  type InvoiceCurrency,
  type InvoiceStatus,
} from "@/models/Invoice";

export type InvoiceDraft = {
  id: string;
  number: string;
  amountCents: number;
  currency: InvoiceCurrency;
  status: InvoiceStatus;
  clientName: string;
  notes: string;
  issuedAt: string; // yyyy-mm-dd
  dueAt: string; // yyyy-mm-dd
};

export function EditInvoiceRow({
  brandSlug,
  initial,
  onDone,
}: {
  brandSlug: string;
  initial: InvoiceDraft;
  onDone: () => void;
}) {
  const router = useRouter();
  const [d, setD] = useState<InvoiceDraft>({
    ...initial,
    // display amount in currency units
  });
  const [amountStr, setAmountStr] = useState(
    (initial.amountCents / 100).toFixed(2)
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-2 grid-cols-1 md:grid-cols-6 p-4 bg-[var(--bg-sunken)] border-t border-[var(--border)]"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const amt = Number(amountStr.replace(/,/g, "."));
        if (!Number.isFinite(amt) || amt < 0) {
          setError("Enter a valid amount.");
          return;
        }
        start(async () => {
          const res = await updateInvoice({
            brandSlug,
            invoiceId: d.id,
            number: d.number,
            amountCents: Math.round(amt * 100),
            currency: d.currency,
            status: d.status,
            clientName: d.clientName || null,
            notes: d.notes || null,
            issuedAt: d.issuedAt || null,
            dueAt: d.dueAt || null,
          });
          if (res.ok) {
            router.refresh();
            onDone();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <Field label="Number" className="md:col-span-2">
        <input
          value={d.number}
          onChange={(e) => setD({ ...d, number: e.target.value })}
          required
          className={inputCls + " font-mono"}
        />
      </Field>
      <Field label="Amount">
        <input
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          inputMode="decimal"
          required
          className={inputCls + " tabular-nums"}
        />
      </Field>
      <Field label="Currency">
        <select
          value={d.currency}
          onChange={(e) => setD({ ...d, currency: e.target.value as InvoiceCurrency })}
          className={inputCls}
        >
          {INVOICE_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select
          value={d.status}
          onChange={(e) => setD({ ...d, status: e.target.value as InvoiceStatus })}
          className={inputCls + " capitalize"}
        >
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Issued">
        <input
          type="date"
          value={d.issuedAt}
          onChange={(e) => setD({ ...d, issuedAt: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Due" className="md:col-span-2">
        <input
          type="date"
          value={d.dueAt}
          onChange={(e) => setD({ ...d, dueAt: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Client" className="md:col-span-4">
        <input
          value={d.clientName}
          onChange={(e) => setD({ ...d, clientName: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Notes" className="md:col-span-6">
        <textarea
          value={d.notes}
          onChange={(e) => setD({ ...d, notes: e.target.value })}
          rows={2}
          className={inputCls}
        />
      </Field>

      <div className="md:col-span-6 flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
