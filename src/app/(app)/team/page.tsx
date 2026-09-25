import { redirect } from "next/navigation";
import { hasAccess, requireSession } from "@/lib/auth";
import { findTeamPeople } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { RoleBadge } from "@/components/ui/status-badge";
import { createUserAction, toggleUserAction, updateUserRoleAction } from "@/app/actions/users";
import { RoleFields } from "@/components/team/role-fields";
import { PersonLogo } from "@/components/team/person-logo";
import { AccessMatrix } from "@/components/team/access-matrix";
import { MATRIX_ROLE_ORDER, PRESET_ROLES, presetRoleLabel, tabAccess, workAccess } from "@/lib/access";
import { accessMatrixFor } from "@/lib/role-access";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  if (!(await hasAccess(user.role, "team"))) redirect("/");
  const canEditPeople = await hasAccess(user.role, "manageTeam");
  const canEditAccess = await hasAccess(user.role, "manageAccess");
  const { error } = await searchParams;

  const people = await findTeamPeople();
  const usedRoles = [...new Set(people.map((person) => person.role))];
  const preset = new Set<string>(MATRIX_ROLE_ORDER);
  const roleValues = [
    ...MATRIX_ROLE_ORDER.filter((role) => usedRoles.includes(role) || PRESET_ROLES.some((item) => item.value === role)),
    ...usedRoles.filter((role) => !preset.has(role)),
  ];
  const matrix = await accessMatrixFor(roleValues);
  const roles = roleValues.map((value) => ({ value, label: presetRoleLabel(value) }));

  return (
    <>
      <Topbar user={user} title="Team" />
      <main className="flex-1 space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Team</h1>
          <p className="mt-1 text-sm text-muted">
            Assign a role, then tick which tabs and actions that role can use. Click a person&apos;s circle to add their logo.
            Deactivate instead of deleting so history stays intact.
          </p>
        </div>

        <AccessMatrix roles={roles} matrix={matrix} canEdit={canEditAccess} />

        {canEditPeople ? (
          <form action={createUserAction} className="grid gap-3 rounded-xl border border-line bg-card p-5 md:grid-cols-5">
            {error ? <p className="text-sm text-danger md:col-span-5">{decodeURIComponent(error)}</p> : null}
            <input name="name" required placeholder="Full name" className="rounded-lg border border-line px-3 py-2.5 text-sm" />
            <input name="email" type="email" required placeholder="email@owninfotech.com" className="rounded-lg border border-line px-3 py-2.5 text-sm" />
            <RoleFields />
            <input name="password" type="password" required placeholder="Password" className="rounded-lg border border-line px-3 py-2.5 text-sm" />
            <button className="rounded-lg bg-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-hover">
              Add person
            </button>
          </form>
        ) : error ? (
          <p className="text-sm text-danger">{decodeURIComponent(error)}</p>
        ) : null}

        <div className="overflow-visible rounded-[3px] border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Open tests</th>
                <th className="px-4 py-3 font-medium">Open fixes</th>
                <th className="px-4 py-3 font-medium">Load</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const tests = person.assignedItems.length;
                const fixes = person.assignedFixes.length;
                const overloaded =
                  (person.role === "TESTER" && tests > 15) ||
                  (person.role === "FIXER" && fixes > 8);
                const idle = tests === 0 && fixes === 0 && person.role !== "ADMIN";
                const caps = matrix[person.role] ?? [];
                const tabs = tabAccess(caps);
                const actions = workAccess(caps);

                return (
                  <tr key={person.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PersonLogo userId={person.id} name={person.name} logo={person.logo} canEdit={canEditPeople} />
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-xs text-muted">{person.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {person.id === user.id || !canEditPeople ? (
                        <RoleBadge role={person.role} />
                      ) : (
                        <form action={updateUserRoleAction} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={person.id} />
                          <RoleFields defaultRole={person.role} compact />
                          <button className="text-sm font-medium text-blue hover:underline">Save</button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {tabs.map((field) => (
                          <span
                            key={field.key}
                            className="rounded-[3px] bg-[#EFF6FF] px-1.5 py-0.5 text-[11px] font-medium text-[#1D4ED8]"
                          >
                            {field.label}
                          </span>
                        ))}
                        {actions.slice(0, 3).map((field) => (
                          <span
                            key={field.key}
                            className="rounded-[3px] bg-[#F8FAFC] px-1.5 py-0.5 text-[11px] text-[#64748B]"
                          >
                            {field.label}
                          </span>
                        ))}
                        {actions.length > 3 ? (
                          <span className="text-[11px] text-[#64748B]">+{actions.length - 3}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{tests}</td>
                    <td className="px-4 py-3">{fixes}</td>
                    <td className="px-4 py-3">
                      {overloaded ? (
                        <span className="text-xs font-medium text-danger">Overloaded</span>
                      ) : idle ? (
                        <span className="text-xs font-medium text-warning">Idle</span>
                      ) : (
                        <span className="text-xs text-success">Balanced</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={person.active ? "text-success" : "text-muted"}>
                        {person.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {person.id !== user.id && canEditPeople ? (
                        <form action={toggleUserAction}>
                          <input type="hidden" name="id" value={person.id} />
                          <input type="hidden" name="active" value={String(person.active)} />
                          <button className="text-sm font-medium text-blue hover:underline">
                            {person.active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      ) : person.id === user.id ? (
                        <span className="text-xs text-muted">You</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
