'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { CATALOG_TAG } from '@/lib/catalog';
import { isFounder } from '@/lib/founder';
import { getOrder, ORDER_NUMBER, sendOrderConfirmed, sendOrderUpdate } from '@/lib/orders';
import { refundPayment } from '@/lib/razorpay';
import { adminDb } from '@/lib/supabase/server';

/**
 * Everything the founder can change. Every action checks again that the caller is the
 * founder: hiding the pages is not what protects them.
 */
export type AdminState = { ok: boolean; message: string } | null;

const DENIED: AdminState = { ok: false, message: 'Not allowed.' };
const FAILED: AdminState = { ok: false, message: 'That did not save. Please try again.' };
const now = () => new Date().toISOString();
const refresh = () => revalidatePath('/admin', 'layout');
const refreshCatalog = () => {
  revalidateTag(CATALOG_TAG, 'max');
  refresh();
};

// ---------- Orders ----------

/** Which step may follow which. Anything else is refused, so a double click cannot skip a stage. */
const NEXT: Record<string, string[]> = {
  awaiting_confirmation: ['confirmed'],
  confirmed: ['packed'],
  packed: ['shipped'],
  shipped: ['delivered'],
};

export async function advanceOrder(number: string, to: 'confirmed' | 'packed' | 'delivered'): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const order = await getOrder(number);
  if (!order) return FAILED;
  if (!NEXT[order.status]?.includes(to)) return { ok: false, message: `This order is ${order.status}; it cannot become ${to}.` };
  const db = adminDb();

  if (to === 'confirmed') {
    // Confirming a cash-on-delivery order on the customer's behalf (e.g. after a phone call).
    const { data } = await db.rpc('confirm_cod_order', { p_token: order.cod_confirm_token });
    if (!(data as { ok?: boolean } | null)?.ok) return FAILED;
    await sendOrderConfirmed(number);
  } else if (to === 'packed') {
    const { error } = await db.from('orders').update({ status: 'packed', packed_at: now() }).eq('id', order.id);
    if (error) return FAILED;
  } else {
    // Delivered. Cash on delivery is paid at the door.
    const paid = order.payment_method === 'cod' && order.payment_status !== 'paid' ? { payment_status: 'paid', paid_at: now() } : {};
    const { error } = await db.from('orders').update({ status: 'delivered', delivered_at: now(), ...paid }).eq('id', order.id);
    if (error) return FAILED;
    await sendOrderUpdate(number, 'delivered');
  }
  refresh();
  return { ok: true, message: `Order ${number} is now ${to}.` };
}

const shipInput = z.object({
  number: z.string().regex(ORDER_NUMBER),
  courier: z.string().trim().min(2, 'Please name the courier.').max(60),
  tracking_number: z.string().trim().max(60).optional(),
  tracking_url: z.union([z.literal(''), z.url().startsWith('https://', 'The tracking link must start with https://')]).optional(),
});

export async function shipOrder(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const parsed = shipInput.safeParse({
    number: form.get('number'),
    courier: form.get('courier'),
    tracking_number: String(form.get('tracking_number') ?? '') || undefined,
    tracking_url: String(form.get('tracking_url') ?? '').trim(),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Please check the details.' };
  const d = parsed.data;
  const order = await getOrder(d.number);
  if (!order || order.status !== 'packed') return { ok: false, message: 'Only a packed order can be shipped.' };
  const { error } = await adminDb()
    .from('orders')
    .update({ status: 'shipped', shipped_at: now(), courier: d.courier, tracking_number: d.tracking_number ?? null, tracking_url: d.tracking_url || null })
    .eq('id', order.id);
  if (error) return FAILED;
  await sendOrderUpdate(d.number, 'shipped');
  refresh();
  return { ok: true, message: `Order ${d.number} is on its way.` };
}

/**
 * Cancels an order that has not been delivered: the stock goes back on sale and, if it was
 * paid online, the money is returned through Razorpay to the original payment method.
 */
export async function cancelOrder(number: string): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const order = await getOrder(number);
  if (!order) return FAILED;
  if (['delivered', 'cancelled', 'expired', 'refunded'].includes(order.status)) {
    return { ok: false, message: `This order is already ${order.status}.` };
  }
  const db = adminDb();
  const paidOnline = order.payment_method === 'online' && order.payment_status === 'paid' && !!order.razorpay_payment_id;

  let refundId: string | null = null;
  if (paidOnline) {
    const refund = await refundPayment(order.razorpay_payment_id!, order.total_inr);
    if ('reason' in refund) return { ok: false, message: `Razorpay did not accept the refund (${refund.reason}), so nothing was changed. Please try again, or refund it in the Razorpay dashboard first.` };
    refundId = refund.id;
  }
  if (order.stock_held) await db.rpc('release_order_stock', { p_order_id: order.id });
  const { error } = await db
    .from('orders')
    .update(
      paidOnline
        ? { status: 'refunded', payment_status: 'refunded', refunded_at: now(), cancelled_at: now(), razorpay_refund_id: refundId }
        : { status: 'cancelled', cancelled_at: now() },
    )
    .eq('id', order.id);
  if (error) return FAILED;
  await sendOrderUpdate(number, paidOnline ? 'refunded' : 'cancelled');
  refreshCatalog();
  return { ok: true, message: paidOnline ? `Order ${number} was cancelled and refunded.` : `Order ${number} was cancelled.` };
}

/** A delivered order that came back (30-day returns): refunds it; stock is put back by hand in Stock. */
export async function refundOrder(number: string): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const order = await getOrder(number);
  if (!order || order.status !== 'delivered') return { ok: false, message: 'Only a delivered order can be refunded here.' };
  let refundId: string | null = null;
  if (order.payment_method === 'online' && order.razorpay_payment_id) {
    const refund = await refundPayment(order.razorpay_payment_id, order.total_inr);
    if ('reason' in refund) return { ok: false, message: `Razorpay did not accept the refund (${refund.reason}), so nothing was changed.` };
    refundId = refund.id;
  }
  const { error } = await adminDb()
    .from('orders')
    .update({ status: 'refunded', payment_status: 'refunded', refunded_at: now(), razorpay_refund_id: refundId })
    .eq('id', order.id);
  if (error) return FAILED;
  await sendOrderUpdate(number, 'refunded');
  refresh();
  return {
    ok: true,
    message: refundId ? `Order ${number} was refunded through Razorpay.` : `Order ${number} is marked refunded. It was paid in cash: please send the money back yourself.`,
  };
}

export async function saveOrderNote(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const number = String(form.get('number') ?? '');
  if (!ORDER_NUMBER.test(number)) return FAILED;
  const note = String(form.get('note') ?? '').trim().slice(0, 2000);
  const clear = form.get('clear_attention') === 'on' ? { needs_attention: null } : {};
  const { error } = await adminDb().from('orders').update({ admin_note: note || null, ...clear }).eq('number', number);
  if (error) return FAILED;
  refresh();
  return { ok: true, message: 'Saved.' };
}

// ---------- Stock, prices and what is on sale ----------

export async function saveProduct(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const id = String(form.get('product_id') ?? '');
  const price = Number(form.get('price'));
  const status = String(form.get('status') ?? '');
  if (!z.uuid().safeParse(id).success || !Number.isInteger(price) || price < 1 || price > 10_000_000 || !['draft', 'preview', 'live'].includes(status)) {
    return { ok: false, message: 'Please check the price (whole rupees) and the status.' };
  }
  const stocks: { id: string; stock: number }[] = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith('stock:')) continue;
    const stock = Number(value);
    const variantId = key.slice(6);
    if (!z.uuid().safeParse(variantId).success || !Number.isInteger(stock) || stock < 0 || stock > 100_000) {
      return { ok: false, message: 'Stock must be a whole number, 0 or more.' };
    }
    stocks.push({ id: variantId, stock });
  }
  const db = adminDb();
  const results = await Promise.all([
    db.from('products').update({ price_inr: price, status }).eq('id', id),
    ...stocks.map((v) => db.from('product_variants').update({ stock: v.stock }).eq('id', v.id).eq('product_id', id)),
  ]);
  if (results.some((r) => r.error)) return FAILED;
  refreshCatalog();
  return { ok: true, message: 'Saved.' };
}

// ---------- Shop settings and the launch switch ----------

export async function saveSettings(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  const num = (k: string) => Number(form.get(k));
  const values = {
    free_shipping_threshold_inr: num('free_shipping_threshold_inr'),
    shipping_fee_inr: num('shipping_fee_inr'),
    cod_max_order_inr: num('cod_max_order_inr'),
  };
  if (Object.values(values).some((v) => !Number.isInteger(v) || v < 0 || v > 10_000_000)) {
    return { ok: false, message: 'Amounts must be whole rupees, 0 or more.' };
  }
  const rows = [
    ...Object.entries(values).map(([key, value]) => ({ key, value })),
    { key: 'cod_enabled', value: form.get('cod_enabled') === 'on' },
  ];
  const { error } = await adminDb().from('settings').upsert(rows, { onConflict: 'key' });
  if (error) return FAILED;
  refreshCatalog();
  return { ok: true, message: 'Saved.' };
}

/** The launch switch: "live" puts a category on sale; "coming_soon" shows its teaser instead. */
export async function setCategoryLaunch(slug: string, state: 'live' | 'coming_soon'): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  if (!/^[a-z0-9-]{1,40}$/.test(slug) || !['live', 'coming_soon'].includes(state)) return FAILED;
  const { error } = await adminDb().from('categories').update({ launch_state: state }).eq('slug', slug);
  if (error) return FAILED;
  refreshCatalog();
  return { ok: true, message: state === 'live' ? `${slug} is now on sale.` : `${slug} now shows "coming soon".` };
}

// ---------- Messages ----------

export async function setMessageStatus(id: string, status: 'new' | 'answered' | 'closed'): Promise<AdminState> {
  if (!(await isFounder())) return DENIED;
  if (!z.uuid().safeParse(id).success || !['new', 'answered', 'closed'].includes(status)) return FAILED;
  const { error } = await adminDb().from('contact_messages').update({ status }).eq('id', id);
  if (error) return FAILED;
  refresh();
  return { ok: true, message: 'Saved.' };
}
