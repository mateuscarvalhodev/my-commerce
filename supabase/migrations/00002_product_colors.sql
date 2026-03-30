-- ============================================================
-- Product Colors: per-color images & variants
-- ============================================================

-- 1. NEW TABLE: product_colors
create table public.product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name       text not null,
  hex        text not null default '#000000',
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_product_colors_product_id on public.product_colors(product_id);

-- 2. MODIFY product_images: add product_color_id, drop product_id
alter table public.product_images
  add column product_color_id uuid references public.product_colors(id) on delete cascade;

-- Migrate existing images: we cannot auto-assign colors, so leave product_color_id null for now
-- Admin will need to re-assign images to colors manually

alter table public.product_images
  alter column product_id drop not null;

create index idx_product_images_product_color_id on public.product_images(product_color_id);

-- 3. MODIFY product_variants: add product_color_id, make product_id nullable
alter table public.product_variants
  add column product_color_id uuid references public.product_colors(id) on delete cascade;

alter table public.product_variants
  alter column product_id drop not null;

create index idx_product_variants_product_color_id on public.product_variants(product_color_id);

-- 4. RLS for product_colors (public read, admin write)
alter table public.product_colors enable row level security;

create policy "Anyone can view product colors"
  on public.product_colors for select
  using (true);

create policy "Admins can insert product colors"
  on public.product_colors for insert
  with check (public.is_admin());

create policy "Admins can update product colors"
  on public.product_colors for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product colors"
  on public.product_colors for delete
  using (public.is_admin());
