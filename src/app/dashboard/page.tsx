import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { getUnreadCount } from '@/server/services/messaging';
import { getUnreadNotificationsCount } from '@/server/services/notifications';
import { listCustomerRequests } from '@/server/services/requests';
import { listCustomerJobs, jobStatusLabel } from '@/server/services/jobs';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';
import { logoutAction } from '../(auth)/actions';

export const metadata = { title: 'Dashboard - Quick-Konnect' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const [user, unreadMessages, unreadNotifications, requests, jobs] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      include: { customerProfile: true },
    }),
    getUnreadCount(ctx.userId),
    getUnreadNotificationsCount(ctx.userId),
    listCustomerRequests(ctx.userId),
    listCustomerJobs(ctx.userId),
  ]);

  const activeRequests = requests.filter((r) => r.status === 'open');
  const activeJobs = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status));
  const recentRequests = requests.slice(0, 3);
  const recentJobs = jobs.slice(0, 3);

  const name = user.customerProfile?.fullName ?? user.email;
  const isProvider = ctx.roles.includes('provider');
  const isStaff =
    ctx.roles.includes('admin') ||
    ctx.roles.includes('manager') ||
    ctx.roles.includes('support') ||
    ctx.roles.includes('finance');

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Welcome header */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Signed in as {user.email}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Welcome back, {name.split(' ')[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            Your control center for jobs, quotes, and conversations with
            providers. Everything you are working on lives here.
          </p>

          {/* Role chips */}
          {(isProvider || isStaff) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {isProvider && (
                <Link
                  href="/pro"
                  className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-3.5 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-400/[0.12]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  You also offer services
                  <span className="text-emerald-200/70 transition group-hover:translate-x-0.5">→</span>
                </Link>
              )}
              {isStaff && (
                <Link
                  href="/admin"
                  className="group inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/[0.06] px-3.5 py-1.5 text-xs font-medium text-blue-100 transition hover:bg-blue-400/[0.12]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Staff tools
                  <span className="text-blue-200/70 transition group-hover:translate-x-0.5">→</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-10">
          <StatCard
            label="Active requests"
            value={activeRequests.length}
            sub={activeRequests.length === 0 ? 'Nothing open' : activeRequests.length === 1 ? '1 open' : activeRequests.length + ' open'}
            href="/dashboard/requests"
          />
          <StatCard
            label="Active jobs"
            value={activeJobs.length}
            sub={activeJobs.length === 0 ? 'None in progress' : activeJobs.length === 1 ? '1 in progress' : activeJobs.length + ' in progress'}
            href="/dashboard/jobs"
          />
          <StatCard
            label="Messages"
            value={unreadMessages}
            sub={unreadMessages === 0 ? 'All read' : 'Unread'}
            href="/messages"
            highlight={unreadMessages > 0}
          />
          <StatCard
            label="Notifications"
            value={unreadNotifications}
            sub={unreadNotifications === 0 ? 'All caught up' : 'Unread'}
            href="/notifications"
            highlight={unreadNotifications > 0}
          />
        </div>

        {/* Quick actions */}
        <div className="mb-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/40">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              href="/request/new"
              tone="blue"
              icon="📝"
              title="Post a job"
              body="Describe what you need and get quotes from providers in your city."
            />
            <ActionCard
              href="/providers"
              tone="violet"
              icon="🔍"
              title="Find a provider"
              body="Browse verified professionals by category, city, and rating."
            />
            <ActionCard
              href="/dashboard/requests"
              tone="white"
              icon="📋"
              title="My requests"
              body="See every job you have posted and the quotes received so far."
            />
            <ActionCard
              href="/dashboard/jobs"
              tone="emerald"
              icon="🛠️"
              title="My jobs"
              body="Track jobs you have hired a provider for, from start to completion."
            />
          </div>
        </div>

        {/* Recent activity */}
        {(recentRequests.length > 0 || recentJobs.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2 mb-10">
            {/* Recent requests */}
            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wider text-white/40">
                  Recent requests
                </h2>
                {requests.length > 0 && (
                  <Link href="/dashboard/requests" className="text-xs text-white/50 transition hover:text-white">
                    View all →
                  </Link>
                )}
              </div>
              {recentRequests.length === 0 ? (
                <EmptyMini
                  icon="📋"
                  title="No requests yet"
                  body="Post a job to get your first quotes."
                  href="/request/new"
                  cta="Post a job"
                />
              ) : (
                <div className="space-y-2">
                  {recentRequests.map((r) => (
                    <Link
                      key={r.id}
                      href={'/requests/' + r.publicRef}
                      className="group block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/[0.2] hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-white/40">{r.publicRef}</div>
                          <div className="mt-1 truncate text-sm font-medium text-white">{r.title}</div>
                          <div className="mt-0.5 truncate text-[11px] text-white/45">
                            {r.category.icon ? r.category.icon + ' ' : ''}{r.category.name} · {r.location.name}
                          </div>
                        </div>
                        <span
                          className={
                            'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                            (r.status === 'open'
                              ? r._count.quotes > 0
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                              : 'border-white/10 bg-white/[0.05] text-white/60')
                          }
                        >
                          {r.status === 'open'
                            ? r._count.quotes > 0
                              ? r._count.quotes + ' quote' + (r._count.quotes === 1 ? '' : 's')
                              : 'Waiting'
                            : r.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent jobs */}
            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wider text-white/40">
                  Recent jobs
                </h2>
                {jobs.length > 0 && (
                  <Link href="/dashboard/jobs" className="text-xs text-white/50 transition hover:text-white">
                    View all →
                  </Link>
                )}
              </div>
              {recentJobs.length === 0 ? (
                <EmptyMini
                  icon="🛠️"
                  title="No jobs yet"
                  body="Accept a quote on one of your requests to hire a provider."
                  href="/dashboard/requests"
                  cta="View requests"
                />
              ) : (
                <div className="space-y-2">
                  {recentJobs.map((j) => {
                    const status = jobStatusLabel(j.status);
                    return (
                      <Link
                        key={j.id}
                        href={'/jobs/' + j.publicRef}
                        className="group block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/[0.2] hover:bg-white/[0.05]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[10px] text-white/40">{j.publicRef}</div>
                            <div className="mt-1 truncate text-sm font-medium text-white">{j.title}</div>
                            <div className="mt-0.5 truncate text-[11px] text-white/45">
                              {j.provider?.businessName ? j.provider.businessName + ' · ' : ''}{j.locationName}
                            </div>
                          </div>
                          <span
                            className={
                              'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                              (status.color === 'emerald' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' :
                               status.color === 'blue' ? 'border-blue-400/30 bg-blue-400/10 text-blue-200' :
                               status.color === 'amber' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' :
                               status.color === 'violet' ? 'border-violet-400/30 bg-violet-400/10 text-violet-200' :
                               status.color === 'red' ? 'border-red-400/30 bg-red-400/10 text-red-200' :
                               'border-white/10 bg-white/[0.05] text-white/60')
                            }
                          >
                            {status.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div>
            <div className="text-sm font-medium text-white">Sign out of Quick-Konnect</div>
            <p className="mt-0.5 text-xs text-white/45">
              Your session will end on this device only. You can sign back in any time.
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard(props: {
  label: string;
  value: number;
  sub: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={props.href}
      className={
        'group rounded-2xl border p-4 transition ' +
        (props.highlight
          ? 'border-blue-400/25 bg-blue-400/[0.05] hover:bg-blue-400/[0.1]'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.2] hover:bg-white/[0.05]')
      }
    >
      <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">
        {props.label}
      </div>
      <div className={'mt-2 text-2xl font-semibold tracking-tight ' + (props.highlight ? 'text-blue-100' : 'text-white')}>
        {props.value}
      </div>
      <div className="mt-0.5 text-[11px] text-white/40">{props.sub}</div>
    </Link>
  );
}

function ActionCard(props: {
  href: string;
  tone: 'blue' | 'emerald' | 'violet' | 'white';
  icon: string;
  title: string;
  body: string;
}) {
  const styles = {
    blue: {
      border: 'border-blue-400/25',
      bg: 'bg-blue-400/[0.05]',
      hover: 'hover:bg-blue-400/[0.1]',
      icon: 'bg-blue-400/15 text-blue-200',
      title: 'text-blue-100',
      body: 'text-blue-100/70',
      arrow: 'text-blue-200',
    },
    emerald: {
      border: 'border-emerald-400/25',
      bg: 'bg-emerald-400/[0.05]',
      hover: 'hover:bg-emerald-400/[0.1]',
      icon: 'bg-emerald-400/15 text-emerald-200',
      title: 'text-emerald-100',
      body: 'text-emerald-100/70',
      arrow: 'text-emerald-200',
    },
    violet: {
      border: 'border-violet-400/25',
      bg: 'bg-violet-400/[0.05]',
      hover: 'hover:bg-violet-400/[0.1]',
      icon: 'bg-violet-400/15 text-violet-200',
      title: 'text-violet-100',
      body: 'text-violet-100/70',
      arrow: 'text-violet-200',
    },
    white: {
      border: 'border-white/[0.08]',
      bg: 'bg-white/[0.025]',
      hover: 'hover:bg-white/[0.05]',
      icon: 'bg-white/[0.06] text-white/70',
      title: 'text-white',
      body: 'text-white/50',
      arrow: 'text-white/40',
    },
  }[props.tone];

  return (
    <Link
      href={props.href}
      className={
        'group flex items-start justify-between gap-3 rounded-2xl border p-5 transition ' +
        styles.border + ' ' + styles.bg + ' ' + styles.hover
      }
    >
      <div className="flex items-start gap-3">
        <span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ' + styles.icon}>
          {props.icon}
        </span>
        <div className="min-w-0">
          <div className={'text-base font-medium ' + styles.title}>{props.title}</div>
          <p className={'mt-1 text-xs leading-relaxed ' + styles.body}>{props.body}</p>
        </div>
      </div>
      <span className={'shrink-0 transition group-hover:translate-x-0.5 ' + styles.arrow}>→</span>
    </Link>
  );
}

function EmptyMini(props: {
  icon: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] p-8 text-center">
      <div className="mb-3 text-3xl">{props.icon}</div>
      <div className="text-sm font-medium text-white">{props.title}</div>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-white/45">{props.body}</p>
      <Link
        href={props.href}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
      >
        {props.cta}
        <span>→</span>
      </Link>
    </div>
  );
}
