import { PrismaClient, RoleName } from '@prisma/client';

const ROLES: { name: RoleName; description: string }[] = [
  { name: 'admin',    description: 'Full platform access (owner only)' },
  { name: 'manager',  description: 'Operations staff - jobs, requests, disputes, verifications. No chat or user management.' },
  { name: 'admin',    description: 'Full platform access' },
  { name: 'support',  description: 'Moderation, disputes, verification' },
  { name: 'finance',  description: 'Payments view + refunds; NO settings.manage' },
  { name: 'customer', description: 'Customer/employer' },
  { name: 'provider', description: 'Service provider/worker' },
];

export async function seedRoles(db: PrismaClient) {
  for (const r of ROLES) {
    await db.role.upsert({
      where:  { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
}