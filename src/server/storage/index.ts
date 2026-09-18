import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Storage adapter. Today: writes to /public/uploads/.
 * Tomorrow: swap this file to write to Cloudflare R2 — no caller changes.
 */

export interface PutResult {
  key: string;
  publicUrl: string;
  checksum: string;
  sizeBytes: number;
}

/**
 * Verify the file's actual bytes match an allowed image format.
 * Never trust file.type — it is set by the browser and can be spoofed.
 */
export type DetectedFormat = 'jpeg' | 'png' | 'webp' | 'pdf' | 'webm' | 'mp4' | 'ogg' | 'mp3' | null;

export function detectFormat(bytes: Buffer): DetectedFormat {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) return 'png';

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';

  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf';

  // WebM / MKV: 1A 45 DF A3 (EBML header)
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'webm';

  // OGG: "OggS"
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return 'ogg';

  // MP4 / M4A: ftyp at offset 4
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) return 'mp4';

  // MP3: "ID3" or frame sync FFFB / FFF3 / FFF2
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return 'mp3';
  if (bytes[0] === 0xff && (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2)) return 'mp3';

  return null;
}

const EXT_BY_FORMAT: Record<string, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  pdf: 'pdf',
  webm: 'webm',
  mp4: 'm4a',
  ogg: 'ogg',
  mp3: 'mp3',
};

export async function putObject(args: {
  folder: string;
  filename: string;
  bytes: Buffer;
  contentType: string;
}): Promise<PutResult> {
  const format = detectFormat(args.bytes);
  if (!format) {
    throw new Error('Unsupported file type. Allowed: images, PDF, voice notes.');
  }

  const ext = EXT_BY_FORMAT[format];

  const safeFolder = args.folder
    .replace(/[^a-z0-9/_-]/gi, '')
    .split('/')
    .filter((s) => s && s !== '.' && s !== '..')
    .join('/');

  const rawBase = args.filename.replace(/\.[a-zA-Z0-9]+$/, '');
  const safeBase = rawBase.replace(/[^a-z0-9_-]/gi, '') || 'file';

  const key = safeFolder ? safeFolder + '/' + safeBase + '.' + ext : safeBase + '.' + ext;

  const dir = safeFolder
    ? path.join(process.cwd(), 'public', 'uploads', safeFolder)
    : path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });

  const abs = path.join(process.cwd(), 'public', 'uploads', key);
  await writeFile(abs, args.bytes);

  return {
    key,
    publicUrl: '/uploads/' + key,
    checksum: createHash('sha256').update(args.bytes).digest('hex'),
    sizeBytes: args.bytes.length,
  };
}

export async function deleteObject(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith('/uploads/')) return;
  const rel = publicUrl.replace(/^\/uploads\//, '');
  const abs = path.join(process.cwd(), 'public', 'uploads', rel);
  await unlink(abs).catch(() => {});
}

export function extFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mime] ?? null;
}
