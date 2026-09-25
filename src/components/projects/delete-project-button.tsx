"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/app/actions/projects";

export function DeleteProjectButton({
  id,
  name,
  compact = false,
}: {
  id: string;
  name: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
            : "inline-flex items-center gap-1.5 rounded-lg border border-danger/20 bg-danger-soft px-3 py-1.5 text-sm font-medium text-danger hover:bg-[#f9d2ce]"
        }
      >
        <Trash2 size={14} />
        Delete
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-[420px] rounded-xl border border-line bg-card p-6 shadow-[0_8px_28px_rgba(60,64,67,.28)]">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-danger">
              <Trash2 size={18} />
            </div>
            <h2 className="text-lg font-semibold text-ink">Delete project?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              <span className="font-medium text-ink">{name}</span> and its pages and test
              points will be removed. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-[#F1F5F9]"
              >
                Cancel
              </button>
              <form action={deleteProjectAction}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-[#b3261e]"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
