"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import {
  Bold,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  Heading,
  Link2,
  List,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Share2,
  Smile,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { CreateWorkItemModal } from "@/components/projects/create-work-item-modal";
import { IssueDetailsPanel } from "@/components/projects/issue-details-panel";
import { BackLink } from "@/components/ui/back-link";
import {
  addPageTaskCommentAction,
  deletePageTaskAction,
  linkPageTaskAction,
  updatePageTaskFieldsAction,
  updatePageTaskSlaAction,
} from "@/app/actions/page-tasks";
import { StatusTransitionMenu } from "@/components/projects/status-transition-menu";
import { formatFileSize, isImageFile } from "@/lib/files";
import { formatDateTime, initials } from "@/lib/format";
import { slaTimes, toDateTimeLocal } from "@/lib/task-key";
import type { Role } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export type IssuePerson = { id: string; name: string; role?: string };
export type IssueAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
};

export type IssueComment = {
  id: string;
  body: string;
  visibility: string;
  createdAt: string;
  userName: string;
  attachments: IssueAttachment[];
};
export type IssueActivity = {
  id: string;
  message: string;
  createdAt: string;
  userName: string;
};
export type LinkedIssue = { id: string; taskKey: string; title: string; pageId: string };
export type IssueTask = {
  id: string;
  taskKey: string;
  projectId: string;
  projectName: string;
  projectType: string;
  pageId: string;
  pageName: string;
  kind: string;
  title: string;
  details: string | null;
  priority: string;
  status: string;
  labels: string;
  createdAt: string;
  firstResponseAt: string | null;
  resolutionAt: string | null;
  reporterName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeIds: string[];
};

function Menu({
  label,
  icon,
  primary,
  children,
}: {
  label: string;
  icon?: ReactNode;
  primary?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-[3px] text-sm font-medium ${
          primary
            ? "bg-[#2563EB] px-2.5 py-1.5 text-white hover:bg-[#1D4ED8]"
            : label
              ? "border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[#172033] hover:bg-[#F1F5F9]"
              : "p-1.5 text-[#64748B] hover:bg-[#F1F5F9]"
        }`}
      >
        {icon}
        {label ? label : null}
        {label ? <ChevronDown size={14} /> : null}
      </button>
      {open ? (
        <>
          <button className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="absolute left-0 z-30 mt-1 min-w-[220px] rounded-[3px] border border-[#E2E8F0] bg-white py-1 shadow-[0_8px_16px_#091e4226]">
            <div onClick={() => setOpen(false)}>{children}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#172033] hover:bg-[#F1F5F9]"
    >
      {children}
    </button>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-1.5 text-sm">
      <span className="text-[#64748B]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[#E2E8F0] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748B]"
      >
        {title}
        <ChevronRight size={14} className={open ? "rotate-90" : ""} />
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </section>
  );
}

export function IssueDetailView({
  task,
  canEdit,
  canEditSla,
  canCreate,
  canAdmin,
  canWork,
  canComment,
  role,
  currentUserId,
  currentUserName,
  people,
  comments,
  activity,
  attachments,
  subtasks,
  links,
  linkable,
}: {
  task: IssueTask;
  canEdit: boolean;
  canEditSla: boolean;
  canCreate: boolean;
  canAdmin: boolean;
  canWork: boolean;
  canComment: boolean;
  role: Role;
  currentUserId: string;
  currentUserName: string;
  people: IssuePerson[];
  comments: IssueComment[];
  activity: IssueActivity[];
  attachments: IssueAttachment[];
  subtasks: LinkedIssue[];
  links: LinkedIssue[];
  linkable: LinkedIssue[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "comments" | "history" | "worklog" | "approvals">("comments");
  const [visibility, setVisibility] = useState<"internal" | "customer">("internal");
  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details ?? "");
  const [popup, setPopup] = useState<"subtask" | "create" | "link" | "workflow" | null>(null);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkPicked, setLinkPicked] = useState("");
  const [titleDirty, setTitleDirty] = useState(false);
  const [descDirty, setDescDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const slas = slaTimes(task.createdAt, task.firstResponseAt, task.resolutionAt);
  const [firstAt, setFirstAt] = useState(toDateTimeLocal(slas.firstResponse));
  const [resAt, setResAt] = useState(toDateTimeLocal(slas.resolution));
  const [slaDirty, setSlaDirty] = useState(false);
  const firstOverdue = slas.firstResponse.getTime() < Date.now() && task.status === "open";

  useEffect(() => {
    setTitle(task.title);
    setDetails(task.details ?? "");
    setTitleDirty(false);
    setDescDirty(false);
  }, [task.title, task.details]);

  useEffect(() => {
    const next = slaTimes(task.createdAt, task.firstResponseAt, task.resolutionAt);
    setFirstAt(toDateTimeLocal(next.firstResponse));
    setResAt(toDateTimeLocal(next.resolution));
    setSlaDirty(false);
  }, [task.createdAt, task.firstResponseAt, task.resolutionAt]);

  useEffect(() => {
    setShowAllActivity(false);
  }, [tab]);

  const timeline = useMemo(() => {
    const commentItems = comments.map((item) => ({
      id: item.id,
      kind: "comment" as const,
      createdAt: item.createdAt,
      userName: item.userName,
      message: item.body,
      visibility: item.visibility,
      attachments: item.attachments,
    }));
    const historyItems = activity.map((item) => ({
      id: item.id,
      kind: "history" as const,
      createdAt: item.createdAt,
      userName: item.userName,
      message: item.message,
      visibility: "internal",
      attachments: [] as IssueAttachment[],
    }));
    return [...commentItems, ...historyItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [activity, comments]);

  const visible = timeline.filter((item) => {
    if (tab === "comments") return item.kind === "comment";
    if (tab === "history") return item.kind === "history";
    if (tab === "all") return true;
    return false;
  });
  const shownActivity = showAllActivity ? visible : visible.slice(0, 5);
  const incomingComments = comments.filter(
    (item) => item.userName.trim().toLowerCase() !== currentUserName.trim().toLowerCase(),
  );
  const relatedHistory = activity.filter((item) =>
    /status|comment|note|assigned|replied/i.test(item.message),
  );

  function submit(action: (data: FormData) => Promise<void>, fill: (data: FormData) => void) {
    const data = new FormData();
    data.set("id", task.id);
    data.set("taskId", task.id);
    data.set("projectId", task.projectId);
    data.set("pageId", task.pageId);
    fill(data);
    startTransition(async () => {
      await action(data);
      router.refresh();
    });
  }

  function wrapDescription(before: string, after = before) {
    const box = descRef.current;
    if (!box) {
      setDetails((value) => `${before}${value}${after}`);
      setDescDirty(true);
      return;
    }
    const start = box.selectionStart;
    const end = box.selectionEnd;
    const selected = details.slice(start, end) || "text";
    const next = details.slice(0, start) + before + selected + after + details.slice(end);
    setDetails(next);
    setDescDirty(true);
  }

  function saveFields() {
    submit(updatePageTaskFieldsAction, (data) => {
      data.set("title", title);
      data.set("details", details);
      data.set("kind", task.kind);
      data.set("labels", task.labels);
    });
    setTitleDirty(false);
    setDescDirty(false);
    toast("Changes saved");
  }

  function saveSla() {
    submit(updatePageTaskSlaAction, (data) => {
      data.set("firstResponseAt", firstAt);
      data.set("resolutionAt", resAt);
    });
    setSlaDirty(false);
    toast("Times saved");
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <BackLink href={`/projects/${task.projectId}/pages/${task.pageId}`} label={task.pageName} />
            <span className="font-medium text-[#2563EB]">{task.taskKey}</span>
          </div>
          <div className="flex items-center gap-1 text-[#64748B]">
            <button
              type="button"
              className="rounded-[3px] p-1.5 hover:bg-[#F1F5F9]"
              title="Copy link"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
                toast("Link copied");
              }}
            >
              <Share2 size={16} />
            </button>
            <Link
              href={`/projects/${task.projectId}/pages/${task.pageId}`}
              className="rounded-[3px] p-1.5 hover:bg-[#F1F5F9]"
              title="Close"
            >
              <X size={16} />
            </Link>
            {canAdmin ? (
            <Menu label="" icon={<MoreHorizontal size={18} />}>
              <form action={deletePageTaskAction}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="projectId" value={task.projectId} />
                <input type="hidden" name="pageId" value={task.pageId} />
                <button className="w-full px-3 py-2 text-left text-sm text-[#DC2626] hover:bg-[#F1F5F9]">
                  Delete work item
                </button>
              </form>
            </Menu>
            ) : null}
          </div>
        </div>

        {canEdit ? (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">Summary</span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleDirty(true);
            }}
            placeholder="Enter a summary"
            className="w-full rounded-[3px] border border-[#E2E8F0] bg-white px-3 py-2.5 text-[20px] font-semibold leading-tight text-[#172033] outline-none focus:border-[#2563EB]"
          />
        </label>
        ) : (
          <div className="mt-4">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">Summary</span>
            <h1 className="text-[20px] font-semibold leading-tight text-[#172033]">{title}</h1>
          </div>
        )}
        {canEdit && titleDirty ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={saveFields}
              className="rounded-[3px] bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(task.title);
                setTitleDirty(false);
              }}
              className="rounded-[3px] px-3 py-1.5 text-sm text-[#172033] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {canCreate ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPopup("subtask")}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] px-2.5 py-1.5 text-sm text-[#172033] hover:bg-[#F1F5F9]"
          >
            <GitBranch size={14} />
            Create subtask
          </button>
          <button
            type="button"
            onClick={() => setPopup("link")}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] px-2.5 py-1.5 text-sm text-[#172033] hover:bg-[#F1F5F9]"
          >
            <Link2 size={14} />
            Link work item
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => setPopup("create")}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#2563EB] px-2.5 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            <Plus size={14} />
            Create
            <ChevronDown size={14} />
          </button>
          <Menu label="" icon={<MoreHorizontal size={16} />}>
            <MenuItem onClick={() => setPopup("subtask")}>Create subtask</MenuItem>
            <MenuItem onClick={() => setPopup("link")}>Link work item</MenuItem>
            <MenuItem onClick={() => setPopup("create")}>Create work item</MenuItem>
          </Menu>
        </div>
        ) : null}

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <Section title="Key details">
              <p className="text-sm text-[#172033]">
                <span className="font-medium">{task.reporterName}</span> raised this request via Portal
              </p>
            </Section>

            <Section title="Description">
              {canEdit ? (
              <div className="overflow-hidden rounded-[3px] border border-[#E2E8F0] focus-within:border-[#2563EB]">
                <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDetails(
                        details.trim().length > 20
                          ? details
                          : `${title || "This request"} needs review.\n\nSteps\n1. Reproduce on staging\n2. Note the actual result\n3. Confirm the expected result\n\n${details}`.trim(),
                      );
                      setDescDirty(true);
                    }}
                    className="mr-1 inline-flex items-center gap-1 rounded-[3px] px-2 py-1 text-xs font-medium text-[#172033] hover:bg-white"
                  >
                    <Sparkles size={13} className="text-[#2563EB]" />
                    Improve description
                  </button>
                  <span className="h-4 w-px bg-[#E2E8F0]" />
                  <button type="button" className="rounded-[3px] p-1 text-[#64748B] hover:bg-white" onClick={() => wrapDescription("## ", "")}>
                    <Heading size={14} />
                  </button>
                  <button type="button" className="rounded-[3px] p-1 text-[#64748B] hover:bg-white" onClick={() => wrapDescription("**")}>
                    <Bold size={14} />
                  </button>
                  <button type="button" className="rounded-[3px] p-1 text-[#64748B] hover:bg-white" onClick={() => wrapDescription("- ", "")}>
                    <List size={14} />
                  </button>
                  <button type="button" className="rounded-[3px] p-1 text-[#64748B] hover:bg-white" onClick={() => wrapDescription("😊", "")}>
                    <Smile size={14} />
                  </button>
                </div>
                <textarea
                  ref={descRef}
                  value={details}
                  onChange={(event) => {
                    setDetails(event.target.value);
                    setDescDirty(true);
                  }}
                  rows={7}
                  placeholder="Add a description…"
                  className="w-full resize-y border-0 px-3 py-2.5 text-sm outline-none"
                />
                {descDirty ? (
                  <div className="flex items-center gap-2 border-t border-[#E2E8F0] bg-white px-3 py-2">
                    <button
                      type="button"
                      onClick={saveFields}
                      className="rounded-[3px] bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetails(task.details ?? "");
                        setDescDirty(false);
                      }}
                      className="rounded-[3px] px-3 py-1.5 text-sm text-[#172033] hover:bg-[#F1F5F9]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
              ) : (
                <div className="rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3 text-sm leading-6 text-[#172033]">
                  <p className="whitespace-pre-wrap">{details.trim() || "No description provided."}</p>
                </div>
              )}
            </Section>

            {subtasks.length > 0 ? (
              <Section title="Subtasks">
                <div className="space-y-1">
                  {subtasks.map((item) => (
                    <Link
                      key={item.id}
                      href={`/projects/${task.projectId}/pages/${item.pageId}/tasks/${item.id}`}
                      className="flex items-center gap-2 rounded-[3px] px-2 py-1.5 text-sm hover:bg-[#F1F5F9]"
                    >
                      <span className="font-medium text-[#2563EB]">{item.taskKey}</span>
                      <span className="truncate text-[#172033]">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </Section>
            ) : null}

            {links.length > 0 ? (
              <Section title="Linked work items">
                <div className="space-y-1">
                  {links.map((item) => (
                    <Link
                      key={item.id}
                      href={`/projects/${task.projectId}/pages/${item.pageId}/tasks/${item.id}`}
                      className="flex items-center gap-2 rounded-[3px] px-2 py-1.5 text-sm hover:bg-[#F1F5F9]"
                    >
                      <Link2 size={14} className="text-[#64748B]" />
                      <span className="font-medium text-[#2563EB]">{item.taskKey}</span>
                      <span className="truncate">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </Section>
            ) : null}

            {attachments.length > 0 ? (
              <Section title="Attachments">
                <div className="grid gap-2 sm:grid-cols-2">
                  {attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.path}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-[3px] border border-[#E2E8F0] px-2 py-2 text-sm hover:bg-[#F8FAFC]"
                    >
                      {isImageFile(file.fileName, file.mimeType) ? (
                        <img src={file.path} alt="" className="h-10 w-10 rounded-[3px] object-cover" />
                      ) : (
                        <FileText size={18} className="text-[#2563EB]" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[#172033]">{file.fileName}</span>
                        <span className="text-xs text-[#64748B]">{formatFileSize(file.size)}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section title="Similar requests" defaultOpen={false}>
              <p className="text-sm text-[#64748B]">No similar requests found.</p>
            </Section>

            <div className="pt-4">
              <h2 className="text-sm font-semibold text-[#172033]">Activity</h2>
              {role === "TESTER" && (incomingComments.length > 0 || relatedHistory.length > 0) ? (
                <div className="mt-3 rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">
                    Messages for you
                  </p>
                  <div className="mt-2 space-y-2">
                    {incomingComments.length === 0 ? (
                      <p className="text-sm text-[#64748B]">No comments yet on this request.</p>
                    ) : (
                      incomingComments.map((item) => (
                        <article key={item.id} className="rounded-[3px] border-l-4 border-[#2563EB] bg-white px-3 py-2">
                          <p className="text-sm font-medium text-[#172033]">{item.userName}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-[#172033]">{item.body}</p>
                          <p className="mt-1 text-xs text-[#64748B]">{formatDateTime(item.createdAt)}</p>
                        </article>
                      ))
                    )}
                    {relatedHistory.slice(0, 4).map((item) => (
                      <p key={item.id} className="text-xs text-[#64748B]">
                        {item.userName}: {item.message} · {formatDateTime(item.createdAt)}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1 border-b border-[#E2E8F0]">
                {(
                  [
                    ["all", "All"],
                    ["comments", "Comments"],
                    ["history", "History"],
                    ["worklog", "Work log"],
                    ["approvals", "Approvals"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`border-b-2 px-3 py-2 text-sm ${
                      tab === key
                        ? "border-[#2563EB] font-semibold text-[#2563EB]"
                        : "border-transparent text-[#64748B] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {tab === "worklog" ? (
                  <p className="text-sm text-[#64748B]">No work logged yet.</p>
                ) : null}
                {tab === "approvals" ? (
                  <p className="text-sm text-[#64748B]">No approvals required.</p>
                ) : null}
                {(tab === "all" || tab === "comments" || tab === "history") &&
                  shownActivity.map((item) => (
                    <div
                      key={item.id}
                      className={`flex gap-3 ${
                        item.kind === "comment" &&
                        item.userName.trim().toLowerCase() !== currentUserName.trim().toLowerCase()
                          ? "rounded-[3px] border-l-4 border-[#2563EB] bg-[#F8FAFC] p-2"
                          : ""
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                        {initials(item.userName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium text-[#172033]">{item.userName}</span>{" "}
                          <span className="text-[#64748B]">{item.kind === "comment" ? "commented" : item.message}</span>
                        </p>
                        {item.kind === "comment" ? (
                          <div className="mt-1 rounded-[3px] bg-[#F8FAFC] px-3 py-2 text-sm text-[#172033]">
                            {item.visibility === "customer" ? (
                              <p className="mb-1 text-[11px] font-semibold uppercase text-[#2563EB]">Reply to customer</p>
                            ) : (
                              <p className="mb-1 text-[11px] font-semibold uppercase text-[#64748B]">Internal note</p>
                            )}
                            <p className="whitespace-pre-wrap">{item.message}</p>
                            {item.attachments.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.attachments.map((file) =>
                                  isImageFile(file.fileName, file.mimeType) ? (
                                    <a key={file.id} href={file.path} target="_blank" rel="noreferrer">
                                      <img src={file.path} alt={file.fileName} className="h-20 w-20 rounded-[3px] object-cover" />
                                    </a>
                                  ) : (
                                    <a
                                      key={file.id}
                                      href={file.path}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-[3px] bg-white px-2 py-1 text-xs text-[#2563EB]"
                                    >
                                      <FileText size={12} />
                                      {file.fileName}
                                    </a>
                                  ),
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <p className="mt-1 text-xs text-[#64748B]">{formatDateTime(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                {(tab === "all" || tab === "comments" || tab === "history") && visible.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllActivity((value) => !value)}
                    className="text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    {showAllActivity ? "Show less" : `Show all (${visible.length})`}
                  </button>
                ) : null}
              </div>

              {canComment ? (
              <form
                key={comments.length}
                className="mt-6 rounded-[3px] border border-[#E2E8F0] bg-white"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  pickedFiles.forEach((file) => data.append("files", file));
                  const body = String(data.get("body") || "").trim();
                  if (!body && pickedFiles.length === 0) {
                    toast("Add a note before saving", "error");
                    return;
                  }
                  startTransition(async () => {
                    await addPageTaskCommentAction(data);
                    setPickedFiles([]);
                    if (fileRef.current) fileRef.current.value = "";
                    form.reset();
                    toast(visibility === "customer" ? "Reply saved" : "Note saved");
                    router.refresh();
                  });
                }}
              >
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="projectId" value={task.projectId} />
                <input type="hidden" name="pageId" value={task.pageId} />
                <input type="hidden" name="visibility" value={role === "FIXER" ? "internal" : visibility} />
                {role === "FIXER" ? (
                  <div className="border-b border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#172033]">
                    Add a comment
                  </div>
                ) : (
                <div className="flex border-b border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setVisibility("internal")}
                    className={`px-3 py-2 text-sm ${
                      visibility === "internal" ? "font-semibold text-[#172033]" : "text-[#64748B]"
                    }`}
                  >
                    Add internal note
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("customer")}
                    className={`px-3 py-2 text-sm ${
                      visibility === "customer" ? "font-semibold text-[#2563EB]" : "text-[#64748B]"
                    }`}
                  >
                    Reply to customer
                  </button>
                </div>
                )}
                <textarea
                  ref={commentRef}
                  name="body"
                  rows={3}
                  placeholder={role === "FIXER" ? "Write a comment…" : visibility === "customer" ? "Reply to customer…" : "Add an internal note…"}
                  className="w-full resize-none border-0 px-3 py-3 text-sm outline-none"
                />
                {pickedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2 border-t border-[#E2E8F0] px-3 py-2">
                    {pickedFiles.map((file, index) => (
                      <span
                        key={`${file.name}-${index}`}
                        className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-1 text-xs text-[#172033]"
                      >
                        {file.type.startsWith("image/") ? "Image" : "DOCX"} · {file.name}
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => setPickedFiles(pickedFiles.filter((_, item) => item !== index))}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-[#E2E8F0] px-3 py-2">
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/gif,image/webp,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(event) => {
                        const next = Array.from(event.target.files ?? []);
                        setPickedFiles(next);
                      }}
                    />
                    {role !== "FIXER" ? (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-sm text-[#64748B] hover:bg-[#F1F5F9]"
                    >
                      <Paperclip size={16} />
                      Attach image or DOCX
                    </button>
                    ) : (
                      <span className="text-xs text-[#64748B]">Comment only</span>
                    )}
                    <span className="rounded-[3px] bg-[#F1F5F9] px-2 py-0.5 text-xs">Freeform</span>
                  </div>
                  <button
                    className="rounded-[3px] bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
                    disabled={pending}
                  >
                    Save
                  </button>
                </div>
              </form>
              ) : (
                <p className="mt-6 text-sm text-[#64748B]">
                  {role === "FIXER"
                    ? "You can view this work item and add a comment."
                    : "Comments are available on this work item."}
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusTransitionMenu
                task={{
                  id: task.id,
                  projectId: task.projectId,
                  pageId: task.pageId,
                  status: task.status,
                }}
                canEdit={canWork}
              />
              <Menu label="Automation" icon={<Zap size={14} />}>
                <MenuItem onClick={() => setPopup("workflow")}>
                  <GitBranch size={14} />
                  View workflow
                </MenuItem>
                <MenuItem onClick={() => setTab("history")}>
                  <Sparkles size={14} />
                  Suggest similar requests
                </MenuItem>
              </Menu>
            </div>

            <Section title="SLAs">
              <div className="space-y-3 text-sm">
                <label className="block">
                  <span className="mb-1.5 block text-[#64748B]">Time to first response</span>
                  {canEditSla ? (
                    <input
                      type="datetime-local"
                      value={firstAt}
                      onChange={(event) => {
                        setFirstAt(event.target.value);
                        setSlaDirty(true);
                      }}
                      className={`w-full rounded-[3px] border px-2 py-1.5 text-sm outline-none focus:border-[#2563EB] ${
                        firstOverdue ? "border-[#f87168] bg-[#FEF2F2] text-[#DC2626]" : "border-[#E2E8F0] bg-[#DCFCE7] text-[#16A34A]"
                      }`}
                    />
                  ) : (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        firstOverdue ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#16A34A]"
                      }`}
                    >
                      {formatDateTime(slas.firstResponse)}
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[#64748B]">Time to resolution</span>
                  {canEditSla ? (
                    <input
                      type="datetime-local"
                      value={resAt}
                      onChange={(event) => {
                        setResAt(event.target.value);
                        setSlaDirty(true);
                      }}
                      className="w-full rounded-[3px] border border-[#E2E8F0] bg-[#DCFCE7] px-2 py-1.5 text-sm text-[#16A34A] outline-none focus:border-[#2563EB]"
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs font-semibold text-[#172033]">
                      <Clock3 size={12} />
                      {formatDateTime(slas.resolution)}
                    </span>
                  )}
                </label>
                {canEditSla && slaDirty ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={saveSla}
                      className="rounded-[3px] bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
                    >
                      Save times
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFirstAt(toDateTimeLocal(slas.firstResponse));
                        setResAt(toDateTimeLocal(slas.resolution));
                        setSlaDirty(false);
                      }}
                      className="rounded-[3px] px-3 py-1.5 text-sm text-[#172033] hover:bg-[#F1F5F9]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            </Section>

            <Section title="Details">
              <IssueDetailsPanel
                task={task}
                people={people}
                currentUserId={currentUserId}
                title={title}
                details={details}
                canEdit={canEdit}
                workType={task.projectType}
              />
            </Section>

            <Section title="Development" defaultOpen={false}>
              <p className="text-sm text-[#64748B]">No development information.</p>
            </Section>

            <Section title="More fields" defaultOpen={false}>
              <FieldRow label="Participants">{task.reporterName}</FieldRow>
              <FieldRow label="Approvers">None</FieldRow>
              <FieldRow label="Organizations">{task.projectName}</FieldRow>
              <FieldRow label="Page">{task.pageName}</FieldRow>
            </Section>
          </aside>
        </div>
      </div>

      {canCreate ? (
        <>
      <CreateWorkItemModal
        open={popup === "create"}
        onClose={() => setPopup(null)}
        projectId={task.projectId}
        projectName={task.projectName}
        pageId={task.pageId}
        pageName={task.pageName}
        people={people}
        workType={task.projectType}
      />
      <CreateWorkItemModal
        open={popup === "subtask"}
        onClose={() => setPopup(null)}
        mode="subtask"
        projectId={task.projectId}
        projectName={task.projectName}
        pageId={task.pageId}
        pageName={task.pageName}
        people={people}
        parentId={task.id}
        parentKey={task.taskKey}
        parentTitle={task.title}
        workType={task.projectType}
      />
        </>
      ) : null}

      {canCreate && popup === "link" ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-16">
          <button type="button" className="fixed inset-0 bg-[#091e427a]" onClick={() => setPopup(null)} aria-label="Close" />
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-[3px] bg-white shadow-[0_8px_16px_rgba(9,30,66,.25)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3">
              <div>
                <h2 className="text-[16px] font-semibold text-[#172033]">Link work item</h2>
                <p className="text-xs text-[#64748B]">Relate another request to {task.taskKey}</p>
              </div>
              <button type="button" onClick={() => setPopup(null)} className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">Relation type</span>
                <select className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm">
                  <option>Relates to</option>
                  <option>Blocks</option>
                  <option>Is blocked by</option>
                  <option>Duplicates</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#64748B]">Work item</span>
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    value={linkQuery}
                    onChange={(event) => setLinkQuery(event.target.value)}
                    placeholder="Search by key or summary"
                    className="w-full rounded-[3px] border border-[#E2E8F0] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]"
                  />
                </div>
              </label>
              <div className="max-h-56 overflow-auto rounded-[3px] border border-[#E2E8F0]">
                {linkable
                  .filter((item) => {
                    const needle = linkQuery.trim().toLowerCase();
                    if (!needle) return true;
                    return item.taskKey.toLowerCase().includes(needle) || item.title.toLowerCase().includes(needle);
                  })
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLinkPicked(item.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F1F5F9] ${
                        linkPicked === item.id ? "bg-[#EFF6FF]" : ""
                      }`}
                    >
                      <span className="font-medium text-[#2563EB]">{item.taskKey}</span>
                      <span className="truncate text-[#172033]">{item.title}</span>
                    </button>
                  ))}
                {linkable.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-[#64748B]">No other work items to link.</p>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
              <button type="button" onClick={() => setPopup(null)} className="rounded-[3px] px-3 py-1.5 text-sm hover:bg-[#F1F5F9]">
                Cancel
              </button>
              <button
                type="button"
                disabled={!linkPicked}
                onClick={() => {
                  submit(linkPageTaskAction, (data) => data.set("linkedId", linkPicked));
                  setPopup(null);
                  setLinkPicked("");
                }}
                className="rounded-[3px] bg-[#2563EB] px-3.5 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {popup === "workflow" ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-[#091e427a]" onClick={() => setPopup(null)} />
          <div className="relative w-full max-w-lg rounded-[3px] bg-white p-5 shadow-[0_8px_16px_#091e4226]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#172033]">Workflow</h2>
                <p className="mt-1 text-sm text-[#64748B]">Use the status button to move this request.</p>
              </div>
              <button type="button" onClick={() => setPopup(null)} className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                "To do → In progress",
                "In progress → Done",
                "Any open status → Canceled",
              ].map((step) => (
                <div key={step} className="rounded-[3px] bg-[#F8FAFC] px-3 py-2 text-[#172033]">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
