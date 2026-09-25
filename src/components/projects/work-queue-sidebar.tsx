"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type PointerEvent, type ReactNode } from "react";
import {
  ClipboardCheck,
  FolderKanban,
  GripVertical,
  Inbox,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";
import { testingHref } from "@/lib/workspace";
import { reorderProjectPagesAction } from "@/app/actions/projects";
import { toast } from "@/components/ui/toast";

type PageLink = { id: string; name: string; count: number };

function hrefFor(
  projectId: string,
  pageId: string,
  view?: string,
  queue?: string,
) {
  const params = new URLSearchParams();
  if (queue) params.set("queue", queue);
  if (view === "board") params.set("view", "board");
  const query = params.toString();
  return `/projects/${projectId}/pages/${pageId}${query ? `?${query}` : ""}`;
}

function Tip({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <span className="group relative flex justify-center">
      {children}
      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-[6px] bg-[#172033] px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  );
}

export function WorkQueueSidebar({
  projectId,
  projectName,
  projectCode,
  pageId,
  pages,
  queue,
  view,
  openCount,
  totalCount,
  canReorder = false,
}: {
  projectId: string;
  projectName: string;
  projectCode?: string;
  pageId: string;
  pages: PageLink[];
  queue?: string;
  view?: string;
  openCount: number;
  totalCount: number;
  canReorder?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [items, setItems] = useState(pages);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startSave] = useTransition();
  const start = useRef({ x: 0, y: 0, active: false });
  const drag = useRef<{ id: string } | null>(null);
  const itemsRef = useRef(pages);

  useEffect(() => {
    setItems(pages);
    itemsRef.current = pages;
  }, [pages]);

  useEffect(() => {
    const saved = window.localStorage.getItem("qa-queue-sidebar");
    if (saved === "collapsed" || (!saved && window.innerWidth < 768)) setCollapsed(true);
  }, []);

  function setMode(next: boolean) {
    setCollapsed(next);
    window.localStorage.setItem("qa-queue-sidebar", next ? "collapsed" : "expanded");
    if (!next) setMobileOpen(true);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, active: true };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!start.current.active) return;
    const dx = event.clientX - start.current.x;
    const dy = Math.abs(event.clientY - start.current.y);
    start.current.active = false;
    if (dy > 70) return;
    if (dx > 56) {
      setMode(false);
      setMobileOpen(true);
    }
    if (dx < -56) {
      setMode(true);
      setMobileOpen(false);
    }
  }

  function indexFromPoint(clientY: number) {
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-area-id]"));
    for (let i = 0; i < rows.length; i++) {
      const box = rows[i].getBoundingClientRect();
      if (clientY < box.top + box.height / 2) return i;
    }
    return Math.max(0, rows.length - 1);
  }

  function onGripDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id };
    setDragId(id);
  }

  function onGripMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    event.stopPropagation();
    const current = itemsRef.current;
    const from = current.findIndex((item) => item.id === drag.current?.id);
    const to = indexFromPoint(event.clientY);
    if (from < 0 || to === from) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    itemsRef.current = next;
    setItems(next);
  }

  function onGripUp(event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!drag.current) return;
    drag.current = null;
    setDragId(null);
    const ordered = itemsRef.current.map((item) => item.id);
    const original = pages.map((item) => item.id);
    if (ordered.join(",") === original.join(",")) return;
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("orderedIds", ordered.join(","));
    startSave(async () => {
      const result = await reorderProjectPagesAction(data);
      if (result?.ok) toast("Areas rearranged");
    });
  }

  const queues = [
    { key: "open", href: hrefFor(projectId, pageId, view, "open"), label: "All open", icon: Inbox, count: openCount, active: queue === "open" },
    { key: "unassigned", href: hrefFor(projectId, pageId, view, "unassigned"), label: "Unassigned", icon: UserRound, count: totalCount, active: queue === "unassigned" },
  ];

  const rail = collapsed && !mobileOpen;
  const showLabels = !rail;

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-[#091e427a] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-4 md:w-3"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />

      <aside
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={`relative z-40 flex h-full shrink-0 flex-col border-r border-[#E2E8F0] bg-white transition-[width,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          rail ? "w-[68px]" : "w-[248px]"
        } ${mobileOpen ? "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-[8px_0_24px_#091e4226]" : ""}`}
      >
        <div className={`flex items-center border-b border-[#F1F5F9] ${showLabels ? "justify-between px-3 py-3" : "justify-center px-2 py-3"}`}>
          {showLabels ? (
            <Link href={`/projects/${projectId}`} className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-[#172554] text-[10px] font-bold text-white">
                {(projectCode || projectName).slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#172033]">{projectName}</span>
                {projectCode ? <span className="block text-[11px] font-medium text-[#64748B]">{projectCode}</span> : null}
              </span>
            </Link>
          ) : (
            <Tip collapsed label={`${projectName}${projectCode ? ` · ${projectCode}` : ""}`}>
              <Link
                href={`/projects/${projectId}`}
                className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#172554] text-[10px] font-bold text-white"
              >
                {(projectCode || projectName).slice(0, 2).toUpperCase()}
              </Link>
            </Tip>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia("(max-width: 767px)").matches) {
                setMobileOpen((open) => {
                  const next = !open;
                  if (next) setCollapsed(false);
                  else setMode(true);
                  return next;
                });
                return;
              }
              setMode(!collapsed);
            }}
            className={
              showLabels
                ? "rounded-[6px] p-1.5 text-[#64748B] hover:bg-[#F1F5F9]"
                : "absolute right-[-14px] top-4 z-50 flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E2E8F0] bg-white text-[#172033] shadow-sm hover:bg-[#F1F5F9]"
            }
            title={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {collapsed && !mobileOpen ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {showLabels ? <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Queues</p> : null}
          <div className="space-y-0.5">
            {queues.map((item) => {
              const Icon = item.icon;
              return (
                <Tip key={item.key} collapsed={rail} label={`${item.label} (${item.count})`}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center rounded-[8px] text-sm transition-colors ${
                      item.active ? "bg-[#EFF6FF] font-medium text-[#2563EB]" : "text-[#172033] hover:bg-[#F1F5F9]"
                    } ${showLabels ? "justify-between gap-2 px-2.5 py-2" : "h-10 w-full justify-center"}`}
                  >
                    <span className={`flex items-center ${showLabels ? "min-w-0 gap-2.5" : ""}`}>
                      <Icon size={18} className={item.active ? "text-[#2563EB]" : "text-[#64748B]"} />
                      {showLabels ? <span className="truncate">{item.label}</span> : null}
                    </span>
                    {showLabels ? (
                      <span className="text-[11px] text-[#64748B]">{item.count}</span>
                    ) : item.count ? (
                      <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-[#2563EB] px-1 text-center text-[9px] font-semibold leading-4 text-white">
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                </Tip>
              );
            })}
          </div>

          {showLabels ? (
            <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Areas{canReorder ? " · drag to rearrange" : ""}
            </p>
          ) : (
            <div className="mx-auto my-3 h-px w-6 bg-[#E2E8F0]" />
          )}
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = !queue && item.id === pageId;
              return (
                <Tip key={item.id} collapsed={rail} label={`${item.name} (${item.count})`}>
                  <div
                    data-area-id={item.id}
                    className={`flex items-center rounded-[8px] text-sm transition-colors ${
                      active ? "bg-[#EFF6FF] font-medium text-[#2563EB]" : "text-[#172033] hover:bg-[#F1F5F9]"
                    } ${dragId === item.id ? "opacity-60" : ""} ${showLabels ? "gap-0.5 px-1 py-0.5" : "h-10 w-full justify-center"}`}
                  >
                    {canReorder && showLabels ? (
                      <button
                        type="button"
                        aria-label={`Move ${item.name}`}
                        onPointerDown={(event) => onGripDown(event, item.id)}
                        onPointerMove={onGripMove}
                        onPointerUp={onGripUp}
                        onPointerCancel={onGripUp}
                        className="shrink-0 cursor-grab rounded-[3px] p-1 text-[#94A3B8] hover:bg-white hover:text-[#64748B] active:cursor-grabbing"
                      >
                        <GripVertical size={14} />
                      </button>
                    ) : null}
                    <Link
                      href={hrefFor(projectId, item.id, view)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-w-0 flex-1 items-center ${
                        showLabels ? "justify-between gap-2 px-1.5 py-1.5" : "h-10 w-full justify-center"
                      }`}
                    >
                      <span className={`flex items-center ${showLabels ? "min-w-0 gap-2.5" : ""}`}>
                        <LayoutList size={18} className={active ? "text-[#2563EB]" : "text-[#64748B]"} />
                        {showLabels ? <span className="truncate">{item.name}</span> : null}
                      </span>
                      {showLabels ? (
                        <span className={`text-[11px] ${pending ? "text-[#94A3B8]" : "text-[#64748B]"}`}>{item.count}</span>
                      ) : null}
                    </Link>
                  </div>
                </Tip>
              );
            })}
          </div>
        </nav>

        <div className={`space-y-0.5 border-t border-[#F1F5F9] py-3 ${showLabels ? "px-2" : "flex flex-col items-center"}`}>
          <Tip collapsed={rail} label="Testing">
            <Link
              href={testingHref(projectId)}
              className={`flex items-center rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] ${
                showLabels ? "gap-2 px-2.5 py-2 text-sm" : "h-9 w-9 justify-center"
              }`}
            >
              <ClipboardCheck size={16} />
              {showLabels ? "Testing" : null}
            </Link>
          </Tip>
          <Tip collapsed={rail} label="Project overview">
            <Link
              href={`/projects/${projectId}`}
              className={`flex items-center rounded-[8px] text-[#64748B] hover:bg-[#F1F5F9] ${
                showLabels ? "gap-2 px-2.5 py-2 text-sm" : "h-9 w-9 justify-center"
              }`}
            >
              <FolderKanban size={16} />
              {showLabels ? "Overview" : null}
            </Link>
          </Tip>
        </div>
      </aside>
    </>
  );
}
