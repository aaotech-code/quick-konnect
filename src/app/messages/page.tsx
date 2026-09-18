import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { listThreadsForUser } from '@/server/services/messaging';

export const metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default async function MessagesInboxPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const threads = await listThreadsForUser(ctx.userId);

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-white/50">
            {threads.length === 0
              ? 'No conversations yet.'
              : threads.length + ' conversation' + (threads.length === 1 ? '' : 's')}
          </p>
        </div>

        {threads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-4xl">💬</div>
            <div className="font-medium text-white">No conversations yet</div>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
              When you message a provider from their profile, the conversation appears here.
            </p>
            <Link
              href="/services"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
            >
              Browse services
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            {threads.map((t, idx) => (
              <Link
                key={t.id}
                href={'/messages/' + t.id}
                className={
                  'flex items-center gap-4 p-4 transition hover:bg-white/[0.04] ' +
                  (idx > 0 ? 'border-t border-white/[0.06]' : '')
                }
              >
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white">
                  {t.counterpartyAvatar ? (
                    <Image
                      src={t.counterpartyAvatar}
                      alt={t.counterpartyName}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    t.counterpartyName.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="truncate text-sm font-medium text-white">
                      {t.counterpartyName}
                    </div>
                    <div className="shrink-0 text-[11px] text-white/40">
                      {formatRelative(t.lastMessageAt)}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {t.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    )}
                    <div
                      className={
                        'truncate text-xs ' +
                        (t.unread ? 'text-white/80' : 'text-white/40')
                      }
                    >
                      {t.lastMessageBody ?? 'No messages yet'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatRelative(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd';
  return date.toLocaleDateString();
}
