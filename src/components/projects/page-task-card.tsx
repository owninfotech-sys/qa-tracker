"use client";

import { deletePageTaskAction, updatePageTaskAction } from "@/app/actions/page-tasks";
import { PriorityBadge } from "@/components/ui/status-badge";
import { TASK_STATUSES } from "@/lib/types";
import { pageTaskStatusLabel } from "@/lib/format";

export function PageTaskCard({
  task,
  canEdit,
}: {
  task: {
    id: string;
    projectId: string;
    pageId: string;
    title: string;
    details: string | null;
    priority: string;
    status: string;
  };
  canEdit: boolean;
}) {
  return (
    <article className="rounded-xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(60,64,67,.06)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.details ? <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted">{task.details}</p> : null}

      {canEdit ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <form action={updatePageTaskAction}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="projectId" value={task.projectId} />
            <input type="hidden" name="pageId" value={task.pageId} />
            <select
              name="status"
              defaultValue={task.status}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="rounded-lg border border-line bg-[#F8FAFC] px-2 py-1 text-xs"
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {pageTaskStatusLabel(status)}
                </option>
              ))}
            </select>
          </form>
          <form action={deletePageTaskAction}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="projectId" value={task.projectId} />
            <input type="hidden" name="pageId" value={task.pageId} />
            <button className="text-xs font-medium text-muted hover:text-danger">Remove</button>
          </form>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">{pageTaskStatusLabel(task.status)}</p>
      )}
    </article>
  );
}
