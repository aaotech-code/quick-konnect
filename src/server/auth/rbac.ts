import type { RoleName } from '@prisma/client';

/**
 * Permission matrix.
 *
 * Design:
 *   - admin: the platform owner. Full access.
 *   - manager: senior operations hire. Everything except chats, users,
 *     settings, payment configuration, and role granting.
 *   - support: junior staff. Disputes, verifications, review moderation.
 *   - finance: accountant. Payment viewing + refunds only.
 */
export const PERMISSIONS = {
  // Operational
  'providers.verify':    ['admin', 'manager', 'support'],
  'providers.manage':    ['admin', 'manager'],
  'reviews.moderate':    ['admin', 'manager', 'support'],
  'disputes.resolve':    ['admin', 'manager', 'support'],
  'jobs.view_all':       ['admin', 'manager'],
  'requests.view_all':   ['admin', 'manager'],
  'categories.manage':   ['admin', 'manager'],
  'locations.manage':    ['admin', 'manager'],

  // Admin-only
  'users.manage':        ['admin'],
  'settings.manage':     ['admin'],
  'audit.view':          ['admin'],
  'roles.grant':         ['admin'],

  // Chat oversight
  'chat.read_all':       ['admin'],
  'chat.send_all':       ['admin'],

  // Payments
  'payments.view':       ['admin', 'finance'],
  'payments.refund':     ['admin', 'finance'],
  'payments.manage':     ['admin'],
} as const satisfies Record<string, readonly RoleName[]>;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: RoleName, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly RoleName[]).includes(role);
}

export function anyRoleHasPermission(roles: RoleName[], permission: Permission): boolean {
  return roles.some((r) => roleHasPermission(r, permission));
}
