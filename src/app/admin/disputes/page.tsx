import Link from 'next/link';
import { listOpenDisputes, listResolvedDisputes } from '@/server/services/disputes';
import { DisputeQueue } from './DisputeQueue';

export const metadata = { title: 'Admin — Disputes' };
export const dynamic = 'force-dynamic';

export default async function AdminDisputesPage() {
  const [open, resolved] = await Promise.all([
    listOpenDisputes(),
    listResolvedDisputes(20),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
          <p className="mt-1 text-sm text-white/50">
            {open.length} open &middot; {resolved.length} recently resolved
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
          Open disputes
        </div>
        {open.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-4xl">🤝</div>
            <div className="font-medium text-white">Nothing to review</div>
            <p className="mt-1 text-sm text-white/50">
              Customer and provider disputes will appear here.
            </p>
          </div>
        ) : (
          <DisputeQueue
            items={open.map((d) => ({
              id: d.id,
              jobRef: d.job.publicRef,
              jobTitle: d.job.request.title,
              categoryName: d.job.request.category.name,
              providerName: d.job.provider.businessName,
              providerEmail: d.job.provider.user.email,
              reasonCode: d.reasonCode,
              description: d.description,
              requestedResolution: d.requestedResolution,
              openedAt: d.createdAt.toISOString(),
              openedBy: d.openedBy === d.job.customerId ? 'customer' : 'provider',
            }))}
          />
        )}
      </div>

      {resolved.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
            Recently resolved
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Provider</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 text-right font-medium">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {resolved.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3">
                      <Link href={'/jobs/' + d.job.publicRef} target="_blank" className="text-white hover:text-blue-300">
                        {d.job.publicRef}
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3 text-white/70 sm:table-cell">{d.job.provider.businessName}</td>
                    <td className="px-5 py-3">
                      <span className={
                        'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                        (d.status === 'cancelled'
                          ? 'border-white/10 bg-white/[0.05] text-white/60'
                          : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200')
                      }>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-white/50">
                      {d.resolvedAt ? new Date(d.resolvedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
