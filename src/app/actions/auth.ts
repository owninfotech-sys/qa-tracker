"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/auth";
import { findUserByEmail } from "@/lib/data";
import { isRole, type Role } from "@/lib/types";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=Enter%20email%20and%20password");
  }

  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    redirect("/login?error=Invalid%20email%20or%20password");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    redirect("/login?error=Invalid%20email%20or%20password");
  }

  if (!isRole(user.role)) {
    redirect("/login?error=Account%20role%20is%20invalid.%20Ask%20an%20admin%20to%20update%20it.");
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  });

  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
