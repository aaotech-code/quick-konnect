'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptQuoteAction } from './actions';

export function AcceptButton(props: {
  requestRef: string;
  quoteId: string;
  providerName: string;
  amountFormatted: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function accept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptQuoteAction(props.requestRef, props.quoteId);
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      router.push('/jobs/' + res.jobRef);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
      >
        Accept this quote
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] p-3 space-y-3">
      <div className="text-xs leading-relaxed text-emerald-100/90">
        Accept <strong className="text-emerald-100">{props.providerName}</strong>&apos;s quote of{' '}
        <strong className="text-emerald-100">{props.amountFormatted}</strong>? This creates a job and
        closes the request. Other quotes are automatically declined.
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={accept}
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? 'Creating job…' : 'Confirm — create job'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.1] hover:text-white"
        >
          Cancel
        </button>
      </div>
      {error && (
        <div className="rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
