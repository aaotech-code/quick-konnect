'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/server/auth/guards';
import {
  startJob,
  markJobComplete,
  confirmJobCompletion,
  createReview,
} from '@/server/services/jobs';

export async function startJobAction(publicRef: string) {
  try {
    const actor = await requireAuth();
    await startJob({ publicRef, userId: actor.userId });
    revalidatePath('/jobs/' + publicRef);
    revalidatePath('/pro/jobs');
    revalidatePath('/dashboard/jobs');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}

export async function markCompleteAction(publicRef: string) {
  try {
    const actor = await requireAuth();
    await markJobComplete({ publicRef, userId: actor.userId });
    revalidatePath('/jobs/' + publicRef);
    revalidatePath('/pro/jobs');
    revalidatePath('/dashboard/jobs');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}

export async function confirmCompletionAction(publicRef: string) {
  try {
    const actor = await requireAuth();
    await confirmJobCompletion({ publicRef, userId: actor.userId });
    revalidatePath('/jobs/' + publicRef);
    revalidatePath('/pro/jobs');
    revalidatePath('/dashboard/jobs');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}

export async function submitReviewAction(input: {
  publicRef: string;
  ratingOverall: number;
  ratingQuality?: number | null;
  ratingProfessionalism?: number | null;
  ratingCommunication?: number | null;
  ratingTimeliness?: number | null;
  ratingValue?: number | null;
  body?: string | null;
}) {
  try {
    const actor = await requireAuth();
    await createReview({
      publicRef: input.publicRef,
      userId: actor.userId,
      ratingOverall: input.ratingOverall,
      ratingQuality: input.ratingQuality,
      ratingProfessionalism: input.ratingProfessionalism,
      ratingCommunication: input.ratingCommunication,
      ratingTimeliness: input.ratingTimeliness,
      ratingValue: input.ratingValue,
      body: input.body,
    });
    revalidatePath('/jobs/' + input.publicRef);
    revalidatePath('/dashboard/jobs');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
