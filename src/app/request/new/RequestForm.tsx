'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitServiceRequest } from '../actions';

type CategoryGroup = {
  id: string;
  name: string;
  icon?: string | null;
  children: { id: string; name: string; icon?: string | null }[];
};
type LocationOption = { id: string; name: string; stateName: string };

const TIME_WINDOWS = ['Any time', 'Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–7pm)'];

export function RequestForm(props: {
  categories: CategoryGroup[];
  locations: LocationOption[];
}) {
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [addressText, setAddressText] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeWindow, setPreferredTimeWindow] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const ready =
    categoryId !== '' &&
    title.trim().length >= 5 &&
    description.trim().length >= 20 &&
    locationId !== '';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ready) {
      setError('Fill in the required fields.');
      return;
    }

    startTransition(async () => {
      const res = await submitServiceRequest({
        categoryId,
        title: title.trim(),
        description: description.trim(),
        locationId,
        addressText: addressText.trim() || null,
        preferredDate: preferredDate || null,
        preferredTimeWindow: preferredTimeWindow || null,
        budgetMinNaira: budgetMin ? parseInt(budgetMin, 10) : null,
        budgetMaxNaira: budgetMax ? parseInt(budgetMax, 10) : null,
      });

      if (!res.ok) {
        setError(res.error ?? 'Failed to submit request.');
        return;
      }

      router.push('/dashboard/requests?posted=' + encodeURIComponent(res.publicRef));
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Section 1: What */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <h2 className="mb-5 text-sm font-medium">What needs doing</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Service category <span className="text-red-400">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">Select a service…</option>
              {props.categories.map((parent) => (
                <optgroup key={parent.id} label={parent.name} className="bg-slate-900">
                  {parent.children.map((child) => (
                    <option key={child.id} value={child.id} className="bg-slate-900">
                      {child.icon ? child.icon + ' ' : ''}{child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Short title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kitchen sink leaking and pipe needs replacing"
              maxLength={120}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/35">
              <span>5–120 characters</span>
              <span>{title.length} / 120</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Describe the job <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Give the details — what&apos;s broken, what you need built, what materials are available, anything a provider should know to quote accurately."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/35">
              <span>At least 20 characters</span>
              <span>{description.length} / 2000</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Where */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <h2 className="mb-5 text-sm font-medium">Where</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              City <span className="text-red-400">*</span>
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">Select a city…</option>
              {props.locations.map((l) => (
                <option key={l.id} value={l.id} className="bg-slate-900">
                  {l.name}{l.stateName ? ' · ' + l.stateName : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              Address or area <span className="text-white/35">· optional</span>
            </label>
            <input
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. Independence Layout, near Shoprite"
              maxLength={200}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <p className="mt-1.5 text-[11px] text-white/35">
              Only shared with the provider you hire. Visible after you accept a quote.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: When */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <h2 className="mb-5 text-sm font-medium">
          When <span className="ml-1 text-xs font-normal text-white/35">· optional</span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Preferred date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Time window</label>
            <select
              value={preferredTimeWindow}
              onChange={(e) => setPreferredTimeWindow(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">Any time</option>
              {TIME_WINDOWS.map((w) => (
                <option key={w} value={w} className="bg-slate-900">{w}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section 4: Budget */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <h2 className="mb-2 text-sm font-medium">
          Budget <span className="ml-1 text-xs font-normal text-white/35">· optional</span>
        </h2>
        <p className="mb-5 text-xs leading-relaxed text-white/45">
          Setting a range helps providers quote within your expectations. Leave blank if unsure.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Minimum (₦)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 15000"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">Maximum (₦)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 40000"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <button
          type="submit"
          disabled={pending || !ready}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-40"
        >
          {pending ? 'Posting…' : 'Post job & request quotes'}
        </button>
        <span className="text-xs text-white/45">
          {ready
            ? 'Ready. Verified providers in your city will be notified.'
            : 'Fill in required fields to post.'}
        </span>
      </div>
    </form>
  );
}
