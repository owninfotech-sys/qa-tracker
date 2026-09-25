"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canExecuteItem, requireSession } from "@/lib/auth";
import {
  countFixTasks,
  createFixTask,
  findRunItemById,
  logActivity,
  updateFixTask,
  updateRunItem,
} from "@/lib/data";

export async function executeItemAction(formData: FormData) {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") || "");
  const result = String(formData.get("result") || "");
  const comment = String(formData.get("comment") || "").trim();
  const severity = String(formData.get("severity") || "major");

  const item = await findRunItemById(itemId);

  if (!item || item.run.status === "closed") {
    redirect("/");
  }

  const allowed = await canExecuteItem(session.role, item.assigneeId, session.id);
  if (!allowed) redirect("/");

  if ((result === "fail" || result === "skipped" || result === "blocked") && !comment) {
    redirect(`/execute/${itemId}?error=A%20comment%20is%20required`);
  }

  const now = new Date();

  await updateRunItem(itemId, {
    result,
    comment: comment || null,
    actualResult: comment || null,
    startedAt: item.startedAt ?? now,
    finishedAt: ["pass", "fail", "blocked", "skipped"].includes(result) ? now : item.finishedAt,
  });

  await logActivity(
    "run_item",
    itemId,
    session.id,
    `Marked ${item.case.caseKey} as ${result}${comment ? ` — ${comment}` : ""}`,
  );

  if (result === "fail") {
    const existing = item.fixTasks[0];
    if (existing) {
      await updateFixTask(existing.id, {
        status: existing.status === "closed" ? "open" : existing.status,
        steps: comment || existing.steps,
        severity,
      });
    } else {
      const count = await countFixTasks();
      await createFixTask({
        fixKey: `FIX-${count + 1}`,
        title: item.case.title,
        runItemId: item.id,
        severity,
        status: "open",
        steps: comment,
        dueDate: item.dueDate,
      });
    }
  }

  if (result === "pass") {
    const openFix = item.fixTasks.find((fix) => fix.status !== "wont_fix");
    if (openFix) {
      await updateFixTask(openFix.id, { status: "closed" });
      await logActivity("fix", openFix.id, session.id, `Retest passed. Closed ${openFix.fixKey}`);
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
  const item = await findRunItemById(itemId);

  if (!item || item.run.status === "closed") return;
  const allowed = await canExecuteItem(session.role, item.assigneeId, session.id);
  if (!allowed) return;

  await updateRunItem(itemId, {
    result: "in_progress",
    startedAt: item.startedAt ?? new Date(),
  });

  await logActivity("run_item", itemId, session.id, "Started testing");

  revalidatePath(`/execute/${itemId}`);
  revalidatePath("/");
}
