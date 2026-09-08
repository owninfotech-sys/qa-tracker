import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { mysqlEnv } from "./mysql-env.mjs";

const accounts = [
  {
    name: process.env.ADMIN_NAME || "Amit",
    email: (process.env.ADMIN_EMAIL || "amit.owninfotech@gmail.com").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "Staff@123",
    role: "ADMIN",
  },
  {
    name: process.env.TESTER_NAME || "Tester",
    email: (process.env.TESTER_EMAIL || "tester.owninfotech@gmail.com").toLowerCase(),
    password: process.env.TESTER_PASSWORD || "Staff@123",
    role: "TESTER",
  },
  {
    name: process.env.FIXER_NAME || "Fixer",
    email: (process.env.FIXER_EMAIL || "fixer.owninfotech@gmail.com").toLowerCase(),
    password: process.env.FIXER_PASSWORD || "Staff@123",
    role: "FIXER",
  },
];

const config = mysqlEnv();
const pool = await mysql.createPool(config);

for (const account of accounts) {
  const hash = await bcrypt.hash(account.password, 10);
  const [rows] = await pool.query("SELECT id FROM qa_user WHERE email = ? LIMIT 1", [account.email]);
  if (rows.length) {
    await pool.execute("UPDATE qa_user SET name = ?, role = ?, password = ?, active = 1 WHERE email = ?", [
      account.name,
      account.role,
      hash,
      account.email,
    ]);
    continue;
  }
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  await pool.execute(
    "INSERT INTO qa_user (id, name, email, password, role, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, NOW(3))",
    [id, account.name, account.email, hash, account.role],
  );
}

await pool.end();

console.log(`Default accounts are ready in ${config.database}.`);
for (const account of accounts) {
  console.log(`${account.role}  ${account.email}`);
}
