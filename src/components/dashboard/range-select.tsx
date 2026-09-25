"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function RangeSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const range = params.get("range") === "14" || params.get("range") === "30" ? params.get("range") : "7";

  return (
    <label className="inline-flex items-center gap-2 text-xs text-[#64748B]">
      <span className="hidden sm:inline">Range</span>
      <select
        value={range ?? "7"}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("range", event.target.value);
          router.push(`/?${next.toString()}`);
        }}
        className="rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-medium text-[#172033]"
      >
        <option value="7">Last 7 days</option>
        <option value="14">Last 14 days</option>
        <option value="30">Last 30 days</option>
      </select>
    </label>
  );
}
