import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin-gate';
import { labelLink } from '@/lib/delhivery';
import { getOrder } from '@/lib/orders';

// Who is asking must be checked on every request; never cached.
export const dynamic = 'force-dynamic';

/**
 * The Delhivery shipping label for an order booked from admin: /admin/label/HOK-1001?size=A4|4R
 * (A4 sheet, or a 4×6 label for label printers). Opens Delhivery's PDF, whose link lasts 24
 * hours, so a fresh one is asked for every time. Founder only; 404 to anyone else.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  if (!(await isAdmin())) return new Response('Not found', { status: 404 });
  const { number } = await params;
  const order = await getOrder(number);
  if (!order?.shipment_booked_at || order.courier !== 'Delhivery' || !order.tracking_number) return new Response('Not found', { status: 404 });

  const size = req.nextUrl.searchParams.get('size') === '4R' ? '4R' : 'A4';
  const label = await labelLink(order.tracking_number, size);
  if ('reason' in label) {
    return new Response(`The label could not be fetched: ${label.reason}`, { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return Response.redirect(label.url, 303);
}
