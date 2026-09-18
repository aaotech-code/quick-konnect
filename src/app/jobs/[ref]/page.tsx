import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { getJobForUser, jobStatusLabel, getJobReview } from '@/server/services/jobs';
import { getLatestDisputeForJob, reasonLabel, resolutionLabel } from '@/server/services/disputes';
import { DisputeButton } from './DisputeButton';
import { JobLifecycleActions } from './JobLifecycleActions';
import { ReviewForm } from './ReviewForm';
import { Navbar } from '@/components/marketplace/Navbar';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ ref: string }> }) {
  const { ref } = await props.params;
  return { title: ref + ' — Job — Quick-Konnect' };
}

export default async function JobDetailPage(props: { params: Promise<{ ref: string }> }) {
  const { ref } = await props.params;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  let data;
  try {
    data = await getJobForUser({ publicRef: ref, userId: ctx.userId });
  } catch {
    notFound();
  }

  const { job, request, quote, provider, customer, isCustomer, isProvider, threadId } = data;
  const statusInfo = jobStatusLabel(job.status);
  const existingReview = await getJobReview(job.publicRef);
  const latestDispute = await getLatestDisputeForJob(job.id);
  const amountFormatted = '₦' + Math.round(job.agreedAmountKobo / 100).toLocaleString();

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-3 text-sm">
          {isCustomer ? (
            <Link href="/dashboard/jobs" className="text-white/40 hover:text-white">← My jobs</Link>
          ) : (
            <Link href="/pro/jobs" className="text-white/40 hover:text-white">← My jobs</Link>
          )}
          <span className="text-white/20">/</span>
          <span className="font-mono text-white/60">{job.publicRef}</span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/70">
                {request.category.icon ? request.category.icon + ' ' : ''}{request.category.name}
              </span>
              <span className="text-[11px] text-white/40">
                {request.location.name}
                {request.location.parent && ' · ' + request.location.parent.name}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
            <p className="mt-1 text-sm text-white/50">
              {isCustomer ? 'You accepted a quote from' : 'You won a job from'}{' '}
              <span className="text-white/80">
                {isCustomer ? provider?.businessName : customer?.name}
              </span>
            </p>
          </div>
          <span
            className={
              'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ' +
              (statusInfo.color === 'emerald'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                : statusInfo.color === 'blue'
                ? 'border-blue-400/30 bg-blue-400/10 text-blue-200'
                : statusInfo.color === 'amber'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                : statusInfo.color === 'violet'
                ? 'border-violet-400/30 bg-violet-400/10 text-violet-200'
                : statusInfo.color === 'red'
                ? 'border-red-400/30 bg-red-400/10 text-red-200'
                : 'border-white/10 bg-white/[0.05] text-white/60')
            }
          >
            {statusInfo.label}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* Agreed terms */}
            <section className="rounded-2xl border border-emerald-400/[0.15] bg-emerald-400/[0.03] p-6">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
                Agreed terms
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="text-xs text-white/40">Price</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">{amountFormatted}</div>
                </div>
                {quote.durationEstimate && (
                  <div>
                    <div className="text-xs text-white/40">Timeline</div>
                    <div className="mt-1 text-lg font-medium">{quote.durationEstimate}</div>
                  </div>
                )}
              </div>
              {quote.materialsIncluded && (
                <div className="mt-5 text-xs text-emerald-200/80">
                  ✓ Price includes materials
                  {quote.materialsNotes && <span className="text-emerald-200/60"> · {quote.materialsNotes}</span>}
                </div>
              )}
              {!quote.materialsIncluded && (
                <div className="mt-5 text-xs text-white/50">Materials not included</div>
              )}
              {quote.conditions && (
                <div className="mt-2 text-xs text-white/50">Conditions: {quote.conditions}</div>
              )}
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-white/70">
                {quote.description}
              </p>
            </section>

            {/* Lifecycle actions */}
            <JobLifecycleActions
              publicRef={job.publicRef}
              status={job.status}
              isProvider={isProvider}
              isCustomer={isCustomer}
            />

            {/* Review — only if completed and customer hasn't left one */}
            {job.status === 'completed' && isCustomer && !existingReview && (
              <ReviewForm publicRef={job.publicRef} providerName={provider?.businessName ?? 'the provider'} />
            )}

            {/* Display existing review */}
            {existingReview && (
              <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="text-sm font-medium text-emerald-100">Your review</div>
                  <div className="text-amber-400">
                    {'★'.repeat(existingReview.ratingOverall)}
                    <span className="text-white/20">{'★'.repeat(5 - existingReview.ratingOverall)}</span>
                  </div>
                </div>
                {existingReview.body && (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">{existingReview.body}</p>
                )}
              </section>
            )}

            
            {/* Dispute button — customer can open after completion; provider can open during work */}
            {!latestDispute && (isCustomer || isProvider) && (
              ['provider_marked_complete', 'completed', 'in_progress', 'provider_selected'].includes(job.status) && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="mb-2 text-xs font-medium text-white/70">
                    Something went wrong?
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-white/50">
                    If the job did not go as agreed, open a dispute. Our team
                    reviews evidence from both sides and makes a written decision.
                  </p>
                  <DisputeButton jobPublicRef={job.publicRef} openAs={isCustomer ? 'customer' : 'provider'} />
                </div>
              )
            )}

            {/* Dispute display */}
            {latestDispute && (
              <section className={
                'rounded-2xl border p-6 ' +
                (latestDispute.status === 'open' || latestDispute.status === 'under_review' || latestDispute.status === 'awaiting_evidence'
                  ? 'border-red-400/25 bg-red-400/[0.05]'
                  : 'border-white/[0.08] bg-white/[0.025]')
              }>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">Dispute</div>
                  <span className={
                    'rounded-md border px-2.5 py-0.5 text-[10px] font-medium ' +
                    (latestDispute.status === 'open' || latestDispute.status === 'under_review' || latestDispute.status === 'awaiting_evidence'
                      ? 'border-red-400/30 bg-red-400/10 text-red-200'
                      : latestDispute.status === 'cancelled'
                      ? 'border-white/10 bg-white/[0.05] text-white/60'
                      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200')
                  }>
                    {latestDispute.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-white/40">Reason</dt>
                    <dd className="mt-1 text-white/85">{reasonLabel(latestDispute.reasonCode)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Requested outcome</dt>
                    <dd className="mt-1 text-white/85">{resolutionLabel(latestDispute.requestedResolution)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-white/40">Description</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6 text-white/75">{latestDispute.description}</dd>
                  </div>
                  {latestDispute.resolution && (
                    <div className="sm:col-span-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
                      <dt className="mb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-300/80">
                        Resolution
                      </dt>
                      <dd className="whitespace-pre-wrap text-xs leading-6 text-emerald-100/90">
                        {latestDispute.resolution}
                      </dd>
                      {latestDispute.resolvedAt && (
                        <dd className="mt-2 text-[10px] text-emerald-100/50">
                          Resolved {new Date(latestDispute.resolvedAt).toLocaleString()}
                        </dd>
                      )}
                    </div>
                  )}
                </dl>

                {(latestDispute.status === 'open' || latestDispute.status === 'under_review' || latestDispute.status === 'awaiting_evidence') && (
                  <p className="mt-4 text-[11px] leading-relaxed text-red-100/60">
                    Our team will review this dispute. You can keep communicating
                    through the message thread on this job. Please do not
                    arrange new work with the same provider until this is resolved.
                  </p>
                )}
              </section>
            )}

            {/* Job description */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
              <h2 className="mb-3 text-sm font-medium">Original job description</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">{request.description}</p>
            </section>

            {/* Status history */}
            {job.statusHistory.length > 0 && (
              <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
                <h2 className="mb-5 text-sm font-medium">Activity</h2>
                <ol className="space-y-4">
                  {job.statusHistory.map((h) => {
                    const info = jobStatusLabel(h.toStatus);
                    return (
                      <li key={h.id} className="flex gap-4">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white/90">{info.label}</div>
                          {h.note && <div className="mt-0.5 text-xs text-white/50">{h.note}</div>}
                          <div className="mt-0.5 text-[11px] text-white/35">
                            {new Date(h.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Counterparty card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
                {isCustomer ? 'Provider' : 'Customer'}
              </div>

              {isCustomer && provider && (
                <Link href={'/provider/' + provider.slug} className="flex items-center gap-3 group">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white">
                    {provider.avatarUrl ? (
                      <Image src={provider.avatarUrl} alt={provider.businessName} fill sizes="48px" className="object-cover" unoptimized />
                    ) : (
                      provider.businessName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium group-hover:text-blue-300">
                      {provider.businessName}
                    </div>
                    {provider.ratingCount > 0 && (
                      <div className="mt-0.5 text-xs text-amber-300">
                        ★ {provider.ratingAvg.toFixed(1)}
                        <span className="text-white/40"> ({provider.ratingCount})</span>
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {isProvider && customer && (
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-bold text-white">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{customer.name}</div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      Customer in {request.location.name}
                    </div>
                  </div>
                </div>
              )}

              {threadId && (
                <Link
                  href={'/messages/' + threadId}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white"
                >
                  💬 Open conversation
                </Link>
              )}
            </div>

            {/* Job details */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Job details</div>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-white/40">Job reference</dt>
                  <dd className="mt-0.5 font-mono text-white/80">{job.publicRef}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Created</dt>
                  <dd className="mt-0.5 text-white/80">{new Date(job.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Payment mode</dt>
                  <dd className="mt-0.5 text-white/80 capitalize">{job.paymentMode}</dd>
                </div>
              </dl>
            </div>

            {/* What's next */}
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 text-xs leading-relaxed text-amber-100/85">
              <div className="mb-1 font-medium text-amber-100">
                {isCustomer ? 'What happens next' : 'Next step'}
              </div>
              {isCustomer
                ? 'Message the provider to agree on timing and payment. Once the work is done and you confirm completion, you will be able to leave a review.'
                : 'Reach out to the customer to confirm timing. When the work is done, mark it complete in your dashboard.'}
              <div className="mt-3 text-[10px] text-amber-100/60">
                Job status controls arrive in the next release.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
