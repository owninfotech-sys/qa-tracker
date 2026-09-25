"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toast";
import type { Role } from "@/lib/types";
import type { AccessKey } from "@/lib/access";

export function AppChrome({
  role,
  access,
  children,
}: {
  role: Role;
  access: AccessKey[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const workQueue = /\/projects\/[^/]+\/pages/.test(pathname);

  if (workQueue) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFC]">
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen gap-0 overflow-hidden bg-[#F8FAFC]">
      <Sidebar role={role} access={access} />
      <div className="ml-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
      <Toaster />
    </div>
  );
}
