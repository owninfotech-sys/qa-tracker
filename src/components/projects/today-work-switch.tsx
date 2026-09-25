import Link from "next/link";
import { ClipboardCheck, ListChecks } from "lucide-react";

export type TodayWorkFilter = "all" | "tasks" | "testing";

export function parseTodayWork(value?: string | null): TodayWorkFilter {
  if (value === "tasks" || value === "testing") return value;
  return "all";
}

export function TodayWorkSwitch({
  href,
  active,
  taskCount,
  testingCount,
  showTesting = true,
}: {
  href: string;
  active: TodayWorkFilter;
  taskCount: number;
  testingCount: number;
  showTesting?: boolean;
}) {
  const items = [
    { id: "all" as const, label: "All", count: taskCount + (showTesting ? testingCount : 0), query: "" },
    { id: "tasks" as const, label: "Tasks", count: taskCount, query: "tasks", icon: ListChecks },
    ...(showTesting
      ? [{ id: "testing" as const, label: "Testing", count: testingCount, query: "testing", icon: ClipboardCheck }]
      : []),
  ];
  const join = href.includes("?") ? "&" : "?";

  return (
    <div className="mb-4 inline-flex rounded-[3px] border border-[#E2E8F0] bg-white p-0.5">
      {items.map((item) => {
        const selected = item.id === active;
        const to = item.query ? `${href}${join}work=${item.query}` : href;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={to}
            className={`inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-sm font-medium ${
              selected
                ? item.id === "testing"
                  ? "bg-[#7C3AED] text-white"
                  : item.id === "tasks"
                    ? "bg-[#2563EB] text-white"
                    : "bg-[#172033] text-white"
                : "text-[#64748B] hover:text-[#172033]"
            }`}
          >
            {Icon ? <Icon size={14} /> : null}
            {item.label}
            <span className={`text-[11px] ${selected ? "text-white/80" : "text-[#94A3B8]"}`}>{item.count}</span>
          </Link>
        );
      })}
    </div>
  );
}
