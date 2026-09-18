'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAuth } from '@/server/auth/guards';
import { createProviderProfile } from '@/server/services/providers';

async function getMeta() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: h.get('user-agent') ?? undefined,
  };
}

export async function grantSelfProviderRole() {
  try {
    const actor = await requireAuth();

    const role = await db.role.findUniqueOrThrow({ where: { name: 'provider' } });
    const existing = await db.userRole.findUnique({
      where: { userId_roleId: { userId: actor.userId, roleId: role.id } },
    });

    if (existing) return { ok: true };

    const meta = await getMeta();

    await db.$transaction([
      db.userRole.create({
        data: { userId: actor.userId, roleId: role.id },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'user.role.self_grant_provider',
          entityType: 'user',
          entityId: actor.userId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: { role: 'provider' } as any,
        },
      }),
    ]);

    revalidatePath('/pro/onboarding');
    revalidatePath('/pro');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}

export async function submitProviderProfile(args: {
  businessName: string;
  tagline: string | null;
  description: string;
  yearsExperience: number | null;
  categoryIds: string[];
  locationIds: string[];
}) {
  try {
    const actor = await requireAuth();

    const profile = await createProviderProfile({
      userId: actor.userId,
      businessName: args.businessName,
      tagline: args.tagline,
      description: args.description,
      yearsExperience: args.yearsExperience,
      categoryIds: args.categoryIds,
      locationIds: args.locationIds,
    });

    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'provider.profile.created',
        entityType: 'provider_profile',
        entityId: profile.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { businessName: profile.businessName, slug: profile.slug } as any,
      },
    });

    revalidatePath('/pro');
    revalidatePath('/admin/providers');
    return { ok: true, slug: profile.slug };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}
