import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(rootDir, ".env");
const sqlPath = join(rootDir, "scripts", "qa-trackerdb.sql");

try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
} catch {
  /* .env is optional when DATABASE_URL is already set */
}

const url = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/qa-trackerdb";
const parsed = new URL(url);
const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "qa-trackerdb";
const user = decodeURIComponent(parsed.username || "root");
const password = decodeURIComponent(parsed.password || "");
const host = parsed.hostname || "127.0.0.1";
const port = parsed.port || "3306";

const mysqlBin = [
  process.env.MYSQL_BIN,
  "/Applications/XAMPP/bin/mysql",
  "/Applications/XAMPP/xamppfiles/bin/mysql",
].find((bin) => bin && existsSync(bin)) || "mysql";

const args = ["--protocol=TCP", "-h", host, "-P", port, "-u", user];
if (password) args.push(`-p${password}`);

function mysql(extra, options = {}) {
  return execFileSync(mysqlBin, [...args, ...extra], { encoding: "utf8", ...options });
}

mysql(["-e", `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`]);

const applied = spawnSync(mysqlBin, [...args, database], {
  input: readFileSync(sqlPath),
  encoding: "utf8",
});
if (applied.status !== 0) {
  throw new Error(applied.stderr || applied.stdout || "Failed to apply qa-trackerdb.sql");
}

const extraColumns = [
  ["qa_page_task", "assigneeIds", "TEXT NULL"],
  ["qa_page_task", "sortOrder", "INT NOT NULL DEFAULT 0"],
  ["qa_page_task", "firstResponseAt", "DATETIME(3) NULL"],
  ["qa_page_task", "resolutionAt", "DATETIME(3) NULL"],
  ["qa_page_task", "labels", "VARCHAR(191) NULL"],
  ["qa_page_task", "linkedTaskIds", "TEXT NULL"],
  ["qa_page_task", "parentId", "VARCHAR(191) NULL"],
  ["qa_project", "rsvpUrl", "VARCHAR(191) NULL"],
];

for (const [table, column, definition] of extraColumns) {
  const exists = mysql([
    "-N",
    "-e",
    `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='${database}' AND table_name='${table}' AND column_name='${column}'`,
  ]).trim();
  if (exists === "0") {
    mysql(["-e", `ALTER TABLE \`${database}\`.\`${table}\` ADD COLUMN \`${column}\` ${definition}`], {
      stdio: "inherit",
    });
  }
}

console.log(`MySQL schema is ready on ${database}`);
