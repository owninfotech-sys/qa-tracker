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

mysql(
  [
    "-e",
    `CREATE TABLE IF NOT EXISTS \`${config.database}\`.\`qa_role_access\` (
      \`role\` varchar(40) NOT NULL,
      \`capability\` varchar(40) NOT NULL,
      PRIMARY KEY (\`role\`, \`capability\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ],
  { stdio: "inherit" },
);

const extraColumns = [
  ["qa_page_task", "assigneeIds", "TEXT NULL"],
  ["qa_page_task", "sortOrder", "INT NOT NULL DEFAULT 0"],
  ["qa_page_task", "firstResponseAt", "DATETIME(3) NULL"],
  ["qa_page_task", "resolutionAt", "DATETIME(3) NULL"],
  ["qa_page_task", "labels", "VARCHAR(191) NULL"],
  ["qa_page_task", "linkedTaskIds", "TEXT NULL"],
  ["qa_page_task", "parentId", "VARCHAR(191) NULL"],
  ["qa_page_task", "number", "INT NOT NULL DEFAULT 0"],
  ["qa_page_task", "taskKey", "VARCHAR(32) NULL"],
  ["qa_project", "rsvpUrl", "VARCHAR(2048) NULL"],
  ["qa_project", "code", "VARCHAR(16) NULL"],
  ["qa_user", "logo", "VARCHAR(512) NULL"],
  ["qa_project", "figmaUrl", "VARCHAR(2048) NULL"],
  ["qa_project", "deadline", "DATETIME(3) NULL"],
  ["qa_page", "sortOrder", "INT NOT NULL DEFAULT 0"],
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

mysql(
  [
    "-e",
    `UPDATE \`${config.database}\`.\`qa_project\`
     SET \`type\` = 'tasks'
     WHERE \`type\` IS NULL OR \`type\` NOT IN ('tasks', 'issues');`,
  ],
  { stdio: "inherit" },
);

mysql(
  [
    "-e",
    `ALTER TABLE \`${config.database}\`.\`qa_project\`
     MODIFY COLUMN \`type\` ENUM('tasks','issues') NOT NULL DEFAULT 'tasks',
     MODIFY COLUMN \`url\` VARCHAR(2048) NULL,
     MODIFY COLUMN \`rsvpUrl\` VARCHAR(2048) NULL;`,
  ],
  { stdio: "inherit" },
);

const typeIndex = mysql([
  "-N",
  "-e",
  `SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema='${config.database}' AND table_name='qa_project' AND index_name='qa_project_type_idx'`,
]).trim();
if (typeIndex === "0") {
  mysql(
    ["-e", `ALTER TABLE \`${config.database}\`.\`qa_project\` ADD INDEX \`qa_project_type_idx\` (\`type\`)`],
    { stdio: "inherit" },
  );
}

const foreignKeys = [
  ["qa_module", "qa_module_projectId_fkey", "projectId", "qa_project", "id", "CASCADE", "CASCADE"],
  ["qa_test_case", "qa_test_case_projectId_fkey", "projectId", "qa_project", "id", "CASCADE", "CASCADE"],
  ["qa_test_case", "qa_test_case_moduleId_fkey", "moduleId", "qa_module", "id", "RESTRICT", "CASCADE"],
  ["qa_test_case", "qa_test_case_pageId_fkey", "pageId", "qa_page", "id", "SET NULL", "CASCADE"],
  ["qa_test_run", "qa_test_run_projectId_fkey", "projectId", "qa_project", "id", "CASCADE", "CASCADE"],
  ["qa_run_item", "qa_run_item_runId_fkey", "runId", "qa_test_run", "id", "CASCADE", "CASCADE"],
  ["qa_run_item", "qa_run_item_caseId_fkey", "caseId", "qa_test_case", "id", "RESTRICT", "CASCADE"],
  ["qa_fix_task", "qa_fix_task_runItemId_fkey", "runItemId", "qa_run_item", "id", "CASCADE", "CASCADE"],
];

for (const [table, name, column, refTable, refColumn, onDelete, onUpdate] of foreignKeys) {
  const rows = mysql([
    "-N",
    "-e",
    `SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA='${config.database}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}' AND REFERENCED_TABLE_NAME IS NOT NULL`,
  ])
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [constraintName, referenced] = line.split("\t");
      return { constraintName, referenced };
    });

  const correct = rows.find((row) => row.constraintName === name && row.referenced === refTable);
  for (const row of rows) {
    if (row === correct) continue;
    mysql(
      ["-e", `ALTER TABLE \`${config.database}\`.\`${table}\` DROP FOREIGN KEY \`${row.constraintName}\``],
      { stdio: "inherit" },
    );
  }
  if (!correct) {
    mysql(
      [
        "-e",
        `ALTER TABLE \`${config.database}\`.\`${table}\`
         ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${refTable}\` (\`${refColumn}\`)
         ON DELETE ${onDelete} ON UPDATE ${onUpdate}`,
      ],
      { stdio: "inherit" },
    );
  }
}

spawnSync(process.execPath, [join(rootDir, "scripts/backfill-keys.mjs")], { stdio: "inherit" });

const uniqueIndexes = [
  ["qa_project", "qa_project_code_key", "`code`"],
  ["qa_page_task", "qa_page_task_projectId_number_key", "`projectId`, `number`"],
  ["qa_page_task", "qa_page_task_taskKey_key", "`taskKey`"],
];

for (const [table, name, columns] of uniqueIndexes) {
  const exists = mysql([
    "-N",
    "-e",
    `SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema='${config.database}' AND table_name='${table}' AND index_name='${name}'`,
  ]).trim();
  if (exists === "0") {
    mysql(
      ["-e", `ALTER TABLE \`${config.database}\`.\`${table}\` ADD UNIQUE KEY \`${name}\` (${columns})`],
      { stdio: "inherit" },
    );
  }
}

console.log(`MySQL schema is ready on ${config.database}`);
