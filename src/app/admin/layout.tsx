import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';

async function loadBrand() {
  const rows = await db.platformSetting.findMany({
    where: { key: { in: ['site_name', 'site_logo_url'] } },
  });
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.value;
  const name = typeof map.site_name === 'string' && map.site_name.trim() ? (map.site_name as string) : 'Quick-Konnect';
  const logo = typeof map.site_logo_url === 'string' ? (map.site_logo_url as string).trim() : '';
  return { name, logo };
}

type NavItem = {
  href: string;
  label: string;
  requires: 'staff' | 'manager' | 'admin';
};

const NAV: NavItem[] = [
  { href: '/admin',               label: 'Overview',      requires: 'staff' },
  { href: '/admin/providers',     label: 'Providers',     requires: 'staff' },
  { href: '/admin/verifications', label: 'Verifications', requires: 'staff' },
  { href: '/admin/disputes',      label: 'Disputes',      requires: 'staff' },
  { href: '/admin/requests',      label: 'Requests',      requires: 'manager' },
  { href: '/admin/jobs',          label: 'Jobs',          requires: 'manager' },
  { href: '/admin/categories',    label: 'Categories',    requires: 'manager' },
  { href: '/admin/locations',     label: 'Locations',     requires: 'manager' },
  { href: '/admin/users',         label: 'Users',         requires: 'admin' },
  { href: '/admin/settings',      label: 'Settings',      requires: 'admin' },
  { href: '/admin/audit',         label: 'Audit',         requires: 'admin' },
];

export default async function AdminLayout(props: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const isAdmin = ctx.roles.includes('admin');
  const isManager = ctx.roles.includes('manager');
  const isSupport = ctx.roles.includes('support');
  const isFinance = ctx.roles.includes('finance');

  if (!isAdmin && !isManager && !isSupport && !isFinance) redirect('/dashboard');

  const brand = await loadBrand();

  // Determine effective level
  const level: 'admin' | 'manager' | 'staff' =
    isAdmin ? 'admin' : isManager ? 'manager' : 'staff';

  const canSee = (req: NavItem['requires']) => {
    if (req === 'staff') return true; // any staff role
    if (req === 'manager') return level === 'admin' || level === 'manager';
    return level === 'admin';
  };

  const visibleNav = NAV.filter((n) => canSee(n.requires));

  const roleLabel = isAdmin ? 'Admin' : isManager ? 'Manager' : isSupport ? 'Support' : 'Finance';

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <header className="border-b border-white/[0.06] bg-[#080b11]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {brand.logo ? (
              <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/10">
                <Image src={brand.logo} alt={brand.name} fill sizes="28px" className="object-contain" unoptimized />
              </span>
            ) : (
              <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            )}
            <span className="text-sm font-semibold tracking-tight">
              {brand.name}
              <span className="ml-2 font-normal text-white/40">{roleLabel}</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1 text-xs">
            {visibleNav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-md px-3 py-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/"
              className="ml-4 rounded-md px-3 py-1.5 text-white/40 transition hover:bg-white/5 hover:text-white/80"
            >
              ← Back to site
            </Link>
          </nav>
        </div>
      </header>

      {isManager && !isAdmin && (
        <div className="border-b border-blue-400/15 bg-blue-400/[0.04]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 text-[11px] text-blue-100/80">
            <strong className="text-blue-100">Manager access.</strong> You can manage providers, disputes, jobs, requests, and categories. You cannot read user chats, change settings, or manage user accounts.
          </div>
        </div>
      )}

      {isSupport && !isAdmin && !isManager && (
        <div className="border-b border-amber-400/15 bg-amber-400/[0.04]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 text-[11px] text-amber-100/80">
            <strong className="text-amber-100">Support access.</strong> You can handle verifications, disputes, and review moderation. For everything else, contact a manager or admin.
          </div>
        </div>
      )}

      {isFinance && !isAdmin && !isManager && !isSupport && (
        <div className="border-b border-violet-400/15 bg-violet-400/[0.04]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 text-[11px] text-violet-100/80">
            <strong className="text-violet-100">Finance access.</strong> You can view payment records and issue refunds. For everything else, contact an admin.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">{props.children}</main>
    </div>
  );
}
