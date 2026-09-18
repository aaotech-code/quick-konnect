'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleLocationActive, toggleLocationFeatured } from './actions';

export function LocationRow(props: {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  const [active, setActive] = useState(props.isActive);
  const [featured, setFeatured] = useState(props.isFeatured);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function toggleActive() {
    setErr(null);
    const next = !active;
    startTransition(async () => {
      const res = await toggleLocationActive(props.id, next);
      if (!res.ok) { setErr(res.error ?? 'Failed.'); return; }
      setActive(next);
      router.refresh();
    });
  }

  function toggleFeatured() {
    setErr(null);
    const next = !featured;
    startTransition(async () => {
      const res = await toggleLocationFeatured(props.id, next);
      if (!res.ok) { setErr(res.error ?? 'Failed.'); return; }
      setFeatured(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white/90">{props.name}</div>
        <div className="truncate text-[10px] text-white/35">/{props.slug}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={toggleFeatured}
          title={err ?? (featured ? 'Featured on homepage — click to remove' : 'Click to feature on homepage')}
          className={
            'rounded-md border px-2 py-1 text-[10px] font-medium transition disabled:opacity-50 ' +
            (featured
              ? 'border-amber-400/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25'
              : 'border-white/10 bg-white/[0.04] text-white/40 hover:bg-white/10 hover:text-white/70')
          }
        >
          {featured ? '★ Featured' : '☆'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={toggleActive}
          title={err ?? (active ? 'Active — click to disable' : 'Inactive — click to enable')}
          className={
            'rounded-md border px-2.5 py-1 text-[10px] font-medium transition disabled:opacity-50 ' +
            (active
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
              : 'border-white/10 bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white')
          }
        >
          {active ? 'Active' : 'Inactive'}
        </button>
      </div>
    </div>
  );
}
