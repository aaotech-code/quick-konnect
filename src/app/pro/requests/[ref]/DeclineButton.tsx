'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { declineRequestAction } from '../actions';

export function DeclineButton(props: { publicRef: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await declineRequestAction({
        publicRef: props.publicRef,
        reason: reason.trim() || null,
      });
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      router.push('/pro/requests');
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white"
      >
        Decline this request
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional, seen by admin only)"
        maxLength={200}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="flex-1 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? 'Declining…' : 'Confirm decline'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 transition hover:bg-white/[0.06] hover:text-white"
        >
          Cancel
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
