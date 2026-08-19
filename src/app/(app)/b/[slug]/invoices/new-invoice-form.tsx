"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/lib/actions/invoice-actions";
import {
  INVOICE_CURRENCIES,
  INVOICE_STATUSES,
  type InvoiceCurrency,
  type InvoiceStatus,
} from "@/models/Invoice";

export function NewInvoiceForm({ brandSlug }: { brandSlug: string }) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState(""); // display units, will convert to cents
  const [currency, setCurrency] = useState<InvoiceCurrency>("GBP");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [clientName, setClientName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 grid-cols-1 md:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const amt = Number(amount.replace(/,/g, "."));
        if (!Number.isFinite(amt) || amt < 0) {
          setError("Enter a valid amount.");
          return;
        }
        start(async () => {
          const res = await createInvoice({
            brandSlug,
            number: number.trim(),
            amountCents: Math.round(amt * 100),
            currency,
            status,
            clientName: clientName || null,
            dueAt: dueAt || null,
          });
          if (res.ok) {
            setNumber("");
            setAmount("");
            setClientName("");
            setDueAt("");
            router.refresh();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <Field label="Invoice number" className="md:col-span-2">
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="INV-2026-014"
          required
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </Field>
      <Field label="Amount">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1250.00"
          required
          inputMode="decimal"
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </Field>
      <Field label="Currency">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as InvoiceCurrency)}
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          {INVOICE_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Due" className="md:col-span-2">
        <input
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </Field>
      <Field label="Client (optional)" className="md:col-span-3">
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Company Ltd."
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </Field>
      <div className="md:col-span-1 flex items-end">
        <button
          type="submit"
          disabled={pending || !number || !amount}
          className="w-full rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-3 py-1.5 transition"
        >
          {pending ? "…" : "Add"}
        </button>
      </div>
      {error && (
        <span className="md:col-span-6 text-xs text-[var(--danger)]">{error}</span>
      )}
    </form>
  );
}

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
