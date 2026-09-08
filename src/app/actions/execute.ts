"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canExecuteItem, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function executeItemAction(formData: FormData) {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") || "");
  const result = String(formData.get("result") || "");
  const comment = String(formData.get("comment") || "").trim();
  const severity = String(formData.get("severity") || "major");

  const item = await prisma.runItem.findUnique({
    where: { id: itemId },
    include: {
      case: true,
      run: true,
      fixTasks: true,
    },
  });

  if (!item || item.run.status === "closed") {
    redirect("/");
  }

  const allowed = canExecuteItem(session.role, item.assigneeId, session.id);
  if (!allowed) redirect("/");

  if ((result === "fail" || result === "skipped" || result === "blocked") && !comment) {
    redirect(`/execute/${itemId}?error=A%20comment%20is%20required`);
  }

  const now = new Date();

  await prisma.runItem.update({
    where: { id: itemId },
    data: {
      result,
      comment: comment || null,
      actualResult: comment || null,
      startedAt: item.startedAt ?? now,
      finishedAt: ["pass", "fail", "blocked", "skipped"].includes(result)
        ? now
        : item.finishedAt,
    },
  });

  await prisma.activity.create({
    data: {
      entityType: "run_item",
      entityId: itemId,
      userId: session.id,
      message: `Marked ${item.case.caseKey} as ${result}${comment ? ` — ${comment}` : ""}`,
    },
  });

  if (result === "fail") {
    const existing = item.fixTasks[0];
    if (existing) {
      await prisma.fixTask.update({
        where: { id: existing.id },
        data: {
          status: existing.status === "closed" ? "open" : existing.status,
          steps: comment || existing.steps,
          severity,
        },
      });
    } else {
      const count = await prisma.fixTask.count();
      await prisma.fixTask.create({
        data: {
          fixKey: `FIX-${count + 1}`,
          title: item.case.title,
          runItemId: item.id,
          severity,
          status: "open",
          steps: comment,
          dueDate: item.dueDate,
        },
      });
    }
  }

  if (result === "pass") {
    const openFix = item.fixTasks.find((fix) => fix.status !== "wont_fix");
    if (openFix) {
      await prisma.fixTask.update({
        where: { id: openFix.id },
        data: { status: "closed" },
      });
      await prisma.activity.create({
        data: {
          entityType: "fix",
          entityId: openFix.id,
          userId: session.id,
          message: `Retest passed. Closed ${openFix.fixKey}`,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/runs/${item.runId}`);
  revalidatePath("/fixes");
  redirect("/");
}

export async function startItemAction(formData: FormData) {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") || "");
  const item = await prisma.runItem.findUnique({
    where: { id: itemId },
    include: { run: true },
  });

  if (!item || item.run.status === "closed") return;
  const allowed = canExecuteItem(session.role, item.assigneeId, session.id);
  if (!allowed) return;

  await prisma.runItem.update({
    where: { id: itemId },
    data: {
      result: "in_progress",
      startedAt: item.startedAt ?? new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      entityType: "run_item",
      entityId: itemId,
      userId: session.id,
      message: "Started testing",
    },
  });

  revalidatePath(`/execute/${itemId}`);
  revalidatePath("/");
}
