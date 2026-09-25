import mysql from "mysql2/promise";
import { mysqlEnv } from "./mysql-env.mjs";

function projectCodeFromName(name) {
  const words = String(name || "")
    .trim()
    .split(/[\s/_-]+/)
    .filter(Boolean);
  let code = "";
  if (words.length >= 2) code = `${words[0][0] ?? ""}${words[1][0] ?? ""}`;
  else code = (words[0] || "PRJ").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3);
  code = code.toUpperCase();
  if (code.length < 2) code = `P${code}`.slice(0, 3).padEnd(2, "X");
  return code.slice(0, 8);
}

function uniqueCode(base, used) {
  let code = base;
  let n = 2;
  while (used.has(code)) {
    code = `${base}${n}`.slice(0, 8);
    n += 1;
  }
  used.add(code);
  return code;
}

const config = mysqlEnv();
const conn = await mysql.createConnection({
  host: config.host,
  port: Number(config.port),
  user: config.user,
  password: config.password,
  database: config.database,
});

const [projects] = await conn.query("SELECT id, name, code FROM qa_project ORDER BY createdAt ASC");
const used = new Set(
  projects.map((project) => String(project.code || "").trim().toUpperCase()).filter(Boolean),
);

for (const project of projects) {
  let code = String(project.code || "").trim().toUpperCase();
  if (!code) code = uniqueCode(projectCodeFromName(project.name), used);
  else used.add(code);
  if (code !== project.code) {
    await conn.execute("UPDATE qa_project SET code = ? WHERE id = ?", [code, project.id]);
  }
  const [tasks] = await conn.query(
    "SELECT id, `number`, taskKey FROM qa_page_task WHERE projectId = ? ORDER BY createdAt ASC, id ASC",
    [project.id],
  );
  let next = 1;
  for (const task of tasks) {
    const number = Number(task.number) > 0 ? Number(task.number) : next;
    const taskKey = `${code}-${number}`;
    if (Number(task.number) !== number || task.taskKey !== taskKey) {
      await conn.execute("UPDATE qa_page_task SET `number` = ?, taskKey = ? WHERE id = ?", [
        number,
        taskKey,
        task.id,
      ]);
    }
    next = Math.max(next, number + 1);
  }
}

await conn.end();
console.log("Project and task keys are ready");
