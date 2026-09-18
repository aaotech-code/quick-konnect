import { db } from '@/server/db/client';
import { ValidationError, NotFoundError, ForbiddenError } from '@/server/auth/errors';
import { notify } from '@/server/services/notifications';

export const DISPUTE_REASONS = [
  { value: 'not_as_agreed', label: 'Work was not as agreed' },
  { value: 'quality_issue', label: 'Quality of work is poor' },
  { value: 'wrong_person', label: 'A different person showed up (Face Verified)' },
  { value: 'no_show', label: 'Provider did not show up' },
  { value: 'other', label: 'Something else' },
] as const;

export const DISPUTE_RESOLUTIONS = [
  { value: 'redo', label: 'I want the provider to redo the work' },
  { value: 'partial_refund', label: 'I want a partial refund' },
  { value: 'full_refund', label: 'I want a full refund' },
  { value: 'cancel', label: 'I want the job cancelled' },
  { value: 'other', label: 'Other' },
] as const;

const VALID_REASONS = new Set(DISPUTE_REASONS.map((r) => r.value));
const VALID_RESOLUTIONS = new Set(DISPUTE_RESOLUTIONS.map((r) => r.value));

export function reasonLabel(value: string): string {
  return DISPUTE_REASONS.find((r) => r.value === value)?.label ?? value;
}

export function resolutionLabel(value: string): string {
  return DISPUTE_RESOLUTIONS.find((r) => r.value === value)?.label ?? value;
}

export async function openDispute(args: {
  jobPublicRef: string;
  userId: string;
  reasonCode: string;
  description: string;
  requestedResolution: string;
}) {
  if (!VALID_REASONS.has(args.reasonCode as any)) {
    throw new ValidationError('Invalid dispute reason.');
  }
  if (!VALID_RESOLUTIONS.has(args.requestedResolution as any)) {
    throw new ValidationError('Invalid requested resolution.');
  }
  const description = args.description.trim();
  if (description.length < 20 || description.length > 2000) {
    throw new ValidationError('Description must be 20–2000 characters.');
  }

  const job = await db.job.findUnique({
    where: { publicRef: args.jobPublicRef },
    include: {
      provider: { select: { id: true, userId: true, businessName: true } },
    },
  });
  if (!job) throw new NotFoundError('Job not found.');

  const isCustomer = job.customerId === args.userId;
  const isProvider = job.provider.userId === args.userId;
  if (!isCustomer && !isProvider) throw new ForbiddenError('You are not part of this job.');

  if (job.status === 'cancelled') {
    throw new ValidationError('This job was cancelled.');
  }
  if (job.status === 'disputed') {
    throw new ValidationError('A dispute is already open for this job.');
  }

  // Customer can open after provider marked complete, or after completed
  if (isCustomer) {
    const allowed = ['provider_marked_complete', 'completed'];
    if (!allowed.includes(job.status)) {
      throw new ValidationError('You can only open a dispute after the provider has marked the work complete.');
    }
    // 30-day window after completion
    if (job.customerConfirmedAt) {
      const days = (Date.now() - job.customerConfirmedAt.getTime()) / 86400000;
      if (days > 30) {
        throw new ValidationError('The 30-day dispute window has closed for this job.');
      }
    }
  }

  // Provider can open only if customer-confirmed state is unusual — for now allow during in-progress / awaiting confirmation
  if (isProvider) {
    const allowed = ['provider_selected', 'in_progress', 'provider_marked_complete'];
    if (!allowed.includes(job.status)) {
      throw new ValidationError('You cannot open a dispute on this job in its current state.');
    }
  }

  const dispute = await db.$transaction(async (tx) => {
    const created = await tx.dispute.create({
      data: {
        jobId: job.id,
        openedBy: args.userId,
        reasonCode: args.reasonCode,
        description,
        requestedResolution: args.requestedResolution,
        status: 'open',
      },
    });

    await tx.job.update({
      where: { id: job.id },
      data: { status: 'disputed' },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: 'disputed',
        changedBy: args.userId,
        note: isCustomer ? 'Customer opened a dispute' : 'Provider opened a dispute',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: args.userId,
        event: 'dispute.opened',
        entityType: 'dispute',
        entityId: created.id,
        meta: {
          jobRef: job.publicRef,
          reasonCode: args.reasonCode,
          openedByRole: isCustomer ? 'customer' : 'provider',
        } as any,
      },
    });

    return created;
  });

  // Notify the counterparty
  const recipientUserId = isCustomer ? job.provider.userId : job.customerId;
  if (recipientUserId) {
    await notify({
      userId: recipientUserId,
      type: 'job.customer_confirmed', // reuse closest existing type; more granular types can be added later
      title: isCustomer ? 'A dispute was opened on your job' : 'A dispute was opened',
      body: 'Job ' + job.publicRef + ': ' + reasonLabel(args.reasonCode) + '. Our team will review it.',
      data: { jobRef: job.publicRef, href: '/jobs/' + job.publicRef },
    });
  }

  return dispute;
}

export async function getOpenDisputeForJob(jobId: string) {
  return db.dispute.findFirst({
    where: { jobId, status: { in: ['open', 'under_review', 'awaiting_evidence'] } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLatestDisputeForJob(jobId: string) {
  return db.dispute.findFirst({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listOpenDisputes() {
  return db.dispute.findMany({
    where: { status: { in: ['open', 'under_review', 'awaiting_evidence'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      job: {
        include: {
          request: { include: { category: true, location: true } },
          provider: { include: { user: { select: { email: true } } } },
        },
      },
    },
  });
}

export async function listResolvedDisputes(limit = 20) {
  return db.dispute.findMany({
    where: { status: { in: ['resolved_released', 'resolved_refunded', 'resolved_partial', 'cancelled'] } },
    orderBy: { resolvedAt: 'desc' },
    take: limit,
    include: {
      job: {
        include: {
          provider: { include: { user: { select: { email: true } } } },
        },
      },
    },
  });
}

export async function resolveDispute(args: {
  disputeId: string;
  adminId: string;
  decision: 'favor_provider' | 'favor_customer' | 'cancelled';
  resolution: string;
}) {
  const resolution = args.resolution.trim();
  if (resolution.length < 10 || resolution.length > 2000) {
    throw new ValidationError('Resolution summary must be 10–2000 characters.');
  }

  const dispute = await db.dispute.findUnique({
    where: { id: args.disputeId },
    include: {
      job: {
        include: {
          provider: { select: { id: true, userId: true } },
        },
      },
    },
  });
  if (!dispute) throw new NotFoundError('Dispute not found.');
  if (['resolved_released', 'resolved_refunded', 'resolved_partial', 'cancelled'].includes(dispute.status)) {
    throw new ValidationError('This dispute is already resolved.');
  }

  const statusMap: Record<string, string> = {
    favor_provider: 'resolved_released',
    favor_customer: 'resolved_refunded',
    cancelled: 'cancelled',
  };
  const nextStatus = statusMap[args.decision];

  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: dispute.id },
      data: {
        status: nextStatus as any,
        resolution,
        resolvedBy: args.adminId,
        resolvedAt: now,
      },
    });

    // If favour provider, restore the job to its pre-dispute state or mark completed
    if (args.decision === 'favor_provider') {
      const restore = dispute.job.providerCompletedAt ? 'provider_marked_complete' : 'in_progress';
      await tx.job.update({
        where: { id: dispute.jobId },
        data: { status: restore as any },
      });
      await tx.jobStatusHistory.create({
        data: {
          jobId: dispute.jobId,
          fromStatus: 'disputed',
          toStatus: restore,
          changedBy: args.adminId,
          note: 'Dispute resolved in favour of the provider',
        },
      });
    }

    // If cancelled, cancel the job
    if (args.decision === 'cancelled') {
      await tx.job.update({
        where: { id: dispute.jobId },
        data: { status: 'cancelled', cancelledAt: now, cancelReason: 'Dispute closed by admin' },
      });
      await tx.jobStatusHistory.create({
        data: {
          jobId: dispute.jobId,
          fromStatus: 'disputed',
          toStatus: 'cancelled',
          changedBy: args.adminId,
          note: 'Dispute resolved — job cancelled',
        },
      });
    }

    // favour_customer: leave job in disputed state; the parties resolve the money off-platform

    await tx.adminAction.create({
      data: {
        adminId: args.adminId,
        action: 'dispute.resolved',
        entityType: 'dispute',
        entityId: dispute.id,
        before: { status: dispute.status } as any,
        after: { status: nextStatus, decision: args.decision } as any,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: args.adminId,
        event: 'dispute.resolved',
        entityType: 'dispute',
        entityId: dispute.id,
        meta: {
          jobRef: dispute.job.publicRef,
          decision: args.decision,
        } as any,
      },
    });
  });

  // Notify both parties
  const jobRef = dispute.job.publicRef;
  const notifyBody = 'Resolution: ' + resolution;

  await notify({
    userId: dispute.job.customerId,
    type: 'job.customer_confirmed',
    title: 'Dispute resolved',
    body: 'Job ' + jobRef + ': ' + notifyBody,
    data: { jobRef, href: '/jobs/' + jobRef },
  });

  await notify({
    userId: dispute.job.provider.userId,
    type: 'job.customer_confirmed',
    title: 'Dispute resolved',
    body: 'Job ' + jobRef + ': ' + notifyBody,
    data: { jobRef, href: '/jobs/' + jobRef },
  });

  return { ok: true };
}
