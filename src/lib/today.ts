import { isOpenWorkStatus } from "@/lib/work-type";

export function startOfDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : new Date(value.getTime());
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function taskDueAt(createdAt: Date | string, resolutionAt?: Date | string | null) {
  if (resolutionAt) return typeof resolutionAt === "string" ? new Date(resolutionAt) : resolutionAt;
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
}

export type TodayReason = "overdue" | "due_today" | "created_today" | "in_progress" | "done_today";

const WORKING = new Set(["in_progress", "waiting_customer", "escalated", "ready_for_testing"]);

export function todayReason(task: {
  status: string;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  resolutionAt?: Date | string | null;
}): TodayReason | null {
  const today = startOfDay(new Date());
  const created = startOfDay(task.createdAt);
  const updated = task.updatedAt ? startOfDay(task.updatedAt) : null;
  const due = startOfDay(taskDueAt(task.createdAt, task.resolutionAt));
  const open = isOpenWorkStatus(task.status);

  if (!open && updated === today) return "done_today";
  if (!open) return null;
  if (due < today) return "overdue";
  if (due === today) return "due_today";
  if (created === today) return "created_today";
  if (WORKING.has(task.status)) return "in_progress";
  return null;
}

export function isTodayTask(task: {
  status: string;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  resolutionAt?: Date | string | null;
}) {
  return Boolean(todayReason(task));
}

const OPEN_RESULTS = new Set(["pending", "in_progress"]);

export function testingTodayReason(item: {
  result: string;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  dueDate?: Date | string | null;
}): TodayReason | null {
  const today = startOfDay(new Date());
  const created = startOfDay(item.createdAt);
  const updated = item.updatedAt ? startOfDay(item.updatedAt) : null;
  const open = OPEN_RESULTS.has(item.result);

  if (!open && updated === today) return "done_today";
  if (!open) return null;
  if (item.dueDate) {
    const due = startOfDay(item.dueDate);
    if (due < today) return "overdue";
    if (due === today) return "due_today";
  }
  if (created === today) return "created_today";
  if (item.result === "in_progress") return "in_progress";
  return null;
}

export function isTodayTesting(item: {
  result: string;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  dueDate?: Date | string | null;
}) {
  return Boolean(testingTodayReason(item));
}

export function todayReasonLabel(reason: TodayReason) {
  const map: Record<TodayReason, string> = {
    overdue: "Overdue",
    due_today: "Due today",
    created_today: "Created today",
    in_progress: "In progress",
    done_today: "Done today",
  };
  return map[reason];
}

const URL_RE = /https?:\/\/[^\s)]+/gi;

function firstName(name?: string | null) {
  const part = (name || "").trim().split(/\s+/)[0];
  return part || "Team";
}

function splitDetails(value?: string | null) {
  const lines = (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const urls: string[] = [];
  const bullets: string[] = [];
  const paragraphs: string[] = [];
  for (const line of lines) {
    const found = line.match(URL_RE) ?? [];
    urls.push(...found);
    const cleaned = line.replace(URL_RE, "").replace(/^[-–—*•]\s*/, "").trim();
    if (!cleaned) continue;
    if (line.startsWith("-") || line.startsWith("—") || line.startsWith("*") || line.startsWith("•") || cleaned.length < 90) {
      bullets.push(cleaned);
    } else {
      paragraphs.push(cleaned);
    }
  }
  return { urls: Array.from(new Set(urls)), bullets, paragraphs };
}

export function draftTodayDoneReport(
  tasks: {
    taskKey: string;
    title: string;
    details?: string | null;
    notes?: string[];
    pageName: string;
    projectName?: string;
    projectCode?: string;
    assigneeNames: string[];
    reason: TodayReason;
  }[],
  options?: string | { projectName?: string; greetingName?: string },
) {
  const projectName = typeof options === "string" ? options : options?.projectName;
  const greeting = firstName(typeof options === "string" ? undefined : options?.greetingName);
  const done = tasks.filter((task) => task.reason === "done_today");
  const open = tasks.filter((task) => task.reason !== "done_today");
  const lines = [`Hi ${greeting},`, "", "I hope you are doing well.", "", "Today's progress report:"];

  if (!done.length) {
    lines.push("No work items were marked done today.");
  } else {
    done.forEach((task, index) => {
      const place = task.projectName || projectName || task.pageName;
      lines.push(`#${index + 1}. ${task.title}${place ? ` (${place})` : ""}`);
      const split = splitDetails(task.details);
      const noteBits = (task.notes ?? []).flatMap((note) => splitDetails(note).bullets.length ? splitDetails(note).bullets : [note]);
      if (split.paragraphs.length) {
        lines.push(...split.paragraphs);
      } else if (!split.bullets.length && !noteBits.length) {
        const who = task.assigneeNames.length ? ` by ${task.assigneeNames.join(", ")}` : "";
        lines.push(`Completed ${task.taskKey}${who}.`);
      }
      for (const bullet of [...split.bullets, ...noteBits]) {
        lines.push(`— ${bullet}`);
      }
      for (const url of split.urls) lines.push(url);
      lines.push("");
    });
  }

  if (open.length) {
    const next = open[0];
    lines.push(`I am now starting work on ${next.title}.`);
  } else {
    lines.push("All of today's work is complete.");
  }
  lines.push("", "Thank you.");
  return lines.join("\n");
}
