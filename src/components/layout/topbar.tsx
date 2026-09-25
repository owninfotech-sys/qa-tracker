import type { ReactNode } from "react";
import { initials, roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/types";
import { SearchBox } from "@/components/layout/search-box";
import { NoticeMenu } from "@/components/layout/notice-menu";
import { SignOutButton } from "@/components/layout/sign-out-button";

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
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white px-4 sm:px-6">
      <p className="hidden truncate text-sm font-semibold text-[#172033] lg:block">{title}</p>
      <SearchBox />
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {actions}
        <NoticeMenu />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[#172033]">{user.name}</p>
          <p className="text-[11px] text-[#64748B]">{roleLabel(user.role)}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] text-[11px] font-semibold text-[#2563EB]">
          {user.logo ? (
            <img src={user.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(user.name)
          )}
        </div>
        <SignOutButton className="rounded-[3px] border border-[#E2E8F0] px-2.5 py-1 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]" />
      </div>
    </header>
  );
}
