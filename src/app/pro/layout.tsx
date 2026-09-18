import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthContext } from '@/server/auth/session';

export default async function ProLayout(props: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  // Anyone who reaches /pro without a provider role gets the onboarding page,
  // which grants the role explicitly. So we don't hard-block here; the page itself decides.

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <header className="border-b border-white/[0.06] bg-[#080b11]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/pro" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">P</span>
            Provider
          </Link>
            <Link href="/pro/requests" className="rounded-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white">Requests</Link>
            <Link href="/pro/jobs" className="rounded-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white">Jobs</Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link href="/pro"            className="rounded-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white">Dashboard</Link>
            <Link href="/pro/onboarding" className="rounded-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white">Profile</Link>
            <Link href="/pro/portfolio"    className="rounded-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white">Portfolio</Link>
            <Link href="/pro/verification" className="rounded-md px-3 py-1.5 text-white/60 hover:bg-white/5 hover:text-white">Verification</Link>
            <Link href="/"               className="ml-4 rounded-md px-3 py-1.5 text-white/40 hover:bg-white/5 hover:text-white/80">← Back to site</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">{props.children}</main>
    </div>
  );
}
