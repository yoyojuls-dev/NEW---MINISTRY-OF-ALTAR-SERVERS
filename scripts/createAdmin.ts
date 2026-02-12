import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.INITIAL_ADMIN_PASSWORD || "Admin123456!";
  const name = "System Administrator";

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("Admin already exists!");
    return;
  }

  // Create admin
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("\n⚠️  IMPORTANT: Change this password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });