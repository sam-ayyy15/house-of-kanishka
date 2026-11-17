import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { adminDb } from '@/lib/supabase/server';

/**
 * Razorpay, server side. Card and UPI details never touch our pages: the browser opens
 * Razorpay's own payment window for an order created here, and we only check signatures.
 * Online payment stays switched off until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.
 */
export const razorpayConfigured = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

/** The public key id, safe to send to the browser. */
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? '';

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

type Call<T> = { ok: true; data: T } | { ok: false; reason: string };

/**
 * One authenticated call to Razorpay's API. When Razorpay refuses, its own reason is returned
 * and written to the error log (admin → Errors), so a failed payment or refund can be traced
 * without reading hosting logs. Only Razorpay's error text and the endpoint are stored.
 */
async function razorpay<T>(path: string, body: Record<string, unknown>): Promise<Call<T>> {
  let reason: string;
  try {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: { code?: string; description?: string } };
    if (res.ok) return { ok: true, data: json };
    reason = [json.error?.description, json.error?.code, `HTTP ${res.status}`].filter(Boolean).join(' · ');
  } catch (e) {
    reason = `Could not reach Razorpay: ${e instanceof Error ? e.message : String(e)}`;
  }
  try {
    await adminDb().from('error_log').insert({ path: `razorpay ${path.replace(/pay_[A-Za-z0-9]+/, 'pay_…')}`, message: reason, kind: 'razorpay' });
  } catch {
    // Logging must never turn a refused call into a crash.
  }
  return { ok: false, reason };
}

/** Creates the Razorpay order the payment window pays against. Amount is whole rupees. */
export async function createRazorpayOrder(amountInr: number, receipt: string): Promise<{ id: string } | null> {
  if (!razorpayConfigured) return null;
  const r = await razorpay<{ id?: string }>('/orders', { amount: amountInr * 100, currency: 'INR', receipt, notes: { order_number: receipt } });
  return r.ok && r.data.id ? { id: r.data.id } : null;
}

/** The signature Razorpay's window hands back after a successful payment. */
export function validPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!razorpayConfigured) return false;
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest('hex');
  return same(expected, signature);
}

/** The signature on a webhook call (X-Razorpay-Signature), over the exact request body. */
export function validWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return same(createHmac('sha256', secret).update(rawBody).digest('hex'), signature);
}

/**
 * Returns a payment (in full) to the customer's original payment method. Amount is whole
 * rupees. On refusal, `reason` is Razorpay's own explanation, to show the founder.
 */
export async function refundPayment(paymentId: string, amountInr: number): Promise<{ id: string } | { reason: string }> {
  if (!razorpayConfigured) return { reason: 'Online payment is not set up (Razorpay keys are missing).' };
  const r = await razorpay<{ id?: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountInr * 100 });
  if (!r.ok) return { reason: r.reason };
  return r.data.id ? { id: r.data.id } : { reason: 'Razorpay did not return a refund id.' };
}
