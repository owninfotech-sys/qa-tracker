"use client";

import { useState } from "react";
import { AlertTriangle, Bug, LayoutGrid, Paintbrush, Sparkles } from "lucide-react";
import { createPageTaskAction } from "@/app/actions/page-tasks";
import { PAGE_TASK_KINDS, type PageTaskKind } from "@/lib/types";
import { pageTaskKindLabel } from "@/lib/format";

const kindMeta: Record<PageTaskKind, { hint: string; icon: typeof AlertTriangle }> = {
  issue: { hint: "Broken, missing, or incorrect behavior", icon: AlertTriangle },
  refine: { hint: "Copy, spacing, and small polish", icon: Sparkles },
  redesign: { hint: "Layout or flow needs a new approach", icon: Paintbrush },
  fix_bug: { hint: "A defect that needs a code or data fix", icon: Bug },
  fix_ui: { hint: "Layout, style, or visual problem", icon: LayoutGrid },
};

export function PageTaskForm({
  projectId,
  pageId,
  error,
}: {
  projectId: string;
  pageId: string;
  error?: string;
}) {
  const [kind, setKind] = useState<PageTaskKind>("issue");

  return (
    <form action={createPageTaskAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="kind" value={kind} />

      {error ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div>
        <span className="mb-2 block text-sm font-medium text-ink">Task type</span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PAGE_TASK_KINDS.map((value) => {
            const Icon = kindMeta[value].icon;
            const active = kind === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={`rounded-xl border p-3 text-left transition ${
                  active ? "border-blue bg-blue-soft shadow-sm" : "border-line bg-[#f8f9fa] hover:border-blue/40"
                }`}
              >
                <Icon size={16} className={active ? "text-blue" : "text-muted"} />
                <p className="mt-1.5 text-sm font-semibold text-ink">{pageTaskKindLabel(value)}</p>
                <p className="mt-0.5 text-xs text-muted">{kindMeta[value].hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Title</span>
        <input
          name="title"
          required
          className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3.5 py-2.5 text-sm transition focus:bg-white"
          placeholder="What needs work on this page?"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Details</span>
        <textarea
          name="details"
          rows={3}
          className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3.5 py-2.5 text-sm transition focus:bg-white"
          placeholder="Steps, expected result, or design notes"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Priority</span>
          <select name="priority" defaultValue="P2" className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3 py-2.5 text-sm">
            <option value="P0">P0 Critical</option>
            <option value="P1">P1 High</option>
            <option value="P2">P2 Medium</option>
            <option value="P3">P3 Low</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Status</span>
          <select name="status" defaultValue="open" className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3 py-2.5 text-sm">
            <option value="open">Waiting for support</option>
            <option value="waiting_customer">Waiting for customer</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="pending">Pending</option>
            <option value="ready_for_testing">Fixed ready for testing</option>
            <option value="done">Resolved</option>
            <option value="wont_do">Canceled</option>
          </select>
        </label>
      </div>

      <button className="rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-hover">
        Add task
      </button>
    </form>
  );
}
