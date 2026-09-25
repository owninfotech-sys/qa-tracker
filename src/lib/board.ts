export const BOARD_COLUMNS = [
  { id: "todo", title: "TO DO", statuses: ["open", "pending"] },
  { id: "progress", title: "IN PROGRESS", statuses: ["in_progress", "waiting_customer", "escalated", "ready_for_testing"] },
  { id: "done", title: "DONE", statuses: ["done", "wont_do"] },
] as const;

export type BoardColumnId = (typeof BOARD_COLUMNS)[number]["id"];

export function columnForStatus(status: string): BoardColumnId {
  const match = BOARD_COLUMNS.find((column) => column.statuses.includes(status as never));
  return match?.id ?? "todo";
}

export function statusForColumn(columnId: string, currentStatus: string) {
  const column = BOARD_COLUMNS.find((item) => item.id === columnId);
  if (!column) return currentStatus;
  if (column.statuses.includes(currentStatus as never)) return currentStatus;
  return column.statuses[0];
}

export function neighborColumn(columnId: string, direction: -1 | 1): BoardColumnId | null {
  const index = BOARD_COLUMNS.findIndex((column) => column.id === columnId);
  const next = BOARD_COLUMNS[index + direction];
  return next?.id ?? null;
}

export function sortBoardTasks<T extends { sortOrder: number; createdAt: string }>(tasks: T[]) {
  return [...tasks].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
}
