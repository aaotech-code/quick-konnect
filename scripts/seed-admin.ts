/**
 * Create or promote an admin user.
 *
 * Usage:
 *   npm run seed:admin -- <email> <password>
 *
 * Example:
 *   npm run seed:admin -- you@example.com "MyStrongPassword123"
 *
 * Refuses to run with weak or missing arguments.
 */

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

function fail(msg: string): never {
  console.error('');
  console.error('ERROR: ' + msg);
  console.error('');
  console.error('Usage: npm run seed:admin -- <email> <password>');
  console.error('Example: npm run seed:admin -- you@example.com "MyStrongPassword123"');
  console.error('');
  process.exit(1);
}

async function main() {
  const email = (process.argv[2] ?? '').toLowerCase().trim();
  const password = process.argv[3] ?? '';

  if (!email || !email.includes('@') || !email.includes('.')) {
    fail('Provide a valid email address as the first argument.');
  }
  if (password.length < 10) {
    fail('Password must be at least 10 characters.');
  }
  if (password.length > 200) {
    fail('Password is too long.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const adminRole = await db.role.findUnique({ where: { name: 'admin' } });
  if (!adminRole) {
    fail('Roles not seeded. Run: npx prisma db seed');
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash, status: 'active' },
    });

    const already = await db.userRole.findUnique({
      where: { userId_roleId: { userId: existing.id, roleId: adminRole.id } },
    });
    if (!already) {
      await db.userRole.create({
        data: { userId: existing.id, roleId: adminRole.id },
      });
    }

    console.log('');
    console.log('  ✓ Admin updated:');
    console.log('    Email:    ' + email);
    console.log('    Password: (the one you just provided)');
    console.log('    Role:     admin');
    console.log('');

    await db.session.updateMany({
      where: { userId: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else {
    const created = await db.user.create({
      data: {
        email,
        passwordHash,
        status: 'active',
        emailVerifiedAt: new Date(),
        customerProfile: {
          create: { fullName: 'Admin' },
        },
      },
    });

    await db.userRole.create({
      data: { userId: created.id, roleId: adminRole.id },
    });

    console.log('');
    console.log('  ✓ Admin created:');
    console.log('    Email:    ' + email);
    console.log('    Password: (the one you just provided)');
    console.log('    Role:     admin');
    console.log('');
  }

  console.log('  Sign in at /login and go to /admin');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
