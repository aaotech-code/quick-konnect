import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { RoleToggles } from './RoleToggles';

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      customerProfile: true,
      providerProfile: true,
      roles: { include: { role: true } },
    },
  });

  if (!user) notFound();

  const allRoles = await db.role.findMany({ orderBy: { name: 'asc' } });
  const currentRoleNames = user.roles.map((r) => r.role.name);

  const recentAudit = await db.auditLog.findMany({
    where: { OR: [{ actorId: user.id }, { entityType: 'user', entityId: user.id }] },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  return (
    <div>
      <div className="mb-8 text-sm text-white/40">
        <Link href="/admin/users" className="hover:text-white">Users</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{user.email}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.customerProfile?.fullName ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-white/50">{user.email}</p>
        </div>
        <span
          className={
            'rounded-md border px-3 py-1.5 text-xs font-medium ' +
            (user.status === 'active'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : user.status === 'pending'
              ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
              : 'border-red-400/30 bg-red-400/10 text-red-200')
          }
        >
          {user.status}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
              Account
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-white/40">Phone</dt>
                <dd className="mt-0.5 text-white/80">{user.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Email verified</dt>
                <dd className="mt-0.5 text-white/80">
                  {user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'Not yet'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Joined</dt>
                <dd className="mt-0.5 text-white/80">{new Date(user.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Last login</dt>
                <dd className="mt-0.5 text-white/80">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
            <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
              Recent activity
            </div>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-white/40">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-xs text-white/60">
                {recentAudit.map((a) => (
                  <li key={a.id} className="flex justify-between gap-4 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                    <span className="truncate">{a.event}</span>
                    <span className="shrink-0 text-white/35">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside>
          <RoleToggles
            userId={user.id}
            userEmail={user.email}
            allRoles={allRoles.map((r) => r.name)}
            currentRoles={currentRoleNames}
          />
        </aside>
      </div>
    </div>
  );
}
