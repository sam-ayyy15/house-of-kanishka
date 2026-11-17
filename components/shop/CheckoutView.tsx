'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { confirmPayment, placeOrder, type CheckoutResult } from '@/app/actions/checkout';
import { formatPrice } from '@/lib/format';
import { INDIAN_STATES, indianMobile, PINCODE } from '@/lib/india';
import { clearBag } from '@/lib/store';
import { useCatalog } from '../CatalogProvider';
import { CountUp } from '../CountUp';
import { Emblem } from '../Emblem';
import { Field, SelectField } from '../form/Field';
import { FormStatus } from '../form/FormStatus';
import { SubmitButton } from '../form/SubmitButton';
import { useBag } from './BagView';
import styles from './CheckoutView.module.css';

type SavedAddress = {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

type Props = {
  account: { email: string; name: string; addresses: SavedAddress[] } | null;
  canSignIn: boolean;
  onlineOpen: boolean;
  codOpen: boolean;
  /** Largest order that may be paid in cash (0 = no limit). */
  codMax: number;
  shippingFee: number;
};

type Values = { email: string; phone: string; full_name: string; line1: string; line2: string; city: string; state: string; pincode: string };
type Method = 'online' | 'cod';
type Online = Extract<CheckoutResult, { kind: 'online' }>;
/** What the white veil over the page is showing (null = no veil). */
type Veil = null | 'placing' | 'opening' | 'confirming' | 'closed' | 'failed' | 'done';

type RazorpayWindow = { open: () => void; on: (event: 'payment.failed', cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayWindow;
  }
}

/** Razorpay's payment window script, loaded only when someone actually pays online. */
function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * The lotus for Razorpay's window (public/payment-logo.png, 256 px square). The window lives on
 * Razorpay's domain and refuses plain-http images, so the picture itself is handed over as a
 * data URL: it shows locally and live alike. Read once, then reused.
 */
let paymentLogo: Promise<string> | null = null;
function loadPaymentLogo(): Promise<string> {
  paymentLogo ??= fetch('/payment-logo.png')
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        }),
    )
    .catch(() => {
      paymentLogo = null; // try again next time; meanwhile the full address works on the live (https) site
      return `${window.location.origin}/payment-logo.png`;
    });
  return paymentLogo;
}

/**
 * Notes which order this browser just placed, so its confirmation page can empty the bag
 * even when the customer comes back by another route (for example from a UPI app).
 */
export const PLACED_KEY = 'hok-placed-order';
function rememberOrder(number: string) {
  try {
    window.sessionStorage.setItem(PLACED_KEY, number);
  } catch {
    // Storage blocked: the bag is emptied by finish() instead.
  }
}

const STEPS = ['Contact', 'Delivery', 'Payment'] as const;

/**
 * Checkout. EXTRAPOLATED – no reference design. Three steps (Contact, Delivery, Payment);
 * each folds into a one-line summary once done. Our own form collects who and where;
 * payment itself happens in Razorpay's window (or in cash on delivery). No card or UPI
 * details are ever typed into this page.
 */
export function CheckoutView({ account, canSignIn, onlineOpen, codOpen, codMax, shippingFee }: Props) {
  const router = useRouter();
  const { lines, subtotal, freeShipping } = useBag();
  const { freeShipping: threshold } = useCatalog();
  const shipping = freeShipping ? 0 : shippingFee;
  const total = subtotal + shipping;
  const codAllowed = codOpen && (codMax === 0 || total <= codMax);

  const first = account?.addresses[0];
  const [values, setValues] = useState<Values>({
    email: account?.email ?? '',
    phone: first?.phone ?? '',
    full_name: first?.full_name ?? account?.name ?? '',
    line1: first?.line1 ?? '',
    line2: first?.line2 ?? '',
    city: first?.city ?? '',
    state: first?.state ?? '',
    pincode: first?.pincode ?? '',
  });
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<Method>(onlineOpen ? 'online' : 'cod');
  const [saveAddress, setSaveAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [veil, setVeil] = useState<Veil>(null);
  const [veilNote, setVeilNote] = useState('');
  const pending = useRef<Online | null>(null);

  const bind = (name: keyof Values) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      if (errors[name]) setErrors(({ [name]: _gone, ...rest }) => rest);
    },
  });

  /** The same checks the server makes, so mistakes show before anything is sent. */
  function check(stepIndex: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) e.email = 'Please enter a valid email address.';
      if (!indianMobile(values.phone)) e.phone = 'Please enter a 10-digit Indian mobile number.';
    } else if (stepIndex === 1) {
      if (values.full_name.trim().length < 2) e.full_name = 'Please enter the full name.';
      if (values.line1.trim().length < 3) e.line1 = 'Please enter the house number and street.';
      if (values.city.trim().length < 2) e.city = 'Please enter the city.';
      if (!PINCODE.test(values.pincode.trim())) e.pincode = 'Please enter a 6-digit PIN code.';
      if (!values.state) e.state = 'Please choose a state.';
    }
    return e;
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const found = check(step);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(step + 1);
  }

  const pickAddress = (a: SavedAddress) => {
    setValues((v) => ({ ...v, full_name: a.full_name, line1: a.line1, line2: a.line2 ?? '', city: a.city, state: a.state, pincode: a.pincode, phone: v.phone || a.phone }));
    setErrors({});
  };

  /** Order placed and settled: keep the veil up while the confirmation page opens. */
  function finish(url: string) {
    setVeil('done');
    router.push(url);
    // The bag empties once the new page is on its way, so this page never flashes "empty".
    window.setTimeout(clearBag, 1200);
  }

  async function openRazorpay(order: Online) {
    setVeil('opening');
    const [loaded, logo] = await Promise.all([loadRazorpay(), loadPaymentLogo()]);
    if (!loaded || !window.Razorpay) {
      setVeilNote('The payment window could not be loaded. Please check your connection and try again.');
      return setVeil('failed');
    }
    const rzp = new window.Razorpay({
      key: order.razorpay.key,
      order_id: order.razorpay.orderId,
      amount: order.razorpay.amount,
      currency: 'INR',
      name: 'House of Kanishka',
      description: `Order ${order.number}`,
      image: logo,
      prefill: { name: order.razorpay.name, email: order.razorpay.email, contact: order.razorpay.contact },
      // Brand red for Razorpay's panel and buttons; a translucent white wash behind the window
      // instead of Razorpay's dark grey, so the page (and its lotus veil) stays softly visible.
      theme: { color: '#A20F15', backdrop_color: '#FFFFFFD9' },
      retry: { enabled: true },
      modal: {
        // Closed without paying: the pieces stay held, and the same order can be paid again.
        ondismiss: () => setVeil((v) => (v === 'confirming' || v === 'done' ? v : 'closed')),
      },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setVeil('confirming');
        const result = await confirmPayment(resp);
        if (result.ok) return finish(result.url);
        // Paid, but we could not confirm it from here: the order page waits for the bank's word.
        finish(`/order/${order.number}?t=${order.token}`);
      },
    });
    rzp.on('payment.failed', (r) => {
      setVeilNote(r.error?.description ?? '');
    });
    rzp.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const found = { ...check(0), ...check(1) };
    if (Object.keys(found).length) {
      setErrors(found);
      return setStep(found.email || found.phone ? 0 : 1);
    }
    setVeil('placing');
    let result: CheckoutResult;
    try {
      result = await placeOrder({
        ...values,
        line2: values.line2 || undefined,
        state: values.state as (typeof INDIAN_STATES)[number],
        method,
        save_address: saveAddress,
        items: lines.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty })),
      });
    } catch {
      result = { ok: false, message: 'We could not reach the shop. Nothing has been charged. Please try again.' };
    }
    if (!result.ok) {
      setVeil(null);
      setMessage(result.message);
      if (result.fields) {
        setErrors(result.fields);
        setStep(result.fields.email || result.fields.phone ? 0 : 1);
      }
      return;
    }
    if (result.kind === 'cod') {
      rememberOrder(result.url.split('/')[2]?.split('?')[0] ?? '');
      return finish(result.url);
    }
    pending.current = result;
    rememberOrder(result.number);
    await openRazorpay(result);
  }

  if (veil === 'done' || (lines.length === 0 && veil !== null)) return <PaymentVeil state="done" />;

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <h1 className="page-title">Nothing to check out yet</h1>
        <Link href="/new-arrivals" className="btn btn-black">
          Shop new arrivals
        </Link>
      </div>
    );
  }

  const summaries = [
    `${values.email} · +91 ${values.phone.replace(/\D/g, '').slice(-10)}`,
    `${values.full_name}, ${values.line1}, ${values.city} ${values.pincode}`,
    '',
  ];

  return (
    <div className={styles.layout}>
      <div className={styles.form}>
        <h1 className="page-title">Checkout</h1>

        {STEPS.map((title, i) => {
          const state = i === step ? 'active' : i < step ? 'done' : 'todo';
          return (
            <section key={title} className={styles.step} data-state={state} aria-labelledby={`step-${i}`}>
              <header className={styles.stepHead}>
                <h2 id={`step-${i}`} className={styles.stepTitle}>
                  <span className={styles.index}>(0{i + 1})</span>
                  {title}
                  {/* A finished step is marked by the lotus opening beside its title. */}
                  {state === 'done' && <Emblem bloom="load" className={styles.doneMark} />}
                </h2>
                {state === 'done' && (
                  <>
                    <p className={styles.stepSummary}>{summaries[i]}</p>
                    <button type="button" className="text-link" onClick={() => setStep(i)}>
                      Edit
                    </button>
                  </>
                )}
              </header>

              {state === 'active' && i === 0 && (
                <form className={styles.stepBody} onSubmit={next} noValidate>
                  {canSignIn && (
                    <p className={styles.hint}>
                      Have an account?{' '}
                      <Link href="/login?next=/checkout" className="text-link">
                        Sign in for faster checkout
                      </Link>
                    </p>
                  )}
                  <Field label="Email" type="email" autoComplete="email" required {...bind('email')} />
                  <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={16} {...bind('phone')} />
                  <p className="muted">For order updates and the courier. We deliver within India.</p>
                  <button type="submit" className="btn btn-black">
                    Continue to delivery
                  </button>
                </form>
              )}

              {state === 'active' && i === 1 && (
                <form className={styles.stepBody} onSubmit={next} noValidate>
                  {account && account.addresses.length > 0 && (
                    <div className={styles.saved} role="group" aria-label="Saved addresses">
                      {account.addresses.map((a) => {
                        const chosen = a.line1 === values.line1 && a.pincode === values.pincode;
                        return (
                          <button key={a.id} type="button" className={styles.savedCard} aria-pressed={chosen} onClick={() => pickAddress(a)}>
                            <span className={styles.savedName}>{a.full_name}</span>
                            <span>
                              {a.line1}, {a.city} {a.pincode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <Field label="Full name" autoComplete="name" required maxLength={120} {...bind('full_name')} />
                  <Field label="House number and street" autoComplete="address-line1" required maxLength={200} {...bind('line1')} />
                  <Field label="Area or landmark (optional)" autoComplete="address-line2" maxLength={200} {...bind('line2')} />
                  <div className={styles.two}>
                    <Field label="City" autoComplete="address-level2" required maxLength={80} {...bind('city')} />
                    <Field label="PIN code" inputMode="numeric" autoComplete="postal-code" required maxLength={6} {...bind('pincode')} />
                  </div>
                  <SelectField label="State" autoComplete="address-level1" required {...bind('state')}>
                    <option value="">Choose a state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectField>
                  {account && (
                    <label className="check">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      <span>Save this address to my account</span>
                    </label>
                  )}
                  <button type="submit" className="btn btn-black">
                    Continue to payment
                  </button>
                </form>
              )}

              {state === 'active' && i === 2 && (
                <form className={styles.stepBody} onSubmit={submit}>
                  <div className={styles.methods} role="radiogroup" aria-label="Payment method">
                    <label className={styles.method} data-checked={method === 'online' || undefined} data-off={!onlineOpen || undefined}>
                      <input type="radio" className="house" name="method" value="online" checked={method === 'online'} disabled={!onlineOpen} onChange={() => setMethod('online')} />
                      <span className={styles.methodTitle}>Pay online</span>
                      <span className={styles.methodNote}>{onlineOpen ? 'UPI, cards, netbanking and wallets' : 'Opening soon'}</span>
                      {method === 'online' && (
                        <span className={styles.methodMore}>
                          You pay in Razorpay’s secure window, which opens next. We never see or store your card or UPI details.
                        </span>
                      )}
                    </label>
                    <label className={styles.method} data-checked={method === 'cod' || undefined} data-off={!codAllowed || undefined}>
                      <input type="radio" className="house" name="method" value="cod" checked={method === 'cod'} disabled={!codAllowed} onChange={() => setMethod('cod')} />
                      <span className={styles.methodTitle}>Cash on delivery</span>
                      <span className={styles.methodNote}>
                        {codAllowed ? 'Pay when your pieces arrive' : codOpen ? `Available up to ${formatPrice(codMax)}` : 'Not available at the moment'}
                      </span>
                      {method === 'cod' && codAllowed && (
                        <span className={styles.methodMore}>
                          We will email you a link to confirm the order. Please confirm within 24 hours, and have{' '}
                          {formatPrice(total)} ready for the courier.
                        </span>
                      )}
                    </label>
                  </div>

                  <p className={styles.terms}>
                    By placing this order you agree to our <Link href="/terms">Terms</Link> and{' '}
                    <Link href="/refund-policy">Refund policy</Link>.
                  </p>
                  <SubmitButton
                    pending={veil === 'placing'}
                    busyLabel="Placing your order…"
                    className="btn btn-red btn-split"
                    disabled={method === 'online' ? !onlineOpen : !codAllowed}
                  >
                    <span>{method === 'online' ? 'Pay now' : 'Place order'}</span>
                    <span>
                      <CountUp value={total} withCode />
                    </span>
                  </SubmitButton>
                  <FormStatus message={message} />
                </form>
              )}
            </section>
          );
        })}
      </div>

      <aside className={styles.summary} aria-label="Order summary">
        <h2 className={styles.summaryTitle}>Your order</h2>
        <ul className={styles.lines}>
          {lines.map(({ product, size, qty }) => (
            <li key={`${product.slug}-${size}`} className={styles.line}>
              <div className={styles.thumb}>
                {/* Placeholder: local-only photo. Never ship. */}
                <Image src={product.image} alt="" fill sizes="72px" />
              </div>
              <div>
                <p className={styles.name}>{product.name}</p>
                <p className="muted">
                  {size} · Qty {qty}
                </p>
              </div>
              <p className={styles.price}>{formatPrice(product.price * qty)}</p>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
          </div>
          <div className={styles.total}>
            <dt>Total</dt>
            <dd>
              <CountUp value={total} withCode />
            </dd>
          </div>
        </dl>
        {!freeShipping && shippingFee > 0 && <p className="muted">Free shipping from {formatPrice(threshold)}.</p>}
        <Link href="/bag" className="text-link">
          Edit bag
        </Link>
      </aside>

      {veil && veil !== 'placing' && (
        <PaymentVeil
          state={veil}
          note={veilNote}
          onRetry={() => pending.current && openRazorpay(pending.current)}
          onBack={() => {
            setVeil(null);
            setVeilNote('');
          }}
        />
      )}
    </div>
  );
}

/**
 * The white veil over checkout while payment happens elsewhere: the lotus opens before
 * Razorpay's window appears, keeps breathing while the payment is confirmed, and gives way
 * to a calm recovery screen if the window is closed or the payment fails.
 */
function PaymentVeil({ state, note, onRetry, onBack }: { state: Exclude<Veil, null | 'placing'>; note?: string; onRetry?: () => void; onBack?: () => void }) {
  const waiting = state === 'opening' || state === 'confirming' || state === 'done';
  return (
    <div className={styles.veil} role={waiting ? 'status' : 'alertdialog'} aria-live="polite" aria-label="Payment">
      <div key={state} className={styles.veilInner}>
        <Emblem bloom="load" className={styles.veilEmblem} data-breathing={state === 'confirming' || undefined} />
        {state === 'opening' && <p className={styles.veilTitle}>Opening secure payment</p>}
        {state === 'confirming' && (
          <>
            <p className={styles.veilTitle}>Confirming your payment</p>
            <p className={styles.veilText}>Please keep this page open. This takes a few seconds.</p>
          </>
        )}
        {state === 'done' && <p className={styles.veilTitle}>Thank you</p>}
        {(state === 'closed' || state === 'failed') && (
          <>
            <p className={styles.veilTitle}>{state === 'closed' ? 'Your payment was not completed' : 'The payment could not start'}</p>
            <p className={styles.veilText}>
              {note || 'Nothing has been charged.'} {state === 'closed' && 'Your pieces are held for you for 15 minutes.'}
            </p>
            <div className={styles.veilActions}>
              <button type="button" className="btn btn-outline" onClick={onRetry}>
                Try again
              </button>
              <button type="button" className="text-link" onClick={onBack}>
                Choose another way to pay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
