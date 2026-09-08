"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createRunAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) redirect("/");

  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  const build = String(formData.get("build") || "").trim();
  const due = String(formData.get("dueDate") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  const selected = formData.getAll("caseIds").map(String);

  if (!projectId || !name) {
    redirect(`/runs/new?projectId=${projectId}&error=Run%20name%20is%20required`);
  }

  const cases = await prisma.testCase.findMany({
    where: {
      projectId,
      status: "ready",
      ...(selected.length ? { id: { in: selected } } : {}),
    },
  });

  if (!cases.length) {
    redirect(`/runs/new?projectId=${projectId}&error=Select%20at%20least%20one%20case`);
  }

  const dueDate = due ? new Date(due) : null;

  const run = await prisma.testRun.create({
    data: {
      projectId,
      name,
      build: build || null,
      dueDate,
      status: "open",
      items: {
        create: cases.map((testCase) => ({
          caseId: testCase.id,
          assigneeId: assigneeId || null,
          dueDate,
        })),
      },
    },
  });

  await prisma.activity.create({
    data: {
      entityType: "run",
      entityId: run.id,
      userId: session.id,
      message: `Created run "${name}" with ${cases.length} points`,
    },
  });

  redirect(`/runs/${run.id}`);
}

export async function assignItemsAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const runId = String(formData.get("runId") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  const itemIds = formData.getAll("itemIds").map(String);

  if (!runId || !assigneeId || !itemIds.length) return;

  await prisma.runItem.updateMany({
    where: { id: { in: itemIds }, runId },
    data: { assigneeId },
  });

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  await prisma.activity.create({
    data: {
      entityType: "run",
      entityId: runId,
      userId: session.id,
      message: `Assigned ${itemIds.length} point(s) to ${assignee?.name ?? "tester"}`,
    },
  });

  revalidatePath(`/runs/${runId}`);
  revalidatePath("/");
}

export async function closeRunAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const runId = String(formData.get("runId") || "");
  const reason = String(formData.get("reason") || "").trim();

  const openCount = await prisma.runItem.count({
    where: {
      runId,
      result: { in: ["pending", "in_progress"] },
    },
  });

  if (openCount > 0 && !reason) {
    revalidatePath(`/runs/${runId}`);
    return;
  }

  await prisma.testRun.update({
    where: { id: runId },
    data: { status: "closed" },
  });

  await prisma.activity.create({
    data: {
      entityType: "run",
      entityId: runId,
      userId: session.id,
      message: reason
        ? `Closed run with ${openCount} open item(s). Reason: ${reason}`
        : "Closed the run",
    },
  });

  revalidatePath(`/runs/${runId}`);
}
