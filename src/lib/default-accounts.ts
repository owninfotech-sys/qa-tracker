import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, updateUser } from "@/lib/data";

export type DefaultAccount = {
  label: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "TESTER" | "FIXER";
  hint: string;
};

function env(name: string, fallback: string) {
  return (process.env[name] || fallback).trim();
}

export function defaultAccounts(): DefaultAccount[] {
  return [
    {
      label: "Admin",
      name: env("ADMIN_NAME", "Amit"),
      email: env("ADMIN_EMAIL", "amit.owninfotech@gmail.com").toLowerCase(),
      password: env("ADMIN_PASSWORD", "Staff@123"),
      role: "ADMIN",
      hint: "Full control",
    },
    {
      label: "Tester",
      name: env("TESTER_NAME", "Tester"),
      email: env("TESTER_EMAIL", "tester.owninfotech@gmail.com").toLowerCase(),
      password: env("TESTER_PASSWORD", "Staff@123"),
      role: "TESTER",
      hint: "Edit work & SLAs",
    },
    {
      label: "Fixer",
      name: env("FIXER_NAME", "Fixer"),
      email: env("FIXER_EMAIL", "fixer.owninfotech@gmail.com").toLowerCase(),
      password: env("FIXER_PASSWORD", "Staff@123"),
      role: "FIXER",
      hint: "Assigned tasks",
    },
  ];
}

export async function ensureDefaultAccounts() {
  for (const account of defaultAccounts()) {
    const existing = await findUserByEmail(account.email);
    const password = await bcrypt.hash(account.password, 10);
    if (existing) {
      const same = await bcrypt.compare(account.password, existing.password);
      await updateUser(existing.id, {
        name: account.name,
        role: account.role,
        active: true,
        ...(same ? {} : { password }),
      });
      continue;
    }
    await createUser({
      name: account.name,
      email: account.email,
      password,
      role: account.role,
    });
  }
}
