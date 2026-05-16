# Take-Home: Card API + Telegram Mini App

## 1. What this is

A two-service Node.js + TypeScript system. **Card API** is the system of record for users, cards, authorizations, and transactions. **miniapp-server** is a thin BFF + Telegram bot that verifies WebApp `initData`, holds per-user sessions, and proxies data fetches to the Card API. **miniapp-web** is the React Mini App rendered inside Telegram's WebView.

## 2. Architecture at a glance

```
┌────────────────┐   X-Telegram-Init-Data   ┌─────────────────┐   Bearer JWT    ┌──────────────┐
│  miniapp-web   │ ───────────────────────► │ miniapp-server  │ ──────────────► │   card-api   │
│ (React + Vite) │                          │ (Fastify+grammY)│                 │  (Fastify)   │
│   in WebView   │ ◄─────────────────────── │  BFF + Bot      │ ◄────────────── │   + Prisma   │
└────────────────┘    Zod-validated JSON    └─────────────────┘   JSON over     └──────────────┘
                                                                   HTTP              │
                                                                                     ▼
                                                                               ┌──────────┐
                                                                               │  SQLite  │
                                                                               └──────────┘
```

The Card API has no Telegram knowledge — it can be exercised standalone with `curl`. The miniapp-server is the trust boundary: it holds the bot token, verifies `initData`, owns the session store, and is the only thing that ever calls the Card API. The miniapp-web carries no secrets — its only auth input is `initData` injected by `window.Telegram.WebApp`. The Card API's JWT never crosses the BFF→web boundary.

## 3. Prerequisites

- **Node.js 22** (LTS) — `nvm install 22 && nvm use 22`
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9 --activate`
- **Docker** *(optional)* — for the one-command `docker compose up` path
- **ngrok** or any HTTPS tunnel *(optional)* — only needed if you want to actually open the Mini App from a phone via Telegram

## 4. Quick start — local (no Docker)

```bash
git clone <this-repo>
cd <this-repo>
pnpm install
cp packages/card-api/.env.example packages/card-api/.env
cp packages/miniapp-server/.env.example packages/miniapp-server/.env
# Edit packages/card-api/.env: set JWT_SECRET (any random 32+ byte string)
# Edit packages/miniapp-server/.env: set TELEGRAM_BOT_TOKEN (from @BotFather)

pnpm -F @homework/shared build
pnpm -F @homework/card-api db:reset      # migrate + seed
pnpm dev                                 # runs all three services concurrently
# Card API:        http://localhost:4000
# Mini App + BFF:  http://localhost:3000
# Vite dev:        http://localhost:5173 (proxied to :3000)
```

To open the bot in Telegram (optional):

1. Talk to [@BotFather](https://t.me/BotFather), `/newbot`, copy the token into `TELEGRAM_BOT_TOKEN`.
2. `ngrok http 3000` and copy the HTTPS URL.
3. Set `MINIAPP_PUBLIC_URL` to the ngrok URL.
4. In @BotFather: `/setmenubutton` → choose your bot → name "Cards" → paste the URL.
5. Open the bot chat in Telegram, tap the menu button. The Mini App loads.

If you only want to verify the React UI in a browser, open `http://localhost:5173` directly — in dev mode it falls back to a permissive `window.Telegram.WebApp` stub.

## 5. Quick start — Docker

```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET, TELEGRAM_BOT_TOKEN, MINIAPP_PUBLIC_URL
docker compose build
docker compose up
```

The first boot runs `prisma migrate deploy` and seeds the database. The seed is idempotent — restarting the stack will not duplicate users.

## 6. Default test credentials

| Email | Password | Notes |
|---|---|---|
| `alice@example.com` | `Passw0rd!` | 3 cards (USD, EUR, GBP), full activity |
| `bob@example.com`   | `Passw0rd!` | 2 cards (one FROZEN), partial activity |
| `charlie@example.com` | `Passw0rd!` | No cards (empty-state test) |

## 7. API documentation

The Card API publishes its full contract from a single source of truth (Zod schemas in `@homework/shared`).

- **Interactive Swagger UI:** [http://localhost:4000/documentation](http://localhost:4000/documentation)
- **Raw OpenAPI 3.1 JSON:** [http://localhost:4000/openapi.json](http://localhost:4000/openapi.json)

Auth model:
- **Card API ↔ caller:** email + password → JWT (HS256, 1h). Token sent as `Authorization: Bearer <jwt>`.
- **Mini App ↔ miniapp-server:** every request carries `X-Telegram-Init-Data: <raw initData>`. The server verifies the HMAC against `TELEGRAM_BOT_TOKEN`, then maps the Telegram user to a server-side session that holds the Card API JWT. The JWT never leaves the BFF.

Required environment variables (full list in each `.env.example`):

| Var | Used by | Purpose |
|---|---|---|
| `JWT_SECRET` | card-api | Signs/verifies user JWTs |
| `TELEGRAM_BOT_TOKEN` | miniapp-server | Verifies initData HMAC + drives the bot |
| `MINIAPP_PUBLIC_URL` | miniapp-server | Sent to Telegram in the `web_app` button |

## 8. Running tests

```bash
pnpm -r test                                 # unit + integration across all packages
pnpm test:e2e                                # Playwright happy-path (requires services running)
pnpm -F @homework/card-api test --coverage   # per-package coverage with thresholds
pnpm -F @homework/miniapp-web test --coverage
```

Coverage thresholds:
- card-api: 85% lines / 80% branches / 90% functions globally; services 95%
- miniapp-web: 80% lines / 75% branches / 85% functions

## 9. Project layout

```
.
├── packages/
│   ├── shared/           Zod schemas + types shared by every package
│   ├── card-api/         Fastify + Prisma + SQLite — system of record
│   ├── miniapp-server/   Fastify BFF + grammY bot — trust boundary, sessions, proxy
│   └── miniapp-web/      React 19 + Vite + Tailwind v4 — Mini App UI
├── e2e/                  Playwright happy-path test
├── docker/               Container entrypoints
├── Dockerfile.card-api
├── Dockerfile.miniapp-server
└── docker-compose.yml
```

## 10. Trade-offs and choices

1. **SQLite over Postgres.** Take-home scope. Prisma's adapter abstracts this away — production swap = change the connection string and run migrations against the new engine.
2. **In-memory session store.** Single-process is fine for the assignment; a `SessionStore` interface exists so swapping Redis is a one-class change. Documented at `packages/miniapp-server/src/session/`.
3. **Activity merge in app code.** The miniapp-server merges authorizations + transactions in memory. At low scale this is fine. At higher scale I'd push the merge into the database with a `UNION ALL` plus a composite cursor (timestamp + tiebreaker id).
4. **One Fastify process serves Mini App static + API + bot.** Simpler delivery, fewer containers, fewer cross-origin headaches inside Telegram. The bot's only job is emitting the `web_app` button — minimal surface area.
5. **Discriminated activity union over a sum table.** `Authorization` and `Transaction` are different lifecycle entities (one is held funds, the other is settled). Modeling them separately lets each carry the fields that actually exist for it. The API merges them at the edge into an `ActivityItem` discriminated by `type`.
6. **Cursor pagination, opaque cursor.** The cursor is just the last item's id. Simpler than encoding compound keys, and `id`s are sortable in the chosen scheme.
7. **404 not 403 on cross-tenant access.** Returning 403 leaks "this id exists, you just can't see it." Returning 404 means an attacker cannot enumerate other users' card ids.
8. **1h JWT, no refresh-token flow.** Re-prompts credentials at expiry — acceptable for take-home demo, not for production.
9. **Single Playwright happy-path e2e.** Validates the full stack wires up. Branching scenarios are covered by component + integration tests one layer down.

## 11. What I'd do differently with more time

- Replace SQLite with Postgres + a real connection pool, and add row-level security as a defence-in-depth layer.
- Push session storage to Redis with key TTLs equal to JWT TTL, plus token versioning for forced revocation.
- Replace the in-app activity merge with a server-side `UNION ALL` query + composite cursor.
- Add a refresh-token loop on the Card API so sessions can outlive a single 1h JWT without re-prompting credentials.
- Per-account lockout and a distributed (Redis) rate limiter to replace the per-process one.
- Add full OpenTelemetry tracing — request id is already plumbed through; spans would be the next step.
- Replace the `pino-pretty` console output with a JSON-first logger pipeline shipped to a real aggregator.
- Use `decimal.js` for money rather than integer minor units, once the API needs to deal with FX/rounding edge cases.
- Skeleton placeholders, optimistic updates, and pull-to-refresh on the web client.
- Dedicated auth service (OIDC) if a real platform has SSO requirements.
- Component-level visual regression tests using Playwright's `expect(page).toHaveScreenshot()`.
- Add `helmet`, CSP, HSTS, SRI, and a dependency-audit gate in CI once the deployment topology is fixed.
- Chaos tests for upstream-unavailable and clock-skew scenarios.

## 12. Security notes

What this implementation **does** verify:

- Telegram `initData` HMAC-SHA256 (constant-time compare) on every request to `miniapp-server` API routes.
- `auth_date` freshness (rejects payloads older than 24 h) to defeat replay.
- Bearer JWT signature + `exp` on every Card API request.
- Card and activity ownership enforced server-side: cross-tenant requests return **404**, not 403, so card ids cannot be enumerated.
- Per-IP login rate limit (10 requests / minute) on `POST /v1/auth/login`.
- Per-Telegram-user rate limit (10 requests / minute) on `POST /api/login`.
- Bcrypt password hashing (cost 10); plain-text passwords never logged.
- Strict Zod validation at every HTTP boundary; mismatched shapes are rejected before the handler sees them.
- The Card API JWT never crosses the BFF → web boundary; only `{ user: { fullName } }` is returned to the client.
- CSRF immunity: the `X-Telegram-Init-Data` header is not an ambient browser credential, so cross-site requests cannot forge it.

What this implementation **does not** include (deliberate scope cuts):

- Account lockout after N failed logins.
- Multi-factor authentication.
- Password reset / forgotten-password flow.
- Distributed rate limiting (current limiter is per-process).
- HTTP security headers via `helmet` (CSP, HSTS, frame-ancestors, etc.).
- Dependency vulnerability scanning gate in CI.
- Refresh-token rotation / revocation list.
- Authentication on the Swagger UI at `/documentation`; not intended for production exposure as-is.

## 13. License & author

MIT License — see `LICENSE`.

Author: Nikita Kalmychin · <nikitakalmycin@gmail.com>
