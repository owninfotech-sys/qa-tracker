"use client";

import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function NotFoundView() {
  return (
    <main className="flex h-full min-h-[560px] flex-1 flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12">
      <div className="w-full max-w-[480px] text-center">
        <div className="mx-auto h-[280px] w-full max-w-[360px] sm:h-[320px]">
          <DotLottieReact src="/not-found.lottie" loop autoplay style={{ width: "100%", height: "100%" }} />
        </div>
        <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">404</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#172033]">This page isn&apos;t here</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          The link may be old, or this work item was moved. Go back to the workspace and pick it up from there.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-[3px] bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            Back to dashboard
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center rounded-[3px] border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#172033] hover:bg-[#F8FAFC]"
          >
            Open projects
          </Link>
        </div>
      </div>
    </main>
  );
}
