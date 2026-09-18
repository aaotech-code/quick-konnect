import { db } from '@/server/db/client';

export type NotificationType =
  | 'quote.received'
  | 'quote.accepted'
  | 'quote.rejected'
  | 'job.started'
  | 'job.provider_completed'
  | 'job.customer_confirmed'
  | 'job.review_received'
  | 'message.received'
  | 'provider.verification_approved'
  | 'provider.verification_rejected';

export async function notify(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  return db.notification.create({
    data: {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: (args.data ?? {}) as any,
    },
  });
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, readAt: null },
  });
}

export async function listNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
