import { canManage, requireSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProjectForm } from "@/components/projects/project-form";
import { BackLink } from "@/components/ui/back-link";
import { findProjectById } from "@/lib/data";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSession();
  if (!(await canManage(user.role))) redirect("/projects");
  const { id } = await params;
  const project = await findProjectById(id);
  if (!project) notFound();

  return (
    <>
      <Topbar user={user} title={`Edit ${project.name}`} />
      <main className="flex-1 bg-page px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5">
          <BackLink href={`/projects/${project.id}`} label={project.name} />
        </div>
        <div className="max-w-[720px]">
          <ProjectForm project={project} />
        </div>
      </main>
    </>
  );
}
