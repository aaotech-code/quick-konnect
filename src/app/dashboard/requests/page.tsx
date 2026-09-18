import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { listCustomerRequests } from '@/server/services/requests';
import { Navbar } from '@/components/marketplace/Navbar';

export const metadata = { title: 'My jobs — Quick-Konnect' };
export const dynamic = 'force-dynamic';

export default async function MyRequestsPage(props: {
  searchParams: Promise<{ posted?: string }>;
}) {
  const sp = await props.searchParams;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const requests = await listCustomerRequests(ctx.userId);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">My jobs</div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">Requests</h1>
            <p className="mt-1 text-sm text-white/50">
              {requests.length === 0
                ? 'Nothing posted yet.'
                : requests.length + ' request' + (requests.length === 1 ? '' : 's')}
            </p>
          </div>
          <Link
            href="/request/new"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
          >
            + Post a job
          </Link>
        </div>

        {sp.posted && (
          <div className="mb-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100">
            <div className="font-medium">Job posted — reference {sp.posted}</div>
            <p className="mt-1 text-xs text-emerald-100/70">
              Verified providers in your area have been notified. Quotes will appear here as they come in.
            </p>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-4xl">📋</div>
            <div className="font-medium text-white">No requests yet</div>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
              Post your first job. Providers in your city will send you quotes to compare.
            </p>
            <Link
              href="/request/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
            >
              Post your first job →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const quoteCount = r._count.quotes;
              const statusLabel =
                r.status === 'open'
                  ? quoteCount === 0
                    ? 'Waiting for quotes'
                    : quoteCount + ' quote' + (quoteCount === 1 ? '' : 's') + ' received'
                  : r.status;
              return (
                <Link
                  key={r.id}
                  href={'/requests/' + r.publicRef}
                  className="group block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-white/40">{r.publicRef}</span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/60">
                          {r.category.icon ? r.category.icon + ' ' : ''}{r.category.name}
                        </span>
                      </div>
                      <div className="mt-2 truncate text-base font-medium text-white">{r.title}</div>
                      <div className="mt-1.5 text-xs text-white/45">
                        {r.location.name}
                        {r.preferredDate && ' · ' + new Date(r.preferredDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={
                          'rounded-lg border px-3 py-1.5 text-[11px] font-medium ' +
                          (quoteCount > 0
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                            : 'border-amber-400/30 bg-amber-400/10 text-amber-200')
                        }
                      >
                        {statusLabel}
                      </div>
                      <div className="mt-2 text-[10px] text-white/40 group-hover:text-blue-300">
                        View details →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
