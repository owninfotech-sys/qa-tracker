"use server";

import { redirect } from "next/navigation";
import { canAddCases, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  let module = await prisma.module.findFirst({ where: { projectId } });
  if (!module) {
    module = await prisma.module.create({
      data: { projectId, name: "General" },
    });
  }

  let pageId = existingPageId || null;
  const [pageName] = uniquePageNames([newPageName]);
  if (pageName) {
    const existing = await prisma.page.findFirst({
      where: { projectId, name: pageName },
    });
    pageId =
      existing?.id ??
      (
        await prisma.page.create({
          data: { projectId, name: pageName },
        })
      ).id;
  }

  const count = await prisma.testCase.count({ where: { projectId } });

  await prisma.testCase.create({
    data: {
      projectId,
      moduleId: module.id,
      pageId,
      caseKey: `TC-${count + 1}`,
      title,
      priority,
      preconditions: preconditions || null,
      steps,
      expected,
      status: "ready",
    },
  });

  redirect(`/projects/${projectId}/cases`);
}
