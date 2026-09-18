import type { RoleName } from '@prisma/client';
import type { AuthContext } from './session';
import { getAuthContext } from './session';
import { UnauthorizedError, ForbiddenError } from './errors';
import { anyRoleHasPermission, type Permission } from './rbac';

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

export function requireRole(actor: AuthContext, role: RoleName): void {
  if (!actor.roles.includes(role)) throw new ForbiddenError();
}

export function requireAnyRole(actor: AuthContext, roles: RoleName[]): void {
  if (!roles.some((r) => actor.roles.includes(r))) throw new ForbiddenError();
}

export function requirePermission(actor: AuthContext, permission: Permission): void {
  if (!anyRoleHasPermission(actor.roles, permission)) throw new ForbiddenError();
}
