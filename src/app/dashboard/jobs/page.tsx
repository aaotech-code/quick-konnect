import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { listCustomerJobs, jobStatusLabel } from '@/server/services/jobs';
import { Navbar } from '@/components/marketplace/Navbar';

export const metadata = { title: 'My jobs — Quick-Konnect' };
export const dynamic = 'force-dynamic';

export default async function MyJobsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const jobs = await listCustomerJobs(ctx.userId);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">My jobs</div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">Jobs</h1>
            <p className="mt-1 text-sm text-white/50">
              {jobs.length === 0
                ? 'No jobs yet.'
                : jobs.length + ' job' + (jobs.length === 1 ? '' : 's')}
            </p>
          </div>
          <Link
            href="/dashboard/requests"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
          >
            My requests →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-4xl">🛠️</div>
            <div className="font-medium text-white">No jobs yet</div>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
              When you accept a quote on one of your requests, the job appears here.
            </p>
            <Link
              href="/dashboard/requests"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
            >
              View my requests →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => {
              const status = jobStatusLabel(j.status);
              return (
                <Link
                  key={j.id}
                  href={'/jobs/' + j.publicRef}
                  className="group block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start gap-4">
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white">
                      {j.provider?.avatarUrl ? (
                        <Image src={j.provider.avatarUrl} alt={j.provider.businessName} fill sizes="48px" className="object-cover" unoptimized />
                      ) : (
                        (j.provider?.businessName ?? '?').charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-white/40">{j.publicRef}</span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/60">
                          {j.categoryIcon ? j.categoryIcon + ' ' : ''}{j.categoryName}
                        </span>
                      </div>
                      <div className="mt-2 truncate text-base font-medium text-white">{j.title}</div>
                      <div className="mt-1.5 text-xs text-white/45">
                        {j.provider?.businessName && <>{j.provider.businessName} · </>}
                        {j.locationName}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-white">
                        ₦{Math.round(j.agreedAmountKobo / 100).toLocaleString()}
                      </div>
                      <div
                        className={
                          'mt-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                          (status.color === 'emerald' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' :
                           status.color === 'blue' ? 'border-blue-400/30 bg-blue-400/10 text-blue-200' :
                           status.color === 'amber' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' :
                           status.color === 'violet' ? 'border-violet-400/30 bg-violet-400/10 text-violet-200' :
                           status.color === 'red' ? 'border-red-400/30 bg-red-400/10 text-red-200' :
                           'border-white/10 bg-white/[0.05] text-white/60')
                        }
                      >
                        {status.label}
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
