import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mysqlBin, mysqlEnv, rootDir } from "./mysql-env.mjs";

const sqlPath = join(rootDir, "scripts", "qa-trackerdb.sql");
const config = mysqlEnv();
const bin = mysqlBin();
const args = ["--protocol=TCP", "-h", config.host, "-P", String(config.port), "-u", config.user];
if (config.password) args.push(`-p${config.password}`);

function mysql(extra, options = {}) {
  return execFileSync(bin, [...args, ...extra], { encoding: "utf8", ...options });
}

mysql([
  "-e",
  `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
]);

const applied = spawnSync(bin, [...args, config.database], {
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
    `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='${config.database}' AND table_name='${table}' AND column_name='${column}'`,
  ]).trim();
  if (exists === "0") {
    mysql(["-e", `ALTER TABLE \`${config.database}\`.\`${table}\` ADD COLUMN \`${column}\` ${definition}`], {
      stdio: "inherit",
    });
  }
}

console.log(`MySQL schema is ready on ${config.database}`);
