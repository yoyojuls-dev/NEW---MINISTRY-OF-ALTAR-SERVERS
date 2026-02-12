// lib/notifications.ts
import { prisma } from './prisma';
import { NotificationType, TargetType, Priority } from '@prisma/client';

interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  targetType?: TargetType;
  targetId?: string;
  priority?: Priority;
  scheduledFor?: Date;
}

/**
 * Create a notification in the database
 */
export async function createNotification({
  title,
  message,
  type,
  targetType = 'ALL_MEMBERS',
  targetId,
  priority = 'NORMAL',
  scheduledFor,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        targetType,
        targetId,
        priority,
        scheduledFor,
        sentAt: scheduledFor ? undefined : new Date(),
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create birthday notification for a member
 */
export async function createBirthdayNotification(memberId: string, memberName: string) {
  return createNotification({
    title: 'Birthday Reminder',
    message: `Birthday of ${memberName}`,
    type: 'BIRTHDAY',
    targetType: 'ALL_MEMBERS',
    priority: 'NORMAL',
  });
}

/**
 * Create event reminder notification
 */
export async function createEventReminder(eventTitle: string, eventDate: string, eventTime: string) {
  return createNotification({
    title: 'Event Reminder',
    message: `${eventTitle} on ${eventDate} at ${eventTime}`,
    type: 'EVENT_REMINDER',
    targetType: 'ALL_MEMBERS',
    priority: 'HIGH',
  });
}

/**
 * Create dues reminder notification
 */
export async function createDuesReminder(memberId: string, amount: number) {
  return createNotification({
    title: 'Dues Reminder',
    message: `You have pending dues of ₱${amount.toFixed(2)}`,
    type: 'DUES_REMINDER',
    targetType: 'SPECIFIC_MEMBER',
    targetId: memberId,
    priority: 'NORMAL',
  });
}

/**
 * Create announcement notification
 */
export async function createAnnouncement(title: string, message: string, priority: Priority = 'NORMAL') {
  return createNotification({
    title,
    message,
    type: 'ANNOUNCEMENT',
    targetType: 'ALL_MEMBERS',
    priority,
  });
}

/**
 * Create schedule change notification
 */
export async function createScheduleChange(title: string, message: string) {
  return createNotification({
    title,
    message,
    type: 'SCHEDULE_CHANGE',
    targetType: 'ALL_MEMBERS',
    priority: 'HIGH',
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId?: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        isRead: false,
        OR: userId
          ? [
              { targetType: 'ALL_MEMBERS' },
              { targetType: 'ADMINS_ONLY' },
              { targetId: userId },
            ]
          : [{ targetType: 'ALL_MEMBERS' }, { targetType: 'ADMINS_ONLY' }],
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}