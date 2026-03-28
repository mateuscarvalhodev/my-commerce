# CLAUDE.md

## Project Overview

E-commerce monolith built with Next.js 15 (App Router), Supabase (Auth + PostgreSQL), and Pagar.me for payments. Written in TypeScript with Tailwind CSS and shadcn/ui components.

## Common Commands

- **Dev server:** `pnpm dev` (Next.js on port 3000)
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`

## Architecture

### Monolith with Next.js App Router

All backend logic lives in Server Actions (`src/actions/`) and API Routes (`src/app/api/`).

- `src/actions/` — Server Actions for all CRUD operations
- `src/app/api/webhooks/pagarme/` — Pagar.me webhook (public, no auth)
- `src/app/api/shipping/calculate/` — Shipping calculation endpoint
- `src/lib/supabase/` — Supabase client helpers (client, server, admin, middleware)
- `src/lib/woovi.ts` — Woovi (OpenPix) API v1 client
- `src/lib/shipping.ts` — Correios shipping calculator with fallback

### Authentication

Supabase Auth with email/password. Middleware (`src/middleware.ts`) refreshes sessions and protects `/account/*` and `/admin/*` routes.

A database trigger syncs `auth.users` → `public.profiles` on signup.

### Database

Supabase PostgreSQL with Row Level Security (RLS). Schema in `supabase/migrations/00001_schema.sql`.

Key tables: profiles, products, categories, product_variants, product_images, carts, cart_items, orders, order_items, payments, addresses, reviews, wishlist, coupons, returns, store_config.

### Payments

Woovi (OpenPix) v1 integration for PIX payments. Creates charges with QR Code + copia-e-cola. Webhook at `/api/webhooks/woovi` with HMAC-SHA256 signature verification.

### Shipping

Correios API integration (SEDEX/PAC) with local fallback. Free shipping above configurable threshold.

## Environment Variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WOOVI_APP_ID`.

## Language

User-facing strings are in Portuguese (pt-BR).
