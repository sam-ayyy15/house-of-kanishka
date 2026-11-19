-- The parcel's scan history from Delhivery (newest last), for the tracking page's journey map:
-- [{ "at": iso time, "status": "In Transit", "type": "UD", "location": "Udupi_Ambalpady_D (Karnataka)" }, …]
-- Place names only (Delhivery gives no coordinates); written by the tracking sync.
alter table public.orders add column carrier_scans jsonb;
