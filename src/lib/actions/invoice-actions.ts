"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Invoice, Brand } from "@/models";
import { requireBrandAccess } from "@/lib/access";
import {
  INVOICE_CURRENCIES,
  INVOICE_STATUSES,
  type InvoiceStatus,
} from "@/models/Invoice";

const createSchema = z.object({
  brandSlug: z.string(),
  number: z.string().min(1).max(60),
  amountCents: z.number().int().min(0).max(1_000_000_000_00),
  currency: z.enum(INVOICE_CURRENCIES).default("GBP"),
  status: z.enum(INVOICE_STATUSES).default("draft"),
  clientName: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  issuedAt: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
});

export type InvoiceResult = { ok: true } | { ok: false; error: string };

export async function createInvoice(input: unknown): Promise<InvoiceResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  await requireBrandAccess(parsed.data.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.data.brandSlug }).lean();
  if (!brand) return { ok: false, error: "Brand not found" };

  await Invoice.create({
    brandId: brand._id,
    number: parsed.data.number.trim(),
    amountCents: parsed.data.amountCents,
    currency: parsed.data.currency,
    status: parsed.data.status,
    clientName: parsed.data.clientName?.trim() || undefined,
    notes: parsed.data.notes?.trim() || undefined,
    issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : new Date(),
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    paidAt: parsed.data.status === "paid" ? new Date() : null,
  });

  revalidatePath(`/b/${parsed.data.brandSlug}/invoices`);
  return { ok: true };
}

const statusSchema = z.object({
  brandSlug: z.string(),
  invoiceId: z.string(),
  status: z.enum(INVOICE_STATUSES),
});

export async function setInvoiceStatus(input: unknown) {
  const parsed = statusSchema.parse(input);
  await requireBrandAccess(parsed.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  const $set: Record<string, unknown> = { status: parsed.status as InvoiceStatus };
  if (parsed.status === "paid") $set.paidAt = new Date();
  if (parsed.status !== "paid") $set.paidAt = null;
  await Invoice.updateOne(
    { _id: parsed.invoiceId, brandId: brand._id },
    { $set }
  );
  revalidatePath(`/b/${parsed.brandSlug}/invoices`);
}

export async function deleteInvoice(input: unknown) {
  const parsed = z
    .object({ brandSlug: z.string(), invoiceId: z.string() })
    .parse(input);
  await requireBrandAccess(parsed.brandSlug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug: parsed.brandSlug }).lean();
  if (!brand) throw new Error("Brand not found");
  await Invoice.deleteOne({ _id: parsed.invoiceId, brandId: brand._id });
  revalidatePath(`/b/${parsed.brandSlug}/invoices`);
}
