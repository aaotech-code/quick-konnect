'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAuth, requirePermission } from '@/server/auth/guards';

async function getMeta() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: h.get('user-agent') ?? undefined,
  };
}

async function recomputeProviderStatus(providerId: string) {
  const all = await db.providerVerification.findMany({ where: { providerId } });
  const approved = all.filter((v) => v.status === 'approved').map((v) => v.type);
  const pending = all.filter((v) => v.status === 'pending').length;

  let next: string = 'new';
  if (pending > 0) next = 'pending';
  if (approved.includes('phone')) next = 'phone_verified';
  if (approved.includes('identity') && approved.includes('phone')) next = 'verified';
  if (approved.includes('identity') && !approved.includes('phone')) next = 'identity_submitted';
  if (approved.length >= 3) next = 'verified';

  await db.providerProfile.update({
    where: { id: providerId },
    data: { verificationStatus: next as any },
  });
}

export async function approveVerification(id: string) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'providers.verify');

    const v = await db.providerVerification.findUnique({ where: { id } });
    if (!v) return { ok: false, error: 'Not found.' };
    if (v.status !== 'pending') return { ok: false, error: 'Already reviewed.' };

    const meta = await getMeta();

    await db.$transaction([
      db.providerVerification.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedBy: actor.userId,
          reviewedAt: new Date(),
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'provider.verification.approved',
          entityType: 'provider_verification',
          entityId: id,
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: { providerId: v.providerId, type: v.type } as any,
        },
      }),
    ]);

    await recomputeProviderStatus(v.providerId);

    revalidatePath('/admin/verifications');
    revalidatePath('/pro/verification');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}

export async function rejectVerification(id: string, reason: string) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'providers.verify');

    if (!reason.trim()) return { ok: false, error: 'Reason required.' };

    const v = await db.providerVerification.findUnique({ where: { id } });
    if (!v) return { ok: false, error: 'Not found.' };
    if (v.status !== 'pending') return { ok: false, error: 'Already reviewed.' };

    const meta = await getMeta();

    await db.$transaction([
      db.providerVerification.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedBy: actor.userId,
          reviewedAt: new Date(),
          notes: v.notes ? v.notes + '\n[Rejected: ' + reason + ']' : '[Rejected: ' + reason + ']',
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'provider.verification.rejected',
          entityType: 'provider_verification',
          entityId: id,
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: { providerId: v.providerId, type: v.type, reason } as any,
        },
      }),
    ]);

    await recomputeProviderStatus(v.providerId);

    revalidatePath('/admin/verifications');
    revalidatePath('/pro/verification');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}
