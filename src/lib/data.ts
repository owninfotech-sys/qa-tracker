import { asBool, asDate, createId, execute, query, queryOne, withTransaction } from "@/lib/db";
import type { Role } from "@/lib/types";

type Row = Record<string, unknown>;

function placeholders(count: number) {
  return Array.from({ length: count }, () => "?").join(", ");
}

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  createdAt: Date;
};

function mapUser(row: Row): UserRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password: String(row.password),
    role: String(row.role) as Role,
    active: asBool(row.active),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
  };
}

export async function findUserById(id: string) {
  const row = await queryOne<Row>("SELECT * FROM qa_user WHERE id = ? LIMIT 1", [id]);
  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string) {
  const row = await queryOne<Row>("SELECT * FROM qa_user WHERE email = ? LIMIT 1", [email]);
  return row ? mapUser(row) : null;
}

export async function findUsers(options?: {
  active?: boolean;
  role?: string;
  ids?: string[];
  orderBy?: "name" | "createdAt";
}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (options?.active != null) {
    where.push("active = ?");
    params.push(options.active ? 1 : 0);
  }
  if (options?.role) {
    where.push("role = ?");
    params.push(options.role);
  }
  if (options?.ids?.length) {
    where.push(`id IN (${placeholders(options.ids.length)})`);
    params.push(...options.ids);
  }
  const order = options?.orderBy === "createdAt" ? "createdAt ASC" : "name ASC";
  const sql = `SELECT id, name, email, role, active, createdAt FROM qa_user${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}`;
  return (await query<Row>(sql, params)).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as Role,
    active: asBool(row.active),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
  }));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const id = createId();
  await execute(
    "INSERT INTO qa_user (id, name, email, password, role, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, NOW(3))",
    [id, data.name, data.email, data.password, data.role],
  );
  return { id };
}

export async function updateUser(id: string, data: { role?: string; active?: boolean; name?: string }) {
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.role != null) {
    fields.push("role = ?");
    params.push(data.role);
  }
  if (data.active != null) {
    fields.push("active = ?");
    params.push(data.active ? 1 : 0);
  }
  if (data.name != null) {
    fields.push("name = ?");
    params.push(data.name);
  }
  if (!fields.length) return;
  params.push(id);
  await execute(`UPDATE qa_user SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function upsertUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const existing = await findUserByEmail(data.email);
  if (existing) {
    await updateUser(existing.id, { name: data.name, role: data.role, active: true });
    return existing.id;
  }
  const created = await createUser(data);
  return created.id;
}

export async function findTeamPeople() {
  const rows = await query<Row>(
    `SELECT u.*,
      (SELECT COUNT(*) FROM qa_run_item i
        JOIN qa_test_run r ON r.id = i.runId
        WHERE i.assigneeId = u.id AND r.status = 'open' AND i.result IN ('pending', 'in_progress')) AS openTests,
      (SELECT COUNT(*) FROM qa_fix_task f
        WHERE f.assigneeId = u.id AND f.status IN ('open', 'in_progress', 'retest')) AS openFixes
     FROM qa_user u
     ORDER BY u.createdAt ASC`,
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as Role,
    active: asBool(row.active),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
    assignedItems: Array.from({ length: Number(row.openTests) || 0 }),
    assignedFixes: Array.from({ length: Number(row.openFixes) || 0 }),
  }));
}

export type ProjectRecord = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  rsvpUrl: string | null;
  status: string;
  ownerId: string;
  createdAt: Date;
};

function mapProject(row: Row): ProjectRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    url: row.url == null ? null : String(row.url),
    rsvpUrl: row.rsvpUrl == null ? null : String(row.rsvpUrl),
    status: String(row.status),
    ownerId: String(row.ownerId),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
  };
}

export async function findProjectById(id: string) {
  const row = await queryOne<Row>("SELECT * FROM qa_project WHERE id = ? LIMIT 1", [id]);
  return row ? mapProject(row) : null;
}

export async function findPages(projectId: string) {
  return query<{ id: string; name: string; projectId: string }>(
    "SELECT id, name, projectId FROM qa_page WHERE projectId = ? ORDER BY name ASC",
    [projectId],
  );
}

export async function findFirstPage(projectId: string) {
  return queryOne<{ id: string }>(
    "SELECT id FROM qa_page WHERE projectId = ? ORDER BY name ASC LIMIT 1",
    [projectId],
  );
}

export async function createPage(projectId: string, name: string) {
  const id = createId();
  await execute("INSERT INTO qa_page (id, projectId, name) VALUES (?, ?, ?)", [id, projectId, name]);
  return { id, projectId, name };
}

export async function deletePage(pageId: string) {
  await execute("UPDATE qa_test_case SET pageId = NULL WHERE pageId = ?", [pageId]);
  await execute("DELETE FROM qa_page WHERE id = ?", [pageId]);
}

export async function mergeDuplicatePages(projectId: string) {
  const pages = await query<{ id: string; name: string }>(
    "SELECT id, name FROM qa_page WHERE projectId = ? ORDER BY id ASC",
    [projectId],
  );
  const keep = new Map<string, string>();
  for (const page of pages) {
    const key = page.name.trim().toLowerCase();
    const first = keep.get(key);
    if (!first) {
      keep.set(key, page.id);
      continue;
    }
    await execute("UPDATE qa_test_case SET pageId = ? WHERE pageId = ?", [first, page.id]);
    await execute("DELETE FROM qa_page WHERE id = ?", [page.id]);
  }
}

export async function createProject(data: {
  name: string;
  type: string;
  url: string | null;
  rsvpUrl: string | null;
  ownerId: string;
  pages: string[];
}) {
  const id = createId();
  await withTransaction(async (conn) => {
    await conn.execute(
      "INSERT INTO qa_project (id, name, type, url, rsvpUrl, status, ownerId, createdAt) VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(3))",
      [id, data.name, data.type, data.url, data.rsvpUrl, data.ownerId],
    );
    const moduleId = createId();
    await conn.execute("INSERT INTO qa_module (id, projectId, name) VALUES (?, ?, 'General')", [moduleId, id]);
    for (const pageName of data.pages) {
      await conn.execute("INSERT INTO qa_page (id, projectId, name) VALUES (?, ?, ?)", [createId(), id, pageName]);
    }
  });
  return { id };
}

export async function updateProject(
  id: string,
  data: { status?: string; url?: string | null; rsvpUrl?: string | null },
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.status != null) {
    fields.push("status = ?");
    params.push(data.status);
  }
  if (data.url !== undefined) {
    fields.push("url = ?");
    params.push(data.url);
  }
  if (data.rsvpUrl !== undefined) {
    fields.push("rsvpUrl = ?");
    params.push(data.rsvpUrl);
  }
  if (!fields.length) return;
  params.push(id);
  await execute(`UPDATE qa_project SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function deleteProject(id: string) {
  await withTransaction(async (conn) => {
    await conn.execute("DELETE FROM qa_test_run WHERE projectId = ?", [id]);
    await conn.execute(
      `DELETE c FROM qa_page_task_comment c
       JOIN qa_page_task t ON t.id = c.taskId
       WHERE t.projectId = ?`,
      [id],
    );
    await conn.execute("UPDATE qa_page_task SET parentId = NULL WHERE projectId = ?", [id]);
    await conn.execute("DELETE FROM qa_page_task WHERE projectId = ?", [id]);
    await conn.execute("DELETE FROM qa_test_case WHERE projectId = ?", [id]);
    await conn.execute("DELETE FROM qa_page WHERE projectId = ?", [id]);
    await conn.execute("DELETE FROM qa_module WHERE projectId = ?", [id]);
    await conn.execute("DELETE FROM qa_project WHERE id = ?", [id]);
  });
}

export async function findActiveProjectsList() {
  const projects = (await query<Row>("SELECT * FROM qa_project WHERE status = 'active' ORDER BY createdAt DESC")).map(
    mapProject,
  );
  if (!projects.length) return [];
  const ids = projects.map((project) => project.id);
  const pages = await query<{ id: string; projectId: string }>(
    `SELECT id, projectId FROM qa_page WHERE projectId IN (${placeholders(ids.length)})`,
    ids,
  );
  const cases = await query<{ id: string; projectId: string }>(
    `SELECT id, projectId FROM qa_test_case WHERE projectId IN (${placeholders(ids.length)})`,
    ids,
  );
  const runs = await query<Row>(
    `SELECT * FROM qa_test_run WHERE projectId IN (${placeholders(ids.length)}) ORDER BY createdAt DESC`,
    ids,
  );
  const runIds = runs.map((run) => String(run.id));
  const items = runIds.length
    ? await query<Row>(`SELECT * FROM qa_run_item WHERE runId IN (${placeholders(runIds.length)})`, runIds)
    : [];
  return projects.map((project) => ({
    ...project,
    pages: pages.filter((page) => page.projectId === project.id),
    cases: cases.filter((item) => item.projectId === project.id),
    runs: runs
      .filter((run) => String(run.projectId) === project.id)
      .map((run) => ({
        id: String(run.id),
        name: String(run.name),
        status: String(run.status),
        items: items
          .filter((item) => String(item.runId) === String(run.id))
          .map((item) => ({ id: String(item.id), result: String(item.result) })),
      })),
  }));
}

export async function findProjectDashboard(id: string) {
  const project = await findProjectById(id);
  if (!project) return null;
  const pages = await query<Row>("SELECT * FROM qa_page WHERE projectId = ? ORDER BY name ASC", [id]);
  const cases = await query<Row>("SELECT * FROM qa_test_case WHERE projectId = ?", [id]);
  const tasks = await query<Row>("SELECT id, pageId, status FROM qa_page_task WHERE projectId = ?", [id]);
  const runs = await query<Row>("SELECT * FROM qa_test_run WHERE projectId = ? ORDER BY createdAt DESC", [id]);
  const runIds = runs.map((run) => String(run.id));
  const items = runIds.length
    ? await query<Row>(`SELECT * FROM qa_run_item WHERE runId IN (${placeholders(runIds.length)})`, runIds)
    : [];
  const caseIds = [...new Set(items.map((item) => String(item.caseId)))];
  const caseRows = caseIds.length
    ? await query<Row>(`SELECT * FROM qa_test_case WHERE id IN (${placeholders(caseIds.length)})`, caseIds)
    : [];
  const assigneeIds = [...new Set(items.map((item) => item.assigneeId).filter(Boolean).map(String))];
  const assignees = assigneeIds.length
    ? await query<Row>(`SELECT id, name FROM qa_user WHERE id IN (${placeholders(assigneeIds.length)})`, assigneeIds)
    : [];
  const caseById = new Map(caseRows.map((row) => [String(row.id), row]));
  const pageById = new Map(pages.map((row) => [String(row.id), row]));
  const userById = new Map(assignees.map((row) => [String(row.id), row]));

  return {
    ...project,
    pages: pages.map((page) => ({
      id: String(page.id),
      name: String(page.name),
      cases: cases.filter((item) => String(item.pageId) === String(page.id)),
      tasks: tasks.filter((task) => String(task.pageId) === String(page.id)),
    })),
    cases: cases.map((item) => ({
      ...item,
      id: String(item.id),
      page: item.pageId ? { name: String(pageById.get(String(item.pageId))?.name ?? "") } : null,
    })),
    runs: runs.map((run) => ({
      id: String(run.id),
      name: String(run.name),
      status: String(run.status),
      items: items
        .filter((item) => String(item.runId) === String(run.id))
        .map((item) => {
          const testCase = caseById.get(String(item.caseId));
          const page = testCase?.pageId ? pageById.get(String(testCase.pageId)) : null;
          const assignee = item.assigneeId ? userById.get(String(item.assigneeId)) : null;
          return {
            id: String(item.id),
            result: String(item.result),
            case: {
              caseKey: String(testCase?.caseKey ?? ""),
              title: String(testCase?.title ?? ""),
              pageId: testCase?.pageId ? String(testCase.pageId) : null,
              page: page ? { name: String(page.name) } : null,
            },
            assignee: assignee ? { name: String(assignee.name) } : null,
          };
        }),
    })),
  };
}

export async function findProjectWorkQueue(id: string) {
  const project = await findProjectById(id);
  if (!project) return null;
  const owner = await findUserById(project.ownerId);
  const pages = await query<{ id: string; name: string }>(
    "SELECT id, name FROM qa_page WHERE projectId = ? ORDER BY name ASC",
    [id],
  );
  const tasks = await query<{ pageId: string }>("SELECT pageId FROM qa_page_task WHERE projectId = ?", [id]);
  return {
    ...project,
    owner: { name: owner?.name ?? project.name },
    pages: pages.map((page) => ({
      ...page,
      tasks: tasks.filter((task) => task.pageId === page.id),
    })),
  };
}

export async function findProjectCases(id: string) {
  const project = await findProjectById(id);
  if (!project) return null;
  const cases = await query<Row>(
    `SELECT c.*, p.name AS pageName
     FROM qa_test_case c
     LEFT JOIN qa_page p ON p.id = c.pageId
     WHERE c.projectId = ?
     ORDER BY c.createdAt ASC`,
    [id],
  );
  return {
    ...project,
    cases: cases.map((item) => ({
      id: String(item.id),
      caseKey: String(item.caseKey),
      title: String(item.title),
      priority: String(item.priority),
      status: String(item.status),
      page: item.pageName ? { name: String(item.pageName) } : null,
    })),
  };
}

export async function findProjectWithPages(id: string) {
  const project = await findProjectById(id);
  if (!project) return null;
  return { ...project, pages: await findPages(id) };
}

export type PageTaskRecord = {
  id: string;
  projectId: string;
  pageId: string;
  kind: string;
  title: string;
  details: string | null;
  priority: string;
  status: string;
  labels: string | null;
  linkedTaskIds: string | null;
  parentId: string | null;
  assigneeId: string | null;
  assigneeIds: string | null;
  reporterId: string | null;
  firstResponseAt: Date | null;
  resolutionAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function mapTask(row: Row): PageTaskRecord {
  return {
    id: String(row.id),
    projectId: String(row.projectId),
    pageId: String(row.pageId),
    kind: String(row.kind),
    title: String(row.title),
    details: row.details == null ? null : String(row.details),
    priority: String(row.priority),
    status: String(row.status),
    labels: row.labels == null ? null : String(row.labels),
    linkedTaskIds: row.linkedTaskIds == null ? null : String(row.linkedTaskIds),
    parentId: row.parentId == null ? null : String(row.parentId),
    assigneeId: row.assigneeId == null ? null : String(row.assigneeId),
    assigneeIds: row.assigneeIds == null ? null : String(row.assigneeIds),
    reporterId: row.reporterId == null ? null : String(row.reporterId),
    firstResponseAt: asDate(row.firstResponseAt as Date | string | null),
    resolutionAt: asDate(row.resolutionAt as Date | string | null),
    sortOrder: Number(row.sortOrder) || 0,
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
    updatedAt: asDate(row.updatedAt as Date | string) ?? new Date(),
  };
}

export async function findPageTaskById(id: string) {
  const row = await queryOne<Row>("SELECT * FROM qa_page_task WHERE id = ? LIMIT 1", [id]);
  return row ? mapTask(row) : null;
}

export async function findPageTasksForBoard(projectId: string) {
  const tasks = (await query<Row>("SELECT * FROM qa_page_task WHERE projectId = ? ORDER BY createdAt DESC", [projectId])).map(
    mapTask,
  );
  const pages = await query<{ id: string; name: string }>("SELECT id, name FROM qa_page WHERE projectId = ?", [projectId]);
  const users = await query<{ id: string; name: string }>("SELECT id, name FROM qa_user");
  const counts = await query<{ taskId: string; total: number }>(
    `SELECT taskId, COUNT(*) AS total FROM qa_page_task_comment
     WHERE taskId IN (SELECT id FROM qa_page_task WHERE projectId = ?)
     GROUP BY taskId`,
    [projectId],
  );
  const pageById = new Map(pages.map((page) => [page.id, page.name]));
  const userById = new Map(users.map((user) => [user.id, user.name]));
  const countById = new Map(counts.map((row) => [row.taskId, Number(row.total)]));
  return tasks.map((task) => ({
    ...task,
    page: { name: pageById.get(task.pageId) ?? "" },
    assignee: task.assigneeId ? { id: task.assigneeId, name: userById.get(task.assigneeId) ?? null } : null,
    reporter: task.reporterId ? { name: userById.get(task.reporterId) ?? null } : null,
    _count: { comments: countById.get(task.id) ?? 0 },
  }));
}

export async function findPageTaskDetail(taskId: string) {
  const task = await findPageTaskById(taskId);
  if (!task) return null;
  const [project, page, assignee, reporter, children, comments] = await Promise.all([
    findProjectById(task.projectId),
    queryOne<{ name: string }>("SELECT name FROM qa_page WHERE id = ?", [task.pageId]),
    task.assigneeId
      ? queryOne<{ id: string; name: string }>("SELECT id, name FROM qa_user WHERE id = ?", [task.assigneeId])
      : null,
    task.reporterId ? queryOne<{ name: string }>("SELECT name FROM qa_user WHERE id = ?", [task.reporterId]) : null,
    query<{ id: string; title: string; pageId: string }>(
      "SELECT id, title, pageId FROM qa_page_task WHERE parentId = ?",
      [taskId],
    ),
    query<Row>(
      `SELECT c.*, u.name AS userName
       FROM qa_page_task_comment c
       JOIN qa_user u ON u.id = c.userId
       WHERE c.taskId = ?
       ORDER BY c.createdAt DESC`,
      [taskId],
    ),
  ]);
  return {
    ...task,
    project: { name: project?.name ?? "" },
    page: { name: page?.name ?? "" },
    assignee,
    reporter,
    children,
    comments: comments.map((comment) => ({
      id: String(comment.id),
      body: String(comment.body),
      visibility: String(comment.visibility),
      createdAt: asDate(comment.createdAt as Date | string) ?? new Date(),
      user: { name: String(comment.userName) },
    })),
  };
}

export async function findSiblingTasks(projectId: string, taskId: string) {
  return query<{ id: string; title: string; pageId: string; linkedTaskIds: string | null }>(
    "SELECT id, title, pageId, linkedTaskIds FROM qa_page_task WHERE projectId = ? AND id <> ? ORDER BY createdAt DESC LIMIT 80",
    [projectId, taskId],
  );
}

export async function createPageTask(data: {
  projectId: string;
  pageId: string;
  kind: string;
  title: string;
  details: string | null;
  priority: string;
  status: string;
  parentId: string | null;
  labels: string | null;
  assigneeId: string | null;
  assigneeIds: string | null;
  reporterId: string;
}) {
  const id = createId();
  await execute(
    `INSERT INTO qa_page_task
      (id, projectId, pageId, kind, title, details, priority, status, parentId, labels, assigneeId, assigneeIds, reporterId, sortOrder, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(3), NOW(3))`,
    [
      id,
      data.projectId,
      data.pageId,
      data.kind,
      data.title,
      data.details,
      data.priority,
      data.status,
      data.parentId,
      data.labels,
      data.assigneeId,
      data.assigneeIds,
      data.reporterId,
    ],
  );
  return { id };
}

export async function updatePageTask(
  id: string,
  data: Partial<{
    status: string;
    priority: string;
    title: string;
    details: string | null;
    kind: string;
    labels: string | null;
    assigneeId: string | null;
    assigneeIds: string | null;
    firstResponseAt: Date | null;
    resolutionAt: Date | null;
    linkedTaskIds: string | null;
  }>,
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    fields.push(`\`${key}\` = ?`);
    params.push(value instanceof Date ? value : value);
  }
  if (!fields.length) return;
  fields.push("updatedAt = NOW(3)");
  params.push(id);
  await execute(`UPDATE qa_page_task SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function deletePageTask(id: string) {
  await execute("DELETE FROM qa_page_task WHERE id = ?", [id]);
}

export async function createTaskComment(data: {
  taskId: string;
  userId: string;
  body: string;
  visibility: string;
}) {
  const id = createId();
  await execute(
    "INSERT INTO qa_page_task_comment (id, taskId, userId, body, visibility, createdAt) VALUES (?, ?, ?, ?, ?, NOW(3))",
    [id, data.taskId, data.userId, data.body, data.visibility],
  );
  return { id };
}

export async function createTaskAttachment(data: {
  taskId: string;
  commentId: string | null;
  userId: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
}) {
  const id = createId();
  await execute(
    `INSERT INTO qa_page_task_attachment
      (id, taskId, commentId, userId, fileName, mimeType, size, path, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
    [id, data.taskId, data.commentId, data.userId, data.fileName, data.mimeType, data.size, data.path],
  );
  return { id };
}

export async function findTaskAttachments(taskId: string) {
  const rows = await query<Row>(
    "SELECT * FROM qa_page_task_attachment WHERE taskId = ? ORDER BY createdAt DESC",
    [taskId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    taskId: String(row.taskId),
    commentId: row.commentId == null ? null : String(row.commentId),
    userId: String(row.userId),
    fileName: String(row.fileName),
    mimeType: String(row.mimeType),
    size: Number(row.size),
    path: String(row.path),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
  }));
}

export async function logActivity(entityType: string, entityId: string, userId: string, message: string) {
  try {
    await execute(
      "INSERT INTO qa_activity (id, entityType, entityId, userId, message, createdAt) VALUES (?, ?, ?, ?, ?, NOW(3))",
      [createId(), entityType, entityId, userId, message],
    );
  } catch (error) {
    console.error("Could not write activity", error);
  }
}

export async function findTaskActivity(taskId: string) {
  const rows = await query<Row>(
    `SELECT a.*, u.name AS userName
     FROM qa_activity a
     JOIN qa_user u ON u.id = a.userId
     WHERE a.entityType = 'page_task' AND a.entityId = ?
     ORDER BY a.createdAt DESC
     LIMIT 40`,
    [taskId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    message: String(row.message),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
    user: { name: String(row.userName) },
  }));
}

export async function findActivityForEntities(entityIds: string[]) {
  if (!entityIds.length) return [];
  const rows = await query<Row>(
    `SELECT a.*, u.name AS userName
     FROM qa_activity a
     JOIN qa_user u ON u.id = a.userId
     WHERE a.entityId IN (${placeholders(entityIds.length)})
     ORDER BY a.createdAt DESC
     LIMIT 20`,
    entityIds,
  );
  return rows.map((row) => ({
    id: String(row.id),
    message: String(row.message),
    createdAt: asDate(row.createdAt as Date | string) ?? new Date(),
    user: { name: String(row.userName) },
  }));
}

export async function findOrCreateModule(projectId: string) {
  const existing = await queryOne<{ id: string }>("SELECT id FROM qa_module WHERE projectId = ? LIMIT 1", [projectId]);
  if (existing) return existing;
  const id = createId();
  await execute("INSERT INTO qa_module (id, projectId, name) VALUES (?, ?, 'General')", [id, projectId]);
  return { id };
}

export async function findPageByName(projectId: string, name: string) {
  return queryOne<{ id: string }>("SELECT id FROM qa_page WHERE projectId = ? AND name = ? LIMIT 1", [projectId, name]);
}

export async function countCases(projectId: string) {
  const row = await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM qa_test_case WHERE projectId = ?", [
    projectId,
  ]);
  return Number(row?.total) || 0;
}

export async function createTestCase(data: {
  projectId: string;
  moduleId: string;
  pageId: string | null;
  caseKey: string;
  title: string;
  priority: string;
  preconditions: string | null;
  steps: string;
  expected: string;
}) {
  await execute(
    `INSERT INTO qa_test_case
      (id, caseKey, projectId, moduleId, pageId, title, priority, preconditions, steps, expected, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', NOW(3), NOW(3))`,
    [
      createId(),
      data.caseKey,
      data.projectId,
      data.moduleId,
      data.pageId,
      data.title,
      data.priority,
      data.preconditions,
      data.steps,
      data.expected,
    ],
  );
}

export async function findReadyCases(projectId: string, ids?: string[]) {
  if (ids?.length) {
    return query<Row>(
      `SELECT * FROM qa_test_case WHERE projectId = ? AND status = 'ready' AND id IN (${placeholders(ids.length)})`,
      [projectId, ...ids],
    );
  }
  return query<Row>("SELECT * FROM qa_test_case WHERE projectId = ? AND status = 'ready'", [projectId]);
}

export async function createTestRun(data: {
  projectId: string;
  name: string;
  build: string | null;
  dueDate: Date | null;
  assigneeId: string | null;
  cases: { id: string }[];
}) {
  const id = createId();
  await withTransaction(async (conn) => {
    await conn.execute(
      "INSERT INTO qa_test_run (id, projectId, name, build, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, 'open', NOW(3))",
      [id, data.projectId, data.name, data.build, data.dueDate],
    );
    for (const testCase of data.cases) {
      await conn.execute(
        "INSERT INTO qa_run_item (id, runId, caseId, assigneeId, result, dueDate) VALUES (?, ?, ?, ?, 'pending', ?)",
        [createId(), id, testCase.id, data.assigneeId, data.dueDate],
      );
    }
  });
  return { id };
}

export async function assignRunItems(runId: string, itemIds: string[], assigneeId: string) {
  if (!itemIds.length) return;
  await execute(
    `UPDATE qa_run_item SET assigneeId = ? WHERE runId = ? AND id IN (${placeholders(itemIds.length)})`,
    [assigneeId, runId, ...itemIds],
  );
}

export async function countOpenRunItems(runId: string) {
  const row = await queryOne<{ total: number }>(
    "SELECT COUNT(*) AS total FROM qa_run_item WHERE runId = ? AND result IN ('pending', 'in_progress')",
    [runId],
  );
  return Number(row?.total) || 0;
}

export async function closeTestRun(runId: string) {
  await execute("UPDATE qa_test_run SET status = 'closed' WHERE id = ?", [runId]);
}

export async function findTestRunDetail(id: string) {
  const run = await queryOne<Row>("SELECT * FROM qa_test_run WHERE id = ? LIMIT 1", [id]);
  if (!run) return null;
  const project = await findProjectById(String(run.projectId));
  const items = await query<Row>(
    `SELECT i.*, c.caseKey, c.title, c.priority, p.name AS pageName, u.name AS assigneeName
     FROM qa_run_item i
     JOIN qa_test_case c ON c.id = i.caseId
     LEFT JOIN qa_page p ON p.id = c.pageId
     LEFT JOIN qa_user u ON u.id = i.assigneeId
     WHERE i.runId = ?
     ORDER BY i.id ASC`,
    [id],
  );
  return {
    id: String(run.id),
    projectId: String(run.projectId),
    name: String(run.name),
    build: run.build == null ? null : String(run.build),
    dueDate: asDate(run.dueDate as Date | string | null),
    status: String(run.status),
    project: { name: project?.name ?? "" },
    items: items.map((item) => ({
      id: String(item.id),
      assigneeId: item.assigneeId == null ? null : String(item.assigneeId),
      result: String(item.result),
      case: {
        caseKey: String(item.caseKey),
        title: String(item.title),
        priority: String(item.priority),
        page: item.pageName ? { name: String(item.pageName) } : null,
      },
      assignee: item.assigneeName ? { name: String(item.assigneeName) } : null,
    })),
  };
}

export async function findActiveProjectsForRun() {
  const projects = (await query<Row>("SELECT * FROM qa_project WHERE status = 'active' ORDER BY name ASC")).map(
    mapProject,
  );
  if (!projects.length) return [];
  const ids = projects.map((project) => project.id);
  const cases = await query<Row>(
    `SELECT c.*, p.name AS pageName
     FROM qa_test_case c
     LEFT JOIN qa_page p ON p.id = c.pageId
     WHERE c.projectId IN (${placeholders(ids.length)}) AND c.status = 'ready'`,
    ids,
  );
  return projects.map((project) => ({
    ...project,
    cases: cases
      .filter((item) => String(item.projectId) === project.id)
      .map((item) => ({
        id: String(item.id),
        caseKey: String(item.caseKey),
        title: String(item.title),
        page: item.pageName ? { name: String(item.pageName) } : null,
      })),
  }));
}

export async function findRunItemById(id: string) {
  const item = await queryOne<Row>("SELECT * FROM qa_run_item WHERE id = ? LIMIT 1", [id]);
  if (!item) return null;
  const [testCase, run, assignee, fixTasks] = await Promise.all([
    queryOne<Row>("SELECT * FROM qa_test_case WHERE id = ?", [item.caseId]),
    queryOne<Row>("SELECT * FROM qa_test_run WHERE id = ?", [item.runId]),
    item.assigneeId ? queryOne<Row>("SELECT * FROM qa_user WHERE id = ?", [item.assigneeId]) : null,
    query<Row>("SELECT * FROM qa_fix_task WHERE runItemId = ?", [id]),
  ]);
  const [project, module, page] = testCase
    ? await Promise.all([
        findProjectById(String(testCase.projectId)),
        queryOne<Row>("SELECT * FROM qa_module WHERE id = ?", [testCase.moduleId]),
        testCase.pageId ? queryOne<Row>("SELECT * FROM qa_page WHERE id = ?", [testCase.pageId]) : null,
      ])
    : [null, null, null];
  return {
    id: String(item.id),
    runId: String(item.runId),
    caseId: String(item.caseId),
    assigneeId: item.assigneeId == null ? null : String(item.assigneeId),
    result: String(item.result),
    comment: item.comment == null ? null : String(item.comment),
    actualResult: item.actualResult == null ? null : String(item.actualResult),
    startedAt: asDate(item.startedAt as Date | string | null),
    finishedAt: asDate(item.finishedAt as Date | string | null),
    dueDate: asDate(item.dueDate as Date | string | null),
    case: {
      id: String(testCase?.id ?? ""),
      caseKey: String(testCase?.caseKey ?? ""),
      title: String(testCase?.title ?? ""),
      priority: String(testCase?.priority ?? "P2"),
      preconditions: testCase?.preconditions == null ? null : String(testCase.preconditions),
      steps: String(testCase?.steps ?? ""),
      expected: String(testCase?.expected ?? ""),
      project: { name: project?.name ?? "" },
      module,
      page: page ? { name: String(page.name) } : null,
    },
    run: {
      id: String(run?.id ?? ""),
      name: String(run?.name ?? ""),
      status: String(run?.status ?? ""),
    },
    assignee: assignee ? mapUser(assignee) : null,
    fixTasks: fixTasks.map((fix) => ({
      id: String(fix.id),
      fixKey: String(fix.fixKey),
      status: String(fix.status),
      steps: fix.steps == null ? null : String(fix.steps),
      assigneeId: fix.assigneeId == null ? null : String(fix.assigneeId),
    })),
  };
}

export async function updateRunItem(
  id: string,
  data: Partial<{
    result: string;
    comment: string | null;
    actualResult: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    assigneeId: string | null;
  }>,
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    fields.push(`\`${key}\` = ?`);
    params.push(value);
  }
  if (!fields.length) return;
  params.push(id);
  await execute(`UPDATE qa_run_item SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function countFixTasks() {
  const row = await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM qa_fix_task");
  return Number(row?.total) || 0;
}

export async function createFixTask(data: {
  fixKey: string;
  title: string;
  runItemId: string;
  severity: string;
  status: string;
  steps: string | null;
  dueDate: Date | null;
}) {
  await execute(
    `INSERT INTO qa_fix_task
      (id, fixKey, title, runItemId, severity, status, steps, dueDate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [createId(), data.fixKey, data.title, data.runItemId, data.severity, data.status, data.steps, data.dueDate],
  );
}

export async function updateFixTask(
  id: string,
  data: Partial<{
    assigneeId: string | null;
    status: string;
    steps: string | null;
    fixerNotes: string | null;
    severity: string;
  }>,
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    fields.push(`\`${key}\` = ?`);
    params.push(value);
  }
  if (!fields.length) return;
  fields.push("updatedAt = NOW(3)");
  params.push(id);
  await execute(`UPDATE qa_fix_task SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function findFixById(id: string) {
  const fix = await queryOne<Row>("SELECT * FROM qa_fix_task WHERE id = ? LIMIT 1", [id]);
  if (!fix) return null;
  const runItem = await findRunItemById(String(fix.runItemId));
  const assignee = fix.assigneeId ? await findUserById(String(fix.assigneeId)) : null;
  return {
    id: String(fix.id),
    fixKey: String(fix.fixKey),
    title: String(fix.title),
    runItemId: String(fix.runItemId),
    severity: String(fix.severity),
    status: String(fix.status),
    steps: fix.steps == null ? null : String(fix.steps),
    fixerNotes: fix.fixerNotes == null ? null : String(fix.fixerNotes),
    assigneeId: fix.assigneeId == null ? null : String(fix.assigneeId),
    assignee,
    runItem,
  };
}

export async function findMyWork(userId: string) {
  const myItems = await query<Row>(
    `SELECT i.*, c.caseKey, c.title, c.priority, c.pageId, p.name AS pageName, pr.name AS projectName, r.name AS runName, r.status AS runStatus
     FROM qa_run_item i
     JOIN qa_test_run r ON r.id = i.runId
     JOIN qa_test_case c ON c.id = i.caseId
     JOIN qa_project pr ON pr.id = c.projectId
     LEFT JOIN qa_page p ON p.id = c.pageId
     WHERE i.assigneeId = ? AND r.status = 'open' AND i.result IN ('pending', 'in_progress')
     ORDER BY i.dueDate ASC`,
    [userId],
  );
  const myFixes = await query<Row>(
    `SELECT f.*, c.title AS caseTitle, pr.name AS projectName
     FROM qa_fix_task f
     JOIN qa_run_item i ON i.id = f.runItemId
     JOIN qa_test_case c ON c.id = i.caseId
     JOIN qa_project pr ON pr.id = c.projectId
     WHERE f.assigneeId = ? AND f.status IN ('open', 'in_progress')
     ORDER BY f.createdAt DESC`,
    [userId],
  );
  const retests = await query<Row>(
    `SELECT f.*, pr.name AS projectName
     FROM qa_fix_task f
     JOIN qa_run_item i ON i.id = f.runItemId
     JOIN qa_test_case c ON c.id = i.caseId
     JOIN qa_project pr ON pr.id = c.projectId
     WHERE f.status = 'retest' AND i.assigneeId = ?`,
    [userId],
  );
  const overdueItems = await query<Row>(
    `SELECT i.*, c.caseKey, c.title, pr.name AS projectName, u.name AS assigneeName
     FROM qa_run_item i
     JOIN qa_test_run r ON r.id = i.runId
     JOIN qa_test_case c ON c.id = i.caseId
     JOIN qa_project pr ON pr.id = c.projectId
     LEFT JOIN qa_user u ON u.id = i.assigneeId
     WHERE r.status = 'open' AND i.result IN ('pending', 'in_progress') AND i.dueDate IS NOT NULL AND i.dueDate < NOW()`,
  );
  const unassignedFails = await query<Row>(
    `SELECT f.* FROM qa_fix_task f
     WHERE f.assigneeId IS NULL AND f.status IN ('open', 'in_progress')`,
  );
  const openRuns = await query<Row>("SELECT * FROM qa_test_run WHERE status = 'open'");
  const openRunIds = openRuns.map((run) => String(run.id));
  const openItems = openRunIds.length
    ? await query<Row>(`SELECT * FROM qa_run_item WHERE runId IN (${placeholders(openRunIds.length)})`, openRunIds)
    : [];

  return {
    myItems: myItems.map((item) => ({
      id: String(item.id),
      dueDate: asDate(item.dueDate as Date | string | null),
      result: String(item.result),
      case: {
        caseKey: String(item.caseKey),
        title: String(item.title),
        priority: String(item.priority),
        page: item.pageName ? { name: String(item.pageName) } : null,
        project: { name: String(item.projectName) },
      },
    })),
    myFixes: myFixes.map((fix) => ({
      id: String(fix.id),
      fixKey: String(fix.fixKey),
      title: String(fix.title),
      severity: String(fix.severity),
      status: String(fix.status),
      runItem: { case: { project: { name: String(fix.projectName) } } },
    })),
    retests: retests.map((fix) => ({
      id: String(fix.id),
      runItemId: String(fix.runItemId),
      fixKey: String(fix.fixKey),
      title: String(fix.title),
      status: String(fix.status),
      runItem: { case: { project: { name: String(fix.projectName) } } },
    })),
    overdueItems: overdueItems.map((item) => ({
      id: String(item.id),
      case: {
        caseKey: String(item.caseKey),
        title: String(item.title),
        project: { name: String(item.projectName) },
      },
      assignee: item.assigneeName ? { name: String(item.assigneeName) } : null,
    })),
    unassignedFails,
    openRuns: openRuns.map((run) => ({
      id: String(run.id),
      items: openItems
        .filter((item) => String(item.runId) === String(run.id))
        .map((item) => ({ result: String(item.result) })),
    })),
  };
}

export async function loadSortOrders(projectId: string) {
  const rows = await query<{ id: string; sortOrder: number }>(
    "SELECT id, sortOrder FROM qa_page_task WHERE projectId = ?",
    [projectId],
  );
  return new Map(rows.map((row) => [row.id, Number(row.sortOrder) || 0]));
}

export async function nextSortOrderAtTop(projectId: string, status: string) {
  const row = await queryOne<{ minOrder: number | null }>(
    "SELECT MIN(sortOrder) AS minOrder FROM qa_page_task WHERE projectId = ? AND status = ?",
    [projectId, status],
  );
  return (row?.minOrder ?? 1) - 1;
}

export async function writeTaskSortOrder(id: string, sortOrder: number, status?: string) {
  if (status) {
    await execute("UPDATE qa_page_task SET sortOrder = ?, status = ? WHERE id = ?", [sortOrder, status, id]);
    return;
  }
  await execute("UPDATE qa_page_task SET sortOrder = ? WHERE id = ?", [sortOrder, id]);
}
