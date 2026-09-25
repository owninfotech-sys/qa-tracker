import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, Figma, FolderKanban, ListChecks, Pencil, Plus, Sun } from "lucide-react";
import { canManage, hasAccess, homeForRole, requireSession } from "@/lib/auth";
import { findActiveProjectsList, findTodayTasks, findTodayTesting, findTodayDayReports, findUsers } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { TodayTaskList } from "@/components/projects/today-task-list";
import { TodayDoneReport } from "@/components/projects/today-done-report";
import { TodayTestingList, TodaySectionHeader } from "@/components/projects/today-testing-list";
import { parseTodayWork, TodayWorkSwitch } from "@/components/projects/today-work-switch";
import { formatDate, isOverdue, percent, toHref } from "@/lib/format";
import { todayHref } from "@/lib/workspace";
import { draftTodayDoneReport } from "@/lib/today";

function ProgressRow({
  icon: Icon,
  label,
  detail,
  value,
  href,
}: {
  icon: typeof ListChecks;
  label: string;
  detail: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="block rounded-[3px] px-1 py-1.5 hover:bg-[#F8FAFC]">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Icon size={13} className="text-blue" />
          {label}
        </span>
        <span className="text-muted">{detail}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#E2E8F0]">
        <div className="h-full rounded-[3px] bg-blue" style={{ width: `${value}%` }} />
      </div>
    </Link>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; work?: string }>;
}) {
  const user = await requireSession();
  if (!(await hasAccess(user.role, "projects"))) redirect(await homeForRole(user.role));
  const manage = await canManage(user.role);
  const canSeeTesting = await hasAccess(user.role, "testing");
  const { tab, work } = await searchParams;
  const todayTab = tab === "today";
  const todayWork = parseTodayWork(work);
  const [projects, todayTasks, todayTesting, todayReports, admins] = await Promise.all([
    findActiveProjectsList(),
    todayTab ? findTodayTasks() : Promise.resolve([]),
    todayTab ? findTodayTesting() : Promise.resolve([]),
    todayTab ? findTodayDayReports() : Promise.resolve([]),
    todayTab ? findUsers({ active: true, role: "ADMIN", orderBy: "createdAt" }) : Promise.resolve([]),
  ]);
  const remainingTasks = todayTasks.filter((task) => task.reason !== "done_today").length;
  const remainingTests = todayTesting.filter((item) => item.reason !== "done_today").length;
  const remainingToday = remainingTasks + remainingTests;
  const reportByProject = new Map(todayReports.map((item) => [item.projectId, item]));
  const todayProjects = Array.from(new Map(todayTasks.map((task) => [task.projectId, task])).values());
  const greetingName = admins[0]?.name ?? user.name;
  const showTasks = todayWork !== "testing";
  const showTesting = canSeeTesting && todayWork !== "tasks";

  return (
    <>
      <Topbar user={user} title={todayTab ? "Today's tasks" : "Projects"} />
      <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {todayTab ? "Today's tasks" : "Projects"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {todayTab
                ? remainingToday
                  ? `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} and ${remainingTests} test point${remainingTests === 1 ? "" : "s"} still to do today.`
                  : "Today’s task work and testing, split so each can be handled differently."
                : "Every project includes task management, today's work, and testing."}
            </p>
          </div>
          {manage && !todayTab ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-hover"
            >
              <Plus size={16} />
              New project
            </Link>
          ) : null}
        </div>

        <nav className="mb-6 flex gap-1 border-b border-[#E2E8F0]">
          <Link
            href="/projects"
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${
              !todayTab
                ? "border-[#2563EB] font-semibold text-[#2563EB]"
                : "border-transparent text-[#64748B] hover:text-[#172033]"
            }`}
          >
            <FolderKanban size={15} />
            All projects
          </Link>
          <Link
            href="/projects?tab=today"
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${
              todayTab
                ? "border-[#D97706] font-semibold text-[#D97706]"
                : "border-transparent text-[#64748B] hover:text-[#172033]"
            }`}
          >
            <Sun size={15} />
            Today&apos;s tasks
          </Link>
        </nav>

        {todayTab ? (
          <div>
            <TodayWorkSwitch
              href="/projects?tab=today"
              active={todayWork}
              taskCount={todayTasks.length}
              testingCount={todayTesting.length}
              showTesting={canSeeTesting}
            />
            {showTasks
              ? todayProjects.map((sample) => {
                  const grouped = todayTasks.filter((task) => task.projectId === sample.projectId);
                  const doneCount = grouped.filter((task) => task.reason === "done_today").length;
                  return (
                    <TodayDoneReport
                      key={sample.projectId}
                      projectId={sample.projectId}
                      projectName={sample.projectName}
                      pageId={sample.pageId}
                      draft={draftTodayDoneReport(grouped, { projectName: sample.projectName, greetingName })}
                      doneCount={doneCount}
                      report={reportByProject.get(sample.projectId)}
                    />
                  );
                })
              : null}
            {showTasks ? (
              <div className="mb-6">
                <TodaySectionHeader tone="tasks" title="Tasks" count={todayTasks.length} />
                <TodayTaskList tasks={todayTasks} />
              </div>
            ) : null}
            {showTesting ? (
              <div>
                <TodaySectionHeader tone="testing" title="Testing" count={todayTesting.length} />
                <TodayTestingList items={todayTesting} />
              </div>
            ) : null}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            body="Create a project to assign tasks and run testing in the same place."
          >
            {manage ? (
              <Link href="/projects/new" className="text-sm font-medium text-blue">
                Create project
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const taskTotal = project.work.total;
              const taskPct = percent(project.work.done, taskTotal);
              const latest = project.runs[0];
              const testTotal = latest?.items.length ?? 0;
              const testDone =
                latest?.items.filter((item) =>
                  ["pass", "fail", "blocked", "skipped"].includes(item.result),
                ).length ?? 0;
              const testPct = percent(testDone, testTotal);

              return (
                <article
                  key={project.id}
                  className="flex h-full flex-col overflow-hidden rounded-[3px] border border-line bg-card shadow-[0_1px_2px_rgba(60,64,67,.06)]"
                >
                  <div className="flex items-start gap-3 px-5 pt-5 pb-3">
                    <Link href={`/projects/${project.id}`} className="flex min-w-0 flex-1 items-start gap-3 hover:opacity-90">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-blue-soft text-blue">
                        <FolderKanban size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-ink">{project.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {project.code} · {project.pages.length} areas · {project.cases.length} test points
                        </p>
                      </div>
                    </Link>
                    {manage ? (
                      <Link
                        href={`/projects/${project.id}/edit`}
                        title="Edit project"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                      >
                        <Pencil size={14} />
                      </Link>
                    ) : null}
                  </div>
                  {project.deadline || toHref(project.figmaUrl) ? (
                    <div className="flex flex-wrap items-center gap-3 px-5 pb-3 text-xs">
                      {project.deadline ? (
                        <span className={isOverdue(project.deadline) ? "font-medium text-danger" : "text-muted"}>
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
                          <Figma size={12} />
                          Figma
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-auto space-y-2 border-t border-line px-4 py-3">
                    <ProgressRow
                      icon={ListChecks}
                      label="Tasks"
                      detail={
                        taskTotal
                          ? `${project.work.done}/${taskTotal} · ${taskPct}%`
                          : "No tasks yet"
                      }
                      value={taskPct}
                      href={`/projects/${project.id}/pages`}
                    />
                    <ProgressRow
                      icon={Sun}
                      label="Today"
                      detail={
                        project.work.today
                          ? `${project.work.today} to do today`
                          : "Clear today"
                      }
                      value={project.work.today ? 40 : 100}
                      href={todayHref(project.id)}
                    />
                    {canSeeTesting ? (
                    <ProgressRow
                      icon={ClipboardCheck}
                      label="Testing"
                      detail={
                        testTotal
                          ? `${testDone}/${testTotal} · ${testPct}%`
                          : "No test run yet"
                      }
                      value={testPct}
                      href={`/projects/${project.id}/testing`}
                    />
                    ) : null}
                  </div>

                  {manage ? (
                    <div className="flex items-center justify-end border-t border-line px-4 py-2.5">
                      <DeleteProjectButton id={project.id} name={project.name} compact />
                    </div>
                  ) : null}
                </article>
              );
            })}
            {manage ? (
              <Link
                href="/projects/new"
                className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[3px] border border-dashed border-line bg-card px-5 py-8 text-center shadow-[0_1px_2px_rgba(60,64,67,.06)] transition hover:border-blue hover:bg-blue-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-blue-soft text-blue">
                  <Plus size={20} />
                </span>
                <span className="text-sm font-semibold text-ink">New project</span>
                <span className="text-xs text-muted">Tasks and testing in one project</span>
              </Link>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
