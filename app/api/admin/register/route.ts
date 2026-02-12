// app/api/admin/register/route.ts - Working version with direct Prisma import
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create Prisma client instance
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log("🚀 Admin registration API called");
  
  try {
    console.log("📝 Parsing request body...");
    const body = await request.json();
    console.log("✅ Body parsed successfully:", { ...body, password: '[HIDDEN]' });
    
    const { name, email, password, position, contactNumber } = body;

    // Basic validation
    console.log("🔍 Validating input...");
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log("❌ Password too short");
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed");

    console.log("🔍 Checking for existing admin...");
    
    // Check if admin with this email already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingAdmin) {
      console.log("❌ Admin already exists");
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 }
      );
    }

    console.log("🔐 Hashing password...");
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("✅ Password hashed successfully");

    console.log("🔢 Generating admin ID...");
    
    // Generate admin ID
    const adminCount = await prisma.adminUser.count();
    const adminId = `ADM-${String(adminCount + 1).padStart(3, '0')}`;
    console.log("✅ Admin ID generated:", adminId);
    
    console.log("📝 Creating admin user in database...");

    // Create admin user
    const adminUser = await prisma.adminUser.create({
      data: {
        adminId,
        name,
        email: email.toLowerCase(),
        hashedPassword,
        position: position || "Ministry Administrator",
        contactNumber,
        isActive: true,
        role: "ADMIN",
        permissions: [
          "manage_members",
          "manage_events", 
          "manage_finances",
          "manage_attendance",
          "view_reports",
          "manage_settings"
        ],
      },
      select: {
        id: true,
        adminId: true,
        name: true,
        email: true,
        position: true,
        isActive: true,
        createdAt: true,
      }
    });

    console.log("✅ Admin created successfully:", adminUser.email);

    return NextResponse.json(
      {
        message: "Admin account created successfully",
        admin: adminUser
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ Admin registration error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.slice(0, 500)
    });
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Handle database connection errors
    if (error.message?.includes('connect')) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}