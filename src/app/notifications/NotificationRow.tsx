'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { markReadAction } from './actions';

export function NotificationRow(props: {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
}) {
  const [read, setRead] = useState(props.isRead);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!read) {
      setRead(true);
      startTransition(async () => {
        await markReadAction(props.id);
      });
    }
    if (props.href) {
      router.push(props.href);
    }
  }

  const icon = pickIcon(props.type);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ' +
        (read
          ? 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.04]'
          : 'border-blue-400/25 bg-blue-400/[0.05] hover:bg-blue-400/[0.09]')
      }
    >
      <span
        className={
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ' +
          (read ? 'bg-white/[0.04] text-white/40' : 'bg-blue-400/15 text-blue-200')
        }
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className={'truncate text-sm font-medium ' + (read ? 'text-white/75' : 'text-white')}>
            {props.title}
          </div>
          {!read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />}
        </div>
        <div className="mt-0.5 line-clamp-2 text-xs text-white/50">{props.body}</div>
        <div className="mt-1.5 text-[11px] text-white/35">{formatRelative(props.createdAt)}</div>
      </div>
    </button>
  );
}

function pickIcon(type: string): string {
  if (type.startsWith('quote.')) return '📋';
  if (type.startsWith('job.')) return '🛠️';
  if (type === 'message.received') return '💬';
  if (type.startsWith('provider.verification')) return '✓';
  return '🔔';
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
  return d.toLocaleDateString();
}
