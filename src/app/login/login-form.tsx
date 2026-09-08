"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Eye,
  EyeOff,
  FolderKanban,
  LayoutDashboard,
  Lock,
  Mail,
  Users,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth";

type LoginAccount = {
  label: string;
  email: string;
  password: string;
  hint: string;
};

const workspace = [
  { icon: ClipboardCheck, title: "My Work", text: "Tests and fixes assigned to you" },
  { icon: FolderKanban, title: "Projects", text: "Pages, cases, and live boards" },
  { icon: Users, title: "Team", text: "Admins, testers, and fixers" },
];

export function LoginForm({ error, accounts }: { error?: string; accounts: LoginAccount[] }) {
  const first = accounts[0];
  const [email, setEmail] = useState(first?.email ?? "");
  const [password, setPassword] = useState(first?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="relative hidden w-[420px] shrink-0 flex-col justify-between bg-[#1d2856] px-10 py-10 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c66e4] shadow-[0_1px_2px_#091e4240]">
              <LayoutDashboard size={20} />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">QA Tracker</p>
              <p className="text-xs text-white/55">Own InfoTech staff</p>
            </div>
          </div>

          <h1 className="mt-14 text-[32px] font-semibold leading-[1.15] tracking-tight">
            One workspace for tests, fixes, and delivery.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
            Sign in to pick up work, update status, and keep every page tracked until close.
          </p>

          <div className="mt-10 space-y-3">
            {workspace.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3.5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0c66e4]">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-white/55">{item.text}</p>
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c66e4] text-white">
              <LayoutDashboard size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#172b4d]">QA Tracker</p>
              <p className="text-xs text-[#626f86]">Own InfoTech staff</p>
            </div>
          </div>

          <section className="rounded-2xl border border-[#dcdfe4] bg-white p-7 shadow-[0_1px_2px_#091e420f,0_8px_24px_#091e4214] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626f86]">Staff sign in</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#172b4d]">Welcome back</h2>
            <p className="mt-1.5 text-sm text-[#626f86]">
              Use your work account to open the same board you use every day.
            </p>

            {error ? (
              <p className="mt-4 rounded-[3px] bg-[#ffeceb] px-3 py-2 text-sm text-[#ae2e24]">{error}</p>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[#172b4d]">Email</span>
                <span className="relative block">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8993a4]" />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-[3px] border border-[#dcdfe4] bg-white py-2.5 pl-10 pr-3 text-sm text-[#172b4d] placeholder:text-[#8993a4] focus:border-[#0c66e4] focus:shadow-[0_0_0_3px_#0c66e426]"
                    placeholder="name@owninfotech.com"
                    required
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[#172b4d]">Password</span>
                <span className="relative block">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8993a4]" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[3px] border border-[#dcdfe4] bg-white py-2.5 pl-10 pr-11 text-sm text-[#172b4d] focus:border-[#0c66e4] focus:shadow-[0_0_0_3px_#0c66e426]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((open) => !open)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#626f86] hover:bg-[#f1f2f4] hover:text-[#172b4d]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                className="w-full rounded-[3px] bg-[#0c66e4] py-2.5 text-sm font-medium text-white transition hover:bg-[#0055cc]"
              >
                Continue
              </button>
            </form>

            <div className="mt-6 border-t border-[#dcdfe4] pt-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#626f86]">
                Default accounts from .env
              </p>
              <div className="grid grid-cols-3 gap-2">
                {accounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className={`rounded-[3px] border px-2.5 py-2 text-left transition hover:border-[#0c66e4] hover:bg-[#e9f2ff] ${
                      email === account.email
                        ? "border-[#0c66e4] bg-[#e9f2ff]"
                        : "border-[#dcdfe4] bg-white"
                    }`}
                  >
                    <p className="text-[13px] font-medium text-[#172b4d]">{account.label}</p>
                    <p className="truncate text-[11px] text-[#626f86]">{account.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
