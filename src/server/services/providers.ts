import { db } from '@/server/db/client';
import { slugify } from '@/lib/slug';
import { ValidationError, ConflictError } from '@/server/auth/errors';

async function generateUniqueSlug(base: string): Promise<string> {
  const clean = slugify(base).slice(0, 60) || 'provider';
  let candidate = clean;
  let n = 1;
  // Try up to 100 suffixes
  while (n < 100) {
    const existing = await db.providerProfile.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    n++;
    candidate = clean + '-' + n;
  }
  throw new ConflictError('Could not allocate a unique slug. Try a different business name.');
}

export async function createProviderProfile(args: {
  userId: string;
  businessName: string;
  tagline?: string | null;
  description: string;
  yearsExperience?: number | null;
  categoryIds: string[];
  locationIds: string[];
}) {
  // Validate inputs
  const businessName = args.businessName.trim();
  if (businessName.length < 2 || businessName.length > 100) {
    throw new ValidationError('Business name must be 2–100 characters.');
  }
  const description = args.description.trim();
  if (description.length < 20 || description.length > 3000) {
    throw new ValidationError('Description must be 20–3000 characters.');
  }
  if (args.categoryIds.length === 0) {
    throw new ValidationError('Pick at least one service category.');
  }
  if (args.categoryIds.length > 12) {
    throw new ValidationError('Pick at most 12 categories.');
  }
  if (args.locationIds.length === 0) {
    throw new ValidationError('Pick at least one service area.');
  }
  if (args.locationIds.length > 30) {
    throw new ValidationError('Pick at most 30 service areas.');
  }

  // Existing profile guard
  const existing = await db.providerProfile.findUnique({ where: { userId: args.userId } });
  if (existing) {
    throw new ConflictError('You already have a provider profile.');
  }

  // Validate categories and locations exist
  const [cats, locs] = await Promise.all([
    db.serviceCategory.findMany({ where: { id: { in: args.categoryIds }, isActive: true } }),
    db.location.findMany({ where: { id: { in: args.locationIds }, isActive: true } }),
  ]);
  if (cats.length !== args.categoryIds.length) {
    throw new ValidationError('One or more categories are invalid.');
  }
  if (locs.length !== args.locationIds.length) {
    throw new ValidationError('One or more locations are invalid.');
  }

  const slug = await generateUniqueSlug(businessName);

  return db.$transaction(async (tx) => {
    const profile = await tx.providerProfile.create({
      data: {
        userId: args.userId,
        slug,
        businessName,
        tagline: args.tagline?.trim() || null,
        description,
        yearsExperience: args.yearsExperience ?? null,
        publishedAt: new Date(),
      },
    });

    for (const cid of args.categoryIds) {
      await tx.providerCategory.create({
        data: { providerId: profile.id, categoryId: cid },
      });
      const cat = cats.find((c) => c.id === cid)!;
      await tx.providerService.create({
        data: {
          providerId: profile.id,
          categoryId: cid,
          title: cat.name,
          priceType: 'quote',
          isActive: true,
        },
      });
    }

    for (const lid of args.locationIds) {
      await tx.providerLocation.create({
        data: { providerId: profile.id, locationId: lid, isPrimary: false },
      });
    }

    return profile;
  });
}

export async function getProviderForUser(userId: string) {
  return db.providerProfile.findUnique({
    where: { userId },
    include: {
      categories: { include: { category: { include: { parent: true } } } },
      locations: { include: { location: { include: { parent: true } } } },
      services: true,
    },
  });
}

export async function getProviderBySlug(slug: string) {
  return db.providerProfile.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: { include: { parent: true } } } },
      locations: { include: { location: { include: { parent: true } } } },
      services: true,
      portfolio: { orderBy: { sortOrder: 'asc' } },
      user: { select: { id: true, email: true, createdAt: true } },
    },
  });
}


// ─────────────────────────────────────────────────────────────────
// PUBLIC LISTING
// ─────────────────────────────────────────────────────────────────

export type ProviderSort = 'recommended' | 'rating' | 'jobs' | 'newest';

export async function listPublicProviders(args: {
  q?: string;
  categoryId?: string;
  locationId?: string;
  verifiedOnly?: boolean;
  sort?: ProviderSort;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, args.pageSize ?? 24));

  const where: any = {
    publishedAt: { not: null },
    verificationStatus: { notIn: ['suspended', 'rejected'] },
  };

  if (args.verifiedOnly) {
    where.verificationStatus = 'verified';
  }
  if (args.categoryId) {
    where.categories = { some: { categoryId: args.categoryId } };
  }
  if (args.locationId) {
    where.locations = { some: { locationId: args.locationId } };
  }
  if (args.q && args.q.trim()) {
    const q = args.q.trim();
    where.OR = [
      { businessName: { contains: q, mode: 'insensitive' } },
      { tagline: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const orderBy =
    args.sort === 'rating' ? [{ ratingAvg: 'desc' as const }, { ratingCount: 'desc' as const }]
    : args.sort === 'jobs' ? [{ jobsCompleted: 'desc' as const }]
    : args.sort === 'newest' ? [{ publishedAt: 'desc' as const }]
    : [{ jobsCompleted: 'desc' as const }, { ratingAvg: 'desc' as const }];

  const [total, rows] = await Promise.all([
    db.providerProfile.count({ where }),
    db.providerProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        categories: { include: { category: true } },
        locations: { include: { location: { include: { parent: true } } } },
      },
    }),
  ]);

  const logoIds = rows.map((p) => p.logoMediaId).filter((x): x is string => Boolean(x));
  const media = logoIds.length
    ? await db.media.findMany({ where: { id: { in: logoIds } } })
    : [];
  const logoMap = new Map(media.map((m) => [m.id, '/uploads/' + m.storageKey]));

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    providers: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      businessName: p.businessName,
      tagline: p.tagline,
      verificationStatus: p.verificationStatus,
      ratingAvg: Number(p.ratingAvg),
      ratingCount: p.ratingCount,
      jobsCompleted: p.jobsCompleted,
      yearsExperience: p.yearsExperience,
      avatarUrl: p.logoMediaId ? logoMap.get(p.logoMediaId) ?? null : null,
      categories: p.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        icon: c.category.icon,
      })),
      locations: p.locations.map((l) => ({
        name: l.location.name,
        stateName: l.location.parent?.name ?? null,
      })),
    })),
  };
}
