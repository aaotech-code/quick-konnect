import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { RoleName } from '@prisma/client';
import { db } from '@/server/db/client';

const COOKIE_NAME = 'ts_session';
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface AuthContext {
  userId: string;
  sessionId: string;
  roles: RoleName[];
}

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(args: {
  userId: string;
  ip?: string;
  userAgent?: string;
}): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      userId: args.userId,
      tokenHash,
      ip: args.ip?.slice(0, 64) ?? null,
      userAgent: args.userAgent?.slice(0, 512) ?? null,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  const user = session.user;
  if (user.status === 'suspended' || user.status === 'banned') return null;
  if (user.deletedAt) return null;

  const roles = user.roles.map((ur) => ur.role.name);

  return {
    userId: user.id,
    sessionId: session.id,
    roles,
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  const tokenHash = hashToken(token);
  await db.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  cookieStore.delete(COOKIE_NAME);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
