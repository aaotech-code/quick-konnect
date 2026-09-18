import { db } from '@/server/db/client';
import { putObject, deleteObject } from '@/server/storage';

export async function createMedia(args: {
  ownerId: string;
  folder: string;
  filename: string;
  bytes: Buffer;
  mime: string;
}) {
  const put = await putObject({
    folder: args.folder,
    filename: args.filename,
    bytes: args.bytes,
    contentType: args.mime,
  });

  const media = await db.media.create({
    data: {
      ownerId: args.ownerId,
      storageKey: put.key,
      mime: args.mime,
      sizeBytes: put.sizeBytes,
      checksum: put.checksum,
      scanStatus: 'clean',
    },
  });

  return { media, publicUrl: put.publicUrl };
}

export async function deleteMediaAndFile(mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  await deleteObject(media.storageKey);
  await db.media.delete({ where: { id: mediaId } }).catch(() => {});
}
