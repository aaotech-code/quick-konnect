'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveDisputeAction } from './actions';

type Item = {
  id: string;
  jobRef: string;
  jobTitle: string;
  categoryName: string;
  providerName: string;
  providerEmail: string;
  reasonCode: string;
  description: string;
  requestedResolution: string;
  openedAt: string;
  openedBy: 'customer' | 'provider';
};

export function DisputeQueue(props: { items: Item[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [resolving, setResolving] = useState<string | null>(null);
  const [decision, setDecision] = useState<'favor_provider' | 'favor_customer' | 'cancelled'>('favor_provider');
  const [resolution, setResolution] = useState('');
  const router = useRouter();

  function openResolve(id: string) {
    setResolving(id);
    setDecision('favor_provider');
    setResolution('');
    setError(null);
  }

  function submit(id: string) {
    if (resolution.trim().length < 10) {
      setError('Resolution must be at least 10 characters.');
      return;
    }
    setBusy(id);
    setError(null);
    startTransition(async () => {
      const res = await resolveDisputeAction({ disputeId: id, decision, resolution: resolution.trim() });
      setBusy(null);
      if (!res.ok) {
        setError(res.error ?? 'Failed.');
        return;
      }
      setResolving(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {props.items.map((it) => (
        <div key={it.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={'/jobs/' + it.jobRef} target="_blank" className="font-mono text-[11px] text-white/70 hover:text-white">
                  {it.jobRef}
                </Link>
                <span className="rounded-md border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-200">
                  {it.openedBy === 'customer' ? 'Customer dispute' : 'Provider dispute'}
                </span>
              </div>
              <div className="mt-2 text-base font-medium text-white">{it.jobTitle}</div>
              <div className="mt-1 text-xs text-white/45">
                {it.categoryName} · Provider: {it.providerName} ({it.providerEmail})
              </div>
              <div className="mt-1 text-[11px] text-white/35">
                Opened {new Date(it.openedAt).toLocaleString()}
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => openResolve(it.id)}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50"
              >
                Resolve
              </button>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-xs">
            <div>
              <dt className="text-white/40">Reason category</dt>
              <dd className="mt-0.5 font-mono text-white/80">{it.reasonCode}</dd>
            </div>
            <div>
              <dt className="text-white/40">Requested outcome</dt>
              <dd className="mt-0.5 font-mono text-white/80">{it.requestedResolution}</dd>
            </div>
            <div>
              <dt className="text-white/40">What happened</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-6 text-white/80">{it.description}</dd>
            </div>
          </dl>

          {resolving === it.id && (
            <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Decision</label>
                <div className="flex flex-wrap gap-2">
                  {(['favor_provider', 'favor_customer', 'cancelled'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDecision(d)}
                      className={
                        'rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ' +
                        (decision === d
                          ? 'border-blue-400/40 bg-blue-400/10 text-blue-100'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white')
                      }
                    >
                      {d === 'favor_provider' ? 'Favour provider' : d === 'favor_customer' ? 'Favour customer' : 'Cancel job'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  Written resolution <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="What did you decide and why? Both parties will see this."
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-xs leading-6 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              {error && (
                <div className="rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === it.id}
                  onClick={() => submit(it.id)}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {busy === it.id ? 'Saving…' : 'Save resolution'}
                </button>
                <button
                  type="button"
                  onClick={() => setResolving(null)}
                  disabled={busy === it.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
