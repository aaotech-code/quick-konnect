'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { resolveDispute } from '@/server/services/disputes';

export async function resolveDisputeAction(input: {
  disputeId: string;
  decision: 'favor_provider' | 'favor_customer' | 'cancelled';
  resolution: string;
}) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'disputes.resolve');
    await resolveDispute({
      disputeId: input.disputeId,
      adminId: actor.userId,
      decision: input.decision,
      resolution: input.resolution,
    });
    revalidatePath('/admin/disputes');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
