'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitQuoteAction } from '../actions';

type InitialQuote = {
  amountNaira: number;
  durationEstimate: string;
  description: string;
  materialsIncluded: boolean;
  materialsNotes: string;
  conditions: string;
  availableFrom: string;
  isUpdate: boolean;
};

export function QuoteForm(props: {
  publicRef: string;
  initialQuote: InitialQuote | null;
  onDecline?: React.ReactNode;
}) {
  const init = props.initialQuote;
  const [amount, setAmount] = useState(init ? String(init.amountNaira) : '');
  const [duration, setDuration] = useState(init?.durationEstimate ?? '');
  const [description, setDescription] = useState(init?.description ?? '');
  const [materialsIncluded, setMaterialsIncluded] = useState(init?.materialsIncluded ?? false);
  const [materialsNotes, setMaterialsNotes] = useState(init?.materialsNotes ?? '');
  const [conditions, setConditions] = useState(init?.conditions ?? '');
  const [availableFrom, setAvailableFrom] = useState(init?.availableFrom ?? '');

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  const ready = amount !== '' && parseInt(amount, 10) > 0 && description.trim().length >= 10;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    if (!ready) { setError('Fill in the amount and a short message.'); return; }

    startTransition(async () => {
      const res = await submitQuoteAction({
        publicRef: props.publicRef,
        amountNaira: parseInt(amount, 10),
        durationEstimate: duration.trim() || null,
        description: description.trim(),
        materialsIncluded,
        materialsNotes: materialsNotes.trim() || null,
        conditions: conditions.trim() || null,
        availableFrom: availableFrom || null,
      });
      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      setOk(init ? 'Quote updated.' : 'Quote sent. The customer will see it shortly.');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 space-y-4">
      <div>
        <h2 className="text-sm font-medium">{init ? 'Your quote' : 'Send your quote'}</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/50">
          {init
            ? 'You can revise your quote any time before the customer accepts.'
            : 'Give the customer a clear price, timeline, and message. Quotes you can defend win more work.'}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          Your price (₦) <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 25000"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-lg font-semibold text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        {amount && parseInt(amount, 10) > 0 && (
          <p className="mt-1 text-[11px] text-white/40">
            ₦{parseInt(amount, 10).toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">Estimated completion</label>
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 2 days, half a day, one week"
          maxLength={80}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          Message to the customer <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Explain what your price covers and anything the customer should know."
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="materials-included"
          type="checkbox"
          checked={materialsIncluded}
          onChange={(e) => setMaterialsIncluded(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/30 accent-emerald-400"
        />
        <label htmlFor="materials-included" className="text-xs text-white/70">
          Price includes materials
        </label>
      </div>

      {materialsIncluded && (
        <input
          value={materialsNotes}
          onChange={(e) => setMaterialsNotes(e.target.value)}
          placeholder="Which materials are included?"
          maxLength={200}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">Conditions (optional)</label>
        <input
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="e.g. 50% upfront, customer provides tiles"
          maxLength={200}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/70">Available from (optional)</label>
        <input
          type="date"
          value={availableFrom}
          onChange={(e) => setAvailableFrom(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !ready}
        className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-40"
      >
        {pending ? 'Sending…' : init ? 'Update quote' : 'Send quote'}
      </button>

      {props.onDecline && !init && (
        <div className="border-t border-white/[0.06] pt-3">
          {props.onDecline}
        </div>
      )}

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
    </form>
  );
}
