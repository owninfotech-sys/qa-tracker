"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Headphones, UserRound, X } from "lucide-react";
import { assignPageTaskAction, updatePageTaskAction, updatePageTaskFieldsAction } from "@/app/actions/page-tasks";
import { initials, pageTaskKindLabel } from "@/lib/format";
import { kindsForFilter } from "@/lib/work-type";
import { toast } from "@/components/ui/toast";

type Person = { id: string; name: string };

const priorityMeta: Record<string, { bars: number; color: string; label: string }> = {
  P0: { bars: 3, color: "bg-[#DC2626]", label: "Highest" },
  P1: { bars: 3, color: "bg-[#D97706]", label: "High" },
  P2: { bars: 2, color: "bg-[#D97706]", label: "Medium" },
  P3: { bars: 1, color: "bg-[#22a06b]", label: "Low" },
};

const articles: Record<string, { title: string; body: string }[]> = {
  task: [
    { title: "Assigning work", body: "Give the task an owner, set priority, then move it to In progress when work starts." },
  ],
  issue: [
    { title: "How we triage IT help", body: "Assign an owner, set priority, then move status to In progress when work starts." },
    { title: "Writing a useful summary", body: "Say what is broken, where it happens, and what should happen instead." },
  ],
  refine: [
    { title: "Copy and polish checklist", body: "Check spacing, labels, empty states, and mobile wrap before marking resolved." },
  ],
  redesign: [
    { title: "Layout review", body: "Capture the current flow, the proposed change, and who must approve it." },
  ],
  fix_bug: [
    { title: "Bug fix checklist", body: "Reproduce the fail, note the expected result, then assign a fixer and retest after the patch." },
  ],
  fix_ui: [
    { title: "UI issue checklist", body: "Capture the screen, the broken layout or style, and the expected look on desktop and mobile." },
  ],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[128px_1fr] items-start gap-3 py-2 text-sm">
      <span className="pt-1.5 text-[#64748B]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PriorityBars({ priority }: { priority: string }) {
  const meta = priorityMeta[priority] ?? priorityMeta.P2;
  return (
    <span className="inline-flex h-3.5 items-end gap-px">
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className={`w-[3px] rounded-sm ${index < meta.bars ? meta.color : "bg-[#E2E8F0]"}`}
          style={{ height: 6 + index * 3 }}
        />
      ))}
    </span>
  );
}

export function IssueDetailsPanel({
  task,
  people,
  currentUserId,
  title,
  details,
  canEdit,
  workType,
}: {
  task: {
    id: string;
    projectId: string;
    pageId: string;
    kind: string;
    priority: string;
    labels: string;
    assigneeId: string | null;
    assigneeName: string | null;
    assigneeIds: string[];
    reporterName: string;
  };
  people: Person[];
  currentUserId: string;
  title: string;
  details: string;
  canEdit: boolean;
  workType?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [assigneeIds, setAssigneeIds] = useState(task.assigneeIds);
  const [kind, setKind] = useState(task.kind);
  const [priority, setPriority] = useState(task.priority);
  const [chips, setChips] = useState(
    task.labels.split(",").map((item) => item.trim()).filter(Boolean),
  );
  const [labelDraft, setLabelDraft] = useState("");
  const [kbOpen, setKbOpen] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setAssigneeIds(task.assigneeIds);
    setKind(task.kind);
    setPriority(task.priority);
    setChips(task.labels.split(",").map((item) => item.trim()).filter(Boolean));
  }, [task.assigneeIds, task.kind, task.priority, task.labels]);

  const selectedPeople = people.filter((person) => assigneeIds.includes(person.id));

  function saveAssignees(next: string[], note: string) {
    setAssigneeIds(next);
    run(
      assignPageTaskAction,
      (data) => {
        data.set("assigneeIds", next.join(","));
      },
      note,
    );
  }
  const kb = articles[kind] ?? articles.issue;

  function run(action: (data: FormData) => Promise<void>, fill: (data: FormData) => void, note: string) {
    const data = new FormData();
    data.set("id", task.id);
    data.set("projectId", task.projectId);
    data.set("pageId", task.pageId);
    fill(data);
    startTransition(async () => {
      await action(data);
      router.refresh();
      setSaved(note);
      toast(note);
      setTimeout(() => setSaved(""), 1600);
    });
  }

  function saveLabels(next: string[]) {
    setChips(next);
    run(
      updatePageTaskFieldsAction,
      (data) => {
        data.set("title", title);
        data.set("details", details);
        data.set("kind", kind);
        data.set("labels", next.join(","));
      },
      "Labels saved",
    );
  }

  function addLabel() {
    const next = labelDraft.trim().toLowerCase().replace(/\s+/g, "-");
    setLabelDraft("");
    if (!next || chips.includes(next)) return;
    saveLabels([...chips, next]);
  }

  return (
    <>
      <Field label="Assignee">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedPeople.length ? (
              selectedPeople.map((person) => (
                <span
                  key={person.id}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs font-medium text-[#172033]"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#E2E8F0] text-[9px] font-semibold">
                    {initials(person.name)}
                  </span>
                  {person.name}
                  {canEdit ? (
                    <button
                      type="button"
                      aria-label={`Remove ${person.name}`}
                      onClick={() =>
                        saveAssignees(
                          assigneeIds.filter((id) => id !== person.id),
                          "Assignee updated",
                        )
                      }
                    >
                      <X size={11} />
                    </button>
                  ) : null}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#64748B]">
                <UserRound size={14} />
                Unassigned
              </span>
            )}
            {canEdit && !assigneeIds.includes(currentUserId) ? (
              <button
                type="button"
                className="text-sm font-medium text-[#2563EB] hover:underline"
                onClick={() => saveAssignees([...assigneeIds, currentUserId], "Assigned to you")}
              >
                Assign to me
              </button>
            ) : null}
          </div>
          {canEdit ? (
          <select
            value=""
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value;
              if (!value || assigneeIds.includes(value)) return;
              saveAssignees([...assigneeIds, value], "Assignee updated");
            }}
            className="w-full rounded-[3px] border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm hover:bg-[#F8FAFC]"
          >
            <option value="">{selectedPeople.length ? "Add another person" : "Add assignee"}</option>
            {people
              .filter((person) => !assigneeIds.includes(person.id))
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
          </select>
          ) : null}
        </div>
      </Field>

      <Field label="Reporter">
        <span className="inline-flex items-center gap-1.5 pt-1">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E2E8F0] text-[10px] font-semibold">
            {initials(task.reporterName)}
          </span>
          {task.reporterName}
        </span>
      </Field>

      <Field label="Request type">
        <div className="flex items-center gap-2">
          <Headphones size={14} className="text-[#64748B]" />
          {canEdit ? (
          <select
            value={kind}
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value;
              setKind(value);
              run(
                updatePageTaskFieldsAction,
                (data) => {
                  data.set("title", title);
                  data.set("details", details);
                  data.set("kind", value);
                  data.set("labels", chips.join(","));
                },
                "Request type updated",
              );
            }}
            className="w-full rounded-[3px] border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm"
          >
            {kindsForFilter(workType, [kind]).map((value) => (
              <option key={value} value={value}>
                {pageTaskKindLabel(value)}
              </option>
            ))}
          </select>
          ) : (
            <span className="pt-1.5">{pageTaskKindLabel(kind)}</span>
          )}
        </div>
      </Field>

      <Field label="Knowledge base">
        <button
          type="button"
          onClick={() => setKbOpen(true)}
          className="inline-flex items-center gap-1.5 pt-1 font-medium text-[#2563EB] hover:underline"
        >
          <BookOpen size={14} />
          View related articles
        </button>
      </Field>

      <Field label="Priority">
        <div className="flex items-center gap-2">
          <PriorityBars priority={priority} />
          {canEdit ? (
          <select
            value={priority}
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value;
              setPriority(value);
              run(updatePageTaskAction, (data) => data.set("priority", value), "Priority updated");
            }}
            className="w-full rounded-[3px] border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm"
          >
            {Object.entries(priorityMeta).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          ) : (
            <span className="pt-0.5">{priorityMeta[priority]?.label ?? priority}</span>
          )}
        </div>
      </Field>

      <Field label="Labels">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1 rounded-full bg-[#F5F3FF] px-2 py-0.5 text-xs font-medium text-[#7C3AED]"
              >
                {chip}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => saveLabels(chips.filter((item) => item !== chip))}
                    aria-label={`Remove ${chip}`}
                  >
                    <X size={11} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          {canEdit ? (
          <input
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLabel();
              }
            }}
            onBlur={addLabel}
            placeholder="Add label"
            className="w-full rounded-[3px] border border-[#E2E8F0] px-2 py-1.5 text-sm outline-none focus:border-[#2563EB]"
          />
          ) : chips.length === 0 ? (
            <p className="text-sm text-[#64748B]">None</p>
          ) : null}
        </div>
      </Field>

      {saved ? <p className="pt-1 text-xs font-medium text-[#22a06b]">{saved}</p> : null}

      {kbOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-[#091e427a]" onClick={() => setKbOpen(false)} />
          <div className="relative w-full max-w-md rounded-[3px] bg-white p-5 shadow-[0_8px_16px_#091e4226]">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#172033]">Related articles</h2>
                <p className="text-xs text-[#64748B]">{pageTaskKindLabel(kind)}</p>
              </div>
              <button type="button" onClick={() => setKbOpen(false)} className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {kb.map((article) => (
                <article key={article.title} className="rounded-[3px] border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#172033]">{article.title}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{article.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
