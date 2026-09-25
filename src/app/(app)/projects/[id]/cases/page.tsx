import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canAddCases, canManageRuns, hasAccess, homeForRole, requireProjectAccess } from "@/lib/auth";
import { findFirstPage, findProjectCases } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge } from "@/components/ui/status-badge";
import { TestingNav } from "@/components/projects/testing-nav";
import { newCaseHref } from "@/lib/workspace";

export default async function CasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireProjectAccess(id);
  if (!(await hasAccess(user.role, "testing"))) redirect(await homeForRole(user.role));
  const canAdd = await canAddCases(user.role);
  const manage = await canManageRuns(user.role);

  const [project, firstPage] = await Promise.all([findProjectCases(id), findFirstPage(id)]);
  if (!project) notFound();

  return (
    <>
      <Topbar user={user} title={`${project.name} · Test cases`} />
      <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <TestingNav
          projectId={project.id}
          projectName={project.name}
          pageId={firstPage?.id}
          active="cases"
          canAdd={canAdd}
          manage={manage}
        />

        {project.cases.length === 0 ? (
          <EmptyState title="No cases yet" body="Write the first test point with steps and expected result.">
            {canAdd ? (
              <Link href={newCaseHref(project.id)} className="text-sm font-medium text-[#2563EB]">
                Add case
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-[3px] border border-[#E2E8F0] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
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
                  <tr key={testCase.id} className="border-t border-[#E2E8F0]">
                    <td className="px-4 py-3 font-medium text-[#2563EB]">{testCase.caseKey}</td>
                    <td className="px-4 py-3">{testCase.title}</td>
                    <td className="px-4 py-3 text-[#64748B]">{testCase.page?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={testCase.priority} />
                    </td>
                    <td className="px-4 py-3 capitalize text-[#64748B]">{testCase.status}</td>
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
