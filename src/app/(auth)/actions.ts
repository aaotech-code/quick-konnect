'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { registerSchema, loginSchema } from '@/lib/validators/auth';
import { registerUser, authenticateUser } from '@/server/services/auth';
import { createSession, revokeCurrentSession } from '@/server/auth/session';

export type FormState = { error?: string } | undefined;

function getClientMeta(h: Headers) {
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: h.get('user-agent') ?? undefined,
  };
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  try {
    const user = await registerUser(parsed.data);
    const h = await headers();
    await createSession({ userId: user.id, ...getClientMeta(h) });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Registration failed.' };
  }

  redirect('/dashboard');
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Invalid email or password.' };
  }

  try {
    const user = await authenticateUser(parsed.data);
    const h = await headers();
    await createSession({ userId: user.id, ...getClientMeta(h) });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Login failed.' };
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  await revokeCurrentSession();
  redirect('/login');
}
