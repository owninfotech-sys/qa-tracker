import Link from "next/link";
import { initials, pageTaskStatusLabel } from "@/lib/format";
import type { DashboardActivity } from "@/lib/dashboard";

const flagTone: Record<string, string> = {
  open: "bg-[#DBEAFE] text-[#1D4ED8]",
  late: "bg-[#FEE2E2] text-[#DC2626]",
  overdue: "bg-[#FFEDD5] text-[#C2410C]",
  done: "bg-[#DCFCE7] text-[#15803D]",
};

const kindTone: Record<string, string> = {
  task: "bg-[#DBEAFE] text-[#1D4ED8]",
  issue: "bg-[#FFEDD5] text-[#C2410C]",
  refine: "bg-[#E0F2FE] text-[#0369A1]",
  redesign: "bg-[#EDE9FE] text-[#6D28D9]",
  fix_bug: "bg-[#FEE2E2] text-[#B91C1C]",
  fix_ui: "bg-[#FFEDD5] text-[#C2410C]",
};

function flagText(flag: string) {
  if (flag === "late") return "Late";
  if (flag === "overdue") return "Overdue";
  if (flag === "done") return "Done";
  return "Open";
}

export function ActivityTable({
  rows,
  startIndex = 0,
  emptyText = "No matching work yet.",
}: {
  rows: DashboardActivity[];
  startIndex?: number;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-[#94A3B8]">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 font-medium">Title</th>
            <th className="px-4 py-2.5 font-medium">Project</th>
            <th className="px-4 py-2.5 font-medium">Assignee</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={`${item.href}-${index}`} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-4 py-3 text-[#94A3B8]">{startIndex + index + 1}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${kindTone[item.kindKey] ?? kindTone.task}`}
                >
                  {item.kind}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link href={item.href} className="font-medium text-[#172033] hover:text-[#2563EB]">
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-[#64748B]">{item.project}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2 text-[#64748B]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF6FF] text-[10px] font-semibold text-[#2563EB]">
                    {initials(item.assignee)}
                  </span>
                  <span className="truncate">{item.assignee}</span>
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${flagTone[item.flag]}`}>
                  {flagText(item.flag)}
                </span>
                <span className="ml-2 text-[11px] text-[#94A3B8]">{pageTaskStatusLabel(item.status)}</span>
              </td>
              <td className="px-4 py-3 text-[#64748B]">{item.createdLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
