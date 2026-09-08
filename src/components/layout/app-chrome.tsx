"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import type { Role } from "@/lib/types";

export function AppChrome({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const workQueue = /\/projects\/[^/]+\/pages/.test(pathname);

  if (workQueue) {
    return <div className="flex h-screen flex-col overflow-hidden bg-[#f7f8f9]">{children}</div>;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f4f5f7]">
      <Sidebar role={role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
