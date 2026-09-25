"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveAccessMatrixAction } from "@/app/actions/access";
import { ACCESS_FIELDS, LOCKED_ADMIN_ACCESS, type AccessKey } from "@/lib/access";
import { toast } from "@/components/ui/toast";
import { useProcess } from "@/components/ui/app-loader";

type RoleOption = { value: string; label: string };

export function AccessMatrix({
  roles,
  matrix,
  canEdit,
}: {
  roles: RoleOption[];
  matrix: Record<string, AccessKey[]>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  useProcess(pending);
  const tabs = ACCESS_FIELDS.filter((field) => field.group === "tab");
  const work = ACCESS_FIELDS.filter((field) => field.group === "work");

  const [state, setState] = useState<Record<string, AccessKey[]>>(() => {
    const next: Record<string, AccessKey[]> = {};
    for (const role of roles) next[role.value] = [...(matrix[role.value] ?? [])];
    return next;
  });

  function has(role: string, key: AccessKey) {
    return state[role]?.includes(key) ?? false;
  }

  function locked(role: string, key: AccessKey) {
    return role === "ADMIN" && LOCKED_ADMIN_ACCESS.includes(key);
  }

  function toggle(role: string, key: AccessKey) {
    if (!canEdit || locked(role, key)) return;
    setState((current) => {
      const caps = current[role] ?? [];
      const next = caps.includes(key) ? caps.filter((item) => item !== key) : [...caps, key];
      return { ...current, [role]: next };
    });
  }

  function onSave() {
    const data = new FormData();
    for (const role of roles) {
      data.append("role", role.value);
      for (const cap of state[role.value] ?? []) data.append(`cap:${role.value}`, cap);
    }
    start(async () => {
      const result = await saveAccessMatrixAction(data);
      if (result.ok) {
        toast("Access saved");
        router.refresh();
      } else toast(result.error, "error");
    });
  }

  return (
    <section className="rounded-[3px] border border-[#E2E8F0] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#172033]">Access by role</h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Tick which tab and action each role can use. People inherit this from their role.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="rounded-[3px] bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save access"}
          </button>
        ) : (
          <p className="text-xs text-[#64748B]">View only</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
              <th className="sticky left-0 z-10 bg-[#F8FAFC] px-4 py-2 font-medium">Role</th>
              <th colSpan={tabs.length} className="px-2 py-2 font-medium">
                Tabs
              </th>
              <th colSpan={work.length} className="px-2 py-2 font-medium">
                Work
              </th>
            </tr>
            <tr className="border-b border-[#E2E8F0] bg-white text-[11px] font-medium text-[#64748B]">
              <th className="sticky left-0 z-10 bg-white px-4 py-2" />
              {tabs.concat(work).map((field) => (
                <th key={field.key} className="px-1.5 py-2 text-center font-medium" title={field.hint}>
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.value} className="border-t border-[#E2E8F0]">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-[#172033]">{role.label}</td>
                {tabs.concat(work).map((field) => {
                  const on = has(role.value, field.key);
                  const freeze = locked(role.value, field.key);
                  return (
                    <td key={field.key} className="px-1.5 py-2 text-center">
                      <button
                        type="button"
                        disabled={!canEdit || freeze}
                        onClick={() => toggle(role.value, field.key)}
                        title={freeze ? "Admin always keeps this" : field.hint}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-[3px] border text-xs font-semibold ${
                          on
                            ? "border-[#2563EB] bg-[#2563EB] text-white"
                            : "border-[#E2E8F0] bg-white text-[#94A3B8]"
                        } ${!canEdit || freeze ? "cursor-default" : "hover:border-[#2563EB]"}`}
                      >
                        {on ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
