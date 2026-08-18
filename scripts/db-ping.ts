import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { connectDb } from "../src/lib/mongoose";
import mongoose from "mongoose";

async function main() {
  const conn = await connectDb();
  const admin = conn.connection.db?.admin();
  const info = await admin?.serverInfo();
  console.log("✓ Connected to MongoDB");
  console.log(`  version: ${info?.version ?? "unknown"}`);
  console.log(`  db:      ${conn.connection.name}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("✗ Connection failed:", err.message);
  process.exit(1);
});
