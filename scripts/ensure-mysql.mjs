import { execFileSync, spawn } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const basedir = "/Applications/XAMPP/xamppfiles";
const mysqlBin = existsSync("/Applications/XAMPP/bin/mysql")
  ? "/Applications/XAMPP/bin/mysql"
  : `${basedir}/bin/mysql`;
const mysqldSafe = `${basedir}/bin/mysqld_safe`;
const datadir = `${basedir}/var/mysql`;
const socket = `${datadir}/mysql.sock`;
const pidFile = `${datadir}/${hostname()}.pid`;
const database = "qa-trackerdb";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(rootDir, ".env");
const examplePath = join(rootDir, ".env.example");

function mysqlArgs(extra = []) {
  return ["--protocol=TCP", "-h", "127.0.0.1", "-P", "3306", "-uroot", ...extra];
}

function ping() {
  try {
    execFileSync(mysqlBin, mysqlArgs(["-e", "SELECT 1"]), { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function startServer() {
  if (!existsSync(mysqldSafe)) {
    throw new Error("XAMPP MariaDB was not found. Start MySQL from the XAMPP control panel.");
  }

  if (existsSync(socket) && !ping()) {
    try {
      unlinkSync(socket);
    } catch {
      /* ignore */
    }
  }

  const child = spawn(mysqldSafe, [`--datadir=${datadir}`, `--pid-file=${pidFile}`], {
    detached: true,
    stdio: "ignore",
    cwd: "/",
  });
  child.unref();
}

function waitForReady(ms = 20000) {
  const started = Date.now();
  while (Date.now() - started < ms) {
    if (ping()) return;
    execFileSync("sleep", ["0.4"]);
  }
  throw new Error("MySQL did not become reachable at 127.0.0.1:3306.");
}

function upsertEnv(text, key, value) {
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(text)) {
    return text.replace(new RegExp(`^${key}=.*$`, "m"), line);
  }
  return `${text.trimEnd()}\n${line}\n`;
}

function ensureEnv() {
  const fallback = existsSync(examplePath)
    ? readFileSync(examplePath, "utf8")
    : "MYSQL_HOST=127.0.0.1\nMYSQL_PORT=3306\nMYSQL_USER=root\nMYSQL_PASSWORD=\nMYSQL_DATABASE=qa-trackerdb\nAUTH_SECRET=change-me\n";
  let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : fallback;
  text = upsertEnv(text, "MYSQL_HOST", "127.0.0.1");
  text = upsertEnv(text, "MYSQL_PORT", "3306");
  text = upsertEnv(text, "MYSQL_USER", "root");
  if (!/^MYSQL_PASSWORD=/m.test(text)) {
    text = upsertEnv(text, "MYSQL_PASSWORD", "");
  }
  text = upsertEnv(text, "MYSQL_DATABASE", database);
  if (!/^AUTH_SECRET=/m.test(text)) {
    text = upsertEnv(text, "AUTH_SECRET", "change-me");
  }
  const defaults = {
    ADMIN_NAME: "Amit",
    ADMIN_EMAIL: "amit.owninfotech@gmail.com",
    ADMIN_PASSWORD: "Staff@123",
    TESTER_NAME: "Tester",
    TESTER_EMAIL: "tester.owninfotech@gmail.com",
    TESTER_PASSWORD: "Staff@123",
    FIXER_NAME: "Fixer",
    FIXER_EMAIL: "fixer.owninfotech@gmail.com",
    FIXER_PASSWORD: "Staff@123",
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (!new RegExp(`^${key}=`, "m").test(text)) {
      text = upsertEnv(text, key, value);
    }
  }
  writeFileSync(envPath, text.endsWith("\n") ? text : `${text}\n`);
}

if (!existsSync(mysqlBin)) {
  throw new Error("MySQL client not found. Start MySQL from XAMPP or set MYSQL_BIN.");
}

if (!ping()) {
  console.log("MySQL is not running on 127.0.0.1:3306. Starting XAMPP MariaDB...");
  startServer();
  waitForReady();
}

console.log("MySQL is running on 127.0.0.1:3306.");

execFileSync(
  mysqlBin,
  mysqlArgs([
    "-e",
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  ]),
  { stdio: "inherit" },
);

ensureEnv();

try {
  const dbDir = join(datadir, "qa@002dtrackerdb");
  if (existsSync(dbDir)) chmodSync(dbDir, 0o770);
} catch {
  /* directory may already be owned by mysql */
}

console.log(`DATABASE=${database}`);
