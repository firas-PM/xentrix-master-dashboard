import { NextResponse } from "next/server";
import { requireSession } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import {
  User,
  Membership,
  Task,
  TaskComment,
  TaskTimeEntry,
  Notification,
  ActivityEvent,
} from "@/models";

/**
 * GDPR data export — returns a single JSON blob with everything the
 * current user has authored / been assigned / been notified about.
 */
export async function GET() {
  const session = await requireSession();
  await connectDb();
  const uid = session.user.id;

  const [
    profile,
    memberships,
    myTasks,
    myComments,
    myTimeEntries,
    myNotifications,
    myActivity,
  ] = await Promise.all([
    User.findById(uid, { passwordHash: 0 }).lean(),
    Membership.find({ userId: uid }).populate("brandId", "slug name").lean(),
    Task.find({
      $or: [{ assignedToId: uid }, { createdById: uid }],
    }).lean(),
    TaskComment.find({ authorId: uid }).lean(),
    TaskTimeEntry.find({ userId: uid }).lean(),
    Notification.find({ userId: uid }).lean(),
    ActivityEvent.find({ actorId: uid }).lean(),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    profile,
    memberships,
    tasks: myTasks,
    comments: myComments,
    timeEntries: myTimeEntries,
    notifications: myNotifications,
    activity: myActivity,
  };
  const body = JSON.stringify(payload, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="xentrix-my-data.json"`,
    },
  });
}
