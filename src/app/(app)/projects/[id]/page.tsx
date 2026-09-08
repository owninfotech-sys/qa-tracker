import Link from "next/link";
import { notFound } from "next/navigation";
import { AppWindow, Globe } from "lucide-react";
import { canManage, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { ResultBadge } from "@/components/ui/status-badge";
import { percent } from "@/lib/format";
import { addProjectPagesAction, removeProjectPageAction } from "@/app/actions/projects";
import { PageNameFields } from "@/components/projects/page-name-fields";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { hrefLabel, toHref } from "@/lib/format";

export default async function ProjectDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;
  const manage = canManage(user.role);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      pages: { include: { cases: true, tasks: true }, orderBy: { name: "asc" } },
      cases: { include: { page: true } },
      runs: {
        include: { items: { include: { assignee: true, case: { include: { page: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  const run = project.runs[0];
  const items = run?.items ?? [];
  const counts = {
    total: items.length,
    pending: items.filter((i) => i.result === "pending").length,
    pass: items.filter((i) => i.result === "pass").length,
    fail: items.filter((i) => i.result === "fail").length,
    blocked: items.filter((i) => i.result === "blocked").length,
    skipped: items.filter((i) => i.result === "skipped").length,
    done: items.filter((i) => ["pass", "fail", "blocked", "skipped"].includes(i.result)).length,
  };

  const byPage = project.pages.map((page) => {
    const pageItems = items.filter((item) => item.case.pageId === page.id);
    const runDone = pageItems.filter((item) =>
      ["pass", "fail", "blocked", "skipped"].includes(item.result),
    ).length;
    const taskDone = page.tasks.filter((task) => task.status === "done").length;
    const total = page.tasks.length || pageItems.length || page.cases.length;
    const done = page.tasks.length ? taskDone : runDone;
    return { id: page.id, name: page.name, done, total };
  });

  return (
    <>
      <Topbar user={user} title={project.name} />
      <main className="flex-1 space-y-6 bg-[#f4f5f7] p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/projects" className="text-sm font-medium text-[#0c66e4] hover:underline">
              Projects
            </Link>
            <div className="mt-2 flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0c66e4] text-white shadow-[0_1px_2px_#091e4240]"
                title={project.type}
              >
                {project.type.toLowerCase() === "app" ? <AppWindow size={22} /> : <Globe size={22} />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[26px] font-semibold tracking-tight text-[#172b4d]">{project.name}</h1>
                  <span className="rounded-full bg-[#dfe1e6] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#44546f]">
                    {project.type}
                  </span>
                </div>
            {toHref(project.url) ? (
              <a
                href={toHref(project.url) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-[#0c66e4] hover:underline"
              >
                {hrefLabel(project.url)}
              </a>
            ) : (
              <p className="mt-1 text-sm text-[#626f86]">No site URL set</p>
            )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.pages[0] ? (
              <Link
                href={`/projects/${project.id}/pages/${project.pages[0].id}`}
                className="rounded-[3px] border border-[#dcdfe4] bg-white px-3.5 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#f1f2f4]"
              >
                Page tasks
              </Link>
            ) : null}
            <Link
              href={`/projects/${project.id}/cases`}
              className="rounded-[3px] border border-[#dcdfe4] bg-white px-3.5 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#f1f2f4]"
            >
              Test cases
            </Link>
            {manage ? (
              <Link
                href={`/runs/new?projectId=${project.id}`}
                className="rounded-[3px] bg-[#0c66e4] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
              >
                New run
              </Link>
            ) : null}
            {manage ? <DeleteProjectButton id={project.id} name={project.name} /> : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Cases" value={project.cases.length} />
          <StatCard label="Complete" value={`${percent(counts.done, counts.total)}%`} tone="blue" hint={run?.name ?? "No run"} />
          <StatCard label="Pass" value={counts.pass} tone="green" />
          <StatCard label="Fail" value={counts.fail} tone="red" />
          <StatCard label="Blocked" value={counts.blocked} tone="orange" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#dcdfe4] bg-white p-5 shadow-[0_1px_1px_#091e420a]">
            <h2 className="text-sm font-semibold text-[#172b4d]">Pages</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.pages.length === 0 ? (
                <p className="text-sm text-[#626f86]">No pages yet. Add them below.</p>
              ) : (
                project.pages.map((page) => (
                  <span
                    key={page.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#e9f2ff] px-2.5 py-1 text-xs font-medium text-[#0c66e4]"
                  >
                    <Link href={`/projects/${project.id}/pages/${page.id}`} className="hover:underline">
                      {page.name}
                    </Link>
                    {manage ? (
                      <form action={removeProjectPageAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="pageId" value={page.id} />
                        <button className="text-[#0c66e4]/70 hover:text-[#c9372c]" aria-label={`Remove ${page.name}`}>
                          ×
                        </button>
                      </form>
                    ) : null}
                  </span>
                ))
              )}
            </div>
            {error ? (
              <p className="mt-3 rounded-lg bg-[#ffeceb] px-3 py-2 text-sm text-[#ae2e24]">{error}</p>
            ) : null}
            {manage ? (
              <form action={addProjectPagesAction} className="mt-4 space-y-3">
                <input type="hidden" name="projectId" value={project.id} />
                <PageNameFields
                  resetKey={project.pages.map((page) => page.id).join("-")}
                  hint="Type a new page name. Existing names are not added again."
                />
                <button className="rounded-[3px] border border-[#dcdfe4] px-3 py-2 text-sm font-medium text-[#172b4d] hover:bg-[#f1f2f4]">
                  Save pages
                </button>
              </form>
            ) : null}
          </section>

          <section className="rounded-xl border border-[#dcdfe4] bg-white p-5 shadow-[0_1px_1px_#091e420a]">
            <h2 className="text-sm font-semibold text-[#172b4d]">By page</h2>
            <p className="mt-1 text-xs text-[#626f86]">Click a page to open its task board.</p>
            <div className="mt-4 space-y-3">
              {byPage.length === 0 ? (
                <p className="text-sm text-[#626f86]">Add pages to track progress.</p>
              ) : (
                byPage.map((page) => (
                  <Link
                    key={page.id}
                    href={`/projects/${project.id}/pages/${page.id}`}
                    className="block rounded-lg px-2 py-2 hover:bg-[#f7f8f9]"
                  >
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-[#172b4d]">{page.name}</span>
                      <span className="text-[#626f86]">
                        {page.done}/{page.total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#ebecf0]">
                      <div
                        className="h-full bg-[#0c66e4]"
                        style={{ width: `${percent(page.done, page.total)}%` }}
                      />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#dcdfe4] bg-white p-5 shadow-[0_1px_1px_#091e420a] lg:col-span-2">
            <h2 className="text-sm font-semibold text-[#172b4d]">Runs</h2>
            <div className="mt-3 divide-y divide-[#dcdfe4]">
              {project.runs.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#626f86]">No runs yet.</p>
              ) : (
                project.runs.map((item) => {
                  const done = item.items.filter((row) =>
                    ["pass", "fail", "blocked", "skipped"].includes(row.result),
                  ).length;
                  return (
                    <Link key={item.id} href={`/runs/${item.id}`} className="flex items-center justify-between py-3 hover:text-[#0c66e4]">
                      <div>
                        <p className="text-sm font-medium text-[#172b4d]">{item.name}</p>
                        <p className="text-xs capitalize text-[#626f86]">{item.status}</p>
                      </div>
                      <p className="text-sm text-[#626f86]">
                        {done}/{item.items.length}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {run ? (
          <section className="overflow-hidden rounded-xl border border-[#dcdfe4] bg-white shadow-[0_1px_1px_#091e420a]">
            <div className="border-b border-[#dcdfe4] px-5 py-3">
              <h2 className="text-sm font-semibold text-[#172b4d]">Latest run · {run.name}</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa] text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Point</th>
                  <th className="px-4 py-3 font-medium">Page</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 12).map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      {item.case.caseKey} · {item.case.title}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.case.page?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{item.assignee?.name ?? "Unassigned"}</td>
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
