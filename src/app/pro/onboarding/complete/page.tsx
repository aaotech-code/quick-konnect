import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { CompletePanel } from './CompletePanel';

export const metadata = { title: 'Finish your profile - Provider' };

export default async function OnboardingCompletePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const profile = await db.providerProfile.findUnique({
    where: { userId: ctx.userId },
    include: {
      portfolio: { orderBy: { sortOrder: 'asc' } },
      verifications: { orderBy: { submittedAt: 'desc' } },
    },
  });
  if (!profile) redirect('/pro/onboarding');

  const mediaIds = [
    ...(profile.logoMediaId ? [profile.logoMediaId] : []),
    ...profile.portfolio.map((p) => p.mediaId),
  ];
  const media = mediaIds.length
    ? await db.media.findMany({ where: { id: { in: mediaIds } } })
    : [];
  const mediaMap = new Map(media.map((m) => [m.id, '/uploads/' + m.storageKey]));

  const avatarUrl = profile.logoMediaId ? mediaMap.get(profile.logoMediaId) ?? null : null;
  const portfolio = profile.portfolio.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    publicUrl: mediaMap.get(p.mediaId) ?? '',
  }));

  const hasPendingVerification = profile.verifications.some((v) => v.status === 'pending');
  const hasApprovedIdentity = profile.verifications.some(
    (v) => v.type === 'identity' && v.status === 'approved',
  );

  return (
    <CompletePanel
      businessName={profile.businessName}
      providerSlug={profile.slug}
      initialAvatarUrl={avatarUrl}
      initialPortfolio={portfolio}
      hasPendingVerification={hasPendingVerification}
      hasApprovedIdentity={hasApprovedIdentity}
    />
  );
}
