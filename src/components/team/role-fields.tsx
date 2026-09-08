"use client";

import { useState } from "react";
import { isSystemRole } from "@/lib/types";

export function RoleFields({
  defaultRole = "TESTER",
  compact = false,
}: {
  defaultRole?: string;
  compact?: boolean;
}) {
  const customDefault = isSystemRole(defaultRole) ? "" : defaultRole;
  const [choice, setChoice] = useState(isSystemRole(defaultRole) ? defaultRole : "OTHER");

  return (
    <div className={compact ? "flex min-w-[220px] flex-wrap items-center gap-2" : "space-y-2"}>
      <select
        name="role"
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
        className={
          compact
            ? "rounded-lg border border-line px-2 py-1.5 text-sm"
            : "w-full rounded-lg border border-line px-3 py-2.5 text-sm"
        }
      >
        <option value="TESTER">Tester</option>
        <option value="FIXER">Fixer</option>
        <option value="ADMIN">Admin</option>
        <option value="OTHER">Other</option>
      </select>
      {choice === "OTHER" ? (
        <input
          name="customRole"
          defaultValue={customDefault}
          required
          placeholder="Custom role name"
          className={
            compact
              ? "min-w-[140px] flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
              : "w-full rounded-lg border border-[#0c66e4] bg-[#e9f2ff] px-3 py-2.5 text-sm"
          }
        />
      ) : null}
    </div>
  );
}
