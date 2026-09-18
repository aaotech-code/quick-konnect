import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAuth } from '@/server/auth/guards';
import { createMedia } from '@/server/services/media';
import { extFromMime } from '@/server/storage';

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const actor = await requireAuth();

    const profile = await db.providerProfile.findUnique({ where: { userId: actor.userId } });
    if (!profile) {
      return NextResponse.json({ error: 'Create your provider profile first.' }, { status: 400 });
    }

    const form = await req.formData();
    const idFile = form.get('idFile');
    const selfieFile = form.get('selfieFile');

    if (!(idFile instanceof File) || !(selfieFile instanceof File)) {
      return NextResponse.json({ error: 'Both files required.' }, { status: 400 });
    }
    if (idFile.size > MAX_BYTES || selfieFile.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Each file must be under 8MB.' }, { status: 400 });
    }
    const idExt = extFromMime(idFile.type);
    const selfieExt = extFromMime(selfieFile.type);
    if (!idExt || !selfieExt) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WEBP allowed.' }, { status: 400 });
    }

    // Block if there's already a pending identity check
    const pending = await db.providerVerification.findFirst({
      where: { providerId: profile.id, type: 'identity', status: 'pending' },
    });
    if (pending) {
      return NextResponse.json({ error: 'You already have a pending identity check.' }, { status: 400 });
    }

    const stamp = Date.now();
    const idResult = await createMedia({
      ownerId: actor.userId,
      folder: 'verifications/' + profile.id,
      filename: 'id-' + stamp + '.' + idExt,
      bytes: Buffer.from(await idFile.arrayBuffer()),
      mime: idFile.type,
    });
    const selfieResult = await createMedia({
      ownerId: actor.userId,
      folder: 'verifications/' + profile.id,
      filename: 'selfie-' + stamp + '.' + selfieExt,
      bytes: Buffer.from(await selfieFile.arrayBuffer()),
      mime: selfieFile.type,
    });

    const idDocType = (form.get('idDocType') as string | null)?.trim() || 'ID';

    await db.$transaction([
      db.providerVerification.create({
        data: {
          providerId: profile.id,
          type: 'identity',
          status: 'pending',
          documentMediaId: idResult.media.id,
          selfieMediaId: selfieResult.media.id,
          notes: 'ID type: ' + idDocType,
        },
      }),
      db.providerProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus:
            profile.verificationStatus === 'new' || profile.verificationStatus === 'phone_verified'
              ? 'pending'
              : profile.verificationStatus,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'provider.verification.submitted',
          entityType: 'provider_verification',
          ip: undefined,
          userAgent: undefined,
          meta: { providerId: profile.id, type: 'identity', idDocType } as any,
        },
      }),
    ]);

    revalidatePath('/pro/verification');
    revalidatePath('/admin/verifications');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Upload failed.' },
      { status: e?.status ?? 500 },
    );
  }
}
