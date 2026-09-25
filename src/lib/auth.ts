import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { canSeeProject, findUserByEmail, findUserById } from "@/lib/data";
import { isRole, type Role, type SessionUser } from "@/lib/types";
import { firstHomePath, type AccessKey } from "@/lib/access";
import { hasAccess, roleCaps } from "@/lib/role-access";

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

  const user = (await findUserById(session.id)) ?? (await findUserByEmail(session.email));

  if (!user || !user.active || !isRole(user.role)) {
    redirect("/login?expired=1&error=Your%20session%20is%20out%20of%20date.%20Sign%20in%20again.");
  }

  const current: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    logo: user.logo,
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

export async function homeForRole(role: Role) {
  return firstHomePath(await roleCaps(role));
}

export async function requireAccess(role: Role, key: AccessKey) {
  if (!(await hasAccess(role, key))) {
    redirect(await homeForRole(role));
  }
}

export async function canManage(role: Role) {
  return hasAccess(role, "manageProjects");
}

export async function canSeeAllProjects(role: Role) {
  return (await hasAccess(role, "viewAll")) || (await hasAccess(role, "manageProjects"));
}

export async function requireProjectAccess(projectId: string) {
  const user = await requireSession();
  const seesAll = await canSeeAllProjects(user.role);
  if (!(await canSeeProject(user.id, projectId, seesAll))) notFound();
  return user;
}

export async function canAddCases(role: Role) {
  return hasAccess(role, "createCase");
}

export async function canEditContent(role: Role) {
  return hasAccess(role, "manageTask");
}

export async function canEditSla(role: Role) {
  return hasAccess(role, "manageTask");
}

export async function canWorkAssignedTask(role: Role, _assigneeId?: string | string[] | null, _userId?: string) {
  return hasAccess(role, "manageTask");
}

export async function canCommentOnTask(role: Role, _assigneeId?: string | string[] | null, _userId?: string) {
  const caps = await roleCaps(role);
  return caps.includes("createTask") || caps.includes("manageTask") || caps.includes("updateFix") || caps.includes("testing");
}

export async function canChangeTaskStatus(role: Role, _assigneeId?: string | string[] | null, _userId?: string) {
  return hasAccess(role, "manageTask");
}

export async function canExecuteItem(role: Role, assigneeId: string | null, userId: string) {
  if (!(await hasAccess(role, "runTests"))) return false;
  if (await hasAccess(role, "viewAll")) return true;
  return assigneeId === userId;
}

export async function isStaffEditor(role: Role) {
  const caps = await roleCaps(role);
  return caps.includes("createCase") || caps.includes("runTests");
}

export async function canUpdateFix(role: Role, assigneeId: string | null, userId: string) {
  if (!(await hasAccess(role, "updateFix"))) return false;
  if (await hasAccess(role, "viewAll")) return true;
  return !assigneeId || assigneeId === userId;
}

export async function canManageRuns(role: Role) {
  return (await hasAccess(role, "testing")) && (await hasAccess(role, "viewAll"));
}

export { hasAccess, roleCaps };
