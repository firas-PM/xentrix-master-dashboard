import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "void",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_CURRENCIES = ["GBP", "EUR", "USD", "TND"] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

const InvoiceSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    /** Free-text invoice number/label — e.g. "INV-2026-014" */
    number: { type: String, required: true },
    /** Amount in the smallest currency unit (pence/cents/millimes). */
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: INVOICE_CURRENCIES, default: "GBP" },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: "draft",
      index: true,
    },
    clientName: { type: String },
    notes: { type: String },
    issuedAt: { type: Date, default: () => new Date() },
    dueAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InvoiceSchema.index({ brandId: 1, status: 1 });

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Invoice: Model<InvoiceDoc> =
  (models.Invoice as Model<InvoiceDoc>) ||
  model<InvoiceDoc>("Invoice", InvoiceSchema);
