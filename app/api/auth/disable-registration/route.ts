/* app/api/auth/disable-registration/route.ts */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // This is a simple approach - you could also use environment variables
    // or a settings table in your database
    
    // Check if admin exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (adminExists) {
      return NextResponse.json({
        message: 'Registration is now disabled',
        disabled: true,
      });
    }

    return NextResponse.json({
      message: 'No admin account found',
      disabled: false,
    });
  } catch (error) {
    console.error('Disable registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}