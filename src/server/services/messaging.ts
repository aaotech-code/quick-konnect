import { db } from '@/server/db/client';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/auth/errors';
import { notify } from '@/server/services/notifications';

export async function getOrCreateThread(args: {
  customerId: string;
  providerId: string;
}) {
  if (args.customerId === args.providerId) {
    throw new ValidationError('You cannot message yourself.');
  }

  const providerProfile = await db.providerProfile.findUnique({
    where: { id: args.providerId },
    select: { id: true, userId: true },
  });
  if (!providerProfile) throw new NotFoundError('Provider not found.');

  const customerUser = await db.user.findUnique({ where: { id: args.customerId } });
  if (!customerUser) throw new NotFoundError('Customer not found.');

  if (providerProfile.userId === args.customerId) {
    throw new ValidationError('You cannot message yourself.');
  }

  const existing = await db.messageThread.findUnique({
    where: {
      customerId_providerId: {
        customerId: args.customerId,
        providerId: args.providerId,
      },
    },
  });
  if (existing) return existing;

  return db.messageThread.create({
    data: {
      customerId: args.customerId,
      providerId: args.providerId,
    },
  });
}

/** Return provider profile IDs owned by a user. Used to filter threads. */
async function getOwnedProviderIds(userId: string): Promise<string[]> {
  const profiles = await db.providerProfile.findMany({
    where: { userId },
    select: { id: true },
  });
  return profiles.map((p) => p.id);
}

export async function listThreadsForUser(userId: string) {
  const myProviderIds = await getOwnedProviderIds(userId);

  const orClauses: any[] = [{ customerId: userId }];
  if (myProviderIds.length > 0) {
    orClauses.push({ providerId: { in: myProviderIds } });
  }

  const threads = await db.messageThread.findMany({
    where: { OR: orClauses },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const providerIds = threads.map((t) => t.providerId);
  const customerIds = threads.map((t) => t.customerId);

  const [providers, customers] = await Promise.all([
    providerIds.length
      ? db.providerProfile.findMany({
          where: { id: { in: providerIds } },
          include: { user: { select: { id: true, email: true } } },
        })
      : Promise.resolve([]),
    customerIds.length
      ? db.user.findMany({
          where: { id: { in: customerIds } },
          include: { customerProfile: true },
        })
      : Promise.resolve([]),
  ]);

  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const logoIds = providers
    .map((p) => p.logoMediaId)
    .filter((x): x is string => Boolean(x));
  const media = logoIds.length
    ? await db.media.findMany({ where: { id: { in: logoIds } } })
    : [];
  const logoMap = new Map(media.map((m) => [m.id, '/uploads/' + m.storageKey]));

  return threads.map((t) => {
    const provider = providerMap.get(t.providerId);
    const customer = customerMap.get(t.customerId);
    const isCustomer = t.customerId === userId;

    const counterpartyName = isCustomer
      ? provider?.businessName ?? 'Provider'
      : customer?.customerProfile?.fullName ?? customer?.email ?? 'Customer';

    const counterpartyAvatar = isCustomer
      ? (provider?.logoMediaId ? logoMap.get(provider.logoMediaId) ?? null : null)
      : null;

    const lastMessage = t.messages[0];

    const readAt = isCustomer ? t.readByCustomerAt : t.readByProviderAt;
    const unread =
      Boolean(lastMessage) &&
      lastMessage.senderId !== userId &&
      (!readAt || lastMessage.createdAt > readAt);

    return {
      id: t.id,
      counterpartyName,
      counterpartyAvatar,
      lastMessageBody: lastMessage?.body ?? null,
      lastMessageAt: t.lastMessageAt,
      isCustomer,
      unread,
    };
  });
}

export async function getThreadForUser(args: {
  threadId: string;
  userId: string;
}) {
  const thread = await db.messageThread.findUnique({
    where: { id: args.threadId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!thread) throw new NotFoundError('Conversation not found.');

  const provider = await db.providerProfile.findUnique({
    where: { id: thread.providerId },
    include: { user: { select: { id: true, email: true } } },
  });
  const customer = await db.user.findUnique({
    where: { id: thread.customerId },
    include: { customerProfile: true },
  });

  const isCustomer = thread.customerId === args.userId;
  const isProvider = provider?.userId === args.userId;
  if (!isCustomer && !isProvider) {
    throw new ForbiddenError('You are not part of this conversation.');
  }

  await db.messageThread.update({
    where: { id: thread.id },
    data: isCustomer
      ? { readByCustomerAt: new Date() }
      : { readByProviderAt: new Date() },
  });

  let avatarUrl: string | null = null;
  if (provider?.logoMediaId) {
    const m = await db.media.findUnique({ where: { id: provider.logoMediaId } });
    if (m) avatarUrl = '/uploads/' + m.storageKey;
  }

  return {
    thread,
    counterparty: {
      name: isCustomer
        ? provider?.businessName ?? 'Provider'
        : customer?.customerProfile?.fullName ?? customer?.email ?? 'Customer',
      avatarUrl: isCustomer ? avatarUrl : null,
      providerSlug: provider?.slug ?? null,
      isCustomer,
    },
  };
}

export async function sendMessage(args: {
  threadId: string;
  senderId: string;
  body: string;
}) {
  const body = args.body.trim();
  if (!body) throw new ValidationError('Message cannot be empty.');
  if (body.length > 4000) throw new ValidationError('Message is too long (max 4000 characters).');

  const thread = await db.messageThread.findUnique({ where: { id: args.threadId } });
  if (!thread) throw new NotFoundError('Conversation not found.');

  const provider = await db.providerProfile.findUnique({
    where: { id: thread.providerId },
    select: { userId: true },
  });

  const isCustomer = thread.customerId === args.senderId;
  const isProvider = provider?.userId === args.senderId;
  if (!isCustomer && !isProvider) {
    throw new ForbiddenError('You are not part of this conversation.');
  }

  const now = new Date();
  const [message] = await db.$transaction([
    db.message.create({
      data: {
        threadId: thread.id,
        senderId: args.senderId,
        body,
      },
    }),
    db.messageThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: now,
        readByCustomerAt: isCustomer ? now : thread.readByCustomerAt,
        readByProviderAt: isProvider ? now : thread.readByProviderAt,
      },
    }),
  ]);

  // Notify the other party
  const recipientUserId = isCustomer ? provider?.userId : thread.customerId;
  if (recipientUserId) {
    const senderUser = await db.user.findUnique({
      where: { id: args.senderId },
      include: { customerProfile: true, providerProfile: true },
    });
    const senderLabel =
      senderUser?.providerProfile?.businessName ??
      senderUser?.customerProfile?.fullName ??
      'Someone';
    const preview = body.length > 80 ? body.slice(0, 80) + '…' : body;
    await notify({
      userId: recipientUserId,
      type: 'message.received',
      title: senderLabel + ' sent you a message',
      body: preview,
      data: { threadId: thread.id, href: '/messages/' + thread.id },
    });
  }

  return message;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const myProviderIds = await getOwnedProviderIds(userId);

  const orClauses: any[] = [{ customerId: userId }];
  if (myProviderIds.length > 0) {
    orClauses.push({ providerId: { in: myProviderIds } });
  }

  const threads = await db.messageThread.findMany({
    where: { OR: orClauses },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  let count = 0;
  for (const t of threads) {
    const last = t.messages[0];
    if (!last) continue;
    if (last.senderId === userId) continue;
    const isCustomer = t.customerId === userId;
    const readAt = isCustomer ? t.readByCustomerAt : t.readByProviderAt;
    if (!readAt || last.createdAt > readAt) count++;
  }
  return count;
}


// ─────────────────────────────────────────────────────────────────
// ATTACHMENTS
// ─────────────────────────────────────────────────────────────────

import { createMedia } from '@/server/services/media';
import { detectFormat } from '@/server/storage';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;   // 10MB
const MAX_PDF_BYTES   = 15 * 1024 * 1024;   // 15MB
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;   // 15MB

export async function sendMessageWithAttachments(args: {
  threadId: string;
  senderId: string;
  body: string;
  files: { filename: string; mime: string; bytes: Buffer }[];
}) {
  const body = args.body.trim();
  if (!body && args.files.length === 0) {
    throw new ValidationError('Message or attachment required.');
  }
  if (body.length > 4000) throw new ValidationError('Message is too long (max 4000 characters).');
  if (args.files.length > 5) throw new ValidationError('Maximum 5 attachments per message.');

  const thread = await db.messageThread.findUnique({ where: { id: args.threadId } });
  if (!thread) throw new NotFoundError('Conversation not found.');

  const provider = await db.providerProfile.findUnique({
    where: { id: thread.providerId },
    select: { userId: true },
  });

  const isCustomer = thread.customerId === args.senderId;
  const isProvider = provider?.userId === args.senderId;

  let isAdminSender = false;
  if (!isCustomer && !isProvider) {
    const adminRoleRow = await db.userRole.findFirst({
      where: { userId: args.senderId, role: { name: 'admin' } },
    });
    if (!adminRoleRow) throw new ForbiddenError('You are not part of this conversation.');
    isAdminSender = true;
  }

  // Validate every attachment before writing anything
  for (const f of args.files) {
    const detected = detectFormat(f.bytes);
    if (!detected) {
      throw new ValidationError('Attachment "' + f.filename + '" is not a supported file type.');
    }
    const isImage = detected === 'jpeg' || detected === 'png' || detected === 'webp';
    const isAudio = detected === 'webm' || detected === 'mp4' || detected === 'ogg' || detected === 'mp3';
    const isPdf = detected === 'pdf';

    if (isImage && f.bytes.length > MAX_IMAGE_BYTES) {
      throw new ValidationError('Image "' + f.filename + '" exceeds 10MB.');
    }
    if (isPdf && f.bytes.length > MAX_PDF_BYTES) {
      throw new ValidationError('PDF "' + f.filename + '" exceeds 15MB.');
    }
    if (isAudio && f.bytes.length > MAX_AUDIO_BYTES) {
      throw new ValidationError('Voice note "' + f.filename + '" exceeds 15MB.');
    }
  }

  const now = new Date();

  // Store media first (outside transaction is fine — cleanup handles failures)
  const uploaded: { mediaId: string; bytes: number }[] = [];
  for (const f of args.files) {
    const safe = f.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const filename = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safe;
    const { media } = await createMedia({
      ownerId: args.senderId,
      folder: 'messages/' + thread.id,
      filename,
      bytes: f.bytes,
      mime: f.mime,
    });
    uploaded.push({ mediaId: media.id, bytes: f.bytes.length });
  }

  const result = await db.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        threadId: thread.id,
        senderId: args.senderId,
        body: body || (uploaded.length === 1 ? '📎 Attachment' : '📎 ' + uploaded.length + ' attachments'),
      },
    });

    for (const u of uploaded) {
      await tx.messageAttachment.create({
        data: { messageId: message.id, mediaId: u.mediaId },
      });
    }

    await tx.messageThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: now,
        readByCustomerAt: isCustomer ? now : thread.readByCustomerAt,
        readByProviderAt: isProvider ? now : thread.readByProviderAt,
      },
    });

    return message;
  });

  if (isAdminSender) {
    await db.auditLog.create({
      data: {
        actorId: args.senderId,
        event: 'admin.thread.messaged',
        entityType: 'message_thread',
        entityId: thread.id,
        meta: {
          customerId: thread.customerId,
          providerId: thread.providerId,
          bodyPreview: body.slice(0, 120),
          attachments: uploaded.length,
        } as any,
      },
    });
  }

  return result;
}

export async function getThreadMessagesWithAttachments(threadId: string) {
  const messages = await db.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    include: { attachments: true },
  });

  const mediaIds = messages.flatMap((m) => m.attachments.map((a) => a.mediaId));
  const media = mediaIds.length
    ? await db.media.findMany({ where: { id: { in: mediaIds } } })
    : [];
  const mediaMap = new Map(media.map((m) => [m.id, m]));

  return messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt,
    attachments: m.attachments
      .map((a) => {
        const md = mediaMap.get(a.mediaId);
        if (!md) return null;
        return {
          id: md.id,
          url: '/uploads/' + md.storageKey,
          mime: md.mime,
          sizeBytes: md.sizeBytes,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  }));
}
