export function projectCodeFromName(name: string) {
  const words = name
    .trim()
    .split(/[\s/_-]+/)
    .filter(Boolean);
  let code = "";
  if (words.length >= 2) {
    code = `${words[0][0] ?? ""}${words[1][0] ?? ""}`;
  } else {
    code = (words[0] || "PRJ").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3);
  }
  code = code.toUpperCase();
  if (code.length < 2) code = `P${code}`.slice(0, 3).padEnd(2, "X");
  return code.slice(0, 8);
}

export function formatTaskKey(projectCode: string, number: number) {
  const code = (projectCode || "PRJ").toUpperCase();
  return `${code}-${number}`;
}

export function taskKey(id: string, projectCode?: string | null, number?: number | null) {
  if (projectCode && number) return formatTaskKey(projectCode, number);
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
