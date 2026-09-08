import Link from "next/link";
import { canManage, requireSession } from "@/lib/auth";
import { findMyWork } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { FixBadge, PriorityBadge, ResultBadge } from "@/components/ui/status-badge";
import { formatDate, isOverdue } from "@/lib/format";

export default async function MyWorkPage() {
  const user = await requireSession();

  const { myItems, myFixes, retests, overdueItems, unassignedFails, openRuns } =
    await findMyWork(user.id);

  const admin = canManage(user.role);
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
      <Topbar user={user} title="My Work" />
      <main className="flex-1 space-y-6 bg-[#f4f5f7] p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">My Work</h1>
          <p className="mt-1 text-sm text-muted">
            Your assigned test points and fixes.
          </p>
        </div>

        {admin ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open run points"
              value={`${doneOpen}/${totalOpen || 0}`}
              hint="Done vs total across open runs"
              tone="blue"
            />
            <StatCard
              label="Overdue"
              value={overdueItems.length}
              tone={overdueItems.length ? "orange" : "default"}
            />
            <StatCard
              label="Unassigned fails"
              value={unassignedFails.length}
              tone={unassignedFails.length ? "red" : "default"}
            />
            <StatCard label="Open runs" value={openRuns.length} />
          </div>
        ) : null}

        {(user.role === "TESTER" || admin) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Test points</h2>
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
              <div className="overflow-hidden rounded-xl border border-line bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f9fa] text-xs uppercase tracking-wide text-muted">
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
                      <tr key={item.id} className="border-t border-line hover:bg-[#f8f9fa]">
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

        {(user.role === "TESTER" || admin) && retests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-medium">Ready for retest</h2>
            <div className="overflow-hidden rounded-xl border border-line bg-card">
              {retests.map((fix) => (
                <Link
                  key={fix.id}
                  href={`/execute/${fix.runItemId}`}
                  className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-[#f8f9fa]"
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

        {(user.role === "FIXER" || admin) && (
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
              <div className="overflow-hidden rounded-xl border border-line bg-card">
                {myFixes.map((fix) => (
                  <Link
                    key={fix.id}
                    href={`/fixes/${fix.id}`}
                    className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-[#f8f9fa]"
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
            <h2 className="text-base font-medium text-warning">Team overdue</h2>
            <div className="rounded-xl border border-warning/30 bg-card">
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
