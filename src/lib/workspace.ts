export type Workspace = "tasks" | "today" | "testing";

export function tasksHref(projectId: string, pageId?: string | null) {
  return pageId ? `/projects/${projectId}/pages/${pageId}` : `/projects/${projectId}/pages`;
}

export function todayHref(projectId: string) {
  return `/projects/${projectId}/today`;
}

export function testingHref(projectId: string) {
  return `/projects/${projectId}/testing`;
}

export function casesHref(projectId: string) {
  return `/projects/${projectId}/cases`;
}

export function newCaseHref(projectId: string) {
  return `/projects/${projectId}/cases/new`;
}

export function newRunHref(projectId: string) {
  return `/runs/new?projectId=${projectId}`;
}
