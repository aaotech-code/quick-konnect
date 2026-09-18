import Link from 'next/link';
import { db } from '@/server/db/client';
import { jobStatusLabel } from '@/server/services/jobs';

export const metadata = { title: 'Admin - Jobs' };
export const dynamic = 'force-dynamic';

type Search = { status?: string; q?: string };

const STATUSES = [
  'provider_selected',
  'awaiting_payment',
  'payment_secured',
  'scheduled',
  'in_progress',
  'provider_marked_complete',
  'customer_confirmed',
  'completed',
  'cancelled',
  'disputed',
];

export default async function AdminJobsPage(props: { searchParams: Promise<Search> }) {
  const sp = await props.searchParams;
  const statusFilter = sp.status ?? '';
  const q = (sp.q ?? '').trim();

  const where: any = {};
  if (statusFilter) where.status = statusFilter;
  if (q) {
    where.OR = [
      { publicRef: { contains: q, mode: 'insensitive' } },
      { request: { title: { contains: q, mode: 'insensitive' } } },
      { provider: { businessName: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const jobs = await db.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      request: { include: { category: true, location: true } },
      provider: { include: { user: { select: { email: true } } } },
    },
  });

  const customerIds = jobs.map((j) => j.customerId);
  const customers = customerIds.length
    ? await db.user.findMany({
        where: { id: { in: customerIds } },
        include: { customerProfile: true },
      })
    : [];
  const customerMap = new Map(
    customers.map((c) => [c.id, c.customerProfile?.fullName ?? c.email]),
  );

  const totalCount = await db.job.count();
  const statusCounts = await db.job.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  const statusCountMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-white/50">
            {jobs.length} of {totalCount} job{totalCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form className="mt-6 flex flex-wrap gap-2" action="/admin/jobs">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by job ref, title, or provider..."
          className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="" className="bg-slate-900">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-slate-900">
              {jobStatusLabel(s).label}{statusCountMap[s] ? ' (' + statusCountMap[s] + ')' : ''}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
        >
          Filter
        </button>
        {(q || statusFilter) && (
          <Link
            href="/admin/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Clear
          </Link>
        )}
      </form>

      {jobs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-4xl">🛠️</div>
          <div className="font-medium text-white">No jobs match</div>
          <p className="mt-1 text-sm text-white/50">
            {q || statusFilter ? 'Try a different filter.' : 'Jobs will appear here when customers hire providers.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.08] bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Provider</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Customer</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {jobs.map((j) => {
                const status = jobStatusLabel(j.status);
                return (
                  <tr key={j.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[11px] text-white/50">{j.publicRef}</div>
                      <div className="mt-0.5 truncate text-sm font-medium text-white">{j.request.title}</div>
                      <div className="mt-0.5 truncate text-[11px] text-white/40">
                        {j.request.category.name} · {j.request.location.name}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      <div className="text-sm text-white/80">{j.provider.businessName}</div>
                      <div className="mt-0.5 text-[11px] text-white/40">{j.provider.user.email}</div>
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      <div className="text-sm text-white/80">{customerMap.get(j.customerId) ?? '—'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="text-sm font-medium text-white">
                        ₦{Math.round(j.agreedAmountKobo / 100).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                          (status.color === 'emerald' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' :
                           status.color === 'blue' ? 'border-blue-400/30 bg-blue-400/10 text-blue-200' :
                           status.color === 'amber' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' :
                           status.color === 'violet' ? 'border-violet-400/30 bg-violet-400/10 text-violet-200' :
                           status.color === 'red' ? 'border-red-400/30 bg-red-400/10 text-red-200' :
                           'border-white/10 bg-white/[0.05] text-white/60')
                        }
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={'/jobs/' + j.publicRef}
                        target="_blank"
                        className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
