"use server";

import { redirect } from "next/navigation";
import { canAddCases, requireSession } from "@/lib/auth";
import { countCases, createPage, createTestCase, findOrCreateModule, findPageByName } from "@/lib/data";
import { uniquePageNames } from "@/lib/pages";

export async function createCaseAction(formData: FormData) {
  const session = await requireSession();
  if (!canAddCases(session.role)) redirect("/");

  const projectId = String(formData.get("projectId") || "");
  const existingPageId = String(formData.get("pageId") || "").trim();
  const newPageName = String(formData.get("newPage") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const priority = String(formData.get("priority") || "P2");
  const preconditions = String(formData.get("preconditions") || "").trim();
  const steps = String(formData.get("steps") || "").trim();
  const expected = String(formData.get("expected") || "").trim();

  if (!projectId || !title || !steps || !expected) {
    redirect(`/projects/${projectId}/cases/new?error=Fill%20required%20fields`);
  }

  const module = await findOrCreateModule(projectId);

  let pageId = existingPageId || null;
  const [pageName] = uniquePageNames([newPageName]);
  if (pageName) {
    const existing = await findPageByName(projectId, pageName);
    pageId = existing?.id ?? (await createPage(projectId, pageName)).id;
  }

  const count = await countCases(projectId);

  await createTestCase({
    projectId,
    moduleId: module.id,
    pageId,
    caseKey: `TC-${count + 1}`,
    title,
    priority,
    preconditions: preconditions || null,
    steps,
    expected,
  });

  redirect(`/projects/${projectId}/cases`);
}
