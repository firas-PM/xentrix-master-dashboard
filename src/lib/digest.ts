import { connectDb } from "@/lib/mongoose";
import { Brand, Task, User } from "@/models";
import { sendEmailViaResend } from "@/lib/email";

const OPEN = ["todo", "in_progress", "in_review", "blocked"];

type PerBrandStats = {
  brandId: string;
  brandName: string;
  brandSlug: string;
  shippedLastWeek: number;
  openNow: number;
  overdueNow: number;
  topShippers: { name: string; count: number }[];
};

/**
 * Build the founder weekly digest: shipped-last-7d, current open, overdue,
 * and top 3 shippers per brand.
 */
export async function buildFounderDigest(): Promise<{
  totals: {
    shippedLastWeek: number;
    openNow: number;
    overdueNow: number;
  };
  brands: PerBrandStats[];
}> {
  await connectDb();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const brands = await Brand.find({ archivedAt: null }).sort({ name: 1 }).lean();

  const perBrand = await Promise.all(
    brands.map(async (b) => {
      const [shipped, open, overdue, topAgg] = await Promise.all([
        Task.countDocuments({
          brandId: b._id,
          status: "done",
          completedAt: { $gte: weekAgo },
        }),
        Task.countDocuments({
          brandId: b._id,
          status: { $in: OPEN },
        }),
        Task.countDocuments({
          brandId: b._id,
          status: { $in: OPEN },
          dueAt: { $lt: now },
        }),
        Task.aggregate([
          {
            $match: {
              brandId: b._id,
              status: "done",
              completedAt: { $gte: weekAgo },
              assignedToId: { $ne: null },
            },
          },
          { $group: { _id: "$assignedToId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: 0,
              name: { $ifNull: ["$user.name", "$user.email"] },
              count: 1,
            },
          },
        ]),
      ]);

      return {
        brandId: String(b._id),
        brandName: b.name,
        brandSlug: b.slug,
        shippedLastWeek: shipped,
        openNow: open,
        overdueNow: overdue,
        topShippers: topAgg as { name: string; count: number }[],
      };
    })
  );

  const totals = perBrand.reduce(
    (acc, b) => ({
      shippedLastWeek: acc.shippedLastWeek + b.shippedLastWeek,
      openNow: acc.openNow + b.openNow,
      overdueNow: acc.overdueNow + b.overdueNow,
    }),
    { shippedLastWeek: 0, openNow: 0, overdueNow: 0 }
  );

  return { totals, brands: perBrand };
}

export function digestHtml({
  totals,
  brands,
  weekLabel,
}: {
  totals: { shippedLastWeek: number; openNow: number; overdueNow: number };
  brands: PerBrandStats[];
  weekLabel: string;
}) {
  const rows = brands
    .map(
      (b) => `
    <tr>
      <td style="padding: 10px 12px; border-top: 1px solid rgba(17,17,17,0.08);">
        <a href="https://xentrix-master-dashboard.vercel.app/b/${b.brandSlug}" style="color: #111; font-weight: 600; text-decoration: none;">${b.brandName}</a>
        ${b.topShippers.length > 0 ? `<div style="font-size: 11px; color: #7A7A7A;">Top: ${b.topShippers.map((s) => `${s.name} (${s.count})`).join(", ")}</div>` : ""}
      </td>
      <td style="padding: 10px 12px; border-top: 1px solid rgba(17,17,17,0.08); text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #1F7A3A;">${b.shippedLastWeek}</td>
      <td style="padding: 10px 12px; border-top: 1px solid rgba(17,17,17,0.08); text-align: right; font-variant-numeric: tabular-nums;">${b.openNow}</td>
      <td style="padding: 10px 12px; border-top: 1px solid rgba(17,17,17,0.08); text-align: right; font-variant-numeric: tabular-nums; ${b.overdueNow > 0 ? "color: #B3261E; font-weight: 600;" : "color: #7A7A7A;"}">${b.overdueNow}</td>
    </tr>`
    )
    .join("");

  return `<!doctype html><html><body style="font-family: -apple-system, Segoe UI, sans-serif; background: #F5F3EE; color: #111; padding: 32px;">
  <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid rgba(17,17,17,0.1); border-radius: 12px; padding: 28px;">
    <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #7A7A7A; font-weight: 600;">Xentrix · Weekly digest</div>
    <h1 style="font-size: 24px; margin: 6px 0 4px; font-weight: 800;">${weekLabel}</h1>
    <p style="color: #4A4A4A; font-size: 14px; margin: 0 0 20px;">Shipped last 7 days, plus what's on the plate now.</p>

    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; background: #ECE8DF; border-radius: 8px; padding: 12px;">
        <div style="font-size: 10px; color: #4A4A4A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Shipped</div>
        <div style="font-size: 28px; font-weight: 900; color: #FFC801;">${totals.shippedLastWeek}</div>
      </div>
      <div style="flex: 1; background: #ECE8DF; border-radius: 8px; padding: 12px;">
        <div style="font-size: 10px; color: #4A4A4A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Open</div>
        <div style="font-size: 28px; font-weight: 900; color: #FFC801;">${totals.openNow}</div>
      </div>
      <div style="flex: 1; background: #ECE8DF; border-radius: 8px; padding: 12px;">
        <div style="font-size: 10px; color: #4A4A4A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Overdue</div>
        <div style="font-size: 28px; font-weight: 900; color: ${totals.overdueNow > 0 ? "#B3261E" : "#FFC801"};">${totals.overdueNow}</div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 6px 12px; font-size: 10px; color: #7A7A7A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Brand</th>
          <th style="text-align: right; padding: 6px 12px; font-size: 10px; color: #7A7A7A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Shipped</th>
          <th style="text-align: right; padding: 6px 12px; font-size: 10px; color: #7A7A7A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Open</th>
          <th style="text-align: right; padding: 6px 12px; font-size: 10px; color: #7A7A7A; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Overdue</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <a href="https://xentrix-master-dashboard.vercel.app" style="display: inline-block; margin-top: 20px; background: #FFC801; color: #111; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;">Open dashboard</a>
  </div>
</body></html>`;
}

export type DigestResult = { sent: number; failed?: number; skipped?: string };

/** Send digest to every founder user. Fire-and-forget errors. */
export async function sendFounderDigest(): Promise<DigestResult> {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: "no RESEND_API_KEY" };

  const founders = await User.find({ isFounder: true }, { name: 1, email: 1 }).lean();
  if (founders.length === 0) return { sent: 0, skipped: "no founder users" };

  const from = process.env.RESEND_FROM ?? "Xentrix <no-reply@xentrix.xyz>";
  const digest = await buildFounderDigest();
  const now = new Date();
  const weekLabel = `Week of ${now.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
  const html = digestHtml({
    totals: digest.totals,
    brands: digest.brands,
    weekLabel,
  });
  const text =
    `${weekLabel} — Xentrix weekly digest\n\n` +
    `Shipped: ${digest.totals.shippedLastWeek}\nOpen: ${digest.totals.openNow}\nOverdue: ${digest.totals.overdueNow}\n\n` +
    digest.brands
      .map(
        (b) =>
          `${b.brandName}: shipped ${b.shippedLastWeek}, open ${b.openNow}, overdue ${b.overdueNow}`
      )
      .join("\n") +
    `\n\nOpen the dashboard: https://xentrix-master-dashboard.vercel.app`;

  const results = await Promise.allSettled(
    founders.map((f) =>
      sendEmailViaResend({
        from,
        to: f.email,
        subject: `Xentrix weekly digest — ${weekLabel}`,
        html,
        text,
      })
    )
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

