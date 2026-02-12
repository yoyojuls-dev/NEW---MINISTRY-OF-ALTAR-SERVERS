// app/api/members/[id]/route.ts - DELETE API route for removing members
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🗑️ Member deletion API called");
  
  try {
    const { id } = params;
    console.log("📝 Member ID to delete:", id);

    if (!id) {
      console.log("❌ No member ID provided");
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking if member exists...");
    
    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        memberId: true,
      }
    });

    if (!existingMember) {
      console.log("❌ Member not found");
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    console.log("✅ Member found:", existingMember.name);
    console.log("🗑️ Deleting member from database...");

    // Delete the member (this will also delete related records due to cascade)
    await prisma.member.delete({
      where: { id }
    });

    console.log("✅ Member deleted successfully:", existingMember.name);

    return NextResponse.json(
      {
        message: "Member deleted successfully",
        deletedMember: {
          id: existingMember.id,
          name: existingMember.name,
          memberId: existingMember.memberId,
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Member deletion error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.slice(0, 500)
    });
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
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

// Optional: Add GET method for fetching individual member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log("📋 Fetching member by ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        birthdate: true,
        address: true,
        parentContact: true,
        dateJoined: true,
        memberStatus: true,
        serverLevel: true,
        createdAt: true,
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Calculate display values
    const calculateAge = (birthday: Date): number => {
      const today = new Date();
      let age = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
      }
      return age;
    };

    const calculateYearsOfService = (dateOfInvestiture: Date): number => {
      const today = new Date();
      let years = today.getFullYear() - dateOfInvestiture.getFullYear();
      const monthDiff = today.getMonth() - dateOfInvestiture.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfInvestiture.getDate())) {
        years--;
      }
      return Math.max(0, years);
    };

    const age = calculateAge(new Date(member.birthdate));
    const yearsOfService = calculateYearsOfService(new Date(member.dateJoined));
    
    const displayServiceLevel = 
      member.serverLevel === 'JUNIOR' ? 'Neophyte' :
      member.serverLevel === 'SENIOR' ? 'Junior' : 'Senior Server';

    const memberWithCalculations = {
      ...member,
      age,
      yearsOfService,
      serviceLevel: displayServiceLevel,
    };

    console.log("✅ Member found:", member.name);

    return NextResponse.json({
      member: memberWithCalculations
    });

  } catch (error: any) {
    console.error("❌ Error fetching member:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}