"use client";

import { useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Eye,
  EyeOff,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Users,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { FormPendingLoader } from "@/components/ui/app-loader";

const workspace = [
  { icon: BarChart3, title: "Dashboard", text: "Work by people, projects, on-time delivery, and issues" },
  { icon: ListChecks, title: "Tasks", text: "Create work, assign the team, and move status to Done" },
  { icon: ClipboardCheck, title: "Testing", text: "Cases, runs, pass/fail, and fixes in one board" },
  { icon: FolderKanban, title: "Projects", text: "Pages, today’s work, deadline, and Figma in each project" },
  { icon: Users, title: "Team", text: "Admins, testers, fixers, and logos for each person" },
];

export function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="relative hidden w-[420px] shrink-0 flex-col justify-between bg-[#172554] px-10 py-10 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#2563EB]">
              <LayoutDashboard size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">QA Tracker</p>
              <p className="text-xs text-white/55">Own InfoTech staff</p>
            </div>
          </div>

          <h1 className="mt-12 text-[32px] font-semibold leading-[1.15] tracking-tight">
            One workspace for tests, fixes, and delivery.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
            Sign in to pick up work, update status, and keep every page tracked until close.
          </p>

          <div className="mt-8 space-y-2">
            {workspace.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-[3px] border border-white/10 bg-white/[0.06] px-3.5 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-[#2563EB]">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-4 text-white/55">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-white/40">Internal use · Own InfoTech</p>
      </aside>

      <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#2563EB] text-white">
              <LayoutDashboard size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#172033]">QA Tracker</p>
              <p className="text-xs text-[#64748B]">Own InfoTech staff</p>
            </div>
          </div>

          <section className="rounded-[3px] border border-[#E2E8F0] bg-white p-7 shadow-[0_1px_2px_#091e420f,0_8px_24px_#091e4214] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Staff sign in</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#172033]">Welcome back</h2>
            <p className="mt-1.5 text-sm text-[#64748B]">
              Use your work account to open the same board you use every day.
            </p>

            {error ? (
              <p className="mt-4 rounded-[3px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{error}</p>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <FormPendingLoader />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[#172033]">Email</span>
                <span className="relative block">
                  <Mail size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-[3px] border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_#2563EB26]"
                    placeholder="name@owninfotech.com"
                    required
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[#172033]">Password</span>
                <span className="relative block">
                  <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[3px] border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-11 text-sm text-[#172033] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_#2563EB26]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((open) => !open)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[3px] p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                className="w-full rounded-[3px] bg-[#2563EB] py-2.5 text-sm font-medium text-white transition hover:bg-[#1D4ED8]"
              >
                Continue
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
