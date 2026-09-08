import { notFound, redirect } from "next/navigation";
import { canAddCases, requireSession } from "@/lib/auth";
import { findProjectWithPages } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { createCaseAction } from "@/app/actions/cases";

export default async function NewCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  if (!canAddCases(user.role)) redirect("/");
  const { id } = await params;
  const { error } = await searchParams;

  const project = await findProjectWithPages(id);
  if (!project) notFound();

  return (
    <>
      <Topbar user={user} title="New test case" />
      <main className="flex-1 p-6">
        <form action={createCaseAction} className="max-w-2xl space-y-4 rounded-xl border border-line bg-card p-6">
          <h1 className="text-2xl font-normal tracking-tight">Add test point</h1>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <input type="hidden" name="projectId" value={project.id} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Title</span>
            <input name="title" required className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Page</span>
              <select name="pageId" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
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
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                placeholder="Page name"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Priority</span>
            <select name="priority" defaultValue="P2" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
              <option value="P0">P0 Critical</option>
              <option value="P1">P1 High</option>
              <option value="P2">P2 Medium</option>
              <option value="P3">P3 Low</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Preconditions</span>
            <textarea name="preconditions" rows={2} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Steps (one per line)</span>
            <textarea name="steps" required rows={5} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Expected result</span>
            <textarea name="expected" required rows={3} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          </label>
          <button className="rounded-lg bg-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-hover">
            Save case
          </button>
        </form>
      </main>
    </>
  );
}
