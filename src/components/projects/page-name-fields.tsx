"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { uniquePageNames } from "@/lib/pages";

export function PageNameFields({
  name = "pages",
  hint = "Add a page name, then press + or Enter. Click × to remove.",
  resetKey,
}: {
  name?: string;
  hint?: string;
  resetKey?: string;
}) {
  return <PageNameFieldsInner key={resetKey ?? "pages"} name={name} hint={hint} />;
}

function PageNameFieldsInner({ name, hint }: { name: string; hint: string }) {
  const [pages, setPages] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  function addPage() {
    const merged = uniquePageNames([...pages, draft]);
    setPages(merged);
    setDraft("");
  }

  return (
    <div className="block">
      {pages.map((page) => (
        <input key={page} type="hidden" name={name} value={page} />
      ))}
      {pages.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {pages.map((page) => (
            <span
              key={page}
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-blue-soft px-2.5 py-1 text-[13px] font-medium text-blue-ink"
            >
              {page}
              <button
                type="button"
                onClick={() => setPages(pages.filter((item) => item !== page))}
                className="rounded-[3px] p-0.5 text-blue-ink/70 hover:bg-white hover:text-danger"
                aria-label={`Remove ${page}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          name="pageDraft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addPage();
            }
          }}
          className="w-full rounded-[3px] border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-[#94A3B8] transition"
          placeholder="Home, Login, Checkout…"
        />
        <button
          type="button"
          onClick={addPage}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[3px] bg-blue text-white shadow-[0_1px_2px_#091e4240] hover:bg-blue-hover"
          aria-label="Add page"
        >
          <Plus size={18} />
        </button>
      </div>
      <span className="mt-1.5 block text-xs text-muted">{hint}</span>
    </div>
  );
}
