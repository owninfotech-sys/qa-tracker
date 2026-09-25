"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateWorkItemModal, type CreatePerson } from "@/components/projects/create-work-item-modal";

export function PageTaskDialog({
  projectId,
  projectName,
  pageId,
  pageName,
  people = [],
  error,
  defaultOpen = false,
  workType,
}: {
  projectId: string;
  projectName?: string;
  pageId: string;
  pageName: string;
  people?: CreatePerson[];
  error?: string;
  defaultOpen?: boolean;
  workType?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-[3px] bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
      >
        <Plus size={16} />
        {workType === "issues" ? "Create issue" : "Create task"}
      </button>

      <CreateWorkItemModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        projectName={projectName}
        pageId={pageId}
        pageName={pageName}
        people={people}
        error={error}
        workType={workType}
      />
    </>
  );
}
