import 'server-only';
import { letter, sendEmail } from '@/lib/email';
import { formatPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/site';
import { adminDb } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type ShipTo = { full_name: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; country: string };
export type OrderWithItems = Order & { items: OrderItem[] };

export const ORDER_NUMBER = /^HOK-\d{4,10}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

export const orderUrl = (o: { number: string; access_token: string }) => `/order/${o.number}?t=${o.access_token}`;

export async function getOrder(number: string): Promise<OrderWithItems | null> {
  if (!ORDER_NUMBER.test(number)) return null;
  const { data } = await adminDb().from('orders').select('*, items:order_items(*)').eq('number', number).maybeSingle();
  return (data as OrderWithItems | null) ?? null;
}

/** An order may be opened by its owner (signed in) or by anyone holding its private link. */
export function canViewOrder(order: Order, viewer: { userId: string | null; token?: string }): boolean {
  if (viewer.token && viewer.token === order.access_token) return true;
  return !!viewer.userId && viewer.userId === order.clerk_user_id;
}

const summaryLines = (o: OrderWithItems) => [
  ...o.items.map((i) => `${i.name}, ${i.size} × ${i.qty}: ${formatPrice(i.unit_price_inr * i.qty)}`),
  `Shipping: ${o.shipping_inr === 0 ? 'Free' : formatPrice(o.shipping_inr)}`,
  `Total: ${formatPrice(o.total_inr, { withCode: true })}`,
];

/** "Your order is confirmed" (paid online, or cash on delivery once confirmed). */
export async function sendOrderConfirmed(number: string): Promise<boolean> {
  const o = await getOrder(number);
  if (!o) return false;
  return sendEmail({
    to: o.email,
    subject: `Your order ${o.number} is confirmed`,
    ...letter({
      heading: 'Thank you for your order',
      lines: [
        `Order ${o.number} is confirmed and will be prepared for dispatch.`,
        ...summaryLines(o),
        o.payment_method === 'cod' ? `To pay on delivery: ${formatPrice(o.total_inr, { withCode: true })}.` : 'Payment received. Thank you.',
      ],
      button: { label: 'View your order', href: `${SITE_URL}${orderUrl(o)}` },
    }),
  });
}

/** Cash on delivery: the order only goes ahead once the customer follows this link. */
export async function sendCodConfirmRequest(number: string): Promise<boolean> {
  const o = await getOrder(number);
  if (!o) return false;
  return sendEmail({
    to: o.email,
    subject: `Please confirm your order ${o.number}`,
    ...letter({
      heading: 'One step to confirm your order',
      lines: [
        `You chose to pay ${formatPrice(o.total_inr, { withCode: true })} in cash on delivery for order ${o.number}.`,
        ...summaryLines(o),
        'Please confirm within 24 hours and we will prepare it for dispatch. After that the pieces are released and the order lapses.',
        'If this was not you, simply ignore this letter.',
      ],
      button: { label: 'Confirm my order', href: `${SITE_URL}/order/confirm?token=${o.cod_confirm_token}` },
    }),
  });
}

const trackUrl = (o: { number: string; access_token: string }) => `${SITE_URL}/order/${o.number}/track?t=${o.access_token}`;

/** Letters sent as the founder moves an order along in the admin area. */
export async function sendOrderUpdate(number: string, kind: 'shipped' | 'delivered' | 'cancelled' | 'refunded'): Promise<boolean> {
  const o = await getOrder(number);
  if (!o) return false;
  const copy = {
    shipped: {
      subject: `Your order ${o.number} is on its way`,
      heading: 'Your pieces are on their way',
      lines: [
        `Order ${o.number} has left our hands${o.courier ? ` with ${o.courier}` : ''}.`,
        ...(o.tracking_number ? [`Tracking number: ${o.tracking_number}`] : []),
        ...(o.payment_method === 'cod' ? [`Please have ${formatPrice(o.total_inr, { withCode: true })} ready for the courier.`] : []),
      ],
      button: { label: 'Track your order', href: trackUrl(o) },
    },
    delivered: {
      subject: `Your order ${o.number} has arrived`,
      heading: 'Delivered',
      lines: [`Order ${o.number} has been delivered. We hope you love your pieces.`, 'If anything is not right, you have 30 days to return it. Simply reply to this letter.'],
      button: { label: 'View your order', href: `${SITE_URL}${orderUrl(o)}` },
    },
    cancelled: {
      subject: `Your order ${o.number} was cancelled`,
      heading: 'Your order was cancelled',
      lines: [`Order ${o.number} has been cancelled and nothing more is owed.`, 'If this is unexpected, reply to this letter and we will help.'],
      button: undefined,
    },
    refunded: {
      subject: `Your refund for order ${o.number}`,
      heading: 'Your refund is on its way',
      lines: [
        `We have refunded ${formatPrice(o.total_inr, { withCode: true })} for order ${o.number} to your original payment method.`,
        'Banks usually show it within 5 to 7 working days.',
      ],
      button: undefined,
    },
  }[kind];
  return sendEmail({ to: o.email, subject: copy.subject, ...letter({ heading: copy.heading, lines: copy.lines, button: copy.button }) });
}
