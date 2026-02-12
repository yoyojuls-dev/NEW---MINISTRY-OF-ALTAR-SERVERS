// app/api/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

// GET - Fetch members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as any).userType === 'ADMIN' || (session.user as any).role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let where = {};
    if (status) {
      where = { memberStatus: status };
    }

    const members = await prisma.member.findMany({
      where,
      select: {
        id: true,
        surname: true,
        givenName: true,
        email: true,
        birthdate: true,
        address: true,
        parentContact: true,
        dateJoined: true,
        memberStatus: true,
        serverLevel: true,
        createdAt: true,
      },
      orderBy: {
        surname: 'asc',
      },
    });

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST - Create new member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as any).userType === 'ADMIN' || (session.user as any).role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      surname,
      givenName,
      birthday,
      address,
      parentContact,
      dateOfInvestiture,
      username,
      password,
      email,
    } = body;

    // Validate required fields
    if (!surname || !givenName || !birthday || !address || !parentContact || !dateOfInvestiture || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Calculate service level based on dateOfInvestiture
    const today = new Date();
    const investitureDate = new Date(dateOfInvestiture);
    let yearsOfService = today.getFullYear() - investitureDate.getFullYear();
    const monthDiff = today.getMonth() - investitureDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < investitureDate.getDate())) {
      yearsOfService--;
    }
    yearsOfService = Math.max(0, yearsOfService);

    // Database enum: JUNIOR, SENIOR, MASTER
    // Display: NEOPHYTE (1-2 years), JUNIOR (3-4 years), SENIOR (5+ years)
    let serverLevel: 'JUNIOR' | 'SENIOR' | 'MASTER' = 'JUNIOR';
    
    if (yearsOfService >= 1 && yearsOfService <= 2) {
      serverLevel = 'JUNIOR';  // Display as NEOPHYTE
    } else if (yearsOfService >= 3 && yearsOfService <= 4) {
      serverLevel = 'SENIOR';  // Display as JUNIOR
    } else if (yearsOfService >= 5) {
      serverLevel = 'MASTER';  // Display as SENIOR
    } else {
      serverLevel = 'JUNIOR';  // 0 years defaults to NEOPHYTE
    }

    // Get admin user ID
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Create member
    const member = await prisma.member.create({
      data: {
        surname,
        givenName,
        birthdate: new Date(birthday),
        email: email || `${username}@ministry.local`,
        hashedPassword,
        address,
        parentContact,
        dateJoined: new Date(dateOfInvestiture),
        memberStatus: 'ACTIVE',
        serverLevel,
        trainedFor: [],
        createdByUserId: adminUser.id,
      },
    });

    return NextResponse.json(
      { 
        message: 'Member created successfully',
        member: {
          id: member.id,
          surname: member.surname,
          givenName: member.givenName,
          email: member.email,
          serviceLevel: serverLevel,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating member:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}