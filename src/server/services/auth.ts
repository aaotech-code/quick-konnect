import { db } from '@/server/db/client';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { ValidationError, ConflictError, UnauthorizedError } from '@/server/auth/errors';

export async function registerUser(input: {
  email: string;
  phone?: string;
  password: string;
  fullName: string;
}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('An account with this email already exists.');

  const passwordHash = await hashPassword(input.password);

  return db.$transaction(async (tx) => {
    const customerRole = await tx.role.findUniqueOrThrow({ where: { name: 'customer' } });

    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone && input.phone.length > 0 ? input.phone : null,
        passwordHash,
        status: 'active',
        customerProfile: {
          create: { fullName: input.fullName },
        },
      },
    });

    await tx.userRole.create({
      data: { userId: user.id, roleId: customerRole.id },
    });

    return user;
  });
}

export async function authenticateUser(input: { email: string; password: string }) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedError('Invalid email or password.');
  if (user.status === 'suspended') throw new UnauthorizedError('Account suspended.');
  if (user.status === 'banned') throw new UnauthorizedError('Account banned.');
  if (user.deletedAt) throw new UnauthorizedError('Invalid email or password.');

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) throw new UnauthorizedError('Invalid email or password.');

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
}
