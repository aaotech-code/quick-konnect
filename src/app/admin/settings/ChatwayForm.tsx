'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ChatwayForm(props: { initialCode: string }) {
  const [code, setCode] = useState(props.initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null); setBusy(true);
    try {
      const res = await fetch('/api/admin/settings/chatway_widget_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Save failed.'); return; }
      setOk('Snippet saved. Refresh any public page to see it.');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setError(null); setOk(null); setBusy(true);
    try {
      const res = await fetch('/api/admin/settings/chatway_widget_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: '' }),
      });
      if (!res.ok) { setError('Failed.'); return; }
      setCode('');
      setOk('Snippet cleared.');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
      <div className="mb-4">
        <div className="text-sm font-medium">Chat widget</div>
        <p className="mt-1 text-xs leading-relaxed text-white/50">
          Paste the full embed snippet from Chatway (or any chat provider). It renders on every public page.
          Use this for visitor support and lead capture. Do not use it for customer ↔ provider chat — that
          runs in-platform.
        </p>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={8}
        spellCheck={false}
        placeholder={'<script src="https://cdn.chatway.app/widget.js?id=xxxxxxx" async></script>'}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save snippet'}
        </button>
        {code && (
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Clear
          </button>
        )}
        <span className="text-[11px] text-white/40">Max 20,000 characters.</span>
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
  );
}
