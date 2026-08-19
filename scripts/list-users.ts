import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import mongoose from "mongoose";
import { connectDb } from "../src/lib/mongoose";
import { User } from "../src/models";

async function main() {
  await connectDb();
  const users = await User.find({}, {
    email: 1,
    name: 1,
    isFounder: 1,
    passwordHash: 1,
    createdAt: 1,
  })
    .sort({ createdAt: 1 })
    .lean();

  if (users.length === 0) {
    console.log("(no users in DB)");
  } else {
    console.log(`Found ${users.length} user${users.length === 1 ? "" : "s"}:\n`);
    for (const u of users) {
      console.log(
        `  ${u.isFounder ? "★" : "·"} ${u.email.padEnd(35)}  ${u.name ?? "—"}` +
          `  ${u.passwordHash ? "(pwd set)" : "(no pwd — magic-link only)"}`
      );
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
