import 'server-only';
import { SITE_URL } from '@/lib/site';

/**
 * Sends one transactional email through Resend's HTTP API. Returns false (and sends nothing)
 * until RESEND_API_KEY and EMAIL_FROM are set, so forms keep working before email is set up.
 * EMAIL_FROM must be an address on the shop's own verified domain, e.g.
 * "House of Kanishka <care@yourdomain.com>".
 */
export const emailConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail({ to, subject, html, text, replyTo }: Mail): Promise<boolean> {
  if (!emailConfigured) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * The house letter: white page, a red hairline and the lotus at the top, serif heading, sans
 * text, one black button, square corners.
 * Email clients can't load the site's fonts, so it falls back to system serif and sans.
 */
export function letter({ heading, lines, button }: { heading: string; lines: string[]; button?: { label: string; href: string } }) {
  const html = `<!doctype html><html><body style="margin:0;background:#ffffff;color:#000000;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="border-top:2px solid #a20f15;padding-top:28px;"><img src="${SITE_URL}/icon.png" width="40" height="40" alt="" style="display:block;border:0;"></td></tr>
<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;padding:14px 0 30px;border-bottom:1px solid #e6e6e6;">House of Kanishka</td></tr>
<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.15;padding:36px 0 18px;">${esc(heading)}</td></tr>
${lines.map((l) => `<tr><td style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;padding-bottom:14px;">${esc(l)}</td></tr>`).join('\n')}
${button ? `<tr><td style="padding:14px 0 8px;"><a href="${esc(button.href)}" style="display:inline-block;background:#000000;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 28px;">${esc(button.label)}</a></td></tr>` : ''}
<tr><td style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#767676;padding-top:36px;border-top:1px solid #e6e6e6;">House of Kanishka</td></tr>
</table></td></tr></table></body></html>`;
  const text = [heading, '', ...lines, ...(button ? ['', `${button.label}: ${button.href}`] : [])].join('\n');
  return { html, text };
}
