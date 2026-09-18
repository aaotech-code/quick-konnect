'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AvatarUploader } from '../../AvatarUploader';

type PortfolioItem = {
  id: string;
  title: string | null;
  description: string | null;
  publicUrl: string;
};

export function CompletePanel(props: {
  businessName: string;
  providerSlug: string;
  initialAvatarUrl: string | null;
  initialPortfolio: PortfolioItem[];
  hasPendingVerification: boolean;
  hasApprovedIdentity: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(props.initialPortfolio);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const hasAvatar = Boolean(props.initialAvatarUrl);
  const hasPortfolio = items.length > 0;
  const hasVerification = props.hasApprovedIdentity || props.hasPendingVerification;

  const completion = [hasAvatar, hasPortfolio, hasVerification].filter(Boolean).length;
  const readyToGo = hasAvatar && hasPortfolio;

  async function uploadPortfolio(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const f = fileRef.current?.files?.[0];
    if (!f) { setError('Pick a photo first.'); return; }
    if (items.length >= 10) { setError('Portfolio is full (10 max).'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      if (titleRef.current?.value) fd.append('title', titleRef.current.value);

      const res = await fetch('/api/pro/portfolio', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }

      setItems((cur) => [
        ...cur,
        {
          id: data.itemId,
          title: titleRef.current?.value || null,
          description: null,
          publicUrl: data.publicUrl,
        },
      ]);
      if (fileRef.current) fileRef.current.value = '';
      if (titleRef.current) titleRef.current.value = '';
      setOk('Photo added.');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setUploading(false);
    }
  }

  function removePortfolio(id: string) {
    setError(null); setOk(null);
    startTransition(async () => {
      const res = await fetch('/api/pro/portfolio?id=' + encodeURIComponent(id), {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Remove failed.'); return; }
      setItems((cur) => cur.filter((x) => x.id !== id));
      setOk('Removed.');
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-3xl shadow-xl">
          ✓
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Your profile is live
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
          Add photos to complete the trust profile customers see. The more you add now,
          the more likely you will be hired.
        </p>
      </div>

      <div className="mb-10 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-white/40">
            Profile completion
          </div>
          <div className="text-xs text-white/60">{completion} of 3 steps</div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
            style={{ width: ((completion / 3) * 100) + '%' }}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <Step done={hasAvatar} label="Profile photo" />
          <Step done={hasPortfolio} label="Portfolio" />
          <Step done={hasVerification} label="Verification" />
        </div>
      </div>

      <div className="space-y-8">
        <Section
          num="1"
          title="Add your photo"
          subtitle="Customers want to know who they are hiring. A clear photo of your face is best."
        >
          <AvatarUploader
            name={props.businessName}
            initialUrl={props.initialAvatarUrl}
          />
        </Section>

        <Section
          num="2"
          title="Show your past work"
          subtitle="Upload up to 10 photos of jobs you have completed. Real photos build more trust than any description."
        >
          {items.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f16]"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={it.publicUrl}
                      alt={it.title ?? 'Work photo'}
                      fill
                      sizes="25vw"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <button
                      type="button"
                      onClick={() => removePortfolio(it.id)}
                      className="absolute right-2 top-2 rounded-lg border border-red-400/30 bg-red-500/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  {it.title && (
                    <div className="truncate p-2 text-[11px] text-white/70">{it.title}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {items.length < 10 ? (
            <form onSubmit={uploadPortfolio} className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
                />
                <input
                  ref={titleRef}
                  placeholder="What was the job? (optional)"
                  maxLength={100}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="whitespace-nowrap rounded-lg bg-white px-5 py-2 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
                >
                  {uploading ? 'Adding…' : 'Add photo'}
                </button>
              </div>
              {error && (
                <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}
              {ok && (
                <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                  {ok}
                </div>
              )}
            </form>
          ) : (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
              Portfolio is full (10/10). Remove a photo to add another.
            </div>
          )}
        </Section>

        <Section
          num="3"
          title="Get Face Verified"
          subtitle="The strongest trust signal we offer. Our team checks your ID against a selfie to prove the person on this profile is you."
        >
          {props.hasApprovedIdentity ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] text-[#04100b]">
                  ✓
                </span>
                Face Verified
              </div>
              <p className="mt-2 text-xs text-emerald-100/70">
                Your profile carries the Face Verified badge. Customers know exactly who they are hiring.
              </p>
            </div>
          ) : props.hasPendingVerification ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] p-4">
              <div className="text-sm font-medium text-amber-100">Verification in review</div>
              <p className="mt-1 text-xs text-amber-100/70">
                Our team is reviewing your submission. You will get a notification when it is done.
              </p>
            </div>
          ) : (
            <Link
              href="/pro/verification"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div>
                <div className="text-sm font-medium text-white">Submit for verification</div>
                <div className="mt-0.5 text-xs text-white/50">
                  Takes 2 minutes. Photo of your ID + a selfie holding it.
                </div>
              </div>
              <span className="text-white/40">→</span>
            </Link>
          )}
        </Section>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
        <div>
          <div className="text-sm font-medium">
            {readyToGo ? 'You are ready to receive requests' : 'Finish photo + portfolio to start receiving requests'}
          </div>
          <p className="mt-1 text-xs text-white/50">
            You can still add or edit anything from your dashboard later.
          </p>
        </div>
        <Link
          href="/pro"
          className={
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ' +
            (readyToGo
              ? 'bg-white text-[#05070b] hover:bg-blue-50'
              : 'border border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/[0.1] hover:text-white')
          }
        >
          Go to my dashboard →
        </Link>
      </div>
    </div>
  );
}

function Step(props: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ' +
          (props.done ? 'bg-emerald-400 text-[#04100b]' : 'border border-white/20 bg-white/[0.04] text-white/40')
        }
      >
        {props.done ? '✓' : '·'}
      </span>
      <span className={props.done ? 'text-emerald-100' : 'text-white/50'}>{props.label}</span>
    </div>
  );
}

function Section(props: { num: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="mb-5 flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/70">
          {props.num}
        </span>
        <div>
          <div className="text-sm font-medium">{props.title}</div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">{props.subtitle}</p>
        </div>
      </div>
      {props.children}
    </section>
  );
}
