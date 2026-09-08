import { redirect } from "next/navigation";
import { canManage, requireSession } from "@/lib/auth";
import { findTeamPeople } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { RoleBadge } from "@/components/ui/status-badge";
import { initials } from "@/lib/format";
import { createUserAction, toggleUserAction, updateUserRoleAction } from "@/app/actions/users";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  if (!canManage(user.role)) redirect("/");
  const { error } = await searchParams;

  const people = await findTeamPeople();

  return (
    <>
      <Topbar user={user} title="Team" />
      <main className="flex-1 space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Team</h1>
          <p className="mt-1 text-sm text-muted">
            Add testers, fixers, and admins here. Deactivate instead of deleting so history stays intact.
          </p>
        </div>

        <form action={createUserAction} className="grid gap-3 rounded-xl border border-line bg-card p-5 md:grid-cols-5">
          {error ? <p className="text-sm text-danger md:col-span-5">{decodeURIComponent(error)}</p> : null}
          <input name="name" required placeholder="Full name" className="rounded-lg border border-line px-3 py-2.5 text-sm" />
          <input name="email" type="email" required placeholder="email@owninfotech.com" className="rounded-lg border border-line px-3 py-2.5 text-sm" />
          <select name="role" className="rounded-lg border border-line px-3 py-2.5 text-sm">
            <option value="TESTER">Tester</option>
            <option value="FIXER">Fixer</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input name="password" type="password" required placeholder="Password" className="rounded-lg border border-line px-3 py-2.5 text-sm" />
          <button className="rounded-lg bg-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-hover">
            Add person
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fa] text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Role</th>
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

                return (
                  <tr key={person.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-soft text-xs font-semibold text-blue-ink">
                          {initials(person.name)}
                        </div>
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-xs text-muted">{person.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {person.id === user.id ? (
                        <RoleBadge role={person.role} />
                      ) : (
                        <form action={updateUserRoleAction} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={person.id} />
                          <select
                            name="role"
                            defaultValue={person.role}
                            className="rounded-lg border border-line px-2 py-1.5 text-sm"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="TESTER">Tester</option>
                            <option value="FIXER">Fixer</option>
                          </select>
                          <button className="text-sm font-medium text-blue hover:underline">Save</button>
                        </form>
                      )}
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
                      {person.id !== user.id ? (
                        <form action={toggleUserAction}>
                          <input type="hidden" name="id" value={person.id} />
                          <input type="hidden" name="active" value={String(person.active)} />
                          <button className="text-sm font-medium text-blue hover:underline">
                            {person.active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted">You</span>
                      )}
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
