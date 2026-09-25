import { canManage, requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProjectForm } from "@/components/projects/project-form";
import { BackLink } from "@/components/ui/back-link";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  if (!(await canManage(user.role))) redirect("/projects");
  const { error } = await searchParams;

  return (
    <>
      <Topbar user={user} title="New project" />
      <main className="flex-1 bg-page px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5">
          <BackLink href="/projects" label="Projects" />
        </div>

        <div className="max-w-[720px]">
          <ProjectForm error={error} />
        </div>
      </main>
    </>
  );
}
