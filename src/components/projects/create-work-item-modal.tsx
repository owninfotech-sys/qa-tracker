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
import { initials, pageTaskKindLabel, pageTaskStatusLabel } from "@/lib/format";
import { PAGE_TASK_KINDS, PAGE_TASK_STATUSES, type PageTaskKind } from "@/lib/types";

export type CreatePerson = { id: string; name: string };

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-[12px] font-semibold text-[#44546f]">
      {children}
      {required ? <span className="text-[#c9372c]"> *</span> : null}
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
    <div className="rounded-[3px] border border-[#dcdfe4] bg-white px-2 py-1.5 focus-within:border-[#0c66e4] focus-within:shadow-[0_0_0_2px_#0c66e433]">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-[#f3e8fd] px-2 py-0.5 text-xs font-medium text-[#5e4db2]"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(chips.filter((item) => item !== chip).join(","))}
              className="text-[#5e4db2] hover:text-[#352c63]"
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
}) {
  const [kind, setKind] = useState<PageTaskKind>("issue");
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
        <div className="flex items-center justify-between border-b border-[#dcdfe4] px-5 py-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#172b4d]">
              {isSubtask ? "Create subtask" : "Create work item"}
            </h2>
            <p className="text-xs text-[#626f86]">
              {isSubtask
                ? `Child of ${parentKey ?? "this item"} · ${parentTitle ?? ""}`
                : `${projectName || "Project"} / ${pageName}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-[#626f86] hover:bg-[#f1f2f4]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[74vh] space-y-4 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="rounded-[3px] bg-[#ffeceb] px-3 py-2 text-sm text-[#ae2e24]">{error}</p>
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
                className="w-full rounded-[3px] border border-[#dcdfe4] bg-[#f7f8f9] px-3 py-2 text-sm text-[#172b4d]"
              />
            </label>
            <label className="block">
              <FieldLabel required>Request type</FieldLabel>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as PageTaskKind)}
                className="w-full rounded-[3px] border border-[#dcdfe4] bg-white px-3 py-2 text-sm"
              >
                {PAGE_TASK_KINDS.map((value) => (
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
              placeholder={isSubtask ? "What needs to be done?" : "Triaging requests into queues"}
              className="w-full rounded-[3px] border border-[#dcdfe4] px-3 py-2 text-sm outline-none focus:border-[#0c66e4] focus:shadow-[0_0_0_2px_#0c66e433]"
            />
          </label>

          <label className="block">
            <FieldLabel>Description</FieldLabel>
            <div className="overflow-hidden rounded-[3px] border border-[#dcdfe4] focus-within:border-[#0c66e4] focus-within:shadow-[0_0_0_2px_#0c66e433]">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#dcdfe4] bg-[#f7f8f9] px-2 py-1.5">
                <span className="mr-1 inline-flex items-center gap-1 rounded-[3px] px-2 py-1 text-xs font-medium text-[#172b4d]">
                  <Sparkles size={13} className="text-[#0c66e4]" />
                  Improve description
                </span>
                <span className="h-4 w-px bg-[#dcdfe4]" />
                {[Heading, Bold, List, ImageIcon, Smile].map((Icon, index) => (
                  <span key={index} className="rounded-[3px] p-1 text-[#44546f]">
                    <Icon size={14} />
                  </span>
                ))}
              </div>
              <textarea
                name="details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={6}
                placeholder="Add more detail so testers and fixers know exactly what to do."
                className="w-full resize-y border-0 px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Priority</FieldLabel>
              <select name="priority" defaultValue="P2" className="w-full rounded-[3px] border border-[#dcdfe4] px-3 py-2 text-sm">
                <option value="P0">Highest</option>
                <option value="P1">High</option>
                <option value="P2">Medium</option>
                <option value="P3">Low</option>
              </select>
            </label>
            <label className="block">
              <FieldLabel>Status</FieldLabel>
              <select name="status" defaultValue="open" className="w-full rounded-[3px] border border-[#dcdfe4] px-3 py-2 text-sm">
                {PAGE_TASK_STATUSES.map((status) => (
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
                        className="inline-flex items-center gap-1 rounded-full bg-[#f1f2f4] px-2 py-0.5 text-xs font-medium"
                      >
                        {initials(person.name)} {person.name}
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
                  <span className="text-xs text-[#626f86]">No one assigned yet</span>
                )}
              </div>
              <select
                value=""
                onChange={(event) => {
                  const value = event.target.value;
                  if (value && !assigneeIds.includes(value)) setAssigneeIds([...assigneeIds, value]);
                }}
                className="w-full rounded-[3px] border border-[#dcdfe4] px-3 py-2 text-sm"
              >
                <option value="">{assigneeIds.length ? "Add another person" : "Add assignee"}</option>
                {people
                  .filter((person) => !assigneeIds.includes(person.id))
                  .map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
              </select>
            </label>
            <div>
              <FieldLabel>Labels</FieldLabel>
              <LabelEditor value={labels} onChange={setLabels} />
              <p className="mt-1 text-[11px] text-[#626f86]">Press Enter to add. Example: demo-desk</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#dcdfe4] bg-[#f7f8f9] px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-[3px] px-3 py-1.5 text-sm text-[#172b4d] hover:bg-[#f1f2f4]">
            Cancel
          </button>
          <button className="rounded-[3px] bg-[#0c66e4] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[#0055cc]">
            {isSubtask ? "Create" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
