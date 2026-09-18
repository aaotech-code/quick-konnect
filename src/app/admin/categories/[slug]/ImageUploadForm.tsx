'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function ImageUploadForm(props: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Pick a file first.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/admin/categories/' + props.slug + '/image', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'Upload failed.');
        return;
      }

      setOk(true);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
      />

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Upload photo'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          Photo updated.
        </div>
      )}
    </form>
  );
}
