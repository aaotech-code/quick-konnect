import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { listProviderJobs, jobStatusLabel } from '@/server/services/jobs';

export const metadata = { title: 'My jobs — Provider' };
export const dynamic = 'force-dynamic';

export default async function ProJobsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  if (!ctx.roles.includes('provider')) redirect('/pro/onboarding');

  const jobs = await listProviderJobs(ctx.userId);

  const active = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status));
  const past = jobs.filter((j) => ['completed', 'cancelled'].includes(j.status));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My jobs</h1>
          <p className="mt-1 text-sm text-white/50">
            {jobs.length === 0
              ? 'No jobs yet — send quotes to win work.'
              : active.length + ' active · ' + past.length + ' past'}
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-4xl">🛠️</div>
          <div className="font-medium text-white">No jobs yet</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
            When a customer accepts your quote, the job appears here.
          </p>
          <Link
            href="/pro/requests"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
          >
            View requests →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {active.length > 0 && (
            <Section title="Active" count={active.length}>
              {active.map((j) => <JobCard key={j.id} j={j} />)}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="Past" count={past.length} muted>
              {past.map((j) => <JobCard key={j.id} j={j} />)}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section(props: { title: string; count: number; children: React.ReactNode; muted?: boolean }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className={'text-sm font-medium uppercase tracking-wider ' + (props.muted ? 'text-white/30' : 'text-white/60')}>{props.title}</h2>
        <span className="text-xs text-white/30">{props.count}</span>
      </div>
      <div className="space-y-3">{props.children}</div>
    </section>
  );
}

function JobCard(props: { j: Awaited<ReturnType<typeof listProviderJobs>>[number] }) {
  const j = props.j;
  const status = jobStatusLabel(j.status);
  return (
    <Link
      href={'/jobs/' + j.publicRef}
      className="group block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-bold text-white">
          {(j.customer?.name ?? '?').charAt(0).toUpperCase()}
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
            {j.customer?.name && <>{j.customer.name} · </>}
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
}
