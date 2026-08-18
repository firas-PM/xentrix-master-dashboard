export const ROLES = ["founder", "brand_admin", "manager", "worker"] as const;
export type Role = (typeof ROLES)[number];

export const BRAND_SECTORS = [
  "agency",
  "real_estate",
  "restaurant",
  "coffee_shop",
  "consultancy",
  "retail",
  "other",
] as const;
export type BrandSector = (typeof BRAND_SECTORS)[number];

export const PROJECT_STAGES = [
  "discovery",
  "design",
  "development",
  "staging",
  "live",
  "maintenance",
  "archived",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "in_review",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_KINDS = ["dev", "design", "ops", "sales", "admin", "chore"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export const RECURRENCE_FREQS = ["daily", "weekly", "monthly"] as const;
export type RecurrenceFreq = (typeof RECURRENCE_FREQS)[number];
