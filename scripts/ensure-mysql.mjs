import { execFileSync, spawn } from "node:child_process";
import { chmodSync, existsSync, unlinkSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const basedir = "/Applications/XAMPP/xamppfiles";
const mysqlBin = existsSync("/Applications/XAMPP/bin/mysql")
  ? "/Applications/XAMPP/bin/mysql"
  : `${basedir}/bin/mysql`;
const mysqldSafe = `${basedir}/bin/mysqld_safe`;
const datadir = `${basedir}/var/mysql`;
const socket = `${datadir}/mysql.sock`;
const pidFile = `${datadir}/${hostname()}.pid`;

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

function query(sql) {
  return execFileSync(mysqlBin, mysqlArgs(["-N", "-e", sql]), {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

if (!ping()) {
  console.log("MySQL is not running on 127.0.0.1:3306. Starting XAMPP MariaDB...");
  startServer();
  waitForReady();
  console.log("MySQL is listening on 127.0.0.1:3306.");
} else {
  console.log("MySQL is already running on 127.0.0.1:3306.");
}

const preferred = "qa-trackerdb";
const fallback = "qatracker";
let database = fallback;

try {
  query(`USE \`${preferred}\`; SHOW TABLES;`);
  database = preferred;
  console.log(`Using existing database ${preferred}.`);
} catch {
  execFileSync(
    mysqlBin,
    mysqlArgs([
      "-e",
      `CREATE DATABASE IF NOT EXISTS \`${fallback}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    ]),
    { stdio: "inherit" },
  );
  console.log(`${preferred} is not readable from this MySQL process. Using ${fallback}.`);
}

console.log(`DATABASE=${database}`);

try {
  const dbDir = join(datadir, database === "qa-trackerdb" ? "qa@002dtrackerdb" : database);
  if (existsSync(dbDir)) {
    chmodSync(dbDir, 0o770);
  }
} catch {
  /* directory may already be owned by mysql */
}
