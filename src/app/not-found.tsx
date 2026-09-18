import Link from 'next/link';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';

export const metadata = { title: 'Page not found - Quick-Konnect' };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Error 404
        </div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          This page has moved on.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-white/50">
          The page you are looking for does not exist, or it was moved.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50">
            Back to homepage
          </Link>
          <Link href="/providers" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
            Find a provider
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
