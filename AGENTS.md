# AniMerch — Agent & Project Guide

Full-stack ecommerce app: **React 19 + Vite+** frontend, **Bun + Hono + Mongoose** API,
**Redis** caching, and **PayPal** checkout with idempotent order handling.

This file is the source of truth for project docs, commands, architecture, and progress.
The README is intentionally short; put durable project knowledge here.

## Quick start

```bash
# 1. Install
vp install                 # root (frontend + tooling)
cd server && bun install   # API

# 2. Configure
cp .env.example .env       # root: Vite client + local API
# Docker hosts should also provide server/.env (see docker-compose.yml)

# 3. Run (two terminals)
vp dev                     # frontend  → http://localhost:3000
cd server && bun run dev   # API       → http://localhost:8888 (PORT)
```

MongoDB is required. Redis is optional; the API logs a warning and runs without cache
when Redis is unavailable. Use `PAYPAL_MOCK=true` for local checkout without PayPal.

First-time browser setup for E2E tests:

```bash
npx playwright install chromium
```

Create an admin account (creates or promotes the user, then sets the password):

```bash
npm run admin:create -- admin@example.com 'change-me-123'
# or: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
```

## Commands

| Command                            | What it does                             |
| ---------------------------------- | ---------------------------------------- |
| `vp dev`                           | Vite+ dev server (port `PORT` or `3000`) |
| `vp build`                         | Production frontend build                |
| `vp preview`                       | Preview the production build             |
| `vp check`                         | Oxfmt + Oxlint + type-aware checks       |
| `vp check --fix`                   | Format and auto-fix                      |
| `npm run typecheck`                | Frontend + server `tsc --noEmit`         |
| `npm test` / `npm run test:server` | Bun API tests                            |
| `npm run test:e2e`                 | Playwright browser tests (mocked API)    |
| `npm run admin:create`             | Create/promote an admin account          |
| `cd server && bun run dev`         | API with watch mode                      |
| `cd server && bun run start`       | API production start                     |
| `cd server && bun test`            | API tests only                           |
| `cd server && bun run typecheck`   | Server strict typecheck                  |

Validation before finishing a change:

```bash
vp check
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Environment variables

Frontend (root `.env`):

```env
VITE_BACK_END_API=http://localhost:8888
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_DEFAULT_PFP=/assets/main.jpg
```

Backend (root `.env` for local Bun, or `server/.env` for Docker):

```env
MONGO_URI=mongodb://localhost:27017/ecommerce
PORT=8888
SECRET_ACCESS_TOKEN=change_me
SECRET_REFRESH_TOKEN=change_me_too
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_MOCK=false
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
TRUST_PROXY=false
```

Set `TRUST_PROXY=true` only when the API sits behind a reverse proxy you control;
it makes rate limiting read the client IP from `X-Forwarded-For`.

Never commit real secrets. `.env` files are gitignored.

## Architecture

```
src/                       React app
  api/                     typed axios clients (public + authenticated, 401 refresh)
  components/              UI, profile tabs, PayPal, admin dashboard
  context/                 products + pagination state
  hooks/                   `useAuth` (localStorage-backed auth snapshot)
  lib/                     zod schemas, auth storage, image srcSet, DOMPurify
  pages/                   route pages (includes `/admin`)
  redux/                   typed cart slice (localStorage-backed)
  types/                   shared API/domain types
server/                    Bun + Hono API
  controllers/             auth, products, profile, orders, paypal, admin
  middleware/              CORS, rate limiting
  models/                  Mongoose schemas
  routes/                  route tree
  services/                cache, PayPal client, pricing
  tests/                   Bun API tests with in-memory model fakes
e2e/                       Playwright tests (API mocked with page.route)
```

### Data flow

- `ProductsProvider` calls the typed API and owns product list/detail/pagination state.
- Redux owns the cart and persists it to `localStorage`.
- Auth stores `accessToken`, `refreshToken`, and `user` in `localStorage`.
- Authenticated API calls attach `Authorization: Bearer <accessToken>`.
- A 401 triggers one single-flight refresh; concurrent failures share the same refresh
  promise and the original request replays once with the new token.
- Admin API calls use the same typed client and are authorized server-side by role.
- Checkout posts server-verified cart lines; the server recomputes all prices.

## API

Base path: `/` (frontend Docker proxy exposes it under `/api/`).

| Method   | Endpoint                      | Notes                        |
| -------- | ----------------------------- | ---------------------------- |
| `GET`    | `/`                           | Health/API banner            |
| `GET`    | `/auth/ping`                  | Health check                 |
| `POST`   | `/auth/login`                 | Returns user + tokens        |
| `POST`   | `/auth/register`              | Creates user + empty profile |
| `PUT`    | `/auth/profile`               | Update username/email (auth) |
| `PUT`    | `/auth/password`              | Change password (auth)       |
| `PUT`    | `/refresh-token`              | Rotate refresh token         |
| `POST`   | `/logout`                     | Revoke refresh tokens        |
| `DELETE` | `/account`                    | Delete account (auth)        |
| `GET`    | `/products/:page`             | Paginated/filtered catalog   |
| `GET`    | `/products/search`            | Search alias                 |
| `GET`    | `/products/random`            | Related products             |
| `GET`    | `/products/product/:id`       | Product detail               |
| `GET`    | `/profile`                    | Profile + addresses (auth)   |
| `PUT`    | `/profile`                    | Update bio/addresses (auth)  |
| `GET`    | `/orders`                     | Current user's orders (auth) |
| `GET`    | `/orders/:id`                 | Owned order (auth)           |
| `POST`   | `/payment/orders`             | Create PayPal order          |
| `POST`   | `/payment/orders/:id/capture` | Capture PayPal order         |
| `GET`    | `/admin/stats`                | Dashboard counters (admin)   |
| `GET`    | `/admin/products`             | Search/paginate (admin)      |
| `POST`   | `/admin/products`             | Create product (admin)       |
| `PUT`    | `/admin/products/:id`         | Update product (admin)       |
| `DELETE` | `/admin/products/:id`         | Delete product (admin)       |
| `GET`    | `/admin/orders`               | List/filter orders (admin)   |
| `PATCH`  | `/admin/orders/:id/status`    | Set order status (admin)     |

`/orders` and `/api/orders` payment aliases remain supported. `/products/search`
is a working alias of `/products/:page` (query `page` instead of the path segment).

## Security

- Product search and tag filters escape user input before building regexes.
- Product description HTML is sanitized with DOMPurify before `dangerouslySetInnerHTML`.
- `secureHeaders` sets HSTS, `nosniff`, `X-Frame-Options: DENY`, and a no-referrer policy.
- Rate limiters: 100 req/15 min globally, 20 on auth, 30 on payment. The client key is
  the socket IP unless `TRUST_PROXY=true`.
- Admin product/order mutations invalidate the Redis product cache prefix.

## Payment & idempotency

- Create requires `Idempotency-Key` (header preferred) or body `idempotencyKey`.
- The server stores a SHA-256 fingerprint of normalized cart + shipping. Reusing a key
  with a different payload returns `409`.
- Replays return the original response body **and** status (`createResponseStatus`).
- Capture is claimed atomically (`CREATED`/`PENDING` → `CAPTURING`) to prevent double
  capture. `COMPLETED` orders always replay their stored capture.
- Same capture key replays the stored result; a new key may retry a retryable failure.
- PayPal `COMPLETED` is verified against the internal amount/currency before the order is
  marked `COMPLETED`. Mismatches fail closed.
- PayPal `PENDING`/`PAYER_ACTION_REQUIRED` map to internal `PENDING`.
- `INSTRUMENT_DECLINED` stays retryable and the UI calls `actions.restart()`.
- The client reuses one create key per checkout attempt and a deterministic
  `capture:<orderId>` key.

## Progress

### Done

- [x] Server migrated to TypeScript with strict checking and no `any`.
- [x] Vite+ toolchain (`vp`) replaces ESLint; scripts, formatting, lint, type checks.
- [x] Latest compatible dependencies; unused packages removed.
- [x] Typed frontend API, shared types, strict frontend typecheck.
- [x] Cart typing, safe localStorage persistence, clear-cart action.
- [x] Checkout shipping validation + PayPal create/capture flow.
- [x] PayPal idempotency, replay, amount verification, retry state machine.
- [x] Real profile page: overview, settings, addresses, order history.
- [x] Legacy `combine ts with main later/` files integrated and removed.
- [x] Contact and 404 pages; `/contact` route.
- [x] JWT auth persistence and server error messages in forms.
- [x] Redis graceful fallback.
- [x] Playwright E2E suite with mocked APIs.
- [x] Docker + docker-compose (Mongo + Redis services included).
- [x] Route-level code splitting; the 3D/Three.js bundle is lazy and isolated.
- [x] Admin dashboard (`/admin`): stats, product CRUD, order status management.
- [x] Auth-aware navbar with account menu/logout and automatic token refresh.
- [x] Regex escaping, DOMPurify sanitization, secure headers, scoped rate limits.
- [x] MUI/FontAwesome removed; Lucide icons, local Tailwind components, `srcSet` images.
- [x] Working `/products/search` alias.
- [x] Modern mobile navigation sheet with search/cart shortcuts and route-aware links.
- [x] Responsive mobile home and catalog layouts with 2-column grids and reveal animations.
- [x] Home rails for featured, top-rated and newest products; catalog sort control (sort is
      preserved across search, filters and pagination).

### Next

- [ ] Wishlist/favorites.
- [ ] Email verification and password reset.
- [ ] Inventory/stock updates during checkout.
- [ ] Order tracking and status notifications.
- [ ] Image optimization and lazy loading.
- [ ] Infinite scroll option.
- [ ] CSRF protection and request sanitization review.
- [ ] Structured request logging/monitoring.
- [ ] CI/CD pipeline and OpenAPI docs.
- [ ] Dark mode, breadcrumbs, richer empty states.
- [ ] Restore or replace the About page (currently removed from the app).

## Conventions

- TypeScript strict everywhere; no `any`/`as any`. Prefer `unknown` + narrowing.
- Validate external input with zod at the API boundary and in forms.
- Keep prices server-authoritative; never trust client totals.
- Use cents rounding helpers (`server/services/pricing.ts`, checkout helpers).
- Put repeated API logic in `src/api/index.ts`.
- Import app modules with the `@/` alias; keep `./` only for same-folder siblings.
- Use `lucide-react` for standard UI icons; keep custom illustrations in `src/components/ui`.
- Skeleton loaders live in `src/components/ui/skeletons`; reuse them instead of inline pulse markup.
- Run `vp check --fix` before committing; hooks call `vp staged`.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
