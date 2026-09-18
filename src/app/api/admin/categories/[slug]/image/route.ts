import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/server/db/client';
import { requireAuth, requirePermission } from '@/server/auth/guards';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'categories.manage');

    const { slug } = await ctx.params;
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    const cat = await db.serviceCategory.findUnique({ where: { slug } });
    if (!cat) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WEBP allowed.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', 'categories');
    await mkdir(dir, { recursive: true });

    // Write new file with a version suffix so browser caches bust cleanly
    const stamp = Date.now();
    const filename = slug + '-' + stamp + '.' + ext;
    const abs = path.join(dir, filename);
    await writeFile(abs, Buffer.from(await file.arrayBuffer()));

    const publicUrl = '/uploads/categories/' + filename;

    // Best-effort cleanup of previous file if it was a local upload
    if (cat.imageUrl && cat.imageUrl.startsWith('/uploads/categories/')) {
      const prev = path.join(process.cwd(), 'public', cat.imageUrl.replace(/^\//, ''));
      unlink(prev).catch(() => {});
    }

    await db.serviceCategory.update({
      where: { slug },
      data: { imageUrl: publicUrl },
    });

    return NextResponse.json({ ok: true, imageUrl: publicUrl });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? 'Upload failed.' }, { status });
  }
}
