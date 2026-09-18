import Link from 'next/link';
import { db } from '@/server/db/client';

export const metadata = { title: 'Admin — Overview' };

export default async function AdminHome() {
  const [
    totalUsers,
    totalProviders,
    verifiedProviders,
    totalCategories,
    totalLocations,
    totalRequests,
    totalJobs,
    completedJobs,
    openDisputes,
  ] = await Promise.all([
    db.user.count(),
    db.providerProfile.count(),
    db.providerProfile.count({ where: { verificationStatus: 'verified' } }),
    db.serviceCategory.count({ where: { isActive: true } }),
    db.location.count({ where: { isActive: true } }),
    db.serviceRequest.count(),
    db.job.count(),
    db.job.count({ where: { status: 'completed' } }),
    db.dispute.count({ where: { status: 'open' } }),
  ]);

  const cards = [
    { label: 'Users',        value: totalUsers,      href: '/admin/users',      hint: 'All accounts' },
    { label: 'Providers',    value: totalProviders,  href: '/admin/providers',  hint: verifiedProviders + ' verified' },
    { label: 'Categories',   value: totalCategories, href: '/admin/categories', hint: 'Active categories' },
    { label: 'Locations',    value: totalLocations,  href: '/admin/locations',  hint: 'Active cities & areas' },
    { label: 'Requests',     value: totalRequests,   href: '/admin/requests',   hint: 'All service requests' },
    { label: 'Jobs',         value: totalJobs,       href: '/admin/jobs',       hint: completedJobs + ' completed' },
    { label: 'Disputes',     value: openDisputes,    href: '/admin/disputes',   hint: 'Open disputes' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-white/50">
        Live snapshot of the marketplace. A zero here means the feature hasn&apos;t
        accumulated real activity yet — not that it is broken.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-white/40">
              {c.label}
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">
              {c.value}
            </div>
            <div className="mt-1 text-[11px] text-white/40">{c.hint}</div>
            <div className="mt-4 text-[11px] font-medium text-blue-300/70 transition group-hover:text-blue-200">
              Open →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="text-sm font-medium text-white mb-2">Admin build roadmap</div>
        <ul className="text-xs text-white/50 leading-relaxed space-y-1.5">
          <li>• <span className="text-white/70">Available now:</span> Overview, Users, Categories, Locations, Settings, Audit</li>
          <li>• <span className="text-white/70">Coming with provider onboarding:</span> Providers list, Verifications queue</li>
          <li>• <span className="text-white/70">Coming with jobs:</span> Requests, Jobs, Disputes</li>
          <li>• <span className="text-white/70">Coming with Protected Payment:</span> Payments monitoring, Readiness review</li>
          <li>• <span className="text-white/70">Coming with reviews:</span> Review moderation</li>
        </ul>
        <p className="mt-4 text-xs text-white/40">
          Every admin page is built alongside the feature it manages — so no page is ever
          a shell over an empty table.
        </p>
      </div>
    </div>
  );
}
