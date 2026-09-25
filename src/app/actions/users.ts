"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAccess, requireSession } from "@/lib/auth";
import { createUser, findUserByEmail, updateUser } from "@/lib/data";
import { parseStaffRole } from "@/lib/types";
import { saveUserLogo } from "@/lib/uploads";

function requireAdminRedirect() {
  return redirect("/");
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "manageTeam"))) requireAdminRedirect();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const role = parseStaffRole(String(formData.get("role") || "TESTER"), String(formData.get("customRole") || ""));
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    redirect("/team?error=Name%2C%20email%20and%20password%20are%20required");
  }

  if (!role) {
    redirect("/team?error=Choose%20a%20role%20or%20type%20a%20custom%20role%20name");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    redirect("/team?error=Email%20already%20exists");
  }

  await createUser({
    name,
    email,
    role,
    password: await bcrypt.hash(password, 10),
  });

  revalidatePath("/team");
  redirect("/team");
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "manageTeam"))) return;

  const id = String(formData.get("id") || "");
  const role = parseStaffRole(String(formData.get("role") || ""), String(formData.get("customRole") || ""));
  if (!id || !role || id === session.id) return;

  await updateUser(id, { role });

  revalidatePath("/team");
}

export async function toggleUserAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "manageTeam"))) return;

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (id === session.id) return;

  await updateUser(id, { active: !active });

  revalidatePath("/team");
}

export async function uploadUserLogoAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "manageTeam"))) return { ok: false as const, error: "You cannot change logos." };

  const id = String(formData.get("id") || "");
  const file = formData.get("logo");
  if (!id || !(file instanceof File) || !file.size) {
    return { ok: false as const, error: "Choose an image to upload." };
  }

  const path = await saveUserLogo(id, file);
  if (!path) {
    return { ok: false as const, error: "Use a PNG, JPG, WEBP, or GIF under 2 MB." };
  }

  await updateUser(id, { logo: path });
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true as const, path };
}

export async function removeUserLogoAction(formData: FormData) {
  const session = await requireSession();
  if (!(await hasAccess(session.role, "manageTeam"))) return { ok: false as const, error: "You cannot change logos." };

  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing person." };

  await updateUser(id, { logo: null });
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true as const };
}
