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
- `src/lib/abacatepay.ts` — AbacatePay API v1 client
- `src/lib/shipping.ts` — Correios shipping calculator with fallback

### Authentication

Supabase Auth with email/password. Middleware (`src/middleware.ts`) refreshes sessions and protects `/account/*` and `/admin/*` routes.

A database trigger syncs `auth.users` → `public.profiles` on signup.

### Database

Supabase PostgreSQL with Row Level Security (RLS). Schema in `supabase/migrations/00001_schema.sql`.

Key tables: profiles, products, categories, product_variants, product_images, carts, cart_items, orders, order_items, payments, addresses, reviews, wishlist, coupons, returns, store_config.

### Payments

AbacatePay v1 integration supporting PIX QR Code (transparente) and billing links (página hospedada). Webhook at `/api/webhooks/abacatepay` with secret query param verification.

### Shipping

Correios API integration (SEDEX/PAC) with local fallback. Free shipping above configurable threshold.

## Environment Variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ABACATEPAY_API_KEY`.

## Language

User-facing strings are in Portuguese (pt-BR).
