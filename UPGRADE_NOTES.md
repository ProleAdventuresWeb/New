# Dependency Upgrade Notes

This document tracks the controlled dependency upgrades for the Prole Adventures project.

## Non-Breaking Updates (Task 2)
Performed initial updates for non-core dependencies:
- `@vercel/node`: `^5.6.24` → `^5.7.0` (Minor)
- `autoprefixer`: `10.4.20` → `10.4.27` (Patch)
- `eslint-plugin-react-refresh`: `^0.4.26` → `^0.5.2` (Minor)
- `postcss`: `8.4.49` → `8.5.8` (Patch)
- `typescript-eslint`: `^8.57.1` → `^8.58.0` (Minor)

Build Result: **SUCCESS**

## Core Stack Review (Task 3)

| Package | Current → Target | Result | Decision / Notes |
| :--- | :--- | :--- | :--- |
| `vite` | `^6.4.1` → `^8.0.5` | **DEFER** | Major architectural changes in Vite 7/8 (Environment API). Requires full config audit. |
| `@vitejs/plugin-react` | `^4.7.0` → `^6.0.1` | **DEFER** | Follows Vite major versioning. |
| `react` / `react-dom` | `^18.3.1` → `^19.2.4` | **DEFER** | React 19 drops support for some legacy behaviors/libraries. Defer for thorough test suite audit. |
| `typescript` | `~5.6.3` → `~6.0.2` | **DEFER** | Major version jump (v6) potentially introduces significant type system changes. |
| `tailwindcss` | `3.4.16` → `4.2.2` | **DEFER** | Tailwind v4 is a major rewrite (CSS-first config). Requires migration of `tailwind.config.js` to CSS `@theme`. |
| `supabase-js` | `^2.100.0` → `^2.101.1` | **SAFE** | Patch update only. Safe to upgrade. |
| `react-router-dom` | `^6.30.3` → `^7.14.0` | **DEFER** | React Router 7 is a major shift (merging with Remix). Code changes for routing/loaders required. |
| `react-markdown` | `^10.1.0` | Already Latest | N/A |
| `react-helmet-async` | `^3.0.0` | Already Latest | N/A |

### Additional Major Bumps (Deferred)
- `@eslint/js`: `^9.39.4` → `^10.0.1` (Major) - ESLint v10 may have breaking config changes.
- `@types/node / react / react-dom`: Deferred to match runtime versions.
- `eslint`: `^9.39.4` → `^10.2.0` (Major) - ESLint v10 breaking changes.
- `lucide-react`: `^0.577.0` → `^1.7.0` (Major) - New icon set/API changes.
- `stripe`: `^21.0.1` → `^22.0.0` (Major).
