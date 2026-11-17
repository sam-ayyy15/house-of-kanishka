-- Server errors, recorded by instrumentation.ts so the founder can see in the admin area that
-- something went wrong without reading hosting logs. No customer details are stored: only
-- the page path, the error message and Next.js' short error code (digest).
create table public.error_log (
  id bigint generated always as identity primary key,
  path text not null,
  message text not null,
  digest text,
  kind text,                                   -- which part of the app (page, action, route…)
  created_at timestamptz not null default now()
);
create index error_log_created_idx on public.error_log (created_at desc);
alter table public.error_log enable row level security;  -- no policies: server (secret key) only
