'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function BrandForm(props: { initialName: string; initialLogo: string }) {
  const [name, setName] = useState(props.initialName);
  const [logoUrl, setLogoUrl] = useState(props.initialLogo);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null); setSavingName(true);
    try {
      const res = await fetch('/api/admin/settings/site_name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Save failed.'); return; }
      setOk('Name saved.');
      router.refresh();
    } catch { setError('Network error.'); }
    finally { setSavingName(false); }
  }

  async function uploadLogo(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const f = fileRef.current?.files?.[0];
    if (!f) { setError('Pick a logo first.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/admin/settings/site_logo_url', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }
      setLogoUrl(data.imageUrl);
      if (fileRef.current) fileRef.current.value = '';
      setOk('Logo updated.');
      router.refresh();
    } catch { setError('Network error.'); }
    finally { setUploading(false); }
  }

  async function clearLogo() {
    setError(null); setOk(null);
    try {
      const res = await fetch('/api/admin/settings/site_logo_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Failed.'); return; }
      setLogoUrl('');
      setOk('Logo cleared.');
      router.refresh();
    } catch { setError('Network error.'); }
  }

  return (
    <div className="space-y-8">
      {/* Brand name */}
      <form onSubmit={saveName} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <label className="block text-sm font-medium text-white/80 mb-2">Site name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={savingName}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
          >
            {savingName ? 'Saving…' : 'Save name'}
          </button>
          <span className="text-xs text-white/40">Shown in the header and browser tab.</span>
        </div>
      </form>

      {/* Logo */}
      <form onSubmit={uploadLogo} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <label className="block text-sm font-medium text-white/80 mb-2">Logo</label>
        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04] ring-1 ring-white/10">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-white/30">none</span>
              )}
            </span>
            <div className="text-xs text-white/40 break-all">
              {logoUrl || 'Default mark in use'}
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload logo'}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={clearLogo}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Clear logo
            </button>
          )}
          <span className="text-xs text-white/40">PNG, JPG, SVG, or WEBP. Max 2MB. Square works best.</span>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      {ok && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">{ok}</div>
      )}
    </div>
  );
}
