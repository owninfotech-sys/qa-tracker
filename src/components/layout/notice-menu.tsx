"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { loadNoticesAction } from "@/app/actions/search";
import { flagLabel, type DashboardAttention } from "@/lib/dashboard";

export function NoticeMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DashboardAttention[] | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || items) return;
    void loadNoticesAction().then(setItems);
  }, [open, items]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const count = items?.length ?? 0;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {count ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#DC2626]" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-white shadow-[0_12px_32px_rgba(23,32,51,.12)]">
          <div className="border-b border-[#E2E8F0] px-3 py-2">
            <p className="text-sm font-semibold text-[#172033]">Needs attention</p>
            <p className="text-xs text-[#64748B]">Overdue, due today, and open issues.</p>
          </div>
          {items == null ? (
            <p className="px-3 py-4 text-sm text-[#94A3B8]">Loading…</p>
          ) : !items.length ? (
            <p className="px-3 py-4 text-sm text-[#94A3B8]">Nothing waiting right now.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={`${item.flag}-${item.href}`} className="border-t border-[#E2E8F0]">
                  <Link href={item.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 hover:bg-[#F8FAFC]">
                    <p className="truncate text-sm font-medium text-[#172033]">
                      {item.taskKey} · {item.title}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {flagLabel(item.flag)} · {item.project}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
