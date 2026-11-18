'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { CATALOG_TAG } from '@/lib/catalog';
import { ensureProfile, signedInUserId } from '@/lib/customer';
import { emailConfigured } from '@/lib/email';
import { INDIAN_STATES, indianMobile, PINCODE } from '@/lib/india';
import { getOrder, isUuid, ORDER_NUMBER, orderUrl, sendCodConfirmRequest, sendOrderConfirmed } from '@/lib/orders';
import { withinRateLimit } from '@/lib/rate-limit';
import { TURNSTILE_FAILED, verifyTurnstile } from '@/lib/turnstile';
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId, validPaymentSignature } from '@/lib/razorpay';
import { adminDb } from '@/lib/supabase/server';

/**
 * Checkout. The browser sends who, where, how to pay and which pieces (slug, size, quantity):
 * never a price. The database works out the amounts and takes the stock in one transaction
 * (place_order, supabase/migrations/…_orders.sql).
 */
const input = z.object({
  email: z.email('Please enter a valid email address.').max(254),
  phone: z.string().transform((v, ctx) => {
    const mobile = indianMobile(v);
    if (!mobile) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a 10-digit Indian mobile number.' });
      return z.NEVER;
    }
    return mobile;
  }),
  full_name: z.string().trim().min(2, 'Please enter the full name.').max(120),
  line1: z.string().trim().min(3, 'Please enter the house number and street.').max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'Please enter the city.').max(80),
  state: z.enum(INDIAN_STATES, 'Please choose a state.'),
  pincode: z.string().trim().regex(PINCODE, 'Please enter a 6-digit PIN code.'),
  method: z.enum(['online', 'cod']),
  save_address: z.boolean().optional(),
  items: z.array(z.object({ slug: z.string().max(120), size: z.string().max(20), qty: z.number().int().min(1).max(10) })).min(1).max(40),
  /** The Cloudflare Turnstile token (lib/turnstile.ts). */
  turnstile: z.string().max(2048).optional(),
});
export type CheckoutInput = z.input<typeof input>;

export type CheckoutResult =
  | { ok: false; message: string; fields?: Record<string, string>; line?: { slug: string; size: string; available: number } }
  | { ok: true; kind: 'cod'; url: string }
  | {
      ok: true;
      kind: 'online';
      number: string;
      token: string;
      razorpay: { key: string; orderId: string; amount: number; name: string; email: string; contact: string };
    };

const FAILED = 'Something went wrong on our side. Nothing has been charged. Please try again.';

type Placed =
  | { ok: true; id: string; number: string; access_token: string; total_inr: number }
  | { ok: false; error: string; slug?: string; size?: string; available?: number };

export async function placeOrder(raw: CheckoutInput): Promise<CheckoutResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: 'Please check the marked fields.', fields };
  }
  const d = parsed.data;
  if (d.method === 'online' && !razorpayConfigured) {
    return { ok: false, message: 'Online payment is not open yet. Please choose cash on delivery.' };
  }
  if (!(await verifyTurnstile(d.turnstile, 'checkout'))) return { ok: false, message: TURNSTILE_FAILED };
  if (!(await withinRateLimit('checkout', 8, 600))) {
    return { ok: false, message: 'Too many attempts. Please try again in a few minutes.' };
  }

  const userId = await signedInUserId();
  if (userId) await ensureProfile(userId);
  const db = adminDb();
  const ship_to = { full_name: d.full_name, line1: d.line1, line2: d.line2 ?? null, city: d.city, state: d.state, pincode: d.pincode, country: 'IN' };

  const { data, error } = await db.rpc('place_order', {
    p: { clerk_user_id: userId ?? '', email: d.email, phone: d.phone, ship_to, payment_method: d.method, items: d.items },
  });
  if (error || !data) return { ok: false, message: FAILED };
  const placed = data as Placed;
  if (!placed.ok) {
    const line = placed.slug && placed.size ? { slug: placed.slug, size: placed.size, available: placed.available ?? 0 } : undefined;
    const message =
      placed.error === 'stock'
        ? line && line.available > 0
          ? `Only ${line.available} left of one of your pieces. Please update your bag.`
          : 'One of your pieces has just sold out. Please update your bag.'
        : placed.error === 'unavailable'
          ? 'One of your pieces is no longer available. Please update your bag.'
          : placed.error === 'cod_off'
            ? 'Cash on delivery is not available at the moment.'
            : placed.error === 'cod_limit'
              ? 'This order is above the limit for cash on delivery. Please pay online.'
              : 'Your bag is empty.';
    return { ok: false, message, line };
  }
  revalidateTag(CATALOG_TAG, 'max'); // stock changed

  // Keep the address for next time, when asked (never fails the order).
  if (userId && d.save_address) {
    const existing = await db.from('addresses').select('id, line1, pincode').eq('clerk_user_id', userId);
    const known = existing.data?.some((a) => a.line1 === d.line1 && a.pincode === d.pincode);
    if (existing.data && !known && existing.data.length < 10) {
      await db.from('addresses').insert({
        clerk_user_id: userId, full_name: d.full_name, phone: d.phone, line1: d.line1, line2: d.line2 ?? null,
        city: d.city, state: d.state, pincode: d.pincode, is_default: existing.data.length === 0,
      });
    }
  }

  if (d.method === 'cod') {
    if (!emailConfigured) {
      // Email is not set up at all, so nobody could ever confirm: the order is confirmed at once.
      const { data: order } = await db.from('orders').select('cod_confirm_token').eq('id', placed.id).single();
      if (order) await db.rpc('confirm_cod_order', { p_token: order.cod_confirm_token });
    } else if (await sendCodConfirmRequest(placed.number)) {
      await db.from('orders').update({ confirm_email_sent_at: new Date().toISOString() }).eq('id', placed.id);
    }
    // If the email could not be sent, the order waits and its page offers to send it again
    // or to confirm there (see resendCodEmail and confirmCodHere below).
    return { ok: true, kind: 'cod', url: orderUrl(placed) };
  }

  const rzp = await createRazorpayOrder(placed.total_inr, placed.number);
  if (!rzp) {
    // The payment could not be started: give the stock back at once.
    await db.rpc('release_order_stock', { p_order_id: placed.id });
    await db.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', placed.id);
    revalidateTag(CATALOG_TAG, 'max');
    return { ok: false, message: 'We could not open the payment window. Nothing has been charged. Please try again.' };
  }
  await db.from('orders').update({ razorpay_order_id: rzp.id }).eq('id', placed.id);
  return {
    ok: true,
    kind: 'online',
    number: placed.number,
    token: placed.access_token,
    razorpay: { key: razorpayKeyId(), orderId: rzp.id, amount: placed.total_inr * 100, name: d.full_name, email: d.email, contact: `+91${d.phone}` },
  };
}

/**
 * Called by the browser when Razorpay's window reports success. The signature proves the
 * payment belongs to our order; the Razorpay webhook confirms the same thing independently.
 */
export async function confirmPayment(resp: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const fields = z.object({ razorpay_order_id: z.string().max(64), razorpay_payment_id: z.string().max(64), razorpay_signature: z.string().max(256) }).safeParse(resp);
  if (!fields.success || !validPaymentSignature(resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature)) {
    return { ok: false, message: 'We could not verify this payment. If money left your account, it will be matched to your order automatically within a few minutes.' };
  }
  const { data, error } = await adminDb().rpc('mark_order_paid', { p_razorpay_order_id: resp.razorpay_order_id, p_payment_id: resp.razorpay_payment_id });
  const paid = data as { ok: boolean; already?: boolean; number?: string; access_token?: string } | null;
  if (error || !paid?.ok || !paid.number || !paid.access_token) return { ok: false, message: FAILED };
  if (!paid.already) await sendOrderConfirmed(paid.number);
  return { ok: true, url: orderUrl({ number: paid.number, access_token: paid.access_token }) };
}

/** For the order page while a payment is still being confirmed (e.g. back from a UPI app). */
export async function orderProgress(number: string, token: string): Promise<{ status: string; paid: boolean } | null> {
  if (!ORDER_NUMBER.test(number) || !isUuid(token)) return null;
  const order = await getOrder(number);
  if (!order || order.access_token !== token) return null;
  return { status: order.status, paid: order.payment_status === 'paid' };
}

// ---------- Cash on delivery: confirming from the order page ----------

type CodReply = { ok: boolean; message: string };

async function awaitingCodOrder(number: string, token: string) {
  if (!ORDER_NUMBER.test(number) || !isUuid(token)) return null;
  const order = await getOrder(number);
  if (!order || order.access_token !== token || order.payment_method !== 'cod' || order.status !== 'awaiting_confirmation') return null;
  return order;
}

/** "Send it again" on the order page. */
export async function resendCodEmail(number: string, token: string): Promise<CodReply> {
  const order = await awaitingCodOrder(number, token);
  if (!order) return { ok: false, message: 'This order no longer needs confirming.' };
  if (!(await withinRateLimit('cod-resend', 4, 900))) return { ok: false, message: 'Too many attempts. Please try again in a few minutes.' };
  if (!(await sendCodConfirmRequest(number))) {
    return { ok: false, message: 'We could not send the email. You can confirm your order here instead.' };
  }
  await adminDb().from('orders').update({ confirm_email_sent_at: new Date().toISOString() }).eq('id', order.id);
  return { ok: true, message: `Sent to ${order.email}. Please check your inbox and spam folder.` };
}

/**
 * "Confirm my order here": only while the confirmation email has never gone out, so a
 * failed email cannot cost the customer their order. Once an email has been delivered,
 * the link in it is the way to confirm.
 */
export async function confirmCodHere(number: string, token: string): Promise<CodReply> {
  const order = await awaitingCodOrder(number, token);
  if (!order) return { ok: false, message: 'This order no longer needs confirming.' };
  if (order.confirm_email_sent_at) return { ok: false, message: 'Please confirm from the link in the email we sent you.' };
  const { data } = await adminDb().rpc('confirm_cod_order', { p_token: order.cod_confirm_token });
  const result = data as { ok?: boolean; already?: boolean } | null;
  if (!result?.ok) return { ok: false, message: FAILED };
  if (!result.already) await sendOrderConfirmed(number);
  return { ok: true, message: 'Your order is confirmed.' };
}
