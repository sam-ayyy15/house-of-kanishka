'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { orderStatusLabel } from '@/lib/order-status';
import type { ShipTo } from '@/lib/orders';
import { clearBag } from '@/lib/store';
import { CountUp } from '../CountUp';
import { Emblem } from '../Emblem';
import { Handwriting } from '../Handwriting';
import { CodConfirm } from './CodConfirm';
import { PLACED_KEY } from '../shop/CheckoutView';
import styles from './Order.module.css';

export type InvoiceOrder = {
  number: string;
  /** The order's private link token (the viewer already holds it or owns the order). */
  token: string;
  /** Cash on delivery: whether the confirmation email went out. */
  confirmEmailSent: boolean;
  placedAt: string;
  status: string;
  paymentMethod: 'online' | 'cod';
  paid: boolean;
  email: string;
  phone: string;
  shipTo: ShipTo;
  subtotal: number;
  shipping: number;
  total: number;
  items: { id: string; name: string; size: string; colour: string | null; qty: number; unitPrice: number }[];
};

const day = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
const t = (ms: number) => ({ '--t': `${ms}ms` }) as React.CSSProperties;

/**
 * The order confirmation: the lotus opens, a sheet of paper slides up, its lines rise one
 * by one, the amounts count up, the total is written in script and a red lotus stamp
 * presses down; then the buttons fade in. EXTRAPOLATED – no reference design
 * (DESIGN_GUIDE.md §6 "Invoice / confirmation").
 *
 * It plays once per order per visit. A click anywhere skips to the finished bill, and with
 * reduced motion the finished bill is simply shown.
 */
export function Invoice({
  order,
  seller,
  signedIn,
  emailed,
}: {
  order: InvoiceOrder;
  seller: { name: string; address: string[]; email: string };
  signedIn: boolean;
  /** Whether order emails are being sent (email is set up). */
  emailed: boolean;
}) {
  const [play, setPlay] = useState(true);
  const awaiting = order.status === 'awaiting_confirmation';
  const cod = order.paymentMethod === 'cod';

  useEffect(() => {
    const seenKey = `hok-order-seen-${order.number}`;
    try {
      if (window.sessionStorage.getItem(seenKey)) setPlay(false);
      window.sessionStorage.setItem(seenKey, '1');
      // This browser just placed this order: its bag is done with.
      if (window.sessionStorage.getItem(PLACED_KEY) === order.number) {
        window.sessionStorage.removeItem(PLACED_KEY);
        clearBag();
      }
    } catch {
      // Storage blocked: the sequence simply plays.
    }
  }, [order.number]);

  const linesStart = 1900;
  const afterLines = linesStart + order.items.length * 80;
  const totalAt = afterLines + 500;
  const stampAt = totalAt + 1300;
  const actionsAt = stampAt + 700;
  const digits = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(order.total);

  return (
    <div className={styles.stage} data-play={play ? '' : undefined} onClick={() => setPlay(false)}>
      <header className={styles.greeting}>
        <Emblem bloom={play ? 'load' : 'none'} className={styles.lotus} />
        <p className={styles.script} data-write={play ? 'load' : undefined} style={{ '--write-delay': '500ms' } as React.CSSProperties}>
          <Handwriting text="Thank you" />
        </p>
        <h1 className={styles.title} style={t(700)}>
          {awaiting ? (order.confirmEmailSent ? 'One step left: confirm by email' : 'One step left: confirm your order') : order.status === 'confirmed' ? 'Your order is confirmed' : `Order ${order.number}: ${orderStatusLabel(order.status)}`}
        </h1>
        <p className={styles.lede} style={t(820)}>
          {awaiting
            ? order.confirmEmailSent
              ? `We have sent a link to ${order.email}. Please confirm within 24 hours and we will prepare your pieces for dispatch.`
              : `We could not send the confirmation email to ${order.email}. Please confirm your order below within 24 hours.`
            : emailed
              ? `A confirmation is on its way to ${order.email}.`
              : 'Keep this page: it is your bill. You can return to it from this link at any time.'}
        </p>
        {awaiting && <CodConfirm number={order.number} token={order.token} emailSent={order.confirmEmailSent} />}
      </header>

      <article className={styles.sheet} aria-label={`Bill for order ${order.number}`}>
        <div className={styles.sheetHead} style={t(1500)}>
          <div>
            <p className={styles.house}>{seller.name}</p>
            <p className={styles.kind}>Bill of supply</p>
          </div>
          <dl className={styles.meta}>
            <div>
              <dt>Order</dt>
              <dd>{order.number}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{day(order.placedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.parties} style={t(1650)}>
          <div>
            <p className={styles.label}>Deliver to</p>
            <p>
              {order.shipTo.full_name}
              <br />
              {order.shipTo.line1}
              {order.shipTo.line2 ? `, ${order.shipTo.line2}` : ''}
              <br />
              {order.shipTo.city}, {order.shipTo.state} {order.shipTo.pincode}
              <br />
              +91 {order.phone}
            </p>
          </div>
          <div>
            <p className={styles.label}>Payment</p>
            <p>{cod ? 'Cash on delivery' : 'Paid online (Razorpay)'}</p>
          </div>
        </div>

        <ul className={styles.items}>
          {order.items.map((i, k) => (
            <li key={i.id} className={styles.item} style={t(linesStart + k * 80)}>
              <div>
                <p className={styles.itemName}>{i.name}</p>
                <p className={styles.itemMeta}>
                  {[i.colour, i.size, `Qty ${i.qty}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className={styles.amount}>{formatPrice(i.unitPrice * i.qty)}</p>
            </li>
          ))}
        </ul>

        <dl className={styles.sums} style={t(afterLines + 200)}>
          <div>
            <dt>Subtotal</dt>
            <dd>{play ? <CountUp value={order.subtotal} delay={afterLines + 300} /> : formatPrice(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd>
          </div>
        </dl>

        <div className={styles.totalRow}>
          <p className={styles.totalLabel} style={t(totalAt)}>
            {cod ? 'To pay on delivery' : 'Total paid'}
          </p>
          {/* The total, written by hand. Screen readers get the plain amount. */}
          <p className={styles.totalScript}>
            <span className="visually-hidden">{formatPrice(order.total, { withCode: true })}</span>
            <span aria-hidden="true" className={styles.rupee} style={t(totalAt)}>
              ₹
            </span>
            <span aria-hidden="true" data-write={play ? 'load' : undefined} style={{ '--write-delay': `${totalAt + 150}ms` } as React.CSSProperties}>
              <Handwriting text={digits} decorative />
            </span>
          </p>
          <div className={styles.stamp} style={t(stampAt)} aria-hidden="true">
            <Emblem bloom="none" className={styles.stampLotus} />
            <span>{cod ? 'Pay on delivery' : 'Paid'}</span>
          </div>
        </div>

        <footer className={styles.sheetFoot} style={t(totalAt + 300)}>
          <p>
            {seller.name}
            {seller.address.map((line) => ` · ${line}`).join('')}
          </p>
          <p>Not registered under GST: this is a bill of supply and no tax is charged. Questions: {seller.email}</p>
        </footer>
      </article>

      <div className={styles.actions} style={t(actionsAt)}>
        <Link href="/new-arrivals" className="btn btn-black">
          Continue shopping
        </Link>
        <Link href={`/order/${order.number}/track?t=${order.token}`} className="btn btn-outline">
          Track order
        </Link>
        {/* The browser's own "Save as PDF" prints just the sheet (see the print rules in Order.module.css). */}
        <button
          type="button"
          className="btn btn-outline"
          onClick={(e) => {
            e.stopPropagation();
            setPlay(false);
            window.setTimeout(() => window.print(), 50);
          }}
        >
          Save bill as PDF
        </button>
        {signedIn && (
          <Link href="/account/orders" className="btn btn-outline">
            View my orders
          </Link>
        )}
      </div>
    </div>
  );
}
