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
}: {
  projectId: string;
  projectName?: string;
  pageId: string;
  pageName: string;
  people?: CreatePerson[];
  error?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-[3px] bg-[#0c66e4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0055cc]"
      >
        <Plus size={16} />
        Create
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
      />
    </>
  );
}
