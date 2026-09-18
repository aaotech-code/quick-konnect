import Link from 'next/link';
import { db } from '@/server/db/client';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';
import { CategoryCard } from '@/components/marketplace/CategoryCard';

export const metadata = {
  title: 'Browse all services — Quick-Konnect',
  description:
    'Explore every category of local service on Quick-Konnect — from plumbing and cleaning to design and events.',
};

export default async function ServicesPage() {
  const categories = await db.serviceCategory.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  const totalServices = categories.reduce((sum, c) => sum + c.children.length, 0);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute -top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-14 sm:pt-20 sm:pb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] text-white/60 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {totalServices} services across {categories.length} categories
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Every service,
            <span className="block bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
              one trusted marketplace.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/50">
            Browse by category to discover verified local professionals, compare quotes,
            and hire with confidence. Providers are being added city by city.
          </p>
        </div>
      </section>

      {/* Category sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="space-y-16 sm:space-y-20">
          {categories.map((parent) => (
            <div key={parent.id}>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-xl">
                    {parent.icon ?? '•'}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      {parent.name}
                    </h2>
                    <div className="text-xs text-white/40">
                      {parent.children.length} service{parent.children.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
                <Link
                  href={'/services?category=' + parent.slug}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white"
                >
                  View all
                  <span className="text-white/30">→</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {parent.children.map((child) => (
                  <CategoryCard
                    key={child.id}
                    slug={child.slug}
                    name={child.name}
                    icon={child.icon}
                    imageUrl={child.imageUrl}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-3xl">📭</div>
            <div className="mb-1 font-medium text-white">No categories yet</div>
            <p className="mx-auto max-w-md text-sm text-white/50">
              Categories will appear here once seeded.
            </p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] bg-[#080b11]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Can&apos;t find what you need?
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Post what you need and let providers come to you with quotes.
              </p>
            </div>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
            >
              Request a service
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
