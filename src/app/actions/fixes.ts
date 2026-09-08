"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, canUpdateFix, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function assignFixAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const fixId = String(formData.get("fixId") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  if (!fixId || !assigneeId) return;

  await prisma.fixTask.update({
    where: { id: fixId },
    data: { assigneeId },
  });

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  await prisma.activity.create({
    data: {
      entityType: "fix",
      entityId: fixId,
      userId: session.id,
      message: `Assigned to ${assignee?.name ?? "fixer"}`,
    },
  });

  revalidatePath("/fixes");
  revalidatePath(`/fixes/${fixId}`);
  revalidatePath("/");
}

export async function updateFixAction(formData: FormData) {
  const session = await requireSession();
  const fixId = String(formData.get("fixId") || "");
  const status = String(formData.get("status") || "");
  const notes = String(formData.get("fixerNotes") || "").trim();

  const fix = await prisma.fixTask.findUnique({
    where: { id: fixId },
    include: { runItem: true },
  });
  if (!fix) redirect("/");

  const allowed = canUpdateFix(session.role, fix.assigneeId, session.id);
  if (!allowed) redirect("/");

  if (status === "fixed" && !notes) {
    redirect(`/fixes/${fixId}?error=Add%20what%20you%20changed`);
  }

  const nextStatus = status === "fixed" ? "retest" : status;

  await prisma.fixTask.update({
    where: { id: fixId },
    data: {
      status: nextStatus,
      fixerNotes: notes || fix.fixerNotes,
      assigneeId: fix.assigneeId ?? (session.role === "FIXER" ? session.id : fix.assigneeId),
    },
  });

  if (status === "fixed") {
    await prisma.runItem.update({
      where: { id: fix.runItemId },
      data: { result: "fail" },
    });
  }

  if (status === "in_progress" && fix.status === "open") {
    // started
  }

  await prisma.activity.create({
    data: {
      entityType: "fix",
      entityId: fixId,
      userId: session.id,
      message:
        status === "fixed"
          ? `Marked fixed — ready for retest. ${notes}`
          : `Moved to ${nextStatus}`,
    },
  });

  revalidatePath(`/fixes/${fixId}`);
  revalidatePath("/fixes");
  revalidatePath("/");
  redirect(`/fixes/${fixId}`);
}

export async function wontFixAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const fixId = String(formData.get("fixId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) {
    redirect(`/fixes/${fixId}?error=Reason%20required`);
  }

  await prisma.fixTask.update({
    where: { id: fixId },
    data: { status: "wont_fix", fixerNotes: reason },
  });

  await prisma.activity.create({
    data: {
      entityType: "fix",
      entityId: fixId,
      userId: session.id,
      message: `Won't fix — ${reason}`,
    },
  });

  revalidatePath(`/fixes/${fixId}`);
  revalidatePath("/fixes");
}
