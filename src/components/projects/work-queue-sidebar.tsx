"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  FolderKanban,
  Inbox,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  Wrench,
} from "lucide-react";

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
      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-[6px] bg-[#172b4d] px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  );
}

export function WorkQueueSidebar({
  projectId,
  projectName,
  pageId,
  pages,
  queue,
  view,
  openCount,
  totalCount,
  fixerCount,
}: {
  projectId: string;
  projectName: string;
  pageId: string;
  pages: PageLink[];
  queue?: string;
  view?: string;
  openCount: number;
  totalCount: number;
  fixerCount: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const start = useRef({ x: 0, y: 0, active: false });

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

  const queues = [
    { key: "open", href: hrefFor(projectId, pageId, view, "open"), label: "All open", icon: Inbox, count: openCount, active: queue === "open" },
    { key: "unassigned", href: hrefFor(projectId, pageId, view, "unassigned"), label: "Unassigned work items", icon: UserRound, count: totalCount, active: queue === "unassigned" },
    { key: "fixer", href: hrefFor(projectId, pageId, view, "fixer"), label: "Fixer Tasks", icon: Wrench, count: fixerCount, active: queue === "fixer" },
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
        className={`relative z-40 flex h-full shrink-0 flex-col border-r border-[#dcdfe4] bg-white transition-[width,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          rail ? "w-[68px]" : "w-[248px]"
        } ${mobileOpen ? "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-[8px_0_24px_#091e4226]" : ""}`}
      >
        <div className={`flex items-center border-b border-[#f1f2f4] ${showLabels ? "justify-between px-3 py-3" : "justify-center px-2 py-3"}`}>
          {showLabels ? (
            <Link href={`/projects/${projectId}`} className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#1d2856] text-[11px] font-bold text-white">
                {projectName.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-sm font-semibold text-[#172b4d]">{projectName}</span>
            </Link>
          ) : (
            <Tip collapsed label={projectName}>
              <Link
                href={`/projects/${projectId}`}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#1d2856] text-[11px] font-bold text-white"
              >
                {projectName.slice(0, 1).toUpperCase()}
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
                ? "rounded-[6px] p-1.5 text-[#44546f] hover:bg-[#f1f2f4]"
                : "absolute right-[-14px] top-4 z-50 flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#dcdfe4] bg-white text-[#172b4d] shadow-sm hover:bg-[#f1f2f4]"
            }
            title={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {collapsed && !mobileOpen ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {showLabels ? <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#626f86]">Queues</p> : null}
          <div className="space-y-0.5">
            {queues.map((item) => {
              const Icon = item.icon;
              return (
                <Tip key={item.key} collapsed={rail} label={`${item.label} (${item.count})`}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center rounded-[8px] text-sm transition-colors ${
                      item.active ? "bg-[#e9f2ff] font-medium text-[#0c66e4]" : "text-[#172b4d] hover:bg-[#f1f2f4]"
                    } ${showLabels ? "justify-between gap-2 px-2.5 py-2" : "h-10 w-full justify-center"}`}
                  >
                    <span className={`flex items-center ${showLabels ? "min-w-0 gap-2.5" : ""}`}>
                      <Icon size={18} className={item.active ? "text-[#0c66e4]" : "text-[#44546f]"} />
                      {showLabels ? <span className="truncate">{item.label}</span> : null}
                    </span>
                    {showLabels ? (
                      <span className="text-[11px] text-[#626f86]">{item.count}</span>
                    ) : item.count ? (
                      <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-[#0c66e4] px-1 text-center text-[9px] font-semibold leading-4 text-white">
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                </Tip>
              );
            })}
          </div>

          {showLabels ? (
            <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-[#626f86]">Pages</p>
          ) : (
            <div className="mx-auto my-3 h-px w-6 bg-[#dcdfe4]" />
          )}
          <div className="space-y-0.5">
            {pages.map((item) => {
              const active = !queue && item.id === pageId;
              return (
                <Tip key={item.id} collapsed={rail} label={`${item.name} (${item.count})`}>
                  <Link
                    href={hrefFor(projectId, item.id, view)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-[8px] text-sm transition-colors ${
                      active ? "bg-[#e9f2ff] font-medium text-[#0c66e4]" : "text-[#172b4d] hover:bg-[#f1f2f4]"
                    } ${showLabels ? "justify-between gap-2 px-2.5 py-2" : "h-10 w-full justify-center"}`}
                  >
                    <span className={`flex items-center ${showLabels ? "min-w-0 gap-2.5" : ""}`}>
                      <LayoutList size={18} className={active ? "text-[#0c66e4]" : "text-[#44546f]"} />
                      {showLabels ? <span className="truncate">{item.name}</span> : null}
                    </span>
                    {showLabels ? <span className="text-[11px] text-[#626f86]">{item.count}</span> : null}
                  </Link>
                </Tip>
              );
            })}
          </div>
        </nav>

        <div className={`border-t border-[#f1f2f4] py-3 ${showLabels ? "px-3" : "flex justify-center"}`}>
          <Tip collapsed={rail} label="Project summary">
            <Link
              href={`/projects/${projectId}`}
              className={`flex items-center rounded-[8px] text-[#44546f] hover:bg-[#f1f2f4] ${
                showLabels ? "gap-2 px-2 py-1.5 text-xs" : "h-9 w-9 justify-center"
              }`}
            >
              <FolderKanban size={16} />
              {showLabels ? "Project summary" : null}
            </Link>
          </Tip>
        </div>
      </aside>
    </>
  );
}
