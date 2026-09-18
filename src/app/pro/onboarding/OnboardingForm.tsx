'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { submitProviderProfile } from './actions';
import { slugify } from '@/lib/slug';

type CategoryGroup = {
  id: string;
  name: string;
  icon?: string | null;
  children: { id: string; name: string; icon?: string | null }[];
};

type LocationOption = { id: string; name: string; stateName: string };

export function OnboardingForm(props: {
  categories: CategoryGroup[];
  locations: LocationOption[];
}) {
  // Business info
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [years, setYears] = useState('');

  // Profile photo (staged in browser, uploaded after profile creation)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Portfolio (staged in browser, uploaded after profile creation)
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const portfolioRef = useRef<HTMLInputElement>(null);

  // Selections
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Submission state
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const slugPreview = slugify(businessName);
  const ready =
    businessName.trim().length >= 2 &&
    description.trim().length >= 20 &&
    selectedCategories.length > 0 &&
    selectedLocations.length > 0 &&
    avatarFile !== null;

  function toggleCategory(id: string) {
    setSelectedCategories((cur) =>
      cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
    );
  }
  function toggleLocation(id: string) {
    setSelectedLocations((cur) =>
      cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
    );
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const url = URL.createObjectURL(f);
    setAvatarPreview(url);
  }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarRef.current) avatarRef.current.value = '';
  }

  function onPortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    const combined = [...portfolioFiles, ...incoming].slice(0, 10);
    setPortfolioFiles(combined);
    // Rebuild previews to match
    setPortfolioPreviews(combined.map((f) => URL.createObjectURL(f)));
    if (portfolioRef.current) portfolioRef.current.value = '';
  }

  function removePortfolioAt(idx: number) {
    const next = portfolioFiles.filter((_, i) => i !== idx);
    setPortfolioFiles(next);
    setPortfolioPreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!ready) {
      setErr('Fill in the required fields and upload a profile photo.');
      return;
    }

    startTransition(async () => {
      // 1. Create the profile
      setPhase('Publishing profile…');
      const res = await submitProviderProfile({
        businessName: businessName.trim(),
        tagline: tagline.trim() || null,
        description: description.trim(),
        yearsExperience: years ? parseInt(years, 10) : null,
        categoryIds: selectedCategories,
        locationIds: selectedLocations,
      });
      if (!res.ok) { setErr(res.error ?? 'Failed.'); setPhase(null); return; }

      // 2. Upload avatar
      if (avatarFile) {
        setPhase('Uploading profile photo…');
        const fd = new FormData();
        fd.append('file', avatarFile);
        await fetch('/api/pro/avatar', { method: 'POST', body: fd }).catch(() => {});
      }

      // 3. Upload portfolio items
      if (portfolioFiles.length > 0) {
        for (let i = 0; i < portfolioFiles.length; i++) {
          setPhase('Uploading work photos (' + (i + 1) + '/' + portfolioFiles.length + ')…');
          const fd = new FormData();
          fd.append('file', portfolioFiles[i]);
          await fetch('/api/pro/portfolio', { method: 'POST', body: fd }).catch(() => {});
        }
      }

      setPhase('Finishing…');
      router.push('/pro');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-4xl">
      <div className="mb-8">
        <div className="text-xs font-medium uppercase tracking-wider text-emerald-300/80 mb-2">
          Create your provider profile
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Tell customers who you are</h1>
        <p className="mt-2 text-sm text-white/50">
          This is what customers see when they find you. Fill it out once — you can edit later.
        </p>
      </div>

      <div className="space-y-8">
        {/* ── Section 1: Business info ──────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <h2 className="mb-5 text-sm font-medium">Business information</h2>

          <div className="space-y-4">
            <Field label="Business name" required>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. John Electrical Services"
                maxLength={100}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {businessName && (
                <p className="mt-1.5 text-[11px] text-white/40">
                  Your public URL: <span className="text-white/60">/provider/{slugPreview}</span>
                </p>
              )}
            </Field>

            <Field label="Tagline" hint="Optional · one short line">
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Reliable electrical work, done right"
                maxLength={120}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </Field>

            <Field label="About your work" required hint="At least 20 characters">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={3000}
                placeholder="Describe what you do, what you specialise in, and why customers should hire you."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <div className="mt-1 text-right text-[11px] text-white/30">
                {description.length} / 3000
              </div>
            </Field>

            <Field label="Years of experience" hint="Optional">
              <input
                value={years}
                onChange={(e) => setYears(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 8"
                maxLength={2}
                className="w-full max-w-[120px] rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </Field>
          </div>
        </section>

        {/* ── Section 2: Profile photo ──────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">
              Profile photo
              <span className="ml-1 text-red-400">*</span>
            </h2>
            <span className="text-xs text-white/40">Required</span>
          </div>

          <div className="flex flex-wrap items-start gap-5">
            <div className="relative">
              <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-3xl font-bold text-white shadow-lg">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span>{(businessName.trim().charAt(0) || '?').toUpperCase()}</span>
                )}
              </span>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="absolute -right-2 -top-2 rounded-full border border-white/20 bg-[#05070b] px-2 py-1 text-[10px] text-white/70 transition hover:border-red-400/40 hover:text-red-200"
                  title="Remove photo"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <input
                ref={avatarRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onAvatarChange}
                className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
              />
              <p className="text-[11px] leading-relaxed text-white/50">
                A clear photo of your face. Customers need to know who will show up —
                this is the person they&apos;ll see on every job. <strong className="text-white/70">JPG,
                PNG, or WEBP. Max 4MB.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Portfolio ──────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Past work</h2>
            <span className="text-xs text-white/40">
              {portfolioFiles.length} / 10 photos
            </span>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-white/50">
            Upload up to 10 photos of jobs you have completed. Real photos build more trust
            than any description — this is the single biggest driver of being hired.
          </p>

          {portfolioPreviews.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {portfolioPreviews.map((url, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f16]"
                >
                  <div className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={'Work ' + (i + 1)} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <button
                      type="button"
                      onClick={() => removePortfolioAt(i)}
                      className="absolute right-2 top-2 rounded-lg border border-red-400/30 bg-red-500/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {portfolioFiles.length < 10 ? (
            <input
              ref={portfolioRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onPortfolioChange}
              className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
            />
          ) : (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
              Portfolio is full (10/10). Remove a photo to add another.
            </div>
          )}
        </section>

        {/* ── Section 4: Services ───────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">
              Services you offer
              <span className="ml-1 text-red-400">*</span>
            </h2>
            <span className="text-xs text-white/40">
              {selectedCategories.length} selected · min 1, max 12
            </span>
          </div>

          <div className="space-y-5">
            {props.categories.map((parent) => (
              <div key={parent.id}>
                <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-white/60">
                  {parent.icon && <span>{parent.icon}</span>}
                  <span>{parent.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                  {parent.children.map((child) => {
                    const checked = selectedCategories.includes(child.id);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleCategory(child.id)}
                        className={
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ' +
                          (checked
                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                            : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]')
                        }
                      >
                        <span
                          className={
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border ' +
                            (checked
                              ? 'border-emerald-400/50 bg-emerald-400 text-[#05070b]'
                              : 'border-white/20')
                          }
                        >
                          {checked && '✓'}
                        </span>
                        <span className="truncate">{child.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Service areas ──────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">
              Where you work
              <span className="ml-1 text-red-400">*</span>
            </h2>
            <span className="text-xs text-white/40">
              {selectedLocations.length} selected · min 1, max 30
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {props.locations.map((loc) => {
              const checked = selectedLocations.includes(loc.id);
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => toggleLocation(loc.id)}
                  className={
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ' +
                    (checked
                      ? 'border-blue-400/40 bg-blue-400/10 text-blue-100'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]')
                  }
                >
                  <span
                    className={
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border ' +
                      (checked
                        ? 'border-blue-400/50 bg-blue-400 text-[#05070b]'
                        : 'border-white/20')
                    }
                  >
                    {checked && '✓'}
                  </span>
                  <span className="truncate">
                    {loc.name}
                    <span className="text-white/40"> · {loc.stateName}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {err && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <button
            type="submit"
            disabled={pending || !ready}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-40"
          >
            {pending ? (phase ?? 'Publishing…') : 'Publish my profile'}
          </button>

          <div className="flex-1 min-w-0 text-xs text-white/50">
            {ready ? (
              <span className="text-emerald-300">Ready to publish.</span>
            ) : (
              <span>
                Required:
                {businessName.trim().length < 2 && ' business name,'}
                {description.trim().length < 20 && ' description,'}
                {!avatarFile && ' profile photo,'}
                {selectedCategories.length === 0 && ' at least one service,'}
                {selectedLocations.length === 0 && ' at least one area,'}
              </span>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function Field(props: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/70">
        {props.label}
        {props.required && <span className="ml-1 text-red-400">*</span>}
        {props.hint && <span className="ml-2 text-white/30">· {props.hint}</span>}
      </label>
      {props.children}
    </div>
  );
}
