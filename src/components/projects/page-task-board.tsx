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
  FileText,
  LayoutGrid,
  MessageSquare,
  ScrollText,
  Search,
  UserRound,
} from "lucide-react";
import { reorderPageTasksAction, loadOpenDayReportAction, requestDayReportAction } from "@/app/actions/page-tasks";
import type { ListTask } from "@/lib/work-item";
import { formatDateTime, initials, pageTaskKindLabel, pageTaskStatusLabel } from "@/lib/format";
import { BOARD_COLUMNS, columnForStatus, neighborColumn, sortBoardTasks, statusForColumn } from "@/lib/board";
import { kindsForFilter } from "@/lib/work-type";
import { WorkReportDialog } from "@/components/projects/work-report-dialog";
import { BoardLogsPanel } from "@/components/projects/board-logs";
import { toast } from "@/components/ui/toast";

const statusTone: Record<string, string> = {
  open: "bg-[#E2E8F0] text-[#64748B]",
  waiting_customer: "bg-[#EFF6FF] text-[#1D4ED8]",
  in_progress: "bg-[#EFF6FF] text-[#1D4ED8]",
  escalated: "bg-[#ffebe6] text-[#bf2600]",
  pending: "bg-[#FEF3C7] text-[#D97706]",
  ready_for_testing: "bg-[#FEF3C7] text-[#D97706]",
  done: "bg-[#DCFCE7] text-[#16A34A]",
  wont_do: "bg-[#DCFCE7] text-[#16A34A]",
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
    priority === "P0" ? "text-[#DC2626]" : priority === "P1" || priority === "P2" ? "text-[#D97706]" : "text-[#22a06b]";
  return (
    <span className={`inline-flex h-3.5 items-end gap-px ${color}`} title={priority}>
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className={`w-[3px] rounded-sm ${index < (priority === "P3" ? 1 : priority === "P2" ? 2 : 3) ? "bg-current" : "bg-[#E2E8F0]"}`}
          style={{ height: 5 + index * 3 }}
        />
      ))}
    </span>
  );
}

function DropLine() {
  return <div className="pointer-events-none h-1 rounded-full bg-[#2563EB]" />;
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

function remainingLabel(dueAt?: string | null) {
  if (!dueAt) return "";
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return "Overdue";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, "0")} left`;
}

export function PageTaskBoard({
  tasks,
  canEdit,
  currentUserId: _currentUserId,
  role,
  toolbar,
  workType,
  projectId: projectIdProp,
  pageId: pageIdProp,
  canViewAll = false,
}: {
  tasks: ListTask[];
  canEdit: boolean;
  currentUserId: string;
  role: string;
  toolbar?: ReactNode;
  workType?: string;
  projectId?: string;
  pageId?: string;
  canViewAll?: boolean;
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
  const origin = useRef({ x: 0, y: 0, dragging: false, id: "", width: 0, pointerId: -1 });
  const itemsRef = useRef(tasks);
  const suppressClick = useRef(false);
  const [report, setReport] = useState<{
    kind: "task_done" | "day_complete";
    task?: ListTask;
    reportId?: string;
    dueAt?: string | null;
  } | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [dayReport, setDayReport] = useState<{ id: string; dueAt: string | null } | null>(null);
  const [submittedToday, setSubmittedToday] = useState(false);
  const [remain, setRemain] = useState("");
  const fallbackDue = useRef<string | null>(null);
  const projectId = projectIdProp || tasks[0]?.projectId || "";
  const pageId = pageIdProp || tasks[0]?.pageId || "";
  const isAdmin = canViewAll || role === "ADMIN";
  itemsRef.current = items;

  const todoCount = items.filter((item) => columnForStatus(item.status) === "todo").length;
  const progressCount = items.filter((item) => columnForStatus(item.status) === "progress").length;
  const doneCount = items.filter((item) => columnForStatus(item.status) === "done").length;
  const boardCleared = todoCount === 0 && progressCount === 0 && doneCount > 0;
  const showDayReportButton = boardCleared && !submittedToday;

  useEffect(() => {
    setItems(tasks);
    itemsRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (!projectId || !boardCleared) return;
    let cancelled = false;
    void (async () => {
      const existing = await loadOpenDayReportAction(projectId);
      if (cancelled) return;
      if (existing?.submittedAt) {
        setSubmittedToday(true);
        setDayReport(null);
        return;
      }
      if (existing) {
        setSubmittedToday(false);
        setDayReport({ id: existing.id, dueAt: existing.dueAt });
        return;
      }
      const created = await requestDayReportAction(projectId);
      if (cancelled) return;
      if (!created) {
        setSubmittedToday(true);
        setDayReport(null);
        return;
      }
      setSubmittedToday(false);
      setDayReport({ id: created.id, dueAt: created.dueAt });
    })();
    return () => {
      cancelled = true;
    };
  }, [boardCleared, projectId]);

  useEffect(() => {
    if (!showDayReportButton) {
      fallbackDue.current = null;
      setRemain("");
      return;
    }
    if (!fallbackDue.current) fallbackDue.current = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const deadline = dayReport?.dueAt ?? fallbackDue.current;
    function tick() {
      setRemain(remainingLabel(deadline));
    }
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [dayReport?.dueAt, showDayReportButton]);

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

  function openBoardClearedReport(nextItems: ListTask[]) {
    const todo = nextItems.filter((item) => columnForStatus(item.status) === "todo").length;
    const progress = nextItems.filter((item) => columnForStatus(item.status) === "progress").length;
    const done = nextItems.filter((item) => columnForStatus(item.status) === "done").length;
    if (todo === 0 && progress === 0 && done > 0 && projectId && !submittedToday) {
      startTransition(async () => {
        const created = await requestDayReportAction(projectId);
        if (!created) {
          setSubmittedToday(true);
          return;
        }
        setSubmittedToday(false);
        setDayReport({ id: created.id, dueAt: created.dueAt });
        setReport({ kind: "day_complete", reportId: created.id, dueAt: created.dueAt });
      });
    }
  }

  function openDayReportForm() {
    if (!projectId) return;
    startTransition(async () => {
      const current = dayReport?.id ? dayReport : await requestDayReportAction(projectId);
      if (!current?.id) {
        setSubmittedToday(true);
        return;
      }
      setDayReport({ id: current.id, dueAt: current.dueAt });
      setReport({ kind: "day_complete", reportId: current.id, dueAt: current.dueAt });
    });
  }

  function placeTask(task: ListTask, columnId: string, beforeId: string | null) {
    const currentItems = itemsRef.current;
    const nextStatus = statusForColumn(columnId, task.status);
    const orderedIds = cardsInColumn(columnId, currentItems, task.id).map((item) => item.id);
    let index = beforeId ? orderedIds.indexOf(beforeId) : orderedIds.length;
    if (index < 0) index = orderedIds.length;
    orderedIds.splice(index, 0, task.id);

    const currentIds = cardsInColumn(columnForStatus(task.status), currentItems).map((item) => item.id);
    if (nextStatus === task.status && currentIds.join(",") === orderedIds.join(",")) return;

    const nextItems = currentItems.map((item) => {
      if (item.id === task.id) return { ...item, status: nextStatus, sortOrder: index };
      const pos = orderedIds.indexOf(item.id);
      if (pos >= 0) return { ...item, sortOrder: pos };
      return item;
    });
    itemsRef.current = nextItems;
    setItems(nextItems);

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

    const prevBusy = currentItems.filter((item) => {
      const column = columnForStatus(item.status);
      return column === "todo" || column === "progress";
    }).length;
    const nextBusy = nextItems.filter((item) => {
      const column = columnForStatus(item.status);
      return column === "todo" || column === "progress";
    }).length;
    const nextDone = nextItems.filter((item) => columnForStatus(item.status) === "done").length;

    if (columnId === "done" && columnForStatus(task.status) !== "done") {
      toast(`${task.taskKey} moved to Done`);
      if (nextBusy === 0 && nextDone > 0) {
        openBoardClearedReport(nextItems);
      } else {
        setReport({ kind: "task_done", task });
      }
      return;
    }
    if (nextBusy === 0 && prevBusy > 0 && nextDone > 0) {
      openBoardClearedReport(nextItems);
    } else if (nextBusy > 0) {
      setDayReport(null);
    }
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
    const stack = document.elementsFromPoint(x, y);
    const columnHit = stack.find((node) => node instanceof Element && node.closest("[data-board-column]"));
    const column = columnHit instanceof Element ? columnHit.closest("[data-board-column]")?.getAttribute("data-board-column") : null;
    if (!column) return null;
    const cardHit = stack.find((node) => {
      if (!(node instanceof Element)) return false;
      const card = node.closest("[data-board-card]");
      return Boolean(card && card.getAttribute("data-board-card") !== dragTaskId);
    });
    const cardNode = cardHit instanceof Element ? cardHit.closest("[data-board-card]") : null;
    const cardId = cardNode?.getAttribute("data-board-card");
    if (!cardNode || !cardId || cardId === dragTaskId) return { columnId: column, beforeId: null };
    const rect = cardNode.getBoundingClientRect();
    if (y < rect.top + rect.height / 2) return { columnId: column, beforeId: cardId };
    return { columnId: column, beforeId: nextCardId(cardNode) };
  }

  function finishDrag(clientX: number, clientY: number) {
    const drag = origin.current;
    const task = itemsRef.current.find((item) => item.id === drag.id);
    const wasDragging = drag.dragging;
    const dropSlot = slotFromPoint(clientX, clientY, drag.id);
    origin.current = { x: 0, y: 0, dragging: false, id: "", width: 0, pointerId: -1 };
    setDragId(null);
    setGhost(null);
    setOverSlot(null);
    document.body.style.removeProperty("user-select");
    document.body.style.removeProperty("cursor");
    if (!task || !wasDragging) return;
    suppressClick.current = true;
    if (dropSlot) placeTask(task, dropSlot.columnId, dropSlot.beforeId);
  }

  const finishDragRef = useRef(finishDrag);
  finishDragRef.current = finishDrag;

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>, task: ListTask) {
    if (!canMove(task) || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button")) return;
    origin.current = {
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      id: task.id,
      width: event.currentTarget.offsetWidth,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const drag = origin.current;
      if (!drag.id || (drag.pointerId !== -1 && event.pointerId !== drag.pointerId)) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.dragging && Math.hypot(dx, dy) < 8) return;
      if (!drag.dragging) {
        drag.dragging = true;
        setDragId(drag.id);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }
      setGhost({ x: event.clientX, y: event.clientY, width: drag.width });
      setOverSlot(slotFromPoint(event.clientX, event.clientY, drag.id));
    }
    function onUp(event: PointerEvent) {
      const drag = origin.current;
      if (!drag.id || (drag.pointerId !== -1 && event.pointerId !== drag.pointerId)) return;
      finishDragRef.current(event.clientX, event.clientY);
    }
    function onClick(event: MouseEvent) {
      if (!suppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    }
    window.addEventListener("pointermove", onMove, { capture: true });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("pointermove", onMove, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  const dragged = items.find((item) => item.id === dragId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {toolbar ?? (
      <div className="flex flex-wrap items-center gap-2 px-1 py-3">
        <label className="relative w-[220px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search board"
            className="w-full rounded-full border border-[#E2E8F0] bg-white py-1.5 pl-9 pr-3 text-sm text-[#172033]"
          />
        </label>
        <label className="relative">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#64748B]">
            {kind === "all" ? "Request type" : pageTaskKindLabel(kind)}
            <ChevronDown size={14} />
          </span>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="all">Request type</option>
            {kindsForFilter(
              workType,
              tasks.map((task) => task.kind),
            ).map((value) => (
              <option key={value} value={value}>
                {pageTaskKindLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="relative">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#64748B]">
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
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#64748B]">
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
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#64748B]">
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
        <p className="ml-auto text-xs text-[#64748B]">
          {visible.length} work items · drag to another column to change status
        </p>
        {isAdmin && projectId ? (
          <button
            type="button"
            onClick={() => setLogsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#172033] hover:bg-[#F8FAFC]"
          >
            <ScrollText size={14} />
            Logs
          </button>
        ) : null}
      </div>
      )}
      {toolbar ? (
        <div className="flex items-center justify-between gap-2 px-4 pb-2">
          <label className="relative">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#64748B]">
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
          <p className="text-xs text-[#64748B]">
            {visible.length} work items · drag to another column to change status
          </p>
          {isAdmin && projectId ? (
            <button
              type="button"
              onClick={() => setLogsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#172033] hover:bg-[#F8FAFC]"
            >
              <ScrollText size={14} />
              Logs
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto pb-6">
        {lanes.map((lane) => (
          <section key={lane.id} className="mb-4 last:mb-0">
            {lane.title ? (
              <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">{lane.title}</h3>
            ) : null}
            <div className="grid min-w-[960px] grid-cols-3 gap-3">
              {BOARD_COLUMNS.map((column) => {
                const cards = sortBoardTasks(lane.tasks.filter((task) => columnForStatus(task.status) === column.id));
                const active = overSlot?.columnId === column.id;
                return (
                  <div
                    key={`${lane.id}-${column.id}`}
                    data-board-column={column.id}
                    className={`flex min-h-[420px] flex-col rounded-[3px] bg-[#F1F5F9] p-2 ${
                      active ? "ring-2 ring-[#2563EB]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-[#64748B]">
                        {column.title}
                      </p>
                      <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-[#64748B]">{cards.length}</span>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-2">
                      {cards.map((task, index) => {
                        const moving = dragId === task.id;
                        const showLine = active && overSlot?.beforeId === task.id;
                        return (
                          <Fragment key={task.id}>
                          {showLine ? <DropLine /> : null}
                          <div
                            data-board-card={task.id}
                            onPointerDown={(event) => onPointerDown(event, task)}
                            onPointerCancel={() => {
                              origin.current = { x: 0, y: 0, dragging: false, id: "", width: 0, pointerId: -1 };
                              setDragId(null);
                              setGhost(null);
                              setOverSlot(null);
                              document.body.style.removeProperty("user-select");
                              document.body.style.removeProperty("cursor");
                            }}
                            className={`rounded-[3px] border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_1px_#091e4240] ${
                              canMove(task) ? "cursor-grab touch-none active:cursor-grabbing" : ""
                            } ${moving ? "pointer-events-none opacity-30" : "hover:bg-[#F8FAFC]"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-start gap-2">
                                <span className="mt-0.5 w-5 shrink-0 text-[12px] font-bold tabular-nums text-[#64748B]">{index + 1}</span>
                                <Link href={task.href} className="text-sm font-semibold text-[#172033] hover:text-[#2563EB]">
                                  {task.title}
                                </Link>
                              </div>
                              {canMove(task) ? (
                                <div className="flex shrink-0 gap-0.5">
                                  <button
                                    type="button"
                                    disabled={pending || index === 0}
                                    onClick={() => moveRank(task, -1, cards)}
                                    className="rounded p-0.5 text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"
                                    aria-label="Move up"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending || index === cards.length - 1}
                                    onClick={() => moveRank(task, 1, cards)}
                                    className="rounded p-0.5 text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"
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
                                    className="rounded p-0.5 text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"
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
                                    className="rounded p-0.5 text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30"
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
                            <p className={`mt-2 inline-flex items-center gap-1 text-xs ${dueSoon(task) ? "text-[#DC2626]" : "text-[#64748B]"}`}>
                              <Clock3 size={12} />
                              {dueLabel(task)}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-[#64748B]">
                              <div className="flex items-center gap-2">
                                <LayoutGrid size={13} className="text-[#64748B]" />
                                <Link href={task.href} className="text-[12px] font-medium text-[#64748B] hover:text-[#2563EB]">
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
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E2E8F0] text-[9px] font-semibold text-[#64748B] ring-2 ring-white"
                                      >
                                        {initials(name)}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E2E8F0] text-[#64748B]">
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
                      {cards.length === 0 ? (
                        <p className="flex flex-1 items-center justify-center px-2 py-10 text-center text-xs text-[#94A3B8]">
                          {active ? "Drop here" : "No work items"}
                        </p>
                      ) : null}
                      {column.id === "done" && showDayReportButton ? (
                        <button
                          type="button"
                          onClick={openDayReportForm}
                          className="mt-auto flex w-full items-center justify-between gap-2 rounded-[3px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-left shadow-[0_1px_1px_#091e4240] hover:bg-[#FEF3C7]"
                        >
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <FileText size={15} className="shrink-0 text-[#D97706]" />
                            <span className="text-sm font-semibold text-[#92400E]">Add today&apos;s report</span>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-[3px] bg-white px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[#D97706]">
                            <Clock3 size={12} />
                            {remain || "15:00 left"}
                          </span>
                        </button>
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
          className="pointer-events-none fixed z-[70] rounded-[3px] border border-[#2563EB] bg-white p-3 shadow-[0_8px_16px_#091e4226]"
          style={{
            left: ghost.x - ghost.width / 2,
            top: ghost.y - 24,
            width: ghost.width,
          }}
        >
          <p className="text-sm font-semibold text-[#172033]">{dragged.title}</p>
          <p className="mt-1 text-xs text-[#64748B]">{dragged.taskKey}</p>
        </div>
      ) : null}

      <WorkReportDialog
        open={Boolean(report)}
        kind={report?.kind ?? "task_done"}
        projectId={projectId}
        pageId={pageId}
        taskId={report?.task?.id}
        taskKey={report?.task?.taskKey}
        taskTitle={report?.task?.title}
        reportId={report?.reportId}
        dueAt={report?.dueAt}
        onSubmitted={() => {
          if (report?.kind === "day_complete") {
            setDayReport(null);
            setSubmittedToday(true);
          }
        }}
        onClose={() => setReport(null)}
      />
      {isAdmin ? <BoardLogsPanel projectId={projectId} open={logsOpen} onClose={() => setLogsOpen(false)} /> : null}
    </div>
  );
}
