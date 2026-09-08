"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";
import type { Role } from "@/lib/types";

const links = [
  { href: "/", label: "My Work", icon: ClipboardCheck, roles: ["ADMIN", "TESTER", "FIXER"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["ADMIN", "TESTER", "FIXER"] },
  { href: "/team", label: "Team", icon: Users, roles: ["ADMIN"] },
];

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
      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[#172b4d] px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  );
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = links.filter((link) => link.roles.includes(role));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const start = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const saved = window.localStorage.getItem("qa-app-sidebar");
    if (saved === "collapsed" || (!saved && window.innerWidth < 768)) setCollapsed(true);
  }, []);

  function setMode(next: boolean) {
    setCollapsed(next);
    window.localStorage.setItem("qa-app-sidebar", next ? "collapsed" : "expanded");
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, active: true };
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
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

  const rail = collapsed && !mobileOpen;
  const showLabels = !rail;

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-[#091e427a] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className="absolute inset-y-0 left-0 z-20 w-3"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />

      <aside
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={`relative z-40 flex h-full shrink-0 flex-col bg-[#1d2856] text-white transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          rail ? "w-[72px]" : "w-[248px]"
        } ${mobileOpen ? "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-[8px_0_24px_#091e4240]" : ""}`}
      >
        <div className={`flex items-center py-4 ${showLabels ? "justify-between px-4" : "justify-center px-2"}`}>
          {showLabels ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0c66e4] text-white">
                <LayoutDashboard size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">QA Tracker</p>
                <p className="truncate text-[11px] text-white/60">Own InfoTech</p>
              </div>
            </div>
          ) : (
            <Tip collapsed label="QA Tracker">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c66e4]">
                <LayoutDashboard size={18} />
              </span>
            </Tip>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia("(max-width: 767px)").matches) {
                setMobileOpen((open) => {
                  if (!open) setCollapsed(false);
                  else setMode(true);
                  return !open;
                });
                return;
              }
              setMode(!collapsed);
            }}
            className={
              showLabels
                ? "rounded-md p-1.5 text-white/80 hover:bg-white/10"
                : "absolute right-[-14px] top-5 z-50 flex h-8 w-8 items-center justify-center rounded-md border border-[#dcdfe4] bg-white text-[#172b4d] shadow-sm hover:bg-[#f1f2f4]"
            }
            title={rail ? "Show sidebar" : "Hide sidebar"}
            aria-label={rail ? "Show sidebar" : "Hide sidebar"}
          >
            {rail ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2 pt-2">
          {visible.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Tip key={link.href} collapsed={rail} label={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-lg text-sm transition-colors ${
                    active ? "bg-white/15 font-medium text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                  } ${showLabels ? "gap-3 px-3 py-2.5" : "h-11 w-full justify-center"}`}
                >
                  <Icon size={18} />
                  {showLabels ? link.label : null}
                </Link>
              </Tip>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
