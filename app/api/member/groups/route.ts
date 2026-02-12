// app/api/member/groups/route.ts
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
        serverLevel: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // TODO: Implement Sunday Groups in database
    // Once Sunday Groups are implemented, use this query:
    /*
    const allGroups = await prisma.sundayGroup.findMany({
      include: {
        leader: {
          select: {
            id: true,
            surname: true,
            givenName: true,
            serverLevel: true,
          },
        },
        members: {
          select: {
            id: true,
            surname: true,
            givenName: true,
            serverLevel: true,
          },
        },
      },
    });

    // Find the group that contains this member
    const myGroup = allGroups.find(group => 
      group.members.some(m => m.id === member.id)
    );

    // Get all other groups
    const otherGroups = allGroups.filter(group => 
      !group.members.some(m => m.id === member.id)
    );

    return NextResponse.json({
      myGroup: myGroup ? {
        id: myGroup.id,
        name: myGroup.name,
        leader: myGroup.leader,
        members: myGroup.members,
        isMyGroup: true,
      } : null,
      otherGroups: otherGroups.map(group => ({
        id: group.id,
        name: group.name,
        leader: group.leader,
        members: group.members,
        isMyGroup: false,
      })),
    });
    */

    // For now, return empty/placeholder until Sunday Groups are implemented
    return NextResponse.json({
      myGroup: null,
      otherGroups: [],
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}