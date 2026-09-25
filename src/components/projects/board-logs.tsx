"use client";

import { useEffect, useState } from "react";
import { ScrollText, X } from "lucide-react";
import { loadProjectLogsAction } from "@/app/actions/page-tasks";
import { formatDateTime } from "@/lib/format";
import { LoaderMark } from "@/components/ui/app-loader";

export function BoardLogsPanel({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<{ id: string; message: string; createdAt: string; userName: string; taskKey: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void loadProjectLogsAction(projectId).then((items) => {
      setRows(items);
      setLoading(false);
    });
  }, [open, projectId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" className="absolute inset-0 bg-[#172033]/30" aria-label="Close logs" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-[-8px_0_24px_rgba(23,32,51,.12)]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
          <div className="flex items-center gap-2">
            <ScrollText size={16} className="text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#172033]">Board logs</h2>
          </div>
          <button type="button" className="rounded-[3px] p-1 text-[#64748B] hover:bg-[#F8FAFC]" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderMark size={40} />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[#64748B]">No moves or reports yet.</p>
          ) : (
            <ol className="space-y-3">
              {rows.map((row) => (
                <li key={row.id} className="rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                  <p className="text-sm text-[#172033]">{row.message}</p>
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    {row.userName}
                    {row.taskKey ? ` · ${row.taskKey}` : ""} · {formatDateTime(row.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
