-- ============================================================
-- E-Commerce Schema for Supabase
-- ============================================================

-- 1. PROFILES (synced with auth.users)
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text,
  name       text,
  image_url  text,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ADDRESSES
create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  street        text not null,
  number        text not null,
  complement    text,
  neighborhood  text not null,
  city          text not null,
  state         varchar(2) not null,
  zip_code      text not null,
  country       text not null default 'BR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. CATEGORIES
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  parent_id   uuid references public.categories(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. PRODUCTS
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  description         text not null,
  price               decimal(12,2) not null,
  stock               int not null default 0,
  low_stock_threshold int not null default 5,
  is_active           boolean not null default true,
  image_url           text not null,
  weight              decimal(10,3),
  width               decimal(10,2),
  height              decimal(10,2),
  length              decimal(10,2),
  category_id         uuid not null references public.categories(id) on delete restrict,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 5. PRODUCT_IMAGES
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

-- 6. PRODUCT_VARIANTS
create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text not null,
  color       text not null,
  sku         text not null,
  price_delta decimal(10,2) not null default 0,
  stock       int not null,
  is_active   boolean not null default true
);

-- 7. CARTS
create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  total      decimal(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. CART_ITEMS
create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity   int not null,
  price      decimal(10,2) not null
);

-- 9. ORDERS
create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete restrict,
  total                 decimal(12,2) not null,
  shipping_cost         decimal(10,2) not null default 0,
  shipping_service      text,
  shipping_deadline_days int,
  status                text not null default 'pending'
                          check (status in ('pending','paid','shipped','delivered','cancelled')),
  payment_method        text,
  payment_id            uuid,
  gateway_order_id      text,
  shipping_address_id   uuid references public.addresses(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 10. ORDER_ITEMS
create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid,
  quantity   int not null,
  unit_price decimal(10,2) not null
);

-- 11. PAYMENTS
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  status            text not null default 'pending',
  method            text not null check (method in ('credit_card','pix','boleto')),
  amount_cents      int not null,
  gateway_id        text,
  gateway_status    text,
  pix_qr_code       text,
  pix_qr_code_url   text,
  pix_expires_at    timestamptz,
  boleto_url        text,
  boleto_barcode    text,
  boleto_due_date   date,
  card_last_digits  text,
  card_brand        text,
  installments      int,
  error_message     text,
  gateway_response  jsonb,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 12. RETURNS
create table public.returns (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  status      text not null default 'requested',
  admin_notes text,
  items       jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 13. COUPONS
create table public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  type            text not null check (type in ('percent','fixed')),
  value           decimal(10,2) not null,
  min_order_value decimal(10,2),
  max_uses        int,
  uses_count      int not null default 0,
  is_active       boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 14. REVIEWS
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rating      int not null check (rating >= 1 and rating <= 5),
  title       text,
  comment     text,
  image_urls  text[],
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 15. WISHLIST
create table public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- 16. STORE_CONFIG
create table public.store_config (
  id               uuid primary key default gen_random_uuid(),
  store_name       text not null,
  cnpj             text,
  legal_name       text,
  email            text,
  phone            text,
  address          jsonb,
  payment_methods  jsonb not null default '["pix","credit_card","boleto"]'::jsonb,
  shipping_policy  jsonb,
  return_policy    text,
  primary_color    text,
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- addresses
create index idx_addresses_user_id on public.addresses(user_id);

-- categories
create index idx_categories_parent_id on public.categories(parent_id);

-- products
create index idx_products_slug on public.products(slug);
create index idx_products_category_id on public.products(category_id);
create index idx_products_is_active on public.products(is_active);

-- product_images
create index idx_product_images_product_id on public.product_images(product_id);

-- product_variants
create index idx_product_variants_product_id on public.product_variants(product_id);
create index idx_product_variants_sku on public.product_variants(sku);

-- carts
create index idx_carts_user_id on public.carts(user_id);

-- cart_items
create index idx_cart_items_cart_id on public.cart_items(cart_id);
create index idx_cart_items_product_id on public.cart_items(product_id);

-- orders
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_shipping_address_id on public.orders(shipping_address_id);

-- order_items
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_items_product_id on public.order_items(product_id);

-- payments
create index idx_payments_order_id on public.payments(order_id);
create index idx_payments_status on public.payments(status);

-- returns
create index idx_returns_order_id on public.returns(order_id);
create index idx_returns_user_id on public.returns(user_id);
create index idx_returns_status on public.returns(status);

-- coupons
create index idx_coupons_code on public.coupons(code);
create index idx_coupons_is_active on public.coupons(is_active);

-- reviews
create index idx_reviews_product_id on public.reviews(product_id);
create index idx_reviews_user_id on public.reviews(user_id);

-- wishlist
create index idx_wishlist_user_id on public.wishlist(user_id);
create index idx_wishlist_product_id on public.wishlist(product_id);


-- ============================================================
-- TRIGGER: auto-create profile on auth.users insert
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, image_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'image_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- HELPER: check if user is admin
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles        enable row level security;
alter table public.addresses       enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_images  enable row level security;
alter table public.product_variants enable row level security;
alter table public.carts           enable row level security;
alter table public.cart_items      enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.payments        enable row level security;
alter table public.returns         enable row level security;
alter table public.coupons         enable row level security;
alter table public.reviews         enable row level security;
alter table public.wishlist        enable row level security;
alter table public.store_config    enable row level security;

-- -------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -------------------------------------------------------
-- ADDRESSES
-- -------------------------------------------------------
create policy "Users can select own addresses"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------
-- CATEGORIES (public read, admin write)
-- -------------------------------------------------------
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Admins can insert categories"
  on public.categories for insert
  with check (public.is_admin());

create policy "Admins can update categories"
  on public.categories for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete categories"
  on public.categories for delete
  using (public.is_admin());

-- -------------------------------------------------------
-- PRODUCTS (public read, admin write)
-- -------------------------------------------------------
create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- -------------------------------------------------------
-- PRODUCT_IMAGES (public read, admin write)
-- -------------------------------------------------------
create policy "Anyone can view product images"
  on public.product_images for select
  using (true);

create policy "Admins can insert product images"
  on public.product_images for insert
  with check (public.is_admin());

create policy "Admins can update product images"
  on public.product_images for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product images"
  on public.product_images for delete
  using (public.is_admin());

-- -------------------------------------------------------
-- PRODUCT_VARIANTS (public read, admin write)
-- -------------------------------------------------------
create policy "Anyone can view product variants"
  on public.product_variants for select
  using (true);

create policy "Admins can insert product variants"
  on public.product_variants for insert
  with check (public.is_admin());

create policy "Admins can update product variants"
  on public.product_variants for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product variants"
  on public.product_variants for delete
  using (public.is_admin());

-- -------------------------------------------------------
-- CARTS
-- -------------------------------------------------------
create policy "Users can select own cart"
  on public.carts for select
  using (auth.uid() = user_id);

create policy "Users can insert own cart"
  on public.carts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on public.carts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own cart"
  on public.carts for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------
-- CART_ITEMS
-- -------------------------------------------------------
create policy "Users can select own cart items"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Users can insert own cart items"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Users can update own cart items"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

create policy "Users can delete own cart items"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- ORDERS
-- -------------------------------------------------------
create policy "Users can select own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Admins can select all orders"
  on public.orders for select
  using (public.is_admin());

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can update all orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------
-- ORDER_ITEMS
-- -------------------------------------------------------
create policy "Users can select own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins can select all order items"
  on public.order_items for select
  using (public.is_admin());

create policy "Users can insert own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins can update all order items"
  on public.order_items for update
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------
-- PAYMENTS
-- -------------------------------------------------------
create policy "Users can select payments on own orders"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Users can insert payments on own orders"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins can select all payments"
  on public.payments for select
  using (public.is_admin());

create policy "Admins can update all payments"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------
-- RETURNS
-- -------------------------------------------------------
create policy "Users can select own returns"
  on public.returns for select
  using (auth.uid() = user_id);

create policy "Users can insert own returns"
  on public.returns for insert
  with check (auth.uid() = user_id);

create policy "Admins can select all returns"
  on public.returns for select
  using (public.is_admin());

create policy "Admins can update all returns"
  on public.returns for update
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------
-- COUPONS
-- -------------------------------------------------------
create policy "Anyone can select active coupons"
  on public.coupons for select
  using (is_active = true);

create policy "Admins can select all coupons"
  on public.coupons for select
  using (public.is_admin());

create policy "Admins can insert coupons"
  on public.coupons for insert
  with check (public.is_admin());

create policy "Admins can update coupons"
  on public.coupons for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete coupons"
  on public.coupons for delete
  using (public.is_admin());

-- -------------------------------------------------------
-- REVIEWS
-- -------------------------------------------------------
create policy "Anyone can view approved reviews"
  on public.reviews for select
  using (is_approved = true);

create policy "Admins can view all reviews"
  on public.reviews for select
  using (public.is_admin());

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Admins can update reviews"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------
-- WISHLIST
-- -------------------------------------------------------
create policy "Users can select own wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert own wishlist"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own wishlist"
  on public.wishlist for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------
-- STORE_CONFIG
-- -------------------------------------------------------
create policy "Anyone can view store config"
  on public.store_config for select
  using (true);

create policy "Admins can update store config"
  on public.store_config for update
  using (public.is_admin())
  with check (public.is_admin());
