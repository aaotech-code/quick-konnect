import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { PortfolioManager } from './PortfolioManager';

export const metadata = { title: 'Portfolio — Provider' };

export default async function PortfolioPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const profile = await db.providerProfile.findUnique({
    where: { userId: ctx.userId },
    include: {
      portfolio: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!profile) redirect('/pro/onboarding');

  const media = await db.media.findMany({
    where: { id: { in: profile.portfolio.map((p) => p.mediaId) } },
  });
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  const items = profile.portfolio.map((p) => {
    const m = mediaMap.get(p.mediaId);
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      publicUrl: m ? '/uploads/' + m.storageKey : '',
    };
  });

  return (
    <div>
      <div className="mb-8 text-sm text-white/40">
        <Link href="/pro" className="hover:text-white">Provider</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Portfolio</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-white/50 max-w-2xl">
            Show up to 10 photos of previous work. This is the single biggest driver of trust —
            providers with photos get hired far more often. Customers want to see real work, not claims.
          </p>
        </div>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
          {items.length} / 10
        </span>
      </div>

      <PortfolioManager initial={items} providerSlug={profile.slug} />
    </div>
  );
}
