import { pageTaskKindLabel } from "@/lib/format";
import { ISSUE_KINDS } from "@/lib/work-type";

export const DASHBOARD_RANGES = [7, 14, 30] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export function parseRangeDays(value?: string | null): DashboardRange {
  const days = Number(value);
  if (days === 14 || days === 30) return days;
  return 7;
}

export type DashboardBar = {
  label: string;
  href?: string;
  done: number;
  open: number;
  late: number;
};

export type DashboardSlice = {
  label: string;
  value: number;
  color: string;
};

export type DashboardPoint = {
  label: string;
  done: number;
  created: number;
};

export type DashboardAttention = {
  href: string;
  taskKey: string;
  title: string;
  project: string;
  assignee: string;
  status: string;
  kind: string;
  dueLabel: string;
  flag: "overdue" | "due_today" | "open_issue" | "late";
};

export type DashboardActivity = {
  href: string;
  taskKey: string;
  title: string;
  project: string;
  assignee: string;
  status: string;
  kind: string;
  kindKey: string;
  createdLabel: string;
  flag: "open" | "late" | "done" | "overdue";
};

export type DashboardKpi = {
  key: string;
  label: string;
  value: string | number;
  hint: string;
  href: string;
  tone: "teal" | "purple" | "orange" | "red" | "pink" | "green";
  delta: number;
  spark: number[];
};

export type WorkDashboard = {
  rangeDays: DashboardRange;
  totals: {
    total: number;
    done: number;
    open: number;
    overdue: number;
    onTime: number;
    late: number;
    issuesOpen: number;
    issuesDone: number;
    onTimeRate: number;
  };
  kpis: DashboardKpi[];
  byUser: DashboardBar[];
  byProject: DashboardBar[];
  timing: DashboardSlice[];
  kinds: DashboardSlice[];
  issues: DashboardSlice[];
  trend: DashboardPoint[];
  attention: DashboardAttention[];
  activity: DashboardActivity[];
};

export type DashboardTask = {
  href: string;
  taskKey: string;
  title: string;
  status: string;
  kind: string;
  assigneeIds: string[];
  createdAt: Date;
  updatedAt: Date;
  dueAt: Date;
  projectId: string;
  projectName: string;
  projectCode: string;
};

function isDone(status: string) {
  return status === "done" || status === "wont_do";
}

function isIssueKind(kind: string) {
  return (ISSUE_KINDS as readonly string[]).includes(kind);
}

function dayKey(value: Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function shortDay(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(value);
}

function createdLabel(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function pctChange(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function inWindow(value: Date, start: Date, end: Date) {
  const time = value.getTime();
  return time >= start.getTime() && time < end.getTime();
}

function sparkLast7(values: number[]) {
  if (values.every((value) => value === 0)) return values;
  return values;
}

export function flagLabel(flag: DashboardAttention["flag"]) {
  if (flag === "overdue") return "Overdue";
  if (flag === "due_today") return "Due today";
  if (flag === "late") return "Finished late";
  return "Open issue";
}

export function buildWorkDashboard(
  tasks: DashboardTask[],
  userNames: Map<string, string>,
  options?: { rangeDays?: DashboardRange },
): WorkDashboard {
  const rangeDays = options?.rangeDays ?? 7;
  const now = Date.now();
  const today = startOfDay();
  const rangeStart = addDays(today, -(rangeDays - 1));
  const prevStart = addDays(rangeStart, -rangeDays);
  const nextStart = addDays(today, 1);

  let done = 0;
  let open = 0;
  let overdue = 0;
  let onTime = 0;
  let late = 0;
  let issuesOpen = 0;
  let issuesDone = 0;

  const users = new Map<string, DashboardBar>();
  const projects = new Map<string, DashboardBar>();
  const kinds = new Map<string, number>();

  function bump(map: Map<string, DashboardBar>, label: string, field: "done" | "open" | "late", href?: string) {
    const current = map.get(label) ?? { label, href, done: 0, open: 0, late: 0 };
    current[field] += 1;
    if (href) current.href = href;
    map.set(label, current);
  }

  for (const task of tasks) {
    const finished = isDone(task.status);
    const issue = isIssueKind(task.kind);
    kinds.set(task.kind, (kinds.get(task.kind) ?? 0) + 1);

    if (finished) {
      done += 1;
      if (issue) issuesDone += 1;
      if (task.updatedAt.getTime() <= task.dueAt.getTime()) onTime += 1;
      else late += 1;
    } else {
      open += 1;
      if (issue) issuesOpen += 1;
      if (task.dueAt.getTime() < now) overdue += 1;
    }

    const names = task.assigneeIds.length
      ? task.assigneeIds.map((id) => userNames.get(id) ?? "Unknown")
      : ["Unassigned"];
    for (const name of names) {
      if (finished) {
        bump(users, name, "done");
        if (task.updatedAt.getTime() > task.dueAt.getTime()) bump(users, name, "late");
      } else {
        bump(users, name, "open");
      }
    }

    const project = task.projectCode ? `${task.projectCode} · ${task.projectName}` : task.projectName;
    const projectHref = `/projects/${task.projectId}`;
    if (finished) {
      bump(projects, project, "done", projectHref);
      if (task.updatedAt.getTime() > task.dueAt.getTime()) bump(projects, project, "late", projectHref);
    } else {
      bump(projects, project, "open", projectHref);
    }
  }

  const trendDays = Math.max(rangeDays, 14);
  const trend: DashboardPoint[] = [];
  const createdSpark: number[] = [];
  const issueSpark: number[] = [];
  const doneSpark: number[] = [];
  const lateSpark: number[] = [];
  const overdueSpark: number[] = [];
  const onTimeSpark: number[] = [];

  for (let i = trendDays - 1; i >= 0; i -= 1) {
    const day = addDays(today, -i);
    const key = dayKey(day);
    const created = tasks.filter((task) => dayKey(task.createdAt) === key).length;
    const finished = tasks.filter((task) => isDone(task.status) && dayKey(task.updatedAt) === key);
    const lateDay = finished.filter((task) => task.updatedAt.getTime() > task.dueAt.getTime()).length;
    const onTimeDay = finished.length - lateDay;
    trend.push({
      label: shortDay(day),
      done: finished.length,
      created,
    });
    if (i < 7) {
      createdSpark.push(created);
      issueSpark.push(tasks.filter((task) => isIssueKind(task.kind) && dayKey(task.createdAt) === key).length);
      doneSpark.push(finished.length);
      lateSpark.push(lateDay);
      overdueSpark.push(tasks.filter((task) => !isDone(task.status) && dayKey(task.dueAt) === key && task.dueAt.getTime() < now).length);
      onTimeSpark.push(finished.length ? Math.round((onTimeDay / finished.length) * 100) : 0);
    }
  }

  function countCreated(start: Date, end: Date, predicate: (task: DashboardTask) => boolean) {
    return tasks.filter((task) => predicate(task) && inWindow(task.createdAt, start, end)).length;
  }

  function countDone(start: Date, end: Date, predicate: (task: DashboardTask) => boolean) {
    return tasks.filter((task) => isDone(task.status) && predicate(task) && inWindow(task.updatedAt, start, end)).length;
  }

  const createdNow = countCreated(rangeStart, nextStart, () => true);
  const createdPrev = countCreated(prevStart, rangeStart, () => true);
  const issuesNow = countCreated(rangeStart, nextStart, (task) => isIssueKind(task.kind));
  const issuesPrev = countCreated(prevStart, rangeStart, (task) => isIssueKind(task.kind));
  const doneNow = countDone(rangeStart, nextStart, () => true);
  const donePrev = countDone(prevStart, rangeStart, () => true);
  const lateNow = countDone(rangeStart, nextStart, (task) => task.updatedAt.getTime() > task.dueAt.getTime());
  const latePrev = countDone(prevStart, rangeStart, (task) => task.updatedAt.getTime() > task.dueAt.getTime());
  const onTimeNow = countDone(rangeStart, nextStart, (task) => task.updatedAt.getTime() <= task.dueAt.getTime());
  const onTimePrev = countDone(prevStart, rangeStart, (task) => task.updatedAt.getTime() <= task.dueAt.getTime());
  const rateNow = doneNow ? Math.round((onTimeNow / doneNow) * 100) : 0;
  const ratePrev = donePrev ? Math.round((onTimePrev / donePrev) * 100) : 0;
  const overdueNow = tasks.filter((task) => !isDone(task.status) && inWindow(task.dueAt, rangeStart, nextStart) && task.dueAt.getTime() < now).length;
  const overduePrev = tasks.filter((task) => !isDone(task.status) && inWindow(task.dueAt, prevStart, rangeStart)).length;

  const kindColor: Record<string, string> = {
    task: "#2563EB",
    refine: "#0284C7",
    redesign: "#7C3AED",
    issue: "#D97706",
    fix_bug: "#DC2626",
    fix_ui: "#EA580C",
  };

  const total = tasks.length;
  const vs = `vs last ${rangeDays} days`;
  const kpis: DashboardKpi[] = [
    {
      key: "total",
      label: "Total Tasks",
      value: total,
      hint: vs,
      href: "/projects",
      tone: "teal",
      delta: pctChange(createdNow, createdPrev),
      spark: sparkLast7(createdSpark),
    },
    {
      key: "issues",
      label: "Open Issues",
      value: issuesOpen,
      hint: vs,
      href: "/issues",
      tone: "purple",
      delta: pctChange(issuesNow, issuesPrev),
      spark: sparkLast7(issueSpark),
    },
    {
      key: "ontime",
      label: "On Time Delivery",
      value: `${done ? Math.round((onTime / done) * 100) : 0}%`,
      hint: vs,
      href: "/?view=ontime",
      tone: "orange",
      delta: pctChange(rateNow, ratePrev),
      spark: sparkLast7(onTimeSpark),
    },
    {
      key: "late",
      label: "Late",
      value: late,
      hint: vs,
      href: "/?view=late",
      tone: "red",
      delta: pctChange(lateNow, latePrev),
      spark: sparkLast7(lateSpark),
    },
    {
      key: "overdue",
      label: "Overdue",
      value: overdue,
      hint: vs,
      href: "/?view=overdue",
      tone: "pink",
      delta: pctChange(overdueNow, overduePrev),
      spark: sparkLast7(overdueSpark),
    },
    {
      key: "done",
      label: "Done",
      value: done,
      hint: vs,
      href: "/projects?tab=today",
      tone: "green",
      delta: pctChange(doneNow, donePrev),
      spark: sparkLast7(doneSpark),
    },
  ];

  return {
    rangeDays,
    totals: {
      total,
      done,
      open,
      overdue,
      onTime,
      late,
      issuesOpen,
      issuesDone,
      onTimeRate: done ? Math.round((onTime / done) * 100) : 0,
    },
    kpis,
    byUser: Array.from(users.values())
      .sort((a, b) => b.done + b.open - (a.done + a.open))
      .slice(0, 8),
    byProject: Array.from(projects.values())
      .sort((a, b) => b.done + b.open - (a.done + a.open))
      .slice(0, 8),
    timing: [
      { label: "On time", value: onTime, color: "#16A34A" },
      { label: "Late", value: late, color: "#F97316" },
      { label: "Overdue open", value: overdue, color: "#DC2626" },
      { label: "On track", value: Math.max(open - overdue, 0), color: "#2563EB" },
    ].filter((item) => item.value > 0),
    kinds: Array.from(kinds.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kind, value]) => ({
        label: pageTaskKindLabel(kind),
        value,
        color: kindColor[kind] ?? "#64748B",
      })),
    issues: [
      { label: "Open issues", value: issuesOpen, color: "#DC2626" },
      { label: "Closed issues", value: issuesDone, color: "#16A34A" },
    ].filter((item) => item.value > 0),
    trend,
    attention: buildAttention(tasks, userNames),
    activity: buildActivity(tasks, userNames),
  };
}

function namesFor(task: DashboardTask, userNames: Map<string, string>) {
  return (
    task.assigneeIds
      .map((id) => userNames.get(id))
      .filter((name): name is string => Boolean(name))
      .join(", ") || "Unassigned"
  );
}

function projectLabel(task: DashboardTask) {
  return task.projectCode ? `${task.projectCode} · ${task.projectName}` : task.projectName;
}

function buildAttention(tasks: DashboardTask[], userNames: Map<string, string>): DashboardAttention[] {
  const today = startOfDay().getTime();
  const ranked: DashboardAttention[] = [];

  for (const task of tasks) {
    const finished = isDone(task.status);
    const dueDay = startOfDay(task.dueAt).getTime();
    const base = {
      href: task.href,
      taskKey: task.taskKey,
      title: task.title,
      project: projectLabel(task),
      assignee: namesFor(task, userNames),
      status: task.status,
      kind: pageTaskKindLabel(task.kind),
      dueLabel: shortDay(task.dueAt),
    };

    if (!finished && dueDay < today) ranked.push({ ...base, flag: "overdue" });
    else if (!finished && dueDay === today) ranked.push({ ...base, flag: "due_today" });
    else if (!finished && isIssueKind(task.kind)) ranked.push({ ...base, flag: "open_issue" });
    else if (finished && task.updatedAt.getTime() > task.dueAt.getTime() && dayKey(task.updatedAt) === dayKey(new Date())) {
      ranked.push({ ...base, flag: "late" });
    }
  }

  const order = { overdue: 0, due_today: 1, open_issue: 2, late: 3 };
  return ranked.sort((a, b) => order[a.flag] - order[b.flag]).slice(0, 12);
}

function buildActivity(tasks: DashboardTask[], userNames: Map<string, string>): DashboardActivity[] {
  const now = Date.now();
  return [...tasks]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8)
    .map((task) => {
      const finished = isDone(task.status);
      const overdue = !finished && task.dueAt.getTime() < now;
      const late = finished && task.updatedAt.getTime() > task.dueAt.getTime();
      return {
        href: task.href,
        taskKey: task.taskKey,
        title: task.title,
        project: projectLabel(task),
        assignee: namesFor(task, userNames),
        status: task.status,
        kind: pageTaskKindLabel(task.kind),
        kindKey: task.kind,
        createdLabel: createdLabel(task.createdAt),
        flag: overdue ? "overdue" : late ? "late" : finished ? "done" : "open",
      };
    });
}
