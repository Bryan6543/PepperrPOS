-- Idempotent replay for offline POS sync (run once in Supabase SQL Editor on existing projects).

alter table public.orders add column if not exists client_queue_id uuid;

create unique index if not exists orders_client_queue_id_uidx on public.orders (client_queue_id)
  where client_queue_id is not null;
