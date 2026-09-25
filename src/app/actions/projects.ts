"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, hasAccess, requireSession } from "@/lib/auth";
import {
  addProjectMember,
  createPage,
  createProject,
  deletePage,
  deleteProject,
  findPages,
  findProjectById,
  mergeDuplicatePages,
  removeProjectMember,
  updateProject,
  writePageSortOrders,
  type ProjectTeam,
} from "@/lib/data";
import { uniquePageNames } from "@/lib/pages";
import { clipText, parseWorkType } from "@/lib/work-type";
import { parseDateInput } from "@/lib/format";

function readProjectFields(formData: FormData) {
  return {
    name: clipText(String(formData.get("name") || ""), 191),
    type: parseWorkType(String(formData.get("type") || "tasks")),
    url: clipText(String(formData.get("url") || ""), 2048),
    rsvpUrl: clipText(String(formData.get("rsvpUrl") || ""), 2048),
    figmaUrl: clipText(String(formData.get("figmaUrl") || ""), 2048),
    deadline: parseDateInput(String(formData.get("deadline") || "")),
  };
}

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) {
    redirect("/projects");
  }

  const { name, type, url, rsvpUrl, figmaUrl, deadline } = readProjectFields(formData);
  const pages = uniquePageNames(formData.getAll("pages").map(String)).map((page) => clipText(page, 191));

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
      figmaUrl: figmaUrl || null,
      deadline,
      ownerId: session.id,
      pages: pages.length ? pages : ["General"],
    });
  } catch (error) {
    console.error("Could not create project", error);
    redirect("/projects/new?error=Could%20not%20save%20the%20project.%20Check%20the%20database%20and%20try%20again.");
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectDetailsAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) return { ok: false as const, error: "You cannot edit projects." };

  const id = String(formData.get("id") || "");
  const { name, url, rsvpUrl, figmaUrl, deadline } = readProjectFields(formData);
  if (!id) return { ok: false as const, error: "Missing project." };
  if (!name) return { ok: false as const, error: "Project name is required." };

  await updateProject(id, {
    name,
    url: url || null,
    rsvpUrl: rsvpUrl || null,
    figmaUrl: figmaUrl || null,
    deadline,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/projects/${id}/edit`);
  return { ok: true as const };
}

export async function archiveProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) return;

  const id = String(formData.get("id") || "");
  await updateProject(id, { status: "archived" });
  revalidatePath("/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await deleteProject(id);

  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}

export async function updateProjectLinksAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) return;

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
  if (!(await canManage(session.role))) return;

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
  if (!(await canManage(session.role))) return;

  const projectId = String(formData.get("projectId") || "");
  const pageId = String(formData.get("pageId") || "");
  if (!projectId || !pageId) return;

  await deletePage(pageId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/cases`);
}

export async function reorderProjectPagesAction(formData: FormData) {
  const session = await requireSession();
  const allowed =
    (await hasAccess(session.role, "manageProjects")) || (await hasAccess(session.role, "manageTask"));
  if (!allowed) return { ok: false as const };

  const projectId = String(formData.get("projectId") || "");
  const orderedIds = String(formData.get("orderedIds") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!projectId || !orderedIds.length) return { ok: false as const };

  await writePageSortOrders(projectId, orderedIds);
  revalidatePath(`/projects/${projectId}`, "layout");
  return { ok: true as const };
}

export async function addProjectMemberAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) return { ok: false as const, error: "You cannot assign project teams." };
  const projectId = String(formData.get("projectId") || "");
  const userId = String(formData.get("userId") || "");
  const team = String(formData.get("team") || "") as ProjectTeam;
  if (!projectId || !userId || (team !== "developer" && team !== "testing")) {
    return { ok: false as const, error: "Pick a person for this team." };
  }
  const project = await findProjectById(projectId);
  if (!project) return { ok: false as const, error: "Project not found." };
  await addProjectMember(projectId, userId, team);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true as const };
}

export async function removeProjectMemberAction(formData: FormData) {
  const session = await requireSession();
  if (!(await canManage(session.role))) return { ok: false as const, error: "You cannot assign project teams." };
  const projectId = String(formData.get("projectId") || "");
  const userId = String(formData.get("userId") || "");
  const team = String(formData.get("team") || "") as ProjectTeam;
  if (!projectId || !userId || (team !== "developer" && team !== "testing")) {
    return { ok: false as const, error: "Missing team member." };
  }
  await removeProjectMember(projectId, userId, team);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true as const };
}
