import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { getRequestForProvider } from '@/server/services/requests';
import { QuoteForm } from './QuoteForm';
import { DeclineButton } from './DeclineButton';

export const dynamic = 'force-dynamic';

export default async function ProRequestDetailPage(props: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await props.params;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  let data;
  try {
    data = await getRequestForProvider({ publicRef: ref, userId: ctx.userId });
  } catch {
    notFound();
  }

  const { request, myQuote, declinedAt } = data;

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 text-sm">
        <Link href="/pro/requests" className="text-white/40 hover:text-white">← Requests</Link>
        <span className="text-white/20">/</span>
        <span className="font-mono text-white/60">{request.publicRef}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/70">
              {request.category.parent?.icon ?? ''} {request.category.parent?.name ?? ''} → {request.category.name}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
          <p className="mt-1 text-sm text-white/50">
            Customer in {request.location.name}
            {request.preferredDate && ' · Preferred ' + new Date(request.preferredDate).toLocaleDateString()}
          </p>
        </div>
        <span
          className={
            'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ' +
            (request.status === 'open'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border-white/10 bg-white/[0.05] text-white/60')
          }
        >
          {request.status}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Description */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <h2 className="mb-3 text-sm font-medium">Job description</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">{request.description}</p>
          </section>

          {/* Details grid */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <h2 className="mb-5 text-sm font-medium">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-white/40">Location</dt>
                <dd className="mt-1 text-white/85">
                  {request.location.name}
                  {request.location.parent && (
                    <span className="text-white/40"> · {request.location.parent.name}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Budget</dt>
                <dd className="mt-1 text-white/85">
                  {request.budgetMin || request.budgetMax ? (
                    <>
                      ₦{request.budgetMin ? Math.round(request.budgetMin / 100).toLocaleString() : '—'}
                      {' – '}
                      ₦{request.budgetMax ? Math.round(request.budgetMax / 100).toLocaleString() : '—'}
                    </>
                  ) : (
                    <span className="text-white/40">Not specified</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Preferred date</dt>
                <dd className="mt-1 text-white/85">
                  {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : <span className="text-white/40">Flexible</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Posted</dt>
                <dd className="mt-1 text-white/85">
                  {new Date(request.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Right column — quote form */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {declinedAt ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-sm font-medium mb-2">You declined this request</div>
              <p className="text-xs text-white/50">
                You cannot send a quote for a request you have already declined.
              </p>
            </div>
          ) : (
            <QuoteForm
              publicRef={request.publicRef}
              initialQuote={
                myQuote
                  ? {
                      amountNaira: Math.round(myQuote.amountKobo / 100),
                      durationEstimate: myQuote.durationEstimate ?? '',
                      description: myQuote.description,
                      materialsIncluded: myQuote.materialsIncluded,
                      materialsNotes: myQuote.materialsNotes ?? '',
                      conditions: myQuote.conditions ?? '',
                      availableFrom: myQuote.availableFrom
                        ? new Date(myQuote.availableFrom).toISOString().slice(0, 10)
                        : '',
                      isUpdate: true,
                    }
                  : null
              }
              onDecline={<DeclineButton publicRef={request.publicRef} />}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
