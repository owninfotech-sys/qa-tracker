import { notFound } from "next/navigation";
import {
  canAddCases,
  canEditContent,
  canEditSla,
  canWorkAssignedTask,
  isAdmin,
  requireSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAssigneeIds, parseLinkedIds, taskKey } from "@/lib/task-key";
import { WorkQueueHeader } from "@/components/projects/work-queue-header";
import { IssueDetailView } from "@/components/projects/issue-detail-view";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string; taskId: string }>;
}) {
  const user = await requireSession();
  const { id, pageId, taskId } = await params;
  const canCreate = canAddCases(user.role);
  const canEdit = canEditContent(user.role);
  const slaEdit = canEditSla(user.role);

  const task = await prisma.pageTask.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { name: true } },
      page: { select: { name: true } },
      assignee: { select: { id: true, name: true } },
      reporter: { select: { name: true } },
      children: { select: { id: true, title: true, pageId: true } },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!task || task.projectId !== id) notFound();

  const [people, activity, siblings, files] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.activity.findMany({
      where: { entityType: "page_task", entityId: task.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.pageTask.findMany({
      where: { projectId: id, id: { not: task.id } },
      select: { id: true, title: true, pageId: true, linkedTaskIds: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    (async () => {
      try {
        if (prisma.pageTaskAttachment) {
          return await prisma.pageTaskAttachment.findMany({
            where: { taskId: task.id },
            orderBy: { createdAt: "desc" },
          });
        }
      } catch {
        /* fall through to raw query */
      }
      try {
        return await prisma.$queryRaw<
          {
            id: string;
            taskId: string;
            commentId: string | null;
            userId: string;
            fileName: string;
            mimeType: string;
            size: number;
            path: string;
            createdAt: Date;
          }[]
        >`
          SELECT id, taskId, commentId, userId, fileName, mimeType, size, path, createdAt
          FROM qa_page_task_attachment
          WHERE taskId = ${task.id}
          ORDER BY createdAt DESC
        `;
      } catch {
        return [];
      }
    })(),
  ]);

  const linkedIds = parseLinkedIds(task.linkedTaskIds);
  const linked = siblings.filter((item) => linkedIds.includes(item.id));
  const linkable = siblings.filter((item) => !linkedIds.includes(item.id)).slice(0, 12);
  const reporterName = task.reporter?.name ?? task.project.name;

  const toLinked = (item: { id: string; title: string; pageId: string }) => ({
    id: item.id,
    taskKey: taskKey(item.id),
    title: item.title,
    pageId: item.pageId,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#172b4d]">
      <WorkQueueHeader
        userName={user.name}
        canEdit={canCreate}
        projectId={task.projectId}
        projectName={task.project.name}
        pageId={pageId}
        pageName={task.page.name}
        people={people}
      />
      <IssueDetailView
        canEdit={canEdit}
        canEditSla={slaEdit}
        canCreate={canCreate}
        canAdmin={isAdmin(user.role)}
        canWork={canWorkAssignedTask(user.role, parseAssigneeIds(task.assigneeIds, task.assigneeId), user.id)}
        role={user.role}
        currentUserId={user.id}
        currentUserName={user.name}
        people={people}
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
          taskKey: taskKey(task.id),
          projectId: task.projectId,
          projectName: task.project.name,
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
