import { Types } from "mongoose";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/mongoose";
import { Task, Project, Brand, ActivityEvent } from "@/models";

export const brandStatsTag = "brand-stats";
export const founderOverviewTag = "founder-overview";
export const brandListTag = "brand-list";

export type BrandListEntry = { slug: string; name: string };

/** Non-archived brand slugs+names for founder-level quick-capture / search. */
export const listAllBrands = unstable_cache(
  async (): Promise<BrandListEntry[]> => {
    await connectDb();
    const rows = await Brand.find({ archivedAt: null }, { slug: 1, name: 1 })
      .sort({ name: 1 })
      .lean();
    return rows.map((b) => ({ slug: b.slug, name: b.name }));
  },
  ["brand-list"],
  { revalidate: 300, tags: [brandListTag] }
);

const OPEN_STATUSES = ["todo", "in_progress", "in_review", "blocked"] as const;

export type BrandLandingStats = {
  open: number;
  overdue: number;
  inReview: number;
  activeProjects: number;
  recentTasks: Array<{
    _id: string;
    title: string;
    status: string;
    kind: string;
    priority: string;
    dueAt: Date | null;
    updatedAt: Date;
  }>;
  activeProjectDocs: Array<{
    _id: string;
    name: string;
    stage: string;
    progress: number;
  }>;
};

/**
 * Two Mongo aggregates (task + project facets) instead of the 6 separate
 * countDocuments/find calls the brand landing used to fire. Cached for 20s
 * behind a per-brand tag so repeat navigation is instant; mutations bust
 * the tag via revalidateTag(brandStatsTag(brandId)).
 */
export async function getBrandLandingStats(
  brandId: Types.ObjectId | string
): Promise<BrandLandingStats> {
  const id = String(brandId);
  return getBrandLandingStatsCached(id);
}

const getBrandLandingStatsCached = unstable_cache(
  async (brandId: string): Promise<BrandLandingStats> => {
    await connectDb();
    const now = new Date();
    const oid = new Types.ObjectId(brandId);

    const [taskAgg, projectAgg] = await Promise.all([
      Task.aggregate([
        { $match: { brandId: oid } },
        {
          $facet: {
            open: [
              { $match: { status: { $in: OPEN_STATUSES } } },
              { $count: "n" },
            ],
            overdue: [
              {
                $match: {
                  status: { $in: OPEN_STATUSES },
                  dueAt: { $lt: now },
                },
              },
              { $count: "n" },
            ],
            inReview: [{ $match: { status: "in_review" } }, { $count: "n" }],
            recent: [
              { $sort: { updatedAt: -1 } },
              { $limit: 8 },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  status: 1,
                  kind: 1,
                  priority: 1,
                  dueAt: 1,
                  updatedAt: 1,
                },
              },
            ],
          },
        },
      ]),
      Project.aggregate([
        { $match: { brandId: oid, archivedAt: null } },
        {
          $facet: {
            active: [{ $count: "n" }],
            recent: [
              { $sort: { updatedAt: -1 } },
              { $limit: 6 },
              { $project: { _id: 1, name: 1, stage: 1, progress: 1 } },
            ],
          },
        },
      ]),
    ]);

    const t = taskAgg[0] ?? {};
    const p = projectAgg[0] ?? {};

    return {
      open: t.open?.[0]?.n ?? 0,
      overdue: t.overdue?.[0]?.n ?? 0,
      inReview: t.inReview?.[0]?.n ?? 0,
      activeProjects: p.active?.[0]?.n ?? 0,
      recentTasks: (t.recent ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        _id: String(r._id),
      })),
      activeProjectDocs: (p.recent ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        _id: String(r._id),
      })),
    };
  },
  ["brand-landing-stats"],
  { revalidate: 20, tags: [brandStatsTag] }
);

export type FounderOverview = {
  totals: { brands: number; openTasks: number; activeProjects: number };
  perBrand: Array<{
    brandId: string;
    open: number;
    overdue: number;
    projects: number;
  }>;
};

/**
 * Founder home used to fire (1 brand list + 2 global counts) + (3 counts × N brands).
 * With 7 brands that's ~24 round trips. This collapses it to 2 aggregates + 1 count.
 */
export const getFounderOverview = unstable_cache(
  async (): Promise<FounderOverview> => {
    await connectDb();
    const now = new Date();

    const [brandsCount, taskAgg, projectAgg] = await Promise.all([
      Brand.countDocuments({ archivedAt: null }),
      Task.aggregate([
        {
          $facet: {
            totalOpen: [
              { $match: { status: { $in: OPEN_STATUSES } } },
              { $count: "n" },
            ],
            perBrandOpen: [
              { $match: { status: { $in: OPEN_STATUSES } } },
              { $group: { _id: "$brandId", n: { $sum: 1 } } },
            ],
            perBrandOverdue: [
              {
                $match: {
                  status: { $in: OPEN_STATUSES },
                  dueAt: { $lt: now },
                },
              },
              { $group: { _id: "$brandId", n: { $sum: 1 } } },
            ],
          },
        },
      ]),
      Project.aggregate([
        { $match: { archivedAt: null } },
        {
          $facet: {
            total: [
              { $match: { stage: { $ne: "archived" } } },
              { $count: "n" },
            ],
            perBrand: [{ $group: { _id: "$brandId", n: { $sum: 1 } } }],
          },
        },
      ]),
    ]);

    const t = taskAgg[0] ?? {};
    const p = projectAgg[0] ?? {};

    const openByBrand = new Map<string, number>();
    for (const row of t.perBrandOpen ?? []) {
      openByBrand.set(String(row._id), row.n);
    }
    const overdueByBrand = new Map<string, number>();
    for (const row of t.perBrandOverdue ?? []) {
      overdueByBrand.set(String(row._id), row.n);
    }
    const projectsByBrand = new Map<string, number>();
    for (const row of p.perBrand ?? []) {
      projectsByBrand.set(String(row._id), row.n);
    }

    const brandIds = new Set<string>([
      ...openByBrand.keys(),
      ...overdueByBrand.keys(),
      ...projectsByBrand.keys(),
    ]);

    return {
      totals: {
        brands: brandsCount,
        openTasks: t.totalOpen?.[0]?.n ?? 0,
        activeProjects: p.total?.[0]?.n ?? 0,
      },
      perBrand: [...brandIds].map((id) => ({
        brandId: id,
        open: openByBrand.get(id) ?? 0,
        overdue: overdueByBrand.get(id) ?? 0,
        projects: projectsByBrand.get(id) ?? 0,
      })),
    };
  },
  ["founder-overview"],
  { revalidate: 20, tags: [founderOverviewTag] }
);

export type MyTasksBucket = "overdue" | "today" | "upcoming" | "someday";

export type MyTaskRow = {
  _id: string;
  title: string;
  status: string;
  kind: string;
  priority: string;
  dueAt: Date | null;
  brand: { slug: string; name: string; color: string };
  bucket: MyTasksBucket;
};

const OPEN_STATUSES_MUTABLE = [
  "todo",
  "in_progress",
  "in_review",
  "blocked",
] as const;

export async function getMyOpenTasks(userId: string): Promise<MyTaskRow[]> {
  await connectDb();
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const rows = await Task.aggregate([
    {
      $match: {
        assignedToId: new Types.ObjectId(userId),
        status: { $in: OPEN_STATUSES_MUTABLE },
      },
    },
    { $sort: { dueAt: 1, priority: -1, updatedAt: -1 } },
    { $limit: 100 },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    {
      $project: {
        _id: 1,
        title: 1,
        status: 1,
        kind: 1,
        priority: 1,
        dueAt: 1,
        brand: { slug: "$brand.slug", name: "$brand.name", color: "$brand.color" },
      },
    },
  ]);

  return rows.map((r: Record<string, unknown>) => {
    const due = r.dueAt as Date | null;
    const bucket: MyTasksBucket = !due
      ? "someday"
      : due < now
        ? "overdue"
        : due <= endOfToday
          ? "today"
          : due <= endOfWeek
            ? "upcoming"
            : "someday";
    return {
      ...(r as Omit<MyTaskRow, "_id" | "bucket">),
      _id: String(r._id),
      bucket,
    };
  });
}

export type BrandActivityRow = {
  _id: string;
  kind: string;
  summary: string;
  href: string | null;
  createdAt: Date;
  actor: { name: string; email: string } | null;
};

export async function getBrandActivity(
  brandId: Types.ObjectId | string,
  limit = 40
): Promise<BrandActivityRow[]> {
  await connectDb();
  const oid = typeof brandId === "string" ? new Types.ObjectId(brandId) : brandId;
  const rows = await ActivityEvent.find({ brandId: oid })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actorId", "name email")
    .lean();
  return rows.map((r) => {
    const actor = r.actorId as unknown as {
      name?: string;
      email?: string;
    } | null;
    return {
      _id: String(r._id),
      kind: r.kind,
      summary: r.summary,
      href: r.href ?? null,
      createdAt: r.createdAt,
      actor: actor
        ? { name: actor.name ?? actor.email ?? "?", email: actor.email ?? "" }
        : null,
    };
  });
}
