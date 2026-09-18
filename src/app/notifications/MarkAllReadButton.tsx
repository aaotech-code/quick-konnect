'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { markAllReadAction } from './actions';

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await markAllReadAction();
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
      >
        {pending ? 'Marking…' : 'Mark all as read'}
      </button>
      {error && (
        <span className="text-[11px] text-red-300">{error}</span>
      )}
    </>
  );
}
