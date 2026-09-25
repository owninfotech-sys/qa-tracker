"use server";

import { hasAccess, requireSession } from "@/lib/auth";
import { findWorkNotices, searchWorkspace } from "@/lib/data";

export async function searchWorkspaceAction(query: string) {
  const user = await requireSession();
  return searchWorkspace(query, (await hasAccess(user.role, "viewAll")) ? undefined : user.id);
}

export async function loadNoticesAction() {
  const user = await requireSession();
  return findWorkNotices((await hasAccess(user.role, "viewAll")) ? undefined : user.id);
}
