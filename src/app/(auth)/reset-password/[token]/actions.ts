'use server';

import { completePasswordReset } from '@/server/services/password-reset';
import { validatePasswordStrength } from '@/server/auth/password';

export type ResetState = { ok?: boolean; error?: string } | undefined;

export async function resetPasswordAction(
  token: string,
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password !== confirm) {
    return { error: 'Passwords do not match.' };
  }

  const strengthError = validatePasswordStrength(password);
  if (strengthError) {
    return { error: strengthError };
  }

  try {
    await completePasswordReset({ rawToken: token, newPassword: password });
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not reset password.' };
  }
}
