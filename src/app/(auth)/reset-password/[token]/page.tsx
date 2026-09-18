import Link from 'next/link';
import { validateResetToken } from '@/server/services/password-reset';
import { ResetForm } from './ResetForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const check = await validateResetToken(token);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="relative mx-auto max-w-md px-4 sm:px-6 py-16 sm:py-24">
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

        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-8 shadow-2xl backdrop-blur-xl">
          {!check ? (
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/15 text-2xl">
                ⚠️
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">
                This link has expired.
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Password reset links are single-use and expire after 60 minutes.
                Request a new one to continue.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
              >
                Request a new link
              </Link>
              <Link
                href="/login"
                className="mt-3 inline-block text-xs text-white/40 transition hover:text-white"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <ResetForm
              token={token}
              email={check.user.email}
              name={check.user.email.split('@')[0]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
