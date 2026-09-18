import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/server/db/client';
import { hashPassword } from '@/server/auth/password';
import { sendEmail } from '@/server/services/email';

const TOKEN_TTL_MINUTES = 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Request a password reset.
 *
 * Always returns { ok: true } even if the email is not registered — this
 * prevents email enumeration attacks. The user-facing message is the same
 * either way.
 */
export async function requestPasswordReset(rawEmail: string) {
  const email = rawEmail.toLowerCase().trim();
  const user = await db.user.findUnique({ where: { email } });

  // Quietly succeed if the account doesn't exist or isn't usable
  if (!user) return { ok: true, sent: false };
  if (user.deletedAt) return { ok: true, sent: false };
  if (user.status === 'banned') return { ok: true, sent: false };

  // Invalidate any outstanding unused tokens for this user
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.APP_URL?.trim() || 'http://localhost:3000';
  const resetUrl = appUrl + '/reset-password/' + rawToken;

  const text = [
    'Hi,',
    '',
    'Someone requested a password reset for your Quick-Konnect account.',
    '',
    'Click the link below to set a new password:',
    resetUrl,
    '',
    'This link expires in ' + TOKEN_TTL_MINUTES + ' minutes.',
    '',
    'If you did not request this, you can safely ignore this email. Your password will not change.',
    '',
    '- Quick-Konnect',
  ].join('\n');

  const html = [
    '<div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">',
    '<h2 style="margin: 0 0 12px; font-size: 20px;">Reset your Quick-Konnect password</h2>',
    '<p style="line-height: 1.6; color: #444;">Someone requested a password reset for your Quick-Konnect account.</p>',
    '<p style="margin: 24px 0;">',
    '<a href="' + resetUrl + '" style="display: inline-block; padding: 12px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">Set a new password</a>',
    '</p>',
    '<p style="line-height: 1.6; color: #666; font-size: 13px;">Or copy this link into your browser:</p>',
    '<p style="line-height: 1.6; color: #666; font-size: 13px; word-break: break-all;">' + resetUrl + '</p>',
    '<p style="line-height: 1.6; color: #666; font-size: 13px; margin-top: 24px;">This link expires in ' + TOKEN_TTL_MINUTES + ' minutes.</p>',
    '<p style="line-height: 1.6; color: #999; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>',
    '</div>',
  ].join('');

  await sendEmail({
    to: user.email,
    subject: 'Reset your Quick-Konnect password',
    text,
    html,
  });

  return { ok: true, sent: true };
}

export async function validateResetToken(rawToken: string) {
  if (!rawToken || rawToken.length < 10) return null;
  const tokenHash = hashToken(rawToken);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;

  const user = await db.user.findUnique({ where: { id: record.userId } });
  if (!user) return null;
  if (user.deletedAt) return null;

  return { record, user };
}

export async function completePasswordReset(args: {
  rawToken: string;
  newPassword: string;
}) {
  const check = await validateResetToken(args.rawToken);
  if (!check) throw new Error('This reset link is invalid or has expired.');

  const passwordHash = await hashPassword(args.newPassword);
  const now = new Date();

  await db.$transaction([
    db.user.update({
      where: { id: check.user.id },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: check.record.id },
      data: { usedAt: now },
    }),
    // Revoke all sessions — force the user to sign in again with the new password
    db.session.updateMany({
      where: { userId: check.user.id, revokedAt: null },
      data: { revokedAt: now },
    }),
    db.auditLog.create({
      data: {
        actorId: check.user.id,
        event: 'user.password.reset',
        entityType: 'user',
        entityId: check.user.id,
        meta: {} as any,
      },
    }),
  ]);

  return { ok: true };
}
