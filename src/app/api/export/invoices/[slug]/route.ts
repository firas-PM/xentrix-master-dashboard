import { NextResponse } from "next/server";
import { requireBrandAccess } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand, Invoice } from "@/models";
import { csvFromRows } from "@/lib/csv";
import { format } from "date-fns";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await requireBrandAccess(slug, "manager");
  await connectDb();
  const brand = await Brand.findOne({ slug }).lean();
  if (!brand) return new NextResponse("Not found", { status: 404 });

  const invoices = await Invoice.find({ brandId: brand._id })
    .sort({ issuedAt: -1 })
    .lean();

  const csv = csvFromRows(
    [
      "number",
      "client",
      "amount",
      "currency",
      "status",
      "issued",
      "due",
      "paid",
      "notes",
    ],
    invoices.map((inv) => [
      inv.number,
      inv.clientName ?? "",
      (inv.amountCents / 100).toFixed(2),
      inv.currency,
      inv.status,
      inv.issuedAt ? format(new Date(inv.issuedAt), "yyyy-MM-dd") : "",
      inv.dueAt ? format(new Date(inv.dueAt), "yyyy-MM-dd") : "",
      inv.paidAt ? format(new Date(inv.paidAt), "yyyy-MM-dd") : "",
      inv.notes ?? "",
    ])
  );

  const filename = `${slug}-invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
