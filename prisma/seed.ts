import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const accounts = [
  { name: "Amit", email: "amit.owninfotech@gmail.com", role: "ADMIN" },
  { name: "Tester", email: "tester.owninfotech@gmail.com", role: "TESTER" },
  { name: "Fixer", email: "fixer.owninfotech@gmail.com", role: "FIXER" },
];

async function main() {
  const password = await bcrypt.hash("Staff@123", 10);

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, active: true },
      create: { ...account, password },
    });
  }

  console.log("MySQL users are ready in qa-trackerdb.");
  console.log("Admin  amit.owninfotech@gmail.com  Staff@123");
  console.log("Tester tester.owninfotech@gmail.com  Staff@123");
  console.log("Fixer  fixer.owninfotech@gmail.com  Staff@123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
