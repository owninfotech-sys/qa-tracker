import type { FixStatus, Role, TestResult } from "@/lib/types";

export function roleLabel(role: Role | string) {
  const map: Record<string, string> = {
    ADMIN: "Admin",
    TESTER: "Tester",
    FIXER: "Fixer",
    Developer: "Developer",
    Designer: "Designer",
    PL: "PL",
    Teacher: "Teacher",
    Tutor: "Tutor",
  };
  return map[role] ?? role;
}

export function resultLabel(result: TestResult | string) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_progress: "In progress",
    pass: "Pass",
    fail: "Fail",
    blocked: "Blocked",
    skipped: "Skipped",
  };
  return map[result] ?? result;
}

export function fixLabel(status: FixStatus | string) {
  const map: Record<string, string> = {
    open: "Open",
    in_progress: "In progress",
    fixed: "Fixed",
    retest: "Retest",
    closed: "Closed",
    wont_fix: "Won't fix",
  };
  return map[status] ?? status;
}

export function pageTaskKindLabel(kind: string) {
  const map: Record<string, string> = {
    task: "Task",
    issue: "IT help",
    refine: "Refine",
    redesign: "Redesign",
    fix_bug: "Fix bug",
    fix_ui: "Fix UI issue",
  };
  return map[kind] ?? kind;
}

export function pageTaskStatusLabel(status: string) {
  const map: Record<string, string> = {
    open: "To do",
    pending: "To do",
    in_progress: "In progress",
    waiting_customer: "Waiting",
    escalated: "Blocked",
    ready_for_testing: "In progress",
    done: "Done",
    wont_do: "Canceled",
  };
  return map[status] ?? status;
}

export function priorityLabel(priority: string) {
  const map: Record<string, string> = {
    P0: "P0 Critical",
    P1: "P1 High",
    P2: "P2 Medium",
    P3: "P3 Low",
  };
  return map[priority] ?? priority;
}

export function formatListDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatActivityTime(value?: Date | string | null) {
  return formatDateTime(value ?? new Date());
}

export function isOverdue(due?: Date | string | null, done?: boolean) {
  if (!due || done) return false;
  return new Date(due).getTime() < Date.now();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const date = new Date(`${raw}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toHref(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
  return `https://${raw}`;
}

export function hrefLabel(value?: string | null) {
  const href = toHref(value);
  if (!href) return "";
  try {
    const parsed = new URL(href);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.host}${path}`;
  } catch {
    return value?.trim() ?? "";
  }
}
