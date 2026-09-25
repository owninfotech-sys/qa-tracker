"use client";

import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";
import { submitWorkReportAction } from "@/app/actions/page-tasks";
import { toast } from "@/components/ui/toast";
import { useProcess } from "@/components/ui/app-loader";

export function WorkReportDialog({
  open,
  kind,
  projectId,
  pageId,
  taskId,
  taskKey,
  taskTitle,
  reportId,
  dueAt,
  defaultBody,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  kind: "task_done" | "day_complete";
  projectId: string;
  pageId: string;
  taskId?: string;
  taskKey?: string;
  taskTitle?: string;
  reportId?: string;
  dueAt?: string | null;
  defaultBody?: string;
  onClose: () => void;
  onSubmitted?: (body?: string) => void;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  useProcess(pending);
  const [remain, setRemain] = useState("");

  useEffect(() => {
    if (open) setBody(defaultBody ?? "");
  }, [defaultBody, open]);

  useEffect(() => {
    if (!open || !dueAt) {
      setRemain("");
      return;
    }
    const deadline = dueAt;
    function tick() {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) {
        setRemain("Overdue");
        return;
      }
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setRemain(`${mins}:${String(secs).padStart(2, "0")} left`);
    }
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [dueAt, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#172033]/40" aria-label="Close" onClick={onClose} />
      <form
        className="relative w-full max-w-2xl rounded-[3px] bg-white p-5 shadow-[0_12px_32px_rgba(23,32,51,.18)]"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setPending(true);
          const result = await submitWorkReportAction(data);
          setPending(false);
          if (!result.ok) {
            toast(result.error || "Could not save the report", "error");
            return;
          }
          toast(kind === "day_complete" ? "Today's report saved" : "Done report saved");
          onSubmitted?.(body);
          onClose();
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="pageId" value={pageId} />
        <input type="hidden" name="kind" value={kind} />
        {taskId ? <input type="hidden" name="taskId" value={taskId} /> : null}
        {reportId ? <input type="hidden" name="reportId" value={reportId} /> : null}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#172033]">
              {kind === "day_complete" ? "Today's progress report" : "Done report"}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {kind === "day_complete"
                ? "Written like a daily update: greeting, numbered done items, next work, and thank you."
                : `Add a short report for ${taskKey ?? "this task"}${taskTitle ? ` · ${taskTitle}` : ""}.`}
            </p>
          </div>
          <button type="button" className="rounded-[3px] p-1 text-[#64748B] hover:bg-[#F8FAFC]" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {kind === "day_complete" && remain ? (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-[3px] bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#D97706]">
            <Clock3 size={13} />
            Submit within 15 minutes · {remain}
          </p>
        ) : null}
        <textarea
          name="body"
          required
          rows={16}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            kind === "day_complete"
              ? "Hi …\n\nI hope you are doing well.\n\nToday's progress report:\n#1. …"
              : "What was done, how it was verified, and anything the admin should know."
          }
          className="w-full rounded-[3px] border border-[#E2E8F0] px-3 py-2.5 font-sans text-sm leading-6 outline-none focus:border-[#2563EB]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[3px] px-3 py-1.5 text-sm text-[#172033] hover:bg-[#F8FAFC]">
            Later
          </button>
          <button
            disabled={pending}
            className="rounded-[3px] bg-[#2563EB] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            Save report
          </button>
        </div>
      </form>
    </div>
  );
}
