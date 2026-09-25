import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canAddCases, canManageRuns, hasAccess, homeForRole, requireSession } from "@/lib/auth";
import { findProjectDashboard } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, ResultBadge } from "@/components/ui/status-badge";
import { TestingNav } from "@/components/projects/testing-nav";
import { percent } from "@/lib/format";
import { casesHref, newCaseHref, newRunHref } from "@/lib/workspace";

export default async function ProjectTestingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  if (!(await hasAccess(user.role, "testing"))) redirect(await homeForRole(user.role));
  const manage = await canManageRuns(user.role);
  const canAdd = await canAddCases(user.role);
  const project = await findProjectDashboard(id);
  if (!project) notFound();

  const run = project.runs[0];
  const items = run?.items ?? [];
  const counts = {
    total: items.length,
    pass: items.filter((item) => item.result === "pass").length,
    fail: items.filter((item) => item.result === "fail").length,
    blocked: items.filter((item) => item.result === "blocked").length,
    skipped: items.filter((item) => item.result === "skipped").length,
    done: items.filter((item) => ["pass", "fail", "blocked", "skipped"].includes(item.result)).length,
  };

  return (
    <>
      <Topbar user={user} title={`${project.name} · Testing`} />
      <main className="flex-1 space-y-6 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <TestingNav
          projectId={project.id}
          projectName={project.name}
          pageId={project.pages[0]?.id}
          active="overview"
          canAdd={canAdd}
          manage={manage}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Cases" value={project.cases.length} />
          <StatCard
            label="Complete"
            value={`${percent(counts.done, counts.total)}%`}
            tone="blue"
            hint={run?.name ?? "No run yet"}
          />
          <StatCard label="Pass" value={counts.pass} tone="green" />
          <StatCard label="Fail" value={counts.fail} tone="red" />
          <StatCard label="Blocked" value={counts.blocked} tone="orange" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[3px] border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#172033]">Test cases</h2>
              {canAdd ? (
                <Link href={newCaseHref(project.id)} className="text-sm font-medium text-[#2563EB] hover:underline">
                  Add case
                </Link>
              ) : null}
            </div>
            {project.cases.length === 0 ? (
              <EmptyState
                title="No test cases yet"
                body="Write the points to check: steps, expected result, and the page they belong to."
              >
                {canAdd ? (
                  <Link href={newCaseHref(project.id)} className="text-sm font-medium text-[#2563EB]">
                    Add the first case
                  </Link>
                ) : null}
              </EmptyState>
            ) : (
              <div className="mt-3 divide-y divide-[#E2E8F0]">
                {project.cases.slice(0, 8).map((testCase) => (
                  <div key={testCase.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#172033]">
                        {String(testCase.caseKey ?? "")} · {String(testCase.title ?? "")}
                      </p>
                      <p className="text-xs text-[#64748B]">{testCase.page?.name ?? "No page"}</p>
                    </div>
                    <PriorityBadge priority={String(testCase.priority ?? "P2")} />
                  </div>
                ))}
                {project.cases.length > 8 ? (
                  <Link href={casesHref(project.id)} className="block pt-3 text-sm font-medium text-[#2563EB] hover:underline">
                    View all {project.cases.length} cases
                  </Link>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-[3px] border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#172033]">Test runs</h2>
              {manage ? (
                <Link href={newRunHref(project.id)} className="text-sm font-medium text-[#2563EB] hover:underline">
                  New run
                </Link>
              ) : null}
            </div>
            {project.runs.length === 0 ? (
              <EmptyState
                title="No test run yet"
                body="Start a run to assign cases, record pass or fail, and track progress."
              >
                {manage && project.cases.length ? (
                  <Link href={newRunHref(project.id)} className="text-sm font-medium text-[#2563EB]">
                    Start a run
                  </Link>
                ) : null}
              </EmptyState>
            ) : (
              <div className="mt-3 divide-y divide-[#E2E8F0]">
                {project.runs.map((item) => {
                  const done = item.items.filter((row) =>
                    ["pass", "fail", "blocked", "skipped"].includes(row.result),
                  ).length;
                  return (
                    <Link
                      key={item.id}
                      href={`/runs/${item.id}`}
                      className="flex items-center justify-between py-2.5 hover:text-[#2563EB]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#172033]">{item.name}</p>
                        <p className="text-xs capitalize text-[#64748B]">{item.status}</p>
                      </div>
                      <p className="text-sm text-[#64748B]">
                        {done}/{item.items.length}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {run ? (
          <section className="overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white">
            <div className="border-b border-[#E2E8F0] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#172033]">Latest run · {run.name}</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 font-medium">Point</th>
                  <th className="px-4 py-3 font-medium">Page</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 12).map((item) => (
                  <tr key={item.id} className="border-t border-[#E2E8F0]">
                    <td className="px-4 py-3">
                      <Link href={`/execute/${item.id}`} className="font-medium text-[#2563EB] hover:underline">
                        {item.case.caseKey} · {item.case.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{item.case.page?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#64748B]">{item.assignee?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <ResultBadge result={item.result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </>
  );
}
