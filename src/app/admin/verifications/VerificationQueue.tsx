'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { approveVerification, rejectVerification } from './actions';

type Item = {
  id: string;
  type: string;
  detail: string;
  submittedAt: string;
  providerName: string;
  providerSlug: string;
  providerEmail: string;
  avatarUrl: string | null;
  idPhotoUrl: string | null;
  selfiePhotoUrl: string | null;
};

export function VerificationQueue(props: { items: Item[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const router = useRouter();

  function approve(id: string) {
    setBusy(id); setError(null);
    startTransition(async () => {
      const res = await approveVerification(id);
      setBusy(null);
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      router.refresh();
    });
  }

  function reject(id: string) {
    if (!reason.trim()) { setError('Provide a reason for rejection.'); return; }
    setBusy(id); setError(null);
    startTransition(async () => {
      const res = await rejectVerification(id, reason.trim());
      setBusy(null);
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      setRejecting(null);
      setReason('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {props.items.map((it) => {
        const hasPhotos = Boolean(it.idPhotoUrl && it.selfiePhotoUrl);
        return (
          <div key={it.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-bold text-white">
                  {it.avatarUrl ? (
                    <Image src={it.avatarUrl} alt={it.providerName} fill sizes="44px" className="object-cover" unoptimized />
                  ) : (
                    it.providerName.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={'/provider/' + it.providerSlug}
                      target="_blank"
                      className="font-medium hover:text-blue-300"
                    >
                      {it.providerName}
                    </Link>
                    <span className="rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                      {it.type}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">
                    {it.providerEmail} · Submitted {new Date(it.submittedAt).toLocaleString()}
                  </div>

                  {/* Photo comparison for identity checks */}
                  {hasPhotos && (
                    <div className="mt-4">
                      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Identity check — compare the ID photo against the selfie
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 text-[10px] text-white/50">ID photo</div>
                          <a href={it.idPhotoUrl!} target="_blank" rel="noreferrer" className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={it.idPhotoUrl!}
                              alt="ID"
                              className="max-h-64 w-full rounded-lg border border-white/10 bg-black/30 object-contain"
                            />
                          </a>
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] text-white/50">Selfie holding ID</div>
                          <a href={it.selfiePhotoUrl!} target="_blank" rel="noreferrer" className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={it.selfiePhotoUrl!}
                              alt="Selfie"
                              className="max-h-64 w-full rounded-lg border border-white/10 bg-black/30 object-contain"
                            />
                          </a>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/50">
                        {it.avatarUrl ? (
                          <>
                            <span>Profile photo on file:</span>
                            <span className="relative inline-flex h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={it.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-200">
                            ⚠ No profile photo set. Ask the provider to upload one before approving.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Details / notes */}
                  <div className="mt-3 rounded-lg border border-white/[0.06] bg-black/20 p-3 text-xs text-white/80">
                    <span className="text-white/40">Details: </span>
                    {it.detail || <span className="italic text-white/40">— none —</span>}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  disabled={busy === it.id}
                  onClick={() => approve(it.id)}
                  className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#04100b] transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {busy === it.id ? '…' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={busy === it.id}
                  onClick={() => setRejecting(rejecting === it.id ? null : it.id)}
                  className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-xs font-medium text-red-200 transition hover:bg-red-400/20"
                >
                  Reject
                </button>
              </div>
            </div>

            {rejecting === it.id && (
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Reason for rejection
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. ID photo unreadable, please resubmit"
                  maxLength={200}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => reject(it.id)}
                  disabled={busy === it.id}
                  className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  Confirm rejection
                </button>
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
