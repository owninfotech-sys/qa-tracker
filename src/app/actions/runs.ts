"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireSession } from "@/lib/auth";
import {
  assignRunItems,
  closeTestRun,
  countOpenRunItems,
  createTestRun,
  findReadyCases,
  findUserById,
  logActivity,
} from "@/lib/data";

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

  const cases = await findReadyCases(projectId, selected.length ? selected : undefined);

  if (!cases.length) {
    redirect(`/runs/new?projectId=${projectId}&error=Select%20at%20least%20one%20case`);
  }

  const dueDate = due ? new Date(due) : null;

  const run = await createTestRun({
    projectId,
    name,
    build: build || null,
    dueDate,
    assigneeId: assigneeId || null,
    cases: cases.map((testCase) => ({ id: String(testCase.id) })),
  });

  await logActivity("run", run.id, session.id, `Created run "${name}" with ${cases.length} points`);

  redirect(`/runs/${run.id}`);
}

export async function assignItemsAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const runId = String(formData.get("runId") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  const itemIds = formData.getAll("itemIds").map(String);

  if (!runId || !assigneeId || !itemIds.length) return;

  await assignRunItems(runId, itemIds, assigneeId);

  const assignee = await findUserById(assigneeId);
  await logActivity(
    "run",
    runId,
    session.id,
    `Assigned ${itemIds.length} point(s) to ${assignee?.name ?? "tester"}`,
  );

  revalidatePath(`/runs/${runId}`);
  revalidatePath("/");
}

export async function closeRunAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const runId = String(formData.get("runId") || "");
  const reason = String(formData.get("reason") || "").trim();

  const openCount = await countOpenRunItems(runId);

  if (openCount > 0 && !reason) {
    revalidatePath(`/runs/${runId}`);
    return;
  }

  await closeTestRun(runId);

  await logActivity(
    "run",
    runId,
    session.id,
    reason ? `Closed run with ${openCount} open item(s). Reason: ${reason}` : "Closed the run",
  );

  revalidatePath(`/runs/${runId}`);
}
