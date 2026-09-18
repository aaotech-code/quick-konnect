'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/server/auth/guards';
import { createServiceRequest } from '@/server/services/requests';

export async function submitServiceRequest(input: {
  categoryId: string;
  title: string;
  description: string;
  locationId: string;
  addressText?: string | null;
  preferredDate?: string | null;
  preferredTimeWindow?: string | null;
  budgetMinNaira?: number | null;
  budgetMaxNaira?: number | null;
}) {
  try {
    const actor = await requireAuth();

    const preferredDate = input.preferredDate
      ? new Date(input.preferredDate + 'T00:00:00')
      : null;

    const { request, dispatchedCount } = await createServiceRequest({
      customerId: actor.userId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      locationId: input.locationId,
      addressText: input.addressText ?? null,
      preferredDate,
      preferredTimeWindow: input.preferredTimeWindow ?? null,
      budgetMinKobo: input.budgetMinNaira != null ? Math.round(input.budgetMinNaira * 100) : null,
      budgetMaxKobo: input.budgetMaxNaira != null ? Math.round(input.budgetMaxNaira * 100) : null,
    });

    revalidatePath('/dashboard/requests');
    return {
      ok: true as const,
      publicRef: request.publicRef,
      dispatchedCount,
    };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed to submit request.' };
  }
}
