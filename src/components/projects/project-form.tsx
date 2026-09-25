"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { CalendarClock, Figma, FolderKanban, Link2 } from "lucide-react";
import { createProjectAction, updateProjectDetailsAction } from "@/app/actions/projects";
import { PageNameFields } from "@/components/projects/page-name-fields";
import { toast } from "@/components/ui/toast";
import { useProcess } from "@/components/ui/app-loader";
import { toDateInput } from "@/lib/format";

const fieldClass =
  "w-full rounded-[3px] border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-[#94A3B8] transition";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  useProcess(pending);
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[3px] bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_#091e4240] transition hover:bg-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (editing ? "Saving…" : "Creating…") : editing ? "Save project" : "Create project"}
    </button>
  );
}

export function ProjectForm({
  error,
  project,
}: {
  error?: string;
  project?: {
    id: string;
    name: string;
    url?: string | null;
    figmaUrl?: string | null;
    deadline?: Date | string | null;
  };
}) {
  const router = useRouter();
  const editing = Boolean(project);

  return (
    <form
      action={async (formData) => {
        if (!editing) {
          await createProjectAction(formData);
          return;
        }
        const result = await updateProjectDetailsAction(formData);
        if (!result.ok) {
          toast(result.error, "error");
          return;
        }
        toast("Project saved");
        router.push(`/projects/${project?.id}`);
        router.refresh();
      }}
      className="overflow-hidden rounded-[3px] border border-line bg-card shadow-[0_1px_1px_#091e4214,0_8px_24px_#091e4208]"
    >
      <div className="h-1 bg-blue" />

      <div className="flex items-start gap-4 border-b border-line px-6 py-5 sm:px-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] bg-navy text-white shadow-[0_1px_2px_#091e4240]">
          <FolderKanban size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            {editing ? "Edit project" : "Create project"}
          </h1>
          <p className="mt-1 text-sm leading-5 text-muted">
            {editing
              ? "Update the name, deadline, site, and Figma link."
              : "Every project includes task management and testing."}
          </p>
        </div>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-7">
        {error ? (
          <p className="rounded-[3px] bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        {editing ? <input type="hidden" name="id" value={project?.id} /> : null}
        <input type="hidden" name="type" value="tasks" />

        <section className="space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Project</p>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Project name</span>
            <input
              name="name"
              required
              defaultValue={project?.name ?? ""}
              className={fieldClass}
              placeholder="Website launch"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">
              Deadline
              <span className="ml-1.5 font-normal text-muted">Optional</span>
            </span>
            <span className="relative block">
              <CalendarClock
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="date"
                name="deadline"
                defaultValue={toDateInput(project?.deadline)}
                className={`${fieldClass} pl-10`}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">
              Site URL
              <span className="ml-1.5 font-normal text-muted">Optional</span>
            </span>
            <span className="relative block">
              <Link2
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                name="url"
                defaultValue={project?.url ?? ""}
                className={`${fieldClass} pl-10`}
                placeholder="https://example.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">
              Figma
              <span className="ml-1.5 font-normal text-muted">Optional</span>
            </span>
            <span className="relative block">
              <Figma
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                name="figmaUrl"
                defaultValue={project?.figmaUrl ?? ""}
                className={`${fieldClass} pl-10`}
                placeholder="https://www.figma.com/design/..."
              />
            </span>
          </label>
        </section>

        {editing ? null : (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Areas</p>
            <div className="mt-3">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Pages</span>
              <div className="rounded-[3px] border border-line bg-[#F8FAFC] p-4">
                <PageNameFields hint="Add pages such as Home, Login, or Checkout. Press Enter or +." />
              </div>
              <span className="mt-1.5 block text-xs text-muted">If you skip this, a General page is created.</span>
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-[#F8FAFC] px-6 py-4 sm:px-7">
        <Link
          href={editing ? `/projects/${project?.id}` : "/projects"}
          className="rounded-[3px] px-3.5 py-2.5 text-sm font-medium text-muted transition hover:bg-white hover:text-ink"
        >
          Cancel
        </Link>
        <SubmitButton editing={editing} />
      </div>
    </form>
  );
}
