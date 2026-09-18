'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startThreadWithProvider } from '@/app/messages/actions';

export function MessageButton(props: { providerId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function open() {
    setError(null);
    startTransition(async () => {
      const res = await startThreadWithProvider(props.providerId);
      if (!res.ok) {
        setError(res.error ?? 'Could not open conversation.');
        return;
      }
      router.push('/messages/' + res.threadId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:opacity-50"
      >
        {pending ? 'Opening…' : 'Message provider'}
      </button>
      {error && (
        <p className="mt-2 text-center text-[11px] text-red-300">{error}</p>
      )}
    </>
  );
}
