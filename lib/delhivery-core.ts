/**
 * Delhivery, the pure part: building requests and reading answers. No network, no database
 * and no server-only imports, so every rule here is unit-tested (tests/delhivery.test.ts).
 * lib/delhivery.ts does the calling. Field names follow Delhivery's B2C API exactly.
 */

// ---------- Text that Delhivery accepts ----------

/**
 * Delhivery's manifest refuses `& % # ; \` anywhere in the payload. Customers type them in
 * addresses ("Flat #4", "A&B Towers"), so they are replaced with words, never dropped silently.
 */
export function cleanText(value: string | null | undefined, max = 200): string {
  return (value ?? '')
    .replace(/&/g, ' and ')
    .replace(/#/g, ' No. ')
    .replace(/%/g, ' percent ')
    .replace(/[;\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** The 10-digit mobile number (orders keep it like that already; this is a safety net). */
export function tenDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * The order reference Delhivery stores. Delhivery rejects a second shipment whose reference,
 * amount, contents, payment mode and name all match an earlier one, so a parcel booked again
 * after a cancellation gets a suffix: HOK-1001, then HOK-1001-2, HOK-1001-3 … (< 50 chars).
 */
export function shipmentRef(number: string, attempt: number): string {
  return attempt > 0 ? `${number}-${attempt + 1}` : number;
}

// ---------- Shipment creation ----------

export type ParcelSize = { weightG: number; lengthCm: number; widthCm: number; heightCm: number };

export type ShipmentOrder = {
  number: string;
  attempt: number;
  placedAt: string;
  paymentMethod: 'online' | 'cod';
  totalInr: number;
  phone: string;
  shipTo: { full_name: string; line1: string; line2?: string | null; city: string; state: string; pincode: string };
  items: { name: string; size: string; qty: number }[];
};

export type Seller = { name: string; address: string };

/** One forward shipment (single box) for /api/cmu/create.json. Every field of the spec is set. */
export function buildShipment(order: ShipmentOrder, parcel: ParcelSize, seller: Seller, ewaybill = '') {
  const cod = order.paymentMethod === 'cod';
  const pieces = order.items.reduce((n, i) => n + i.qty, 0);
  const contents = cleanText(order.items.map((i) => `${i.name} (${i.size}) x ${i.qty}`).join(', '), 250);
  const to = order.shipTo;
  return {
    name: cleanText(to.full_name, 100),
    add: cleanText([to.line1, to.line2].filter(Boolean).join(', '), 400),
    pin: Number(to.pincode),
    city: cleanText(to.city, 80),
    state: cleanText(to.state, 80),
    country: 'India',
    phone: tenDigits(order.phone),
    order: shipmentRef(order.number, order.attempt),
    payment_mode: cod ? 'COD' : 'Prepaid',
    // Returns go back to the pickup address registered with Delhivery.
    return_pin: '',
    return_city: '',
    return_phone: '',
    return_add: '',
    return_state: '',
    return_country: '',
    return_name: '',
    return_address: '',
    products_desc: contents,
    hsn_code: '', // not GST-registered: a bill of supply has no HSN lines
    cod_amount: cod ? order.totalInr : 0,
    order_date: order.placedAt.slice(0, 10),
    total_amount: order.totalInr,
    seller_add: cleanText(seller.address, 300),
    seller_name: cleanText(seller.name, 100),
    seller_inv: order.number, // the bill of supply carries the order number
    quantity: String(pieces),
    waybill: '', // Delhivery assigns it
    shipment_width: parcel.widthCm,
    shipment_height: parcel.heightCm,
    shipment_length: parcel.lengthCm,
    weight: parcel.weightG,
    shipping_mode: 'Surface',
    address_type: 'home',
    ewbn: ewaybill.trim(), // e-waybill, only for parcels worth Rs 50,000 or more
    fragile_shipment: false,
    dangerous_good: false,
    plastic_packaging: false,
    transport_speed: 'D', // standard delivery
  };
}

export type Shipment = ReturnType<typeof buildShipment>;

/** Parcels at or above this value need an e-waybill number (GST rules). */
export const EWAYBILL_FROM_INR = 50_000;

/** The form body Delhivery's manifest expects: `format=json&data=<json>`, URL-encoded. */
export function manifestBody(pickupLocation: string, shipments: Shipment[]): string {
  return new URLSearchParams({ format: 'json', data: JSON.stringify({ shipments, pickup_location: { name: pickupLocation } }) }).toString();
}

type CreatePackage = { status?: string; waybill?: string; remarks?: unknown; refnum?: string; serviceable?: boolean };
type CreateResponse = { success?: boolean; rmk?: string; packages?: CreatePackage[] };

/** A manifest answer: the waybill, or Delhivery's reason in plain text. */
export function readCreate(json: unknown): { waybill: string } | { reason: string; duplicate: boolean } {
  const r = (json ?? {}) as CreateResponse;
  const pkg = Array.isArray(r.packages) ? r.packages[0] : undefined;
  if (pkg && String(pkg.status).toLowerCase() === 'success' && pkg.waybill) return { waybill: String(pkg.waybill) };
  const remarks = pkg && Array.isArray(pkg.remarks) ? pkg.remarks.filter((x) => typeof x === 'string' && x.trim()).join(' ') : '';
  const reason = remarks || r.rmk || 'Delhivery did not create the shipment.';
  return { reason, duplicate: /duplicate order/i.test(reason) };
}

// ---------- PIN code serviceability ----------

export type Serviceability = { deliverable: boolean; embargo: boolean; cod: boolean | null; prepaid: boolean | null };

/**
 * /c/api/pin-codes/json/?filter_codes=… : an empty list means Delhivery does not deliver there;
 * a remark of "Embargo" means deliveries there are paused for now. Delhivery's live answer
 * calls it `remarks` (its documentation says `remark`), so both are read. Whether cash can be
 * collected, and whether prepaid parcels go there, come from the `cod` and `pre_paid` flags
 * ("Y"/"N"); null when Delhivery leaves them out.
 */
export function readServiceability(json: unknown): Serviceability {
  const codes = (json as { delivery_codes?: unknown[] } | null)?.delivery_codes;
  if (!Array.isArray(codes) || codes.length === 0) return { deliverable: false, embargo: false, cod: null, prepaid: null };
  const raw = (codes[0] as { postal_code?: unknown } | null)?.postal_code;
  const pc = (Array.isArray(raw) ? raw[0] : raw) as { remark?: unknown; remarks?: unknown; cod?: unknown; pre_paid?: unknown } | undefined;
  const remark = typeof pc?.remarks === 'string' ? pc.remarks : typeof pc?.remark === 'string' ? pc.remark : '';
  const embargo = remark.trim().toLowerCase() === 'embargo';
  const flag = (v: unknown) => {
    const f = typeof v === 'string' ? v.trim().toUpperCase() : null;
    return f === 'Y' ? true : f === 'N' ? false : null;
  };
  const cod = flag(pc?.cod);
  const prepaid = flag(pc?.pre_paid);
  // Served for neither way of paying = not served at all.
  const deliverable = !embargo && !(cod === false && prepaid === false);
  return { deliverable, embargo, cod, prepaid };
}

// ---------- Tracking ----------

/** One scan in a parcel's history: when, what (Delhivery's words), and the hub's name. */
export type Scan = { at: string; status: string; type: string; location: string };

export type Tracked = {
  waybill: string;
  ref: string;
  status: string;
  statusType: string;
  location: string;
  at: string | null;
  expectedAt: string | null;
  pickedUp: boolean;
  delivered: boolean;
  returning: boolean;
  /** Every scan with a time and a place, oldest first. */
  scans: Scan[];
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
const date = (v: unknown) => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Statuses a forward parcel shows while it is still with us, waiting to be collected. */
const NOT_PICKED = new Set(['manifested', 'not picked', 'open', 'scheduled']);

/** /api/v1/packages/json/ → one plain record per waybill (fields Delhivery leaves out are blank). */
export function readTracking(json: unknown): Tracked[] {
  const list = (json as { ShipmentData?: unknown[] } | null)?.ShipmentData;
  if (!Array.isArray(list)) return [];
  const out: Tracked[] = [];
  for (const entry of list) {
    const s = (entry as { Shipment?: Record<string, unknown> } | null)?.Shipment;
    if (!s || !str(s.AWB)) continue;
    const st = (s.Status ?? {}) as Record<string, unknown>;
    const status = str(st.Status);
    const statusType = str(st.StatusType).toUpperCase();
    const lower = status.toLowerCase();
    const returning = statusType === 'RT' || lower.startsWith('rto') || s.ReverseInTransit === true;
    const delivered = !returning && (lower === 'delivered' || statusType === 'DL');
    const pickedUp = delivered || returning || !!date(s.PickedupDate) || (!!lower && !NOT_PICKED.has(lower) && statusType !== 'CN');
    out.push({
      waybill: str(s.AWB),
      ref: str(s.ReferenceNo),
      status,
      statusType,
      location: str(st.StatusLocation),
      at: date(st.StatusDateTime),
      expectedAt: date(s.ExpectedDeliveryDate) ?? date(s.PromisedDeliveryDate),
      pickedUp,
      delivered,
      returning,
      scans: readScans(s.Scans),
    });
  }
  return out;
}

/** `Scans[].ScanDetail` → plain scans, oldest first, without entries missing a time or place. */
function readScans(raw: unknown): Scan[] {
  if (!Array.isArray(raw)) return [];
  const scans: Scan[] = [];
  for (const item of raw) {
    const d = ((item as { ScanDetail?: unknown } | null)?.ScanDetail ?? item) as Record<string, unknown> | null;
    if (!d) continue;
    const at = date(d.ScanDateTime) ?? date(d.StatusDateTime);
    const location = str(d.ScannedLocation);
    if (!at || !location) continue;
    scans.push({ at, status: str(d.Scan), type: str(d.ScanType).toUpperCase(), location });
  }
  return scans.sort((a, b) => a.at.localeCompare(b.at));
}

/** What the tracking sync should do with an order, given Delhivery's latest word on it. */
export function nextStep(orderStatus: string, t: Pick<Tracked, 'pickedUp' | 'delivered' | 'returning'>): 'delivered' | 'shipped' | 'returning' | 'none' {
  if (orderStatus !== 'packed' && orderStatus !== 'shipped') return 'none';
  if (t.delivered) return 'delivered';
  if (t.returning) return 'returning';
  if (t.pickedUp && orderStatus === 'packed') return 'shipped';
  return 'none';
}

/** Delhivery's status, in the house's words, for the customer's tracking page. */
export function carrierWords(status: string | null, statusType?: string | null): string | null {
  if (!status) return null;
  const s = status.trim().toLowerCase();
  if ((statusType ?? '').toUpperCase() === 'RT' || s.startsWith('rto')) return 'Returning to us';
  if (NOT_PICKED.has(s)) return 'Waiting for the courier to collect it';
  if (s === 'in transit') return 'In transit';
  if (s === 'pending') return 'At the delivery centre';
  if (s === 'dispatched') return 'Out for delivery';
  if (s === 'delivered') return 'Delivered';
  return status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase();
}

/** "Udupi_Ambalpady_D (Karnataka)" → "Udupi Ambalpady D (Karnataka)". */
export function placeName(location: string | null): string | null {
  const s = (location ?? '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return s || null;
}

// ---------- Pickup ----------

/** A pickup may be asked for today up to 7 days ahead (India dates), at a whole hour 10:00–18:00. */
export function pickupWindow(now = new Date()): { first: string; last: string } {
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  return { first: day(now), last: day(new Date(now.getTime() + 7 * 86_400_000)) };
}

export const PICKUP_HOURS = ['10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00'] as const;

/** Delhivery's refusals in plain words for the founder; anything unknown is passed through as is. */
export function plainReason(reason: string): string {
  if (/insufficient balance/i.test(reason)) return 'Your Delhivery wallet balance is too low. Top it up in Delhivery One (at least ₹500) and try again.';
  if (/ClientWarehouse matching query does not exist|Invalid Pickup Location/i.test(reason)) return 'Delhivery does not know our pickup location name. Check DELHIVERY_PICKUP_LOCATION matches the name in Delhivery One exactly.';
  if (/Client-Warehouse is not active/i.test(reason)) return 'Our pickup location is inactive in Delhivery. Ask Delhivery to activate it.';
  if (/non serviceable pincode/i.test(reason)) return 'Delhivery does not deliver to this PIN code.';
  if (/not serviceable for this account/i.test(reason)) return 'This payment type (prepaid or cash on delivery) is not switched on for our Delhivery account. Ask Delhivery to enable it.';
  if (/picked up or already in return flow/i.test(reason)) return 'Delhivery has already collected this parcel, so the booking can no longer be cancelled.';
  if (/capacity/i.test(reason)) return 'Delhivery has reached today’s limit for this PIN code. Try again after midnight.';
  return reason;
}
