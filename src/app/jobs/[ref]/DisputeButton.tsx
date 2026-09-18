'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { openDisputeAction } from './dispute-actions';

const REASONS = [
  { value: 'not_as_agreed', label: 'Work was not as agreed' },
  { value: 'quality_issue', label: 'Quality of work is poor' },
  { value: 'wrong_person', label: 'A different person showed up (Face Verified)' },
  { value: 'no_show', label: 'Provider did not show up' },
  { value: 'other', label: 'Something else' },
];

const RESOLUTIONS = [
  { value: 'redo', label: 'I want the provider to redo the work' },
  { value: 'partial_refund', label: 'I want a partial refund' },
  { value: 'full_refund', label: 'I want a full refund' },
  { value: 'cancel', label: 'I want the job cancelled' },
  { value: 'other', label: 'Other' },
];

export function DisputeButton(props: {
  jobPublicRef: string;
  openAs: 'customer' | 'provider';
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const ready =
    reason !== '' &&
    resolution !== '' &&
    description.trim().length >= 20;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ready) {
      setError('Fill in the reason, description and what you want.');
      return;
    }
    startTransition(async () => {
      const res = await openDisputeAction({
        jobPublicRef: props.jobPublicRef,
        reasonCode: reason,
        description: description.trim(),
        requestedResolution: resolution,
      });
      if (!res.ok) {
        setError(res.error ?? 'Failed.');
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-2.5 text-xs font-medium text-red-200 transition hover:bg-red-400/[0.12]"
      >
        Report a problem
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-red-400/30 bg-red-400/[0.04] p-5 space-y-4"
    >
      <div>
        <div className="text-sm font-medium text-red-100">Report a problem</div>
        <p className="mt-1 text-xs leading-relaxed text-red-100/70">
          Tell us what happened. Our team will review this dispute and any
          evidence from both sides. Please try to talk to the other party first
          if you have not already.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          What is the problem? <span className="text-red-400">*</span>
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="">Select a reason…</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          What happened? <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Explain clearly and specifically. Dates, what was agreed, what actually happened, and anything else that matters."
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <div className="mt-1 text-right text-[11px] text-white/35">{description.length} / 2000</div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          What outcome do you want? <span className="text-red-400">*</span>
        </label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="">Select…</option>
          {RESOLUTIONS.map((r) => (
            <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || !ready}
          className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
        >
          {pending ? 'Opening dispute…' : 'Open dispute'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
