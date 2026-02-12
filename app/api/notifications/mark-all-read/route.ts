// app/api/notifications/mark-all-read/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update all unread notifications for this user
    await prisma.notification.updateMany({
      where: { 
        isRead: false,
        OR: [
          { targetType: 'ALL_MEMBERS' },
          { targetType: 'ADMINS_ONLY' },
          { targetId: session.user.id },
        ],
      },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}