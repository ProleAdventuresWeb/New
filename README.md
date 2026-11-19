# Prole Adventures

Prole Adventures is a content, mission-funding, and small-commerce web application for publishing field reports, audit-led stories, gear recommendations, community drops, and mission intelligence.

## Stack

- **Frontend:** React 18, TypeScript, Vite, React Router DOM, React Helmet Async
- **Styling:** Tailwind CSS with the project's dark/glass visual system
- **Content:** React Markdown, JSON-LD, RSS generation
- **Mapping:** Leaflet and React Leaflet
- **Authentication and database:** Supabase Auth, Postgres, Storage, and Row Level Security
- **Payments:** Stripe Checkout and verified Stripe webhooks
- **Fulfilment:** Printful API and fulfilment webhooks
- **Email:** Brevo transactional and newsletter delivery
- **Analytics:** Umami client-side and server-side event tracking
- **Hosting/runtime:** Cloudflare Pages with Pages Functions

## Repository layout

```text
web-main/
|- src/                    # React application
|  |- components/          # Shared UI, guards, SEO, checkout, and admin UI
|  |- lib/                 # Auth, Supabase, posts, analytics, and utilities
|  |- pages/               # Route-level React pages
|  |- services/            # Mission/adventure data services and fallbacks
|  |- types/               # Shared frontend domain types
|  `- App.tsx              # Route map and application shell
|- functions/              # Cloudflare Pages Functions
|  |- create-checkout-session.ts
|  |- webhook.ts           # Stripe webhook: verified and idempotent
|  |- printful-webhook.ts
|  |- subscribe.ts
|  `- notify-post.ts
|- supabase/               # SQL schema, seed, security, and Edge Function files
|- public/                 # Static assets, headers, robots, JSON data, RSS output
|- scripts/generate-rss.ts # Build-time RSS feed generation
`- .github/workflows/ci.yml
```

## Application architecture

### Client application

`src/main.tsx` mounts React with `StrictMode`, `HelmetProvider`, and a global error boundary. `src/App.tsx` owns the route map, shared navigation/footer, cookie consent, lazy-loaded pages, and auth guards.

Authentication is managed in `src/lib/auth.tsx` through a React context backed by Supabase Auth and the `profiles` table. Browser data access is primarily in `src/lib/supabase.ts` and `src/lib/posts.ts`; Supabase Row Level Security is the server-side authorization boundary.

### Backend functions

Cloudflare Pages Functions expose backend endpoints under `/api/*`:

- `POST /api/create-checkout-session` creates Stripe Checkout sessions for shop products, mission contributions, and Prole Foods support.
- `POST /api/webhook` validates Stripe signatures, records idempotency in `webhook_events`, records payments/contributions/orders, creates Printful orders, sends transactional messages, and updates analytics.
- `POST /api/printful-webhook` processes fulfilment and shipping updates.
- `POST /api/subscribe` records newsletter signups and triggers Brevo workflows.
- `POST /api/notify-post` sends a published-dispatch notification to subscribers after verifying the administrator's Supabase JWT.

Server-only credentials belong in Cloudflare environment secrets. Never expose service-role, Stripe secret, Printful, Brevo, or SMTP credentials to the browser.

### Supabase

The `supabase/` directory contains manually applied SQL scripts for application tables, RLS policies, commerce, posts/gating, drops, security hardening, and the audit/League data model. These scripts are not managed by an automated migration runner. Apply them deliberately in Supabase SQL Editor and record deployment order as the schema log evolves.

## Route map

### Public routes

| Route | Purpose |
|---|---|
| `/` | Home |
| `/watch` | Video/watch landing page |
| `/prole-control` | Mission Control map, mission funding, and Prole Foods |
| `/league` | Audit/League table |
| `/gear` | Gear and affiliate recommendations |
| `/stories` | Published story index |
| `/stories/:slug` | Individual story/dispatch |
| `/shop` | Shop catalog |
| `/shop/success`, `/shop/cancel` | Checkout outcomes |
| `/about`, `/contact`, `/privacy-policy`, `/terms` | Informational/legal pages |

### Authenticated routes

| Route | Purpose |
|---|---|
| `/login`, `/signup` | Authentication |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/account` | Account profile |
| `/account/orders` | Order history |
| `/account/orders/:orderId` | Order and fulfilment detail |

### Administrator route

| Route | Purpose |
|---|---|
| `/admin` | Post and audit administration; protected by `AdminGuard` |

The current administrator check is intentionally email-based. Do not treat client-side guards as the sole authorization layer; retain Supabase RLS and function-side checks.

## Local development

### Prerequisites

- Node.js 22 (the CI runtime)
- pnpm 11 (`packageManager` is pinned in `package.json`)
- Supabase project credentials for database/auth-dependent flows

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to an ignored local environment file and set only the values required for the flows being tested.

### Environment variables

Browser-exposed variables must use the `VITE_` prefix:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

Cloudflare server-side secrets include:

```dotenv
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PRINTFUL_API_KEY=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
UMAMI_WEBSITE_ID=
UMAMI_ENDPOINT=
ZOHO_SMTP_USER=
ZOHO_SMTP_PASS=
```

## Build, validation, and RSS

```bash
pnpm exec tsc --noEmit --incremental false
pnpm exec eslint .
pnpm build:local
pnpm build
```

### `pnpm build:local`

Runs TypeScript and Vite only. Use this for local builds when Supabase variables are unavailable:

```text
pnpm install --prefer-offline && tsc -b && vite build
```

### `pnpm build`

Runs TypeScript, then `scripts/generate-rss.ts`, then Vite:

```text
pnpm install --prefer-offline && tsc -b && pnpm run generate:rss && vite build
```

RSS generation queries published Supabase posts and writes `public/rss.xml`. It requires valid `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` (or their server-side fallback names). Set `RSS_SITE_URL` to produce canonical feed links; otherwise the script falls back to a placeholder domain.

Use `pnpm build:prod` for the production Vite mode that disables the source identifier plugin:

```bash
pnpm build:prod
```

## Deployment notes

1. Apply required SQL changes in Supabase SQL Editor before deploying code that writes or reads new columns.
2. Configure browser variables and server secrets in Cloudflare Pages separately.
3. Register Stripe and Printful webhooks against the deployed `/api/webhook` and `/api/printful-webhook` endpoints.
4. Confirm Stripe webhook signing, Printful event delivery, Brevo sender verification, and Supabase Auth redirect URLs in their respective dashboards.
5. Run typecheck and lint before push. GitHub Actions also runs lint, typecheck, a Vite build, and a non-blocking high-severity dependency audit.

## Security notes

- Do not commit `.env` files, secret keys, or service-role credentials.
- Stripe payment state is finalized by the verified webhook, not browser redirects.
- `webhook_events` provides provider-event idempotency for Stripe and Printful processing.
- Shop/account data protection relies on Supabase RLS; keep policies aligned with client queries and server-side service-role access.
- `public/_headers` contains Cloudflare response headers and the Content Security Policy. Treat CSP changes as deployment-sensitive.

## Ownership

This repository is proprietary to Prole Adventures. All rights reserved.