# Prole Adventures V2 — Master Specification

> **Status:** Planning baseline. This document defines the intended V2 product and operating model. It is not, by itself, approval to start implementation.
>
> **Purpose:** Give future work one authoritative description of what V2 must do, how its parts connect, what is excluded, and what must be decided before code is written.
>
> **Rule:** V2 is a clean rebuild of the working Prole Adventures operation. It retains critical capabilities, removes duplication and dead ends, and uses the least code and fewest moving parts that can reliably deliver required outcomes.

---

## 1. Product definition

### 1.1 Editorial proposition

Prole Adventures investigates a practical question:

> **Could an ordinary single person realistically make a life in this place on the minimum support the system says they can survive on?**

It is not a generic travel blog, relocation service, property site, lifestyle brand, or ordinary merch store. It is a connected editorial, audit, mission-funding, supporter, and commerce operation.

### 1.2 Brand principles

- Preserve the red pedestrian crossing-man mark as a key brand asset.
- Preserve the working-class voice, humour, field-report texture, curiosity, and occasional Prole terminology.
- Keep the dark editorial atmosphere while ensuring practical information, forms, tables, and reading layouts are legible and accessible.
- Let genuine photography, video, places, audit data, and reporting provide visual interest rather than decorative complexity.
- Do not turn V2 into a generic media, relocation, property, travel, or ecommerce site.

### 1.3 V2 success definition

V2 succeeds when a visitor can discover reporting, understand a place through its audit, watch the connected video, support the relevant mission, purchase products, receive fulfilment updates, unlock supporter content when entitled, manage an account, and receive useful email communications—without duplicate routes, duplicated data, insecure shortcuts, or disconnected workflows.

---

## 2. Governing principles

### 2.1 Critical systems retained in V2

The following are first-class V2 systems, not optional bolt-ons:

1. Publishing: stories, categories, tags, images, video links, RSS, metadata, and subscriber notifications.
2. Audits and the League: place analysis, scoring, comparisons, and connected reporting.
3. Mission Control: map, mission status, mission funding, rewards, and safe location handling.
4. Mission contributions: Stripe payment, verified finalisation, totals, rewards, and audit trail.
5. Prole Foods: one-off mission food support, contributor request capture, safe one-claim handling, and payment records.
6. Supporter-only dispatches: gated content and supporter access/entitlement delivery.
7. Shop: products, variants, Stripe checkout, orders, Printful fulfilment, shipment state, and customer communications.
8. Accounts: signup, login, reset, profile, and authenticated order visibility.
9. Administration: controlled publishing and operational management.
10. Newsletter and transactional communication: consent, Brevo contact management, publishing notices, orders, shipment updates, and rewards.
11. SEO, analytics, security, Cloudflare deployment, Supabase data/auth/storage, and controlled migration from V1.

### 2.2 Simplify implementation, not capability

- One canonical public URL per resource.
- One source of truth per business entity.
- One authoritative subscriber record and one documented Brevo synchronisation path.
- One payment finalisation path: verified Stripe webhook.
- One fulfilment update path: verified Printful webhook.
- One authorization model enforced by Supabase RLS and server-side checks.
- One metadata/schema system, route registry, redirect matrix, and publishing workflow.
- No browser-held secrets, browser-finalised payments, browser-only security, or client-trusted prices.

### 2.3 Content spine

```text
Audit / mission
  → League result
  → Mission Control map item
  → video episode
  → story / dispatch
  → mission contribution, reward, and Prole Foods support
  → related gear or shop products where genuinely relevant
```

An audit has one canonical identity. Its score, status, place information, story/video links, funding state, and supporter actions must not be manually copied into independent systems.

---

## 3. Route and page inventory

| Route | Purpose | Indexing |
|---|---|---|
| `/` | Home: editorial proposition, current reporting, current mission, primary discovery. | Index |
| `/league` | Primary ranked comparison of completed audits. | Index |
| `/prole-control` | Mission map, status, contribution, reward, and Prole Foods hub. | Index |
| `/stories` | Published story index with approved category/tag discovery. | Index |
| `/stories/:slug` | Canonical story/dispatch with audit/video/supporter context. | Index when published/public |
| `/watch` | Video archive/channel gateway linked to audits/stories. | Index |
| `/gear` | Editorial gear recommendations and compliant affiliate links. | Index |
| `/shop` | Physical product catalogue and checkout entry. | Index |
| `/shop/success` | Post-checkout return; never payment source of truth. | Noindex |
| `/shop/cancel` | Checkout cancellation recovery. | Noindex |
| `/about` | Editorial identity, approach, and methodology. | Index |
| `/contact` | Contact/submission route. | Index |
| `/privacy-policy` | Privacy/data-use disclosure. | Index |
| `/terms` | Terms of use/sale/supporter conditions. | Index |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Authentication lifecycle. | Noindex |
| `/account`, `/account/orders`, `/account/orders/:orderId` | Customer profile and owned order data. | Noindex |
| `/admin` | Publishing and operational management. | Noindex, authorized only |

### 3.1 Migration-only routes

| Legacy route | V2 behaviour |
|---|---|
| `/map` | Permanent redirect to `/prole-control` |
| `/read/:slug` | Permanent redirect to `/stories/:slug` |
| `/community` | Removed; genuine not-found unless a relevant replacement is separately approved |
| `/drops` | Removed; genuine not-found unless a relevant replacement is separately approved |

### 3.2 Non-goals

V2 does not include community/forum functionality, the legacy Drops/Cache system, duplicate map/story routes, disconnected prototypes, competing subscriber tables/email flows, client-side-only authorization, or client-trusted financial/product state.

---

## 4. Page specifications

### 4.1 Global shell

Every page needs a consistent brand header/navigation, skip link, semantic main landmark, responsive footer, error/not-found states, controlled cookie/analytics behaviour, one metadata system, and one clear primary action. Navigation must come from a single route registry so route changes cannot drift across header/footer/page links.

### 4.2 Home — `/`

**Role:** Explain the proposition and route visitors into reporting, League, Mission Control, video, shop, and newsletter.

**Required modules:** editorial proposition; primary paths to League and Mission Control; current/featured mission; latest stories; selected completed audit; newsletter; restrained gear/shop support module.

**Data:** Published story previews, featured audit/mission configuration, optional featured products/gear.

**SEO:** Unique metadata, canonical URL, social image, `Organization` and `WebSite` schema.

### 4.3 League — `/league`

**Role:** Primary comparison tool for completed place audits.

**Required modules:** methodology; sortable/filterable completed-audit list; usable mobile alternative to wide tables; score, verdict, practical metrics, date; story/video links; Mission Control link.

**Data:** Completed public-safe audit records only.

**SEO:** Indexable, explanatory content, accessible data rather than a thin JavaScript-only table.

### 4.4 Mission Control — `/prole-control`

**Role:** Mission/audit map, mission state, funding, rewards, and Prole Foods hub.

**Required modules:** map plus accessible list/table alternative; mission status; safe/redacted location display; story/video links for completed work; contribution action; reward information; Prole Foods availability/action; funding progress derived from verified payments.

**Data:** Canonical audit/mission records and a public display model that applies mission-status privacy rules.

**SEO:** Indexable mission hub; no duplicate `/map` page.

### 4.5 Stories — `/stories`

**Role:** Public reporting archive with approved category/tag discovery.

**Required modules:** published story listing, featured/latest story, category navigation, controlled tag discovery, accessible search/filtering, newsletter.

**Taxonomy:** Categories are curated editorial pillars and may be indexable. Tags are secondary discovery and are `noindex` unless a specific tag meets a defined content/value threshold.

**Decision:** Before build, select one category URL convention only: query-based (`/stories?category=id`) or route-based (`/stories/category/id`). Do not support both.

### 4.6 Story — `/stories/:slug`

**Role:** Canonical public dispatch, connected to audit, video, related content, and supporter entitlement where relevant.

**Required modules:** title/date/cover/category/read time; story body; linked audit dossier; Mission Control link; video facade/link; valuable public introduction; protected section when gated; related/adjacent stories; canonical sharing controls.

**SEO:** Canonical absolute URL; `Article`/`NewsArticle`; optional `VideoObject` only when visible and applicable.

**Gating rule:** Protected content must not be delivered to an unauthorized browser. Public summary/audit/video material remains independently useful.

### 4.7 Watch — `/watch`

**Role:** Video archive/channel gateway connected to audits and reports.

**Required modules:** series explanation, video list/selected episodes, links to relevant stories/audits, click-to-play video facade.

### 4.8 Gear — `/gear`

**Role:** Editorial gear recommendations with field-use context and affiliate disclosure.

**Link rule:** Affiliate/referral/sponsored links use `rel="sponsored noopener noreferrer"`. Do not emit false product/review/availability schema.

### 4.9 Shop — `/shop`

**Role:** Physical product catalogue backed by Stripe and Printful.

**Required modules:** active products and variants; images/descriptions/options/price; delivery and returns information; variant selection; checkout initiation; loading/failure state; account/order path.

**Security:** The server looks up active variant, currency, price, SKU, and fulfilment mapping. Browser payloads are identifiers only, not trusted commerce facts.

### 4.10 Checkout, account, legal, contact, and admin

- `/shop/success` and `/shop/cancel` are noindex return pages only. Neither creates financial or fulfilment state.
- Auth pages provide signup, confirmation, login, reset, and logout through Supabase Auth.
- Account pages expose profile and owned orders only.
- Contact uses server-side validation, abuse protection, acknowledgement, privacy disclosure, and one controlled delivery/storage path.
- Privacy and Terms cover analytics, cookies, account data, newsletter consent, orders, payment processors, data retention, returns, contributions, affiliate disclosure, and supporter conditions.
- Admin manages audits, stories, publishing, access configuration, product availability, notifications, and operational exceptions. UI guards are UX only; authorization is enforced by RLS/server checks.

---

## 5. Canonical data model

### 5.1 Data ownership rule

Every business concept has one authoritative record. Public views/read models may exist for safety and performance but cannot become competing editable data sources.

### 5.2 Domains

| Domain | Required concepts |
|---|---|
| Audit/mission | Stable ID, place/display name, status, coordinates/privacy, audit date/episode, scores, verdict/metrics, story/video relation, funding target/verified total, rewards, Prole Foods state, timestamps. |
| Story | Stable ID, immutable unique slug, title, excerpt, structured/Markdown body, image, category/tags, publication lifecycle, optional audit relation, gating configuration, timestamps. |
| Taxonomy | Curated categories with metadata; controlled tags with clear indexing policy. |
| Product/variant | Product ID/slug/name/description/images/active/Printful mapping; variant SKU/options/price in minor units/currency/active/Printful mapping. |
| Commerce | Order, immutable order item snapshot, payment, fulfilment, shipping event, webhook event, email event. |
| Mission support | Contribution, mission reward/entitlement, Prole Foods claim. |
| Identity | Profile, formal user role, content entitlement or access-code redemption. |
| Subscriber | Email, consent/source, subscribe/unsubscribe timestamps, Brevo sync state if needed. |

### 5.3 Financial and audit records

- Store all money in minor units, never floating point.
- Preserve purchase-time product/variant name, SKU, price, quantity, currency, and tax/shipping detail as required.
- Store Stripe, Printful, and provider event identifiers with unique constraints.
- A mission can have only one active/confirmed Prole Foods claim, enforced by database constraints/transactional logic.
- Replace email-address-only admin access with formal role data/claims and policy enforcement.
- Decide one subscriber source of truth: Supabase with Brevo sync, or Brevo with dependable synchronization back. Do not maintain ambiguous competing `subscribers`/`email_signups` concepts.

---

## 6. Required workflows

### 6.1 Reader discovery

```text
Home → League/story/video/Mission Control → linked audit context → newsletter, support, gear, shop, or further reporting
```

Reading must not require an account. Published stories must be reachable through the archive, sitemap/RSS, and relevant linked audit/video surfaces.

### 6.2 Mission contribution

```text
Mission Control → choose mission/contribution/reward → server validation → Stripe Checkout
→ verified Stripe webhook → contribution recorded idempotently → mission total updated atomically
→ entitlement/reward where applicable → email/logging → safe confirmation state
```

Payment success comes from the verified webhook only. Retry must never double-increase mission totals.

### 6.3 Prole Foods

```text
Eligible mission slot → tier choice → Stripe Checkout custom fields → verified webhook
→ atomic claim attempt → record contributor request → confirmation/operational notification
```

Concurrent checkouts must resolve safely. The spec must define refund/manual handling when a later payment reaches an already-claimed slot.

### 6.4 Shop and fulfilment

```text
Shop → choose variant → trusted server lookup → Stripe Checkout → verified webhook
→ order/payment/items → idempotent Printful request → confirmation email → Printful webhook
→ fulfilment/shipping history → shipping/delivery email → account order detail
```

### 6.5 Newsletter

```text
Form → validate/rate-limit → subscriber consent upsert → Brevo sync → welcome automation → analytics event
```

Duplicate subscription responses must be friendly and non-leaky. Consent copy and privacy link appear at collection.

### 6.6 Gated dispatch access

```text
Support action creates entitlement/code → visitor opens canonical story → server verifies entitlement
→ protected section delivered only after authorization
```

Choose one explicit model before build: code-only, account-only, or redeemable hybrid. Define redemption, expiry, revocation, support recovery, and audit logging.

### 6.7 Account and admin

Accounts provide confirmation, profile, orders, reset, and logout. Admins create/edit/publish audits/stories, attach story/video/audit data, manage products and operational exceptions, and trigger subscriber notices. Publishing states are explicit: draft, published, archived/unpublished, plus scheduled only if actually required.

---

## 7. Security architecture

### 7.1 Trust boundaries

**Browser may:** read explicitly public data, read/write owner-scoped data allowed by RLS, submit validated forms, and initiate payments with minimal identifiers.

**Browser may not:** hold service-role, Stripe secret, Printful, Brevo, SMTP, or webhook secrets; finalize payment/fulfilment/entitlement/Prole Foods state; write admin records; or provide trusted prices, stock, rewards, SKUs, and contribution state.

**Cloudflare server runtime owns:** checkout creation, webhook verification, provider calls, service-role operations, input validation, rate limits, idempotency, retries, and operational logging.

**Supabase owns:** Postgres persistence, Auth identity, Storage, RLS, policy-aware data access, and reviewed migrations/generated types.

### 7.2 RLS access matrix

| Data | Anonymous | Customer | Admin | Service role |
|---|---:|---:|---:|---:|
| Published public stories | Read | Read | Manage | Manage |
| Draft/unpublished stories | No | No | Manage | Manage |
| Public audit display data | Read, sanitized | Read, sanitized | Manage | Manage |
| Sensitive/raw mission data | No | No unless explicitly required | Manage | Manage |
| Profiles | No | Own only | Controlled access | Manage |
| Orders/payments | No | Own only | Controlled access | Manage |
| Contributions | Public aggregates only | Own record if supported | Controlled access | Manage |
| Subscribers | No listing/read | No listing/read | Controlled access | Manage |
| Webhook/email/shipping logs | No | No except approved customer summary | Controlled access | Manage |

### 7.3 Mandatory safeguards

- Shared validation schemas for every server input.
- Environment validation on deploy/runtime start.
- Allowed-origin/host configuration; never form Stripe redirect URLs from arbitrary request `Origin` values.
- Narrow CORS, not blanket wildcard access where unnecessary.
- Stripe and Printful signatures verified before data changes.
- Provider event IDs persisted with database uniqueness/idempotency controls.
- Atomic database operations for mission totals and Prole Foods claims.
- Cloudflare rate limiting for public forms and checkout initiation.
- Turnstile or equivalent only where abuse risk warrants it; document placement and reason.
- No sensitive secrets, payment data, access tokens, or unnecessary personal data in logs.
- Defined retention/deletion process for contacts, subscribers, customers, orders, and operational logs.
- Formal role model; no permanent hard-coded email authorization.

### 7.4 Header/CSP policy

Maintain deliberate Cloudflare headers: HSTS, no-sniff, anti-framing, restrictive referrer and permissions policies, CSP limited to actually used domains, and immutable caching for versioned/static assets. Review CSP whenever providers change.

### 7.5 Supporter-content protection

Protected story content is never delivered before authorization. Access codes should be stored/verified securely, with defined expiry, redemption, revocation, and recovery policy. Log entitlement delivery safely without logging raw reusable codes.

---

## 8. SEO and linking architecture

### 8.1 Canonical policy

```text
/                     Home
/league               League
/prole-control        Mission Control
/stories              Story archive
/stories/:slug        Story
/watch                Video hub
/gear                 Gear
/shop                 Shop
```

One indexable URL renders each resource. Historic aliases permanently redirect at the edge and never render a second version of the same page.

### 8.2 Indexing policy

**Index:** Home, League, Mission Control, Stories, approved category pages, published public stories, Watch, Gear, Shop, About, Contact, Privacy, Terms.

**Noindex:** auth, accounts, orders, admin, checkout returns, previews/drafts, uncontrolled filter combinations, thin tag pages, and gated-only pages that lack independently useful public content.

### 8.3 Metadata and schema

Every indexable page requires a unique title, description, canonical URL, Open Graph fields, Twitter fields, robots directive, absolute stable URL, and fallback social image.

| Surface | Schema |
|---|---|
| Home | `Organization`, `WebSite` |
| Story | `Article` or `NewsArticle`; `VideoObject` only when visible/applicable |
| Approved product detail page | `Product` with accurate offer/shipping/returns data |
| Breadcrumb route | `BreadcrumbList` |
| Visible genuine FAQ | `FAQPage` |

Never create false reviews, ratings, availability, shipping promises, or schema content not visible on the page.

### 8.4 Sitemap, RSS, robots, and redirects

- Generate sitemap from indexable routes and published records; do not hand-maintain a drifting route list.
- Include canonical public stories and approved categories.
- Exclude private, duplicate, preview, draft, checkout, admin, and account routes.
- RSS uses canonical `/stories/:slug` links only.
- `robots.txt` points to the canonical sitemap and restricts admin/API paths appropriately.
- Redirect rules are version-controlled and tested.

### 8.5 Internal-linking matrix

| Source | Required destination links |
|---|---|
| Home | Latest stories, League, current mission, newsletter, selected shop/gear support |
| League | Story, video, Mission Control |
| Mission Control | Story, video, League, contribution and Prole Foods actions |
| Story | Archive, linked audit/map pin, video, related stories, relevant support action |
| Watch | Related story/audit |
| Gear | Genuine editorial context and compliant outbound links |
| Shop | Account/order support, terms/privacy/returns information |
| Account | Orders, shop, Mission Control where relevant |

No published page may be orphaned. Publishing a story updates archive discovery, sitemap/RSS eligibility, metadata, and linked audit/video context.

---

## 9. Integration registry

| Integration | Responsibility | Non-negotiable rule |
|---|---|---|
| Cloudflare | Hosting, edge redirects, Functions/Workers, WAF/rate limiting | Primary public runtime/edge boundary unless replacement is evidenced and approved |
| Supabase | Postgres, Auth, Storage, RLS | Primary application system of record |
| Stripe | Checkout and payments | Webhook is the only payment finalisation authority |
| Printful | Physical fulfilment and shipping events | Trusted provider/server events control fulfilment state |
| Brevo | Newsletter and transactional email | One template registry and subscriber lifecycle |
| YouTube | Video hosting | IDs/URLs connect to canonical audits/stories |
| Umami | Analytics | Never block rendering or transactions; never receive sensitive data |
| Mapping provider | Mission/audit visualization | Expose only precision permitted by mission policy |
| Supabase Storage | Images/media | Document bucket policy, uploads, asset URLs, transformations, and retention |

For every provider, create an operational configuration record containing: owner, secrets location, sandbox setup, production endpoint/webhook, expected events, retry policy, failure alerts, rotation procedure, and deployment verification steps.

---

## 10. Email and analytics

### 10.1 Email registry

| Event | Provider/path | Required contents |
|---|---|---|
| Account confirmation | Supabase Auth | Branded confirmation URL and support detail |
| Password reset | Supabase Auth | Secure reset URL and expiry/security language |
| Newsletter welcome | Brevo | Welcome and subscription expectations |
| Story publication | Brevo | Title, excerpt, canonical URL, access information if entitled |
| Shop order confirmation | Brevo | Order reference, item snapshot, totals, support path |
| Shipment update | Brevo | Carrier/tracking/status where available |
| Delivery confirmation | Brevo | Delivery status/support path |
| Mission reward | Brevo | Reward, mission, entitlement/redeem instructions |
| Prole Foods confirmation | Brevo/internal workflow | Claim detail and next expectation |
| Provider workflow failure | Internal/admin channel | Record/provider ID and safe diagnostic detail |

Template IDs/configuration must be environment/configuration data, not scattered magic numbers in code.

### 10.2 Analytics event catalogue

```text
story_view
story_category_view
league_view
mission_view
mission_contribution_started
mission_contribution_confirmed
prole_foods_started
prole_foods_confirmed
product_view
variant_selected
checkout_started
purchase_confirmed
newsletter_signup
account_created
login
order_viewed
outbound_affiliate_click
outbound_video_click
```

Analytics is non-blocking. Do not send personal, payment, access-code, or sensitive account data. Server-confirmed events may supplement client events where blockers make client-only measurement unreliable.

---

## 11. Quality requirements

### 11.1 Accessibility

- Semantic landmarks and one logical H1 per page.
- Keyboard navigation for menus, filters, forms, modals, and map alternatives.
- Skip link, visible focus, sufficient contrast, labels/errors/status text, meaningful alt text, image dimensions, and reduced-motion support.
- Mission Control has an accessible non-map representation.

### 11.2 Performance

- Public editorial routes use server/static rendering where appropriate for SEO, social previews, and first render.
- Responsive image strategy with dimensions, modern formats, compression, and lazy loading below the fold.
- Click-to-play video facade.
- Map, Stripe, and other heavy third-party code load only on routes/actions that need them.
- Constrained font strategy and defined performance budgets.

### 11.3 Reliability and operations

- User-safe errors and retry states.
- Persistent webhook/email/fulfilment event logs.
- Retry/recovery workflow for provider failures.
- Queryable admin operational view for payment, fulfilment, email, and entitlement exceptions.

---

## 12. Testing and release acceptance

### 12.1 Unit tests

- Money/price calculations.
- Mission/Prole Foods state transitions.
- Canonical URL and redirect generation.
- Metadata/schema generation.
- Input validation.
- Access code/entitlement checks.
- Audit score/presentation transformations.

### 12.2 Integration tests

- RLS policies by domain.
- Trusted server checkout lookup.
- Stripe and Printful event idempotency.
- Atomic mission funding and Prole Foods claims.
- Customer ownership of orders.
- Subscriber duplicate/unsubscribe behaviour.
- Admin role enforcement.

### 12.3 End-to-end tests

1. Reader finds a story through Home/Stories.
2. League → story → Mission Control journey.
3. Linked video journey.
4. Newsletter subscription.
5. Signup, confirmation, login, reset, and logout.
6. Stripe test shop order → fulfilment update → account order view.
7. Stripe test mission contribution → verified webhook → funding/reward path.
8. Stripe test Prole Foods claim, including duplicate/concurrent behaviour.
9. Gated story entitlement/access.
10. Admin publishes audit/story and public surfaces update.

### 12.4 Pre-deploy gate

Typecheck, lint, tests, production build, migration validation, environment/secrets validation, redirect tests, route/link crawl, sitemap/robots/RSS/schema validation, provider sandbox checks, preview smoke test, header/CSP validation, and rollback verification all pass.

---

## 13. Migration, phases, and decisions

### 13.1 Migration and cutover

Before V2: capture production schema/policies/views/functions/storage/secrets; inventory data to migrate; inventory URLs/backlinks/RSS/social links; create redirect matrix; define migration checks and rollback; build with production-like staging data.

At cutover: preserve canonical URLs where possible; redirect aliases permanently; switch payment/Printful webhooks only after staging checks; verify Supabase Auth site URL/redirects/templates; retain rollback-capable V1 until an agreed stability window; monitor payment, webhook, fulfilment, email, SEO, and auth errors.

### 13.2 Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 — Decisions/evidence | Approve this spec, resolve key decisions, capture V1 inventory, prototype Home/League/story/Mission Control. | Page map, domain model, design direction, and decision register approved. |
| 1 — Foundation | Repo/runtime, migrations/types, schemas, roles/RLS, error handling, tests, CI, observability, metadata. | Secure empty preview deploy passes. |
| 2 — Editorial spine | Home, Stories, Story, League, Watch, legal/contact, sitemap/RSS/robots, audit public read model. | Content is fast, crawlable, linked, and publishable. |
| 3 — Mission/support | Mission Control, contribution, reward, Prole Foods, gated access, Stripe webhook/email/logs. | Test-mode state transitions are idempotent and auditable. |
| 4 — Commerce/accounts | Shop, trusted checkout, orders, accounts, Printful/webhooks, shipment communications. | Test order reaches fulfilment and account history reliably. |
| 5 — Admin/migration/launch | Admin completion, data/assets migration, redirects, E2E/security/SEO review, rollback and launch. | Full acceptance gate passes and launch is explicitly approved. |

### 13.3 Decisions needing sign-off

| ID | Decision |
|---|---|
| D1 | Cloudflare-compatible rendering architecture for public SEO/performance. |
| D2 | One category URL convention: query-based or route-based. |
| D3 | Gated access model: code-only, account-only, or redeemable hybrid. |
| D4 | Subscriber/consent source of truth and Brevo sync direction. |
| D5 | Audit/mission schema: aggregate or related tables after representative modelling. |
| D6 | Contribution tiers, custom amounts, rewards, and entitlement rules. |
| D7 | Prole Foods late-payment/refund/manual-resolution policy. |
| D8 | Shop catalogue-only or individual product routes. |
| D9 | Contact storage/delivery and anti-spam workflow. |
| D10 | Required launch roles: owner/admin/editor/support. |
| D11 | Location precision/redaction rules by mission status. |
| D12 | Cookie/consent policy and relevant jurisdictional wording. |
| D13 | Retention policy for contacts, subscribers, orders, logs, and payment metadata. |

### 13.4 Ready-to-build definition

Implementation begins only after this document is approved, key decisions for the first phase are resolved, production inventory is captured, route/redirect matrix is approved, core domain model is agreed, security/RLS is reviewed, representative design prototype is validated, and staging/rollback expectations are agreed.

### 13.5 Change-control rule

Update this specification before implementation whenever a change affects a route/page, data model, payment/fulfilment/access workflow, integration, RLS rule, canonical URL, analytics event, email event, redirect, or test acceptance criterion.
