import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-slate-950 text-white/70">
      <div className="absolute inset-0 bg-dots-dark opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="font-semibold text-[15px] tracking-tight text-white">
                Quick-Konnect
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/55">
              Nigeria&apos;s trusted marketplace for local services. Verified
              providers, real reviews, quotes you can compare.
            </p>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Customers</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="/services" className="transition hover:text-white">Browse services</Link></li>
              <li><Link href="/providers" className="transition hover:text-white">Find providers</Link></li>
              <li><Link href="/how-it-works" className="transition hover:text-white">How it works</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Providers</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="/pro/onboarding" className="transition hover:text-white">Join as provider</Link></li>
              <li><Link href="/how-it-works" className="transition hover:text-white">How it works</Link></li>
              <li><Link href="/pro/onboarding" className="transition hover:text-white">Get verified</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Company</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="transition hover:text-white">About</Link></li>
              <li><Link href="/legal/terms" className="transition hover:text-white">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="transition hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/legal/disputes" className="transition hover:text-white">Dispute Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <div>&copy; {new Date().getFullYear()} Quick-Konnect. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span>Built for Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
