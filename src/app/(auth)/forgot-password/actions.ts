'use server';

import { requestPasswordReset } from '@/server/services/password-reset';

export type ForgotState = { ok?: boolean; error?: string } | undefined;

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!email || !email.includes('@')) {
    return { error: 'Enter a valid email address.' };
  }

  try {
    await requestPasswordReset(email);
  } catch (e) {
    console.error('[forgot-password]', e);
    // Still return ok — do not leak provider / network errors to the client
  }

  return { ok: true };
}
