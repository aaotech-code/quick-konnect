'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { resetPasswordAction, type ResetState } from './actions';

export function ResetForm(props: {
  token: string;
  email: string;
  name: string;
}) {
  const boundAction = resetPasswordAction.bind(null, props.token);
  const [state, action, pending] = useActionState<ResetState, FormData>(boundAction, undefined);

  return state?.ok ? (
    <div className="text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-2xl">
        ✓
      </div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Password updated.
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/50">
        Your password has been changed. For your security, we have signed you out
        of all devices. Sign in again with your new password.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
      >
        Sign in
      </Link>
    </div>
  ) : (
    <>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          Set a new password.
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/50">
          Choose a password for{' '}
          <strong className="text-white/80">{props.email}</strong>.
        </p>
      </div>

      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            autoFocus
            placeholder="At least 10 characters"
            className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 caret-white transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-2 block text-xs font-medium tracking-wide text-white/70">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            placeholder="Type it again"
            className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 caret-white transition focus:border-blue-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            Minimum 10 characters.
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
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  );
}
