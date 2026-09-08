"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniquePageNames } from "@/lib/pages";

async function mergeDuplicatePages(projectId: string) {
  const pages = await prisma.page.findMany({
    where: { projectId },
    orderBy: { id: "asc" },
  });

  const keep = new Map<string, string>();
  for (const page of pages) {
    const key = page.name.trim().toLowerCase();
    const first = keep.get(key);
    if (!first) {
      keep.set(key, page.id);
      continue;
    }

    await prisma.testCase.updateMany({
      where: { pageId: page.id },
      data: { pageId: first },
    });
    await prisma.page.delete({ where: { id: page.id } });
  }
}

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) {
    redirect("/projects");
  }

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "website");
  const url = String(formData.get("url") || "").trim();
  const rsvpUrl = String(formData.get("rsvpUrl") || "").trim();
  const pages = uniquePageNames(formData.getAll("pages").map(String));

  if (!name) {
    redirect("/projects/new?error=Project%20name%20is%20required");
  }

  let project;
  try {
    project = await prisma.project.create({
      data: {
        name,
        type,
        url: url || null,
        rsvpUrl: rsvpUrl || null,
        owner: { connect: { id: session.id } },
        modules: {
          create: [{ name: "General" }],
        },
        ...(pages.length
          ? {
              pages: {
                create: pages.map((pageName) => ({ name: pageName })),
              },
            }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      redirect("/login?expired=1&error=Your%20session%20is%20out%20of%20date.%20Sign%20in%20again.");
    }
    throw error;
  }

  redirect(`/projects/${project.id}`);
}

export async function archiveProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const id = String(formData.get("id") || "");
  await prisma.project.update({
    where: { id },
    data: { status: "archived" },
  });
  revalidatePath("/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    await tx.testRun.deleteMany({ where: { projectId: id } });
    await tx.pageTaskComment.deleteMany({ where: { task: { projectId: id } } });
    await tx.pageTask.updateMany({ where: { projectId: id }, data: { parentId: null } });
    await tx.pageTask.deleteMany({ where: { projectId: id } });
    await tx.testCase.deleteMany({ where: { projectId: id } });
    await tx.page.deleteMany({ where: { projectId: id } });
    await tx.module.deleteMany({ where: { projectId: id } });
    await tx.project.delete({ where: { id } });
  });

  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}

export async function updateProjectLinksAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const id = String(formData.get("id") || "");
  const url = String(formData.get("url") || "").trim();
  const rsvpUrl = String(formData.get("rsvpUrl") || "").trim();
  if (!id) return;

  await prisma.project.update({
    where: { id },
    data: {
      url: url || null,
      rsvpUrl: rsvpUrl || null,
    },
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function addProjectPagesAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const projectId = String(formData.get("projectId") || "");
  const pages = uniquePageNames([
    ...formData.getAll("pages").map(String),
    String(formData.get("pageDraft") || ""),
  ]);
  if (!projectId) return;

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    redirect(`/projects?error=Project%20not%20found`);
  }

  await mergeDuplicatePages(projectId);

  const existing = await prisma.page.findMany({
    where: { projectId },
    select: { name: true },
  });
  const taken = new Set(existing.map((page) => page.name.trim().toLowerCase()));
  const fresh = pages.filter((name) => !taken.has(name.toLowerCase()));

  try {
    for (const pageName of fresh) {
      await prisma.page.create({
        data: { projectId, name: pageName },
      });
    }
  } catch (error) {
    console.error("Could not add pages", error);
    redirect(`/projects/${projectId}?error=Could%20not%20save%20pages.%20Try%20again.`);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/cases`);
  redirect(`/projects/${projectId}`);
}

export async function removeProjectPageAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  if (!projectId || !pageId) return;

  await prisma.testCase.updateMany({
    where: { pageId },
    data: { pageId: null },
  });
  await prisma.page.delete({ where: { id: pageId } });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/cases`);
}
