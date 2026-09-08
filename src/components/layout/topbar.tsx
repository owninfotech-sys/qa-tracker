import type { ReactNode } from "react";
import { initials, roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/types";
import { logoutAction } from "@/app/actions/auth";

export function Topbar({
  user,
  title,
  actions,
}: {
  user: SessionUser;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dcdfe4] bg-white px-4 sm:px-6">
      <p className="truncate text-sm font-semibold text-[#172b4d]">{title}</p>

      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[#172b4d]">{user.name}</p>
          <p className="text-[11px] text-[#626f86]">{roleLabel(user.role)}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#deebff] text-[11px] font-semibold text-[#0747a6]">
          {initials(user.name)}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-[#dcdfe4] px-2.5 py-1 text-xs font-medium text-[#44546f] hover:bg-[#f1f2f4]"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
