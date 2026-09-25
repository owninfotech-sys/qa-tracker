"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { isAccessKey, type AccessKey } from "@/lib/access";
import { hasAccess, replaceRoleAccess } from "@/lib/role-access";

export async function saveAccessMatrixAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "manageAccess"))) {
    return { ok: false as const, error: "You cannot assign access." };
  }

  const roles = formData.getAll("role").map(String).filter(Boolean);
  for (const role of roles) {
    const caps = formData.getAll(`cap:${role}`).map(String).filter(isAccessKey) as AccessKey[];
    await replaceRoleAccess(role, caps);
  }

  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath("/projects");
  return { ok: true as const };
}
