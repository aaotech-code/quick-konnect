import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { listRequestsForProvider, getProviderDispatchDiagnostics } from '@/server/services/requests';

export const metadata = { title: 'Job requests — Provider' };
export const dynamic = 'force-dynamic';

export default async function ProRequestsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  if (!ctx.roles.includes('provider')) redirect('/pro/onboarding');

  const diagnostics = await getProviderDispatchDiagnostics(ctx.userId);


  let requests: Awaited<ReturnType<typeof listRequestsForProvider>> = [];
  try {
    requests = await listRequestsForProvider(ctx.userId);
  } catch {
    redirect('/pro/onboarding');
  }

  const newOnes = requests.filter((r) => !r.declinedAt && !r.myQuote);
  const quoted = requests.filter((r) => r.myQuote);
  const declined = requests.filter((r) => r.declinedAt);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job requests</h1>
          <p className="mt-1 text-sm text-white/50">
            {newOnes.length > 0
              ? newOnes.length + ' waiting for your quote'
              : requests.length === 0
              ? 'No requests yet — keep your profile complete.'
              : 'You are all caught up.'}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-4xl">📬</div>
          <div className="font-medium text-white">No requests yet</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
            When customers in your cities post jobs matching your services, they will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {newOnes.length > 0 && (
            <Section title="Waiting for your quote" count={newOnes.length}>
              {newOnes.map((r) => <RequestCard key={r.id} r={r} highlight />)}
            </Section>
          )}

          {quoted.length > 0 && (
            <Section title="You sent a quote" count={quoted.length}>
              {quoted.map((r) => <RequestCard key={r.id} r={r} />)}
            </Section>
          )}

          {declined.length > 0 && (
            <Section title="You declined" count={declined.length} muted>
              {declined.map((r) => <RequestCard key={r.id} r={r} />)}
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

function RequestCard(props: {
  r: Awaited<ReturnType<typeof listRequestsForProvider>>[number];
  highlight?: boolean;
}) {
  const r = props.r;
  const amount = r.myQuote ? Math.round(r.myQuote.amountKobo / 100).toLocaleString() : null;

  return (
    <Link
      href={'/pro/requests/' + r.publicRef}
      className={
        'group block rounded-2xl border bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05] ' +
        (props.highlight && !r.viewedAt ? 'border-blue-400/40 bg-blue-400/[0.04]' : 'border-white/[0.08]')
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-white/40">{r.publicRef}</span>
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/60">
              {r.categoryIcon ? r.categoryIcon + ' ' : ''}{r.categoryName}
            </span>
            {props.highlight && !r.viewedAt && (
              <span className="rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                New
              </span>
            )}
          </div>
          <div className="mt-2 text-base font-medium text-white">{r.title}</div>
          <div className="mt-1.5 text-xs text-white/45">
            {r.locationName}
            {r.preferredDate && ' · ' + new Date(r.preferredDate).toLocaleDateString()}
            {(r.budgetMin || r.budgetMax) && (
              <> · Budget ₦{r.budgetMin ? Math.round(r.budgetMin / 100).toLocaleString() : '—'}–{r.budgetMax ? Math.round(r.budgetMax / 100).toLocaleString() : '—'}</>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {amount ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200">
              Your quote: ₦{amount}
            </div>
          ) : r.declinedAt ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/40">
              Declined
            </div>
          ) : (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-medium text-amber-200">
              Send quote
            </div>
          )}
          <div className="mt-2 text-[10px] text-white/40 group-hover:text-blue-300">
            View details →
          </div>
        </div>
      </div>
    </Link>
  );
}
