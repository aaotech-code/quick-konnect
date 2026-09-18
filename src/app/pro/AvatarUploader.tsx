'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function AvatarUploader(props: {
  name: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(props.initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const initial = (props.name?.trim().charAt(0) ?? '?').toUpperCase();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const f = fileRef.current?.files?.[0];
    if (!f) { setError('Pick a photo first.'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/pro/avatar', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }
      setUrl(data.publicUrl);
      if (fileRef.current) fileRef.current.value = '';
      setOk('Photo updated.');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setError(null); setOk(null);
    setUploading(true);
    try {
      const res = await fetch('/api/pro/avatar', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Failed.'); return; }
      setUrl(null);
      setOk('Photo removed.');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
        Profile photo
      </div>

      <div className="flex items-start gap-5">
        <div className="relative">
          <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-3xl font-bold text-white shadow-lg">
            {url ? (
              <Image src={url} alt={props.name} fill sizes="96px" className="object-cover" unoptimized />
            ) : (
              <span>{initial}</span>
            )}
          </span>
          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={uploading}
              className="absolute -right-2 -top-2 rounded-full border border-white/20 bg-[#05070b] px-2 py-1 text-[10px] text-white/70 transition hover:border-red-400/40 hover:text-red-200 disabled:opacity-50"
              title="Remove photo"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={upload} className="min-w-0 flex-1 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : url ? 'Replace photo' : 'Upload photo'}
            </button>
            <p className="text-[11px] text-white/40">
              JPG, PNG, or WEBP. Max 4MB.
            </p>
          </div>

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
      </div>
    </div>
  );
}
