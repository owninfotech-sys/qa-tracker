import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardCheck, Figma, ListChecks, Pencil, Sun } from "lucide-react";
import { canManage, hasAccess, requireSession } from "@/lib/auth";
import { findProjectDashboard, findTodayTasks } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { BackLink } from "@/components/ui/back-link";
import { addProjectPagesAction, removeProjectPageAction } from "@/app/actions/projects";
import { PageNameFields } from "@/components/projects/page-name-fields";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { WorkspaceSwitch } from "@/components/projects/workspace-switch";
import { formatDate, hrefLabel, isOverdue, percent, toHref } from "@/lib/format";
import { tasksHref, testingHref, todayHref } from "@/lib/workspace";
import { FormPendingLoader } from "@/components/ui/app-loader";

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
  const manage = await canManage(user.role);
  const showTesting = await hasAccess(user.role, "testing");
  const project = await findProjectDashboard(id);
  if (!project) notFound();
  const todayTasks = await findTodayTasks(id);
  const todayOpen = todayTasks.filter((task) => task.reason !== "done_today").length;

  const firstPageId = project.pages[0]?.id ?? null;
  const taskTotal = project.pages.reduce((sum, page) => sum + page.tasks.length, 0);
  const taskDone = project.pages.reduce(
    (sum, page) => sum + page.tasks.filter((task) => task.status === "done" || task.status === "wont_do").length,
    0,
  );
  const run = project.runs[0];
  const items = run?.items ?? [];
  const testTotal = items.length;
  const testDone = items.filter((item) => ["pass", "fail", "blocked", "skipped"].includes(item.result)).length;

  return (
    <>
      <Topbar user={user} title={project.name} />
      <main className="flex-1 space-y-6 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <BackLink href="/projects" label="Projects" />
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#172033]">
              {project.name}
              <span className="ml-2 align-middle text-sm font-semibold text-[#64748B]">{project.code}</span>
            </h1>
            {toHref(project.url) ? (
              <a
                href={toHref(project.url) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-[#2563EB] hover:underline"
              >
                {hrefLabel(project.url)}
              </a>
            ) : (
              <p className="mt-1 text-sm text-[#64748B]">No site URL set</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {project.deadline ? (
                <span className={isOverdue(project.deadline) ? "font-medium text-[#DC2626]" : "text-[#64748B]"}>
                  Deadline {formatDate(project.deadline)}
                </span>
              ) : null}
              {toHref(project.figmaUrl) ? (
                <a
                  href={toHref(project.figmaUrl) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#2563EB] hover:underline"
                >
                  <Figma size={14} />
                  Figma
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkspaceSwitch projectId={project.id} pageId={firstPageId} active="tasks" showTesting={showTesting} />
            {manage ? (
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#172033] hover:bg-[#F8FAFC]"
              >
                <Pencil size={14} />
                Edit
              </Link>
            ) : null}
            {manage ? <DeleteProjectButton id={project.id} name={project.name} /> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={tasksHref(project.id, firstPageId)}
            className="rounded-[3px] border border-[#E2E8F0] bg-white p-5 transition hover:border-[#2563EB]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#EFF6FF] text-[#2563EB]">
              <ListChecks size={18} />
            </span>
            <h2 className="mt-3 text-base font-semibold text-[#172033]">Tasks</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Create work, assign the team, and move status from To do to Done.
            </p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-[#64748B]">
                <span>Progress</span>
                <span>{taskTotal ? `${taskDone}/${taskTotal} · ${percent(taskDone, taskTotal)}%` : "No tasks yet"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#E2E8F0]">
                <div className="h-full bg-[#2563EB]" style={{ width: `${percent(taskDone, taskTotal)}%` }} />
              </div>
            </div>
          </Link>

          <Link
            href={todayHref(project.id)}
            className="rounded-[3px] border border-[#E2E8F0] bg-white p-5 transition hover:border-[#D97706]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#FEF3C7] text-[#D97706]">
              <Sun size={18} />
            </span>
            <h2 className="mt-3 text-base font-semibold text-[#172033]">Today</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Work due today, overdue, or already in progress for this project.
            </p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-[#64748B]">
                <span>Today</span>
                <span>{todayOpen ? `${todayOpen} to do` : "Clear today"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#E2E8F0]">
                <div className="h-full bg-[#D97706]" style={{ width: `${todayOpen ? 40 : 100}%` }} />
              </div>
            </div>
          </Link>

          {showTesting ? (
          <Link
            href={testingHref(project.id)}
            className="rounded-[3px] border border-[#E2E8F0] bg-white p-5 transition hover:border-[#2563EB]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#EFF6FF] text-[#2563EB]">
              <ClipboardCheck size={18} />
            </span>
            <h2 className="mt-3 text-base font-semibold text-[#172033]">Testing</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Add cases, start a run, assign testers, and record pass, fail, or blocked.
            </p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-[#64748B]">
                <span>Latest run</span>
                <span>
                  {testTotal ? `${testDone}/${testTotal} · ${percent(testDone, testTotal)}%` : "No test run yet"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#E2E8F0]">
                <div className="h-full bg-[#2563EB]" style={{ width: `${percent(testDone, testTotal)}%` }} />
              </div>
            </div>
          </Link>
          ) : null}
        </div>

        <section className="rounded-[3px] border border-[#E2E8F0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#172033]">Areas</h2>
          <p className="mt-1 text-xs text-[#64748B]">Shared by tasks and testing. Add a page name once, then use it in both workspaces.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.pages.length === 0 ? (
              <p className="text-sm text-[#64748B]">No areas yet. Add them below.</p>
            ) : (
              project.pages.map((page) => (
                <span
                  key={page.id}
                  className="inline-flex items-center gap-1 rounded-[3px] bg-[#EFF6FF] px-2.5 py-1 text-xs font-medium text-[#2563EB]"
                >
                  <Link href={tasksHref(project.id, page.id)} className="hover:underline">
                    {page.name}
                  </Link>
                  {manage ? (
                    <form action={removeProjectPageAction}>
                      <FormPendingLoader />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="pageId" value={page.id} />
                      <button className="text-[#2563EB]/70 hover:text-[#DC2626]" aria-label={`Remove ${page.name}`}>
                        ×
                      </button>
                    </form>
                  ) : null}
                </span>
              ))
            )}
          </div>
          {error ? (
            <p className="mt-3 rounded-[3px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{error}</p>
          ) : null}
          {manage ? (
            <form action={addProjectPagesAction} className="mt-4 space-y-3">
              <FormPendingLoader />
              <input type="hidden" name="projectId" value={project.id} />
              <PageNameFields
                resetKey={project.pages.map((page) => page.id).join("-")}
                hint="Type a new area name. Existing names are not added again."
              />
              <button className="rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#172033] hover:bg-[#F1F5F9]">
                Save areas
              </button>
            </form>
          ) : null}
        </section>
      </main>
    </>
  );
}
