import Link from "next/link";
import { Suspense } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DonutChart, StackedBars, TrendChart } from "@/components/dashboard/charts";
import { RangeSelect } from "@/components/dashboard/range-select";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { type WorkDashboard } from "@/lib/dashboard";

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
            <Link href="/activity" className="text-sm font-medium text-[#2563EB] hover:underline">
              View all
            </Link>
          </div>
          <ActivityTable rows={data.activity} />
        </section>
        <DonutChart title="Work types" hint="How the queue is split." slices={data.kinds} />
      </div>
    </div>
  );
}
