'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { grantSelfProviderRole } from './actions';

export function BecomeProvider() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function enable() {
    startTransition(async () => {
      const res = await grantSelfProviderRole();
      if (!res.ok) return;
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-xl text-center py-16">
      <div className="mb-4 text-5xl">🤝</div>
      <h1 className="text-3xl font-semibold tracking-tight">Become a provider</h1>
      <p className="mt-3 text-sm text-white/60 leading-relaxed">
        Enable provider mode to create a professional profile, list your services, and
        start receiving job requests from customers in your area.
      </p>

      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
        <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
          What happens next
        </div>
        <ul className="text-sm text-white/70 space-y-2.5">
          <li className="flex gap-3">
            <span className="text-emerald-400">1.</span>
            <span>We add the <strong className="text-white">provider</strong> role to your account.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400">2.</span>
            <span>You fill out your business details, services, and service areas.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-400">3.</span>
            <span>Your public page goes live at <span className="font-mono text-white/60">/provider/your-slug</span>.</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={enable}
        disabled={pending}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-[#04100b] transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {pending ? 'Enabling…' : 'Enable provider mode'}
      </button>

      <p className="mt-4 text-xs text-white/40">
        You can keep using your account as a customer at the same time.
      </p>
    </div>
  );
}
