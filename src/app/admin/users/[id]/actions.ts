'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { RoleName } from '@prisma/client';
import { db } from '@/server/db/client';
import { requireAuth, requirePermission } from '@/server/auth/guards';

const VALID: RoleName[] = ['admin', 'support', 'finance', 'customer', 'provider'];

function isRoleName(v: string): v is RoleName {
  return (VALID as string[]).includes(v);
}

async function getMeta() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: h.get('user-agent') ?? undefined,
  };
}

export async function grantRole(userId: string, roleName: string) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'users.manage');

    if (!isRoleName(roleName)) return { ok: false, error: 'Unknown role.' };

    const [user, role] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.role.findUnique({ where: { name: roleName } }),
    ]);
    if (!user) return { ok: false, error: 'User not found.' };
    if (!role) return { ok: false, error: 'Role not found.' };

    const exists = await db.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (exists) return { ok: true };

    const meta = await getMeta();

    await db.$transaction([
      db.userRole.create({ data: { userId, roleId: role.id, grantedBy: actor.userId } }),
      db.adminAction.create({
        data: {
          adminId: actor.userId,
          action: 'user.role.grant',
          entityType: 'user',
          entityId: userId,
          after: { role: roleName } as any,
          ip: meta.ip,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'user.role.grant',
          entityType: 'user',
          entityId: userId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: { role: roleName, targetEmail: user.email } as any,
        },
      }),
    ]);

    revalidatePath('/admin/users/' + userId);
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Grant failed.' };
  }
}

export async function revokeRole(userId: string, roleName: string) {
  try {
    const actor = await requireAuth();
    requirePermission(actor, 'users.manage');

    if (!isRoleName(roleName)) return { ok: false, error: 'Unknown role.' };

    const [user, role] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.role.findUnique({ where: { name: roleName } }),
    ]);
    if (!user) return { ok: false, error: 'User not found.' };
    if (!role) return { ok: false, error: 'Role not found.' };

    if (roleName === 'admin') {
      const adminCount = await db.userRole.count({ where: { roleId: role.id } });
      if (adminCount <= 1) {
        return { ok: false, error: 'Cannot remove the last admin.' };
      }
    }

    const meta = await getMeta();

    await db.$transaction([
      db.userRole.deleteMany({ where: { userId, roleId: role.id } }),
      db.adminAction.create({
        data: {
          adminId: actor.userId,
          action: 'user.role.revoke',
          entityType: 'user',
          entityId: userId,
          before: { role: roleName } as any,
          ip: meta.ip,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.userId,
          event: 'user.role.revoke',
          entityType: 'user',
          entityId: userId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          meta: { role: roleName, targetEmail: user.email } as any,
        },
      }),
    ]);

    revalidatePath('/admin/users/' + userId);
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Revoke failed.' };
  }
}
