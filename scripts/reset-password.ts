import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDb } from "../src/lib/mongoose";
import { User } from "../src/models";

/**
 * Usage: pnpm exec tsx scripts/reset-password.ts <email> <new-password>
 */
async function main() {
  const [, , email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error("Usage: tsx scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  await connectDb();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: user._id }, { $set: { passwordHash: hash } });
  console.log(`✓ Password reset for ${user.email}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
