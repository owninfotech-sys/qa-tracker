"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { updatePageTaskAction } from "@/app/actions/page-tasks";
import { pageTaskStatusLabel } from "@/lib/format";

const transitions = [
  { action: "Respond to customer", status: "waiting_customer" },
  { action: "In progress", status: "in_progress" },
  { action: "Escalate", status: "escalated" },
  { action: "Pending", status: "pending" },
  { action: "Fixed ready for testing", status: "ready_for_testing" },
  { action: "Cancel request", status: "wont_do" },
  { action: "Resolve this issue", status: "done" },
] as const;

const pillTone: Record<string, string> = {
  open: "bg-[#deebff] text-[#0747a6]",
  waiting_customer: "bg-[#deebff] text-[#0747a6]",
  in_progress: "bg-[#deebff] text-[#0747a6]",
  escalated: "bg-[#deebff] text-[#0747a6]",
  pending: "bg-[#deebff] text-[#0747a6]",
  ready_for_testing: "bg-[#fff0b3] text-[#7f5f01]",
  done: "bg-[#e3fcef] text-[#006644]",
  wont_do: "bg-[#e3fcef] text-[#006644]",
};

function StatusPill({
  status,
  open,
  onClick,
}: {
  status: string;
  open?: boolean;
  onClick?: () => void;
}) {
  const className = `inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[12px] font-semibold ${pillTone[status] ?? pillTone.open}`;
  if (!onClick) {
    return <span className={className}>{pageTaskStatusLabel(status)}</span>;
  }
  return (
    <button type="button" onClick={onClick} className={`${className} hover:brightness-[0.97]`}>
      {pageTaskStatusLabel(status)}
      <ChevronDown size={12} className={open ? "rotate-180" : ""} />
    </button>
  );
}

export function StatusTransitionMenu({
  task,
  canEdit,
}: {
  task: { id: string; projectId: string; pageId: string; status: string };
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workflow, setWorkflow] = useState(false);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const labelId = useId();

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const box = triggerRef.current.getBoundingClientRect();
    setPos({ top: box.bottom + 4, left: box.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", () => setOpen(false));
    window.addEventListener("scroll", () => setOpen(false), true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(status: string) {
    if (status === task.status) {
      setOpen(false);
      return;
    }
    const data = new FormData();
    data.set("id", task.id);
    data.set("projectId", task.projectId);
    data.set("pageId", task.pageId);
    data.set("status", status);
    startTransition(async () => {
      await updatePageTaskAction(data);
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <>
      <div ref={triggerRef} className="relative inline-flex">
        {canEdit ? (
          <StatusPill status={task.status} open={open} onClick={() => setOpen((value) => !value)} />
        ) : (
          <StatusPill status={task.status} />
        )}
      </div>

      {open && canEdit
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-labelledby={labelId}
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-[80] w-[320px] rounded-[3px] border border-[#dcdfe4] bg-white py-1 shadow-[0_8px_16px_#091e4226,0_0_1px_#091e424f]"
            >
              {transitions.map((item) => (
                <button
                  key={item.status}
                  type="button"
                  role="menuitem"
                  disabled={pending}
                  onClick={() => choose(item.status)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[14px] text-[#172b4d] hover:bg-[#f1f2f4] disabled:opacity-60"
                >
                  <span>{item.action}</span>
                  <span className="inline-flex items-center gap-2 text-[#626f86]">
                    <span aria-hidden>→</span>
                    <StatusPill status={item.status} />
                  </span>
                </button>
              ))}
              <div className="my-1 border-t border-[#dcdfe4]" />
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[14px] text-[#0c66e4] hover:bg-[#f1f2f4]"
                onClick={() => {
                  setOpen(false);
                  setWorkflow(true);
                }}
              >
                View workflow
              </button>
            </div>,
            document.body,
          )
        : null}

      {workflow
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-[#091e427a]"
                aria-label="Close"
                onClick={() => setWorkflow(false)}
              />
              <div className="relative w-full max-w-lg rounded-[3px] bg-white p-5 shadow-[0_8px_16px_#091e4226]">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#172b4d]">Workflow</h2>
                    <p className="mt-1 text-sm text-[#626f86]">Available status transitions for this work item.</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-[#626f86] hover:bg-[#f1f2f4]"
                    onClick={() => setWorkflow(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {transitions.map((item) => (
                    <div key={item.status} className="flex items-center justify-between rounded-[3px] bg-[#f7f8f9] px-3 py-2 text-sm">
                      <span className="text-[#172b4d]">{item.action}</span>
                      <StatusPill status={item.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
