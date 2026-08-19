"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/lib/mongoose";
import { Notification } from "@/models";
import { requireSession } from "@/lib/access";

const markSchema = z.object({ id: z.string() });

export async function markNotificationRead(input: unknown) {
  const parsed = markSchema.parse(input);
  const session = await requireSession();
  await connectDb();
  await Notification.updateOne(
    { _id: parsed.id, userId: session.user.id },
    { $set: { readAt: new Date() } }
  );
  revalidatePath("/notifications");
}

export async function markAllRead() {
  const session = await requireSession();
  await connectDb();
  await Notification.updateMany(
    { userId: session.user.id, readAt: null },
    { $set: { readAt: new Date() } }
  );
  revalidatePath("/notifications");
}
