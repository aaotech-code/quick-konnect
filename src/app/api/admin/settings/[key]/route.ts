import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/server/db/client';
import { requireAuth, requirePermission } from '@/server/auth/guards';
import { detectFormat } from '@/server/storage';

const ALLOWED_KEYS = new Set(['site_name', 'site_logo_url', 'chatway_widget_code']);
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_TEXT = 20000;

const EXT_BY_FORMAT: Record<string, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export async function POST(req: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'settings.manage');

    const { key } = await ctx.params;
    if (!ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: 'Unknown setting.' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      let value: unknown = null;

      if (key === 'site_name') {
        if (typeof body.value !== 'string' || !body.value.trim() || body.value.length > 60) {
          return NextResponse.json({ error: 'Name must be 1-60 characters.' }, { status: 400 });
        }
        value = body.value.trim();
      }

      if (key === 'chatway_widget_code') {
        if (typeof body.value !== 'string') {
          return NextResponse.json({ error: 'Invalid value.' }, { status: 400 });
        }
        if (body.value.length > MAX_TEXT) {
          return NextResponse.json({ error: 'Snippet is too long.' }, { status: 400 });
        }
        value = body.value;
      }

      if (key === 'site_logo_url') {
        if (body.clear === true) value = '';
        else return NextResponse.json({ error: 'Send a file to update the logo.' }, { status: 400 });
      }

      await db.platformSetting.upsert({
        where: { key },
        update: { value: value as any, updatedBy: actor.userId },
        create: { key, valueType: 'string', value: value as any, description: null },
      });

      await db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'admin.setting.updated',
          entityType: 'platform_setting',
          entityId: key,
          meta: { length: String(value).length } as any,
        },
      });

      return NextResponse.json({ ok: true, value });
    }

    if (key !== 'site_logo_url') {
      return NextResponse.json({ error: 'This setting does not accept uploads.' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 2MB).' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const format = detectFormat(bytes);
    if (!format) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WebP images are allowed.' }, { status: 400 });
    }

    const ext = EXT_BY_FORMAT[format];
    const dir = path.join(process.cwd(), 'public', 'uploads', 'branding');
    await mkdir(dir, { recursive: true });

    const filename = 'logo-' + Date.now() + '.' + ext;
    const abs = path.join(dir, filename);
    await writeFile(abs, bytes);
    const publicUrl = '/uploads/branding/' + filename;

    const current = await db.platformSetting.findUnique({ where: { key: 'site_logo_url' } });
    const prev = typeof current?.value === 'string' ? (current!.value as string) : '';
    if (prev.startsWith('/uploads/branding/')) {
      const prevRel = prev.replace(/^\//, '');
      unlink(path.join(process.cwd(), 'public', prevRel)).catch(() => {});
    }

    await db.platformSetting.upsert({
      where: { key },
      update: { value: publicUrl, updatedBy: actor.userId },
      create: { key, valueType: 'string', value: publicUrl, description: null },
    });

    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        event: 'admin.setting.updated',
        entityType: 'platform_setting',
        entityId: key,
        meta: { value: publicUrl } as any,
      },
    });

    return NextResponse.json({ ok: true, imageUrl: publicUrl });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? 'Request failed.' }, { status });
  }
}
