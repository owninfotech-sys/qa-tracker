"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";

const accounts = [
  { label: "Admin", email: "amit.owninfotech@gmail.com", role: "Full control" },
  { label: "Tester", email: "tester.owninfotech@gmail.com", role: "Edit work items & SLAs" },
];

export function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState("amit.owninfotech@gmail.com");
  const [password, setPassword] = useState("Staff@123");

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-2xl border border-line bg-card p-8 shadow-[0_1px_2px_rgba(60,64,67,.12),0_2px_8px_rgba(60,64,67,.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue text-sm font-bold text-white">
            QA
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">QA Tracker</p>
            <p className="text-sm text-muted">Own InfoTech staff</p>
          </div>
        </div>

        <h1 className="text-2xl font-normal tracking-tight text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Use your work account to pick up tests and fixes.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue py-2.5 text-sm font-medium text-white transition hover:bg-blue-hover"
          >
            Continue
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Staff · password Staff@123
        </p>
        <div className="grid grid-cols-2 gap-2">
          {accounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("Staff@123");
              }}
              className="rounded-lg border border-line px-3 py-2 text-left transition hover:border-blue hover:bg-blue-soft"
            >
              <p className="text-sm font-medium text-ink">{account.label}</p>
              <p className="truncate text-xs text-muted">{account.role}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Testers and admins edit titles, descriptions, and SLA times. Add a Fixer from Team to use Fixer Tasks.
        </p>
      </div>
    </div>
  );
}
