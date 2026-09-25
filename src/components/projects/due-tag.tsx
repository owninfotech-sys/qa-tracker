import { CheckCircle2, Clock3 } from "lucide-react";
import { formatShortDay } from "@/lib/format";
import { taskDueAt } from "@/lib/today";
import type { ListTask } from "@/lib/work-item";

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function DueTag({ task }: { task: ListTask }) {
  const done = task.status === "done" || task.status === "wont_do";
  const due = taskDueAt(task.createdAt, task.resolutionAt);
  const when = done ? new Date(task.updatedAt || task.resolutionAt || task.createdAt) : due;
  const day = formatShortDay(when);
  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);

  if (done) {
    return (
      <span
        title={`Done ${formatShortDay(when)}`}
        className="inline-flex items-center gap-1 rounded-[3px] bg-[#DCFCE7] px-1.5 py-0.5 text-[11px] font-semibold text-[#15803D]"
      >
        <CheckCircle2 size={11} />
        Done {day}
      </span>
    );
  }

  if (due.getTime() < Date.now()) {
    return (
      <span
        title={`Overdue ${day}`}
        className="inline-flex items-center gap-1 rounded-[3px] bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-semibold text-[#DC2626]"
      >
        <Clock3 size={11} />
        Overdue {day}
      </span>
    );
  }

  if (dueDay === today) {
    return (
      <span
        title="Due today"
        className="inline-flex items-center gap-1 rounded-[3px] bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-semibold text-[#D97706]"
      >
        <Clock3 size={11} />
        Due today
      </span>
    );
  }

  return (
    <span
      title={`Due ${day}`}
      className="inline-flex items-center gap-1 rounded-[3px] bg-[#EFF6FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#1D4ED8]"
    >
      <Clock3 size={11} />
      Due {day}
    </span>
  );
}
