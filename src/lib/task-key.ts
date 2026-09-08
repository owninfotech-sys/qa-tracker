export function taskKey(id: string) {
  return `T-${id.slice(-4).toUpperCase()}`;
}

export function parseLinkedIds(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseAssigneeIds(assigneeIds?: string | null, assigneeId?: string | null) {
  const ids = parseLinkedIds(assigneeIds);
  if (ids.length) return [...new Set(ids)];
  return assigneeId ? [assigneeId] : [];
}

export function serializeAssigneeIds(ids: string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].join(",");
}

export function slaTimes(
  createdAt: Date | string,
  firstResponseAt?: Date | string | null,
  resolutionAt?: Date | string | null,
) {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const first = firstResponseAt
    ? new Date(firstResponseAt)
    : new Date(created.getTime() + 4 * 60 * 60 * 1000);
  const resolution = resolutionAt
    ? new Date(resolutionAt)
    : new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
  return { firstResponse: first, resolution };
}

export function toDateTimeLocal(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
