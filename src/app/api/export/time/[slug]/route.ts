import { NextResponse } from "next/server";
import { requireBrandAccess } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { Brand, TaskTimeEntry } from "@/models";
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

  const rows = await TaskTimeEntry.find({ brandId: brand._id })
    .sort({ workedAt: -1 })
    .populate("userId", "name email")
    .populate("taskId", "title")
    .lean();

  const csv = csvFromRows(
    ["date", "user", "minutes", "hours", "task", "note"],
    rows.map((e) => {
      const u = e.userId as unknown as {
        name?: string;
        email?: string;
      } | null;
      const t = e.taskId as unknown as { title?: string } | null;
      return [
        e.workedAt ? format(new Date(e.workedAt), "yyyy-MM-dd HH:mm") : "",
        u?.name ?? u?.email ?? "",
        e.minutes,
        (e.minutes / 60).toFixed(2),
        t?.title ?? "",
        e.note ?? "",
      ];
    })
  );

  const filename = `${slug}-time-${format(new Date(), "yyyy-MM-dd")}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
