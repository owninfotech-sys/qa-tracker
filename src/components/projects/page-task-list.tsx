"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Box,
  Bug,
  Clock3,
  Download,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Square,
  UserRound,
} from "lucide-react";
import { PageTaskBoard } from "@/components/projects/page-task-board";
import { StatusTransitionMenu } from "@/components/projects/status-transition-menu";
import { JiraFilter, MoreFiltersMenu, STATUS_FILTER_PILL } from "@/components/projects/jira-filter";
import { formatListDate, initials, pageTaskKindLabel, pageTaskStatusLabel, priorityLabel } from "@/lib/format";
import { PAGE_TASK_KINDS, PAGE_TASK_STATUSES } from "@/lib/types";
import type { ListTask } from "@/lib/work-item";

export type { ListTask };

const kindIcon: Record<string, typeof Square> = {
  issue: Square,
  refine: BookOpen,
  redesign: Box,
  fix_bug: Bug,
  fix_ui: LayoutGrid,
};

const kindTone: Record<string, string> = {
  issue: "bg-[#1d7f4e] text-white",
  refine: "bg-[#0c66e4] text-white",
  redesign: "bg-[#6e5dc6] text-white",
  fix_bug: "bg-[#c9372c] text-white",
  fix_ui: "bg-[#e56910] text-white",
};

const kindPill: Record<string, string> = {
  issue: "bg-[#e3fcef] text-[#006644]",
  refine: "bg-[#deebff] text-[#0747a6]",
  redesign: "bg-[#f3e8fd] text-[#5e4db2]",
  fix_bug: "bg-[#ffeceb] text-[#ae2e24]",
  fix_ui: "bg-[#fff0b3] text-[#7f5f01]",
};

function resolutionDate(createdAt: string) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 3);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function viewHref(basePath: string, queue: string | undefined, view: "list" | "board") {
  const params = new URLSearchParams();
  if (queue) params.set("queue", queue);
  if (view === "board") params.set("view", "board");
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function PageTaskList({
  tasks,
  boardTasks,
  canEdit,
  currentUserId,
  role,
  view,
  basePath,
  queue,
}: {
  tasks: ListTask[];
  boardTasks: ListTask[];
  canEdit: boolean;
  currentUserId: string;
  role: string;
  view: "list" | "board";
  basePath: string;
  queue?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [reporters, setReporters] = useState<string[]>([]);
  const [extra, setExtra] = useState({ priority: false, page: false, reporter: false });
  const [selected, setSelected] = useState<string[]>([]);

  const source = view === "board" ? boardTasks : tasks;

  const assigneeNames = useMemo(
    () => Array.from(new Set(source.flatMap((task) => task.assigneeNames))).sort(),
    [source],
  );
  const pageNames = useMemo(
    () => Array.from(new Set(source.map((task) => task.pageName))).sort(),
    [source],
  );
  const reporterNames = useMemo(
    () => Array.from(new Set(source.map((task) => task.reporterName))).sort(),
    [source],
  );

  const rows = useMemo(() => {
    return source
      .filter((task) => {
        if (kinds.length && !kinds.includes(task.kind)) return false;
        if (statuses.length && !statuses.includes(task.status)) return false;
        if (priorities.length && !priorities.includes(task.priority)) return false;
        if (pages.length && !pages.includes(task.pageName)) return false;
        if (reporters.length && !reporters.includes(task.reporterName)) return false;
        if (assignees.length) {
          const unassigned = assignees.includes("unassigned") && task.assigneeNames.length === 0;
          const named = task.assigneeNames.some((name) => assignees.includes(name));
          if (!unassigned && !named) return false;
        }
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return (
          task.title.toLowerCase().includes(needle) ||
          task.taskKey.toLowerCase().includes(needle) ||
          task.pageName.toLowerCase().includes(needle) ||
          task.assigneeNames.some((name) => name.toLowerCase().includes(needle))
        );
      })
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
  }, [assignees, kinds, pages, priorities, query, reporters, source, statuses]);

  const allSelected = rows.length > 0 && rows.every((task) => selected.includes(task.id));

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 border-b-2 px-2 py-2.5 text-sm ${
      active ? "border-[#0c66e4] font-semibold text-[#0c66e4]" : "border-transparent text-[#44546f] hover:bg-[#f1f2f4]"
    }`;

  const filters = (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <label className="relative w-[220px]">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#626f86]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search work"
          className="w-full rounded-full border border-[#dcdfe4] bg-white py-1.5 pl-9 pr-3 text-sm text-[#172b4d] shadow-none"
        />
      </label>
      <JiraFilter
        label="Request type"
        searchPlaceholder="Search Request type"
        selected={kinds}
        onChange={setKinds}
        options={PAGE_TASK_KINDS.map((value) => ({
          value,
          label: pageTaskKindLabel(value),
          pillClass: kindPill[value],
        }))}
      />
      <JiraFilter
        label="Status"
        searchPlaceholder="Search Status"
        selected={statuses}
        onChange={setStatuses}
        options={PAGE_TASK_STATUSES.map((value) => ({
          value,
          label: pageTaskStatusLabel(value),
          pillClass: STATUS_FILTER_PILL[value],
        }))}
      />
      <JiraFilter
        label="Assignee"
        searchPlaceholder="Search Assignee"
        selected={assignees}
        onChange={setAssignees}
        options={[
          { value: "unassigned", label: "Unassigned" },
          ...assigneeNames.map((name) => ({
            value: name,
            label: name,
            leading: (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[9px] font-semibold text-[#44546f]">
                {initials(name)}
              </span>
            ),
          })),
        ]}
      />
      {extra.priority ? (
        <JiraFilter
          label="Priority"
          searchPlaceholder="Search Priority"
          selected={priorities}
          onChange={setPriorities}
          options={["P0", "P1", "P2", "P3"].map((value) => ({
            value,
            label: priorityLabel(value),
          }))}
        />
      ) : null}
      {extra.page ? (
        <JiraFilter
          label="Page"
          searchPlaceholder="Search Page"
          selected={pages}
          onChange={setPages}
          options={pageNames.map((name) => ({ value: name, label: name }))}
        />
      ) : null}
      {extra.reporter ? (
        <JiraFilter
          label="Reporter"
          searchPlaceholder="Search Reporter"
          selected={reporters}
          onChange={setReporters}
          options={reporterNames.map((name) => ({
            value: name,
            label: name,
            leading: (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[9px] font-semibold text-[#44546f]">
                {initials(name)}
              </span>
            ),
          }))}
        />
      ) : null}
      <MoreFiltersMenu
        extras={[
          { id: "priority", label: "Priority", hidden: !extra.priority },
          { id: "page", label: "Page", hidden: !extra.page },
          { id: "reporter", label: "Reporter", hidden: !extra.reporter },
        ]}
        onAdd={(id) => setExtra((current) => ({ ...current, [id]: true }))}
      />
      <div className="ml-auto flex items-center gap-1 text-[#44546f]">
        <button type="button" className="rounded-md p-1.5 hover:bg-[#f1f2f4]" aria-label="Export">
          <Download size={16} />
        </button>
        <button type="button" className="rounded-md p-1.5 hover:bg-[#f1f2f4]" aria-label="More">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[3px] border border-[#dcdfe4] bg-white">
      <div className="flex items-center gap-1 border-b border-[#dcdfe4] px-3">
        <Link href={viewHref(basePath, queue, "list")} className={tabClass(view === "list")}>
          <List size={16} />
          List
        </Link>
        <Link href={viewHref(basePath, queue, "board")} className={tabClass(view === "board")}>
          <LayoutGrid size={16} />
          Board
        </Link>
      </div>

      {view === "board" ? (
        <PageTaskBoard
          tasks={rows}
          canEdit={canEdit}
          currentUserId={currentUserId}
          role={role}
          toolbar={filters}
        />
      ) : null}

      {view === "list" ? (
        <>
          {filters}
          <p className="px-4 pb-2 text-xs text-[#626f86]">{rows.length} work items</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-y border-[#dcdfe4] bg-white text-[12px] font-semibold text-[#626f86]">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : rows.map((task) => task.id))}
                    />
                  </th>
                  <th className="w-10 px-2 py-2">#</th>
                  <th className="w-10 px-2 py-2">T</th>
                  <th className="px-2 py-2">Key</th>
                  <th className="px-2 py-2">Summary</th>
                  <th className="px-2 py-2">Reporter</th>
                  <th className="px-2 py-2">Assignee</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Time to resolution</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-sm text-[#626f86]">
                      No work items match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((task, index) => {
                    const Icon = kindIcon[task.kind] ?? Square;
                    const checked = selected.includes(task.id);
                    return (
                      <tr
                        key={task.id}
                        onClick={() => router.push(task.href)}
                        className={`cursor-pointer border-b border-[#f1f2f4] ${
                          checked ? "bg-[#e9f2ff]" : index % 2 === 1 ? "bg-[#f7f8f9]" : "bg-white"
                        } hover:bg-[#f1f2f4]`}
                      >
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelected((current) =>
                                current.includes(task.id)
                                  ? current.filter((id) => id !== task.id)
                                  : [...current, task.id],
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-3 text-[12px] font-bold tabular-nums text-[#626f86]">{index + 1}</td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-[3px] ${kindTone[task.kind] ?? "bg-[#44546f] text-white"}`}
                            title={pageTaskKindLabel(task.kind)}
                          >
                            <Icon size={12} />
                          </span>
                        </td>
                        <td className="px-2 py-3 font-medium text-[#0c66e4]">{task.taskKey}</td>
                        <td className="px-2 py-3">
                          <p className="font-medium text-[#0c66e4] hover:underline">{task.title}</p>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[#172b4d]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[10px] font-semibold text-[#44546f]">
                              {task.reporterName.slice(0, 1).toUpperCase()}
                            </span>
                            {task.reporterName}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[#172b4d]">
                            {task.assigneeNames.length ? (
                              <>
                                <span className="inline-flex -space-x-1">
                                  {task.assigneeNames.slice(0, 3).map((name) => (
                                    <span
                                      key={name}
                                      title={name}
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[10px] font-semibold text-[#44546f] ring-2 ring-white"
                                    >
                                      {name.slice(0, 1).toUpperCase()}
                                    </span>
                                  ))}
                                </span>
                                {task.assigneeNames.join(", ")}
                              </>
                            ) : (
                              <>
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[#44546f]">
                                  <UserRound size={12} />
                                </span>
                                Unassigned
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-3" onClick={(event) => event.stopPropagation()}>
                          <StatusTransitionMenu
                            task={{
                              id: task.id,
                              projectId: task.projectId,
                              pageId: task.pageId,
                              status: task.status,
                            }}
                            canEdit={canEdit}
                          />
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-[#172b4d]">{formatListDate(task.createdAt)}</td>
                        <td className="whitespace-nowrap px-2 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[#172b4d]">
                            <Clock3 size={14} className="text-[#626f86]" />
                            {resolutionDate(task.createdAt)}
                            <span className="inline-flex h-3.5 w-3.5 items-end gap-px">
                              <span className="h-2 w-[3px] rounded-sm bg-[#22a06b]" />
                              <span className="h-3 w-[3px] rounded-sm bg-[#22a06b]" />
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
