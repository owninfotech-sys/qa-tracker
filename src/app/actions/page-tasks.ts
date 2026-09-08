"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canAddCases,
  canEditContent,
  canEditSla,
  canWorkAssignedTask,
  isAdmin,
  requireSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAssigneeIds, parseLinkedIds, serializeAssigneeIds } from "@/lib/task-key";
import { nextSortOrderAtTop, writeTaskSortOrder } from "@/lib/task-order";
import { saveTaskUploads } from "@/lib/uploads";
import { isPageTaskKind, isPageTaskStatus } from "@/lib/types";
import { pageTaskStatusLabel } from "@/lib/format";

function refreshTask(projectId: string, pageId: string, taskId?: string) {
  revalidatePath(`/projects/${projectId}/pages/${pageId}`);
  revalidatePath(`/projects/${projectId}`);
  if (taskId) {
    revalidatePath(`/projects/${projectId}/pages/${pageId}/tasks/${taskId}`);
  }
}

async function logActivity(entityId: string, userId: string, message: string) {
  try {
    await prisma.activity.create({
      data: {
        entityType: "page_task",
        entityId,
        userId,
        message,
      },
    });
  } catch (error) {
    console.error("Could not write activity", error);
  }
}

export async function createPageTaskAction(formData: FormData) {
  const session = await requireSession();
  if (!canAddCases(session.role)) redirect("/");

  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const kind = String(formData.get("kind") || "issue");
  const title = String(formData.get("title") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const priority = String(formData.get("priority") || "P2");
  const status = String(formData.get("status") || "open");
  const parentId = String(formData.get("parentId") || "") || null;
  const labels = String(formData.get("labels") || "").trim();
  const assigneeList = formData
    .getAll("assigneeIds")
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const single = String(formData.get("assigneeId") || "").trim();
  if (single) assigneeList.push(single);
  const uniqueAssignees = [...new Set(assigneeList)];
  const assigneeId = uniqueAssignees[0] ?? null;

  if (!projectId || !pageId || !title || !isPageTaskKind(kind) || !isPageTaskStatus(status)) {
    redirect(`/projects/${projectId}/pages/${pageId}?add=1&error=Fill%20the%20required%20task%20fields`);
  }

  const sortOrder = await nextSortOrderAtTop(projectId, status);

  const task = await prisma.pageTask.create({
    data: {
      projectId,
      pageId,
      kind,
      title,
      details: details || null,
      priority,
      status,
      parentId,
      labels: labels || null,
      assigneeId,
      assigneeIds: serializeAssigneeIds(uniqueAssignees) || null,
      reporterId: session.id,
    },
  });
  await writeTaskSortOrder(task.id, sortOrder);

  await logActivity(task.id, session.id, `Created work item`);
  refreshTask(projectId, pageId, parentId || task.id);

  if (parentId) {
    redirect(`/projects/${projectId}/pages/${pageId}/tasks/${parentId}`);
  }
  redirect(`/projects/${projectId}/pages/${pageId}/tasks/${task.id}`);
}

export async function updatePageTaskAction(formData: FormData) {
  const session = await requireSession();

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const status = String(formData.get("status") || "");
  const priority = String(formData.get("priority") || "");
  if (!id || !projectId || !pageId) return;

  const current = await prisma.pageTask.findUnique({ where: { id } });
  if (!current) return;
  if (status && !canWorkAssignedTask(session.role, parseAssigneeIds(current.assigneeIds, current.assigneeId), session.id)) return;
  if (priority && !canEditContent(session.role)) return;

  await prisma.pageTask.update({
    where: { id },
    data: {
      ...(isPageTaskStatus(status) ? { status } : {}),
      ...(priority && canEditContent(session.role) ? { priority } : {}),
    },
  });

  if (status && current && status !== current.status) {
    await logActivity(
      id,
      session.id,
      `Changed status from ${pageTaskStatusLabel(current.status)} to ${pageTaskStatusLabel(status)}`,
    );
  }
  if (priority && current && priority !== current.priority) {
    await logActivity(id, session.id, `Changed priority to ${priority}`);
  }

  refreshTask(projectId, pageId, id);
}

export async function reorderPageTasksAction(formData: FormData) {
  const session = await requireSession();

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const status = String(formData.get("status") || "");
  const orderedIds = String(formData.get("orderedIds") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!id || !projectId || !pageId || !orderedIds.includes(id)) return;

  const current = await prisma.pageTask.findUnique({ where: { id } });
  if (!current || current.projectId !== projectId) return;
  if (!canWorkAssignedTask(session.role, parseAssigneeIds(current.assigneeIds, current.assigneeId), session.id)) return;

  const nextStatus = isPageTaskStatus(status) ? status : current.status;

  for (const [index, taskId] of orderedIds.entries()) {
    await writeTaskSortOrder(taskId, index, taskId === id ? nextStatus : undefined);
  }

  if (nextStatus !== current.status) {
    await logActivity(
      id,
      session.id,
      `Changed status from ${pageTaskStatusLabel(current.status)} to ${pageTaskStatusLabel(nextStatus)}`,
    );
  }

  refreshTask(projectId, pageId, id);
}

export async function updatePageTaskSlaAction(formData: FormData) {
  const session = await requireSession();
  if (!canEditSla(session.role)) return;

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const firstRaw = String(formData.get("firstResponseAt") || "").trim();
  const resolutionRaw = String(formData.get("resolutionAt") || "").trim();
  if (!id || !projectId || !pageId || !firstRaw || !resolutionRaw) return;

  const firstResponseAt = new Date(firstRaw);
  const resolutionAt = new Date(resolutionRaw);
  if (Number.isNaN(firstResponseAt.getTime()) || Number.isNaN(resolutionAt.getTime())) return;

  await prisma.pageTask.update({
    where: { id },
    data: { firstResponseAt, resolutionAt },
  });
  await logActivity(id, session.id, "Updated SLA times");
  refreshTask(projectId, pageId, id);
}

export async function updatePageTaskFieldsAction(formData: FormData) {
  const session = await requireSession();
  if (!canEditContent(session.role)) return;

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const title = String(formData.get("title") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const kind = String(formData.get("kind") || "");
  const labels = String(formData.get("labels") || "").trim();
  if (!id || !projectId || !pageId) return;

  await prisma.pageTask.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      details: details || null,
      ...(isPageTaskKind(kind) ? { kind } : {}),
      labels: labels || null,
    },
  });

  await logActivity(id, session.id, "Updated work item details");
  refreshTask(projectId, pageId, id);
}

export async function assignPageTaskAction(formData: FormData) {
  const session = await requireSession();
  if (!canEditContent(session.role)) return;

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const raw = String(formData.get("assigneeId") || "");
  const listed = formData
    .getAll("assigneeIds")
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  if (!id || !projectId || !pageId) return;

  if (raw === "me" && !listed.includes(session.id)) listed.push(session.id);
  const nextIds = [...new Set(listed)];
  const assigneeId = nextIds[0] ?? null;
  const people = nextIds.length
    ? await prisma.user.findMany({ where: { id: { in: nextIds } } })
    : [];
  const names = people.map((person) => person.name).join(", ");

  await prisma.pageTask.update({
    where: { id },
    data: {
      assigneeId,
      assigneeIds: serializeAssigneeIds(nextIds) || null,
    },
  });
  await logActivity(
    id,
    session.id,
    names ? `Assigned to ${names}` : "Cleared assignee",
  );
  refreshTask(projectId, pageId, id);
}

export async function addPageTaskCommentAction(formData: FormData) {
  const session = await requireSession();
  const taskId = String(formData.get("taskId") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const body = String(formData.get("body") || "").trim();
  const visibility =
    session.role === "FIXER"
      ? "internal"
      : String(formData.get("visibility") || "internal") === "customer"
        ? "customer"
        : "internal";

  const files =
    session.role === "FIXER"
      ? []
      : formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);

  if (!taskId || !projectId || !pageId || (!body && files.length === 0)) return;
  if (session.role === "FIXER" && !body) return;

  const current = await prisma.pageTask.findUnique({ where: { id: taskId } });
  if (!current || !canWorkAssignedTask(session.role, parseAssigneeIds(current.assigneeIds, current.assigneeId), session.id)) return;

  let saved: Awaited<ReturnType<typeof saveTaskUploads>> = [];
  try {
    saved = await saveTaskUploads(taskId, files);
  } catch (error) {
    console.error("Could not store uploaded files", error);
  }

  const note =
    body ||
    (saved.length === 1 ? `Attached ${saved[0].fileName}` : saved.length ? `Attached ${saved.length} files` : "");
  if (!note) return;

  const comment = await prisma.pageTaskComment.create({
    data: {
      taskId,
      userId: session.id,
      body: note,
      visibility,
    },
  });

  for (const file of saved) {
    const id = `att${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    try {
      const store = prisma.pageTaskAttachment;
      if (store) {
        await store.create({
          data: {
            id,
            taskId,
            commentId: comment.id,
            userId: session.id,
            fileName: file.fileName,
            mimeType: file.mimeType,
            size: file.size,
            path: file.path,
          },
        });
        continue;
      }
    } catch (error) {
      console.error("Prisma attachment create failed", error);
    }

    try {
      await prisma.$executeRaw`
        INSERT INTO qa_page_task_attachment
          (id, taskId, commentId, userId, fileName, mimeType, size, path, createdAt)
        VALUES
          (${id}, ${taskId}, ${comment.id}, ${session.id}, ${file.fileName}, ${file.mimeType}, ${file.size}, ${file.path}, NOW(3))
      `;
    } catch (error) {
      console.error("Could not save attachment record", error);
    }
  }

  await logActivity(
    taskId,
    session.id,
    saved.length && !body
      ? `Attached ${saved.length} file${saved.length === 1 ? "" : "s"}`
      : visibility === "customer"
        ? "Replied to customer"
        : "Added an internal note",
  );
  refreshTask(projectId, pageId, taskId);
}

export async function linkPageTaskAction(formData: FormData) {
  const session = await requireSession();
  if (!canEditContent(session.role)) return;

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const linkedId = String(formData.get("linkedId") || "");
  if (!id || !linkedId || linkedId === id) return;

  const task = await prisma.pageTask.findUnique({ where: { id } });
  if (!task) return;

  const next = Array.from(new Set([...parseLinkedIds(task.linkedTaskIds), linkedId]));
  await prisma.pageTask.update({
    where: { id },
    data: { linkedTaskIds: next.join(",") },
  });
  await logActivity(id, session.id, "Linked a work item");
  refreshTask(projectId, pageId, id);
}

export async function reactPageTaskAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  const react = String(formData.get("react") || "");
  if (!id || !react) return;

  const messages: Record<string, string> = {
    watch: "Started watching this work item",
    unwatch: "Stopped watching this work item",
    vote: "Voted for this work item",
    like: "Liked this work item",
    unlike: "Removed like",
  };
  await logActivity(id, session.id, messages[react] ?? `Updated ${react}`);
  refreshTask(projectId, pageId, id);
}

export async function deletePageTaskAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) return;

  const id = String(formData.get("id") || "");
  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  if (!id || !projectId || !pageId) return;

  await prisma.pageTask.delete({ where: { id } });
  refreshTask(projectId, pageId);
  redirect(`/projects/${projectId}/pages/${pageId}`);
}
