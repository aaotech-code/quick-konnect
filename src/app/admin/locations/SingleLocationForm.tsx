'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLocation, createState } from './actions';
import { slugify } from '@/lib/slug';

const NEW_STATE = '__new__';

export function SingleLocationForm(props: {
  states: { id: string; label: string }[];
}) {
  const [parentId, setParentId] = useState(props.states[0]?.id ?? NEW_STATE);
  const [newStateName, setNewStateName] = useState('');
  const [cityName, setCityName] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  const addingState = parentId === NEW_STATE;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null);

    startTransition(async () => {
      let res: { ok: boolean; error?: string };

      if (addingState) {
        if (!newStateName.trim()) { setErr('Enter a state name.'); return; }
        res = await createState({
          name: newStateName.trim(),
          initialCity: cityName.trim() || undefined,
        });
      } else {
        if (!cityName.trim()) { setErr('Enter a city name.'); return; }
        res = await createLocation({
          parentId,
          name: cityName.trim(),
          slug: slugify(cityName),
        });
      }

      if (!res.ok) { setErr(res.error ?? 'Failed.'); return; }

      setOk(
        addingState
          ? 'Added state ' + newStateName.trim() + (cityName.trim() ? ' with city ' + cityName.trim() : '')
          : 'Added city ' + cityName.trim(),
      );
      setNewStateName('');
      setCityName('');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
        Add location
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1.5">State</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <option value={NEW_STATE} className="bg-slate-900">+ New state…</option>
            <optgroup label="Existing states" className="bg-slate-900">
              {props.states.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900">
                  {s.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {addingState && (
          <div>
            <label className="block text-xs text-white/60 mb-1.5">New state name</label>
            <input
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              placeholder="e.g. Lagos"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            {newStateName && (
              <p className="mt-1.5 text-[10px] text-white/40">
                Slug: <span className="text-white/60">/{slugify(newStateName)}</span>
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            {addingState ? 'Initial city (optional)' : 'City name'}
          </label>
          <input
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder={addingState ? 'e.g. Ikeja' : 'e.g. Owerri'}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          {!addingState && cityName && (
            <p className="mt-1.5 text-[10px] text-white/40">
              Slug: <span className="text-white/60">/{slugify(cityName)}</span>
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50 disabled:opacity-50"
      >
        {pending ? 'Adding…' : addingState ? 'Add state' : 'Add city'}
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
    </form>
  );
}
