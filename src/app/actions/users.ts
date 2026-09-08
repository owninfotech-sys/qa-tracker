"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { createUser, findUserByEmail, updateUser } from "@/lib/data";
import { parseStaffRole } from "@/lib/types";

function requireAdminRedirect() {
  return redirect("/");
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) requireAdminRedirect();

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
  if (!isAdmin(session.role)) return;

  const id = String(formData.get("id") || "");
  const role = parseStaffRole(String(formData.get("role") || ""), String(formData.get("customRole") || ""));
  if (!id || !role || id === session.id) return;

  await updateUser(id, { role });

  revalidatePath("/team");
}

export async function toggleUserAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) return;

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (id === session.id) return;

  await updateUser(id, { active: !active });

  revalidatePath("/team");
}
