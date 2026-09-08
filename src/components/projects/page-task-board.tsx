"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, Fragment, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  LayoutGrid,
  MessageSquare,
  Search,
  UserRound,
} from "lucide-react";
import { reorderPageTasksAction } from "@/app/actions/page-tasks";
import type { ListTask } from "@/lib/work-item";
import { formatDateTime, initials, pageTaskKindLabel, pageTaskStatusLabel } from "@/lib/format";
import { BOARD_COLUMNS, columnForStatus, neighborColumn, sortBoardTasks, statusForColumn } from "@/lib/board";
import { PAGE_TASK_KINDS } from "@/lib/types";

const statusTone: Record<string, string> = {
  open: "bg-[#dfe1e6] text-[#42526e]",
  waiting_customer: "bg-[#deebff] text-[#0747a6]",
  in_progress: "bg-[#deebff] text-[#0747a6]",
  escalated: "bg-[#ffebe6] text-[#bf2600]",
  pending: "bg-[#fff0b3] text-[#7f5f01]",
  ready_for_testing: "bg-[#fff0b3] text-[#7f5f01]",
  done: "bg-[#e3fcef] text-[#006644]",
  wont_do: "bg-[#e3fcef] text-[#006644]",
};

function dueLabel(task: ListTask) {
  const due = task.resolutionAt ?? new Date(new Date(task.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  return formatDateTime(due);
}

function dueSoon(task: ListTask) {
  const due = task.resolutionAt ? new Date(task.resolutionAt) : new Date(new Date(task.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000);
  const done = task.status === "done" || task.status === "wont_do";
  return !done && due.getTime() < Date.now();
}

function PriorityMark({ priority }: { priority: string }) {
  const color =
    priority === "P0" ? "text-[#c9372c]" : priority === "P1" || priority === "P2" ? "text-[#e56910]" : "text-[#22a06b]";
  return (
    <span className={`inline-flex h-3.5 items-end gap-px ${color}`} title={priority}>
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className={`w-[3px] rounded-sm ${index < (priority === "P3" ? 1 : priority === "P2" ? 2 : 3) ? "bg-current" : "bg-[#dcdfe4]"}`}
          style={{ height: 5 + index * 3 }}
        />
      ))}
    </span>
  );
}

function DropLine() {
  return <div className="pointer-events-none h-1 rounded-full bg-[#0c66e4]" />;
}

function nextCardId(node: Element) {
  let sibling = node.nextElementSibling;
  while (sibling) {
    const id = sibling.getAttribute("data-board-card");
    if (id) return id;
    sibling = sibling.nextElementSibling;
  }
  return null;
}

function groupValue(task: ListTask, group: string) {
  if (group === "assignee") return task.assigneeNames.join(", ") || "Unassigned";
  if (group === "priority") return task.priority;
  if (group === "page") return task.pageName;
  return "All work";
}

export function PageTaskBoard({
  tasks,
  canEdit,
  currentUserId,
  role,
  toolbar,
}: {
  tasks: ListTask[];
  canEdit: boolean;
  currentUserId: string;
  role: string;
  toolbar?: ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [page, setPage] = useState("all");
  const [group, setGroup] = useState("none");
  const [items, setItems] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<{ columnId: string; beforeId: string | null } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; width: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const origin = useRef({ x: 0, y: 0, dragging: false, id: "" });

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const assignees = useMemo(
    () => Array.from(new Set(items.flatMap((task) => task.assigneeNames))).sort(),
    [items],
  );
  const pages = useMemo(
    () => Array.from(new Set(items.map((task) => task.pageName))).sort(),
    [items],
  );

  const visible = useMemo(() => {
    if (toolbar) return items;
    const needle = query.trim().toLowerCase();
    return items.filter((task) => {
      if (kind !== "all" && task.kind !== kind) return false;
      if (page !== "all" && task.pageName !== page) return false;
      if (assignee === "unassigned" && task.assigneeNames.length) return false;
      if (assignee !== "all" && assignee !== "unassigned" && !task.assigneeNames.includes(assignee)) return false;
      if (!needle) return true;
      return (
        task.title.toLowerCase().includes(needle) ||
        task.taskKey.toLowerCase().includes(needle) ||
        task.pageName.toLowerCase().includes(needle)
      );
    });
  }, [assignee, items, kind, page, query, toolbar]);

  const lanes = useMemo(() => {
    if (group === "none") return [{ id: "all", title: "", tasks: visible }];
    const map = new Map<string, ListTask[]>();
    for (const task of visible) {
      const key = groupValue(task, group);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return Array.from(map.entries()).map(([title, laneTasks]) => ({ id: title, title, tasks: laneTasks }));
  }, [group, visible]);

  function canMove(_task: ListTask) {
    return canEdit;
  }

  function cardsInColumn(columnId: string, source: ListTask[] = items, excludeId?: string) {
    return sortBoardTasks(
      source.filter((item) => item.id !== excludeId && columnForStatus(item.status) === columnId),
    );
  }

  function placeTask(task: ListTask, columnId: string, beforeId: string | null) {
    const nextStatus = statusForColumn(columnId, task.status);
    const orderedIds = cardsInColumn(columnId, items, task.id).map((item) => item.id);
    let index = beforeId ? orderedIds.indexOf(beforeId) : orderedIds.length;
    if (index < 0) index = orderedIds.length;
    orderedIds.splice(index, 0, task.id);

    const currentIds = cardsInColumn(columnForStatus(task.status)).map((item) => item.id);
    if (nextStatus === task.status && currentIds.join(",") === orderedIds.join(",")) return;

    setItems((current) =>
      current.map((item) => {
        if (item.id === task.id) return { ...item, status: nextStatus, sortOrder: index };
        const pos = orderedIds.indexOf(item.id);
        if (pos >= 0) return { ...item, sortOrder: pos };
        return item;
      }),
    );

    const data = new FormData();
    data.set("id", task.id);
    data.set("projectId", task.projectId);
    data.set("pageId", task.pageId);
    data.set("status", nextStatus);
    data.set("orderedIds", orderedIds.join(","));
    startTransition(async () => {
      await reorderPageTasksAction(data);
      router.refresh();
    });
  }

  function moveRank(task: ListTask, direction: -1 | 1, columnCards?: ListTask[]) {
    const columnId = columnForStatus(task.status);
    const cards = columnCards ?? cardsInColumn(columnId);
    const index = cards.findIndex((item) => item.id === task.id);
    const swapWith = cards[index + direction];
    if (!swapWith) return;
    const beforeId = direction < 0 ? swapWith.id : (cards[index + 2]?.id ?? null);
    placeTask(task, columnId, beforeId);
  }

  function slotFromPoint(x: number, y: number, dragTaskId: string) {
    const column = document.elementFromPoint(x, y)?.closest("[data-board-column]")?.getAttribute("data-board-column");
    if (!column) return null;
    const cardNode = document.elementFromPoint(x, y)?.closest("[data-board-card]");
    const cardId = cardNode?.getAttribute("data-board-card");
    if (!cardNode || !cardId || cardId === dragTaskId) return { columnId: column, beforeId: null };
    const rect = cardNode.getBoundingClientRect();
    if (y < rect.top + rect.height / 2) return { columnId: column, beforeId: cardId };
    return { columnId: column, beforeId: nextCardId(cardNode) };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>, task: ListTask) {
    if (!canMove(task) || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button")) return;
    origin.current = { x: event.clientX, y: event.clientY, dragging: false, id: task.id };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>, task: ListTask) {
    if (origin.current.id !== task.id) return;
    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;
    if (!origin.current.dragging && Math.hypot(dx, dy) < 8) return;
    if (!origin.current.dragging) {
      origin.current.dragging = true;
      setDragId(task.id);
      setGhost({ x: event.clientX, y: event.clientY, width: event.currentTarget.offsetWidth });
    } else {
      setGhost({ x: event.clientX, y: event.clientY, width: event.currentTarget.offsetWidth });
    }
    setOverSlot(slotFromPoint(event.clientX, event.clientY, task.id));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>, task: ListTask) {
    if (origin.current.id !== task.id) return;
    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;
    const wasDragging = origin.current.dragging;
    const dropSlot = slotFromPoint(event.clientX, event.clientY, task.id);
    origin.current = { x: 0, y: 0, dragging: false, id: "" };
    setDragId(null);
    setGhost(null);
    setOverSlot(null);

    if (wasDragging && dropSlot) {
      placeTask(task, dropSlot.columnId, dropSlot.beforeId);
      return;
    }

    if (Math.abs(dy) > 56 && Math.abs(dx) < 48) {
      moveRank(task, dy > 0 ? 1 : -1);
      return;
    }

    if (Math.abs(dx) > 72 && Math.abs(dy) < 56) {
      const next = neighborColumn(columnForStatus(task.status), dx > 0 ? 1 : -1);
      if (!next) return;
      const first = cardsInColumn(next, items, task.id)[0];
      placeTask(task, next, first?.id ?? null);
    }
  }

  const dragged = items.find((item) => item.id === dragId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {toolbar ?? (
      <div className="flex flex-wrap items-center gap-2 px-1 py-3">
        <label className="relative w-[220px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#626f86]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search board"
            className="w-full rounded-full border border-[#dcdfe4] bg-white py-1.5 pl-9 pr-3 text-sm text-[#172b4d]"
          />
        </label>
        <label className="relative">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#dcdfe4] bg-white px-3 py-1.5 text-sm text-[#44546f]">
            {kind === "all" ? "Request type" : pageTaskKindLabel(kind)}
            <ChevronDown size={14} />
          </span>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="all">Request type</option>
            {PAGE_TASK_KINDS.map((value) => (
              <option key={value} value={value}>
                {pageTaskKindLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="relative">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#dcdfe4] bg-white px-3 py-1.5 text-sm text-[#44546f]">
            {assignee === "all" ? "Assignee" : assignee === "unassigned" ? "Unassigned" : assignee}
            <ChevronDown size={14} />
          </span>
          <select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="all">Assignee</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#dcdfe4] bg-white px-3 py-1.5 text-sm text-[#44546f]">
            {page === "all" ? "Page" : page}
            <ChevronDown size={14} />
          </span>
          <select value={page} onChange={(event) => setPage(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="all">All pages</option>
            {pages.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#dcdfe4] bg-white px-3 py-1.5 text-sm text-[#44546f]">
            Group: {group === "none" ? "None" : group}
            <ChevronDown size={14} />
          </span>
          <select value={group} onChange={(event) => setGroup(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="none">None</option>
            <option value="assignee">Assignee</option>
            <option value="priority">Priority</option>
            <option value="page">Page</option>
          </select>
        </label>
        <p className="ml-auto text-xs text-[#626f86]">
          {visible.length} work items · drag up/down to reorder, sideways to change status
        </p>
      </div>
      )}
      {toolbar ? (
        <div className="flex items-center justify-between gap-2 px-4 pb-2">
          <label className="relative">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#dcdfe4] bg-white px-3 py-1.5 text-sm text-[#44546f]">
              Group: {group === "none" ? "None" : group}
              <ChevronDown size={14} />
            </span>
            <select value={group} onChange={(event) => setGroup(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
              <option value="none">None</option>
              <option value="assignee">Assignee</option>
              <option value="priority">Priority</option>
              <option value="page">Page</option>
            </select>
          </label>
          <p className="text-xs text-[#626f86]">
            {visible.length} work items · drag up/down to reorder, sideways to change status
          </p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto pb-6">
        {lanes.map((lane) => (
          <section key={lane.id} className="mb-4 last:mb-0">
            {lane.title ? (
              <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-[#626f86]">{lane.title}</h3>
            ) : null}
            <div className="grid min-w-[1180px] grid-cols-4 gap-3">
              {BOARD_COLUMNS.map((column) => {
                const cards = sortBoardTasks(lane.tasks.filter((task) => columnForStatus(task.status) === column.id));
                const active = overSlot?.columnId === column.id;
                return (
                  <div
                    key={`${lane.id}-${column.id}`}
                    data-board-column={column.id}
                    className={`flex min-h-[280px] flex-col rounded-[8px] bg-[#f1f2f4] p-2 ${
                      active ? "ring-2 ring-[#0c66e4]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-[#626f86]">
                        {column.title}
                      </p>
                      <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-[#44546f]">{cards.length}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      {cards.map((task, index) => {
                        const moving = dragId === task.id;
                        const showLine = active && overSlot?.beforeId === task.id;
                        return (
                          <Fragment key={task.id}>
                          {showLine ? <DropLine /> : null}
                          <div
                            data-board-card={task.id}
                            onPointerDown={(event) => onPointerDown(event, task)}
                            onPointerMove={(event) => onPointerMove(event, task)}
                            onPointerUp={(event) => onPointerUp(event, task)}
                            onPointerCancel={() => {
                              origin.current = { x: 0, y: 0, dragging: false, id: "" };
                              setDragId(null);
                              setGhost(null);
                              setOverSlot(null);
                            }}
                            className={`rounded-[3px] border border-[#dcdfe4] bg-white p-3 shadow-[0_1px_1px_#091e4240] ${
                              canMove(task) ? "cursor-grab touch-none active:cursor-grabbing" : ""
                            } ${moving ? "pointer-events-none opacity-30" : "hover:bg-[#fafbfc]"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-start gap-2">
                                <span className="mt-0.5 w-5 shrink-0 text-[12px] font-bold tabular-nums text-[#626f86]">{index + 1}</span>
                                <Link href={task.href} className="text-sm font-semibold text-[#172b4d] hover:text-[#0c66e4]">
                                  {task.title}
                                </Link>
                              </div>
                              {canMove(task) ? (
                                <div className="flex shrink-0 gap-0.5">
                                  <button
                                    type="button"
                                    disabled={pending || index === 0}
                                    onClick={() => moveRank(task, -1, cards)}
                                    className="rounded p-0.5 text-[#626f86] hover:bg-[#f1f2f4] disabled:opacity-30"
                                    aria-label="Move up"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || index === cards.length - 1}
                                    onClick={() => moveRank(task, 1, cards)}
                                    className="rounded p-0.5 text-[#626f86] hover:bg-[#f1f2f4] disabled:opacity-30"
                                    aria-label="Move down"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || !neighborColumn(column.id, -1)}
                                    onClick={() => {
                                      const next = neighborColumn(column.id, -1);
                                      if (!next) return;
                                      const first = cardsInColumn(next, items, task.id)[0];
                                      placeTask(task, next, first?.id ?? null);
                                    }}
                                    className="rounded p-0.5 text-[#626f86] hover:bg-[#f1f2f4] disabled:opacity-30"
                                    aria-label="Move left"
                                  >
                                    <ChevronLeft size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || !neighborColumn(column.id, 1)}
                                    onClick={() => {
                                      const next = neighborColumn(column.id, 1);
                                      if (!next) return;
                                      const first = cardsInColumn(next, items, task.id)[0];
                                      placeTask(task, next, first?.id ?? null);
                                    }}
                                    className="rounded p-0.5 text-[#626f86] hover:bg-[#f1f2f4] disabled:opacity-30"
                                    aria-label="Move right"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <span
                              className={`mt-2 inline-flex rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold ${
                                statusTone[task.status] ?? statusTone.open
                              }`}
                            >
                              {pageTaskStatusLabel(task.status)}
                            </span>
                            <p className={`mt-2 inline-flex items-center gap-1 text-xs ${dueSoon(task) ? "text-[#ae2e24]" : "text-[#626f86]"}`}>
                              <Clock3 size={12} />
                              {dueLabel(task)}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-[#626f86]">
                              <div className="flex items-center gap-2">
                                <LayoutGrid size={13} className="text-[#44546f]" />
                                <Link href={task.href} className="text-[12px] font-medium text-[#626f86] hover:text-[#0c66e4]">
                                  {task.taskKey}
                                </Link>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px]">
                                  <MessageSquare size={12} />
                                  {task.commentCount}
                                </span>
                                <PriorityMark priority={task.priority} />
                                {task.assigneeNames.length ? (
                                  <span className="inline-flex -space-x-1" title={task.assigneeNames.join(", ")}>
                                    {task.assigneeNames.slice(0, 3).map((name) => (
                                      <span
                                        key={name}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[9px] font-semibold text-[#44546f] ring-2 ring-white"
                                      >
                                        {initials(name)}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#dcdfe4] text-[#44546f]">
                                    <UserRound size={11} />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          </Fragment>
                        );
                      })}
                      {active && overSlot?.beforeId === null ? <DropLine /> : null}
                      {cards.length === 0 && !active ? (
                        <p className="px-2 py-8 text-center text-xs text-[#8993a4]">
                          No work items
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {dragged && ghost ? (
        <div
          className="pointer-events-none fixed z-[70] rounded-[3px] border border-[#0c66e4] bg-white p-3 shadow-[0_8px_16px_#091e4226]"
          style={{
            left: ghost.x - ghost.width / 2,
            top: ghost.y - 24,
            width: ghost.width,
          }}
        >
          <p className="text-sm font-semibold text-[#172b4d]">{dragged.title}</p>
          <p className="mt-1 text-xs text-[#626f86]">{dragged.taskKey}</p>
        </div>
      ) : null}
    </div>
  );
}
