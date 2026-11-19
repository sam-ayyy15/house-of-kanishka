import 'server-only';
import { BUSINESS } from '@/lib/business';
import {
  buildShipment,
  manifestBody,
  readCreate,
  readServiceability,
  readTracking,
  shipmentRef,
  type ParcelSize,
  type Serviceability,
  type Tracked,
} from '@/lib/delhivery-core';
import type { OrderWithItems, ShipTo } from '@/lib/orders';
import { adminDb } from '@/lib/supabase/server';

/**
 * Delhivery, server side (B2C API). The token never reaches the browser. Staging and production
 * use different addresses and different tokens, so both come from the environment:
 *   DELHIVERY_BASE_URL         https://staging-express.delhivery.com (test) or https://track.delhivery.com (live)
 *   DELHIVERY_API_TOKEN        One Panel → Settings → API Setup
 *   DELHIVERY_PICKUP_LOCATION  our pickup address's warehouse name, exactly as registered (case and spaces count)
 * Everything Delhivery-related stays switched off until they are set.
 */
const BASE = (process.env.DELHIVERY_BASE_URL ?? '').trim().replace(/\/+$/, '');
const TOKEN = (process.env.DELHIVERY_API_TOKEN ?? '').trim();
export const PICKUP_LOCATION = (process.env.DELHIVERY_PICKUP_LOCATION ?? '').trim();

/** PIN code checks and tracking need only the address and token. */
export const delhiveryReachable = !!BASE && !!TOKEN;
/** Booking shipments and pickups also needs the registered pickup location. */
export const delhiveryConfigured = delhiveryReachable && !!PICKUP_LOCATION;

type Answer = { ok: true; status: number; data: unknown } | { ok: false; status: number; reason: string; data?: unknown };
type Options = {
  method?: 'GET' | 'POST';
  query?: Record<string, string>;
  json?: unknown;
  form?: string;
  timeoutMs?: number;
  /** Ask again after a timeout, a dropped connection or a 5xx (only for calls that change nothing). */
  retry?: boolean;
  /** A short name for the error log. */
  label: string;
  /** Don't log a 400 (tracking answers 400 for "no such parcel", which is expected when looking one up). */
  quiet400?: boolean;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Delhivery's own words from an error body, whatever shape it takes. */
function reasonFrom(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 300);
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const k of ['error', 'Error', 'rmk', 'remark', 'detail', 'message', 'msg']) {
      if (typeof d[k] === 'string' && (d[k] as string).trim()) return (d[k] as string).trim().slice(0, 300);
    }
    // Field-level errors, e.g. { "pickup_location": "Invalid Pickup Location …" }
    const first = Object.values(d).find((v) => typeof v === 'string' && v.trim());
    if (typeof first === 'string') return first.trim().slice(0, 300);
  }
  if (status === 401) return 'Delhivery did not accept the API token (check that it belongs to the address in DELHIVERY_BASE_URL).';
  if (status === 403) return 'Delhivery is limiting requests right now. Please try again in a minute.';
  return `HTTP ${status}`;
}

async function logRefusal(label: string, reason: string) {
  try {
    await adminDb().from('error_log').insert({ path: `delhivery ${label}`, message: reason, kind: 'delhivery' });
  } catch {
    // Logging must never turn a refused call into a crash.
  }
}

/** One authenticated call. Refusals are returned in Delhivery's words and written to the error log. */
async function delhivery(path: string, o: Options): Promise<Answer> {
  if (!delhiveryReachable) return { ok: false, status: 0, reason: 'Delhivery is not set up yet.' };
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(o.query ?? {})) url.searchParams.set(k, v);
  const headers: Record<string, string> = { Authorization: `Token ${TOKEN}`, Accept: 'application/json' };
  let body: string | undefined;
  if (o.form !== undefined) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = o.form;
  } else if (o.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(o.json);
  }

  const attempts = o.retry ? 3 : 1;
  let last: Answer = { ok: false, status: 0, reason: 'Could not reach Delhivery.' };
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await wait(1000 * 2 ** (i - 1)); // 1 s, then 2 s
    try {
      const res = await fetch(url, { method: o.method ?? 'GET', headers, body, signal: AbortSignal.timeout(o.timeoutMs ?? 10_000), cache: 'no-store' });
      const text = await res.text();
      let data: unknown = text;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // Not JSON: keep the text, it is Delhivery's message.
      }
      if (res.ok) return { ok: true, status: res.status, data };
      last = { ok: false, status: res.status, reason: reasonFrom(data, res.status), data };
      if (res.status < 500) break; // 4xx: asking again will not help
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
      last = { ok: false, status: 0, reason: timedOut ? 'Delhivery took too long to answer.' : `Could not reach Delhivery: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  if (!(o.quiet400 && last.status === 400)) await logRefusal(o.label, last.ok ? '' : last.reason);
  return last;
}

// ---------- PIN codes ----------

const pinCache = new Map<string, { at: number; value: Serviceability }>();
const PIN_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Whether Delhivery delivers to a PIN code (and can collect cash there). null when we cannot
 * tell (not set up, or Delhivery did not answer): checkout then carries on rather than turn a
 * real customer away. Answers are kept for 6 hours.
 */
export async function checkPincode(pin: string): Promise<Serviceability | null> {
  if (!delhiveryReachable || !/^[1-9][0-9]{5}$/.test(pin)) return null;
  const hit = pinCache.get(pin);
  if (hit && Date.now() - hit.at < PIN_TTL_MS) return hit.value;
  const r = await delhivery('/c/api/pin-codes/json/', { query: { filter_codes: pin }, timeoutMs: 6000, label: 'pincode' });
  if (!r.ok) return null;
  const value = readServiceability(r.data);
  if (pinCache.size > 2000) pinCache.clear();
  pinCache.set(pin, { at: Date.now(), value });
  return value;
}

// ---------- Parcels ----------

export const DEFAULT_PARCEL: ParcelSize = { weightG: 500, lengthCm: 30, widthCm: 25, heightCm: 5 };
export const PARCEL_KEYS = { weightG: 'parcel_weight_g', lengthCm: 'parcel_length_cm', widthCm: 'parcel_width_cm', heightCm: 'parcel_height_cm' } as const;

/** The usual parcel (admin → Settings). Placeholder values until the founder sets real ones. */
export async function getParcelDefaults(): Promise<ParcelSize> {
  const { data } = await adminDb().from('settings').select('key, value').in('key', Object.values(PARCEL_KEYS));
  const raw = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  const pick = (k: keyof ParcelSize) => {
    const v = Number(raw[PARCEL_KEYS[k]]);
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_PARCEL[k];
  };
  return { weightG: pick('weightG'), lengthCm: pick('lengthCm'), widthCm: pick('widthCm'), heightCm: pick('heightCm') };
}

// ---------- Shipments ----------

/** Looks a shipment up by our order reference (to recover a waybill after an unclear answer). */
export async function findShipment(ref: string): Promise<Tracked | null> {
  const r = await delhivery('/api/v1/packages/json/', { query: { ref_ids: ref }, timeoutMs: 15_000, retry: true, label: 'find', quiet400: true });
  if (!r.ok) return null;
  return readTracking(r.data).find((t) => t.ref === ref) ?? null;
}

/**
 * Books one forward shipment (Prepaid, or COD with the amount to collect) from our pickup
 * address. Never asked twice blindly: if the answer is unclear (a timeout, "might have been
 * partially saved", "Duplicate Order Id"), we look the reference up and keep the waybill if
 * Delhivery did create it.
 */
export async function createShipment(order: OrderWithItems, parcel: ParcelSize, ewaybill = ''): Promise<{ waybill: string } | { reason: string }> {
  if (!delhiveryConfigured) return { reason: 'Delhivery is not set up yet.' };
  const to = order.ship_to as ShipTo;
  const shipment = buildShipment(
    {
      number: order.number,
      attempt: order.shipment_attempt ?? 0,
      placedAt: order.placed_at,
      paymentMethod: order.payment_method as 'online' | 'cod',
      totalInr: order.total_inr,
      phone: order.phone,
      shipTo: to,
      items: order.items.map((i) => ({ name: i.name, size: i.size, qty: i.qty })),
    },
    parcel,
    { name: BUSINESS.legalName, address: BUSINESS.address.join(', ') },
    ewaybill,
  );
  const r = await delhivery('/api/cmu/create.json', { method: 'POST', form: manifestBody(PICKUP_LOCATION, [shipment]), timeoutMs: 15_000, label: 'create' });

  let reason: string;
  let unclear: boolean;
  if (r.ok) {
    const read = readCreate(r.data);
    if ('waybill' in read) return read;
    reason = read.reason;
    unclear = read.duplicate || /partially saved/i.test(read.reason);
    await logRefusal('create', reason);
  } else {
    reason = r.reason;
    unclear = r.status === 0 || r.status >= 500;
  }
  if (unclear) {
    const found = await findShipment(shipmentRef(order.number, order.shipment_attempt ?? 0));
    if (found) return { waybill: found.waybill };
  }
  return { reason };
}

/** Cancels a booked shipment. Delhivery allows it while the parcel is Manifested, In Transit or Pending. */
export async function cancelShipment(waybill: string): Promise<{ ok: true } | { reason: string }> {
  const r = await delhivery('/api/p/edit', { method: 'POST', json: { waybill, cancellation: 'true' }, label: 'cancel' });
  if (!r.ok) return { reason: r.reason };
  const d = (r.data ?? {}) as { status?: unknown; error?: unknown; remark?: unknown };
  if (d.status === true) return { ok: true };
  const reason = typeof d.error === 'string' && d.error ? d.error : typeof d.remark === 'string' && d.remark ? d.remark : 'Delhivery did not cancel the shipment.';
  await logRefusal('cancel', reason);
  return { reason };
}

/** Delhivery's printable label: a link to its PDF (valid for 24 hours). A4 sheet or 4×6 label. */
export async function labelLink(waybill: string, size: 'A4' | '4R'): Promise<{ url: string } | { reason: string }> {
  const r = await delhivery('/api/p/packing_slip', { query: { wbns: waybill, pdf: 'true', pdf_size: size }, timeoutMs: 30_000, retry: true, label: 'label' });
  if (!r.ok) return { reason: r.reason };
  const pkg = ((r.data ?? {}) as { packages?: { wbn?: string; pdf_download_link?: string }[] }).packages?.find((p) => String(p.wbn) === waybill);
  if (pkg?.pdf_download_link?.startsWith('https://')) return { url: pkg.pdf_download_link };
  await logRefusal('label', 'No label in Delhivery’s answer.');
  return { reason: 'Delhivery did not return a label for this parcel yet. Please try again in a minute.' };
}

/** Up-to-date tracking for any number of waybills (asked 50 at a time). */
export async function trackWaybills(waybills: string[]): Promise<Tracked[]> {
  const out: Tracked[] = [];
  for (let i = 0; i < waybills.length; i += 50) {
    const r = await delhivery('/api/v1/packages/json/', { query: { waybill: waybills.slice(i, i + 50).join(',') }, timeoutMs: 15_000, retry: true, label: 'track', quiet400: true });
    if (r.ok) out.push(...readTracking(r.data));
  }
  return out;
}

// ---------- Pickups ----------

export type Pickup = { id: string; date: string; time: string; count: number; centre: string; bookedAt: string };

/** Asks Delhivery to collect parcels from our pickup address. One request covers every parcel there. */
export async function requestPickup(date: string, time: string, count: number): Promise<Pickup | { reason: string }> {
  if (!delhiveryConfigured) return { reason: 'Delhivery is not set up yet.' };
  const r = await delhivery('/fm/request/new/', {
    method: 'POST',
    json: { pickup_time: time, pickup_date: date, pickup_location: PICKUP_LOCATION, expected_package_count: count },
    label: 'pickup',
  });
  if (!r.ok) return { reason: r.reason };
  const d = (r.data ?? {}) as { pickup_id?: unknown; pickup_date?: unknown; pickup_time?: unknown; incoming_center_name?: unknown; expected_package_count?: unknown };
  if (d.pickup_id == null) {
    const reason = reasonFrom(r.data, r.status);
    await logRefusal('pickup', reason);
    return { reason };
  }
  return {
    id: String(d.pickup_id),
    date: typeof d.pickup_date === 'string' ? d.pickup_date : date,
    time: typeof d.pickup_time === 'string' ? d.pickup_time : time, // Delhivery may give a different slot
    count: Number(d.expected_package_count) || count,
    centre: typeof d.incoming_center_name === 'string' ? d.incoming_center_name : '',
    bookedAt: new Date().toISOString(),
  };
}
