// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notifications from database
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'ALL_MEMBERS' },
          { targetType: 'ADMINS_ONLY' },
          { targetId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    // Transform to match frontend interface
    const transformedNotifications = notifications.map(notif => ({
      id: notif.id,
      message: notif.message,
      type: notif.type.toLowerCase() as 'update' | 'change' | 'reminder',
      timestamp: notif.createdAt,
      isRead: notif.isRead,
    }));

    return NextResponse.json(transformedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}