'use client';

import { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Item = {
  id: string;
  title: string | null;
  description: string | null;
  publicUrl: string;
};

export function PortfolioManager(props: { initial: Item[]; providerSlug: string }) {
  const [items, setItems] = useState(props.initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const f = fileRef.current?.files?.[0];
    if (!f) { setError('Pick a photo first.'); return; }
    if (items.length >= 10) { setError('Portfolio is full — remove one first.'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      if (titleRef.current?.value) fd.append('title', titleRef.current.value);
      if (descRef.current?.value) fd.append('description', descRef.current.value);

      const res = await fetch('/api/pro/portfolio', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }

      setItems((cur) => [
        ...cur,
        {
          id: data.itemId,
          title: titleRef.current?.value || null,
          description: descRef.current?.value || null,
          publicUrl: data.publicUrl,
        },
      ]);
      if (fileRef.current) fileRef.current.value = '';
      if (titleRef.current) titleRef.current.value = '';
      if (descRef.current) descRef.current.value = '';
      setOk('Photo added.');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
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
    <div className="space-y-8">
      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f16]"
            >
              <div className="relative aspect-square">
                <Image
                  src={it.publicUrl}
                  alt={it.title ?? 'Portfolio photo'}
                  fill
                  sizes="25vw"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="absolute right-2 top-2 rounded-lg border border-red-400/30 bg-red-500/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                >
                  Remove
                </button>
              </div>
              {(it.title || it.description) && (
                <div className="p-2.5">
                  {it.title && <div className="truncate text-xs font-medium">{it.title}</div>}
                  {it.description && (
                    <div className="mt-0.5 line-clamp-2 text-[10px] text-white/50">
                      {it.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-4xl">📸</div>
          <div className="font-medium text-white">No portfolio photos yet</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
            Add photos of previous work below. Real photos of real jobs build more trust
            than anything else on your profile.
          </p>
        </div>
      )}

      {/* Upload form */}
      {items.length < 10 && (
        <form onSubmit={upload} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-4 text-sm font-medium">Add a photo</div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-white/60">Photo</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
              />
              <p className="mt-1 text-[10px] text-white/40">JPG, PNG, or WEBP. Max 8MB.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-white/60">Title (optional)</label>
                <input
                  ref={titleRef}
                  placeholder="e.g. Full house wiring"
                  maxLength={100}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/60">Note (optional)</label>
                <input
                  ref={descRef}
                  placeholder="e.g. 3-bedroom bungalow, Enugu"
                  maxLength={200}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Add to portfolio'}
          </button>

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
      )}

      {items.length >= 10 && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          Portfolio is full (10 / 10). Remove a photo to add another.
        </div>
      )}
    </div>
  );
}
