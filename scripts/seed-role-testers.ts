import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDb } from "../src/lib/mongoose";
import { User, Membership, Brand, Task } from "../src/models";
import type { Role } from "../src/models/types";

const BRAND_SLUG = "bake-and-brew";
const PASSWORD = "Test123+";

const TESTERS: Array<{
  email: string;
  name: string;
  role: Role;
  isFounder?: boolean;
}> = [
  { email: "worker.test@xentrix.xyz", name: "Wendy Worker", role: "worker" },
  { email: "manager.test@xentrix.xyz", name: "Mia Manager", role: "manager" },
  { email: "admin.test@xentrix.xyz", name: "Adam Admin", role: "brand_admin" },
];

async function main() {
  await connectDb();

  const brand = await Brand.findOne({ slug: BRAND_SLUG }).lean();
  if (!brand) {
    console.error(`No brand with slug ${BRAND_SLUG}. Create it first.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const t of TESTERS) {
    const email = t.email.toLowerCase();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: t.name,
        passwordHash: hash,
        isFounder: false,
      });
      console.log(`✓ created  ${email}`);
    } else {
      await User.updateOne(
        { _id: user._id },
        { $set: { name: t.name, passwordHash: hash, isFounder: false } }
      );
      console.log(`✓ updated  ${email}`);
    }

    await Membership.updateOne(
      { userId: user._id, brandId: brand._id },
      { $set: { role: t.role, title: null } },
      { upsert: true }
    );
  }

  // Assign a task to the worker in Bake+Brew so they see something on /my.
  const worker = await User.findOne({
    email: "worker.test@xentrix.xyz",
  });
  if (worker) {
    const existing = await Task.findOne({
      brandId: brand._id,
      assignedToId: worker._id,
      title: "Opening checklist — kitchen",
    });
    if (!existing) {
      const dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + 26); // tomorrow-ish so it lands in "This week"
      await Task.create({
        brandId: brand._id,
        title: "Opening checklist — kitchen",
        description:
          "Turn on ovens, prep dough for the day, restock display case.",
        kind: "ops",
        status: "todo",
        priority: "high",
        assignedToId: worker._id,
        dueAt,
      });
      console.log(`✓ created a demo task assigned to worker`);
    } else {
      console.log(`· worker demo task already exists`);
    }
  }

  console.log(`\nLogin URL: https://xentrix-master-dashboard.vercel.app/login`);
  console.log(`Password for all three: ${PASSWORD}\n`);
  console.log(`  worker.test@xentrix.xyz     — worker`);
  console.log(`  manager.test@xentrix.xyz    — manager`);
  console.log(`  admin.test@xentrix.xyz      — brand_admin`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
