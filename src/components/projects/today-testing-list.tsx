import Link from "next/link";
import { ClipboardCheck, ListChecks } from "lucide-react";
import { todayReasonLabel, type TodayReason } from "@/lib/today";
import { formatDate, isOverdue } from "@/lib/format";
import { PriorityBadge, ResultBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { TodayTestingRow } from "@/lib/data";

const reasonClass: Record<TodayReason, string> = {
  overdue: "bg-[#FEF2F2] text-[#DC2626]",
  due_today: "bg-[#FEF3C7] text-[#D97706]",
  created_today: "bg-[#EFF6FF] text-[#1D4ED8]",
  in_progress: "bg-[#EFF6FF] text-[#1D4ED8]",
  done_today: "bg-[#DCFCE7] text-[#16A34A]",
};

export function TodayTestingList({
  items,
  showProject = true,
  emptyHref,
}: {
  items: TodayTestingRow[];
  showProject?: boolean;
  emptyHref?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        compact
        title="No testing due today"
        body="Open test points that are due today, overdue, in progress, or executed today will show here."
      >
        {emptyHref ? (
          <Link href={emptyHref} className="text-sm font-medium text-[#7C3AED]">
            Open testing
          </Link>
        ) : null}
      </EmptyState>
    );
  }

  const remaining = items.filter((item) => item.reason !== "done_today");
  const done = items.filter((item) => item.reason === "done_today");

  return (
    <div className="overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F5F3FF] text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-4 py-3 font-medium">Test point</th>
            {showProject ? <th className="px-4 py-3 font-medium">Project</th> : null}
            <th className="px-4 py-3 font-medium">Today</th>
            <th className="px-4 py-3 font-medium">Result</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {remaining.concat(done).map((item) => (
            <tr key={item.id} className="border-t border-[#E2E8F0] hover:bg-[#FAF5FF]">
              <td className="px-4 py-3">
                <Link href={item.href} className="font-semibold text-[#7C3AED] hover:underline">
                  {item.caseKey}
                </Link>
                <p className="mt-0.5 text-[#172033]">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-[#64748B]">
                  {item.runName}
                  {item.pageName ? ` · ${item.pageName}` : ""}
                </p>
              </td>
              {showProject ? (
                <td className="px-4 py-3 text-[#64748B]">
                  <Link href={`/projects/${item.projectId}/testing`} className="hover:text-[#7C3AED] hover:underline">
                    {item.projectCode} · {item.projectName}
                  </Link>
                </td>
              ) : null}
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-[3px] px-2 py-0.5 text-[11px] font-semibold ${reasonClass[item.reason]}`}>
                  {todayReasonLabel(item.reason)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ResultBadge result={item.result} />
                  <PriorityBadge priority={item.priority} />
                </div>
              </td>
              <td className="px-4 py-3 text-[#64748B]">{item.assigneeName ?? "Unassigned"}</td>
              <td className={`px-4 py-3 ${isOverdue(item.dueAt, item.reason === "done_today") ? "font-medium text-[#DC2626]" : "text-[#64748B]"}`}>
                {formatDate(item.dueAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TodaySectionHeader({
  tone,
  title,
  count,
}: {
  tone: "tasks" | "testing";
  title: string;
  count: number;
}) {
  const Icon = tone === "testing" ? ClipboardCheck : ListChecks;
  return (
    <div className="mb-2 mt-1 flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-[3px] ${
          tone === "testing" ? "bg-[#F5F3FF] text-[#7C3AED]" : "bg-[#EFF6FF] text-[#2563EB]"
        }`}
      >
        <Icon size={14} />
      </span>
      <h2 className="text-sm font-semibold text-[#172033]">{title}</h2>
      <span className="text-xs text-[#64748B]">{count}</span>
    </div>
  );
}
