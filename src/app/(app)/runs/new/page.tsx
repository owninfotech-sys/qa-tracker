import { redirect } from "next/navigation";
import { canManageRuns, requireSession } from "@/lib/auth";
import { findActiveProjectsForRun, findUsers } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { createRunAction } from "@/app/actions/runs";
import { WorkspaceSwitch } from "@/components/projects/workspace-switch";
import { roleLabel } from "@/lib/format";
import { testingHref } from "@/lib/workspace";
import { BackLink } from "@/components/ui/back-link";

export default async function NewRunPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; error?: string }>;
}) {
  const user = await requireSession();
  if (!(await canManageRuns(user.role))) redirect("/");
  const { projectId, error } = await searchParams;

  const projects = await findActiveProjectsForRun();
  const people = await findUsers({ active: true, orderBy: "createdAt" });
  const selected = projects.find((project) => project.id === projectId) ?? projects[0];

  return (
    <>
      <Topbar user={user} title="New test run" />
      <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        {selected ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <BackLink href={testingHref(selected.id)} label={`${selected.name} · Testing`} />
            <WorkspaceSwitch projectId={selected.id} active="testing" />
          </div>
        ) : null}
        <form action={createRunAction} className="max-w-3xl space-y-4 rounded-[3px] border border-[#E2E8F0] bg-white p-6">
          <h1 className="text-xl font-semibold tracking-tight text-[#172033]">Start a run</h1>
          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Project</span>
            <select name="projectId" defaultValue={selected?.id} className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm">
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
              <input name="name" required className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" placeholder="Website – Week 36" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Build</span>
              <input name="build" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" placeholder="1.4.0" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Due date</span>
              <input type="date" name="dueDate" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Assign all to</span>
              <select name="assigneeId" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 text-sm">
                <option value="">Assign later</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {roleLabel(person.role)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Cases to include</p>
            <div className="max-h-72 space-y-2 overflow-auto rounded-[3px] border border-[#E2E8F0] p-3">
              {(selected?.cases ?? []).map((testCase) => (
                <label key={testCase.id} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="caseIds" value={testCase.id} defaultChecked className="accent-blue" />
                  <span className="font-medium text-[#2563EB]">{testCase.caseKey}</span>
                  <span>{testCase.title}</span>
                  <span className="text-xs text-[#64748B]">{testCase.page?.name ?? ""}</span>
                </label>
              ))}
              {selected && !selected.cases?.length ? (
                <p className="text-sm text-[#64748B]">Add test cases first, then start a run.</p>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-[#64748B]">Leave all checked to include every ready case. Uncheck to drop some.</p>
          </div>

          <button className="rounded-[3px] bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8]">
            Create run
          </button>
        </form>
      </main>
    </>
  );
}
