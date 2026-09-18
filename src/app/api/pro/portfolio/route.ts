import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAuth } from '@/server/auth/guards';
import { createMedia, deleteMediaAndFile } from '@/server/services/media';
import { extFromMime } from '@/server/storage';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ITEMS = 10;

export async function POST(req: Request) {
  try {
    const actor = await requireAuth();

    const profile = await db.providerProfile.findUnique({ where: { userId: actor.userId } });
    if (!profile) {
      return NextResponse.json({ error: 'Create your provider profile first.' }, { status: 400 });
    }

    const count = await db.portfolioItem.count({ where: { providerId: profile.id } });
    if (count >= MAX_ITEMS) {
      return NextResponse.json(
        { error: 'You already have ' + MAX_ITEMS + ' portfolio items — remove one to add another.' },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    const title = (form.get('title') as string | null)?.trim() || null;
    const description = (form.get('description') as string | null)?.trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 8MB).' }, { status: 400 });
    }
    const ext = extFromMime(file.type);
    if (!ext) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WEBP allowed.' }, { status: 400 });
    }

    const filename = 'pf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const { media, publicUrl } = await createMedia({
      ownerId: actor.userId,
      folder: 'portfolio/' + profile.id,
      filename,
      bytes: Buffer.from(await file.arrayBuffer()),
      mime: file.type,
    });

    const sortOrder = count;
    const item = await db.portfolioItem.create({
      data: {
        providerId: profile.id,
        title,
        description,
        mediaId: media.id,
        sortOrder,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'portfolio.item.created',
        entityType: 'portfolio_item',
        entityId: item.id,
        meta: { providerId: profile.id, publicUrl } as any,
      },
    });

    revalidatePath('/provider/' + profile.slug);
    revalidatePath('/pro/portfolio');
    return NextResponse.json({ ok: true, itemId: item.id, publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Upload failed.' },
      { status: e?.status ?? 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await requireAuth();

    const profile = await db.providerProfile.findUnique({ where: { userId: actor.userId } });
    if (!profile) return NextResponse.json({ error: 'No profile.' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');
    if (!itemId) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

    const item = await db.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (item.providerId !== profile.id) {
      return NextResponse.json({ error: 'Not yours.' }, { status: 403 });
    }

    await db.portfolioItem.delete({ where: { id: itemId } });
    await deleteMediaAndFile(item.mediaId);

    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'portfolio.item.deleted',
        entityType: 'portfolio_item',
        entityId: itemId,
        meta: { providerId: profile.id } as any,
      },
    });

    revalidatePath('/provider/' + profile.slug);
    revalidatePath('/pro/portfolio');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Delete failed.' },
      { status: e?.status ?? 500 },
    );
  }
}
