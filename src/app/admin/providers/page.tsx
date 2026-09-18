import Link from 'next/link';
import { db } from '@/server/db/client';

export const metadata = { title: 'Admin — Providers' };

export default async function AdminProvidersPage() {
  const providers = await db.providerProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
      categories: { include: { category: true } },
      locations: { include: { location: true } },
    },
  });

  const counts = {
    total: providers.length,
    verified: providers.filter((p) => p.verificationStatus === 'verified').length,
    pending: providers.filter((p) => p.verificationStatus === 'pending' || p.verificationStatus === 'identity_submitted').length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Providers</h1>
          <p className="mt-1 text-sm text-white/50">
            {counts.total} total &middot; {counts.verified} verified &middot; {counts.pending} pending verification
          </p>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-4xl">🔧</div>
          <div className="font-medium text-white">No providers yet</div>
          <p className="mt-1 text-sm text-white/50 max-w-md mx-auto">
            When providers complete onboarding, they appear here. You can also register
            a provider on their behalf — coming in the next batch.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Link
              key={p.id}
              href={'/provider/' + p.slug}
              target="_blank"
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.businessName}</div>
                  <div className="mt-0.5 truncate text-xs text-white/40">{p.user.email}</div>
                </div>
                <span
                  className={
                    'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                    (p.verificationStatus === 'verified'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : p.verificationStatus === 'rejected'
                      ? 'border-red-400/30 bg-red-400/10 text-red-200'
                      : 'border-amber-400/30 bg-amber-400/10 text-amber-200')
                  }
                >
                  {p.verificationStatus.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.categories.slice(0, 3).map((pc) => (
                  <span key={pc.categoryId} className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/60">
                    {pc.category.name}
                  </span>
                ))}
                {p.categories.length > 3 && (
                  <span className="text-[10px] text-white/40">
                    +{p.categories.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>{p.locations.length} area{p.locations.length === 1 ? '' : 's'}</span>
                <span className="text-blue-300/80 group-hover:text-blue-200">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
