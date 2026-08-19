import type { TaskKind, TaskPriority } from "@/models/types";

export type ParsedTask = {
  cleanTitle: string;
  assigneeToken: string | null;
  projectSlug: string | null;
  priority: TaskPriority | null;
  kind: TaskKind | null;
  dueAt: Date | null;
};

const PRIORITY_ALIASES: Record<string, TaskPriority> = {
  urgent: "urgent",
  "!!": "urgent",
  "!!!": "urgent",
  high: "high",
  "!": "high",
  normal: "normal",
  low: "low",
};

const KIND_ALIASES: Record<string, TaskKind> = {
  dev: "dev",
  design: "design",
  ops: "ops",
  sales: "sales",
  admin: "admin",
  chore: "chore",
};

/**
 * Parse a natural-language task title. Extracts:
 *   @assignee-name-or-email-prefix
 *   #project-slug
 *   !urgent  !!  !!!  (priority)
 *   :dev :design :ops :sales :admin :chore  (kind)
 *   "by today" | "by tomorrow" | "by +3d" | "by next mon" | "by 15 apr"
 *
 * Anything matched is stripped from `cleanTitle`. Nothing is required — a
 * plain title still parses to itself with nulls.
 */
export function parseTaskTitle(raw: string, referenceNow = new Date()): ParsedTask {
  let s = " " + raw.trim() + " ";

  let assignee: string | null = null;
  let projectSlug: string | null = null;
  let priority: TaskPriority | null = null;
  let kind: TaskKind | null = null;
  let dueAt: Date | null = null;

  // @assignee — first only
  const aMatch = s.match(/\s@([a-zA-Z][\w.-]{1,60})\b/);
  if (aMatch) {
    assignee = aMatch[1].toLowerCase();
    s = s.replace(aMatch[0], " ");
  }

  // #project-slug
  const pMatch = s.match(/\s#([a-z0-9][a-z0-9-]{0,60})\b/i);
  if (pMatch) {
    projectSlug = pMatch[1].toLowerCase();
    s = s.replace(pMatch[0], " ");
  }

  // :kind
  const kMatch = s.match(/\s:(dev|design|ops|sales|admin|chore)\b/i);
  if (kMatch) {
    kind = KIND_ALIASES[kMatch[1].toLowerCase()];
    s = s.replace(kMatch[0], " ");
  }

  // priority — words first
  const wordPriorityMatch = s.match(/\s!(urgent|high|normal|low)\b/i);
  if (wordPriorityMatch) {
    priority = PRIORITY_ALIASES[wordPriorityMatch[1].toLowerCase()];
    s = s.replace(wordPriorityMatch[0], " ");
  } else {
    // trailing "!!!" or "!!" → urgent, single "!" → high
    const bangMatch = s.match(/\s(!{1,3})(?=\s|$)/);
    if (bangMatch) {
      const p = PRIORITY_ALIASES[bangMatch[1]];
      if (p) priority = p;
      s = s.replace(bangMatch[0], " ");
    }
  }

  // "by <date>" phrase — parse then strip
  const dueMatch = s.match(
    /\bby\s+(today|tonight|tomorrow|next\s+\w+|\+\d+d|\d{1,2}\s+[a-z]{3,9}(?:\s+\d{2,4})?|\d{4}-\d{2}-\d{2})\b/i
  );
  if (dueMatch) {
    dueAt = parseDateExpression(dueMatch[1], referenceNow);
    if (dueAt) s = s.replace(dueMatch[0], " ");
  }

  return {
    cleanTitle: s.replace(/\s+/g, " ").trim(),
    assigneeToken: assignee,
    projectSlug,
    priority,
    kind,
    dueAt,
  };
}

/**
 * Turn a natural date phrase into a UTC Date at 17:00 local (a sensible
 * default end-of-day for a work task). Returns null if unparseable.
 */
export function parseDateExpression(
  expr: string,
  referenceNow = new Date()
): Date | null {
  const e = expr.trim().toLowerCase();
  const now = new Date(referenceNow);
  now.setSeconds(0, 0);
  now.setHours(17, 0);

  if (e === "today" || e === "tonight") return now;
  if (e === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  const plusMatch = e.match(/^\+(\d+)d$/);
  if (plusMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() + Number(plusMatch[1]));
    return d;
  }
  const nextMatch = e.match(/^next\s+(mon|tue|wed|thu|fri|sat|sun)/);
  if (nextMatch) {
    const targetDow = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(
      nextMatch[1]
    );
    if (targetDow >= 0) {
      const d = new Date(now);
      const currentDow = d.getDay();
      let delta = targetDow - currentDow;
      if (delta <= 0) delta += 7;
      d.setDate(d.getDate() + delta);
      return d;
    }
  }
  // ISO yyyy-mm-dd
  const isoMatch = e.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, day] = isoMatch;
    const d = new Date(Number(y), Number(m) - 1, Number(day), 17, 0, 0);
    return d;
  }
  // "15 apr" or "15 april 2026"
  const dmy = e.match(/^(\d{1,2})\s+([a-z]{3,9})(?:\s+(\d{2,4}))?$/);
  if (dmy) {
    const [, day, mon, year] = dmy;
    const monIdx = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(mon.slice(0, 3));
    if (monIdx >= 0) {
      let y = year ? Number(year) : now.getFullYear();
      if (y < 100) y += 2000;
      const d = new Date(y, monIdx, Number(day), 17, 0, 0);
      // if the resulting date is in the past and year wasn't specified, roll to next year
      if (!year && d < now) d.setFullYear(y + 1);
      return d;
    }
  }
  return null;
}
