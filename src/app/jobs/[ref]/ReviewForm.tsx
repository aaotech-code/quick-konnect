'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitReviewAction } from './actions';

const DIMENSIONS: { key: 'ratingQuality' | 'ratingProfessionalism' | 'ratingCommunication' | 'ratingTimeliness' | 'ratingValue'; label: string }[] = [
  { key: 'ratingQuality', label: 'Quality of work' },
  { key: 'ratingProfessionalism', label: 'Professionalism' },
  { key: 'ratingCommunication', label: 'Communication' },
  { key: 'ratingTimeliness', label: 'Timeliness' },
  { key: 'ratingValue', label: 'Value for money' },
];

export function ReviewForm(props: { publicRef: string; providerName: string }) {
  const [overall, setOverall] = useState(0);
  const [hover, setHover] = useState(0);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const ready = overall > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ready) { setError('Please give an overall rating.'); return; }

    startTransition(async () => {
      const res = await submitReviewAction({
        publicRef: props.publicRef,
        ratingOverall: overall,
        ratingQuality: dimensions.ratingQuality ?? null,
        ratingProfessionalism: dimensions.ratingProfessionalism ?? null,
        ratingCommunication: dimensions.ratingCommunication ?? null,
        ratingTimeliness: dimensions.ratingTimeliness ?? null,
        ratingValue: dimensions.ratingValue ?? null,
        body: body.trim() || null,
      });
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.04] p-6 space-y-5">
      <div>
        <div className="text-sm font-medium text-emerald-100">Leave a review for {props.providerName}</div>
        <p className="mt-1 text-xs text-emerald-100/70">
          This review is public. It helps other customers pick the right provider.
        </p>
      </div>

      {/* Overall rating */}
      <div>
        <label className="mb-2 block text-xs font-medium text-white/70">
          Overall rating <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setOverall(n)}
              className="text-3xl transition"
              aria-label={n + ' star' + (n === 1 ? '' : 's')}
            >
              <span className={(hover || overall) >= n ? 'text-amber-400' : 'text-white/20'}>★</span>
            </button>
          ))}
          {overall > 0 && (
            <span className="ml-3 text-sm text-white/60">{overall} of 5</span>
          )}
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-4">
            <div className="text-xs text-white/70">{d.label}</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setDimensions((cur) => ({ ...cur, [d.key]: n }))
                  }
                  className="text-lg transition"
                  aria-label={d.label + ': ' + n}
                >
                  <span className={(dimensions[d.key] ?? 0) >= n ? 'text-amber-400' : 'text-white/15'}>★</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Written review */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          Your review <span className="text-white/35">· optional</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What went well? What should other customers know? Be specific and honest."
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <div className="mt-1 text-right text-[11px] text-white/35">{body.length} / 2000</div>
      </div>

      <button
        type="submit"
        disabled={pending || !ready}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
      >
        {pending ? 'Publishing review…' : 'Publish review'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
    </form>
  );
}
