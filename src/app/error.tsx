'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[client error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-400/[0.06] px-3.5 py-1.5 text-[11px] text-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Something broke
        </div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          We hit a snag.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-white/50">
          The page could not be loaded. This is usually temporary.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-white/30">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50">
            Try again
          </button>
          <Link href="/" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
            Back to homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
