import { PrismaClient } from "@prisma/client";

const CLIENT_KEY = "qaPrisma_mysqlDirect_v1";

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>;

export const prisma =
  globalForPrisma[CLIENT_KEY] ??
  new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma[CLIENT_KEY] = prisma;
}
