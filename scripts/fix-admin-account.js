// Create: scripts/fix-admin-account.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdminAccount() {
  const adminEmail = "YOUR_EMAIL_HERE"; // Replace with your admin email
  const plainPassword = "YOUR_PASSWORD_HERE"; // Replace with your desired password
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    
    // Update your admin account
    const updatedAdmin = await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        hashedPassword: hashedPassword,
        isActive: true,
        role: 'ADMIN',
      },
      create: {
        email: adminEmail,
        name: "Admin User", // Change this to your name
        hashedPassword: hashedPassword,
        isActive: true,
        role: 'ADMIN',
        adminId: 'ADM-001',
        permissions: ['manage_members', 'manage_events', 'manage_finances', 'manage_attendance', 'view_reports'],
      },
    });
    
    console.log("✅ Admin account updated successfully!");
    console.log("Email:", updatedAdmin.email);
    console.log("Password: [Your password]");
    console.log("Ready to login!");
    
  } catch (error) {
    console.error("❌ Error updating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccount();