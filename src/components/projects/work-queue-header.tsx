import { Bell, CircleHelp, Search, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { PageTaskDialog } from "@/components/projects/page-task-dialog";
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
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#dcdfe4] bg-[#1d2856] px-4">
      <p className="text-sm font-semibold text-white">QA Tracker</p>
      <label className="relative mx-auto w-full max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9fadbc]" />
        <input
          placeholder="Search"
          className="w-full rounded-[3px] border-0 bg-[#ffffff29] py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-[#9fadbc]"
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
        />
      ) : null}
      <Bell size={18} className="text-white/80" />
      <CircleHelp size={18} className="text-white/80" />
      <Settings size={18} className="text-white/80" />
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e34935] text-[11px] font-bold text-white"
          title="Sign out"
        >
          {initials(userName)}
        </button>
      </form>
    </header>
  );
}
