import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(rootDir, ".env");

try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  }
} catch {
  /* .env is optional */
}

function fromDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "127.0.0.1",
    port: parsed.port || "3306",
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "qa-trackerdb",
  };
}

export function mysqlEnv() {
  if (process.env.MYSQL_HOST || process.env.MYSQL_DATABASE || process.env.MYSQL_USER) {
    return {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: process.env.MYSQL_PORT || "3306",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "qa-trackerdb",
    };
  }
  if (process.env.DATABASE_URL) {
    return fromDatabaseUrl(process.env.DATABASE_URL);
  }
  return {
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "",
    database: "qa-trackerdb",
  };
}

export function mysqlBin() {
  return [
    process.env.MYSQL_BIN,
    "/Applications/XAMPP/bin/mysql",
    "/Applications/XAMPP/xamppfiles/bin/mysql",
  ].find((bin) => bin && existsSync(bin)) || "mysql";
}

export { rootDir };
