import { fixLabel, pageTaskKindLabel, pageTaskStatusLabel, resultLabel, roleLabel } from "@/lib/format";

const resultClass: Record<string, string> = {
  pending: "bg-[#f1f3f4] text-muted",
  in_progress: "bg-blue-soft text-blue-ink",
  pass: "bg-success-soft text-success",
  fail: "bg-danger-soft text-danger",
  blocked: "bg-warning-soft text-warning",
  skipped: "bg-[#f1f3f4] text-muted",
};

const fixClass: Record<string, string> = {
  open: "bg-danger-soft text-danger",
  in_progress: "bg-blue-soft text-blue-ink",
  fixed: "bg-purple-soft text-purple",
  retest: "bg-warning-soft text-warning",
  closed: "bg-success-soft text-success",
  wont_fix: "bg-[#f1f3f4] text-muted",
};

const priorityClass: Record<string, string> = {
  P0: "bg-danger-soft text-danger",
  P1: "bg-warning-soft text-warning",
  P2: "bg-blue-soft text-blue-ink",
  P3: "bg-[#f1f3f4] text-muted",
};

export function ResultBadge({ result }: { result: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${resultClass[result] ?? resultClass.pending}`}
    >
      {resultLabel(result)}
    </span>
  );
}

export function FixBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${fixClass[status] ?? fixClass.open}`}
    >
      {fixLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClass[priority] ?? priorityClass.P2}`}
    >
      {priority}
    </span>
  );
}

const kindClass: Record<string, string> = {
  issue: "bg-danger-soft text-danger",
  refine: "bg-blue-soft text-blue-ink",
  redesign: "bg-purple-soft text-purple",
  fix_bug: "bg-danger-soft text-danger",
  fix_ui: "bg-warning-soft text-warning",
};

const pageTaskStatusClass: Record<string, string> = {
  open: "bg-warning-soft text-warning",
  in_progress: "bg-blue-soft text-blue-ink",
  ready_for_testing: "bg-warning-soft text-warning",
  done: "bg-success-soft text-success",
  wont_do: "bg-[#f1f3f4] text-muted",
};

export function PageTaskKindBadge({ kind }: { kind: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${kindClass[kind] ?? kindClass.issue}`}
    >
      {pageTaskKindLabel(kind)}
    </span>
  );
}

export function PageTaskStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pageTaskStatusClass[status] ?? pageTaskStatusClass.open}`}
    >
      {pageTaskStatusLabel(status)}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-soft px-2.5 py-0.5 text-xs font-medium text-blue-ink">
      {roleLabel(role)}
    </span>
  );
}
