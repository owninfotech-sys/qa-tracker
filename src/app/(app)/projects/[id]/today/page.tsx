import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { hasAccess, requireProjectAccess } from "@/lib/auth";
import { findProjectById, findFirstPage, findTodayTasks, findTodayTesting, findOpenDayReport, findUsers } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { BackLink } from "@/components/ui/back-link";
import { WorkspaceSwitch } from "@/components/projects/workspace-switch";
import { TodayTaskList } from "@/components/projects/today-task-list";
import { TodayDoneReport } from "@/components/projects/today-done-report";
import { TodayTestingList, TodaySectionHeader } from "@/components/projects/today-testing-list";
import { parseTodayWork, TodayWorkSwitch } from "@/components/projects/today-work-switch";
import { EmptyState } from "@/components/ui/empty-state";
import { tasksHref, testingHref } from "@/lib/workspace";
import { draftTodayDoneReport } from "@/lib/today";

export default async function ProjectTodayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ work?: string }>;
}) {
  const { id } = await params;
  const user = await requireProjectAccess(id);
  const canSeeTesting = await hasAccess(user.role, "testing");
  const { work } = await searchParams;
  const project = await findProjectById(id);
  if (!project) notFound();
  const todayWork = parseTodayWork(work);
  const [firstPage, tasks, testing, report, admins] = await Promise.all([
    findFirstPage(id),
    findTodayTasks(id),
    findTodayTesting(id),
    findOpenDayReport(id),
    findUsers({ active: true, role: "ADMIN", orderBy: "createdAt" }),
  ]);
  const remainingTasks = tasks.filter((task) => task.reason !== "done_today").length;
  const remainingTests = testing.filter((item) => item.reason !== "done_today").length;
  const remaining = remainingTasks + remainingTests;
  const doneCount = tasks.filter((task) => task.reason === "done_today").length;
  const greetingName = admins[0]?.name ?? user.name;
  const showTasks = todayWork !== "testing";
  const showTesting = canSeeTesting && todayWork !== "tasks";

  return (
    <>
      <Topbar user={user} title={`${project.name} · Today`} />
      <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <BackLink href={`/projects/${project.id}`} label={project.name} />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-[26px] font-semibold tracking-tight text-[#172033]">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-[#FEF3C7] text-[#D97706]">
                  <CalendarClock size={20} />
                </span>
                Today&apos;s tasks
              </h1>
              <p className="mt-1.5 text-sm text-[#64748B]">
                {remaining
                  ? `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} and ${remainingTests} test point${remainingTests === 1 ? "" : "s"} to do today in ${project.name}.`
                  : `No open task or testing work due today in ${project.name}.`}
              </p>
            </div>
            <WorkspaceSwitch projectId={project.id} pageId={firstPage?.id} active="today" showTesting={canSeeTesting} />
          </div>
        </div>
        <TodayWorkSwitch
          href={`/projects/${project.id}/today`}
          active={todayWork}
          taskCount={tasks.length}
          testingCount={testing.length}
          showTesting={canSeeTesting}
        />
        {showTasks ? (
          <TodayDoneReport
            projectId={project.id}
            projectName={project.name}
            pageId={firstPage?.id}
            draft={draftTodayDoneReport(tasks, { projectName: project.name, greetingName })}
            doneCount={doneCount}
            report={report}
            allDone={remainingTasks === 0}
          />
        ) : null}
        {showTasks && showTesting && tasks.length === 0 && testing.length === 0 ? (
          <EmptyState
            compact
            title="Nothing on today's list"
            body="Open tasks and test points that are due today, overdue, in progress, or created today will show here."
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={tasksHref(project.id, firstPage?.id)} className="text-sm font-medium text-[#2563EB]">
                Open all tasks
              </Link>
              <Link href={testingHref(project.id)} className="text-sm font-medium text-[#7C3AED]">
                Open testing
              </Link>
            </div>
          </EmptyState>
        ) : (
          <>
            {showTasks ? (
              <div className="mb-6">
                <TodaySectionHeader tone="tasks" title="Tasks" count={tasks.length} />
                <TodayTaskList tasks={tasks} showProject={false} emptyHref={tasksHref(project.id, firstPage?.id)} />
              </div>
            ) : null}
            {showTesting ? (
              <div>
                <TodaySectionHeader tone="testing" title="Testing" count={testing.length} />
                <TodayTestingList items={testing} showProject={false} emptyHref={testingHref(project.id)} />
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
