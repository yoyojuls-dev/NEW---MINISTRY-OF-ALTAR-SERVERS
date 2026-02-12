// app/api/birthdays/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface BirthdayPerson {
  id: string;
  name: string;
  birthday: string;
  age: number;
  userType: 'Admin' | 'Member';
  position?: string;
  serviceLevel?: string;
}

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

    // Fetch all active members
    const members = await prisma.member.findMany({
      where: {
        memberStatus: 'ACTIVE',
      },
      select: {
        id: true,
        surname: true,
        givenName: true,
        birthdate: true,
        serverLevel: true,
      },
    });

    // Fetch all active admin users
    const admins = await prisma.adminUser.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        birthdate: true,
        position: true,
      },
    });

    // Calculate age function
    const calculateAge = (birthDate: Date): number => {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Transform members data
    const memberBirthdays: BirthdayPerson[] = members
      .filter(member => member.birthdate !== null && member.birthdate !== undefined)
      .map((member) => ({
        id: `member-${member.id}`,
        name: `${member.givenName} ${member.surname}`,
        birthday: new Date(member.birthdate!).toISOString(),
        age: calculateAge(new Date(member.birthdate!)),
        userType: 'Member',
        serviceLevel: member.serverLevel || undefined,
      }));

    // Transform admins data
    const adminBirthdays: BirthdayPerson[] = admins
      .filter(admin => admin.birthdate !== null && admin.birthdate !== undefined)
      .map((admin) => ({
        id: `admin-${admin.id}`,
        name: admin.name,
        birthday: new Date(admin.birthdate!).toISOString(),
        age: calculateAge(new Date(admin.birthdate!)),
        userType: 'Admin',
        position: admin.position || undefined,
      }));

    // Combine and sort by month and date
    const allBirthdays = [...memberBirthdays, ...adminBirthdays].sort((a, b) => {
      const aDate = new Date(a.birthday);
      const bDate = new Date(b.birthday);
      const aMonth = aDate.getMonth();
      const bMonth = bDate.getMonth();
      const aDay = aDate.getDate();
      const bDay = bDate.getDate();

      if (aMonth !== bMonth) return aMonth - bMonth;
      return aDay - bDay;
    });

    return NextResponse.json(allBirthdays, { status: 200 });
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch birthdays', details: String(error) },
      { status: 500 }
    );
  }
}
