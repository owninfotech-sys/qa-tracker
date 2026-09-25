"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type CustomSelectOption = {
  value: string;
  label: string;
};

export function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  align = "left",
  side = "bottom",
  compact = false,
}: {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  align?: "left" | "right";
  side?: "top" | "bottom";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={
          compact
            ? "inline-flex h-8 min-w-[108px] items-center justify-between gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#172033] hover:bg-[#F8FAFC]"
            : "inline-flex h-9 min-w-[148px] items-center justify-between gap-2 rounded-[3px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#172033] hover:bg-[#F8FAFC]"
        }
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown size={14} className={`shrink-0 text-[#64748B] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          className={`absolute z-[70] min-w-full overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white py-1 shadow-[0_12px_32px_rgba(23,32,51,.14)] ${
            align === "right" ? "right-0" : "left-0"
          } ${side === "top" ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"}`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-[#F8FAFC] ${
                  active ? "bg-[#EFF6FF] font-medium text-[#1D4ED8]" : "text-[#172033]"
                }`}
              >
                {option.label}
                {active ? <Check size={14} className="shrink-0 text-[#2563EB]" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
