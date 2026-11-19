-- Delhivery: what our server learns about a parcel after the founder books it from the admin
-- area. The waybill itself goes in the existing tracking_number column (with courier =
-- 'Delhivery'), so the tracking page, the letters and the CSV export keep working unchanged.
alter table public.orders
  add column shipment_booked_at timestamptz,      -- when the Delhivery shipment was created
  add column shipment_attempt smallint not null default 0, -- bumped when a booking is cancelled, so a re-booking gets a fresh reference
  add column parcel_weight_g int check (parcel_weight_g between 1 and 50000),
  add column carrier_status text,                 -- Delhivery's latest status, e.g. "In Transit"
  add column carrier_status_type text,            -- its type code, e.g. "UD", "DL", "RT"
  add column carrier_location text,               -- where that status was recorded
  add column carrier_status_at timestamptz,
  add column carrier_expected_at timestamptz,     -- Delhivery's expected delivery date
  add column carrier_synced_at timestamptz;       -- last time we asked Delhivery

-- The tracking sync reads only the parcels still on the move.
create index orders_carrier_sync_idx on public.orders (status, carrier_synced_at)
  where courier = 'Delhivery' and tracking_number is not null and status in ('packed', 'shipped');
