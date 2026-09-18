import { db } from '@/server/db/client';
import { LocationRow } from './LocationRow';
import { AddLocationPanel } from './AddLocationPanel';

export const metadata = { title: 'Admin — Locations' };

export default async function AdminLocationsPage() {
  const countries = await db.location.findMany({
    where: { type: 'country' },
    orderBy: { name: 'asc' },
    include: {
      children: {
        orderBy: { name: 'asc' },
        include: { children: { orderBy: { name: 'asc' } } },
      },
    },
  });

  const totalActive = await db.location.count({ where: { isActive: true } });
  const totalAll = await db.location.count();
  const featuredCount = await db.location.count({ where: { type: 'city', isFeatured: true, isActive: true } });
  const totalStates = await db.location.count({ where: { type: 'state' } });
  const totalCities = await db.location.count({ where: { type: 'city' } });

  const stateOptions = countries.flatMap((c) =>
    c.children.map((s) => ({
      id: s.id,
      label: (c.name === 'Nigeria' ? '' : c.name + ' → ') + s.name,
    })),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="mt-1 text-sm text-white/50">
            {totalStates} states &middot; {totalCities} cities &middot; {totalActive} of {totalAll} active
          </p>

        <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-100/80">
          <span className="font-medium text-amber-100">★ Featured cities</span> appear on the public homepage. Click a star below to feature or unfeature a city — changes go live immediately.
          {featuredCount > 0
            ? ` Currently featuring ${featuredCount} cit${featuredCount === 1 ? 'y' : 'ies'}.`
            : ' No cities featured yet — the homepage falls back to showing any active city.'}
        </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Tree */}
        <div className="space-y-8">
          {countries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <div className="text-sm text-white/50">No countries seeded.</div>
            </div>
          )}

          {countries.map((country) => (
            <section key={country.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">🌍</span>
                <h2 className="text-lg font-semibold tracking-tight">{country.name}</h2>
                <span className="text-xs text-white/40">
                  {country.children.length} states
                </span>
              </div>

              <div className="space-y-3">
                {country.children.map((state) => (
                  <div
                    key={state.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">📍</span>
                        <span className="font-medium">{state.name}</span>
                        <span className="text-xs text-white/40">
                          {state.children.length} {state.children.length === 1 ? 'city' : 'cities'}
                        </span>
                      </div>
                      <span
                        className={
                          'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                          (state.isActive
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                            : 'border-red-400/30 bg-red-400/10 text-red-200')
                        }
                      >
                        {state.isActive ? 'active' : 'inactive'}
                      </span>
                    </div>

                    {state.children.length === 0 ? (
                      <p className="text-xs text-white/40">No cities yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {state.children.map((city) => (
                          <LocationRow
                            key={city.id}
                            id={city.id}
                            name={city.name}
                            slug={city.slug}
                            isActive={city.isActive}
                            isFeatured={city.isFeatured}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Sidebar: add panel */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AddLocationPanel states={stateOptions} />

          <p className="mt-4 text-[11px] leading-relaxed text-white/40">
            New locations default to <strong className="text-white/60">active</strong>.
            If you&apos;re preparing a new city before recruiting providers, toggle it
            to <strong className="text-white/60">inactive</strong> in the tree so customers
            don&apos;t land on an empty marketplace.
          </p>
        </aside>
      </div>
    </div>
  );
}
