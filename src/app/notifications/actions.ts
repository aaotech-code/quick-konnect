'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/server/auth/guards';
import { markNotificationRead, markAllNotificationsRead } from '@/server/services/notifications';

export async function markReadAction(notificationId: string) {
  try {
    const actor = await requireAuth();
    await markNotificationRead(actor.userId, notificationId);
    revalidatePath('/notifications');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}

export async function markAllReadAction() {
  try {
    const actor = await requireAuth();
    await markAllNotificationsRead(actor.userId);
    revalidatePath('/notifications');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
