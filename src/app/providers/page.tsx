import Link from 'next/link';
import { db } from '@/server/db/client';
import { listPublicProviders } from '@/server/services/providers';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';
import { ProviderCard } from '@/components/marketplace/ProviderCard';

type Search = {
  q?: string;
  category?: string;
  location?: string;
  verified?: string;
  sort?: string;
  page?: string;
};

export const metadata = {
  title: 'Find trusted providers - Quick-Konnect',
  description: 'Browse verified local service providers across Nigeria. Filter by category, city, rating and verification status.',
};

export const dynamic = 'force-dynamic';

export default async function ProvidersPage(props: { searchParams: Promise<Search> }) {
  const sp = await props.searchParams;
  const q = (sp.q ?? '').trim();
  const categorySlug = sp.category ?? '';
  const locationSlug = sp.location ?? '';
  const verifiedOnly = sp.verified === '1';
  const sort = (sp.sort ?? 'recommended') as any;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  // Resolve slugs to IDs
  let categoryId: string | undefined;
  if (categorySlug) {
    const cat = await db.serviceCategory.findUnique({ where: { slug: categorySlug } });
    if (cat) categoryId = cat.id;
  }

  let locationId: string | undefined;
  if (locationSlug) {
    const loc = await db.location.findFirst({ where: { slug: locationSlug, type: 'city' } });
    if (loc) locationId = loc.id;
  }

  const [categories, cities] = await Promise.all([
    db.serviceCategory.findMany({
      where: { isActive: true, parentId: { not: null } },
      orderBy: { name: 'asc' },
      take: 60,
    }),
    db.location.findMany({
      where: { type: 'city', isActive: true },
      orderBy: { name: 'asc' },
      take: 40,
    }),
  ]);

  const result = await listPublicProviders({
    q,
    categoryId,
    locationId,
    verifiedOnly,
    sort,
    page,
    pageSize: 24,
  });

  const buildHref = (patch: Partial<Search>) => {
    const next = new URLSearchParams();
    const merged: Search = { q, category: categorySlug, location: locationSlug, verified: verifiedOnly ? '1' : '', sort: sort === 'recommended' ? '' : sort, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '') next.set(k, String(v));
    }
    const s = next.toString();
    return '/providers' + (s ? '?' + s : '');
  };

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Find providers</div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Trusted professionals, ready to work.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            {result.total === 0
              ? 'No providers match these filters yet.'
              : result.total + ' provider' + (result.total === 1 ? '' : 's') + ' on Quick-Konnect.'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <form action="/providers" className="space-y-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Search</label>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Business name"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Category</label>
                <select
                  name="category"
                  defaultValue={categorySlug}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">City</label>
                <select
                  name="location"
                  defaultValue={locationSlug}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">All cities</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.slug} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">Sort by</label>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="recommended" className="bg-slate-900">Recommended</option>
                  <option value="rating" className="bg-slate-900">Highest rated</option>
                  <option value="jobs" className="bg-slate-900">Most jobs done</option>
                  <option value="newest" className="bg-slate-900">Newest</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={verifiedOnly}
                  className="h-4 w-4 rounded border-white/20 bg-black/30 accent-emerald-400"
                />
                <span className="text-xs text-white/70">Face Verified only</span>
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
              >
                Apply filters
              </button>

              {(q || categorySlug || locationSlug || verifiedOnly || sort !== 'recommended') && (
                <Link
                  href="/providers"
                  className="block text-center text-xs text-white/50 hover:text-white"
                >
                  Clear all filters
                </Link>
              )}
            </form>
          </aside>

          {/* Results */}
          <div>
            {result.providers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
                <div className="mb-3 text-4xl">🔍</div>
                <div className="font-medium text-white">No providers match</div>
                <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
                  Try a different category, city, or clear the filters. New providers are added regularly.
                </p>
                <Link
                  href="/providers"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
                >
                  Clear filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.providers.map((p) => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>

                {result.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between text-xs text-white/50">
                    <div>
                      Page {result.page} of {result.totalPages}
                    </div>
                    <div className="flex gap-2">
                      {result.page > 1 && (
                        <Link
                          href={buildHref({ page: String(result.page - 1) })}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
                        >
                          ← Previous
                        </Link>
                      )}
                      {result.page < result.totalPages && (
                        <Link
                          href={buildHref({ page: String(result.page + 1) })}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
                        >
                          Next →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
