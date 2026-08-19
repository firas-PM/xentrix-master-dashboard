"use server";

import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Task, Project, Brand } from "@/models";
import { requireSession } from "@/lib/access";

export type SearchHit =
  | {
      kind: "task";
      id: string;
      title: string;
      brandSlug: string;
      brandName: string;
      href: string;
      hint?: string;
    }
  | {
      kind: "project";
      id: string;
      title: string;
      brandSlug: string;
      brandName: string;
      href: string;
      hint?: string;
    }
  | {
      kind: "brand";
      id: string;
      title: string;
      brandSlug: string;
      brandName: string;
      href: string;
      hint?: string;
    };

export type SearchResults = {
  tasks: SearchHit[];
  projects: SearchHit[];
  brands: SearchHit[];
};

const searchSchema = z.object({
  q: z.string().min(1).max(200),
});

export async function globalSearch(input: unknown): Promise<SearchResults> {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return { tasks: [], projects: [], brands: [] };

  const session = await requireSession();
  await connectDb();

  const q = parsed.data.q.trim();
  if (!q) return { tasks: [], projects: [], brands: [] };
  const rx = new RegExp(escapeRegex(q), "i");

  // Restrict non-founders to brands they belong to.
  const allowedBrandIds = session.user.isFounder
    ? null
    : session.user.memberships.map((m) => m.brandId).filter(Boolean);

  const brandFilter = allowedBrandIds ? { _id: { $in: allowedBrandIds } } : {};

  const [brandRows, projectRows, taskRows] = await Promise.all([
    Brand.find({
      ...(brandFilter as object),
      $or: [{ name: rx }, { slug: rx }],
    })
      .limit(6)
      .lean(),
    Project.find({
      ...(allowedBrandIds ? { brandId: { $in: allowedBrandIds } } : {}),
      $or: [{ name: rx }, { slug: rx }, { description: rx }],
    })
      .limit(8)
      .populate("brandId", "name slug")
      .lean(),
    Task.find({
      ...(allowedBrandIds ? { brandId: { $in: allowedBrandIds } } : {}),
      $or: [{ title: rx }, { description: rx }],
    })
      .sort({ updatedAt: -1 })
      .limit(12)
      .populate("brandId", "name slug")
      .lean(),
  ]);

  return {
    brands: brandRows.map((b) => ({
      kind: "brand" as const,
      id: String(b._id),
      title: b.name,
      brandSlug: b.slug,
      brandName: b.name,
      href: `/b/${b.slug}`,
      hint: b.sector.replace("_", " "),
    })),
    projects: projectRows.map((p) => {
      const br = p.brandId as unknown as { slug: string; name: string };
      return {
        kind: "project" as const,
        id: String(p._id),
        title: p.name,
        brandSlug: br?.slug ?? "",
        brandName: br?.name ?? "",
        href: `/b/${br?.slug}/projects/${p.slug}`,
        hint: `${br?.name ?? ""} · ${p.stage}`,
      };
    }),
    tasks: taskRows.map((t) => {
      const br = t.brandId as unknown as { slug: string; name: string };
      return {
        kind: "task" as const,
        id: String(t._id),
        title: t.title,
        brandSlug: br?.slug ?? "",
        brandName: br?.name ?? "",
        href: `/b/${br?.slug}/tasks/${String(t._id)}`,
        hint: `${br?.name ?? ""} · ${t.status.replace("_", " ")}`,
      };
    }),
  };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
