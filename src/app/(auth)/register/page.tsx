'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type FormState } from '../actions';

export default function RegisterPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, undefined);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="relative mx-auto max-w-md px-4 sm:px-6 py-16 sm:py-20">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400 shadow-lg shadow-blue-500/20">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Quick-Konnect
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Create your account.
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/50">
              One account. Use it to hire providers, or offer your own services.
            </p>
          </div>

          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                placeholder="e.g. Chinedu Okafor"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 caret-white transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 caret-white transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
                Phone number <span className="font-normal text-white/35">· optional</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +234 801 234 5678"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 caret-white transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                placeholder="At least 10 characters"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 caret-white transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                Use a mix of letters, numbers, and symbols. 10 characters minimum.
              </p>
            </div>

            {state?.error && (
              <div className="rounded-xl border border-red-400/25 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-[#05070b] shadow-lg transition hover:bg-blue-50 disabled:opacity-50"
            >
              {pending ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-[11px] leading-relaxed text-white/40 text-center">
              By creating an account you agree to our{' '}
              <Link href="/legal/terms" className="text-blue-300/80 hover:text-blue-200">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="text-blue-300/80 hover:text-blue-200">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-300 hover:text-blue-200">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-white/40 transition hover:text-white">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
