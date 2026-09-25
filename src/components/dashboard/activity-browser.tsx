"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { ActivityPager, PAGE_SIZES } from "@/components/dashboard/activity-pager";
import { JiraFilter, STATUS_FILTER_PILL } from "@/components/projects/jira-filter";
import { initials, pageTaskKindLabel, pageTaskStatusLabel } from "@/lib/format";
import type { DashboardActivity } from "@/lib/dashboard";
import { PAGE_TASK_KINDS, PAGE_TASK_STATUSES } from "@/lib/types";
import { ISSUE_KINDS } from "@/lib/work-type";

const KIND_PILL: Record<string, string> = {
  task: "bg-[#EFF6FF] text-[#1D4ED8]",
  issue: "bg-[#FFEDD5] text-[#C2410C]",
  refine: "bg-[#E0F2FE] text-[#0369A1]",
  redesign: "bg-[#F5F3FF] text-[#7C3AED]",
  fix_bug: "bg-[#FEF2F2] text-[#DC2626]",
  fix_ui: "bg-[#FEF3C7] text-[#D97706]",
};

const FLAG_PILL: Record<string, string> = {
  open: "bg-[#DBEAFE] text-[#1D4ED8]",
  late: "bg-[#FEE2E2] text-[#DC2626]",
  overdue: "bg-[#FFEDD5] text-[#C2410C]",
  done: "bg-[#DCFCE7] text-[#15803D]",
};

const FLAG_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "late", label: "Late" },
  { value: "overdue", label: "Overdue" },
  { value: "done", label: "Done" },
];

function csv(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSize(value: string | null) {
  const size = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(size) ? size : 10;
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function ActivityBrowser({ rows }: { rows: DashboardActivity[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const type = params.get("type") ?? "";
  const kinds = csv(params.get("kind"));
  const statuses = csv(params.get("status"));
  const flags = csv(params.get("flag"));
  const projects = csv(params.get("project"));
  const assignees = csv(params.get("assignee"));
  const pageSize = parseSize(params.get("size"));
  const page = parsePage(params.get("page"));

  const issuesPreset = type === "issues" && kinds.length === 0;
  const activeKinds = issuesPreset ? [...ISSUE_KINDS] : kinds;
  const activeFlags = issuesPreset && flags.length === 0 ? ["open", "late", "overdue"] : flags;

  const typeOptions = useMemo(() => {
    const present = new Set(rows.map((row) => row.kindKey));
    return PAGE_TASK_KINDS.filter((kind) => present.has(kind) || activeKinds.includes(kind)).map((value) => ({
      value,
      label: pageTaskKindLabel(value),
      pillClass: KIND_PILL[value],
    }));
  }, [activeKinds, rows]);

  const statusOptions = useMemo(() => {
    const present = new Set(rows.map((row) => row.status));
    return PAGE_TASK_STATUSES.filter((status) => present.has(status) || statuses.includes(status)).map((value) => ({
      value,
      label: pageTaskStatusLabel(value),
      pillClass: STATUS_FILTER_PILL[value],
    }));
  }, [rows, statuses]);

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (row.projectId && !seen.has(row.projectId)) seen.set(row.projectId, row.project);
    }
    return [...seen.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [rows]);

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    let unassigned = false;
    for (const row of rows) {
      if (!row.assignee || row.assignee === "Unassigned") {
        unassigned = true;
        continue;
      }
      for (const name of row.assignee.split(", ")) {
        if (name) names.add(name);
      }
    }
    return [
      ...(unassigned || assignees.includes("unassigned") ? [{ value: "unassigned", label: "Unassigned" }] : []),
      ...[...names].sort().map((name) => ({
        value: name,
        label: name,
        leading: (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#EFF6FF] text-[9px] font-semibold text-[#2563EB]">
            {initials(name)}
          </span>
        ),
      })),
    ];
  }, [assignees, rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (activeKinds.length && !activeKinds.includes(row.kindKey)) return false;
      if (activeFlags.length && !activeFlags.includes(row.flag)) return false;
      if (statuses.length && !statuses.includes(row.status)) return false;
      if (projects.length && !projects.includes(row.projectId)) return false;
      if (assignees.length) {
        const names = row.assignee === "Unassigned" ? [] : row.assignee.split(", ").filter(Boolean);
        const unassignedPick = assignees.includes("unassigned") && names.length === 0;
        const named = names.some((name) => assignees.includes(name));
        if (!unassignedPick && !named) return false;
      }
      if (!needle) return true;
      return (
        row.title.toLowerCase().includes(needle) ||
        row.taskKey.toLowerCase().includes(needle) ||
        row.project.toLowerCase().includes(needle) ||
        row.assignee.toLowerCase().includes(needle) ||
        row.kind.toLowerCase().includes(needle)
      );
    });
  }, [activeFlags, activeKinds, assignees, projects, query, rows, statuses]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  function setParams(patch: Record<string, string | string[] | null>, resetPage = true) {
    const next = new URLSearchParams(paramsRef.current.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || (Array.isArray(value) && value.length === 0) || value === "") {
        next.delete(key);
      } else if (Array.isArray(value)) {
        next.set(key, value.join(","));
      } else {
        next.set(key, value);
      }
    }
    if (resetPage) next.delete("page");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === (paramsRef.current.get("q") ?? "")) return;
      setParams({ q: query });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const hasFilters =
    query.trim() !== "" ||
    kinds.length > 0 ||
    statuses.length > 0 ||
    flags.length > 0 ||
    projects.length > 0 ||
    assignees.length > 0 ||
    issuesPreset;

  const title = issuesPreset
    ? "Open issues"
    : flags.length === 1 && !kinds.length && !query
      ? flags[0] === "late"
        ? "Late work"
        : flags[0] === "overdue"
          ? "Overdue work"
          : flags[0] === "done"
            ? "Done work"
            : flags[0] === "open"
              ? "Open work"
              : "All activity"
      : "All activity";

  return (
    <>
      <div className="mt-4 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#172033]">{title}</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
          {filtered.length !== rows.length ? ` of ${rows.length}` : ""} · click a title to open it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-3">
        <label className="relative w-full max-w-[240px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, key, project"
            className="w-full rounded-full border border-[#E2E8F0] bg-white py-1.5 pl-9 pr-3 text-sm text-[#172033]"
          />
        </label>
        <JiraFilter
          label="Type"
          searchPlaceholder="Search type"
          selected={activeKinds}
          onChange={(next) =>
            setParams({
              kind: next,
              type: null,
              flag: issuesPreset ? [] : flags,
            })
          }
          options={typeOptions}
        />
        <JiraFilter
          label="Timing"
          searchPlaceholder="Search timing"
          selected={activeFlags}
          onChange={(next) =>
            setParams({
              flag: next,
              type: null,
              kind: issuesPreset ? [...ISSUE_KINDS] : kinds,
            })
          }
          options={FLAG_OPTIONS.map((option) => ({
            ...option,
            pillClass: FLAG_PILL[option.value],
          }))}
        />
        <JiraFilter
          label="Status"
          searchPlaceholder="Search status"
          selected={statuses}
          onChange={(next) => setParams({ status: next })}
          options={statusOptions}
        />
        <JiraFilter
          label="Project"
          searchPlaceholder="Search project"
          selected={projects}
          onChange={(next) => setParams({ project: next })}
          options={projectOptions}
        />
        <JiraFilter
          label="Assignee"
          searchPlaceholder="Search assignee"
          selected={assignees}
          onChange={(next) => setParams({ assignee: next })}
          options={assigneeOptions}
        />
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.replace(pathname, { scroll: false });
            }}
            className="text-sm font-medium text-[#2563EB] hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>

      <section className="rounded-[3px] border border-[#E2E8F0] bg-white">
        <ActivityTable
          rows={visible}
          startIndex={start}
          emptyText={hasFilters ? "No matching work yet." : "No recent work yet."}
        />
        <ActivityPager
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          total={filtered.length}
          from={filtered.length ? start + 1 : 0}
          to={Math.min(start + pageSize, filtered.length)}
          onPage={(nextPage) => setParams({ page: String(nextPage) }, false)}
          onPageSize={(size) => setParams({ size: String(size), page: "1" }, false)}
        />
      </section>
    </>
  );
}
