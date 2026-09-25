import Link from "next/link";
import { ArrowLeft, Bell, CircleHelp, Search, Settings } from "lucide-react";
import { PageTaskDialog } from "@/components/projects/page-task-dialog";
import { WorkspaceSwitch } from "@/components/projects/workspace-switch";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { initials } from "@/lib/format";

export function WorkQueueHeader({
  userName,
  canEdit,
  projectId,
  projectName,
  pageId,
  pageName,
  people = [],
  error,
  defaultOpen,
  workType,
  showTesting = true,
}: {
  userName: string;
  canEdit: boolean;
  projectId: string;
  projectName?: string;
  pageId: string;
  pageName: string;
  people?: { id: string; name: string }[];
  error?: string;
  defaultOpen?: boolean;
  workType?: string;
  showTesting?: boolean;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#E2E8F0] bg-[#172554] px-4">
      <p className="shrink-0 text-sm font-semibold text-white">QA Tracker</p>
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border border-white/20 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-white/10"
        title={projectName ? `Back to ${projectName}` : "Back to project"}
      >
        <ArrowLeft size={14} />
        Back to {projectName || "project"}
      </Link>
      <WorkspaceSwitch projectId={projectId} pageId={pageId} active="tasks" tone="dark" showTesting={showTesting} />
      <label className="relative mx-auto w-full max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          placeholder="Search"
          className="w-full rounded-[3px] border-0 bg-[#ffffff29] py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-[#94A3B8]"
        />
      </label>
      {canEdit ? (
        <PageTaskDialog
          projectId={projectId}
          projectName={projectName}
          pageId={pageId}
          pageName={pageName}
          people={people}
          error={error}
          defaultOpen={defaultOpen}
          workType={workType}
        />
      ) : null}
      <Bell size={18} className="text-white/80" />
      <CircleHelp size={18} className="text-white/80" />
      <Settings size={18} className="text-white/80" />
      <SignOutButton className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DC2626] text-[11px] font-bold text-white">
        {initials(userName)}
      </SignOutButton>
    </header>
  );
}
