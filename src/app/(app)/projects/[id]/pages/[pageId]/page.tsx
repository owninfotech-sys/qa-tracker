import { notFound } from "next/navigation";
import { hasAccess, requireSession } from "@/lib/auth";
import { findPageTasksForBoard, findProjectWorkQueue, findUsers } from "@/lib/data";
import { parseAssigneeIds, taskKey } from "@/lib/task-key";
import { loadSortOrders } from "@/lib/task-order";
import { PageTaskList } from "@/components/projects/page-task-list";
import { WorkQueueHeader } from "@/components/projects/work-queue-header";
import { WorkQueueSidebar } from "@/components/projects/work-queue-sidebar";
import { BackLink } from "@/components/ui/back-link";

export default async function PageTaskDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; pageId: string }>;
  searchParams: Promise<{ error?: string; add?: string; queue?: string; view?: string }>;
}) {
  const user = await requireSession();
  const { id, pageId } = await params;
  const { error, add, queue, view } = await searchParams;
  const canCreate = await hasAccess(user.role, "createTask");
  const canEdit = await hasAccess(user.role, "manageTask");
  const showTesting = await hasAccess(user.role, "testing");
  const canViewAll = await hasAccess(user.role, "viewAll");

  const project = await findProjectWorkQueue(id);
  if (!project) notFound();

  const page = project.pages.find((item) => item.id === pageId);
  if (!page) notFound();

  const allTasks = await findPageTasksForBoard(project.id);
  const sortOrders = await loadSortOrders(project.id);
  allTasks.sort(
    (a, b) =>
      (sortOrders.get(a.id) ?? 0) - (sortOrders.get(b.id) ?? 0) || b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const isUnassigned = (task: (typeof allTasks)[number]) =>
    parseAssigneeIds(task.assigneeIds, task.assigneeId).length === 0;

  const filtered = allTasks.filter((task) => {
    if (queue === "open") {
      return task.status !== "done" && task.status !== "wont_do";
    }
    if (queue === "unassigned") return isUnassigned(task);
    return task.pageId === page.id;
  });

  const people = (await findUsers({ active: true, orderBy: "createdAt" })).map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
  }));
  const peopleById = new Map(people.map((person) => [person.id, person.name]));

  const toListTask = (task: (typeof allTasks)[number]) => {
    const assigneeIds = parseAssigneeIds(task.assigneeIds, task.assigneeId);
    const assigneeNames = assigneeIds
      .map((id) => peopleById.get(id) ?? (id === task.assigneeId ? task.assignee?.name : null))
      .filter((name): name is string => Boolean(name));
    return {
      id: task.id,
      taskKey: task.taskKey || taskKey(task.id, project.code, task.number),
      projectId: task.projectId,
      pageId: task.pageId,
      pageName: task.page.name,
      kind: task.kind,
      title: task.title,
      details: task.details,
      priority: task.priority,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      reporterName: task.reporter?.name ?? project.owner.name,
      assigneeId: task.assigneeId,
      assigneeIds,
      assigneeName: assigneeNames[0] ?? null,
      assigneeNames,
      commentCount: task._count.comments,
      resolutionAt: task.resolutionAt?.toISOString() ?? null,
      sortOrder: sortOrders.get(task.id) ?? 0,
      href: `/projects/${task.projectId}/pages/${task.pageId}/tasks/${task.id}`,
    };
  };

  const tasks = filtered.map(toListTask);
  const boardTasks = allTasks.map(toListTask);

  const openCount = allTasks.filter(
    (task) => task.status !== "done" && task.status !== "wont_do",
  ).length;
  const unassignedCount = allTasks.filter(isUnassigned).length;
  const title =
    queue === "open"
      ? "All open"
      : queue === "unassigned"
        ? "Unassigned"
        : page.name;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFC] text-[#172033]">
      <WorkQueueHeader
        userName={user.name}
        canEdit={canCreate}
        projectId={project.id}
        projectName={project.name}
        pageId={page.id}
        pageName={page.name}
        people={people}
        error={error}
        defaultOpen={canCreate && (add === "1" || Boolean(error))}
        workType="tasks"
        showTesting={showTesting}
      />

      <div className="relative flex min-h-0 flex-1">
        <WorkQueueSidebar
          projectId={project.id}
          projectName={project.name}
          projectCode={project.code}
          pageId={page.id}
          pages={project.pages.map((item) => ({ id: item.id, name: item.name, count: item.tasks.length }))}
          queue={queue}
          view={view}
          openCount={openCount}
          totalCount={unassignedCount}
          canReorder={canEdit}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white px-4 pt-5 sm:px-6 sm:pt-6">
          <BackLink href={`/projects/${project.id}`} label={project.name} />
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-[#172033]">{title}</h1>
          <div className="mt-5 flex min-h-0 flex-1 flex-col pb-0">
            <PageTaskList
              tasks={tasks}
              boardTasks={boardTasks}
              canEdit={canEdit}
              currentUserId={user.id}
              role={user.role}
              view={view === "board" ? "board" : "list"}
              basePath={`/projects/${project.id}/pages/${page.id}`}
              queue={queue}
              workType="tasks"
              projectId={project.id}
              pageId={page.id}
              canViewAll={canViewAll}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
