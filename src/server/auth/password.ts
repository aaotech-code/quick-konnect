import argon2 from 'argon2';

// OWASP 2023 recommended minimum for Argon2id: 19 MiB, t=2, p=1
const ARGON2_OPTIONS = {
  type: argon2.argon2id as 2, // 2 = argon2id
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/** Returns null if acceptable, else a user-facing error message. */
export function validatePasswordStrength(plain: string): string | null {
  if (typeof plain !== 'string') return 'Invalid password.';
  if (plain.length < 10) return 'Password must be at least 10 characters.';
  if (plain.length > 128) return 'Password must be under 128 characters.';
  return null;
}
