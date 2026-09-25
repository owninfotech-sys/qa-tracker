"use client";

import { useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export function SignOutButton({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} title="Sign out">
        {children ?? "Sign out"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[#172033]/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-labelledby="sign-out-title"
            aria-modal="true"
            className="relative w-full max-w-[400px] rounded-[3px] border border-[#E2E8F0] bg-white p-5 shadow-[0_12px_32px_rgba(23,32,51,.18)]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
              <LogOut size={18} />
            </div>
            <h2 id="sign-out-title" className="text-lg font-semibold text-[#172033]">
              Sign out?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              You will need to sign in again to open QA Tracker.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-[3px] border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#172033] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-[3px] bg-[#DC2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#B91C1C]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
