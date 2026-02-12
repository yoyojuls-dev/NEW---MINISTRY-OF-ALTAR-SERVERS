// app/api/notifications/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isRead } = await request.json();
    const notificationId = params.id;

    // Update notification in database
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });

    return NextResponse.json({ 
      success: true,
      id: notification.id,
      isRead: notification.isRead,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}