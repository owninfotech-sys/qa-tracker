import { notFound, redirect } from "next/navigation";
import { canAddCases, canManageRuns, hasAccess, homeForRole, requireSession } from "@/lib/auth";
import { findProjectWithPages } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { createCaseAction } from "@/app/actions/cases";
import { TestingNav } from "@/components/projects/testing-nav";

export default async function NewCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  if (!(await hasAccess(user.role, "testing"))) redirect(await homeForRole(user.role));
  if (!(await canAddCases(user.role))) redirect("/");
  const { id } = await params;
  const { error } = await searchParams;
  const manage = await canManageRuns(user.role);

  const project = await findProjectWithPages(id);
  if (!project) notFound();

  return (
    <>
      <Topbar user={user} title="New test case" />
      <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <TestingNav
          projectId={project.id}
          projectName={project.name}
          pageId={project.pages[0]?.id}
          active="new-case"
          canAdd
          manage={manage}
        />
        <form action={createCaseAction} className="max-w-2xl space-y-4 rounded-[3px] border border-[#E2E8F0] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#172033]">Add test point</h2>
          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}
          <input type="hidden" name="projectId" value={project.id} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Title</span>
            <input name="title" required className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Page</span>
              <select name="pageId" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm">
                <option value="">Select a page</option>
                {project.pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Or add a new page</span>
              <input
                name="newPage"
                className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm"
                placeholder="Page name"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Priority</span>
            <select name="priority" defaultValue="P2" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm">
              <option value="P0">P0 Critical</option>
              <option value="P1">P1 High</option>
              <option value="P2">P2 Medium</option>
              <option value="P3">P3 Low</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Preconditions</span>
            <textarea name="preconditions" rows={2} className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Steps (one per line)</span>
            <textarea name="steps" required rows={5} className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Expected result</span>
            <textarea name="expected" required rows={3} className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" />
          </label>
          <button className="rounded-[3px] bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8]">
            Save case
          </button>
        </form>
      </main>
    </>
  );
}
