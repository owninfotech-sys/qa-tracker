"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { PRESET_ROLES } from "@/lib/access";

const OPTIONS = [
  ...PRESET_ROLES,
  { value: "OTHER", label: "Other", hint: "Type a custom role" },
] as const;

function isPreset(role: string) {
  return OPTIONS.some((option) => option.value === role);
}

export function RoleFields({
  defaultRole = "TESTER",
  compact = false,
}: {
  defaultRole?: string;
  compact?: boolean;
}) {
  const customDefault = isPreset(defaultRole) ? "" : defaultRole;
  const [choice, setChoice] = useState(isPreset(defaultRole) ? defaultRole : "OTHER");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const selected = OPTIONS.find((option) => option.value === choice) ?? OPTIONS[0];

  useEffect(() => {
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
  }, []);

  return (
    <div className={compact ? "flex min-w-[220px] flex-wrap items-center gap-2" : "space-y-2"}>
      <div ref={box} className={`relative ${compact ? "min-w-[148px]" : "w-full"}`}>
        <input type="hidden" name="role" value={choice} />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={
            compact
              ? "inline-flex h-9 w-full items-center justify-between gap-2 rounded-[3px] border border-[#E2E8F0] bg-white px-2.5 text-sm text-[#172033] hover:bg-[#F8FAFC]"
              : "flex h-[42px] w-full items-center justify-between gap-2 rounded-[3px] border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#172033] hover:bg-[#F8FAFC]"
          }
        >
          <span className="truncate">{choice === "OTHER" && customDefault ? customDefault : selected.label}</span>
          <ChevronDown size={14} className={`shrink-0 text-[#64748B] transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open ? (
          <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-72 w-[240px] overflow-y-auto rounded-[3px] border border-[#E2E8F0] bg-white py-1 shadow-[0_12px_32px_rgba(23,32,51,.14)]">
            {OPTIONS.map((option) => {
              const active = option.value === choice;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setChoice(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-[#F8FAFC] ${
                    active ? "bg-[#EFF6FF]" : ""
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium text-[#172033]">{option.label}</span>
                    <span className="mt-0.5 block text-[11px] text-[#64748B]">{option.hint}</span>
                  </span>
                  {active ? <Check size={14} className="mt-0.5 shrink-0 text-[#2563EB]" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {choice === "OTHER" ? (
        <input
          name="customRole"
          defaultValue={customDefault}
          required
          placeholder="Custom role name"
          className={
            compact
              ? "min-w-[140px] flex-1 rounded-[3px] border border-[#E2E8F0] px-2 py-1.5 text-sm"
              : "w-full rounded-[3px] border border-[#2563EB] bg-[#EFF6FF] px-3 py-2.5 text-sm"
          }
        />
      ) : null}
    </div>
  );
}
