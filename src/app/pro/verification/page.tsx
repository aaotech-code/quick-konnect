import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { VerificationPanel } from './VerificationPanel';

export const metadata = { title: 'Verification — Provider' };

export default async function VerificationPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const profile = await db.providerProfile.findUnique({ where: { userId: ctx.userId } });
  if (!profile) redirect('/pro/onboarding');

  const verifications = await db.providerVerification.findMany({
    where: { providerId: profile.id },
    orderBy: { submittedAt: 'desc' },
  });

  // Latest per type
  const latestByType: Record<string, typeof verifications[number]> = {};
  for (const v of verifications) {
    if (!latestByType[v.type]) latestByType[v.type] = v;
  }

  return (
    <div>
      <div className="mb-8 text-sm text-white/40">
        <Link href="/pro" className="hover:text-white">Provider</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Verification</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Verification</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Verification helps customers trust you. Each check is reviewed by our team
          before it appears on your profile. You can submit checks at any time.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-white/40">
            Current status
          </div>
          <span
            className={
              'rounded-md border px-3 py-1 text-xs font-medium ' +
              (profile.verificationStatus === 'verified'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                : profile.verificationStatus === 'rejected'
                ? 'border-red-400/30 bg-red-400/10 text-red-200'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-200')
            }
          >
            {profile.verificationStatus.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <VerificationPanel latestByType={latestByType} />
    </div>
  );
}
