import Link from "next/link";
import { ClipboardCheck, ListChecks, Sun } from "lucide-react";
import { tasksHref, testingHref, todayHref, type Workspace } from "@/lib/workspace";

export function WorkspaceSwitch({
  projectId,
  pageId,
  active,
  tone = "light",
  showTesting = true,
}: {
  projectId: string;
  pageId?: string | null;
  active: Workspace;
  tone?: "light" | "dark";
  showTesting?: boolean;
}) {
  const items = [
    {
      id: "tasks" as const,
      href: tasksHref(projectId, pageId),
      label: "Tasks",
      icon: ListChecks,
      on: "bg-[#2563EB] text-white",
      offLight: "text-[#64748B] hover:text-[#2563EB]",
      offDark: "text-[#CBD5E1] hover:text-white",
    },
    {
      id: "today" as const,
      href: todayHref(projectId),
      label: "Today",
      icon: Sun,
      on: "bg-[#D97706] text-white",
      offLight: "text-[#64748B] hover:text-[#D97706]",
      offDark: "text-[#CBD5E1] hover:text-white",
    },
    ...(showTesting
      ? [
          {
            id: "testing" as const,
            href: testingHref(projectId),
            label: "Testing",
            icon: ClipboardCheck,
            on: "bg-[#7C3AED] text-white",
            offLight: "text-[#64748B] hover:text-[#7C3AED]",
            offDark: "text-[#CBD5E1] hover:text-white",
          },
        ]
      : []),
  ];

  return (
    <div
      className={`inline-flex rounded-[3px] p-0.5 ${
        tone === "dark" ? "bg-white/10" : "border border-[#E2E8F0] bg-[#F8FAFC]"
      }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-sm font-medium ${
              selected ? item.on : tone === "dark" ? item.offDark : item.offLight
            }`}
          >
            <Icon size={14} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
