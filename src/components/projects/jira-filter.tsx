"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export type JiraFilterOption = {
  value: string;
  label: string;
  pillClass?: string;
  hint?: string;
  leading?: ReactNode;
};

export const STATUS_FILTER_PILL: Record<string, string> = {
  open: "bg-[#E2E8F0] text-[#64748B]",
  waiting_customer: "bg-[#E2E8F0] text-[#64748B]",
  in_progress: "bg-[#EFF6FF] text-[#1D4ED8]",
  escalated: "bg-[#EFF6FF] text-[#1D4ED8]",
  pending: "bg-[#EFF6FF] text-[#1D4ED8]",
  ready_for_testing: "bg-[#FEF3C7] text-[#D97706]",
  done: "bg-[#DCFCE7] text-[#16A34A]",
  wont_do: "bg-[#DCFCE7] text-[#16A34A]",
};

export function JiraFilter({
  label,
  searchPlaceholder,
  options,
  selected,
  onChange,
  operator = "equals",
}: {
  label: string;
  searchPlaceholder: string;
  options: JiraFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  operator?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        option.value.toLowerCase().includes(needle) ||
        option.hint?.toLowerCase().includes(needle),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 20);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  const active = selected.length > 0;
  const triggerLabel =
    selected.length === 0
      ? label
      : selected.length === 1
        ? (options.find((option) => option.value === selected[0])?.label ?? label)
        : `${label}: ${selected.length}`;

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`inline-flex items-center rounded-full border text-sm ${
          active
            ? "border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB]"
            : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F1F5F9]"
        }`}
      >
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1 px-3 py-1.5">
          {triggerLabel}
          {active ? null : <ChevronDown size={14} />}
        </button>
        {active ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange([])}
            className="rounded-full p-1 pr-2 hover:bg-[#DBEAFE]"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[320px] overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white shadow-[0_8px_16px_#091e4226,0_0_1px_#091e424f]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-3 py-2">
            <p className="text-[13px] text-[#172033]">
              <span className="font-semibold">{label}</span>
              <span className="text-[#64748B]"> = ({operator})</span>
            </p>
            <ChevronDown size={14} className="text-[#64748B]" />
          </div>
          <div className="p-2">
            <label className="relative block">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-[3px] border border-[#E2E8F0] py-1.5 pl-8 pr-2 text-sm text-[#172033] outline-none focus:border-[#2563EB]"
              />
            </label>
          </div>
          <div className="max-h-[280px] overflow-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#64748B]">No matches</p>
            ) : (
              visible.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-[#F1F5F9]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.value)}
                      className="h-3.5 w-3.5 accent-[#2563EB]"
                    />
                    {option.leading}
                    {option.pillClass ? (
                      <span className={`inline-flex rounded-[3px] px-2 py-0.5 text-[12px] font-semibold ${option.pillClass}`}>
                        {option.label}
                      </span>
                    ) : (
                      <span className="text-sm text-[#172033]">{option.label}</span>
                    )}
                  </label>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-3 py-1.5 text-[11px] text-[#64748B]">
            <button
              type="button"
              className="font-medium text-[#2563EB] hover:underline disabled:text-[#94A3B8]"
              disabled={!selected.length}
              onClick={() => onChange([])}
            >
              Clear
            </button>
            <span>
              {visible.length} of {options.length}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MoreFiltersMenu({
  extras,
  onAdd,
}: {
  extras: { id: string; label: string; hidden: boolean }[];
  onAdd: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const available = extras.filter((item) => item.hidden);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!available.length) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#64748B] hover:bg-[#F1F5F9]"
      >
        More filters
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[220px] overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white py-1 shadow-[0_8px_16px_#091e4226]">
          {available.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onAdd(item.id);
                setOpen(false);
              }}
              className="flex w-full px-3 py-2 text-left text-sm text-[#172033] hover:bg-[#F1F5F9]"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
