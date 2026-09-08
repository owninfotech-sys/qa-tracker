"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, requireSession } from "@/lib/auth";
import {
  createPage,
  createProject,
  deletePage,
  deleteProject,
  findPages,
  findProjectById,
  mergeDuplicatePages,
  updateProject,
} from "@/lib/data";
import { uniquePageNames } from "@/lib/pages";

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
    project = await createProject({
      name,
      type,
      url: url || null,
      rsvpUrl: rsvpUrl || null,
      ownerId: session.id,
      pages,
    });
  } catch (error) {
    console.error("Could not create project", error);
    redirect("/login?expired=1&error=Your%20session%20is%20out%20of%20date.%20Sign%20in%20again.");
  }

  redirect(`/projects/${project.id}`);
}

export async function archiveProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const id = String(formData.get("id") || "");
  await updateProject(id, { status: "archived" });
  revalidatePath("/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canManage(session.role)) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await deleteProject(id);

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

  await updateProject(id, {
    url: url || null,
    rsvpUrl: rsvpUrl || null,
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

  const project = await findProjectById(projectId);
  if (!project) {
    redirect(`/projects?error=Project%20not%20found`);
  }

  await mergeDuplicatePages(projectId);

  const existing = await findPages(projectId);
  const taken = new Set(existing.map((page) => page.name.trim().toLowerCase()));
  const fresh = pages.filter((name) => !taken.has(name.toLowerCase()));

  try {
    for (const pageName of fresh) {
      await createPage(projectId, pageName);
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

  await deletePage(pageId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/cases`);
}
