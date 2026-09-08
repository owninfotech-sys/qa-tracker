"use client";

import { useState } from "react";
import Link from "next/link";
import { AppWindow, Globe, FolderKanban } from "lucide-react";
import { createProjectAction } from "@/app/actions/projects";
import { PageNameFields } from "@/components/projects/page-name-fields";

export function NewProjectForm({ error }: { error?: string }) {
  const [type, setType] = useState("website");

  return (
    <form action={createProjectAction} className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_8px_30px_rgba(60,64,67,.08)]">
      <div className="border-b border-line bg-gradient-to-r from-blue-soft to-white px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue text-white shadow-sm">
            <FolderKanban size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Create project</h1>
            <p className="mt-1 text-sm text-muted">
              Name the website or app, then add the pages testers will cover.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8">
        {error ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Project name</span>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3.5 py-3 text-sm transition focus:bg-white"
            placeholder="Wedding website"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-ink">Type</span>
          <input type="hidden" name="type" value={type} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setType("website")}
              className={`rounded-xl border p-4 text-left transition ${
                type === "website"
                  ? "border-blue bg-blue-soft shadow-sm"
                  : "border-line bg-[#f8f9fa] hover:border-blue/40"
              }`}
            >
              <Globe size={18} className={type === "website" ? "text-blue" : "text-muted"} />
              <p className="mt-2 text-sm font-semibold text-ink">Website</p>
              <p className="mt-0.5 text-xs text-muted">Browser pages and flows</p>
            </button>
            <button
              type="button"
              onClick={() => setType("app")}
              className={`rounded-xl border p-4 text-left transition ${
                type === "app"
                  ? "border-blue bg-blue-soft shadow-sm"
                  : "border-line bg-[#f8f9fa] hover:border-blue/40"
              }`}
            >
              <AppWindow size={18} className={type === "app" ? "text-blue" : "text-muted"} />
              <p className="mt-2 text-sm font-semibold text-ink">App</p>
              <p className="mt-0.5 text-xs text-muted">iOS, Android, or desktop</p>
            </button>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Site URL or package</span>
          <input
            name="url"
            className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3.5 py-3 text-sm transition focus:bg-white"
            placeholder="https://example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">RSVP link</span>
          <input
            name="rsvpUrl"
            className="w-full rounded-xl border border-line bg-[#f8f9fa] px-3.5 py-3 text-sm transition focus:bg-white"
            placeholder="https://example.com/rsvp"
          />
          <span className="mt-1.5 block text-xs text-muted">
            Guest-facing RSVP page. Testers can open it from the project.
          </span>
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-ink">Pages</span>
          <div className="rounded-xl border border-line bg-[#f8f9fa] p-4">
            <PageNameFields />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-[#fafbfc] px-6 py-4 sm:px-8">
        <Link href="/projects" className="text-sm font-medium text-muted hover:text-ink">
          Cancel
        </Link>
        <button className="rounded-xl bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-hover">
          Create project
        </button>
      </div>
    </form>
  );
}
