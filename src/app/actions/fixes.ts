"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canUpdateFix, hasAccess, requireSession } from "@/lib/auth";
import { findFixById, findUserById, logActivity, updateFixTask, updateRunItem } from "@/lib/data";

export async function assignFixAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "viewAll"))) return;

  const fixId = String(formData.get("fixId") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  if (!fixId || !assigneeId) return;

  await updateFixTask(fixId, { assigneeId });

  const assignee = await findUserById(assigneeId);
  await logActivity("fix", fixId, session.id, `Assigned to ${assignee?.name ?? "fixer"}`);

  revalidatePath("/fixes");
  revalidatePath(`/fixes/${fixId}`);
  revalidatePath("/");
}

export async function updateFixAction(formData: FormData) {
  const session = await requireSession();
  const fixId = String(formData.get("fixId") || "");
  const status = String(formData.get("status") || "");
  const notes = String(formData.get("fixerNotes") || "").trim();

  const fix = await findFixById(fixId);
  if (!fix) redirect("/");

  const allowed = await canUpdateFix(session.role, fix.assigneeId, session.id);
  if (!allowed) redirect("/");

  if (status === "fixed" && !notes) {
    redirect(`/fixes/${fixId}?error=Add%20what%20you%20changed`);
  }

  const nextStatus = status === "fixed" ? "retest" : status;

  await updateFixTask(fixId, {
    status: nextStatus,
    fixerNotes: notes || fix.fixerNotes,
    assigneeId: fix.assigneeId ?? (session.role === "FIXER" ? session.id : fix.assigneeId),
  });

  if (status === "fixed") {
    await updateRunItem(fix.runItemId, { result: "fail" });
  }

  await logActivity(
    "fix",
    fixId,
    session.id,
    status === "fixed" ? `Marked fixed — ready for retest. ${notes}` : `Moved to ${nextStatus}`,
  );

  revalidatePath(`/fixes/${fixId}`);
  revalidatePath("/fixes");
  revalidatePath("/");
  redirect(`/fixes/${fixId}`);
}

export async function wontFixAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "viewAll"))) return;

  const fixId = String(formData.get("fixId") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) {
    redirect(`/fixes/${fixId}?error=Reason%20required`);
  }

  await updateFixTask(fixId, { status: "wont_fix", fixerNotes: reason });

  await logActivity("fix", fixId, session.id, `Won't fix — ${reason}`);

  revalidatePath(`/fixes/${fixId}`);
  revalidatePath("/fixes");
}
