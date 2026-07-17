# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**hoopla-dashboard-web** is the admin back-office SPA for the Hoopla platform. It talks
exclusively to **hoopla-dashboard-api** and lets Hoopla staff manage partners, shops, drinks,
orders, users, promocodes, gift cards, settlements, stories/banners/notifications, and view
per-partner analytics.

Despite the directory layout under `src/app/(dashboard)/...` (Next.js App Router route-group
convention), **this is not Next.js** — it's a plain Vite + React SPA using `react-router-dom`'s
`createBrowserRouter`. The committed `README.md` still describes `create-next-app`; it's stale,
ignore it (this is flagged in the workspace-root `CLAUDE.md` too). The `(dashboard)` folder name
is just inherited convention/muscle memory, not a framework feature here.

## Commands

```bash
npm install         # install deps
npm run dev          # vite dev server, :3000 (see vite.config.ts)
npm run build         # tsc -b --noEmit && vite build -> dist/
npm run preview       # preview the production build
npm run lint          # eslint (eslint.config.mjs)
make docker-up | docker-down | docker-rebuild   # docker compose lifecycle, host port 3020 -> container 80
```

No test suite/config exists (`package.json` has no test script) — there is no `typecheck`
script either; type-checking happens as part of `npm run build` (`tsc -b --noEmit`). Gate
changes on `npm run build` + `npm run lint`.

Docker: multi-stage `Dockerfile` (`node:22-alpine` build → static `dist/` served by
`nginx:1.27-alpine` via the repo's own `nginx.conf` — this is the SPA serve config, distinct
from the production vhost that lives in `hoopla-vendor/deploy/nginx/`).

## Architecture

- **Entry**: `src/main.tsx` renders `<Providers>` (React Query + `next-themes` + `nuqs` URL-state
  adapter + Sonner toaster) → `<ErrorBoundary>` → `<RouterProvider router={router}>`.
- **Routing**: `src/router.tsx` is the single source of truth for all routes — a flat
  `createBrowserRouter` array, `/login` outside the layout and everything else nested under
  `DashboardLayout` (`src/components/layout/dashboard-layout.tsx`), which renders `Sidebar` +
  `TopBar` + `<Outlet />`. Every page lives at `src/app/(dashboard)/<route>/page.tsx` (or
  `.../[id]/page.tsx` for detail routes) and is imported by explicit path in `router.tsx` — a
  page file not wired there is dead code, same "not registered = doesn't exist" pattern as
  hoopla-api's route wiring.
- **API layer**: `src/lib/api/http-client.ts` exports a single axios instance,
  `withCredentials: true`, **`baseURL` hardcoded to `https://dashboard.hoopla.uz`** (no
  `VITE_API_URL` env var anywhere in the codebase — `grep -r "VITE_\|import.meta.env" src`
  returns nothing). To point at a local/staging dashboard-api you must edit this file directly,
  there is no env-driven override.
- **API domains**: one file per resource in `src/lib/api/domains/*.ts` (thin functions calling
  `httpClient`, unwrapping the `{ code, message, data, meta }` envelope), paired with zod schemas
  + inferred types in `src/lib/api/schemas/*.ts`. Shared response/pagination types in
  `src/lib/api/types.ts`.
- **Server state**: TanStack Query only, via the domain functions above (`staleTime` 60s,
  `refetchOnWindowFocus: false` set globally in `providers.tsx`).
- **Client/UI state**: Zustand, two stores — `src/stores/auth-store.ts` (persisted to
  `localStorage` under key `hoopla-auth`) and `src/stores/page-header-store.ts`. Don't mirror
  server data into Zustand (workspace rule).
- **Components**: `src/components/ui` (shadcn/ui primitives, `components.json` configured),
  `src/components/data-table` (shared table shell/empty-state/sortable-head), `src/components/
  forms`, `src/components/pickers`, `src/components/wizard`, `src/components/layout`
  (sidebar/topbar/command-palette/page-header/page-toolbar), `src/components/providers`.

## Auth model — cookie-based, client flag only tracks *intent*

Auth matches the workspace convention (dashboard-api uses cookies, not Bearer):
`POST /api/v1/auth/login` sets `access_token`/`refresh_token` cookies server-side; the client
never sees or stores a token. **What the client *does* store is a separate, unauthenticated
`isAuthenticated` boolean** in the persisted `auth-store` — set to `true` on a successful login
response, cleared by `logout()`. `DashboardLayout` gates every non-login route purely on this
local flag (plus a `hasHydrated` guard to avoid a flash-redirect before Zustand's persist
middleware rehydrates from `localStorage`) — it does **not** re-validate the cookie against the
server on mount. So a cleared/expired cookie with a stale `isAuthenticated: true` in
`localStorage` renders the dashboard shell until the first API call 401s, at which point the
`httpClient` response interceptor (`http-client.ts`) hard-redirects to `/login` (no token
refresh attempted client-side, unlike hoopla-pos/hoopla-dashboard-web's cookie-refresh peers —
confirm current dashboard-api behavior before assuming refresh happens transparently here).

## Conventions

- Money: dashboard-api's order-list `price` is already **som** at this API (per workspace
  `CLAUDE.md`) — don't divide by 100 again in this frontend. `partner_drinks`-derived amounts
  are also som. Watch settlement/order DTOs for which unit a given field is actually in;
  `settlementsApi.create`'s `total_amount` is commented `// som` in `domains/settlements.ts`.
- Response envelope: `{ code, message, data, meta }`; domain functions return `res.data.data`
  (falling back to `res.data` where a couple of endpoints return the bare payload — e.g.
  `partnersApi.getFeedbacks`, inconsistently with the rest of that same file).
- Repo-wide hard rules (`RULES.md`) — enforced by convention, not by a lint rule that blocks
  the build: **never `any`** (use `// @ts-ignore` as a last resort), **no comments** (remove
  existing ones on touch), **no unused vars/imports**, and **no monolithic page files** — split
  features/tabs/business logic into dedicated components/hooks under the page's own
  `components/` folder (see `partners/[id]/components/`, `shops/[id]/components/`) and keep the
  `page.tsx` a thin layout/routing container.
- Path alias `@/*` → `src/*` (`vite-tsconfig-paths` + `tsconfig.json`), used everywhere instead
  of relative imports.

## Integration points

- **hoopla-dashboard-api** (`dashboard.hoopla.uz`) is the only backend this app talks to — every
  `domains/*.ts` file hits `/api/v1/...` there. Cross-reference `hoopla-dashboard-api`'s
  controllers when a DTO shape here looks off; this repo's zod schemas are hand-maintained
  mirrors, not generated, so they can drift from the Go response structs.
- **Partner analytics** (`partners/[id]/components/analytics/*`) renders the Analytics 2.1
  payload documented in the workspace `CLAUDE.md` — gender/age, top drinks/categories, daily +
  hourly (Tashkent-tz zero-filled), loyalty, operators, fulfillment — via
  `GET /api/v1/partner/analytics/:partner_id`. Charting is `recharts`.
- **Settlements** (`domains/settlements.ts`): this is the *write* side (`store`/`pay`/`delete`)
  of the settlement workflow whose *read-only* counterpart lives in hoopla-merchant /
  hoopla-merchant-web — settlements created/paid here are what partners see reported there.
- **Shop cassa credentials**: shop edit forms here are how `shops.vendor_login` /
  `vendor_password` / `vendor_organization_id` and staff `vendor_pin` (consumed by hoopla-vendor
  / hoopla-pos for cassa two-step login) get set — see `src/components/forms/shop-form.tsx` and
  the shop detail page's components before changing that form.

## Gotchas

- Don't trust `README.md` (Next.js boilerplate) or assume any `next/*` API is in play — this is
  a Vite SPA end to end; the `(dashboard)` path segment is cosmetic only.
- There is no environment-based API URL switch — `API_BASE_URL` in `http-client.ts` always
  points at production `dashboard.hoopla.uz` regardless of `npm run dev` vs `build`. Changing
  target environments means editing that constant, not setting an env var.
- `isAuthenticated` in `auth-store` is a **client-trusted flag, not a session check** — see the
  Auth model section. Don't assume `DashboardLayout` guarantees a live session, only that login
  was attempted once and not explicitly logged out.
