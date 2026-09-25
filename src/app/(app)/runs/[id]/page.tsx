import Link from "next/link";
import { notFound } from "next/navigation";
import { canManageRuns, requireSession } from "@/lib/auth";
import { findTestRunDetail, findUsers } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { PriorityBadge, ResultBadge } from "@/components/ui/status-badge";
import { assignItemsAction, closeRunAction } from "@/app/actions/runs";
import { formatDate, percent, roleLabel } from "@/lib/format";
import { WorkspaceSwitch } from "@/components/projects/workspace-switch";
import { BackLink } from "@/components/ui/back-link";
import { FormPendingLoader } from "@/components/ui/app-loader";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const manage = await canManageRuns(user.role);

  const run = await findTestRunDetail(id);
  if (!run) notFound();

  const people = await findUsers({ active: true, orderBy: "createdAt" });

  const counts = {
    total: run.items.length,
    pending: run.items.filter((i) => i.result === "pending").length,
    progress: run.items.filter((i) => i.result === "in_progress").length,
    pass: run.items.filter((i) => i.result === "pass").length,
    fail: run.items.filter((i) => i.result === "fail").length,
    blocked: run.items.filter((i) => i.result === "blocked").length,
    skipped: run.items.filter((i) => i.result === "skipped").length,
    done: run.items.filter((i) => ["pass", "fail", "blocked", "skipped"].includes(i.result)).length,
    unassigned: run.items.filter((i) => !i.assigneeId).length,
  };

  return (
    <>
      <Topbar user={user} title={run.name} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <BackLink href={`/projects/${run.projectId}/testing`} label={`${run.project.name} · Testing`} />
            <h1 className="mt-2 text-2xl font-normal tracking-tight">{run.name}</h1>
            <p className="text-sm text-muted">
              {run.build ? `Build ${run.build} · ` : ""}
              Due {formatDate(run.dueDate)} · {run.status}
            </p>
          </div>
          <WorkspaceSwitch projectId={run.projectId} active="testing" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Complete" value={`${percent(counts.done, counts.total)}%`} hint={`${counts.done}/${counts.total} points`} tone="blue" />
          <StatCard label="Pass" value={counts.pass} tone="green" />
          <StatCard label="Fail" value={counts.fail} tone="red" />
          <StatCard label="Unassigned" value={counts.unassigned} tone={counts.unassigned ? "orange" : "default"} />
        </div>

        {manage && run.status === "open" ? (
          <form action={assignItemsAction} className="rounded-xl border border-line bg-card p-4">
            <FormPendingLoader />
            <input type="hidden" name="runId" value={run.id} />
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Assign selected to</span>
                <select name="assigneeId" required className="rounded-lg border border-line px-3 py-2 text-sm">
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {roleLabel(person.role)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-hover">
                Assign
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium"></th>
                    <th className="px-3 py-3 font-medium">Point</th>
                    <th className="px-3 py-3 font-medium">Page</th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Assignee</th>
                    <th className="px-3 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {run.items.map((item) => {
                    const canOpen =
                      manage || item.assigneeId === user.id;
                    return (
                      <tr key={item.id} className="border-t border-line">
                        <td className="px-3 py-3">
                          <input type="checkbox" name="itemIds" value={item.id} className="accent-blue" />
                        </td>
                        <td className="px-3 py-3">
                          {canOpen ? (
                            <Link href={`/execute/${item.id}`} className="font-medium text-blue hover:underline">
                              {item.case.caseKey} · {item.case.title}
                            </Link>
                          ) : (
                            <span>
                              {item.case.caseKey} · {item.case.title}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted">{item.case.page?.name ?? "—"}</td>
                        <td className="px-3 py-3">
                          <PriorityBadge priority={item.case.priority} />
                        </td>
                        <td className="px-3 py-3 text-muted">{item.assignee?.name ?? "—"}</td>
                        <td className="px-3 py-3">
                          <ResultBadge result={item.result} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </form>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Point</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {run.items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      {item.case.caseKey} · {item.case.title}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.assignee?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <ResultBadge result={item.result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {manage && run.status === "open" ? (
          <form action={closeRunAction} className="flex max-w-xl items-end gap-3">
            <FormPendingLoader />
            <input type="hidden" name="runId" value={run.id} />
            <label className="block flex-1">
              <span className="mb-1 block text-xs text-muted">
                Reason required if {counts.pending + counts.progress} items are still open
              </span>
              <input name="reason" className="w-full rounded-lg border border-line px-3 py-2 text-sm" placeholder="Force-close reason" />
            </label>
            <button className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-[#F1F5F9]">
              Close run
            </button>
          </form>
        ) : null}
      </main>
    </>
  );
}
