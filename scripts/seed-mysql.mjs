import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { mysqlEnv } from "./mysql-env.mjs";

const accounts = [
  { name: "Amit", email: "amit.owninfotech@gmail.com", role: "ADMIN" },
  { name: "Tester", email: "tester.owninfotech@gmail.com", role: "TESTER" },
  { name: "Fixer", email: "fixer.owninfotech@gmail.com", role: "FIXER" },
];

const config = mysqlEnv();
const pool = await mysql.createPool(config);
const password = await bcrypt.hash("Staff@123", 10);

for (const account of accounts) {
  const [rows] = await pool.query("SELECT id FROM qa_user WHERE email = ? LIMIT 1", [account.email]);
  if (rows.length) {
    await pool.execute("UPDATE qa_user SET name = ?, role = ?, active = 1 WHERE email = ?", [
      account.name,
      account.role,
      account.email,
    ]);
    continue;
  }
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  await pool.execute(
    "INSERT INTO qa_user (id, name, email, password, role, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, NOW(3))",
    [id, account.name, account.email, password, account.role],
  );
}

await pool.end();

console.log(`MySQL users are ready in ${config.database}.`);
console.log("Admin  amit.owninfotech@gmail.com  Staff@123");
console.log("Tester tester.owninfotech@gmail.com  Staff@123");
console.log("Fixer  fixer.owninfotech@gmail.com  Staff@123");
