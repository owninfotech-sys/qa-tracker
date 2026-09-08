import { canManage, requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { NewProjectForm } from "@/components/projects/new-project-form";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  if (!canManage(user.role)) redirect("/projects");
  const { error } = await searchParams;

  return (
    <>
      <Topbar user={user} title="New project" />
      <main className="flex-1 bg-[linear-gradient(180deg,#eef4ff_0%,#f8f9fa_180px)] p-6 lg:p-10">
        <div className="mx-auto w-full max-w-2xl">
          <Link href="/projects" className="mb-4 inline-block text-sm font-medium text-blue hover:underline">
            ← Back to projects
          </Link>
          <NewProjectForm error={error} />
        </div>
      </main>
    </>
  );
}
