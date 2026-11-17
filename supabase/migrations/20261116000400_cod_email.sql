-- Cash on delivery: remember whether the confirmation email actually went out. If it could
-- not be sent, the order page lets the customer send it again or confirm there instead, so
-- an order never lapses just because an email failed.
alter table public.orders add column confirm_email_sent_at timestamptz;
