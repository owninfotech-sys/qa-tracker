import Link from "next/link";
import { todayReasonLabel, type TodayReason } from "@/lib/today";
import { formatDate, isOverdue } from "@/lib/format";
import { PageTaskKindBadge, PageTaskStatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { TodayTaskRow } from "@/lib/data";

const reasonClass: Record<TodayReason, string> = {
  overdue: "bg-[#FEF2F2] text-[#DC2626]",
  due_today: "bg-[#FEF3C7] text-[#D97706]",
  created_today: "bg-[#EFF6FF] text-[#1D4ED8]",
  in_progress: "bg-[#EFF6FF] text-[#1D4ED8]",
  done_today: "bg-[#DCFCE7] text-[#16A34A]",
};

export function TodayTaskList({
  tasks,
  showProject = true,
  emptyHref,
}: {
  tasks: TodayTaskRow[];
  showProject?: boolean;
  emptyHref?: string;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        compact
        title="Nothing on today's list"
        body="Open tasks that are due today, overdue, in progress, or created today will show here."
      >
        {emptyHref ? (
          <Link href={emptyHref} className="text-sm font-medium text-[#2563EB]">
            Open all tasks
          </Link>
        ) : null}
      </EmptyState>
    );
  }

  const remaining = tasks.filter((task) => task.reason !== "done_today");
  const done = tasks.filter((task) => task.reason === "done_today");

  return (
    <div className="overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-4 py-3 font-medium">Work</th>
            {showProject ? <th className="px-4 py-3 font-medium">Project</th> : null}
            <th className="px-4 py-3 font-medium">Today</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {remaining.concat(done).map((task) => (
            <tr key={task.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
              <td className="px-4 py-3">
                <Link href={task.href} className="font-semibold text-[#2563EB] hover:underline">
                  {task.taskKey}
                </Link>
                <p className="mt-0.5 text-[#172033]">{task.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <PageTaskKindBadge kind={task.kind} />
                  <span className="text-[11px] text-[#64748B]">{task.pageName}</span>
                </div>
              </td>
              {showProject ? (
                <td className="px-4 py-3 text-[#64748B]">
                  <Link href={`/projects/${task.projectId}/today`} className="hover:text-[#2563EB] hover:underline">
                    {task.projectCode} · {task.projectName}
                  </Link>
                </td>
              ) : null}
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-[3px] px-2 py-0.5 text-[11px] font-semibold ${reasonClass[task.reason]}`}>
                  {todayReasonLabel(task.reason)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <PageTaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </td>
              <td className="px-4 py-3 text-[#64748B]">
                {task.assigneeNames.length ? task.assigneeNames.join(", ") : "Unassigned"}
              </td>
              <td className={`px-4 py-3 ${isOverdue(task.dueAt, task.reason === "done_today") ? "font-medium text-[#DC2626]" : "text-[#64748B]"}`}>
                {formatDate(task.dueAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
