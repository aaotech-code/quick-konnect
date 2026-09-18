import { db } from '@/server/db/client';
import { ValidationError, NotFoundError, ForbiddenError } from '@/server/auth/errors';
import { notify } from '@/server/services/notifications';

function makeRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'JOB-';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function uniqueJobRef(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const ref = makeRef();
    const exists = await db.job.findUnique({ where: { publicRef: ref } });
    if (!exists) return ref;
  }
  throw new Error('Could not allocate job reference.');
}

export async function acceptQuote(args: {
  requestRef: string;
  quoteId: string;
  customerId: string;
}) {
  const request = await db.serviceRequest.findUnique({
    where: { publicRef: args.requestRef },
    include: { quotes: true },
  });
  if (!request) throw new NotFoundError('Request not found.');
  if (request.customerId !== args.customerId) {
    throw new ForbiddenError('You do not own this request.');
  }
  if (request.status !== 'open') {
    throw new ValidationError('This request is no longer accepting quotes.');
  }

  const quote = request.quotes.find((q) => q.id === args.quoteId);
  if (!quote) throw new ValidationError('Quote not found.');
  if (quote.status === 'accepted') throw new ValidationError('This quote was already accepted.');
  if (quote.status !== 'submitted') {
    throw new ValidationError('This quote can no longer be accepted.');
  }

  const existingJob = await db.job.findUnique({ where: { requestId: request.id } });
  if (existingJob) {
    throw new ValidationError('A job already exists for this request.');
  }

  const publicRef = await uniqueJobRef();

  const job = await db.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quote.id },
      data: { status: 'accepted' },
    });

    await tx.quote.updateMany({
      where: { requestId: request.id, id: { not: quote.id } },
      data: { status: 'rejected' },
    });

    await tx.serviceRequest.update({
      where: { id: request.id },
      data: { status: 'closed' },
    });

    const created = await tx.job.create({
      data: {
        publicRef,
        requestId: request.id,
        quoteId: quote.id,
        customerId: args.customerId,
        providerId: quote.providerId,
        agreedAmountKobo: quote.amountKobo,
        currency: quote.currency,
        paymentMode: 'direct',
        status: 'provider_selected',
        commissionRate: 0,
        commissionAmountKobo: 0,
      },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId: created.id,
        fromStatus: null,
        toStatus: 'provider_selected',
        changedBy: args.customerId,
        note: 'Quote accepted',
      },
    });

    // Link existing message thread (if any) to this job
    const existingThread = await tx.messageThread.findUnique({
      where: {
        customerId_providerId: {
          customerId: args.customerId,
          providerId: quote.providerId,
        },
      },
    });
    if (existingThread) {
      await tx.messageThread.update({
        where: { id: existingThread.id },
        data: { jobId: created.id },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: args.customerId,
        event: 'quote.accepted',
        entityType: 'job',
        entityId: created.id,
        meta: {
          requestId: request.id,
          quoteId: quote.id,
          amountKobo: quote.amountKobo,
          providerId: quote.providerId,
        } as any,
      },
    });

    // Notify the winning provider
    const providerProfile = await tx.providerProfile.findUnique({
      where: { id: quote.providerId },
      select: { userId: true, businessName: true },
    });
    if (providerProfile) {
      await notify({
        userId: providerProfile.userId,
        type: 'quote.accepted',
        title: 'Your quote was accepted',
        body: 'You won the job "' + request.title + '". Agreed amount: ₦' + Math.round(quote.amountKobo / 100).toLocaleString() + '.',
        data: {
          jobRef: created.publicRef,
          href: '/jobs/' + created.publicRef,
        },
      });
    }

    return created;
  });

  return job;
}

export async function getJobForUser(args: {
  publicRef: string;
  userId: string;
}) {
  const job = await db.job.findUnique({
    where: { publicRef: args.publicRef },
    include: {
      request: {
        include: {
          category: { include: { parent: true } },
          location: { include: { parent: true } },
        },
      },
      quote: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!job) throw new NotFoundError('Job not found.');

  const providerProfile = await db.providerProfile.findUnique({
    where: { id: job.providerId },
    include: { user: { select: { id: true, email: true } } },
  });
  const customerUser = await db.user.findUnique({
    where: { id: job.customerId },
    include: { customerProfile: true },
  });

  const isCustomer = job.customerId === args.userId;
  const isProvider = providerProfile?.userId === args.userId;

  // Admins and support staff can view any job
  let isStaff = false;
  if (!isCustomer && !isProvider) {
    const roleRows = await db.userRole.findMany({
      where: {
        userId: args.userId,
        role: { name: { in: ['admin', 'support'] } },
      },
      select: { roleId: true },
    });
    isStaff = roleRows.length > 0;
  }

  if (!isCustomer && !isProvider && !isStaff) {
    throw new ForbiddenError('You are not part of this job.');
  }

  let providerAvatarUrl: string | null = null;
  if (providerProfile?.logoMediaId) {
    const m = await db.media.findUnique({ where: { id: providerProfile.logoMediaId } });
    if (m) providerAvatarUrl = '/uploads/' + m.storageKey;
  }

  // Load linked message thread if any
  const thread = await db.messageThread.findFirst({
    where: {
      customerId: job.customerId,
      providerId: job.providerId,
    },
    select: { id: true },
  });

  return {
    job,
    request: job.request,
    quote: job.quote,
    provider: providerProfile
      ? {
          id: providerProfile.id,
          slug: providerProfile.slug,
          businessName: providerProfile.businessName,
          ratingAvg: Number(providerProfile.ratingAvg),
          ratingCount: providerProfile.ratingCount,
          jobsCompleted: providerProfile.jobsCompleted,
          avatarUrl: providerAvatarUrl,
          email: providerProfile.user.email,
        }
      : null,
    customer: customerUser
      ? {
          id: customerUser.id,
          name: customerUser.customerProfile?.fullName ?? customerUser.email,
          email: customerUser.email,
        }
      : null,
    isCustomer,
    isProvider,
    threadId: thread?.id ?? null,
  };
}

export async function listCustomerJobs(customerId: string) {
  const jobs = await db.job.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      request: {
        include: {
          category: true,
          location: true,
        },
      },
    },
  });

  const providerIds = jobs.map((j) => j.providerId);
  const providers = providerIds.length
    ? await db.providerProfile.findMany({
        where: { id: { in: providerIds } },
        select: { id: true, businessName: true, slug: true, logoMediaId: true },
      })
    : [];
  const logoIds = providers.map((p) => p.logoMediaId).filter((x): x is string => !!x);
  const media = logoIds.length
    ? await db.media.findMany({ where: { id: { in: logoIds } } })
    : [];
  const logoMap = new Map(media.map((m) => [m.id, '/uploads/' + m.storageKey]));
  const provMap = new Map(
    providers.map((p) => [
      p.id,
      {
        businessName: p.businessName,
        slug: p.slug,
        avatarUrl: p.logoMediaId ? logoMap.get(p.logoMediaId) ?? null : null,
      },
    ]),
  );

  return jobs.map((j) => ({
    id: j.id,
    publicRef: j.publicRef,
    title: j.request.title,
    categoryName: j.request.category.name,
    categoryIcon: j.request.category.icon,
    locationName: j.request.location.name,
    agreedAmountKobo: j.agreedAmountKobo,
    status: j.status,
    createdAt: j.createdAt,
    provider: provMap.get(j.providerId) ?? null,
  }));
}

export async function listProviderJobs(userId: string) {
  const profile = await db.providerProfile.findUnique({ where: { userId } });
  if (!profile) return [];

  const jobs = await db.job.findMany({
    where: { providerId: profile.id },
    orderBy: { createdAt: 'desc' },
    include: {
      request: {
        include: {
          category: true,
          location: true,
        },
      },
    },
  });

  const customerIds = jobs.map((j) => j.customerId);
  const customers = customerIds.length
    ? await db.user.findMany({
        where: { id: { in: customerIds } },
        include: { customerProfile: true },
      })
    : [];
  const custMap = new Map(
    customers.map((c) => [
      c.id,
      {
        name: c.customerProfile?.fullName ?? c.email,
        email: c.email,
      },
    ]),
  );

  return jobs.map((j) => ({
    id: j.id,
    publicRef: j.publicRef,
    title: j.request.title,
    categoryName: j.request.category.name,
    categoryIcon: j.request.category.icon,
    locationName: j.request.location.name,
    agreedAmountKobo: j.agreedAmountKobo,
    status: j.status,
    createdAt: j.createdAt,
    customer: custMap.get(j.customerId) ?? null,
  }));
}

export function jobStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    provider_selected: { label: 'Provider selected', color: 'amber' },
    awaiting_payment: { label: 'Awaiting payment', color: 'amber' },
    payment_secured: { label: 'Payment secured', color: 'blue' },
    scheduled: { label: 'Scheduled', color: 'blue' },
    in_progress: { label: 'In progress', color: 'blue' },
    provider_marked_complete: { label: 'Awaiting your confirmation', color: 'violet' },
    customer_confirmed: { label: 'Confirmed', color: 'emerald' },
    payment_released: { label: 'Payment released', color: 'emerald' },
    completed: { label: 'Completed', color: 'emerald' },
    cancelled: { label: 'Cancelled', color: 'red' },
    disputed: { label: 'Disputed', color: 'red' },
  };
  return map[status] ?? { label: status.replace(/_/g, ' '), color: 'slate' };
}


// ─────────────────────────────────────────────────────────────────
// JOB LIFECYCLE
// ─────────────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, { to: string[]; by: 'provider' | 'customer' }> = {
  provider_selected: { to: ['in_progress', 'cancelled'], by: 'provider' },
  in_progress: { to: ['provider_marked_complete', 'cancelled'], by: 'provider' },
  provider_marked_complete: { to: ['completed', 'disputed'], by: 'customer' },
  disputed: { to: ['completed', 'cancelled'], by: 'customer' },
};

async function assertCanTransition(args: {
  jobId: string;
  userId: string;
  toStatus: string;
}) {
  const job = await db.job.findUnique({
    where: { id: args.jobId },
    include: {
      provider: { select: { userId: true } },
    },
  });
  if (!job) throw new NotFoundError('Job not found.');

  const isCustomer = job.customerId === args.userId;
  const isProvider = job.provider.userId === args.userId;
  if (!isCustomer && !isProvider) throw new ForbiddenError('You are not part of this job.');

  const rules = ALLOWED_TRANSITIONS[job.status];
  if (!rules) {
    throw new ValidationError('This job cannot move to a new status right now.');
  }
  if (!rules.to.includes(args.toStatus)) {
    throw new ValidationError('Cannot move job from ' + job.status + ' to ' + args.toStatus + '.');
  }
  if (rules.by === 'provider' && !isProvider) {
    throw new ForbiddenError('Only the provider can make this change.');
  }
  if (rules.by === 'customer' && !isCustomer) {
    throw new ForbiddenError('Only the customer can make this change.');
  }

  return { job, isCustomer, isProvider };
}

export async function startJob(args: { publicRef: string; userId: string }) {
  const job = await db.job.findUnique({ where: { publicRef: args.publicRef } });
  if (!job) throw new NotFoundError('Job not found.');

  const { isProvider } = await assertCanTransition({
    jobId: job.id,
    userId: args.userId,
    toStatus: 'in_progress',
  });

  const now = new Date();
  await db.$transaction([
    db.job.update({
      where: { id: job.id },
      data: { status: 'in_progress', startedAt: now },
    }),
    db.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: 'in_progress',
        changedBy: args.userId,
        note: isProvider ? 'Provider started the work' : null,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: args.userId,
        event: 'job.started',
        entityType: 'job',
        entityId: job.id,
        meta: { publicRef: job.publicRef } as any,
      },
    }),
  ]);

  // Notify the customer
  await notify({
    userId: job.customerId,
    type: 'job.started',
    title: 'Work has started',
    body: 'Your provider marked "' + job.publicRef + '" as in progress.',
    data: { jobRef: job.publicRef, href: '/jobs/' + job.publicRef },
  });

  return { ok: true };
}

export async function markJobComplete(args: { publicRef: string; userId: string }) {
  const job = await db.job.findUnique({ where: { publicRef: args.publicRef } });
  if (!job) throw new NotFoundError('Job not found.');

  await assertCanTransition({
    jobId: job.id,
    userId: args.userId,
    toStatus: 'provider_marked_complete',
  });

  const now = new Date();
  await db.$transaction([
    db.job.update({
      where: { id: job.id },
      data: { status: 'provider_marked_complete', providerCompletedAt: now },
    }),
    db.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: 'provider_marked_complete',
        changedBy: args.userId,
        note: 'Provider marked the work as complete',
      },
    }),
    db.auditLog.create({
      data: {
        actorId: args.userId,
        event: 'job.provider_completed',
        entityType: 'job',
        entityId: job.id,
        meta: { publicRef: job.publicRef } as any,
      },
    }),
  ]);

  // Notify the customer
  await notify({
    userId: job.customerId,
    type: 'job.provider_completed',
    title: 'Provider says the work is done',
    body: 'Please review "' + job.publicRef + '" and confirm completion.',
    data: { jobRef: job.publicRef, href: '/jobs/' + job.publicRef },
  });

  return { ok: true };
}

export async function confirmJobCompletion(args: { publicRef: string; userId: string }) {
  const job = await db.job.findUnique({ where: { publicRef: args.publicRef } });
  if (!job) throw new NotFoundError('Job not found.');

  await assertCanTransition({
    jobId: job.id,
    userId: args.userId,
    toStatus: 'completed',
  });

  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: job.id },
      data: { status: 'completed', customerConfirmedAt: now },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: 'completed',
        changedBy: args.userId,
        note: 'Customer confirmed completion',
      },
    });

    // Increment provider jobs_completed
    await tx.providerProfile.update({
      where: { id: job.providerId },
      data: { jobsCompleted: { increment: 1 } },
    });

    await tx.auditLog.create({
      data: {
        actorId: args.userId,
        event: 'job.customer_confirmed',
        entityType: 'job',
        entityId: job.id,
        meta: { publicRef: job.publicRef } as any,
      },
    });
  });

  // Notify the provider
  const providerForNotif = await db.providerProfile.findUnique({
    where: { id: job.providerId },
    select: { userId: true },
  });
  if (providerForNotif) {
    await notify({
      userId: providerForNotif.userId,
      type: 'job.customer_confirmed',
      title: 'Customer confirmed completion',
      body: 'Job ' + job.publicRef + ' is now complete. The review will appear on your profile.',
      data: { jobRef: job.publicRef, href: '/jobs/' + job.publicRef },
    });
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────

export async function createReview(args: {
  publicRef: string;
  userId: string;
  ratingOverall: number;
  ratingQuality?: number | null;
  ratingProfessionalism?: number | null;
  ratingCommunication?: number | null;
  ratingTimeliness?: number | null;
  ratingValue?: number | null;
  body?: string | null;
}) {
  const job = await db.job.findUnique({
    where: { publicRef: args.publicRef },
    include: {
      provider: { select: { id: true, userId: true } },
    },
  });
  if (!job) throw new NotFoundError('Job not found.');
  if (job.customerId !== args.userId) throw new ForbiddenError('Only the customer can leave a review.');
  if (job.status !== 'completed') {
    throw new ValidationError('You can only review completed jobs.');
  }

  const existing = await db.review.findUnique({ where: { jobId: job.id } });
  if (existing) throw new ValidationError('You already reviewed this job.');

  const r = args.ratingOverall;
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    throw new ValidationError('Rating must be between 1 and 5.');
  }
  const body = args.body?.trim() || null;
  if (body && body.length > 2000) {
    throw new ValidationError('Review must be under 2000 characters.');
  }

  const review = await db.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        jobId: job.id,
        providerId: job.providerId,
        customerId: args.userId,
        ratingOverall: r,
        ratingQuality: args.ratingQuality ?? null,
        ratingProfessionalism: args.ratingProfessionalism ?? null,
        ratingCommunication: args.ratingCommunication ?? null,
        ratingTimeliness: args.ratingTimeliness ?? null,
        ratingValue: args.ratingValue ?? null,
        body,
        status: 'published',
      },
    });

    // Recompute provider aggregate rating
    const all = await tx.review.findMany({
      where: { providerId: job.providerId, status: 'published' },
      select: { ratingOverall: true },
    });
    const count = all.length;
    const avg = count > 0 ? all.reduce((s, rv) => s + rv.ratingOverall, 0) / count : 0;

    await tx.providerProfile.update({
      where: { id: job.providerId },
      data: {
        ratingAvg: avg.toFixed(2) as any,
        ratingCount: count,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: args.userId,
        event: 'review.created',
        entityType: 'review',
        entityId: created.id,
        meta: { jobId: job.id, providerId: job.providerId, rating: r } as any,
      },
    });

    return created;
  });

  // Notify the provider
  const providerForReviewNotif = await db.providerProfile.findUnique({
    where: { id: job.providerId },
    select: { userId: true },
  });
  if (providerForReviewNotif) {
    await notify({
      userId: providerForReviewNotif.userId,
      type: 'job.review_received',
      title: 'You received a ' + r + '-star review',
      body: 'For job ' + job.publicRef + '. Open your profile to see it.',
      data: { jobRef: job.publicRef, href: '/jobs/' + job.publicRef },
    });
  }

  return review;
}

export async function getJobReview(publicRef: string) {
  const job = await db.job.findUnique({ where: { publicRef } });
  if (!job) return null;
  return db.review.findUnique({ where: { jobId: job.id } });
}

export async function listProviderReviews(providerId: string, limit = 10) {
  return db.review.findMany({
    where: { providerId, status: 'published' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      job: {
        select: {
          publicRef: true,
          request: { select: { title: true, category: { select: { name: true } } } },
        },
      },
    },
  });
}
