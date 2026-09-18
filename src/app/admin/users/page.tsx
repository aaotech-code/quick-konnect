import Link from 'next/link';
import { db } from '@/server/db/client';

type Search = { q?: string; role?: string; page?: string };

export const metadata = { title: 'Admin — Users' };

const PAGE_SIZE = 25;

export default async function AdminUsersPage(props: {
  searchParams: Promise<Search>;
}) {
  const sp = await props.searchParams;
  const q = (sp.q ?? '').trim();
  const roleFilter = sp.role ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { customerProfile: { fullName: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (roleFilter) {
    where.roles = { some: { role: { name: roleFilter } } };
  }

  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        customerProfile: true,
        roles: { include: { role: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const roles = ['admin', 'support', 'finance', 'customer', 'provider'];

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (roleFilter) next.set('role', roleFilter);
    if (page > 1) next.set('page', String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    }
    const s = next.toString();
    return '/admin/users' + (s ? '?' + s : '');
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-white/50">
            {total.toLocaleString()} account{total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/users">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email, phone, or name…"
          className="min-w-[260px] flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <select
          name="role"
          defaultValue={roleFilter}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="" className="bg-slate-900">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r} className="bg-slate-900">{r}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
        >
          Filter
        </button>
        {(q || roleFilter) && (
          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 text-3xl">👤</div>
          <div className="font-medium text-white">No users found</div>
          <p className="mt-1 text-sm text-white/50">
            {q || roleFilter ? 'Try a different filter.' : 'Users will appear here as they register.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Name</th>
                  <th className="px-5 py-3 font-medium">Roles</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((u) => (
                  <tr key={u.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{u.email}</div>
                      {u.phone && (
                        <div className="mt-0.5 text-[11px] text-white/40">{u.phone}</div>
                      )}
                    </td>
                    <td className="hidden px-5 py-3.5 text-white/70 sm:table-cell">
                      {u.customerProfile?.fullName ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-white/30">none</span>
                        ) : (
                          u.roles.map((ur) => (
                            <span
                              key={ur.role.name}
                              className={
                                'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                                (ur.role.name === 'admin'
                                  ? 'border-red-400/30 bg-red-400/10 text-red-200'
                                  : ur.role.name === 'support'
                                  ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                                  : ur.role.name === 'finance'
                                  ? 'border-violet-400/30 bg-violet-400/10 text-violet-200'
                                  : ur.role.name === 'provider'
                                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                  : 'border-white/10 bg-white/[0.05] text-white/60')
                              }
                            >
                              {ur.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-white/50 md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={'/admin/users/' + u.id}
                        className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between text-xs text-white/50">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={buildHref({ page: String(page - 1) })}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
                  >
                    ← Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={buildHref({ page: String(page + 1) })}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
