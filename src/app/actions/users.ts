"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRole } from "@/lib/types";

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
  const role = String(formData.get("role") || "TESTER");
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    redirect("/team?error=Name%2C%20email%20and%20password%20are%20required");
  }

  if (!isRole(role)) {
    redirect("/team?error=Role%20must%20be%20Admin%2C%20Tester%2C%20or%20Fixer");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/team?error=Email%20already%20exists");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      password: await bcrypt.hash(password, 10),
    },
  });

  revalidatePath("/team");
  redirect("/team");
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) return;

  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "");
  if (!id || !isRole(role) || id === session.id) return;

  await prisma.user.update({
    where: { id },
    data: { role },
  });

  revalidatePath("/team");
}

export async function toggleUserAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) return;

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (id === session.id) return;

  await prisma.user.update({
    where: { id },
    data: { active: !active },
  });

  revalidatePath("/team");
}
