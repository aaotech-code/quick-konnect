'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function IdentityUploadForm(props: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idDocType, setIdDocType] = useState('NIN');
  const idRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const idFile = idRef.current?.files?.[0];
    const selfieFile = selfieRef.current?.files?.[0];
    if (!idFile) { setError('Upload a photo of your ID.'); return; }
    if (!selfieFile) { setError('Upload a selfie holding your ID.'); return; }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('idFile', idFile);
      fd.append('selfieFile', selfieFile);
      fd.append('idDocType', idDocType);

      const res = await fetch('/api/pro/verification', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Upload failed.'); return; }

      props.onDone();
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3 text-[11px] leading-relaxed text-blue-100/80">
        <div className="mb-1 font-medium text-blue-200">Face verification</div>
        Our team will compare your ID photo against your selfie and your profile picture.
        Only if all three match does your profile get the <strong>Face Verified</strong> badge.
        This badge tells customers that the person they see on the profile is the person
        who will show up.
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/60">
          ID type
        </label>
        <select
          value={idDocType}
          onChange={(e) => setIdDocType(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="NIN" className="bg-slate-900">NIN (National Identity Number)</option>
          <option value="Driver's licence" className="bg-slate-900">Driver&apos;s licence</option>
          <option value="Passport" className="bg-slate-900">International passport</option>
          <option value="Voter's card" className="bg-slate-900">Voter&apos;s card</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/60">
          1. Photo of your ID
        </label>
        <input
          ref={idRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
        />
        <p className="mt-1 text-[10px] text-white/40">
          Make sure all text and your photo are clearly readable.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/60">
          2. Selfie holding your ID next to your face
        </label>
        <input
          ref={selfieRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/[0.12]"
        />
        <p className="mt-1 text-[10px] text-white/40">
          Hold your ID next to your face so both are visible in the same photo. Good lighting helps.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Submit for review'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
    </form>
  );
}
