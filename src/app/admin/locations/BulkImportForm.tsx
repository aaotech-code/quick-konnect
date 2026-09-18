'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { bulkImportLocations } from './actions';

const EXAMPLE = 'Lagos: Ikeja, Lekki, Yaba, Surulere\nRivers: Port Harcourt, Bonny\nCross River';

export function BulkImportForm() {
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    statesCreated: number;
    statesSkipped: number;
    citiesCreated: number;
    citiesSkipped: number;
    parseErrors: string[];
    details: string[];
  } | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSummary(null);
    if (!text.trim()) { setErr('Paste a list first.'); return; }

    startTransition(async () => {
      const res = await bulkImportLocations({ text });
      if (!res.ok) { setErr(res.error ?? 'Failed.'); return; }
      setSummary(res.summary!);
      setText('');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
        Bulk import
      </div>

      <p className="text-[11px] leading-relaxed text-white/50 mb-3">
        One state per line. Use <span className="font-mono text-white/70">State: city1, city2</span> for
        states with cities. Lines starting with <span className="font-mono text-white/70">#</span> are ignored.
        Existing states and cities are skipped — safe to re-run.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE}
        rows={8}
        spellCheck={false}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
      />

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setText(EXAMPLE)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
        >
          Load example
        </button>
      </div>

      <button
        type="submit"
        disabled={pending || !text.trim()}
        className="mt-4 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
      >
        {pending ? 'Importing…' : 'Import'}
      </button>

      {err && (
        <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {err}
        </div>
      )}

      {summary && (
        <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-xs text-emerald-100 space-y-1">
          <div className="font-medium">Import complete</div>
          <div>States created: {summary.statesCreated} · skipped: {summary.statesSkipped}</div>
          <div>Cities created: {summary.citiesCreated} · skipped: {summary.citiesSkipped}</div>
          {summary.parseErrors.length > 0 && (
            <div className="mt-2 text-amber-200">
              {summary.parseErrors.map((e, i) => <div key={i}>⚠ {e}</div>)}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
