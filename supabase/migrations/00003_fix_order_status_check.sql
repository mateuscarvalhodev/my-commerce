-- Expand orders.status check constraint to match all statuses used by the app
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','confirmed','processing','paid','shipped','delivered','cancelled','refunded'));
