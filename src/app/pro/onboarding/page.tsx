import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/auth/session';
import { getProviderForUser } from '@/server/services/providers';
import { db } from '@/server/db/client';
import { BecomeProvider } from './BecomeProvider';
import { OnboardingForm } from './OnboardingForm';

export const metadata = { title: 'Provider onboarding' };

export default async function OnboardingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  // Step 1: needs the provider role
  if (!ctx.roles.includes('provider')) {
    return <BecomeProvider />;
  }

  // Step 2: already has a profile → back to dashboard
  const existing = await getProviderForUser(ctx.userId);
  if (existing) redirect('/pro');

  // Step 3: load options
  const [categories, locations] = await Promise.all([
    db.serviceCategory.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    db.location.findMany({
      where: { type: 'city', isActive: true },
      orderBy: { name: 'asc' },
      include: { parent: true },
    }),
  ]);

  return (
    <OnboardingForm
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          icon: ch.icon,
        })),
      }))}
      locations={locations.map((l) => ({
        id: l.id,
        name: l.name,
        stateName: l.parent?.name ?? '',
      }))}
    />
  );
}
