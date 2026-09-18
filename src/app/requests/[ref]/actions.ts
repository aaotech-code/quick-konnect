'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/server/auth/guards';
import { acceptQuote } from '@/server/services/jobs';

export async function acceptQuoteAction(requestRef: string, quoteId: string) {
  try {
    const actor = await requireAuth();
    const job = await acceptQuote({
      requestRef,
      quoteId,
      customerId: actor.userId,
    });
    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard/jobs');
    revalidatePath('/requests/' + requestRef);
    revalidatePath('/pro/jobs');
    return { ok: true as const, jobRef: job.publicRef };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
