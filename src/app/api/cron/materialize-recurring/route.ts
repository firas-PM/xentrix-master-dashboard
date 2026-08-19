import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { RecurringTaskTemplate, Task, Brand } from "@/models";
import { sendFounderDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron will hit this endpoint with `Authorization: Bearer <CRON_SECRET>`.
// We also allow manual trigger for testing when CRON_SECRET is unset in dev.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (secret) {
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  await connectDb();

  const now = new Date();
  const templates = await RecurringTaskTemplate.find({ active: true }).populate("brandId").lean();

  const created: Array<{ template: string; brand: string; scheduledFor: string }> = [];

  for (const t of templates) {
    const brand = t.brandId as unknown as {
      _id: { toString(): string };
      timezone: string;
      name: string;
    } | null;
    if (!brand) continue;

    if (!t.schedule?.time) continue;
    const scheduledFor = computeScheduledFor(
      {
        frequency: t.frequency,
        schedule: {
          time: t.schedule.time,
          daysOfWeek: t.schedule.daysOfWeek ?? undefined,
          dayOfMonth: t.schedule.dayOfMonth ?? undefined,
        },
      },
      brand.timezone,
      now
    );
    if (!scheduledFor) continue;

    // Only materialize if we haven't already for this exact scheduled slot.
    const lastRun = t.lastRunAt ? new Date(t.lastRunAt) : null;
    if (lastRun && lastRun >= scheduledFor) continue;
    if (scheduledFor > now) continue; // not yet due

    await Task.create({
      brandId: brand._id,
      projectId: t.projectId ?? undefined,
      title: t.title,
      description: t.description ?? undefined,
      kind: t.kind,
      priority: t.priority,
      status: "todo",
      assignedToId: t.defaultAssigneeId ?? undefined,
      dueAt: scheduledFor,
      recurringTemplateId: t._id,
    });

    await RecurringTaskTemplate.updateOne(
      { _id: t._id },
      { $set: { lastRunAt: scheduledFor } }
    );

    created.push({
      template: t.title,
      brand: brand.name,
      scheduledFor: scheduledFor.toISOString(),
    });
  }

  // Monday piggyback: send the founder weekly digest. Hobby plan can only
  // run daily crons, so we detect the day here rather than adding a second
  // cron entry to vercel.json.
  let digest: Awaited<ReturnType<typeof sendFounderDigest>> | { skipped: string } = {
    skipped: "not monday",
  };
  if (now.getUTCDay() === 1) {
    try {
      digest = await sendFounderDigest();
    } catch (err) {
      digest = { skipped: err instanceof Error ? err.message : "digest failed" };
    }
  }

  return NextResponse.json({ ok: true, created, digest });
}

/**
 * Given a template and the brand's IANA timezone, compute the most recent
 * scheduled datetime (in UTC) that this template should have fired at,
 * on-or-before `now`. Returns null if the template shouldn't fire today/this
 * week/this month.
 */
function computeScheduledFor(
  t: {
    frequency: string;
    schedule: { daysOfWeek?: number[]; dayOfMonth?: number; time: string };
  },
  timezone: string,
  now: Date
): Date | null {
  const [hh, mm] = t.schedule.time.split(":").map((n) => Number(n));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  // Get the current local date parts in the brand's timezone.
  const local = getLocalParts(now, timezone);

  if (t.frequency === "weekly") {
    const days = t.schedule.daysOfWeek ?? [];
    if (!days.includes(local.dow)) return null;
  } else if (t.frequency === "monthly") {
    if (t.schedule.dayOfMonth && t.schedule.dayOfMonth !== local.day) return null;
  }
  // daily always matches.

  // Build the intended UTC instant for today's local hh:mm.
  const scheduledUtc = zonedDateToUtc(
    { year: local.year, month: local.month, day: local.day, hour: hh, minute: mm },
    timezone
  );
  return scheduledUtc;
}

function getLocalParts(d: Date, timezone: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    dow: weekdayMap[get("weekday")] ?? 0,
  };
}

// Convert a wall-clock time in a given timezone to a UTC Date.
// Uses the offset trick: interpret the naive UTC, then subtract the tz offset.
function zonedDateToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timezone: string
): Date {
  const naive = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const offset = getTimezoneOffsetMs(new Date(naive), timezone);
  return new Date(naive - offset);
}

function getTimezoneOffsetMs(d: Date, timezone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - d.getTime();
}
