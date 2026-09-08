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

function ensureEnv() {
  const fallback = existsSync(examplePath)
    ? readFileSync(examplePath, "utf8")
    : 'DATABASE_URL="mysql://root@127.0.0.1:3306/qa-trackerdb"\nAUTH_SECRET="change-me"\n';
  let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : fallback;
  if (!/^DATABASE_URL=/m.test(text)) {
    text = `DATABASE_URL="mysql://root@127.0.0.1:3306/qa-trackerdb"\n${text}`;
  }
  text = text.replace(
    /^DATABASE_URL=.*$/m,
    'DATABASE_URL="mysql://root@127.0.0.1:3306/qa-trackerdb"',
  );
  if (!/^AUTH_SECRET=/m.test(text)) {
    text += `\nAUTH_SECRET="change-me"\n`;
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
