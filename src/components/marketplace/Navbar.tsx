import Link from 'next/link';
import Image from 'next/image';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { getUnreadCount } from '@/server/services/messaging';
import { NotificationBell } from './NotificationBell';

async function loadBrand() {
  const rows = await db.platformSetting.findMany({
    where: { key: { in: ['site_name', 'site_logo_url'] } },
  });
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.value;
  const name =
    typeof map.site_name === 'string' && map.site_name.trim()
      ? (map.site_name as string)
      : 'Quick-Konnect';
  const logo = typeof map.site_logo_url === 'string' ? (map.site_logo_url as string).trim() : '';
  return { name, logo };
}

export async function Navbar() {
  const [ctx, brand] = await Promise.all([getAuthContext(), loadBrand()]);
  const unreadMessages = ctx ? await getUnreadCount(ctx.userId) : 0;

  const parts = brand.name.split(/\s+/);
  const first = parts[0] ?? brand.name;
  const rest = parts.slice(1).join(' ');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          {brand.logo ? (
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image src={brand.logo} alt={brand.name} fill sizes="32px" className="object-contain" unoptimized />
            </span>
          ) : (
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400 shadow-lg shadow-blue-500/20">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          )}
          <span className="font-semibold text-[15px] tracking-tight text-white">
            {first}
            {rest && <span className="text-white/50"> {rest}</span>}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-[13.5px] md:flex">
          <Link href="/services" className="rounded-md px-3 py-2 text-white/70 transition hover:bg-white/5 hover:text-white">Services</Link>
          <Link href="/providers" className="rounded-md px-3 py-2 text-white/70 transition hover:bg-white/5 hover:text-white">Find Providers</Link>
          <Link href="/how-it-works" className="rounded-md px-3 py-2 text-white/70 transition hover:bg-white/5 hover:text-white">How It Works</Link>
        </nav>

        <div className="flex items-center gap-2">
          {ctx ? (
            <>
              <NotificationBell userId={ctx.userId} />

              <Link
                href="/messages"
                className="relative hidden sm:inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Messages
                {unreadMessages > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              <Link
                href="/dashboard"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90"
              >
                Dashboard
              </Link>

              {(ctx.roles.includes('admin') || ctx.roles.includes('support')) && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-white/70 transition hover:text-white sm:inline-flex">
                Sign in
              </Link>
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-black/10 transition hover:bg-white/90"
              >
                Get Started
                <span className="text-slate-400 transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
