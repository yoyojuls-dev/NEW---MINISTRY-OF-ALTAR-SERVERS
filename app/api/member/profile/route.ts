// app/api/member/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the member by email
    const member = await prisma.member.findFirst({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        surname: true,
        givenName: true,
        email: true,
        contactNumber: true,
        birthdate: true,
        memberStatus: true,
        serverLevel: true,
        dateJoined: true,
        image: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Format the full name
    const fullName = `${member.givenName} ${member.surname}`;

    return NextResponse.json({
      id: member.id,
      fullName,
      surname: member.surname,
      givenName: member.givenName,
      email: member.email,
      contactNumber: member.contactNumber,
      birthdate: member.birthdate,
      memberStatus: member.memberStatus,
      serverLevel: member.serverLevel,
      dateJoined: member.dateJoined,
      image: member.image,
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}   