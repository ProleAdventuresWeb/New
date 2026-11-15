# League Table & Audit Spec Review — Architectural Analysis

*Saved: 30 October 2026*
*Context: Antigravity Codebase Review against "BUILD SPEC — League Table, Audit Pins & Stories (v2)"*

---

## 1. Concept Review & Narrative Device

**The Idea:**
Using a public, sortable **League Table of Audits** as the central narrative spine is an outstanding creative and structural choice. It unifies what could otherwise be disparate YouTube videos, mission funding calls, and long-form dispatches into an escalating, documentary-style index of UK places ranked by real-world friction.

**Key Strengths of the Spec:**
- **Editorial Score (1–100, spine §16):** Strict editorial assignment (never an algorithm or computed formula) preserves the creator's voice and prevents audience gaming.
- **Click-to-Play Video Facades:** Essential for Leaflet performance. Pre-rendering 50+ live YouTube iframe players would cripple browser performance, DOM size, and battery life, while auto-playing ruins YouTube watch-time metrics.
- **Financial Clean-up on Completion:** Stripping funding totals from completed cards cleanly shifts the object from a funding pitch to a permanent historical ledger entry.
- **Single Source of Truth:** Feeding the League Table row, the Map billboard card, and the Story page header from a single record eliminates operational drift.

---

## 2. Codebase Realities vs. Spec Assumptions

During the codebase inspection across `App.tsx`, `MissionControlPage.tsx`, `PostPage.tsx`, `AdminPage.tsx`, `supabase/*.sql`, and the Stripe Cloudflare Workers (`functions/webhook.ts`), several key friction points and architectural mismatches were identified:

### A. Route Mismatch: Map is `/prole-control`, not `/map`
- **Spec Assumption:** Place clicks navigate to `/map?pin=<id>`.
- **Codebase Reality:** The interactive mission map is currently mounted at `/prole-control` (`MissionControlPage.tsx`). In `src/App.tsx`, `/map` is not registered at all. (There is an old, disconnected prototype `MapPage.tsx` using mock Australian/Asian data from `locations.json`).
- **Solution:**
  1. Add `/map` to `App.tsx` as a direct route or alias pointing to `MissionControlPage`.
  2. Implement deep-link parameter parsing (`?pin=<id>` or `?mission_id=<id>`).

### B. Deep-Linking on the Map is Currently Incomplete
- **Codebase Reality:** In `MissionControlPage.tsx`, on initial load the component hard-defaults to selecting the first adventure:
  ```ts
  if (data.length > 0) setSelected(data[0]);
  ```
  It does not inspect `searchParams` on mount to fly the Leaflet camera or trigger the popup for a specific pin ID.
- **Solution:** Add a `useEffect` that checks the URL search params (`?pin=<id>`), finds the target pin, auto-selects it, scrolls the card into view, and animates the map to center on it with its billboard popup open.

### C. Story Route Mismatch: `/read/:slug` vs `/stories/:slug`
- **Spec Assumption:** Stories live at `/stories/[slug]`.
- **Codebase Reality:** In `App.tsx`, `/stories` is the catalog list (`StoriesPage.tsx`), while individual story posts live at `/read/:slug` (`PostPage.tsx`).
- **Solution:** Add a route `/stories/:slug` in `App.tsx` pointing to `PostPage` (or aliasing `/read/:slug`) so both URL formats work seamlessly.

### D. Content Gating: All-or-Nothing Wall vs. Free Outline + Paid Long Read
- **Spec Requirement:**
  > *"Free body: outline/summary + embedded main video (facade, click-to-play)... Paid section: the long read / deep analysis, gated via the EXISTING accounts/payments system."*
- **Codebase Reality:** In `PostPage.tsx` today, gating is an **all-or-nothing hard wall**. If `is_gated === true`, the markdown content is completely hidden behind an access-code form (`PROLE-XXXX`). The visitor only sees the cover image, title, and short excerpt.
- **Solution:** Restructure the story template so that:
  1. The **Audit Header** (scores, verdict line, ledger evidence stats) always renders publicly at the top.
  2. The **Free Body** (outline/summary + click-to-play YouTube facade embed) always renders publicly.
  3. Only the **Paid Section** (the deep report / full text) sits behind the existing gate / contributor unlock box.
  4. The **Footer** renders the funder credit (if commissioned) or the "fund the next audit" prompt (if self-funded).

### E. Data Model: Uniqueness Constraints & Single Record Write
- **Spec Requirement:**
  > *"One record per audit (a visit to a place). A place may accumulate multiple audits over time — always append, never overwrite."*
- **Codebase Reality:** In `supabase/missions_seed.sql`, the `adventures` table currently enforces:
  ```sql
  ALTER TABLE public.adventures ADD CONSTRAINT adventures_title_key UNIQUE (title);
  ```
  If a place (e.g. "Escape The Midlands Matrix") is revisited in 2028, inserting another record with the same title would fail with a database constraint error.
- **Integration with Stripe:** Stripe checkout sessions and webhooks (`functions/webhook.ts`) directly update `adventures` using `mission_id` and update `bounty_current`.
- **Recommended Data Architecture:**
  - **Option 1 (Evolve `adventures` table):** Drop the `UNIQUE (title)` constraint, and add the audit columns directly (`episode_number`, `score`, `verdict_line`, `tomato_index_gbp`, `kebab_index_gbp`, `actual_spend_gbp`, `exchanges_count`, `free_pins_found_count`, `hassle_log`, `conditions_line`, `story_slug`, `commissioned`, `funder_credit`). This keeps the existing Stripe webhook and contribution tracking functioning with zero breakage.
  - **Option 2 (Dedicated `audits` table):** Create a separate `audits` table and link it to `adventures.id` where a funding mission exists. (Option 1 is generally preferred to satisfy "ONE data source — the audit record — feeds three views").

### F. Publishing Interface / Admin Workflow
- **Codebase Reality:** `AdminPage.tsx` currently only supports creating and editing blog dispatches (`posts`). Missions/adventures have no admin editing form and are currently managed via SQL seed scripts or directly in the Supabase dashboard.
- **Consideration:**
  - For Phase 1, audits can either be inserted directly via Supabase SQL / Table Editor, OR we can add an "Audit / Mission Manager" tab inside `AdminPage.tsx`.

### G. Clarification on "Resource Pins"
- **Spec:** *"New pin type 'audit' alongside existing resource pins, with a layer toggle."*
- **Codebase Reality:** The current live map on `/prole-control` only renders mission pins. The old `locations.json` file had mock urban exploration spots.
- **Clarification:** We should clarify whether "resource pins" refers to water/supply/bivvy pins to be loaded from a separate dataset, or if it's a hook for an upcoming layer toggle.

---

## 3. Checklist for Resuming the Session

When ready to begin implementation, we will proceed with:
1. **Database Schema Update:**
   - Add audit columns to `adventures` (or create `audits` table).
   - Relax `adventures_title_key` uniqueness constraint to allow multi-audit historical visits to the same place.
   - Add types in `src/types/` and `src/lib/supabase.ts`.
2. **Routing Adjustments (`App.tsx`):**
   - Register `/league` route for `LeaguePage`.
   - Alias `/map` to `MissionControlPage`.
   - Alias `/stories/:slug` to `PostPage`.
3. **League Table Page (`/league`):**
   - Create sortable table (Place, #, Score, Verdict, Spend, Kebab, Tomato, Exchanges, Free Finds, Hassle, Date).
   - Clicking place navigates to `/map?pin=<id>`.
4. **Map Upgrades (`MissionControlPage.tsx`):**
   - Add deep-link handler for `?pin=<id>`.
   - Update completed pin cards to the "billboard" layout: YouTube click-to-play facade, place-led title `<place_name> #<episode>`, verdict line, no funding numbers, "READ THE STORY" CTA.
5. **Story Page Upgrades (`PostPage.tsx`):**
   - Render the auto-generated Audit Header from the audit record.
   - Free summary + YouTube facade above the paywall gate.
   - Gated long read below.
   - Commissioned / self-funded footer.
