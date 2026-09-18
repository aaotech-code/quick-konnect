'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/server/auth/guards';
import { submitQuote, declineRequest } from '@/server/services/requests';

export async function submitQuoteAction(input: {
  publicRef: string;
  amountNaira: number;
  durationEstimate?: string | null;
  description: string;
  materialsIncluded: boolean;
  materialsNotes?: string | null;
  conditions?: string | null;
  availableFrom?: string | null;
}) {
  try {
    const actor = await requireAuth();
    const availableFrom = input.availableFrom
      ? new Date(input.availableFrom + 'T00:00:00')
      : null;

    await submitQuote({
      publicRef: input.publicRef,
      userId: actor.userId,
      amountKobo: Math.round(input.amountNaira * 100),
      durationEstimate: input.durationEstimate ?? null,
      description: input.description,
      materialsIncluded: input.materialsIncluded,
      materialsNotes: input.materialsNotes ?? null,
      conditions: input.conditions ?? null,
      availableFrom,
    });

    revalidatePath('/pro/requests');
    revalidatePath('/pro/requests/' + input.publicRef);
    revalidatePath('/dashboard/requests');
    revalidatePath('/requests/' + input.publicRef);
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}

export async function declineRequestAction(input: {
  publicRef: string;
  reason?: string | null;
}) {
  try {
    const actor = await requireAuth();
    await declineRequest({
      publicRef: input.publicRef,
      userId: actor.userId,
      reason: input.reason ?? null,
    });
    revalidatePath('/pro/requests');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
