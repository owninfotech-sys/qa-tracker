import Link from "next/link";
import { Suspense } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DonutChart, StackedBars, TrendChart } from "@/components/dashboard/charts";
import { RangeSelect } from "@/components/dashboard/range-select";
import { type WorkDashboard } from "@/lib/dashboard";
import { initials, pageTaskStatusLabel } from "@/lib/format";

const flagTone: Record<string, string> = {
  open: "bg-[#DBEAFE] text-[#1D4ED8]",
  late: "bg-[#FEE2E2] text-[#DC2626]",
  overdue: "bg-[#FEE2E2] text-[#DC2626]",
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
  if (flag === "overdue") return "Late";
  if (flag === "done") return "Done";
  return "Open";
}

export function WorkDashboardView({
  data,
  scoped,
}: {
  data: WorkDashboard;
  scoped?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {data.kpis.map((item) => (
          <KpiCard key={item.key} item={item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StackedBars
          title={scoped ? "Your work" : "Work done by people and projects"}
          hint="Track task distribution across team members."
          rows={data.byUser}
          action={
            <Suspense>
              <RangeSelect />
            </Suspense>
          }
        />
        <StackedBars
          title="Work by project"
          hint="Delivery across projects, including late completions."
          rows={data.byProject}
          action={
            <Suspense>
              <RangeSelect />
            </Suspense>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DonutChart
          title="On-time delivery"
          hint="Finished on time vs late, plus open overdue vs on track."
          slices={data.timing}
        />
        <TrendChart
          title={`Last ${Math.max(data.rangeDays, 14)} days`}
          hint="Items created vs items marked done each day."
          points={data.trend}
        />
        <DonutChart title="Issues" hint="Bugs, UI problems, and IT help items." slices={data.issues} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)] xl:col-span-2">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#172033]">Recent activity</h2>
              <p className="text-xs text-[#64748B]">Latest updates from your team.</p>
            </div>
            <Link href="/issues" className="text-sm font-medium text-[#2563EB] hover:underline">
              View all
            </Link>
          </div>
          {data.activity.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#94A3B8]">No recent work yet.</p>
          ) : (
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
                  {data.activity.map((item, index) => (
                    <tr key={item.href} className="border-t border-[#E2E8F0]">
                      <td className="px-4 py-3 text-[#94A3B8]">{index + 1}</td>
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
          )}
        </section>
        <DonutChart title="Work types" hint="How the queue is split." slices={data.kinds} />
      </div>
    </div>
  );
}
