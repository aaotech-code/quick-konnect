import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { getRequestDetailForCustomer } from '@/server/services/requests';
import { Navbar } from '@/components/marketplace/Navbar';
import { AcceptButton } from './AcceptButton';

export const dynamic = 'force-dynamic';

export default async function CustomerRequestDetailPage(props: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await props.params;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  let request;
  try {
    request = await getRequestDetailForCustomer({ publicRef: ref, customerId: ctx.userId });
  } catch {
    notFound();
  }

  // Load provider avatars for the quote cards
  const providerIds = request.quotes.map((q) => q.provider.id);
  const providers = providerIds.length
    ? await (await import('@/server/db/client')).db.providerProfile.findMany({
        where: { id: { in: providerIds } },
        select: { id: true, logoMediaId: true },
      })
    : [];
  const logoIds = providers.map((p) => p.logoMediaId).filter((x): x is string => !!x);
  const media = logoIds.length
    ? await (await import('@/server/db/client')).db.media.findMany({ where: { id: { in: logoIds } } })
    : [];
  const logoMap = new Map(media.map((m) => [m.id, '/uploads/' + m.storageKey]));
  const avatarByProvider = new Map(
    providers.map((p) => [p.id, p.logoMediaId ? logoMap.get(p.logoMediaId) ?? null : null]),
  );

  const dispatchedCount = request.providers.length;
  const quoteCount = request.quotes.length;

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 flex items-center gap-3 text-sm">
          <Link href="/dashboard/requests" className="text-white/40 hover:text-white">← My requests</Link>
          <span className="text-white/20">/</span>
          <span className="font-mono text-white/60">{request.publicRef}</span>
        </div>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/70">
                {request.category.icon ? request.category.icon + ' ' : ''}{request.category.name}
              </span>
              {request.location.parent && (
                <span className="text-[11px] text-white/40">{request.location.parent.name}</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
            <p className="mt-1 text-sm text-white/50">
              Posted {new Date(request.createdAt).toLocaleDateString()}
              {request.preferredDate && ' · Preferred ' + new Date(request.preferredDate).toLocaleDateString()}
            </p>
          </div>
          <span
            className={
              'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ' +
              (request.status === 'open'
                ? quoteCount > 0
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                : 'border-white/10 bg-white/[0.05] text-white/60')
            }
          >
            {request.status === 'open'
              ? quoteCount === 0
                ? 'Waiting for quotes'
                : quoteCount + ' quote' + (quoteCount === 1 ? '' : 's')
              : request.status}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
              <h2 className="mb-3 text-sm font-medium">Your description</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">{request.description}</p>
            </section>

            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Quotes received</h2>
                <span className="text-xs text-white/40">
                  {quoteCount} of {dispatchedCount} provider{dispatchedCount === 1 ? '' : 's'} responded
                </span>
              </div>

              {quoteCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
                  <div className="mb-3 text-4xl">⏳</div>
                  <div className="font-medium text-white">Waiting for quotes</div>
                  <p className="mx-auto mt-1 max-w-md text-sm text-white/50">
                    {dispatchedCount === 0
                      ? 'No providers in this category and city yet. Share Quick-Konnect with providers you know.'
                      : dispatchedCount + ' provider' + (dispatchedCount === 1 ? '' : 's') + ' in ' + request.location.name + ' were notified. Quotes appear here as they arrive.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.quotes.map((q) => {
                    const avatarUrl = avatarByProvider.get(q.provider.id) ?? null;
                    return (
                      <div key={q.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                        <div className="flex items-start gap-4">
                          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white">
                            {avatarUrl ? (
                              <Image src={avatarUrl} alt={q.provider.businessName} fill sizes="48px" className="object-cover" unoptimized />
                            ) : (
                              q.provider.businessName.charAt(0).toUpperCase()
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={'/provider/' + q.provider.slug}
                                target="_blank"
                                className="font-medium hover:text-blue-300"
                              >
                                {q.provider.businessName}
                              </Link>
                              {Number(q.provider.ratingAvg) > 0 && (
                                <span className="text-xs text-amber-300">
                                  ★ {Number(q.provider.ratingAvg).toFixed(1)}
                                  <span className="text-white/40"> ({q.provider.ratingCount})</span>
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-baseline gap-3">
                              <div className="text-2xl font-semibold tracking-tight">
                                ₦{Math.round(q.amountKobo / 100).toLocaleString()}
                              </div>
                              {q.durationEstimate && (
                                <span className="text-xs text-white/50">
                                  · {q.durationEstimate}
                                </span>
                              )}
                            </div>

                            <p className="mt-3 text-sm leading-6 text-white/70 whitespace-pre-wrap">
                              {q.description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-white/45">
                              {q.materialsIncluded ? (
                                <span className="text-emerald-200/80">✓ Materials included</span>
                              ) : (
                                <span>Materials not included</span>
                              )}
                              {q.conditions && <span>· {q.conditions}</span>}
                              {q.availableFrom && (
                                <span>· Available from {new Date(q.availableFrom).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                          <Link
                            href={'/provider/' + q.provider.slug}
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            View full profile
                          </Link>
                          {request.status === 'open' && (
                            <AcceptButton
                              requestRef={request.publicRef}
                              quoteId={q.id}
                              providerName={q.provider.businessName}
                              amountFormatted={'₦' + Math.round(q.amountKobo / 100).toLocaleString()}
                            />
                          )}
                          {request.status !== 'open' && q.status === 'accepted' && (
                            <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200">
                              ✓ Accepted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/40">Details</div>
              </div>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-white/40">Category</dt>
                  <dd className="mt-0.5 text-white/80">{request.category.name}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Location</dt>
                  <dd className="mt-0.5 text-white/80">
                    {request.location.name}
                    {request.location.parent && ' · ' + request.location.parent.name}
                  </dd>
                </div>
                {(request.budgetMin || request.budgetMax) && (
                  <div>
                    <dt className="text-white/40">Your budget</dt>
                    <dd className="mt-0.5 text-white/80">
                      ₦{request.budgetMin ? Math.round(request.budgetMin / 100).toLocaleString() : '—'}
                      {' – '}
                      ₦{request.budgetMax ? Math.round(request.budgetMax / 100).toLocaleString() : '—'}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-white/40">Providers notified</dt>
                  <dd className="mt-0.5 text-white/80">{dispatchedCount}</dd>
                </div>
              </dl>

              <div className="border-t border-white/[0.06] pt-4">
                <Link
                  href="/dashboard/requests"
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center text-xs font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Back to my requests
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
