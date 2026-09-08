import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isRole, type Role, type SessionUser } from "@/lib/types";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "owninfotech-qa-tracker-dev-secret",
);

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  (await cookies()).set("qa_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  (await cookies()).delete("qa_session");
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get("qa_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user =
    (await prisma.user.findUnique({ where: { id: session.id } })) ??
    (await prisma.user.findUnique({ where: { email: session.email } }));

  if (!user || !user.active || !isRole(user.role)) {
    redirect("/login?expired=1&error=Your%20session%20is%20out%20of%20date.%20Sign%20in%20again.");
  }

  const current: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  if (current.id !== session.id) {
    try {
      await createSession(current);
    } catch {
      /* Server Components cannot always write cookies; the DB id is still used. */
    }
  }

  return current;
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function canManage(role: Role) {
  return role === "ADMIN";
}

export function canAddCases(role: Role) {
  return role === "ADMIN";
}

export function canEditContent(role: Role) {
  return role === "ADMIN" || role === "TESTER";
}

export function canEditSla(role: Role) {
  return role === "ADMIN" || role === "TESTER";
}

export function canWorkAssignedTask(role: Role, assigneeId: string | string[] | null, userId: string) {
  if (role === "ADMIN" || role === "TESTER") return true;
  const ids = Array.isArray(assigneeId) ? assigneeId : assigneeId ? [assigneeId] : [];
  return role === "FIXER" && ids.includes(userId);
}

export function canCommentOnTask(role: Role, assigneeId: string | string[] | null, userId: string) {
  return canWorkAssignedTask(role, assigneeId, userId);
}

export function canChangeTaskStatus(role: Role, assigneeId: string | string[] | null, userId: string) {
  return canWorkAssignedTask(role, assigneeId, userId);
}

export function canExecuteItem(role: Role, assigneeId: string | null, userId: string) {
  return role === "ADMIN" || (role === "TESTER" && assigneeId === userId);
}

export function canUpdateFix(role: Role, assigneeId: string | null, userId: string) {
  return role === "ADMIN" || (role === "FIXER" && (assigneeId === userId || !assigneeId));
}
