import Link from "next/link";
import type { DashboardKpi } from "@/lib/dashboard";
import { ClipboardList, FlaskConical, Clock3, CalendarClock, TriangleAlert, CircleCheck } from "lucide-react";

const tone = {
  teal: { wrap: "bg-[#ECFDF5] text-[#0F766E]", line: "#0F766E" },
  purple: { wrap: "bg-[#F5F3FF] text-[#7C3AED]", line: "#7C3AED" },
  orange: { wrap: "bg-[#FFF7ED] text-[#EA580C]", line: "#EA580C" },
  red: { wrap: "bg-[#FEF2F2] text-[#DC2626]", line: "#DC2626" },
  pink: { wrap: "bg-[#FDF2F8] text-[#DB2777]", line: "#DB2777" },
  green: { wrap: "bg-[#F0FDF4] text-[#16A34A]", line: "#16A34A" },
} as const;

const icons = {
  total: ClipboardList,
  issues: FlaskConical,
  ontime: Clock3,
  late: CalendarClock,
  overdue: TriangleAlert,
  done: CircleCheck,
};

function Spark({ values, color }: { values: number[]; color: string }) {
  const width = 88;
  const height = 32;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => `${index * step},${height - (value / max) * (height - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-[88px] shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({ item }: { item: DashboardKpi }) {
  const look = tone[item.tone];
  const Icon = icons[item.key as keyof typeof icons] ?? ClipboardList;
  const up = item.delta >= 0;
  return (
    <Link
      href={item.href}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition hover:border-[#CBD5E1]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${look.wrap}`}>
          <Icon size={18} />
        </span>
        <Spark values={item.spark} color={look.line} />
      </div>
      <p className="mt-3 text-xs font-medium text-[#64748B]">{item.label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#172033]">{item.value}</p>
      <p className={`mt-2 text-[11px] font-medium ${up ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
        {up ? "↑" : "↓"} {Math.abs(item.delta)}% {item.hint}
      </p>
    </Link>
  );
}
