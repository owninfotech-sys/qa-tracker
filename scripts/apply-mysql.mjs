import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
} catch {
  /* .env is optional when DATABASE_URL is already set */
}

const url = process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/qatracker";
const parsed = new URL(url);
const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "qatracker";
const user = decodeURIComponent(parsed.username || "root");
const password = decodeURIComponent(parsed.password || "");
const host = parsed.hostname || "localhost";
const port = parsed.port || "3306";

const mysqlBin = [
  process.env.MYSQL_BIN,
  "mysql",
  "/Applications/XAMPP/bin/mysql",
  "/Applications/XAMPP/xamppfiles/bin/mysql",
].find((bin) => bin && (bin === "mysql" || existsSync(bin)));

if (!mysqlBin) {
  throw new Error("MySQL client not found. Set MYSQL_BIN or install mysql.");
}

const args = ["-h", host, "-P", port, "-u", user];
if (password) args.push(`-p${password}`);

execFileSync(mysqlBin, [...args, "-e", `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`], {
  stdio: "inherit",
});

const sqlPath = join(tmpdir(), "qa-tracker-schema.sql");
execSync(
  `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > "${sqlPath}"`,
  { stdio: "inherit" },
);

execFileSync(
  mysqlBin,
  [
    ...args,
    "-e",
    `SET FOREIGN_KEY_CHECKS=0;
     DROP TABLE IF EXISTS qa_activity, qa_fix_task, qa_run_item, qa_test_run, qa_page_task, qa_test_case, qa_page, qa_module, qa_project, qa_user,
       Activity, FixTask, RunItem, TestRun, TestCase, Page, Module, Project, User;
     SET FOREIGN_KEY_CHECKS=1;`,
    database,
  ],
  { stdio: "inherit" },
);

execSync(`"${mysqlBin}" ${args.map((arg) => `'${arg}'`).join(" ")} '${database}' < '${sqlPath}'`, {
  stdio: "inherit",
  shell: true,
});

console.log(`Applied Prisma schema to MySQL database ${database}`);
