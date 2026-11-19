'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isAdmin } from '@/lib/admin-gate';
import { EWAYBILL_FROM_INR, PICKUP_HOURS, pickupWindow, plainReason } from '@/lib/delhivery-core';
import { cancelShipment, createShipment, delhiveryConfigured, getParcelDefaults, PARCEL_KEYS, requestPickup } from '@/lib/delhivery';
import { forgetBooking, syncDelhivery } from '@/lib/delhivery-sync';
import { getOrder, markShipped, ORDER_NUMBER } from '@/lib/orders';
import { adminDb } from '@/lib/supabase/server';
import type { AdminState } from './admin';

/**
 * Shipping with Delhivery from the admin area. Like every admin action, each one checks
 * again that the caller is the founder (with the admin password entered).
 */
const DENIED: AdminState = { ok: false, message: 'Not allowed.' };
const NOT_SET_UP: AdminState = { ok: false, message: 'Delhivery is not set up yet (Settings → Connected services).' };
const refresh = () => revalidatePath('/admin', 'layout');

const bookInput = z.object({
  number: z.string().regex(ORDER_NUMBER),
  weight_g: z.coerce.number().int('Weight must be whole grams.').min(50, 'Weight must be at least 50 g.').max(50_000, 'Weight must be at most 50 kg.'),
  ewaybill: z.string().trim().regex(/^(\d{12})?$/, 'An e-waybill number has 12 digits.').optional(),
});

/** Books the parcel for a packed order: Delhivery assigns the waybill (tracking number). */
export async function shipWithDelhivery(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return DENIED;
  if (!delhiveryConfigured) return NOT_SET_UP;
  const parsed = bookInput.safeParse({ number: form.get('number'), weight_g: form.get('weight_g'), ewaybill: String(form.get('ewaybill') ?? '') });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Please check the details.' };
  const d = parsed.data;
  const order = await getOrder(d.number);
  if (!order || order.status !== 'packed') return { ok: false, message: 'Only a packed order can be booked.' };
  if (order.shipment_booked_at) return { ok: false, message: `Already booked with Delhivery (waybill ${order.tracking_number}).` };
  if (order.total_inr >= EWAYBILL_FROM_INR && !d.ewaybill) {
    return { ok: false, message: 'Parcels worth ₹50,000 or more need an e-waybill number for Delhivery.' };
  }

  const parcel = { ...(await getParcelDefaults()), weightG: d.weight_g };
  const booked = await createShipment(order, parcel, d.ewaybill ?? '');
  if ('reason' in booked) return { ok: false, message: `Delhivery did not book it. ${plainReason(booked.reason)}` };

  const { data, error } = await adminDb()
    .from('orders')
    .update({ courier: 'Delhivery', tracking_number: booked.waybill, tracking_url: null, shipment_booked_at: new Date().toISOString(), parcel_weight_g: d.weight_g })
    .eq('id', order.id)
    .eq('status', 'packed')
    .is('shipment_booked_at', null)
    .select('id');
  if (error || !data?.length) {
    await adminDb().from('error_log').insert({ path: `delhivery book ${order.number}`, message: `Booked waybill ${booked.waybill} but could not save it on the order.`, kind: 'delhivery' });
    return { ok: false, message: `Delhivery booked waybill ${booked.waybill}, but it could not be saved on this order. Please note the waybill and refresh the page.` };
  }
  refresh();
  return { ok: true, message: `Booked with Delhivery. Waybill ${booked.waybill}. Print the label, then book a pickup.` };
}

/** The courier has the parcel in hand: the order is on its way (the sync also does this by itself). */
export async function handedToDelhivery(number: string): Promise<AdminState> {
  if (!(await isAdmin())) return DENIED;
  const order = await getOrder(number);
  if (!order || order.status !== 'packed' || !order.shipment_booked_at) return { ok: false, message: 'Only a packed order booked with Delhivery can be marked handed over.' };
  if (!(await markShipped(number, { courier: 'Delhivery', tracking_number: order.tracking_number, tracking_url: null }))) {
    return { ok: false, message: 'That did not save. Please try again.' };
  }
  refresh();
  return { ok: true, message: `Order ${number} is on its way with Delhivery.` };
}

/** Cancels the Delhivery booking of a packed order (before collection), so it can be booked again. */
export async function cancelDelhiveryBooking(number: string): Promise<AdminState> {
  if (!(await isAdmin())) return DENIED;
  const order = await getOrder(number);
  if (!order || order.status !== 'packed' || !order.shipment_booked_at || !order.tracking_number) {
    return { ok: false, message: 'Only a packed order booked with Delhivery can have its booking cancelled.' };
  }
  const cancelled = await cancelShipment(order.tracking_number);
  if ('reason' in cancelled) return { ok: false, message: `Delhivery did not cancel it. ${plainReason(cancelled.reason)}` };
  if (!(await forgetBooking(order))) return { ok: false, message: `Delhivery cancelled waybill ${order.tracking_number}, but the order could not be updated. Please refresh the page.` };
  refresh();
  return { ok: true, message: `Booking ${order.tracking_number} cancelled. The order is packed and can be booked again.` };
}

/** Asks Delhivery about this order's parcel now, instead of waiting for the 2-hourly sync. */
export async function refreshTracking(number: string): Promise<AdminState> {
  if (!(await isAdmin())) return DENIED;
  if (!ORDER_NUMBER.test(number)) return { ok: false, message: 'Unknown order.' };
  const r = await syncDelhivery([number]);
  refresh();
  if (r.updated === 0) return { ok: false, message: 'Delhivery has no news on this parcel yet. Please try again later.' };
  return {
    ok: true,
    message: r.delivered ? 'Delivered. The customer has been told.' : r.shipped ? 'Collected by Delhivery. The customer has been told it is on its way.' : 'Tracking updated.',
  };
}

const pickupInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a date.'),
  time: z.enum(PICKUP_HOURS, 'Please choose a time.'),
  count: z.coerce.number().int().min(1, 'At least one parcel.').max(99, 'At most 99 parcels.'),
});

/** Books Delhivery's rider to collect the parcels from our pickup address. */
export async function bookPickup(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return DENIED;
  if (!delhiveryConfigured) return NOT_SET_UP;
  const parsed = pickupInput.safeParse({ date: form.get('date'), time: form.get('time'), count: form.get('count') });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Please check the details.' };
  const d = parsed.data;
  const { first, last } = pickupWindow();
  if (d.date < first || d.date > last) return { ok: false, message: 'Delhivery takes pickups from today up to 7 days ahead.' };

  const pickup = await requestPickup(d.date, d.time, d.count);
  if ('reason' in pickup) return { ok: false, message: `Delhivery did not book the pickup. ${plainReason(pickup.reason)}` };
  await adminDb().from('settings').upsert({ key: 'delhivery_pickup', value: pickup }, { onConflict: 'key' });
  refresh();
  return { ok: true, message: `Pickup booked (request ${pickup.id}).` };
}

const parcelInput = z.object({
  weightG: z.coerce.number().int().min(50).max(50_000),
  lengthCm: z.coerce.number().min(1).max(200),
  widthCm: z.coerce.number().min(1).max(200),
  heightCm: z.coerce.number().min(1).max(200),
});

/** The usual parcel's weight and size, pre-filled when booking. */
export async function saveParcelDefaults(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return DENIED;
  const parsed = parcelInput.safeParse({
    weightG: form.get(PARCEL_KEYS.weightG),
    lengthCm: form.get(PARCEL_KEYS.lengthCm),
    widthCm: form.get(PARCEL_KEYS.widthCm),
    heightCm: form.get(PARCEL_KEYS.heightCm),
  });
  if (!parsed.success) return { ok: false, message: 'Weight is whole grams (50 to 50,000); sizes are centimetres (1 to 200).' };
  const rows = (Object.keys(PARCEL_KEYS) as (keyof typeof PARCEL_KEYS)[]).map((k) => ({ key: PARCEL_KEYS[k], value: parsed.data[k] }));
  const { error } = await adminDb().from('settings').upsert(rows, { onConflict: 'key' });
  if (error) return { ok: false, message: 'That did not save. Please try again.' };
  refresh();
  return { ok: true, message: 'Saved.' };
}
