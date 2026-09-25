import { PAGE_TASK_KINDS, TASK_STATUSES, type PageTaskKind } from "@/lib/types";

export const WORK_TYPES = ["tasks", "issues"] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const TASK_KINDS: PageTaskKind[] = ["task", "refine", "redesign"];
export const ISSUE_KINDS: PageTaskKind[] = ["issue", "fix_bug", "fix_ui"];

export function parseWorkType(value: string | null | undefined): WorkType {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "issues" || raw === "issue") return "issues";
  return "tasks";
}

export function clipText(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function workTypeLabel(type: string) {
  return parseWorkType(type) === "issues" ? "Issues" : "Task management";
}

export function workTypeShortLabel(type: string) {
  return parseWorkType(type) === "issues" ? "Issues" : "Tasks";
}

export function workTypeHint(type: string) {
  return parseWorkType(type) === "issues"
    ? "Bugs, UI problems, and support requests"
    : "Create work, assign people, and track status";
}

export function kindsForWorkType(type: string | null | undefined): PageTaskKind[] {
  return parseWorkType(type) === "issues" ? ISSUE_KINDS : TASK_KINDS;
}

export function defaultKindForWorkType(type: string | null | undefined): PageTaskKind {
  return parseWorkType(type) === "issues" ? "issue" : "task";
}

export function kindsForFilter(type: string | null | undefined, present: string[] = []): PageTaskKind[] {
  const preferred = kindsForWorkType(type);
  const extra = present.filter(
    (kind): kind is PageTaskKind =>
      (PAGE_TASK_KINDS as readonly string[]).includes(kind) && !preferred.includes(kind as PageTaskKind),
  );
  return extra.length ? [...preferred, ...extra] : preferred;
}

export function isOpenWorkStatus(status: string) {
  return status !== "done" && status !== "wont_do";
}

export function statusesForFilter(_present: string[] = []) {
  return [...TASK_STATUSES];
}
