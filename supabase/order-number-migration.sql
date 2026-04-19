-- Add sequential order numbers for existing Pepperr databases (run once in Supabase SQL Editor).
-- New installs: use updated schema.sql instead (includes order_number from the start).

create sequence if not exists public.order_number_seq start with 1000 increment by 1 minvalue 1000;

alter table public.orders add column if not exists order_number int;

with ranked as (
  select id, row_number() over (order by created_at asc) as rn
  from public.orders
  where order_number is null
)
update public.orders o
set order_number = 999 + ranked.rn
from ranked
where o.id = ranked.id;

select setval(
  'public.order_number_seq',
  (select coalesce(max(order_number), 999) from public.orders)
);

alter table public.orders alter column order_number set default nextval('public.order_number_seq');
alter table public.orders alter column order_number set not null;

create unique index if not exists orders_order_number_uidx on public.orders (order_number);

alter sequence public.order_number_seq owned by public.orders.order_number;
