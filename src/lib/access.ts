export const ACCESS_KEYS = [
  "dashboard",
  "projects",
  "team",
  "viewAll",
  "manageProjects",
  "createTask",
  "manageTask",
  "testing",
  "createCase",
  "runTests",
  "updateFix",
  "manageTeam",
  "manageAccess",
] as const;

export type AccessKey = (typeof ACCESS_KEYS)[number];

export const ACCESS_FIELDS: {
  key: AccessKey;
  label: string;
  group: "tab" | "work";
  hint: string;
}[] = [
  { key: "dashboard", label: "Dashboard", group: "tab", hint: "Open the Dashboard tab" },
  { key: "projects", label: "Projects", group: "tab", hint: "Open the Projects tab" },
  { key: "team", label: "Team", group: "tab", hint: "Open the Team tab" },
  { key: "viewAll", label: "See all work", group: "work", hint: "View everyone’s tasks, tests, and reports" },
  { key: "manageProjects", label: "Add projects", group: "work", hint: "Create, edit, and delete projects" },
  { key: "createTask", label: "Create tasks", group: "work", hint: "Add tasks on a project board" },
  { key: "manageTask", label: "Manage tasks", group: "work", hint: "Assign, move, edit, and delete tasks" },
  { key: "testing", label: "Testing", group: "work", hint: "Open testing, cases, and runs" },
  { key: "createCase", label: "Add cases", group: "work", hint: "Create test cases" },
  { key: "runTests", label: "Run tests", group: "work", hint: "Execute assigned test points" },
  { key: "updateFix", label: "Fixes", group: "work", hint: "Work on assigned repair tasks" },
  { key: "manageTeam", label: "Add people", group: "work", hint: "Add, role-change, and deactivate people" },
  { key: "manageAccess", label: "Assign access", group: "work", hint: "Change which role can use which tab" },
];

export const PRESET_ROLES = [
  { value: "TESTER", label: "Tester", hint: "Runs test points" },
  { value: "FIXER", label: "Fixer", hint: "Assigned repair work" },
  { value: "ADMIN", label: "Admin", hint: "Full control" },
  { value: "Developer", label: "Developer", hint: "Builds and ships the product" },
  { value: "Designer", label: "Designer", hint: "UI, UX, and visual work" },
  { value: "PL", label: "PL", hint: "Project lead" },
  { value: "Teacher", label: "Teacher", hint: "Training and walkthroughs" },
  { value: "Tutor", label: "Tutor", hint: "Guides and support sessions" },
] as const;

export const MATRIX_ROLE_ORDER = [
  "ADMIN",
  "PL",
  "Developer",
  "Designer",
  "TESTER",
  "FIXER",
  "Teacher",
  "Tutor",
] as const;

const VIEW_TABS: AccessKey[] = ["dashboard", "projects"];

export const DEFAULT_ACCESS: Record<string, AccessKey[]> = {
  ADMIN: [...ACCESS_KEYS],
  PL: ACCESS_KEYS.filter((key) => key !== "manageAccess"),
  Developer: ["dashboard", "projects", "createTask", "manageTask", "updateFix"],
  Designer: ["dashboard", "projects", "createTask", "manageTask"],
  TESTER: ["dashboard", "projects", "testing", "createCase", "runTests"],
  FIXER: ["dashboard", "projects", "testing", "updateFix"],
  Teacher: [...VIEW_TABS],
  Tutor: [...VIEW_TABS],
};

export const LOCKED_ADMIN_ACCESS: AccessKey[] = ["dashboard", "team", "manageTeam", "manageAccess"];

export function isAccessKey(value: string): value is AccessKey {
  return (ACCESS_KEYS as readonly string[]).includes(value);
}

export function defaultCaps(role: string): AccessKey[] {
  return DEFAULT_ACCESS[role] ? [...DEFAULT_ACCESS[role]] : [...VIEW_TABS];
}

export function normalizeCaps(role: string, caps: string[]): AccessKey[] {
  const unique = [...new Set(caps.filter(isAccessKey))];
  if (role === "ADMIN") {
    for (const key of LOCKED_ADMIN_ACCESS) {
      if (!unique.includes(key)) unique.push(key);
    }
  }
  if (!unique.some((key) => key === "dashboard" || key === "projects" || key === "team")) {
    unique.unshift("dashboard");
  }
  return ACCESS_KEYS.filter((key) => unique.includes(key));
}

export function firstHomePath(caps: readonly string[]) {
  if (caps.includes("dashboard")) return "/";
  if (caps.includes("projects")) return "/projects";
  if (caps.includes("team")) return "/team";
  return "/";
}

export function tabAccess(caps: readonly string[]) {
  return ACCESS_FIELDS.filter((field) => field.group === "tab" && caps.includes(field.key));
}

export function workAccess(caps: readonly string[]) {
  return ACCESS_FIELDS.filter((field) => field.group === "work" && caps.includes(field.key));
}

export function presetRoleLabel(role: string) {
  return PRESET_ROLES.find((item) => item.value === role)?.label ?? role;
}
