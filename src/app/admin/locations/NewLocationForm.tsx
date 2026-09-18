'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLocation } from './actions';

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function NewLocationForm(props: { states: { id: string; label: string }[] }) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(props.states[0]?.id ?? '');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  const slug = slugify(name);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null);
    if (!name.trim()) { setErr('Name is required.'); return; }
    if (!parentId) { setErr('Pick a parent state.'); return; }

    startTransition(async () => {
      const res = await createLocation({ parentId, name: name.trim(), slug });
      if (!res.ok) { setErr(res.error ?? 'Failed.'); return; }
      setOk('Added ' + name.trim());
      setName('');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
        Add city
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1.5">State</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            {props.states.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1.5">City name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Owerri"
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          {name && (
            <p className="mt-1.5 text-[10px] text-white/40">
              Slug: <span className="text-white/60">/{slug}</span>
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="mt-4 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add city'}
      </button>

      {err && (
        <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {err}
        </div>
      )}
      {ok && (
        <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          {ok}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-white/40">
        Cities can be activated or deactivated at any time. Deactivating hides the city
        from customers and prevents new providers from listing there — existing data is
        preserved.
      </p>
    </form>
  );
}
