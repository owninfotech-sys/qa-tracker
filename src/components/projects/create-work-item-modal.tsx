"use client";

import { useMemo, useState } from "react";
import {
  Bold,
  Heading,
  Image as ImageIcon,
  List,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { createPageTaskAction } from "@/app/actions/page-tasks";
import { initials, pageTaskKindLabel, pageTaskStatusLabel, roleLabel } from "@/lib/format";
import { TASK_STATUSES, type PageTaskKind } from "@/lib/types";
import { defaultKindForWorkType, kindsForWorkType } from "@/lib/work-type";
import { FormPendingLoader } from "@/components/ui/app-loader";

export type CreatePerson = { id: string; name: string; role?: string };

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">
      {children}
      {required ? <span className="text-[#DC2626]"> *</span> : null}
    </span>
  );
}

function LabelEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const chips = useMemo(
    () => value.split(",").map((item) => item.trim()).filter(Boolean),
    [value],
  );

  function add(raw: string) {
    const next = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!next || chips.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...chips, next].join(","));
    setDraft("");
  }

  return (
    <div className="rounded-[3px] border border-[#E2E8F0] bg-white px-2 py-1.5 focus-within:border-[#2563EB] focus-within:shadow-[0_0_0_2px_#2563EB33]">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-[#F5F3FF] px-2 py-0.5 text-xs font-medium text-[#7C3AED]"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(chips.filter((item) => item !== chip).join(","))}
              className="text-[#7C3AED] hover:text-[#5B21B6]"
              aria-label={`Remove ${chip}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            }
          }}
          onBlur={() => add(draft)}
          placeholder={chips.length ? "Add another" : "demo-desk"}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-0.5 text-sm outline-none"
        />
      </div>
    </div>
  );
}

export function CreateWorkItemModal({
  open,
  onClose,
  projectId,
  projectName,
  pageId,
  pageName,
  people = [],
  error,
  mode = "create",
  parentId,
  parentKey,
  parentTitle,
  workType,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  pageId: string;
  pageName: string;
  people?: CreatePerson[];
  error?: string;
  mode?: "create" | "subtask";
  parentId?: string;
  parentKey?: string;
  parentTitle?: string;
  workType?: string;
}) {
  const kinds = kindsForWorkType(workType);
  const [kind, setKind] = useState<PageTaskKind>(defaultKindForWorkType(workType));
  const [details, setDetails] = useState("");
  const [labels, setLabels] = useState(mode === "create" ? "demo-desk" : "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const isSubtask = mode === "subtask";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 pt-10">
      <button type="button" className="fixed inset-0 bg-[#091e427a]" onClick={onClose} aria-label="Close" />
      <form
        action={createPageTaskAction}
        className="relative w-full max-w-[720px] overflow-hidden rounded-[3px] bg-white shadow-[0_8px_16px_rgba(9,30,66,.25)]"
      >
        <FormPendingLoader />
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#172033]">
              {isSubtask ? "Create subtask" : kinds[0] === "issue" ? "Create issue" : "Create task"}
            </h2>
            <p className="text-xs text-[#64748B]">
              {isSubtask
                ? `Child of ${parentKey ?? "this item"} · ${parentTitle ?? ""}`
                : `${projectName || "Project"} / ${pageName}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[74vh] space-y-4 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="rounded-[3px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{error}</p>
          ) : null}

          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="labels" value={labels} />
          {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel required>Project</FieldLabel>
              <input
                readOnly
                value={projectName ? `${projectName} · ${pageName}` : pageName}
                className="w-full rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#172033]"
              />
            </label>
            <label className="block">
              <FieldLabel required>Type</FieldLabel>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as PageTaskKind)}
                className="w-full rounded-[3px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
              >
                {kinds.map((value) => (
                  <option key={value} value={value}>
                    {pageTaskKindLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <FieldLabel required>Summary</FieldLabel>
            <input
              name="title"
              required
              autoFocus
              placeholder={isSubtask ? "What needs to be done?" : "What should the team do?"}
              className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_2px_#2563EB33]"
            />
          </label>

          <label className="block">
            <FieldLabel>Description</FieldLabel>
            <div className="overflow-hidden rounded-[3px] border border-[#E2E8F0] focus-within:border-[#2563EB] focus-within:shadow-[0_0_0_2px_#2563EB33]">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5">
                <span className="mr-1 inline-flex items-center gap-1 rounded-[3px] px-2 py-1 text-xs font-medium text-[#172033]">
                  <Sparkles size={13} className="text-[#2563EB]" />
                  Improve description
                </span>
                <span className="h-4 w-px bg-[#E2E8F0]" />
                {[Heading, Bold, List, ImageIcon, Smile].map((Icon, index) => (
                  <span key={index} className="rounded-[3px] p-1 text-[#64748B]">
                    <Icon size={14} />
                  </span>
                ))}
              </div>
              <textarea
                name="details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={6}
                placeholder="Add enough detail so the assigned person knows what to do."
                className="w-full resize-y border-0 px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Priority</FieldLabel>
              <select name="priority" defaultValue="P2" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm">
                <option value="P0">Highest</option>
                <option value="P1">High</option>
                <option value="P2">Medium</option>
                <option value="P3">Low</option>
              </select>
            </label>
            <label className="block">
              <FieldLabel>Status</FieldLabel>
              <select name="status" defaultValue="open" className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm">
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {pageTaskStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Assignees</FieldLabel>
              <input type="hidden" name="assigneeIds" value={assigneeIds.join(",")} />
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                {assigneeIds.length ? (
                  people
                    .filter((person) => assigneeIds.includes(person.id))
                    .map((person) => (
                      <span
                        key={person.id}
                        className="inline-flex items-center gap-1 rounded-[3px] bg-[#F1F5F9] px-2 py-0.5 text-xs font-medium"
                      >
                        {initials(person.name)} {person.name}
                        {person.role ? <span className="text-[#64748B]">· {roleLabel(person.role)}</span> : null}
                        <button
                          type="button"
                          onClick={() => setAssigneeIds(assigneeIds.filter((id) => id !== person.id))}
                          aria-label={`Remove ${person.name}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                ) : (
                  <span className="text-xs text-[#64748B]">No one assigned yet</span>
                )}
              </div>
              <select
                value=""
                onChange={(event) => {
                  const value = event.target.value;
                  if (value && !assigneeIds.includes(value)) setAssigneeIds([...assigneeIds, value]);
                }}
                className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm"
              >
                <option value="">{assigneeIds.length ? "Add another teammate" : "Assign a teammate"}</option>
                {people
                  .filter((person) => !assigneeIds.includes(person.id))
                  .map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                      {person.role ? ` · ${roleLabel(person.role)}` : ""}
                    </option>
                  ))}
              </select>
              {people.length === 0 ? (
                <p className="mt-1 text-[11px] text-[#64748B]">Add people on Team first, then assign them here.</p>
              ) : null}
            </label>
            <div>
              <FieldLabel>Labels</FieldLabel>
              <LabelEditor value={labels} onChange={setLabels} />
              <p className="mt-1 text-[11px] text-[#64748B]">Press Enter to add. Example: demo-desk</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-[3px] px-3 py-1.5 text-sm text-[#172033] hover:bg-[#F1F5F9]">
            Cancel
          </button>
          <button className="rounded-[3px] bg-[#2563EB] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]">
            {isSubtask ? "Create" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
