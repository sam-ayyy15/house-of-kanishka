import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin-gate';
import { toCsv, type Cell } from '@/lib/csv';
import { orderStatusLabel } from '@/lib/order-status';
import type { ShipTo } from '@/lib/orders';
import { istDay, parseRange, rangeStart } from '@/lib/sales';
import { adminDb } from '@/lib/supabase/server';

// Who is asking must be checked on every request; never cached.
export const dynamic = 'force-dynamic';

const ist = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
        .format(new Date(iso))
        .replace(',', '')
    : '';

type Item = { name: string; product_slug: string; size: string; colour: string | null; qty: number; unit_price_inr: number };

/**
 * Orders as CSV, for the accountant and the founder's records: /admin/export?type=orders|items
 * &range=7d|30d|90d|all. Route handlers don't run the admin layouts, so this checks the
 * founder AND the admin password itself; to anyone else it does not exist (404).
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return new Response('Not found', { status: 404 });

  const type = req.nextUrl.searchParams.get('type') === 'items' ? 'items' : 'orders';
  const range = parseRange(req.nextUrl.searchParams.get('range'));
  const start = rangeStart(range);

  let query = adminDb()
    .from('orders')
    .select(
      'number, placed_at, status, payment_method, payment_status, email, phone, ship_to, subtotal_inr, shipping_inr, total_inr, razorpay_payment_id, razorpay_refund_id, paid_at, refunded_at, courier, tracking_number, needs_attention, items:order_items(name, product_slug, size, colour, qty, unit_price_inr)',
    )
    .order('placed_at', { ascending: true })
    .limit(20_000);
  if (start) query = query.gte('placed_at', start.toISOString());
  const { data, error } = await query;
  if (error) return new Response('The export could not be made. Please try again.', { status: 500 });
  const orders = data ?? [];

  let header: string[];
  let rows: Cell[][];
  if (type === 'orders') {
    header = [
      'Order', 'Placed (India time)', 'Status', 'Payment method', 'Payment status', 'Customer', 'Email', 'Phone',
      'Address line 1', 'Address line 2', 'City', 'State', 'PIN code', 'Pieces', 'Items',
      'Subtotal (INR)', 'Shipping (INR)', 'Total (INR)', 'Paid at (India time)', 'Razorpay payment ID',
      'Refunded at (India time)', 'Razorpay refund ID', 'Courier', 'Tracking number', 'Needs attention',
    ];
    rows = orders.map((o) => {
      const to = o.ship_to as ShipTo;
      const items = o.items as Item[];
      return [
        o.number, ist(o.placed_at), orderStatusLabel(o.status), o.payment_method === 'cod' ? 'Cash on delivery' : 'Online',
        o.payment_status, to.full_name, o.email, o.phone, to.line1, to.line2 ?? '', to.city, to.state, to.pincode,
        items.reduce((n, i) => n + i.qty, 0),
        items.map((i) => `${i.name} (${[i.colour, i.size].filter(Boolean).join(', ')}) x${i.qty}`).join('; '),
        o.subtotal_inr, o.shipping_inr, o.total_inr, ist(o.paid_at), o.razorpay_payment_id ?? '',
        ist(o.refunded_at), o.razorpay_refund_id ?? '', o.courier ?? '', o.tracking_number ?? '', o.needs_attention ?? '',
      ];
    });
  } else {
    header = ['Order', 'Placed (India time)', 'Status', 'Payment method', 'Piece', 'Product slug', 'Colour', 'Size', 'Quantity', 'Unit price (INR)', 'Line total (INR)'];
    rows = orders.flatMap((o) =>
      (o.items as Item[]).map((i) => [
        o.number, ist(o.placed_at), orderStatusLabel(o.status), o.payment_method === 'cod' ? 'Cash on delivery' : 'Online',
        i.name, i.product_slug, i.colour ?? '', i.size, i.qty, i.unit_price_inr, i.qty * i.unit_price_inr,
      ]),
    );
  }

  const file = `house-of-kanishka-${type}-${range}-${istDay(new Date())}.csv`;
  return new Response(toCsv(header, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
