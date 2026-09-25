import { notFound } from "next/navigation";
import { hasAccess, requireProjectAccess } from "@/lib/auth";
import {
  findPageTaskDetail,
  findProjectMembers,
  findSiblingTasks,
  findTaskActivity,
  findTaskAttachments,
  findUsers,
} from "@/lib/data";
import { parseAssigneeIds, parseLinkedIds, taskKey } from "@/lib/task-key";
import { WorkQueueHeader } from "@/components/projects/work-queue-header";
import { IssueDetailView } from "@/components/projects/issue-detail-view";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string; taskId: string }>;
}) {
  const { id, pageId, taskId } = await params;
  const user = await requireProjectAccess(id);
  const canCreate = await hasAccess(user.role, "createTask");
  const canEdit = await hasAccess(user.role, "manageTask");
  const slaEdit = await hasAccess(user.role, "manageTask");
  const showTesting = await hasAccess(user.role, "testing");
  const canComment =
    canCreate ||
    canEdit ||
    (await hasAccess(user.role, "updateFix")) ||
    (await hasAccess(user.role, "testing"));

  const task = await findPageTaskDetail(taskId);
  if (!task || task.projectId !== id) notFound();

  const [people, activity, siblings, files, members] = await Promise.all([
    findUsers({ active: true, orderBy: "createdAt" }),
    findTaskActivity(task.id),
    findSiblingTasks(id, task.id),
    findTaskAttachments(task.id),
    findProjectMembers(id),
  ]);
  const developerIds = members.filter((member) => member.team === "developer").map((member) => member.userId);
  const teamPeople = developerIds.length ? people.filter((person) => developerIds.includes(person.id)) : people;

  const linkedIds = parseLinkedIds(task.linkedTaskIds);
  const linked = siblings.filter((item) => linkedIds.includes(item.id));
  const linkable = siblings.filter((item) => !linkedIds.includes(item.id)).slice(0, 12);
  const reporterName = task.reporter?.name ?? task.project.name;

  const toLinked = (item: { id: string; title: string; pageId: string; taskKey?: string | null; number?: number }) => ({
    id: item.id,
    taskKey: item.taskKey || taskKey(item.id, task.project.code, item.number),
    title: item.title,
    pageId: item.pageId,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#172033]">
      <WorkQueueHeader
        userName={user.name}
        canEdit={canCreate}
        projectId={task.projectId}
        projectName={task.project.name}
        pageId={pageId}
        pageName={task.page.name}
        people={teamPeople}
        workType="tasks"
        showTesting={showTesting}
      />
      <IssueDetailView
        canEdit={canEdit}
        canEditSla={slaEdit}
        canCreate={canCreate}
        canAdmin={canEdit}
        canWork={canEdit}
        canComment={canComment}
        role={user.role}
        currentUserId={user.id}
        currentUserName={user.name}
        people={teamPeople}
        comments={task.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          visibility: comment.visibility,
          createdAt: comment.createdAt.toISOString(),
          userName: comment.user.name,
          attachments: files
            .filter((file) => file.commentId === comment.id)
            .map((file) => ({
              id: file.id,
              fileName: file.fileName,
              mimeType: file.mimeType,
              size: file.size,
              path: file.path,
            })),
        }))}
        attachments={files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          mimeType: file.mimeType,
          size: file.size,
          path: file.path,
        }))}
        activity={activity.map((item) => ({
          id: item.id,
          message: item.message,
          createdAt: item.createdAt.toISOString(),
          userName: item.user.name,
        }))}
        subtasks={task.children.map(toLinked)}
        links={linked.map(toLinked)}
        linkable={linkable.map(toLinked)}
        task={{
          id: task.id,
          taskKey: task.taskKey || taskKey(task.id, task.project.code, task.number),
          projectId: task.projectId,
          projectName: task.project.name,
          projectType: "tasks",
          pageId: task.pageId,
          pageName: task.page.name,
          kind: task.kind,
          title: task.title,
          details: task.details,
          priority: task.priority,
          status: task.status,
          labels: task.labels ?? "",
          createdAt: task.createdAt.toISOString(),
          firstResponseAt: task.firstResponseAt?.toISOString() ?? null,
          resolutionAt: task.resolutionAt?.toISOString() ?? null,
          reporterName,
          assigneeId: task.assigneeId,
          assigneeName: task.assignee?.name ?? null,
          assigneeIds: parseAssigneeIds(task.assigneeIds, task.assigneeId),
        }}
      />
    </div>
  );
}
