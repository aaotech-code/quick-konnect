import Link from 'next/link';
import { db } from '@/server/db/client';

type Search = { event?: string; page?: string };

export const metadata = { title: 'Admin — Audit log' };

const PAGE_SIZE = 50;

export default async function AdminAuditPage(props: {
  searchParams: Promise<Search>;
}) {
  const sp = await props.searchParams;
  const eventFilter = sp.event ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = eventFilter ? { event: eventFilter } : {};

  const [total, rows, eventTypes] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: { user: { select: { email: true } } },
    }),
    db.auditLog.groupBy({
      by: ['event'],
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take: 40,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="mt-1 text-sm text-white/50">
            {total.toLocaleString()} event{total === 1 ? '' : 's'} &middot; Append-only, immutable at the database level
          </p>
        </div>
      </div>

      {/* Event type chips */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        <Link
          href="/admin/audit"
          className={
            'rounded-full border px-3 py-1 text-[11px] font-medium transition ' +
            (!eventFilter
              ? 'border-white/20 bg-white/10 text-white'
              : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white')
          }
        >
          All
        </Link>
        {eventTypes.map((e) => (
          <Link
            key={e.event}
            href={'/admin/audit?event=' + encodeURIComponent(e.event)}
            className={
              'rounded-full border px-3 py-1 text-[11px] font-medium transition ' +
              (eventFilter === e.event
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white')
            }
          >
            {e.event}
            <span className="ml-1.5 text-white/30">{e._count.event}</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-3xl">📋</div>
          <div className="font-medium text-white">No events yet</div>
          <p className="mt-1 text-sm text-white/50">
            Admin actions and security events appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Actor</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Target</th>
                  <th className="px-5 py-3 font-medium text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((a) => (
                  <tr key={a.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs text-white/90">{a.event}</div>
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-white/60 sm:table-cell">
                      {a.user?.email ?? <span className="text-white/30">system</span>}
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-white/50 md:table-cell">
                      {a.entityType ? (
                        <span>
                          {a.entityType}
                          {a.entityId && (
                            <span className="ml-1.5 font-mono text-[10px] text-white/30">
                              {a.entityId.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-white/40">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between text-xs text-white/50">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={'/admin/audit?' + new URLSearchParams({ ...(eventFilter && { event: eventFilter }), page: String(page - 1) }).toString()}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
                  >
                    ← Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={'/admin/audit?' + new URLSearchParams({ ...(eventFilter && { event: eventFilter }), page: String(page + 1) }).toString()}
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
  );
}
