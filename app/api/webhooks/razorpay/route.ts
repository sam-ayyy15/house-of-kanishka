import type { NextRequest } from 'next/server';
import { sendOrderConfirmed } from '@/lib/orders';
import { validWebhookSignature } from '@/lib/razorpay';
import { adminDb } from '@/lib/supabase/server';

/**
 * Razorpay → our database: the final word on payments. Even if the customer closes the
 * browser the moment they pay, this marks the order paid.
 *
 * Set up in the Razorpay dashboard → Settings → Webhooks:
 *   URL     https://<the site's address>/api/webhooks/razorpay
 *   Events  payment.captured, order.paid, payment.failed
 *   Secret  any long phrase, also saved here as RAZORPAY_WEBHOOK_SECRET
 *
 * Every call is checked against the secret. Each event id is stored once, so a repeated
 * delivery is acknowledged without being processed again.
 */
type Event = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string } }; order?: { entity?: { id?: string } } };
};

export async function POST(req: NextRequest) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return new Response('Webhook secret not set', { status: 503 });

  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get('x-razorpay-signature'))) {
    return new Response('Invalid signature', { status: 400 });
  }

  let evt: Event;
  try {
    evt = JSON.parse(raw) as Event;
  } catch {
    return new Response('Bad body', { status: 400 });
  }
  const type = evt.event ?? 'unknown';
  const payment = evt.payload?.payment?.entity;
  const orderId = payment?.order_id ?? evt.payload?.order?.entity?.id ?? null;
  const eventId = req.headers.get('x-razorpay-event-id') ?? `${type}:${payment?.id ?? orderId ?? 'none'}`;

  const db = adminDb();
  const stored = await db.from('payment_events').insert({ event_id: eventId, type, razorpay_order_id: orderId, payload: JSON.parse(raw) });
  if (stored.error) {
    // 23505 = this event is already stored: it was handled before.
    return stored.error.code === '23505' ? new Response('ok (repeat)') : new Response('Could not store the event', { status: 500 });
  }

  if ((type === 'payment.captured' || type === 'order.paid') && orderId && payment?.id) {
    const { data, error } = await db.rpc('mark_order_paid', { p_razorpay_order_id: orderId, p_payment_id: payment.id });
    if (error) {
      // Let Razorpay retry: forget the event so the next delivery is processed.
      await db.from('payment_events').delete().eq('event_id', eventId);
      return new Response('Could not update the order', { status: 500 });
    }
    const paid = data as { ok: boolean; already?: boolean; number?: string } | null;
    if (paid?.ok && !paid.already && paid.number) await sendOrderConfirmed(paid.number);
  }
  return new Response('ok');
}
