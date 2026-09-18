import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { listNotifications } from '@/server/services/notifications';
import { Navbar } from '@/components/marketplace/Navbar';
import { NotificationRow } from './NotificationRow';
import { MarkAllReadButton } from './MarkAllReadButton';

export const metadata = { title: 'Notifications — Quick-Konnect' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const notifications = await listNotifications(ctx.userId);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">Notifications</h1>
            <p className="mt-1 text-sm text-white/50">
              {notifications.length === 0
                ? 'No notifications yet.'
                : unread > 0
                ? unread + ' unread of ' + notifications.length
                : notifications.length + ' total — all read'}
            </p>
          </div>
          {unread > 0 && <MarkAllReadButton />}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-4xl">🔔</div>
            <div className="font-medium text-white">Nothing here yet</div>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
              When something happens on your account — a new quote, a job update, a message — you will see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                id={n.id}
                type={n.type}
                title={n.title}
                body={n.body}
                href={(n.data as any)?.href ?? null}
                isRead={Boolean(n.readAt)}
                createdAt={n.createdAt.toISOString()}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
