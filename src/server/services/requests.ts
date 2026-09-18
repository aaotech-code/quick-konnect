import { db } from '@/server/db/client';
import { ValidationError, NotFoundError } from '@/server/auth/errors';
import { notify } from '@/server/services/notifications';

function makeRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'REQ-';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function uniqueRef(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const ref = makeRef();
    const exists = await db.serviceRequest.findUnique({ where: { publicRef: ref } });
    if (!exists) return ref;
  }
  throw new Error('Could not allocate request reference.');
}

export async function createServiceRequest(args: {
  customerId: string;
  categoryId: string;
  title: string;
  description: string;
  locationId: string;
  addressText?: string | null;
  preferredDate?: Date | null;
  preferredTimeWindow?: string | null;
  budgetMinKobo?: number | null;
  budgetMaxKobo?: number | null;
}) {
  const title = args.title.trim();
  const description = args.description.trim();

  if (title.length < 5 || title.length > 120) {
    throw new ValidationError('Title must be 5–120 characters.');
  }
  if (description.length < 20 || description.length > 2000) {
    throw new ValidationError('Description must be 20–2000 characters.');
  }

  const [category, location] = await Promise.all([
    db.serviceCategory.findUnique({ where: { id: args.categoryId } }),
    db.location.findUnique({ where: { id: args.locationId } }),
  ]);
  if (!category || !category.isActive) throw new ValidationError('Invalid category.');
  if (!location || !location.isActive) throw new ValidationError('Invalid location.');

  if (args.budgetMinKobo != null && args.budgetMinKobo < 0) {
    throw new ValidationError('Budget cannot be negative.');
  }
  if (args.budgetMaxKobo != null && args.budgetMaxKobo < 0) {
    throw new ValidationError('Budget cannot be negative.');
  }
  if (
    args.budgetMinKobo != null &&
    args.budgetMaxKobo != null &&
    args.budgetMinKobo > args.budgetMaxKobo
  ) {
    throw new ValidationError('Minimum budget cannot exceed maximum.');
  }

  if (args.preferredDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (args.preferredDate < now) {
      throw new ValidationError('Preferred date cannot be in the past.');
    }
  }

  const publicRef = await uniqueRef();

  const request = await db.$transaction(async (tx) => {
    const r = await tx.serviceRequest.create({
      data: {
        publicRef,
        customerId: args.customerId,
        categoryId: args.categoryId,
        title,
        description,
        locationId: args.locationId,
        addressText: args.addressText?.trim() || null,
        preferredDate: args.preferredDate ?? null,
        preferredTimeWindow: args.preferredTimeWindow ?? null,
        budgetMin: args.budgetMinKobo ?? null,
        budgetMax: args.budgetMaxKobo ?? null,
        status: 'open',
      },
    });

    // Dispatch: find providers that offer this category AND serve this location
    const matching = await tx.providerProfile.findMany({
      where: {
        userId: { not: args.customerId },
        categories: { some: { categoryId: args.categoryId } },
        locations: { some: { locationId: args.locationId } },
        verificationStatus: { notIn: ['suspended', 'rejected'] },
        publishedAt: { not: null },
      },
      select: { id: true },
    });

    if (matching.length > 0) {
      await tx.requestProvider.createMany({
        data: matching.map((p) => ({
          requestId: r.id,
          providerId: p.id,
        })),
        skipDuplicates: true,
      });
    }

    return { r, dispatchedCount: matching.length };
  });

  return { request: request.r, dispatchedCount: request.dispatchedCount };
}

export async function listCustomerRequests(customerId: string) {
  const requests = await db.serviceRequest.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      location: true,
      _count: { select: { quotes: true, providers: true } },
    },
  });
  return requests;
}

export async function getRequestDetailForCustomer(args: {
  publicRef: string;
  customerId: string;
}) {
  const request = await db.serviceRequest.findUnique({
    where: { publicRef: args.publicRef },
    include: {
      category: { include: { parent: true } },
      location: { include: { parent: true } },
      quotes: {
        include: {
          provider: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      providers: { select: { providerId: true } },
    },
  });
  if (!request) throw new NotFoundError('Request not found.');

  // Admins and support staff can view any request
  let isStaff = false;
  if (request.customerId !== args.customerId) {
    const roleRows = await db.userRole.findMany({
      where: {
        userId: args.customerId,
        role: { name: { in: ['admin', 'support'] } },
      },
      select: { roleId: true },
    });
    isStaff = roleRows.length > 0;
  }

  if (request.customerId !== args.customerId && !isStaff) {
    throw new NotFoundError('Request not found.');
  }
  return request;
}


// ─────────────────────────────────────────────────────────────────
// PROVIDER SIDE
// ─────────────────────────────────────────────────────────────────

async function getProviderProfileIdOrThrow(userId: string): Promise<string> {
  const profile = await db.providerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('No provider profile found.');
  return profile.id;
}

export async function listRequestsForProvider(userId: string) {
  const providerId = await getProviderProfileIdOrThrow(userId);

  const rows = await db.requestProvider.findMany({
    where: { providerId },
    orderBy: { invitedAt: 'desc' },
    include: {
      request: {
        include: {
          category: true,
          location: true,
          quotes: {
            where: { providerId },
            select: { id: true, amountKobo: true, status: true },
          },
          _count: { select: { quotes: true } },
        },
      },
    },
  });

  return rows.map((rp) => ({
    id: rp.request.id,
    publicRef: rp.request.publicRef,
    title: rp.request.title,
    description: rp.request.description,
    categoryName: rp.request.category.name,
    categoryIcon: rp.request.category.icon,
    locationName: rp.request.location.name,
    budgetMin: rp.request.budgetMin,
    budgetMax: rp.request.budgetMax,
    preferredDate: rp.request.preferredDate,
    status: rp.request.status,
    totalQuotes: rp.request._count.quotes,
    myQuote: rp.request.quotes[0] ?? null,
    invitedAt: rp.invitedAt,
    viewedAt: rp.viewedAt,
    declinedAt: rp.declinedAt,
  }));
}

export async function getRequestForProvider(args: {
  publicRef: string;
  userId: string;
}) {
  const providerId = await getProviderProfileIdOrThrow(args.userId);

  const request = await db.serviceRequest.findUnique({
    where: { publicRef: args.publicRef },
    include: {
      category: { include: { parent: true } },
      location: { include: { parent: true } },
      quotes: {
        where: { providerId },
      },
    },
  });
  if (!request) throw new NotFoundError('Request not found.');

  const dispatch = await db.requestProvider.findUnique({
    where: {
      requestId_providerId: { requestId: request.id, providerId },
    },
  });
  if (!dispatch) throw new NotFoundError('You were not invited to this request.');

  // Mark as viewed
  if (!dispatch.viewedAt) {
    await db.requestProvider.update({
      where: { requestId_providerId: { requestId: request.id, providerId } },
      data: { viewedAt: new Date() },
    });
  }

  return {
    request,
    myQuote: request.quotes[0] ?? null,
    declinedAt: dispatch.declinedAt,
    declineReason: dispatch.declineReason,
  };
}

export async function submitQuote(args: {
  publicRef: string;
  userId: string;
  amountKobo: number;
  durationEstimate?: string | null;
  description: string;
  materialsIncluded: boolean;
  materialsNotes?: string | null;
  conditions?: string | null;
  availableFrom?: Date | null;
}) {
  const providerId = await getProviderProfileIdOrThrow(args.userId);

  const request = await db.serviceRequest.findUnique({
    where: { publicRef: args.publicRef },
  });
  if (!request) throw new NotFoundError('Request not found.');
  if (request.status !== 'open') {
    throw new ValidationError('This request is no longer accepting quotes.');
  }

  const dispatch = await db.requestProvider.findUnique({
    where: {
      requestId_providerId: { requestId: request.id, providerId },
    },
  });
  if (!dispatch) throw new ValidationError('You were not invited to this request.');
  if (dispatch.declinedAt) {
    throw new ValidationError('You previously declined this request.');
  }

  const description = args.description.trim();
  if (description.length < 10 || description.length > 1000) {
    throw new ValidationError('Quote message must be 10–1000 characters.');
  }
  if (args.amountKobo <= 0) {
    throw new ValidationError('Amount must be greater than zero.');
  }
  if (args.amountKobo > 100_000_000_00) {
    throw new ValidationError('Amount looks unreasonable. Please review.');
  }

  const existing = await db.quote.findUnique({
    where: {
      requestId_providerId: { requestId: request.id, providerId },
    },
  });
  if (existing && existing.status === 'accepted') {
    throw new ValidationError('Your quote has already been accepted.');
  }

  const quote = existing
    ? await db.quote.update({
        where: { id: existing.id },
        data: {
          amountKobo: args.amountKobo,
          durationEstimate: args.durationEstimate?.trim() || null,
          description,
          materialsIncluded: args.materialsIncluded,
          materialsNotes: args.materialsNotes?.trim() || null,
          conditions: args.conditions?.trim() || null,
          availableFrom: args.availableFrom ?? null,
          status: 'submitted',
        },
      })
    : await db.quote.create({
        data: {
          requestId: request.id,
          providerId,
          amountKobo: args.amountKobo,
          description,
          durationEstimate: args.durationEstimate?.trim() || null,
          materialsIncluded: args.materialsIncluded,
          materialsNotes: args.materialsNotes?.trim() || null,
          conditions: args.conditions?.trim() || null,
          availableFrom: args.availableFrom ?? null,
          status: 'submitted',
        },
      });

  await db.auditLog.create({
    data: {
      actorId: args.userId,
      event: existing ? 'quote.updated' : 'quote.submitted',
      entityType: 'quote',
      entityId: quote.id,
      meta: { requestId: request.id, amountKobo: args.amountKobo } as any,
    },
  });

  // Notify the customer — but only on the first submission, not updates
  if (!existing) {
    const provider = await db.providerProfile.findUnique({
      where: { id: providerId },
      select: { businessName: true, slug: true },
    });
    const amountNaira = Math.round(args.amountKobo / 100).toLocaleString();
    await notify({
      userId: request.customerId,
      type: 'quote.received',
      title: 'New quote from ' + (provider?.businessName ?? 'a provider'),
      body: 'They quoted ₦' + amountNaira + ' for "' + request.title + '".',
      data: {
        requestRef: request.publicRef,
        quoteId: quote.id,
        href: '/requests/' + request.publicRef,
      },
    });
  }

  return quote;
}

export async function declineRequest(args: {
  publicRef: string;
  userId: string;
  reason?: string | null;
}) {
  const providerId = await getProviderProfileIdOrThrow(args.userId);

  const request = await db.serviceRequest.findUnique({
    where: { publicRef: args.publicRef },
  });
  if (!request) throw new NotFoundError('Request not found.');

  const dispatch = await db.requestProvider.findUnique({
    where: {
      requestId_providerId: { requestId: request.id, providerId },
    },
  });
  if (!dispatch) throw new ValidationError('You were not invited to this request.');

  // Cannot decline if already quoted
  const existingQuote = await db.quote.findUnique({
    where: { requestId_providerId: { requestId: request.id, providerId } },
  });
  if (existingQuote) {
    throw new ValidationError('You already submitted a quote for this request.');
  }

  await db.requestProvider.update({
    where: { requestId_providerId: { requestId: request.id, providerId } },
    data: {
      declinedAt: new Date(),
      declineReason: args.reason?.trim() || null,
    },
  });

  return { ok: true };
}


export async function getProviderDispatchDiagnostics(userId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId },
    include: { categories: true, locations: true },
  });
  if (!profile) {
    return { hasProfile: false, profile: null, reasons: ['No provider profile found.'] };
  }

  const reasons: string[] = [];
  if (profile.categories.length === 0) reasons.push('You have not selected any service categories.');
  if (profile.locations.length === 0) reasons.push('You have not selected any service areas.');
  if (!profile.publishedAt) reasons.push('Your profile is not published yet.');
  if (profile.verificationStatus === 'suspended' || profile.verificationStatus === 'rejected') {
    reasons.push('Your profile is ' + profile.verificationStatus + '. Contact support.');
  }

  return {
    hasProfile: true,
    profile: {
      categories: profile.categories.length,
      locations: profile.locations.length,
      published: Boolean(profile.publishedAt),
      verificationStatus: profile.verificationStatus,
    },
    reasons,
  };
}
