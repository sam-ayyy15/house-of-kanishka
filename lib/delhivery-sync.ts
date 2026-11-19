import 'server-only';
import { nextStep } from '@/lib/delhivery-core';
import { trackWaybills } from '@/lib/delhivery';
import { markDelivered, markShipped, type Order } from '@/lib/orders';
import { adminDb } from '@/lib/supabase/server';

export type SyncResult = { checked: number; updated: number; shipped: number; delivered: number; returning: number };

const RETURNING_NOTE = 'Delhivery is returning this parcel to us';

/**
 * Asks Delhivery about every parcel still on the move (or only the given orders) and brings
 * our orders up to date: the latest scan for the tracking page, "shipped" once the courier has
 * collected it, "delivered" with its letter, and a flag for the founder if it is being returned.
 * Run every 2 hours by .github/workflows/delhivery-sync.yml, and by "Refresh tracking" in admin.
 */
export async function syncDelhivery(numbers?: string[]): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, updated: 0, shipped: 0, delivered: 0, returning: 0 };
  const db = adminDb();
  let q = db
    .from('orders')
    .select('id, number, status, tracking_number, needs_attention, payment_method, payment_status, shipped_at')
    .eq('courier', 'Delhivery')
    .not('tracking_number', 'is', null)
    .in('status', ['packed', 'shipped'])
    .order('carrier_synced_at', { ascending: true, nullsFirst: true })
    .limit(500);
  if (numbers?.length) q = q.in('number', numbers);
  const { data: orders } = await q;
  if (!orders?.length) return result;

  const tracked = new Map((await trackWaybills(orders.map((o) => o.tracking_number!))).map((t) => [t.waybill, t]));
  const syncedAt = new Date().toISOString();

  for (const o of orders) {
    result.checked++;
    const t = tracked.get(o.tracking_number!);
    if (!t) {
      await db.from('orders').update({ carrier_synced_at: syncedAt }).eq('id', o.id);
      continue;
    }
    const step = nextStep(o.status, t);
    await db
      .from('orders')
      .update({
        carrier_status: t.status || null,
        carrier_status_type: t.statusType || null,
        carrier_location: t.location || null,
        carrier_status_at: t.at,
        carrier_expected_at: t.expectedAt,
        carrier_synced_at: syncedAt,
        ...(t.scans.length ? { carrier_scans: t.scans.slice(-80) } : {}),
        ...(step === 'returning' && !o.needs_attention?.includes(RETURNING_NOTE)
          ? { needs_attention: [o.needs_attention, `${RETURNING_NOTE} (${t.status}${t.location ? `, ${t.location}` : ''}).`].filter(Boolean).join(' ') }
          : {}),
      })
      .eq('id', o.id);
    result.updated++;

    if (step === 'delivered' && (await markDelivered(o as Pick<Order, 'number' | 'payment_method' | 'payment_status' | 'shipped_at'>, t.at ?? syncedAt))) result.delivered++;
    else if (step === 'shipped' && (await markShipped(o.number, { courier: 'Delhivery', tracking_number: o.tracking_number, tracking_url: null }, syncedAt))) result.shipped++;
    else if (step === 'returning') result.returning++;
  }
  return result;
}

/**
 * Forgets a cancelled Delhivery booking on a packed order, so it can be booked again (under a
 * fresh reference) or sent another way.
 */
export async function forgetBooking(order: Pick<Order, 'id' | 'shipment_attempt'>): Promise<boolean> {
  const { error } = await adminDb()
    .from('orders')
    .update({
      courier: null,
      tracking_number: null,
      tracking_url: null,
      shipment_booked_at: null,
      parcel_weight_g: null,
      shipment_attempt: (order.shipment_attempt ?? 0) + 1,
      carrier_status: null,
      carrier_status_type: null,
      carrier_location: null,
      carrier_status_at: null,
      carrier_expected_at: null,
      carrier_synced_at: null,
      carrier_scans: null,
    })
    .eq('id', order.id)
    .eq('status', 'packed');
  return !error;
}
