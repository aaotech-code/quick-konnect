import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { getThreadForUser, getThreadMessagesWithAttachments } from '@/server/services/messaging';
import { ChatView } from './ChatView';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const ctx = await getAuthContext();
    if (!ctx) return { title: 'Message' };
    const data = await getThreadForUser({ threadId: id, userId: ctx.userId });
    return { title: 'Chat with ' + data.counterparty.name };
  } catch {
    return { title: 'Message' };
  }
}

export default async function ThreadPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  let data;
  try {
    data = await getThreadForUser({ threadId: id, userId: ctx.userId });
  } catch {
    notFound();
  }

  const enriched = await getThreadMessagesWithAttachments(id);
  const messages = enriched.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    attachments: m.attachments,
  }));

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4 mb-4">
          <Link
            href="/messages"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            ←
          </Link>
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-bold text-white">
            {data.counterparty.avatarUrl ? (
              <Image src={data.counterparty.avatarUrl} alt={data.counterparty.name} fill sizes="40px" className="object-cover" unoptimized />
            ) : (
              data.counterparty.name.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{data.counterparty.name}</div>
            {data.counterparty.providerSlug && (
              <Link
                href={'/provider/' + data.counterparty.providerSlug}
                target="_blank"
                className="text-[11px] text-blue-300 hover:text-blue-200"
              >
                View profile ↗
              </Link>
            )}
          </div>
        </div>

        <ChatView
          threadId={id}
          currentUserId={ctx.userId}
          initialMessages={messages}
        />
      </div>
    </main>
  );
}
