"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchWorkspaceAction } from "@/app/actions/search";
import { isOpenWorkStatus } from "@/lib/work-type";

type Result = Awaited<ReturnType<typeof searchWorkspaceAction>>;

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result>({ tasks: [], projects: [] });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults({ tasks: [], projects: [] });
      return;
    }
    const timer = window.setTimeout(() => {
      void searchWorkspaceAction(value).then(setResults);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const has = results.tasks.length + results.projects.length > 0;

  return (
    <div ref={box} className="relative w-full max-w-xl">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && query.trim().length >= 2) {
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }
        }}
        placeholder="Search tasks, projects, issues…"
        className="h-10 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 text-sm text-[#172033] placeholder:text-[#94A3B8]"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[8px] border border-[#E2E8F0] bg-white shadow-[0_12px_32px_rgba(23,32,51,.12)]">
          {!has ? (
            <p className="px-3 py-4 text-sm text-[#94A3B8]">No matches for “{query.trim()}”.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {results.projects.length ? (
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Projects</p>
              ) : null}
              {results.projects.map((project) => (
                <Link
                  key={project.id}
                  href={project.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-[#F8FAFC]"
                >
                  <span className="font-medium text-[#172033]">{project.code}</span>
                  <span className="text-[#64748B]"> · {project.name}</span>
                </Link>
              ))}
              {results.tasks.length ? (
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Work</p>
              ) : null}
              {results.tasks.map((task) => (
                <Link
                  key={task.href}
                  href={task.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-[#F8FAFC]"
                >
                  <p className="font-medium text-[#172033]">
                    {task.taskKey} · {task.title}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {task.projectName} · {isOpenWorkStatus(task.status) ? "Open" : "Done"}
                  </p>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block border-t border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#F8FAFC]"
              >
                View all results
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
