import { redirect } from "next/navigation";
import { canManage, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { createRunAction } from "@/app/actions/runs";

export default async function NewRunPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; error?: string }>;
}) {
  const user = await requireSession();
  if (!canManage(user.role)) redirect("/");
  const { projectId, error } = await searchParams;

  const projects = await prisma.project.findMany({
    where: { status: "active" },
    include: { cases: { include: { page: true }, where: { status: "ready" } } },
    orderBy: { name: "asc" },
  });

  const testers = await prisma.user.findMany({
    where: { active: true, role: "TESTER" },
    orderBy: { name: "asc" },
  });

  const selected = projects.find((project) => project.id === projectId) ?? projects[0];

  return (
    <>
      <Topbar user={user} title="New test run" />
      <main className="flex-1 p-6">
        <form action={createRunAction} className="max-w-3xl space-y-4 rounded-xl border border-line bg-card p-6">
          <h1 className="text-2xl font-normal tracking-tight">Start a run</h1>
          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Project</span>
            <select name="projectId" defaultValue={selected?.id} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">Run name</span>
              <input name="name" required className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" placeholder="Website – Week 36" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Build</span>
              <input name="build" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" placeholder="1.4.0" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Due date</span>
              <input type="date" name="dueDate" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Assign all to</span>
              <select name="assigneeId" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
                <option value="">Assign later</option>
                {testers.map((tester) => (
                  <option key={tester.id} value={tester.id}>
                    {tester.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Cases to include</p>
            <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-line p-3">
              {(selected?.cases ?? []).map((testCase) => (
                <label key={testCase.id} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="caseIds" value={testCase.id} defaultChecked className="accent-blue" />
                  <span className="font-medium text-blue">{testCase.caseKey}</span>
                  <span>{testCase.title}</span>
                  <span className="text-xs text-muted">{testCase.page?.name ?? ""}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Leave all checked to include every ready case. Uncheck to drop some.</p>
          </div>

          <button className="rounded-lg bg-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-hover">
            Create run
          </button>
        </form>
      </main>
    </>
  );
}
