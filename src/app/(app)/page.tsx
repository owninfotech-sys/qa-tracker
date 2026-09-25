import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAccess, homeForRole, isStaffEditor, requireSession } from "@/lib/auth";
import { findMyWork, findWorkDashboard } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkDashboardView } from "@/components/dashboard/work-dashboard";
import { FixBadge, PriorityBadge, ResultBadge } from "@/components/ui/status-badge";
import { formatDate, isOverdue } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireSession();
  if (!(await hasAccess(user.role, "dashboard"))) redirect(await homeForRole(user.role));
  const admin = await hasAccess(user.role, "viewAll");
  const testingQueue = await isStaffEditor(user.role);
  const showFixes = await hasAccess(user.role, "updateFix");
  const [dash, work] = await Promise.all([
    findWorkDashboard(admin ? undefined : { userId: user.id }),
    findMyWork(user.id),
  ]);
  const { myItems, myFixes, retests, overdueItems, unassignedFails, openRuns } = work;

  const totalOpen = openRuns.reduce((sum, run) => sum + run.items.length, 0);
  const doneOpen = openRuns.reduce(
    (sum, run) =>
      sum +
      run.items.filter((item) =>
        ["pass", "fail", "blocked", "skipped"].includes(item.result),
      ).length,
    0,
  );

  return (
    <>
      <Topbar user={user} title="Dashboard" />
      <main className="flex-1 space-y-8 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {admin
              ? "Work done by people and projects, on-time delivery, and open issues."
              : "Your completed work, on-time delivery, and items that still need you."}
          </p>
        </div>

        <WorkDashboardView data={dash} scoped={!admin} />

        {admin ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[3px] border border-[#E2E8F0] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Testing points</p>
              <p className="mt-2 text-[28px] font-semibold text-[#172033]">
                {doneOpen}/{totalOpen || 0}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">Done vs total across open runs</p>
            </div>
            <div className="rounded-[3px] border border-[#E2E8F0] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Unassigned fails</p>
              <p className={`mt-2 text-[28px] font-semibold ${unassignedFails.length ? "text-[#DC2626]" : "text-[#172033]"}`}>
                {unassignedFails.length}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">Failed points waiting for a fixer</p>
            </div>
            <div className="rounded-[3px] border border-[#E2E8F0] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Open test runs</p>
              <p className="mt-2 text-[28px] font-semibold text-[#172033]">{openRuns.length}</p>
              <p className="mt-1 text-xs text-[#64748B]">Active testing cycles</p>
            </div>
          </div>
        ) : null}

        {testingQueue && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Your test points</h2>
              <div className="flex items-center gap-3">
                <Link href="/projects" className="text-sm font-medium text-blue hover:underline">
                  Add testing points
                </Link>
                <span className="text-xs text-muted">{myItems.length} open</span>
              </div>
            </div>
            {myItems.length === 0 ? (
              <EmptyState
                title="No points in your queue"
                body="Ask an admin to assign a run. When they do, it will show up here."
              />
            ) : (
              <div className="overflow-hidden rounded-[3px] border border-line bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Point</th>
                      <th className="px-4 py-3 font-medium">Project</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Due</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myItems.map((item) => (
                      <tr key={item.id} className="border-t border-line hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3">
                          <Link href={`/execute/${item.id}`} className="font-medium text-blue hover:underline">
                            {item.case.caseKey} · {item.case.title}
                          </Link>
                          <p className="text-xs text-muted">{item.case.page?.name ?? item.case.project.name}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{item.case.project.name}</td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={item.case.priority} />
                        </td>
                        <td className={`px-4 py-3 ${isOverdue(item.dueDate) ? "font-medium text-danger" : "text-muted"}`}>
                          {formatDate(item.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <ResultBadge result={item.result} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {testingQueue && retests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-medium">Ready for retest</h2>
            <div className="overflow-hidden rounded-[3px] border border-line bg-card">
              {retests.map((fix) => (
                <Link
                  key={fix.id}
                  href={`/execute/${fix.runItemId}`}
                  className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-[#F8FAFC]"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {fix.fixKey} · {fix.title}
                    </p>
                    <p className="text-xs text-muted">{fix.runItem.case.project.name}</p>
                  </div>
                  <FixBadge status={fix.status} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {(showFixes || admin) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Fix tasks</h2>
            </div>
            {myFixes.length === 0 ? (
              <EmptyState
                title="No fixes assigned to you"
                body="When a tester fails a point, an admin can assign the repair work here."
              />
            ) : (
              <div className="overflow-hidden rounded-[3px] border border-line bg-card">
                {myFixes.map((fix) => (
                  <Link
                    key={fix.id}
                    href={`/fixes/${fix.id}`}
                    className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-[#F8FAFC]"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {fix.fixKey} · {fix.title}
                      </p>
                      <p className="text-xs text-muted">
                        {fix.runItem.case.project.name} · {fix.severity}
                      </p>
                    </div>
                    <FixBadge status={fix.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {admin && overdueItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-medium text-warning">Team overdue testing</h2>
            <div className="rounded-[3px] border border-warning/30 bg-card">
              {overdueItems.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
                  <p className="text-sm">
                    {item.case.caseKey} · {item.case.title}
                  </p>
                  <p className="text-xs text-muted">
                    {item.assignee?.name ?? "Unassigned"} · {item.case.project.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
