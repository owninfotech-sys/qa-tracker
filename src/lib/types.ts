export const ROLES = ["ADMIN", "TESTER", "FIXER"] as const;

export type Role = (typeof ROLES)[number] | string;

export function isSystemRole(value: string): value is (typeof ROLES)[number] {
  return (ROLES as readonly string[]).includes(value);
}

export function isRole(value: string): value is Role {
  return isSystemRole(value) || isCustomRole(value);
}

export function isCustomRole(value: string) {
  const name = value.trim();
  if (name.length < 2 || name.length > 40) return false;
  if (isSystemRole(name.toUpperCase()) || name.toUpperCase() === "OTHER") return false;
  return /^[\p{L}\d][\p{L}\d ./-]*$/u.test(name);
}

export function parseStaffRole(roleValue: string, customValue = "") {
  const selected = roleValue.trim();
  if (isSystemRole(selected)) return selected;
  const custom = (selected === "OTHER" ? customValue : selected).trim();
  return isCustomRole(custom) ? custom : null;
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type TestResult =
  | "pending"
  | "in_progress"
  | "pass"
  | "fail"
  | "blocked"
  | "skipped";

export type FixStatus =
  | "open"
  | "in_progress"
  | "fixed"
  | "retest"
  | "closed"
  | "wont_fix";

export const PAGE_TASK_KINDS = ["issue", "refine", "redesign", "fix_bug", "fix_ui"] as const;
export type PageTaskKind = (typeof PAGE_TASK_KINDS)[number];

export const PAGE_TASK_STATUSES = [
  "open",
  "waiting_customer",
  "in_progress",
  "escalated",
  "pending",
  "ready_for_testing",
  "done",
  "wont_do",
] as const;
export type PageTaskStatus = (typeof PAGE_TASK_STATUSES)[number];

export function isPageTaskKind(value: string): value is PageTaskKind {
  return (PAGE_TASK_KINDS as readonly string[]).includes(value);
}

export function isPageTaskStatus(value: string): value is PageTaskStatus {
  return (PAGE_TASK_STATUSES as readonly string[]).includes(value);
}
