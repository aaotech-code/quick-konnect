'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitVerification } from './actions';
import { IdentityUploadForm } from './IdentityUploadForm';

type VerificationType = 'phone' | 'identity' | 'address' | 'business' | 'reference';

type VerificationRow = {
  id: string;
  type: string;
  status: string;
  submittedAt: Date | string;
  reviewedAt: Date | string | null;
  notes: string | null;
};

const CHECKS: {
  type: VerificationType;
  label: string;
  icon: string;
  description: string;
  placeholder: string;
}[] = [
  {
    type: 'phone',
    label: 'Phone verification',
    icon: '📱',
    description: 'We send a code to your phone. Fastest check to complete.',
    placeholder: 'Your phone number (e.g. +2348012345678)',
  },
  {
    type: 'identity',
    label: 'Identity verification',
    icon: '🪪',
    description: 'Upload a photo of your government-issued ID (NIN, driver\'s licence, passport).',
    placeholder: 'ID type (e.g. NIN, Driver\'s licence)',
  },
  {
    type: 'business',
    label: 'Business verification',
    icon: '🏢',
    description: 'If you have a registered business, provide the CAC registration number.',
    placeholder: 'CAC RC number or business name',
  },
  {
    type: 'address',
    label: 'Address verification',
    icon: '🏠',
    description: 'Upload a recent utility bill or proof of address.',
    placeholder: 'Address you want verified',
  },
  {
    type: 'reference',
    label: 'Reference',
    icon: '👥',
    description: 'Provide a reference — a previous customer or colleague we can contact.',
    placeholder: 'Name and phone number of reference',
  },
];

const STATUS_STYLE: Record<string, string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  approved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  rejected: 'border-red-400/30 bg-red-400/10 text-red-200',
  expired: 'border-white/10 bg-white/[0.05] text-white/60',
};

export function VerificationPanel(props: {
  latestByType: Record<string, VerificationRow>;
}) {
  const [openType, setOpenType] = useState<VerificationType | null>(null);
  const [detail, setDetail] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  function submit(type: VerificationType) {
    setError(null); setOk(null);
    if (!detail.trim() || detail.trim().length < 4) {
      setError('Please provide the required information.');
      return;
    }
    startTransition(async () => {
      const res = await submitVerification({ type, detail: detail.trim() });
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      setOk('Submitted. Our team will review it.');
      setDetail('');
      setOpenType(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {CHECKS.map((c) => {
        const latest = props.latestByType[c.type];
        const isOpen = openType === c.type;
        return (
          <div
            key={c.type}
            className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"
          >
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex gap-3">
                <span className="text-xl leading-none">{c.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{c.label}</div>
                    {latest && (
                      <span
                        className={
                          'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                          (STATUS_STYLE[latest.status] ?? STATUS_STYLE.expired)
                        }
                      >
                        {latest.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
                    {c.description}
                  </p>
                  {latest?.reviewedAt && latest.status === 'approved' && (
                    <p className="mt-1 text-[11px] text-emerald-200/70">
                      Approved {new Date(latest.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                  {latest?.reviewedAt && latest.status === 'rejected' && (
                    <p className="mt-1 text-[11px] text-red-200/70">
                      Reviewed {new Date(latest.reviewedAt).toLocaleDateString()}
                      {latest.notes ? ' — ' + latest.notes : ''}
                    </p>
                  )}
                </div>
              </div>

              {(!latest || latest.status === 'rejected' || latest.status === 'expired') && (
                <button
                  type="button"
                  onClick={() => { setOpenType(isOpen ? null : c.type); setDetail(''); setError(null); setOk(null); }}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {isOpen ? 'Cancel' : 'Submit'}
                </button>
              )}
            </div>

            {isOpen && (
              <div className="border-t border-white/[0.06] bg-black/20 p-5">
                {c.type === 'identity' ? (
                  <IdentityUploadForm onDone={() => { setOpenType(null); router.refresh(); }} />
                ) : (
                  <>
                    <label className="mb-1.5 block text-xs font-medium text-white/60">
                      Details
                    </label>
                    <input
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      placeholder={c.placeholder}
                      maxLength={200}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => submit(c.type)}
                        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
                      >
                        {pending ? 'Submitting…' : 'Submit for review'}
                      </button>
                      <span className="text-[11px] text-white/40">
                        A real person reviews every submission.
                      </span>
                    </div>
                  </>
                )}
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
      {ok && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          {ok}
        </div>
      )}
    </div>
  );
}
