'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { slugify } from '@/lib/slug';

async function getMeta() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: h.get('user-agent') ?? undefined,
  };
}

async function findNigeria() {
  return db.location.findFirst({ where: { type: 'country', slug: 'nigeria' } });
}

export async function toggleLocationActive(locationId: string, next: boolean) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'settings.manage');

    const loc = await db.location.findUnique({ where: { id: locationId } });
    if (!loc) return { ok: false, error: 'Location not found.' };

    await db.location.update({ where: { id: locationId }, data: { isActive: next } });

    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: next ? 'location.enabled' : 'location.disabled',
        entityType: 'location',
        entityId: locationId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { name: loc.name, slug: loc.slug } as any,
      },
    });

    revalidatePath('/admin/locations');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}

// ── Single add: city under existing state, or new state + optional city
export async function createLocation(args: {
  parentId: string;
  name: string;
  slug: string;
  type?: 'city';
}) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'settings.manage');

    if (!args.name.trim() || args.name.length > 80) {
      return { ok: false, error: 'Name must be 1–80 characters.' };
    }
    const slug = args.slug || slugify(args.name);
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return { ok: false, error: 'Invalid slug.' };
    }

    const parent = await db.location.findUnique({ where: { id: args.parentId } });
    if (!parent) return { ok: false, error: 'Parent not found.' };

    const existing = await db.location.findFirst({
      where: { parentId: args.parentId, slug },
    });
    if (existing) return { ok: false, error: 'A location with that slug already exists here.' };

    const created = await db.location.create({
      data: {
        parentId: args.parentId,
        type: args.type ?? 'city',
        name: args.name.trim(),
        slug,
        isActive: true,
      },
    });

    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'location.created',
        entityType: 'location',
        entityId: created.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { name: created.name, slug: created.slug, parent: parent.name } as any,
      },
    });

    revalidatePath('/admin/locations');
    return { ok: true, id: created.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}

// ── New state (under Nigeria) with optional single initial city
export async function createState(args: {
  name: string;
  initialCity?: string;
}) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'settings.manage');

    const name = args.name.trim();
    if (!name || name.length > 80) return { ok: false, error: 'State name must be 1–80 characters.' };
    const slug = slugify(name);
    if (!slug) return { ok: false, error: 'Could not derive a slug.' };

    const nigeria = await findNigeria();
    if (!nigeria) return { ok: false, error: 'Nigeria root not found.' };

    const existing = await db.location.findFirst({
      where: { parentId: nigeria.id, slug },
    });
    if (existing) return { ok: false, error: 'That state already exists.' };

    const state = await db.location.create({
      data: {
        parentId: nigeria.id,
        type: 'state',
        name,
        slug,
        isActive: true,
      },
    });

    let cityCreated: string | null = null;
    if (args.initialCity && args.initialCity.trim()) {
      const cityName = args.initialCity.trim();
      const citySlug = slugify(cityName);
      await db.location.create({
        data: {
          parentId: state.id,
          type: 'city',
          name: cityName,
          slug: citySlug,
          isActive: true,
        },
      });
      cityCreated = cityName;
    }

    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'location.state.created',
        entityType: 'location',
        entityId: state.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { name, slug, initialCity: cityCreated } as any,
      },
    });

    revalidatePath('/admin/locations');
    return { ok: true, id: state.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}

// ── Bulk import: "State: city1, city2, city3" per line
export async function bulkImportLocations(input: { text: string }) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'settings.manage');

    const nigeria = await findNigeria();
    if (!nigeria) return { ok: false, error: 'Nigeria root not found.' };

    const { parsed, parseErrors } = parseBulk(input.text);
    if (parsed.length === 0) {
      return { ok: false, error: 'Nothing to import. Check the format.' };
    }

    const summary = {
      statesCreated: 0,
      statesSkipped: 0,
      citiesCreated: 0,
      citiesSkipped: 0,
      parseErrors,
      details: [] as string[],
    };

    for (const entry of parsed) {
      const stateSlug = slugify(entry.name);
      if (!stateSlug) {
        summary.details.push('Skipped invalid state: ' + entry.name);
        continue;
      }

      let state = await db.location.findFirst({
        where: { parentId: nigeria.id, slug: stateSlug },
      });

      if (!state) {
        state = await db.location.create({
          data: {
            parentId: nigeria.id,
            type: 'state',
            name: entry.name,
            slug: stateSlug,
            isActive: true,
          },
        });
        summary.statesCreated++;
      } else {
        summary.statesSkipped++;
      }

      for (const cityName of entry.cities) {
        const citySlug = slugify(cityName);
        if (!citySlug) continue;

        const cityExists = await db.location.findFirst({
          where: { parentId: state.id, slug: citySlug },
        });
        if (cityExists) {
          summary.citiesSkipped++;
          continue;
        }

        await db.location.create({
          data: {
            parentId: state.id,
            type: 'city',
            name: cityName,
            slug: citySlug,
            isActive: true,
          },
        });
        summary.citiesCreated++;
      }
    }

    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'location.bulk_import',
        entityType: 'location',
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { summary } as any,
      },
    });

    revalidatePath('/admin/locations');
    return { ok: true, summary };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}

// ── Parser ─────────────────────────────────────────────────────────
function parseBulk(text: string): {
  parsed: { name: string; cities: string[] }[];
  parseErrors: string[];
} {
  const parsed: { name: string; cities: string[] }[] = [];
  const parseErrors: string[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    const colonIdx = line.indexOf(':');
    if (colonIdx >= 0) {
      const stateName = line.slice(0, colonIdx).trim();
      const cityPart = line.slice(colonIdx + 1).trim();
      if (!stateName) {
        parseErrors.push('Line ' + (i + 1) + ': missing state name before colon');
        return;
      }
      const cities = cityPart
        ? cityPart.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      parsed.push({ name: stateName, cities });
    } else {
      parsed.push({ name: line, cities: [] });
    }
  });

  return { parsed, parseErrors };
}


export async function toggleLocationFeatured(locationId: string, next: boolean) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'settings.manage');

    const loc = await db.location.findUnique({ where: { id: locationId } });
    if (!loc) return { ok: false, error: 'Location not found.' };

    await db.location.update({
      where: { id: locationId },
      data: { isFeatured: next },
    });

    const meta = await getMeta();
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: next ? 'location.featured' : 'location.unfeatured',
        entityType: 'location',
        entityId: locationId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: { name: loc.name, slug: loc.slug } as any,
      },
    });

    revalidatePath('/admin/locations');
    revalidatePath('/');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed.' };
  }
}
