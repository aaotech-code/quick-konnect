'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/server/auth/guards';
import { getOrCreateThread, sendMessage, sendMessageWithAttachments } from '@/server/services/messaging';

export async function startThreadWithProvider(providerId: string) {
  try {
    const actor = await requireAuth();
    const thread = await getOrCreateThread({
      customerId: actor.userId,
      providerId,
    });
    return { ok: true as const, threadId: thread.id };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}

export async function startThreadAndRedirect(providerId: string) {
  const res = await startThreadWithProvider(providerId);
  if (!res.ok) {
    throw new Error(res.error);
  }
  redirect('/messages/' + res.threadId);
}

export async function sendMessageAction(threadId: string, body: string) {
  try {
    const actor = await requireAuth();
    const msg = await sendMessage({
      threadId,
      senderId: actor.userId,
      body,
    });
    revalidatePath('/messages/' + threadId);
    revalidatePath('/messages');
    return { ok: true as const, id: msg.id, createdAt: msg.createdAt.toISOString() };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}


export async function sendMessageWithAttachmentsAction(formData: FormData) {
  try {
    const actor = await requireAuth();
    const threadId = String(formData.get('threadId') ?? '');
    const body = String(formData.get('body') ?? '');
    const files: { filename: string; mime: string; bytes: Buffer }[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        if (value.size === 0) continue;
        if (value.size > 20 * 1024 * 1024) {
          return { ok: false as const, error: 'File "' + value.name + '" exceeds 20MB.' };
        }
        const bytes = Buffer.from(await value.arrayBuffer());
        files.push({ filename: value.name, mime: value.type || 'application/octet-stream', bytes });
      }
    }

    await sendMessageWithAttachments({
      threadId,
      senderId: actor.userId,
      body,
      files,
    });

    revalidatePath('/messages/' + threadId);
    revalidatePath('/messages');
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Failed.' };
  }
}
