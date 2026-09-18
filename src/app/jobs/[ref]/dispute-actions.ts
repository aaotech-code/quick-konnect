'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/server/auth/guards';
import { openDispute } from '@/server/services/disputes';

export async function openDisputeAction(input: {
  jobPublicRef: string;
  reasonCode: string;
  description: string;
  requestedResolution: string;
}) {
  try {
    const actor = await requireAuth();
    await openDispute({
      jobPublicRef: input.jobPublicRef,
      userId: actor.userId,
      reasonCode: input.reasonCode,
      description: input.description,
      requestedResolution: input.requestedResolution,
    });
    revalidatePath('/jobs/' + input.jobPublicRef);
    revalidatePath('/admin/disputes');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
