# Prole Adventures V2 Rebuild Instructions

> **Status:** Future planning document — do not treat this as approval to begin a rewrite.
>
> **Purpose:** Preserve the intended direction for a clean future rebuild once enough published content and operating evidence exist to justify it.

## 1. The decision record

The current site is **not** to be rebuilt merely because it can look sparse while the catalogue is small. The current implementation has a proven content structure and working infrastructure. Continue publishing, learning from real audience behaviour, and make only incremental visual improvements in the present codebase.

A future V2 should be a deliberate clean implementation, not a reaction to temporary low-content presentation or a cosmetic impulse.

The core editorial proposition to preserve is:

> **Could an ordinary single person realistically make a life in this place on the minimum support the system says they can survive on?**

The League is the central recurring format: a lightly irreverent but genuinely useful comparison of real places using human-entered audits. It should connect video episodes, place pages, map pins, stories, and practical cost-of-living information.

## 2. Preserve these things

Do not discard working systems or the identity that makes the project distinctive.

### Brand and editorial identity

- Keep the red pedestrian crossing-man mark as a key brand asset.
- Keep the working-class voice, humour, curiosity, field-report texture, and occasional Prole terminology.
- Keep the dark editorial atmosphere, but ensure practical information and reading experiences remain welcoming and legible.
- Let real photography, episode thumbnails, places, maps, stories, and useful data supply warmth and visual variety.
- Do not turn the brand into a generic relocation, property, travel, or lifestyle site.

### Product and information architecture

- Place audits and the League remain the narrative/data spine.
- A single audit record should continue to feed the League, Prole Control/map, story context, video connection, and related place content.
- Preserve stable public identifiers and URLs where possible: audit IDs, story slugs, place labels, existing route aliases, and deep links.
- Keep the working relationship between stories, videos, audits, missions, gear/merch, shop, accounts, and admin.

### Infrastructure

- Keep **Cloudflare** as the deployment/edge/function platform unless there is a strong, evidenced reason to change it.
- Keep **Supabase** as the primary Postgres database, authentication system, storage layer, and RLS authorization boundary.
- Keep Stripe for payments and retain verified webhook-driven finalisation of payment state.
- Keep Printful/Brevo/Umami integrations where they remain commercially useful.
- Never move server-only secrets into browser code. Cloudflare secrets remain the location for service-role, Stripe, Printful, Brevo, SMTP, and similar credentials.

## 3. Do not start V2 until the evidence exists

Start a rebuild only when one or more of these conditions are true:

1. There are enough completed audits/episodes (rough guide: 10–20) to reveal the durable content patterns.
2. Analytics show which pages, routes, search terms, and content flows matter.
3. The current Vite/client-rendered architecture demonstrably limits SEO, initial loading, metadata, page composition, maintainability, or publishing workflow.
4. The existing front end has accumulated enough dead code, duplicate concepts, or one-off presentation logic that continued incremental work costs more than a clean migration.
5. A tested visual/content prototype proves a different composition system is materially better for the actual content.

Do **not** rebuild solely to make the site feel newer, brighter, or more fashionable.

## 4. Suggested target architecture

This is a recommended direction, not a mandatory technology decision. Re-evaluate current ecosystem maturity before implementation.

```text
Cloudflare
├── Pages or Workers deployment
├── Worker endpoints / server actions for checkout, webhooks and protected operations
├── edge caching and image optimisation
└── analytics

Hybrid React framework (evaluate Next.js or an equally mature Cloudflare-compatible alternative)
├── server-rendered / statically generated editorial and place pages
├── client-side interactive islands for the map, filters, account, admin and checkout
├── shared design system
└── reusable content blocks for stories and audits

Supabase
├── Postgres
├── Auth
├── Storage
├── Row Level Security
└── schema-generated TypeScript types

Stripe
└── checkout and verified webhooks
```

### Why use hybrid rendering in V2

The product is increasingly content-led and search-led. Public pages such as stories, place/audit pages, League views, explanatory pages, and video pages should have strong initial HTML, metadata, Open Graph output, structured data, caching, and fast first render.

Keep client-side interactivity where it genuinely belongs:

- Prole Control / Leaflet map;
- League search, sorting, and filtering;
- account and checkout flows;
- protected admin tools;
- calculators or other interactive utilities.

## 5. Required V2 engineering principles

### One canonical data layer

Do not scatter unvalidated database access throughout view components. Establish a canonical data-access layer for each domain:

```text
stories
places / audits / League
missions / map
commerce
account
admin
analytics
```

Use explicit query functions, domain types, and validation at system boundaries.

### Database-driven TypeScript types

Generate or maintain types directly from the Supabase schema. Avoid UI code assuming fields exist when a view/query does not return them. The V1 `display_lat` versus `lat` issue is an example of the kind of drift V2 should prevent.

### Structured content over one-off templates

Build a reusable editorial block system so stories can vary visually without becoming custom code each time. Candidate blocks include:

- hero image or video;
- opening statement / summary;
- place-audit scorecard;
- rent/housing block;
- basket/cost block;
- safety/access block;
- map/location callout;
- image gallery;
- video facade;
- quote or field-note block;
- related League entries;
- related stories or episodes;
- gear/merch/call-to-action block.

Keep structured factual data separate from prose wherever practical.

### Proper design tokens and reusable primitives

Define colour, typography, spacing, radius, borders, shadows, animation, and breakpoints centrally. A future visual refresh should modify tokens and components rather than require broad manual class changes.

Example token families:

```text
colour: signal red, ink, paper, road amber, civic blue, moss
space: page, section, card, compact
shape: card radius, pill radius, border weights
text: display, body, mono/data
```

### Visual composition goals

Retain the dark identity, but support more expressive editorial layouts:

- strong photography/video stills;
- varied image aspect ratios;
- asymmetric/bento grids where content supports them;
- full-width visual interruptions;
- mixed large/small content modules;
- selective warm-light or muted colour surfaces for readability and contrast;
- avoid repeating identical horizontal cards section after section.

Do not copy a generic agency template. The design must remain documentary, civic, practical, and recognisably Prole Adventures.

### Security and payments

- Preserve Supabase RLS as a server-side access boundary.
- Preserve function-side authorization checks.
- Payment/order state must remain finalized through verified Stripe webhooks, never browser redirects alone.
- Keep webhook idempotency.
- Rotate secrets separately from any broad UI rebuild; validate new credentials with a low-value live payment test before revoking old credentials.

## 6. Migration strategy

Do not attempt a big-bang replacement.

### Phase 0 — discovery and inventory

Before writing V2 application code:

1. Audit active routes, components, SQL schema, RLS policies, Workers, environment variables, webhooks, analytics events, third-party services, and static assets.
2. Identify live/public URLs and create a redirect/compatibility plan.
3. Identify dead code versus retained-but-unused capability.
4. Export/record current performance, search, analytics, and conversion baselines.
5. Create a content inventory: stories, audits, place names, images, thumbnails, video IDs, products, orders, accounts, and admin workflows.

### Phase 1 — content and design prototype

Prototype only representative surfaces first, using real data where possible:

1. Home page;
2. League page;
3. one audit/story/place page;
4. Prole Control map landing section.

Validate mobile, desktop, accessibility, reading flow, image handling, metadata, and the publishing experience before expanding scope.

### Phase 2 — shared foundation

Build the V2 design system, data layer, schema-generated types, error handling, metadata/SEO layer, image approach, authentication boundary, and test conventions.

### Phase 3 — migrate public content routes

Move low-risk, public, SEO-important routes first while retaining URL compatibility. Verify rendering, metadata, structured data, canonical URLs, RSS, internal links, and redirects.

### Phase 4 — migrate interactive and protected systems

Migrate the map, League interactions, account pages, admin tools, checkout initiation, Workers, and webhook integrations. Test each workflow against production-equivalent configuration.

### Phase 5 — cutover and cleanup

1. Run a complete route/link/SEO/checkout/auth/admin test pass.
2. Compare metrics and errors against V1 baselines.
3. Keep V1 available long enough for rollback.
4. Retire old code only once V2 has proven stable.

## 7. Future implementation checklist

Before calling V2 complete, verify:

- [ ] Public content has server/static rendering where appropriate.
- [ ] League, map, story, and video links all resolve from the same audit/place records.
- [ ] Existing public URLs either still work or redirect correctly.
- [ ] Supabase RLS, admin authorization, and storage rules are tested.
- [ ] Admin can create/edit audits and confirm the changes appear on the League, map, and associated story.
- [ ] Stripe checkout, webhook verification, idempotency, orders, mission contributions, and Prole Foods flows pass low-value end-to-end tests.
- [ ] Printful and email workflows are validated if still active.
- [ ] SEO metadata, canonical URLs, sitemap, robots rules, RSS, Open Graph cards, and structured data are validated.
- [ ] Images are responsive, optimized, accessible, and do not harm page performance.
- [ ] Keyboard navigation, focus states, contrast, headings, labels, and screen-reader semantics are checked.
- [ ] Typecheck, lint, production build, automated tests, and deployment checks pass.
- [ ] Secrets have been rotated/verified independently and no credentials exist in source control.
- [ ] A rollback path exists during cutover.

## 8. V1 guidance until then

Until V2 is deliberately approved:

- Keep V1 stable and deployable.
- Publish real content and let it inform future design decisions.
- Make focused improvements only when they support actual content, readability, UX, reliability, security, or revenue.
- Preserve the current audit/League data model as the primary reusable foundation.
- Do not rebuild working Cloudflare/Supabase/Stripe infrastructure just for a visual refresh.

---

## Message to a future implementation agent

Do not begin by replacing technologies. Begin by understanding the published content, current production data, routes, integrations, and the reasons this document exists. Preserve the successful information architecture and the Prole Adventures voice. Improve the delivery model, code boundaries, content composition system, performance, SEO, and visual flexibility—but do not erase the distinctive, gritty, practical character that made the project worth rebuilding.