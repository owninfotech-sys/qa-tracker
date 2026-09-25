"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

function pageWindow(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 3);
    pages.add(total - 2);
    pages.add(total - 1);
  }
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

export function ActivityPager({
  page,
  pageCount,
  pageSize,
  total,
  from,
  to,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const numbers = pageWindow(page, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[#64748B]">
        {total === 0 ? "No items" : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <CustomSelect
          compact
          align="right"
          side="top"
          ariaLabel="Rows per page"
          value={String(pageSize)}
          onChange={(value) => onPageSize(Number(value))}
          options={PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} / page` }))}
        />
        <div className="inline-flex items-center rounded-[3px] border border-[#E2E8F0] bg-white">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            className="px-2 py-1.5 text-[#64748B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:text-[#CBD5E1]"
          >
            <ChevronLeft size={16} />
          </button>
          {numbers.map((number, index) => {
            const prev = numbers[index - 1];
            const gap = prev != null && number - prev > 1;
            return (
              <span key={number} className="inline-flex items-center">
                {gap ? <span className="px-1 text-xs text-[#94A3B8]">…</span> : null}
                <button
                  type="button"
                  onClick={() => onPage(number)}
                  className={`min-w-8 px-2 py-1.5 text-xs font-medium ${
                    number === page ? "bg-[#EFF6FF] text-[#1D4ED8]" : "text-[#172033] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {number}
                </button>
              </span>
            );
          })}
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            className="px-2 py-1.5 text-[#64748B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:text-[#CBD5E1]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
