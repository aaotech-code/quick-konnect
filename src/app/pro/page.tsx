import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { getProviderForUser } from '@/server/services/providers';
import { db } from '@/server/db/client';

export const metadata = { title: 'Provider dashboard' };

export default async function ProDashboard() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const profile = await getProviderForUser(ctx.userId);

  const portfolioCount = profile
    ? await db.portfolioItem.count({ where: { providerId: profile.id } })
    : 0;
  const pendingRequests = profile
    ? (await db.requestProvider.findMany({
        where: { providerId: profile.id, declinedAt: null },
        include: { request: { select: { status: true } } },
      })).filter((rp) => rp.request.status === 'open').length
    : 0;
  const unreadAsProvider = (await db.messageThread.findMany({
    where: { providerId: profile?.id ?? '___none___' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })).filter((t) => {
    const last = t.messages[0];
    if (!last) return false;
    if (last.senderId === ctx.userId) return false;
    return !t.readByProviderAt || last.createdAt > t.readByProviderAt;
  }).length;
  const incomplete = profile ? (!profile.logoMediaId || portfolioCount === 0) : false;

  // No provider role yet → straight to onboarding
  if (!ctx.roles.includes('provider')) {
    redirect('/pro/onboarding');
  }

  // Has role but no profile → onboarding
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <div className="mb-4 text-4xl">🚀</div>
        <h1 className="text-2xl font-semibold tracking-tight">Finish your profile</h1>
        <p className="mt-2 text-sm text-white/50">
          You&apos;re one step away. Set up your provider profile so customers can find you.
        </p>
        <Link
          href="/pro/onboarding"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
        >
          Set up profile →
        </Link>
      </div>
    );
  }

  const categoryCount = profile.categories.length;
  const locationCount = profile.locations.length;
  const isLive = Boolean(profile.publishedAt);

  return (
    <div>
      {profile && unreadAsProvider > 0 && (
        <Link
          href="/messages"
          className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-blue-400/25 bg-blue-400/[0.06] p-4 transition hover:bg-blue-400/[0.1]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">💬</span>
            <div>
              <div className="text-sm font-medium text-blue-100">
                {unreadAsProvider} new message{unreadAsProvider === 1 ? '' : 's'}
              </div>
              <p className="mt-0.5 text-xs text-blue-100/70">
                A customer is waiting on your reply.
              </p>
            </div>
          </div>
          <span className="text-blue-200">→</span>
        </Link>
      )}

      {profile && pendingRequests > 0 && (
        <Link
          href="/pro/requests"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 transition hover:bg-amber-400/[0.1]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200">📬</span>
            <div>
              <div className="text-sm font-medium text-amber-100">
                {pendingRequests} job request{pendingRequests === 1 ? '' : 's'} waiting for your quote
              </div>
              <p className="mt-0.5 text-xs text-amber-100/70">
                A customer is waiting on your price.
              </p>
            </div>
          </div>
          <span className="text-amber-200">→</span>
        </Link>
      )}

      {incomplete && profile && (
        <div className="mb-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">✦</span>
              <div>
                <div className="text-sm font-medium text-emerald-100">Complete your trust profile</div>
                <p className="mt-0.5 text-xs text-emerald-100/70">
                  {(!profile.logoMediaId && portfolioCount === 0)
                    ? 'Add a profile photo and portfolio photos to start receiving job requests.'
                    : !profile.logoMediaId
                    ? 'Add a profile photo to start receiving job requests.'
                    : 'Add portfolio photos to start receiving job requests.'}
                </p>
              </div>
            </div>
            <Link
              href="/pro/onboarding/complete"
              className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#04100b] transition hover:bg-emerald-300"
            >
              Complete now →
            </Link>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-emerald-300/80 mb-2">
            Provider dashboard
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.businessName}</h1>
          <p className="mt-1 text-sm text-white/50">
            Your profile is {isLive ? 'live' : 'in progress'} at{' '}
            <Link href={'/provider/' + profile.slug} className="text-blue-300 hover:text-blue-200" target="_blank">
              /provider/{profile.slug} ↗
            </Link>
          </p>
        </div>
        <span
          className={
            'rounded-md border px-3 py-1.5 text-xs font-medium ' +
            (profile.verificationStatus === 'verified'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border-amber-400/30 bg-amber-400/10 text-amber-200')
          }
        >
          {profile.verificationStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rating" value={Number(profile.ratingAvg).toFixed(1)} sub={profile.ratingCount + ' reviews'} />
        <Stat label="Jobs completed" value={String(profile.jobsCompleted)} sub="All time" />
        <Stat label="Categories" value={String(categoryCount)} sub="Services offered" />
        <Stat label="Service areas" value={String(locationCount)} sub="Cities covered" />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card title="Your services" hint={categoryCount + ' selected'}>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((pc) => (
              <span
                key={pc.categoryId}
                className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/80"
              >
                {pc.category.icon ? pc.category.icon + ' ' : ''}{pc.category.name}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Your service areas" hint={locationCount + ' cities'}>
          <div className="flex flex-wrap gap-2">
            {profile.locations.map((pl) => (
              <span
                key={pl.locationId}
                className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/80"
              >
                {pl.location.name}
                {pl.location.parent && (
                  <span className="text-white/40"> · {pl.location.parent.name}</span>
                )}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Next steps" hint="What unlocks more visibility">
          <ul className="text-xs text-white/60 space-y-2">
            <li>• <span className="text-white/80">Add portfolio photos</span> — coming in the next update</li>
            <li>• <span className="text-white/80">Verify your phone</span> — unlocks the verified badge</li>
            <li>• <span className="text-white/80">Complete your first job</span> — first review unlocks search ranking</li>
          </ul>
        </Card>

        <Card title="Profile" hint="Edit your information">
          <Link
            href="/pro/onboarding"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-medium text-[#05070b] transition hover:bg-blue-50"
          >
            Edit profile
          </Link>
          <p className="mt-3 text-[11px] text-white/40">
            Editing is read-only in this version. Full editing ships with portfolio uploads.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stat(props: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{props.value}</div>
      <div className="mt-0.5 text-[11px] text-white/40">{props.sub}</div>
    </div>
  );
}

function Card(props: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-sm font-medium">{props.title}</div>
        <div className="text-[11px] text-white/40">{props.hint}</div>
      </div>
      {props.children}
    </div>
  );
}
