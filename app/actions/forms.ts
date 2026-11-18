'use server';

import { z } from 'zod';
import { BUSINESS } from '@/lib/business';
import { letter, sendEmail } from '@/lib/email';
import { withinRateLimit } from '@/lib/rate-limit';
import { SITE_URL } from '@/lib/site';
import { TURNSTILE_FAILED, verifyTurnstile } from '@/lib/turnstile';
import { adminDb } from '@/lib/supabase/server';

export type FormState = { ok: true; message: string } | { ok: false; message: string } | null;

const BUSY = 'Too many attempts. Please try again in a few minutes.';
const FAILED = 'Something went wrong on our side. Please try again.';

/** A hidden field real visitors never fill in; bots usually do. Filled = silently accepted and dropped. */
const isBot = (form: FormData) => String(form.get('company') ?? '') !== '';

// ---------- Newsletter (double opt-in) ----------

const newsletterInput = z.object({ email: z.email().max(254) });

export async function subscribeNewsletter(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = newsletterInput.safeParse({ email: String(form.get('email') ?? '').trim() });
  if (!parsed.success) return { ok: false, message: 'Please enter a valid email address.' };
  if (isBot(form)) return { ok: true, message: 'Thank you.' };
  if (!(await verifyTurnstile(form.get('cf-turnstile-response'), 'newsletter'))) return { ok: false, message: TURNSTILE_FAILED };
  if (!(await withinRateLimit('newsletter', 5, 600))) return { ok: false, message: BUSY };

  const db = adminDb();
  const { email } = parsed.data;
  const existing = await db.from('newsletter_subscribers').select('status, token').eq('email', email).maybeSingle();
  if (existing.error) return { ok: false, message: FAILED };
  if (existing.data?.status === 'confirmed') return { ok: true, message: 'Thank you. You are already on our list.' };

  let token = existing.data?.token;
  if (!existing.data) {
    const created = await db.from('newsletter_subscribers').insert({ email, source: 'home' }).select('token').single();
    if (created.error) return { ok: false, message: FAILED };
    token = created.data.token;
  } else if (existing.data.status === 'unsubscribed') {
    await db.from('newsletter_subscribers').update({ status: 'pending', unsubscribed_at: null }).eq('email', email);
  }
  await db.from('consent_log').insert({ email, kind: 'newsletter', granted: true, source: 'newsletter-form' });

  // Double opt-in: the address only counts once its owner confirms from the email.
  const sent = await sendEmail({
    to: email,
    subject: 'Confirm your place on our list',
    ...letter({
      heading: 'One last step',
      lines: [
        'Thank you for joining the House of Kanishka world.',
        'Please confirm your email address, and you will be the first to discover new collections and exclusive offers.',
        'If this was not you, simply ignore this letter.',
      ],
      button: { label: 'Confirm my email', href: `${SITE_URL}/newsletter/confirm?token=${token}` },
    }),
  });
  return {
    ok: true,
    message: sent ? 'Thank you. Please confirm from the email we just sent you.' : 'Thank you. Your place on our list is saved.',
  };
}

// ---------- Contact form ----------

const contactInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  order: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(5000),
});

export async function sendContactMessage(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = contactInput.safeParse({
    name: form.get('name'),
    email: String(form.get('email') ?? '').trim(),
    order: String(form.get('order') ?? '') || undefined,
    message: form.get('message'),
  });
  if (!parsed.success) return { ok: false, message: 'Please fill in your name, a valid email address and your message.' };
  const done: FormState = { ok: true, message: 'Thank you. Your message has reached us, and we will reply by email.' };
  if (isBot(form)) return done;
  if (!(await verifyTurnstile(form.get('cf-turnstile-response'), 'contact'))) return { ok: false, message: TURNSTILE_FAILED };
  if (!(await withinRateLimit('contact', 4, 900))) return { ok: false, message: BUSY };

  const { name, email, order, message } = parsed.data;
  const { error } = await adminDb().from('contact_messages').insert({ name, email, order_number: order ?? null, message });
  if (error) return { ok: false, message: FAILED };

  // A copy to the shop's inbox (once email is set up); the message is already safe in the database.
  const inbox = process.env.CONTACT_NOTIFY_EMAIL ?? (BUSINESS.placeholder ? undefined : BUSINESS.email);
  if (inbox) {
    await sendEmail({
      to: inbox,
      replyTo: email,
      subject: `New message from ${name}${order ? ` (order ${order})` : ''}`,
      ...letter({ heading: 'A new message', lines: [`From: ${name} <${email}>`, ...(order ? [`Order: ${order}`] : []), message] }),
    });
  }
  return done;
}
