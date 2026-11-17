-- Fulfilment: what the founder records as an order is packed, handed to a courier and
-- delivered (entered by hand in the admin area for now; a courier integration can fill the
-- same columns later), plus refunds and a private note.
alter table public.orders
  add column courier text,
  add column tracking_number text,
  add column tracking_url text,
  add column packed_at timestamptz,
  add column shipped_at timestamptz,
  add column delivered_at timestamptz,
  add column refunded_at timestamptz,
  add column razorpay_refund_id text,
  add column admin_note text;

create index orders_status_idx on public.orders (status, placed_at desc);
