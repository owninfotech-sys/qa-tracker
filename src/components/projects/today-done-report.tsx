"use client";

import { useState, useTransition } from "react";
import { Copy, Eye, FileText, X } from "lucide-react";
import { requestDayReportAction } from "@/app/actions/page-tasks";
import { WorkReportDialog } from "@/components/projects/work-report-dialog";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { useProcess } from "@/components/ui/app-loader";

type SavedReport = {
  id: string;
  body: string | null;
  dueAt: string | null;
  submittedAt: string | null;
};

function ProgressReportBody({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <div className="max-h-[min(70vh,520px)] overflow-auto rounded-[3px] bg-[#D6E4FF] px-4 py-3 text-[15px] leading-6 text-[#172033]">
      {parts.map((line, index) => {
        const key = `${index}-${line.slice(0, 24)}`;
        if (!line) return <div key={key} className="h-2" />;
        if (line === "Today's progress report:") {
          return (
            <p key={key} className="mt-1 font-bold">
              {line}
            </p>
          );
        }
        if (/^#\d+\.\s/.test(line)) {
          return (
            <p key={key} className="mt-2 font-bold">
              {line}
            </p>
          );
        }
        if (/^https?:\/\//i.test(line.trim())) {
          return (
            <p key={key}>
              <a href={line.trim()} target="_blank" rel="noreferrer" className="text-[#1D4ED8] underline">
                {line.trim()}
              </a>
            </p>
          );
        }
        return <p key={key}>{line}</p>;
      })}
    </div>
  );
}

export function TodayDoneReport({
  projectId,
  projectName,
  pageId,
  draft,
  doneCount,
  report,
}: {
  projectId: string;
  projectName?: string;
  pageId?: string;
  draft: string;
  doneCount: number;
  report?: SavedReport | null;
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState(report ?? null);
  const [pending, startTransition] = useTransition();
  useProcess(pending);
  const submitted = Boolean(current?.submittedAt && current.body);
  const preview = current?.body || draft;

  function startReport() {
    startTransition(async () => {
      const created = current?.id ? current : await requestDayReportAction(projectId);
      if (!created) {
        toast("Today's report is already saved", "error");
        return;
      }
      setCurrent({
        id: created.id,
        body: current?.body ?? null,
        dueAt: created.dueAt,
        submittedAt: current?.submittedAt ?? null,
      });
      setViewOpen(false);
      setEditOpen(true);
    });
  }

  return (
    <section className="mb-5 rounded-[3px] border border-[#E2E8F0] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#172033]">
            <FileText size={16} className="text-[#2563EB]" />
            Today&apos;s progress report{projectName ? ` · ${projectName}` : ""}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            {submitted
              ? `Saved ${current?.submittedAt ? formatDateTime(current.submittedAt) : "today"}.`
              : doneCount
                ? `Drafted from ${doneCount} completed item${doneCount === 1 ? "" : "s"} today.`
                : "Open the report when you want to read or write today’s update."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-white px-3.5 py-2 text-sm font-medium text-[#172033] hover:bg-[#F8FAFC]"
          >
            <Eye size={14} />
            View
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={startReport}
            className="rounded-[3px] bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {submitted ? "Edit report" : "Make today's report"}
          </button>
        </div>
      </div>

      {viewOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-[#172033]/40" aria-label="Close" onClick={() => setViewOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-[3px] bg-white p-5 shadow-[0_12px_32px_rgba(23,32,51,.18)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#172033]">
                  Today&apos;s progress report{projectName ? ` · ${projectName}` : ""}
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  {submitted ? "Saved report" : "Draft preview"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-[3px] p-1 text-[#64748B] hover:bg-[#F8FAFC]"
                onClick={() => setViewOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <ProgressReportBody text={preview} />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(preview);
                  toast("Report copied");
                }}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#172033] hover:bg-[#F8FAFC]"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="rounded-[3px] bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <WorkReportDialog
        open={editOpen}
        kind="day_complete"
        projectId={projectId}
        pageId={pageId ?? ""}
        reportId={current?.id}
        dueAt={current?.dueAt}
        defaultBody={preview}
        onClose={() => setEditOpen(false)}
        onSubmitted={(body) => {
          setCurrent((item) => ({
            id: item?.id || "",
            dueAt: item?.dueAt ?? null,
            body: body || item?.body || draft,
            submittedAt: new Date().toISOString(),
          }));
        }}
      />
    </section>
  );
}
