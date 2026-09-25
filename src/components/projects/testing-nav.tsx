import Link from "next/link";
import { casesHref, newCaseHref, newRunHref, testingHref } from "@/lib/workspace";
import { WorkspaceSwitch } from "@/components/projects/workspace-switch";
import { BackLink } from "@/components/ui/back-link";

export function TestingNav({
  projectId,
  projectName,
  pageId,
  active,
  canAdd,
  manage,
}: {
  projectId: string;
  projectName: string;
  pageId?: string | null;
  active: "overview" | "cases" | "new-case" | "runs";
  canAdd?: boolean;
  manage?: boolean;
}) {
  const links = [
    { id: "overview", href: testingHref(projectId), label: "Overview" },
    { id: "cases", href: casesHref(projectId), label: "Test cases" },
  ];

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <BackLink href={`/projects/${projectId}`} label={projectName} />
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-[#172033]">{projectName}</h1>
          <p className="mt-1 text-sm text-[#64748B]">Testing workspace · cases, runs, and results</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceSwitch projectId={projectId} pageId={pageId} active="testing" />
          {canAdd ? (
            <Link
              href={newCaseHref(projectId)}
              className="rounded-[3px] border border-[#E2E8F0] bg-white px-3.5 py-2 text-sm font-medium text-[#172033] hover:bg-[#F1F5F9]"
            >
              Add case
            </Link>
          ) : null}
          {manage ? (
            <Link
              href={newRunHref(projectId)}
              className="rounded-[3px] bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
            >
              New run
            </Link>
          ) : null}
        </div>
      </div>
      <nav className="flex gap-1 border-b border-[#E2E8F0]">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              active === link.id || (active === "new-case" && link.id === "cases")
                ? "border-[#2563EB] font-semibold text-[#2563EB]"
                : "border-transparent text-[#64748B] hover:text-[#172033]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
