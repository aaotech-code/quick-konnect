import Link from 'next/link';
import { db } from '@/server/db/client';

export const metadata = { title: 'Admin - Service Requests' };
export const dynamic = 'force-dynamic';

type Search = { status?: string; q?: string };

const STATUSES = ['open', 'closed', 'expired', 'cancelled'];

const STATUS_STYLES: Record<string, string> = {
  open: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  closed: 'border-white/10 bg-white/[0.05] text-white/60',
  expired: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  cancelled: 'border-red-400/30 bg-red-400/10 text-red-200',
};

export default async function AdminRequestsPage(props: { searchParams: Promise<Search> }) {
  const sp = await props.searchParams;
  const statusFilter = sp.status ?? '';
  const q = (sp.q ?? '').trim();

  const where: any = {};
  if (statusFilter) where.status = statusFilter;
  if (q) {
    where.OR = [
      { publicRef: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
    ];
  }

  const requests = await db.serviceRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      category: true,
      location: true,
      _count: { select: { quotes: true, providers: true } },
    },
  });

  const customerIds = requests.map((r) => r.customerId);
  const customers = customerIds.length
    ? await db.user.findMany({
        where: { id: { in: customerIds } },
        include: { customerProfile: true },
      })
    : [];
  const customerMap = new Map(
    customers.map((c) => [c.id, c.customerProfile?.fullName ?? c.email]),
  );

  const totalCount = await db.serviceRequest.count();
  const statusCounts = await db.serviceRequest.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  const statusCountMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service Requests</h1>
          <p className="mt-1 text-sm text-white/50">
            {requests.length} of {totalCount} request{totalCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/requests">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by ref or title..."
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
              {s}{statusCountMap[s] ? ' (' + statusCountMap[s] + ')' : ''}
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
            href="/admin/requests"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Clear
          </Link>
        )}
      </form>

      {requests.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <div className="font-medium text-white">No requests match</div>
          <p className="mt-1 text-sm text-white/50">
            {q || statusFilter ? 'Try a different filter.' : 'Requests will appear here when customers post jobs.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.08] bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Customer</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Reach</th>
                <th className="px-5 py-3 font-medium text-right">Quotes</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {requests.map((r) => (
                <tr key={r.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-[11px] text-white/50">{r.publicRef}</div>
                    <div className="mt-0.5 truncate text-sm font-medium text-white">{r.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-white/40">
                      {r.category.icon ? r.category.icon + ' ' : ''}{r.category.name} · {r.location.name}
                    </div>
                  </td>
                  <td className="hidden px-5 py-3.5 lg:table-cell">
                    <div className="text-sm text-white/80">{customerMap.get(r.customerId) ?? '—'}</div>
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <div className="text-xs text-white/60">
                      {r._count.providers} provider{r._count.providers === 1 ? '' : 's'} notified
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="text-sm font-medium text-white">{r._count.quotes}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={
                        'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                        (STATUS_STYLES[r.status] ?? 'border-white/10 bg-white/[0.05] text-white/60')
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={'/requests/' + r.publicRef}
                      target="_blank"
                      className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
