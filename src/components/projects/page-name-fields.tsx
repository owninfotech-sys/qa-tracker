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
              className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-3 py-1 text-sm font-medium text-blue-ink"
            >
              {page}
              <button
                type="button"
                onClick={() => setPages(pages.filter((item) => item !== page))}
                className="rounded-full p-0.5 hover:bg-white/70 hover:text-danger"
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
          className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3.5 py-2.5 text-sm transition focus:bg-white"
          placeholder="Home, Login, Checkout…"
        />
        <button
          type="button"
          onClick={addPage}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-blue text-white shadow-sm hover:bg-blue-hover"
          aria-label="Add page"
        >
          <Plus size={18} />
        </button>
      </div>
      <span className="mt-1.5 block text-xs text-muted">{hint}</span>
    </div>
  );
}
