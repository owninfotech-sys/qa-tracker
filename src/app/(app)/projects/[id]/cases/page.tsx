import Link from "next/link";
import { notFound } from "next/navigation";
import { canAddCases, requireSession } from "@/lib/auth";
import { findProjectCases } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge } from "@/components/ui/status-badge";

export default async function CasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const canAdd = canAddCases(user.role);

  const project = await findProjectCases(id);
  if (!project) notFound();

  return (
    <>
      <Topbar user={user} title={`${project.name} · Cases`} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-end justify-between">
          <div>
            <Link href={`/projects/${project.id}`} className="text-sm text-blue hover:underline">
              ← {project.name}
            </Link>
            <h1 className="mt-2 text-2xl font-normal tracking-tight">Test cases</h1>
            <p className="mt-1 text-sm text-muted">
              {canAdd
                ? "Admins can add testing points."
                : "Testers and fixers can review these points but cannot add them."}
            </p>
          </div>
          {canAdd ? (
            <Link
              href={`/projects/${project.id}/cases/new`}
              className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-hover"
            >
              Add case
            </Link>
          ) : null}
        </div>

        {project.cases.length === 0 ? (
          <EmptyState title="No cases yet" body="Write the first test point with steps and expected result." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa] text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Page</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {project.cases.map((testCase) => (
                  <tr key={testCase.id} className="border-t border-line">
                    <td className="px-4 py-3 font-medium text-blue">{testCase.caseKey}</td>
                    <td className="px-4 py-3">{testCase.title}</td>
                    <td className="px-4 py-3 text-muted">{testCase.page?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={testCase.priority} />
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{testCase.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
