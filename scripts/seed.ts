import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDb } from "../src/lib/mongoose";
import {
  User,
  Brand,
  Membership,
  Project,
  Task,
  RecurringTaskTemplate,
} from "../src/models";
import type { BrandSector } from "../src/models/types";

type BrandSeed = {
  slug: string;
  name: string;
  sector: BrandSector;
  color: string;
  description: string;
  timezone?: string;
  isXentrixManaged?: boolean;
};

const BRANDS: BrandSeed[] = [
  {
    slug: "xentrix",
    name: "Xentrix",
    sector: "agency",
    color: "#FFC801",
    description: "The agency. We build every product under this roof.",
    isXentrixManaged: true,
  },
  {
    slug: "numan",
    name: "Numan",
    sector: "real_estate",
    color: "#22c55e",
    description: "Numan product line — built and operated by Xentrix.",
    isXentrixManaged: true,
  },
  {
    slug: "service-motion",
    name: "Service Motion",
    sector: "real_estate",
    color: "#3b82f6",
    description: "SM — property services platform, built by Xentrix.",
    isXentrixManaged: true,
  },
  {
    slug: "property-motion",
    name: "Property Motion",
    sector: "real_estate",
    color: "#8b5cf6",
    description: "PM — UK property platform, built and operated by Xentrix.",
    isXentrixManaged: true,
  },
  {
    slug: "chailwaa",
    name: "Chailwaa",
    sector: "restaurant",
    color: "#f97316",
    description: "Restaurant chain — daily ops, sourcing, and shift tasks.",
  },
  {
    slug: "bake-and-brew",
    name: "Bake + Brew",
    sector: "coffee_shop",
    color: "#a16207",
    description: "Coffee shop — opening/closing checklists, stock, orders.",
  },
  {
    slug: "advice-office",
    name: "Advice Office",
    sector: "consultancy",
    color: "#0ea5e9",
    description: "Consultant office — client callbacks, meetings, follow-ups.",
  },
  {
    slug: "icop",
    name: "ICOP",
    sector: "other",
    color: "#e11d48",
    description: "ICOP — additional Xentrix-managed brand.",
    isXentrixManaged: true,
  },
  {
    slug: "cofi",
    name: "Cofi",
    sector: "coffee_shop",
    color: "#14b8a6",
    description: "Cofi — cafe operations.",
  },
];

const FOUNDER = {
  name: "Firas Ben Ayed",
  email: "firas@xentrix.xyz",
  password: "founder123", // change on first login
};

async function main() {
  await connectDb();

  // Wipe only if user passes --wipe. Default: idempotent upserts.
  const wipe = process.argv.includes("--wipe");
  if (wipe) {
    console.log("→ wiping collections…");
    await Promise.all([
      User.deleteMany({}),
      Brand.deleteMany({}),
      Membership.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      RecurringTaskTemplate.deleteMany({}),
    ]);
  }

  console.log("→ upserting founder user…");
  const passwordHash = await bcrypt.hash(FOUNDER.password, 10);
  const founder = await User.findOneAndUpdate(
    { email: FOUNDER.email.toLowerCase() },
    {
      $set: {
        name: FOUNDER.name,
        email: FOUNDER.email.toLowerCase(),
        isFounder: true,
        passwordHash,
      },
    },
    { upsert: true, new: true }
  );

  console.log("→ upserting brands…");
  for (const b of BRANDS) {
    await Brand.updateOne(
      { slug: b.slug },
      {
        $setOnInsert: { slug: b.slug },
        $set: {
          name: b.name,
          sector: b.sector,
          color: b.color,
          description: b.description,
          timezone: b.timezone ?? "Africa/Tunis",
          isXentrixManaged: b.isXentrixManaged ?? false,
        },
      },
      { upsert: true }
    );
  }

  console.log("→ ensuring founder membership on all brands…");
  const brands = await Brand.find({}).lean();
  for (const b of brands) {
    await Membership.updateOne(
      { userId: founder._id, brandId: b._id },
      { $set: { role: "founder", title: "Founder" } },
      { upsert: true }
    );
  }

  const sampleProjectsByBrand: Record<string, Array<{ name: string; stage: string; progress: number }>> = {
    xentrix: [
      { name: "Master Dashboard v1", stage: "development", progress: 35 },
      { name: "Xentrix .com relaunch", stage: "design", progress: 60 },
    ],
    "property-motion": [
      { name: "PM app — Listings 2.0", stage: "development", progress: 45 },
      { name: "PM ops portal", stage: "live", progress: 100 },
    ],
    numan: [{ name: "Numan CRM ingest", stage: "staging", progress: 80 }],
    "service-motion": [{ name: "SM booking flow", stage: "design", progress: 20 }],
  };

  console.log("→ seeding sample projects…");
  for (const brand of brands) {
    const list = sampleProjectsByBrand[brand.slug];
    if (!list) continue;
    for (const p of list) {
      await Project.updateOne(
        { brandId: brand._id, slug: slugify(p.name) },
        {
          $setOnInsert: { brandId: brand._id, slug: slugify(p.name) },
          $set: { name: p.name, stage: p.stage, progress: p.progress },
        },
        { upsert: true }
      );
    }
  }

  console.log("→ seeding sample tasks…");
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  const sampleTasks: Array<{
    brandSlug: string;
    title: string;
    kind: string;
    priority: string;
    status: string;
    dueInDays?: number;
  }> = [
    { brandSlug: "xentrix", title: "Ship master dashboard MVP", kind: "dev", priority: "high", status: "in_progress" },
    { brandSlug: "xentrix", title: "Follow up with prospect: Cofi ownership call", kind: "sales", priority: "high", status: "todo", dueInDays: 1 },
    { brandSlug: "property-motion", title: "QA regression on new listings page", kind: "dev", priority: "urgent", status: "in_review", dueInDays: 2 },
    { brandSlug: "property-motion", title: "Landlord onboarding video shoot", kind: "design", priority: "normal", status: "todo", dueInDays: 5 },
    { brandSlug: "bake-and-brew", title: "Order new espresso beans (25kg)", kind: "ops", priority: "normal", status: "todo", dueInDays: 1 },
    { brandSlug: "bake-and-brew", title: "Book repair service for grinder", kind: "ops", priority: "high", status: "todo" },
    { brandSlug: "chailwaa", title: "Weekly stocktake — main branch", kind: "ops", priority: "normal", status: "todo", dueInDays: 3 },
    { brandSlug: "advice-office", title: "Call back Mr. Trabelsi re: consultation", kind: "sales", priority: "high", status: "todo", dueInDays: 0 },
    { brandSlug: "numan", title: "Push v0.9 release notes to Slack", kind: "admin", priority: "low", status: "done" },
  ];

  for (const t of sampleTasks) {
    const brand = brandBySlug.get(t.brandSlug);
    if (!brand) continue;
    const dueAt = t.dueInDays != null ? addDays(new Date(), t.dueInDays) : undefined;
    // Idempotent: skip if a task with the same title exists in this brand.
    const exists = await Task.findOne({ brandId: brand._id, title: t.title }).lean();
    if (exists) continue;
    await Task.create({
      brandId: brand._id,
      title: t.title,
      kind: t.kind,
      priority: t.priority,
      status: t.status,
      dueAt,
      createdById: founder._id,
    });
  }

  console.log("→ seeding recurring task templates…");
  const bakebrew = brandBySlug.get("bake-and-brew");
  const chailwaa = brandBySlug.get("chailwaa");
  const cofi = brandBySlug.get("cofi");
  const recurring: Array<{
    brandId: unknown;
    title: string;
    time: string;
    frequency: "daily" | "weekly";
    daysOfWeek?: number[];
    kind: string;
  }> = [];
  if (bakebrew) {
    recurring.push(
      { brandId: bakebrew._id, title: "Open shop checklist", time: "06:30", frequency: "daily", kind: "chore" },
      { brandId: bakebrew._id, title: "Wash dishes & clean grinder", time: "21:00", frequency: "daily", kind: "chore" }
    );
  }
  if (chailwaa) {
    recurring.push({
      brandId: chailwaa._id,
      title: "Reconcile daily till",
      time: "23:30",
      frequency: "daily",
      kind: "admin",
    });
  }
  if (cofi) {
    recurring.push({
      brandId: cofi._id,
      title: "Weekly stock order",
      time: "09:00",
      frequency: "weekly",
      daysOfWeek: [1], // Monday
      kind: "ops",
    });
  }
  for (const r of recurring) {
    const exists = await RecurringTaskTemplate.findOne({
      brandId: r.brandId,
      title: r.title,
    }).lean();
    if (exists) continue;
    await RecurringTaskTemplate.create({
      brandId: r.brandId,
      title: r.title,
      frequency: r.frequency,
      kind: r.kind,
      priority: "normal",
      schedule: {
        time: r.time,
        daysOfWeek: r.daysOfWeek,
      },
      active: true,
    });
  }

  console.log("\n✓ seed complete");
  console.log(`   founder: ${FOUNDER.email}  password: ${FOUNDER.password}`);
  console.log(`   brands:  ${brands.length}`);

  await mongoose.disconnect();
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
