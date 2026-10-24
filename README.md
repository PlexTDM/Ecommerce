# AniMerch

A full-stack ecommerce demo: React 19 frontend, Bun + Hono + Mongoose, Redis, VitePlus.
PayPal checkout with idempotent orders, and an admin dashboard.

## Screenshots

| Storefront                                                                      | Catalog                                                                            |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [![AniMerch home page](docs/screenshots/home.webp)](docs/screenshots/home.webp) | [![Product catalog](docs/screenshots/catalog.webp)](docs/screenshots/catalog.webp) |

| Product detail                                                                         | Mobile navigation                                                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [![Product detail page](docs/screenshots/product.webp)](docs/screenshots/product.webp) | [![Mobile navigation sheet](docs/screenshots/mobile-nav.webp)](docs/screenshots/mobile-nav.webp) |

[![Admin dashboard](docs/screenshots/admin.webp)](docs/screenshots/admin.webp)

## Quick start

```bash
vp install                 # frontend + tooling
cd server && bun install   # API
cp .env.example .env       # fill in Mongo + PayPal values

vp dev                     # http://localhost:3000
cd server && bun run dev   # API on PORT (default 8888)
```

MongoDB is required. Redis is optional (the API falls back to no cache).
Set `PAYPAL_MOCK=true` to run checkout without PayPal credentials.

First-time browser setup for the E2E suite:

```bash
npx playwright install chromium
```

Create an admin account (creates or promotes the user):

```bash
npm run admin:create -- admin@example.com 'change-me-123'
```

Sign in with that account and open `/admin` for product CRUD, order status updates, and
store stats.

## Scripts

| Command                       | What it does                          |
| ----------------------------- | ------------------------------------- |
| `vp dev`                      | Start the frontend dev server         |
| `vp build`                    | Production build                      |
| `vp check` / `vp check --fix` | Format, lint, and type-check          |
| `npm run typecheck`           | Frontend + server TypeScript checks   |
| `npm test`                    | Bun API tests                         |
| `npm run test:e2e`            | Playwright browser tests (mocked API) |
| `npm run admin:create`        | Create/promote an admin account       |
| `cd server && bun run dev`    | Start the API in watch mode           |

## Layout

```
src/        React app (pages, components, typed API, Redux cart, contexts)
server/     Bun/Hono API (controllers, models, services, tests)
e2e/        Playwright tests
public/     Static assets
```

## API

Base URL is `/`. Main resources: `/auth/*`, `/products/:page`, `/profile`, `/orders`,
`/payment/orders` (create/capture), and `/admin/*` (JWT + `ADMIN` role). Payment create
requires an `Idempotency-Key`.

## Docs

Project architecture, environment variables, payment semantics, and the roadmap live in
[`AGENTS.md`](./AGENTS.md).

## License

MIT — see [`LICENSE`](./LICENSE).
