import mysql from "mysql2/promise";

type MysqlConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function fromDatabaseUrl(url: string): MysqlConfig {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "127.0.0.1",
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "qa-trackerdb",
  };
}

export function mysqlConfig(): MysqlConfig {
  if (process.env.MYSQL_HOST || process.env.MYSQL_DATABASE || process.env.MYSQL_USER) {
    return {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
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
    port: 3306,
    user: "root",
    password: "",
    database: "qa-trackerdb",
  };
}

const globalForMysql = globalThis as unknown as { qaMysqlPool?: mysql.Pool };

export const pool =
  globalForMysql.qaMysqlPool ??
  mysql.createPool({
    ...mysqlConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
    timezone: "Z",
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.qaMysqlPool = pool;
}

export function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function asBool(value: unknown) {
  return value === true || value === 1 || value === "1";
}

export function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type SqlValue = string | number | boolean | Date | Buffer | null | undefined;

export async function query<T>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params as SqlValue[]);
  return rows as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []) {
  const [result] = await pool.query(sql, params as SqlValue[]);
  return result;
}

export async function withTransaction<T>(work: (conn: mysql.PoolConnection) => Promise<T>) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const value = await work(conn);
    await conn.commit();
    return value;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
