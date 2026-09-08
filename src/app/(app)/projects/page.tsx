import Link from "next/link";
import { Plus } from "lucide-react";
import { canManage, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { percent } from "@/lib/format";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { RsvpLink } from "@/components/projects/rsvp-link";

export default async function ProjectsPage() {
  const user = await requireSession();
  const manage = canManage(user.role);

  const projects = await prisma.project.findMany({
    where: { status: "active" },
    include: {
      pages: true,
      cases: true,
      runs: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Topbar user={user} title="Projects" />
      <main className="flex-1 bg-[#f4f5f7] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
            <p className="mt-1 text-sm text-muted">Websites and apps with pages, test points, and runs.</p>
          </div>
          {manage ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-hover"
            >
              <Plus size={16} />
              New project
            </Link>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            body="Create the first website or app so testers have something to run."
          >
            {manage ? (
              <Link href="/projects/new" className="text-sm font-medium text-blue">
                Create project
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const latest = project.runs[0];
              const total = latest?.items.length ?? 0;
              const done =
                latest?.items.filter((item) =>
                  ["pass", "fail", "blocked", "skipped"].includes(item.result),
                ).length ?? 0;
              const complete = percent(done, total);

              return (
                <article
                  key={project.id}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(60,64,67,.06)]"
                >
                  <Link href={`/projects/${project.id}`} className="flex flex-1 flex-col p-5 hover:bg-[#fafbfc]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-ink">{project.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                          {project.type} · {project.pages.length} pages · {project.cases.length} points
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-soft px-2.5 py-0.5 text-xs font-medium text-blue-ink">
                        {latest ? latest.status : "No run"}
                      </span>
                    </div>
                    <div className="mt-auto pt-6">
                      <div className="mb-1.5 flex justify-between text-xs text-muted">
                        <span className="truncate">{latest ? latest.name : "No active run"}</span>
                        <span>{total ? `${complete}%` : "—"}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eaed]">
                        <div
                          className="h-full rounded-full bg-blue"
                          style={{ width: `${complete}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                  {project.rsvpUrl || manage ? (
                    <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
                      <RsvpLink href={project.rsvpUrl} compact />
                      {manage ? <DeleteProjectButton id={project.id} name={project.name} compact /> : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
