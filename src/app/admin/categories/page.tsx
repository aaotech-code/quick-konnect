import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/server/db/client';

type Search = { parent?: string };

export default async function AdminCategoriesPage(props: {
  searchParams: Promise<Search>;
}) {
  const { parent: parentSlug } = await props.searchParams;

  const parents = await db.serviceCategory.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (parents.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-6 text-sm text-white/50">No categories seeded yet.</p>
      </div>
    );
  }

  const active = parentSlug
    ? parents.find((p) => p.slug === parentSlug) ?? parents[0]
    : parents[0];

  const total = parents.reduce((s, p) => s + p.children.length, 0);

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-white/50">
            {parents.length} parent categories &middot; {total} services total
          </p>
        </div>
        <Link
          href="/services"
          target="_blank"
          className="text-xs font-medium text-white/50 transition hover:text-white"
        >
          View public page ↗
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2">
            {parents.map((p) => {
              const isActive = p.slug === active.slug;
              return (
                <Link
                  key={p.id}
                  href={'/admin/categories?parent=' + p.slug}
                  className={
                    'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ' +
                    (isActive
                      ? 'bg-white/[0.07] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white')
                  }
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="text-base leading-none">{p.icon ?? '•'}</span>
                    <span className="truncate font-medium">{p.name}</span>
                  </span>
                  <span
                    className={
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ' +
                      (isActive
                        ? 'bg-blue-500/20 text-blue-200'
                        : 'bg-white/[0.05] text-white/40')
                    }
                  >
                    {p.children.length}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Detail panel */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-lg">
              {active.icon ?? '•'}
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{active.name}</h2>
              <div className="text-xs text-white/40">
                {active.children.length} service
                {active.children.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {active.children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
              <div className="text-sm text-white/60">
                No services in this category yet.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {active.children.map((child) => (
                <Link
                  key={child.id}
                  href={'/admin/categories/' + child.slug}
                  className="group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="relative aspect-[5/3] bg-[#0b0f16]">
                    {child.imageUrl ? (
                      <Image
                        src={child.imageUrl}
                        alt={child.name}
                        fill
                        sizes="(min-width:1024px) 20vw, 40vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl opacity-30">
                        {child.icon}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="truncate text-sm font-medium">
                      {child.name}
                    </span>
                    <span className="ml-2 shrink-0 text-[10px] font-medium text-white/40 transition group-hover:text-blue-300">
                      Edit →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
