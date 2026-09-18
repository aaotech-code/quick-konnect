import { NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth/session';
import { getUnreadNotificationsCount, listNotifications } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ unread: 0, latest: [] }, { status: 200 });
  }

  const [unread, latest] = await Promise.all([
    getUnreadNotificationsCount(ctx.userId),
    listNotifications(ctx.userId, 5),
  ]);

  return NextResponse.json({
    unread,
    latest: latest
      .filter((n) => !n.readAt)
      .map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        href: (n.data as any)?.href ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
  });
}
