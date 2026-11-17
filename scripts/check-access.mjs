// Access rules check: what a stranger holding only the PUBLIC key can do. Read-only apart from
// attempts that must be refused. Run: npm run test:access
// Every private table must come back empty or refused, every write must be refused, and none
// of the server-only database functions may be callable.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

let failed = 0;
const report = (ok, what, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? `  (${detail})` : ''}`);
};

const PRIVATE = ['profiles', 'addresses', 'bag_items', 'wishlist_items', 'orders', 'order_items', 'payment_events', 'newsletter_subscribers',
  'launch_waitlist', 'consent_log', 'contact_messages', 'rate_limits', 'products', 'product_variants', 'settings', 'collections', 'looks', 'curated_lists'];

for (const table of PRIVATE) {
  const real = await admin.from(table).select('*', { count: 'exact', head: true });
  const seen = await anon.from(table).select('*').limit(5);
  report(!!seen.error || seen.data.length === 0, `read ${table}`, `stranger sees ${seen.error ? 'refused' : seen.data.length} of ${real.count ?? '?'} rows`);
}

const WRITES = [
  ['profiles', { clerk_user_id: 'user_intruder', email: 'x@example.com' }],
  ['orders', { number: 'HOK-999999', email: 'x@example.com', phone: '9', ship_to: {}, payment_method: 'cod', status: 'confirmed', subtotal_inr: 0, shipping_inr: 0, total_inr: 0 }],
  ['newsletter_subscribers', { email: 'intruder@example.com' }],
  ['contact_messages', { name: 'x', email: 'x@example.com', message: 'x' }],
  ['settings', { key: 'shipping_fee_inr', value: 1 }],
];
for (const [table, row] of WRITES) {
  const res = await anon.from(table).insert(row);
  report(!!res.error, `insert into ${table} refused`, res.error?.code ?? 'ACCEPTED');
}
const upd = await anon.from('product_variants').update({ stock: 999 }).gte('stock', 0).select('id');
report(!!upd.error || upd.data.length === 0, 'update stock refused', upd.error?.code ?? `${upd.data?.length} rows changed`);
const del = await anon.from('orders').delete().neq('number', '').select('id');
report(!!del.error || del.data.length === 0, 'delete orders refused', del.error?.code ?? `${del.data?.length} rows deleted`);

const RPCS = [
  ['place_order', { p: { payment_method: 'cod', items: [] } }],
  ['mark_order_paid', { p_razorpay_order_id: 'x', p_payment_id: 'y' }],
  ['confirm_cod_order', { p_token: '00000000-0000-4000-8000-000000000000' }],
  ['release_expired_orders', {}],
  ['release_order_stock', { p_order_id: '00000000-0000-4000-8000-000000000000' }],
  ['rate_limit_hit', { p_bucket: 'x', p_window_seconds: 60, p_max_hits: 1 }],
];
for (const [fn, args] of RPCS) {
  const res = await anon.rpc(fn, args);
  report(!!res.error, `function ${fn} refused`, res.error?.code ?? 'CALLABLE');
}

const cats = await anon.from('categories').select('slug');
report(!cats.error && cats.data.length > 0, 'categories are public (intended)');

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll access checks passed.');
process.exit(failed ? 1 : 0);
