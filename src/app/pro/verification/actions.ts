'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { VerificationType } from '@prisma/client';
import { db } from '@/server/db/client';
import { requireAuth } from '@/server/auth/guards';

const VALID: VerificationType[] = ['phone', 'identity', 'address', 'business', 'reference'];

async function getMeta() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: h.get('user-agent') ?? undefined,
  };
}

export async function submitVerification(args: {
  type: VerificationType;
  detail: string;
}) {
  try {
    const actor = await requireAuth();

    if (!VALID.includes(args.type)) return { ok: false, error: 'Invalid type.' };
    if (args.detail.length < 4 || args.detail.length > 200) {
      return { ok: false, error: 'Details must be 4–200 characters.' };
    }

    const profile = await db.providerProfile.findUnique({ where: { userId: actor.userId } });
    if (!profile) return { ok: false, error: 'Create your provider profile first.' };

    // Block if there's already a pending submission of this type
    const pending = await db.providerVerification.findFirst({
      where: { providerId: profile.id, type: args.type, status: 'pending' },
    });
    if (pending) return { ok: false, error: 'You already have a pending ' + args.type + ' check.' };

    const meta = await getMeta();

    await db.$transaction([
      db.providerVerification.create({
        data: {
          providerId: profile.id,
          type: args.type,
          status: 'pending',
          notes: args.detail,
        },
      }),
      db.providerProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus:
            profile.verificationStatus === 'new' || profile.verificationStatus === 'phone_verified'
              ? 'pending'
              : profile.verificationStatus,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'provider.verification.submitted',
          entityType: 'provider_verification',
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: { providerId: profile.id, type: args.type } as any,
        },
      }),
    ]);

    revalidatePath('/pro/verification');
    revalidatePath('/admin/verifications');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}
