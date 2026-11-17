'use server';

import { redirect } from 'next/navigation';
import { ORDER_NUMBER } from '@/lib/orders';
import { withinRateLimit } from '@/lib/rate-limit';
import { adminDb } from '@/lib/supabase/server';

export type TrackState = { message: string } | null;

/**
 * "Track your order" for guests: the order number and the email it was placed with open the
 * order's tracking page. The same answer is given for a wrong number and a wrong email, so
 * the form cannot be used to discover which order numbers exist.
 */
export async function findOrder(_prev: TrackState, form: FormData): Promise<TrackState> {
  const raw = String(form.get('number') ?? '').trim().toUpperCase().replace(/\s+/g, '');
  const number = /^\d+$/.test(raw) ? `HOK-${raw}` : raw.replace(/^HOK(?=\d)/, 'HOK-');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const miss = { message: 'We could not find an order with that number and email. Please check both and try again.' };
  if (!ORDER_NUMBER.test(number) || !email.includes('@')) return miss;
  if (!(await withinRateLimit('track', 8, 600))) return { message: 'Too many attempts. Please try again in a few minutes.' };

  const { data } = await adminDb().from('orders').select('number, access_token, email').eq('number', number).maybeSingle();
  if (!data || data.email.toLowerCase() !== email) return miss;
  redirect(`/order/${data.number}/track?t=${data.access_token}`);
}
