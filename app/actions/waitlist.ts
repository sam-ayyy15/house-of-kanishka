'use server';

import { z } from 'zod';
import { withinRateLimit } from '@/lib/rate-limit';
import { TURNSTILE_FAILED, verifyTurnstile } from '@/lib/turnstile';
import { adminDb } from '@/lib/supabase/server';

export type FormResult = { ok: true } | { ok: false; message: string };

const input = z.object({
  email: z.email().max(254),
  category: z.string().regex(/^[a-z0-9-]{1,40}$/),
});

/**
 * "Notify me" on a coming-soon category. Stores the address once per category, with a consent
 * record. No email is sent now: the list is written to on the day the category launches.
 */
export async function joinWaitlist(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  const parsed = input.safeParse({ email: String(form.get('email') ?? '').trim(), category: form.get('category') });
  if (!parsed.success) return { ok: false, message: 'Please enter a valid email address.' };
  if (!(await verifyTurnstile(form.get('cf-turnstile-response'), 'notify'))) return { ok: false, message: TURNSTILE_FAILED };
  if (!(await withinRateLimit('waitlist', 5, 600))) {
    return { ok: false, message: 'Too many attempts. Please try again in a few minutes.' };
  }

  const db = adminDb();
  const { email, category } = parsed.data;
  const { data: cat } = await db.from('categories').select('slug, launch_state').eq('slug', category).maybeSingle();
  if (!cat || cat.launch_state !== 'coming_soon') return { ok: false, message: 'This list is closed.' };

  const { error } = await db
    .from('launch_waitlist')
    .upsert({ email, category_slug: category }, { onConflict: 'email,category_slug', ignoreDuplicates: true });
  if (error) return { ok: false, message: 'Something went wrong on our side. Please try again.' };

  await db.from('consent_log').insert({ email, kind: 'waitlist', granted: true, source: `coming-soon:${category}` });
  return { ok: true };
}
