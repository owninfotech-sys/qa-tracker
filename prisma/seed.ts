import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.activity.deleteMany();
  await prisma.fixTask.deleteMany();
  await prisma.runItem.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.module.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Staff@123", 10);

  await prisma.user.create({
    data: {
      name: "Amit",
      email: "amit.owninfotech@gmail.com",
      role: "ADMIN",
      password,
    },
  });

  await prisma.user.create({
    data: {
      name: "Tester",
      email: "tester.owninfotech@gmail.com",
      role: "TESTER",
      password,
    },
  });

  await prisma.user.create({
    data: {
      name: "Fixer",
      email: "fixer.owninfotech@gmail.com",
      role: "FIXER",
      password,
    },
  });

  console.log("Seeded qatracker with 3 default accounts.");
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
