// Order rules check, straight against the database functions. Places test orders for one
// size, checks each rule, then removes the orders and puts the stock back exactly as it was.
// Run: npm run test:orders   (safe to run at any time; uses the address checks@test.invalid)
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const EMAIL = 'checks@test.invalid';
let failed = 0;
const check = (ok, what, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? `  (${detail})` : ''}`);
};

const { data: variants } = await db
  .from('product_variants')
  .select('id, size, stock, products!inner(slug, price_inr, status, category_slug, categories!inner(launch_state))')
  .eq('products.status', 'live')
  .eq('products.categories.launch_state', 'live')
  .gte('stock', 4)
  .limit(1);
const v = variants?.[0];
if (!v) {
  console.log('No size on sale with at least 4 in stock: nothing to test with.');
  process.exit(1);
}
const startStock = v.stock;
const stock = async () => (await db.from('product_variants').select('stock').eq('id', v.id).single()).data.stock;
const place = async (method, qty, slug = v.products.slug) =>
  (await db.rpc('place_order', { p: { clerk_user_id: '', email: EMAIL, phone: '9876543210', ship_to: { full_name: 'Check', line1: 'x', city: 'y', state: 'Goa', pincode: '403001', country: 'IN' }, payment_method: method, items: [{ slug, size: v.size, qty }] } })).data;
const row = async (id) => (await db.from('orders').select('*').eq('id', id).single()).data;
const settings = Object.fromEntries((await db.from('settings').select('key, value')).data.map((s) => [s.key, s.value]));

try {
  // Prices and stock come from the database.
  const a = await place('online', 2);
  const subtotal = v.products.price_inr * 2;
  const shipping = subtotal >= settings.free_shipping_threshold_inr ? 0 : settings.shipping_fee_inr;
  check(a.ok && a.subtotal_inr === subtotal && a.total_inr === subtotal + shipping, 'order total is worked out from database prices', `₹${a.total_inr}`);
  check((await stock()) === startStock - 2, 'placing an order takes the stock');
  check((await row(a.id)).status === 'pending_payment', 'an online order waits for payment');

  // Refusals.
  const tooMany = await place('online', 10);
  check(!tooMany.ok && tooMany.error === 'stock', 'more than is in stock is refused', `available ${tooMany.available}`);
  const ghost = await place('online', 1, 'no-such-piece');
  check(!ghost.ok && ghost.error === 'unavailable', 'an unknown piece is refused');
  check((await stock()) === startStock - 2, 'refused orders take no stock');

  // A hold that runs out.
  await db.from('orders').update({ hold_expires_at: new Date(Date.now() - 60_000).toISOString(), razorpay_order_id: `order_CHECK_${a.id}` }).eq('id', a.id);
  await db.rpc('release_expired_orders');
  check((await row(a.id)).status === 'expired' && (await stock()) === startStock, 'an unpaid order lapses and its stock returns');

  // A payment that arrives late, and twice.
  const paid = (await db.rpc('mark_order_paid', { p_razorpay_order_id: `order_CHECK_${a.id}`, p_payment_id: 'pay_CHECK' })).data;
  const again = (await db.rpc('mark_order_paid', { p_razorpay_order_id: `order_CHECK_${a.id}`, p_payment_id: 'pay_CHECK' })).data;
  const after = await row(a.id);
  check(paid.ok && !paid.already && after.status === 'confirmed' && after.payment_status === 'paid', 'a late payment still confirms the order');
  check((await stock()) === startStock - 2, 'a late payment takes the stock again');
  check(again.ok && again.already === true && (await stock()) === startStock - 2, 'the same payment twice changes nothing');

  // Cash on delivery.
  const c = await place('cod', 1);
  const cod = await row(c.id);
  check(cod.status === 'awaiting_confirmation' && new Date(cod.hold_expires_at) - Date.now() > 23 * 3600_000, 'a COD order waits up to 24 hours for confirmation');
  const wrong = (await db.rpc('confirm_cod_order', { p_token: '00000000-0000-4000-8000-000000000000' })).data;
  check(!wrong.ok, 'a wrong confirmation link is refused');
  const yes = (await db.rpc('confirm_cod_order', { p_token: cod.cod_confirm_token })).data;
  check(yes.ok && (await row(c.id)).status === 'confirmed', 'the right link confirms it');
} finally {
  const { data: orders } = await db.from('orders').select('id').eq('email', EMAIL);
  for (const o of orders ?? []) await db.from('orders').delete().eq('id', o.id);
  await db.from('product_variants').update({ stock: startStock }).eq('id', v.id);
  check((await stock()) === startStock, 'clean-up: test orders removed, stock as before', `${startStock}`);
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll order checks passed.');
process.exit(failed ? 1 : 0);
