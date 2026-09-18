/**
 * Email service.
 *
 * In development (no RESEND_API_KEY), emails are logged to the server
 * console so you can test flows without a provider account.
 *
 * In production (RESEND_API_KEY set), emails are sent via Resend.
 */

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; devMode: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    const body = args.text ?? stripHtml(args.html);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  EMAIL (dev mode - RESEND_API_KEY not configured)');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  To:      ' + args.to);
    console.log('  Subject: ' + args.subject);
    console.log('───────────────────────────────────────────────────────────────');
    console.log(body);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    return { ok: true, devMode: true };
  }

  const from = process.env.EMAIL_FROM?.trim() || 'Quick-Konnect <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[email] send failed:', res.status, errText);
    throw new Error('Could not send email. Please try again.');
  }

  return { ok: true, devMode: false };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
