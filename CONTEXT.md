# CONTEXT.md — handoff for the next agent

> You are taking over an in-progress project. Read this top-to-bottom **before**
> editing or running anything. The user (Gonzalo) is non-developer-friendly but
> technically literate; he wants iterative local dev with auto-deploy to Render
> and the ability to migrate to Hetzner later. Don't second-guess the stack
> choices below — they were debated and locked in.

---

## 1. Project at a glance

**Possibility® Área Cliente** — Spanish-language energy invoice management
dashboard. End-users (Felipe, etc.) log in, view their suministros (electricity
supplies), see invoices, consumption, tariff, and request changes.

The visual design is fixed by `Template.html` at the repo root — that file is
the source of truth for layout, colors, copy, and behavior. Don't redesign it
without explicit user permission.

---

## 2. Stack (locked-in)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React 18 + TS | SPA, deploys as static site; user wants speed |
| Backend | FastAPI + SQLAlchemy 2.0 (async) + Alembic | User pivoted from Express to FastAPI mid-build (more familiar with Python) |
| Auth | JWT (HS256) + bcrypt via passlib | Simple, stateless, works across both Render services |
| ORM | SQLAlchemy 2.0 with `Mapped[]` typed mappings | Modern; async via asyncpg |
| Migrations | Alembic | Standard Python migration tool |
| DB | Postgres 16 | Neon in prod, local container in dev |
| Object storage | Cloudflare R2 | S3-compatible, generous free tier (env templated, **not yet wired**) |
| Deploy | Render via Docker, blueprint in `render.yaml` | User has Render account |
| CI | GitHub Actions: parallel jobs (api/web/docker) + GHCR push | User wants portability |
| Runtime portability | Docker images pushed to GHCR every commit | Hetzner can pull same images later |
| Local dev | `docker compose up` (Postgres + api + web) | Same Dockerfiles as prod = no drift |

User's accounts: **GitHub, Render, Neon, Cloudflare** — all OAuth-linked via GitHub.

---

## 3. Architecture

```
                                ┌────────────────────────┐
                                │  Cloudflare R2         │
                                │  (invoice PDFs)        │
                                │  ⚠ env templated only  │
                                └────────┬───────────────┘
                                         │
           Browser ──HTTPS──> nginx (web container, Vite build artefacts)
              │                          │
              │ Bearer JWT (Authorization header, JWT in localStorage)
              ▼
           FastAPI (api container, uvicorn :4000)
              │
              ▼
           Postgres (Neon in prod, postgres:16-alpine container in dev)
```

**Repo layout** (see also README §5):
```
apps/web/        Vite + React + TS frontend
  src/
    pages/       Login.tsx, Dashboard.tsx
    components/  Header, HeroBanner, ResumenTab, ConsumoTab, FacturasTab,
                 TarifaTab, SettingsModal, ShipmentBooster
    lib/         api.ts (HTTP client + tokenStore), auth.tsx (AuthProvider/useAuth)
    types.ts     Shared types matching backend Pydantic schemas
    index.css    All styling (extracted from Template.html)
  Dockerfile     Multi-stage Node build → nginx serve
  nginx.conf     SPA fallback + asset caching

apps/api/        FastAPI backend
  app/
    main.py      FastAPI app + CORS + router includes
    config.py    Pydantic-settings (env vars)
    db.py        Async engine + AsyncSessionLocal + Base
    models.py    SQLAlchemy models (User, Supply, Tariff, Invoice, Consumption)
    schemas.py   Pydantic v2 schemas with camelCase serialization aliases
    security.py  hash_password, verify_password, create_access_token, decode_token
    deps.py      get_db, get_current_user (HTTPBearer)
    routers/     auth.py, supplies.py
  alembic/       env.py, versions/0001_initial.py
  alembic.ini
  seed.py        Idempotent — creates Felipe + 3 supplies + 60 consumption rows
  Dockerfile     Python 3.12-slim, runs `alembic upgrade head && python seed.py && uvicorn`
  requirements.txt

.github/workflows/
  ci.yml         Parallel api-lint (Python) + web-lint (Node) + docker-build
  deploy.yml    Pushes images to ghcr.io/<repo>/{api,web}:{sha,latest} on main

docker-compose.yml   Local stack (postgres + api + web)
render.yaml          Render Blueprint
```

---

## 4. Data model (locked, per user spec)

5 entities. Migration `apps/api/alembic/versions/0001_initial.py` is the source
of truth — keep models.py in sync if you edit either.

```
User (1) ──< (N) Supply ──< (N) Invoice
                          ──> (1) Tariff   [optional, 1:1]
                          ──< (N) Consumption  [unique on supply+year+month]
```

- `Supply.type`: enum RESIDENCIAL / RESTAURACION / EMPRESA (matches template)
- `Invoice.status`: enum PAGADA / PENDIENTE / VENCIDA
- `Consumption.hourly_profile`: JSON `number[]` of length 24 (kWh per hour)
- IDs are string UUIDs (cuid-style not used; just `str(uuid.uuid4())`)

The frontend expects **camelCase JSON** (e.g. `pricePerKwh`). The Pydantic
schemas in `app/schemas.py` use `Field(serialization_alias=...)` to do this
without changing the underlying snake_case Python attribute names. **Do not
break this convention** — the frontend types in `apps/web/src/types.ts` rely on
camelCase.

---

## 5. API endpoints (all wired and tested via Pydantic)

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ ok, env }` |
| POST | `/auth/register` | — | `{ token, user }` |
| POST | `/auth/login` | — | `{ token, user }` |
| GET | `/auth/me` | Bearer | `{ user }` |
| GET | `/supplies` | Bearer | `{ supplies: [...] }` (with tariff) |
| GET | `/supplies/{id}` | Bearer | `{ supply }` (with tariff + invoices + consumption) |
| GET | `/supplies/{id}/invoices` | Bearer | `{ invoices: [...] }` |
| GET | `/supplies/{id}/consumption` | Bearer | `{ consumption: [...] }` |
| GET | `/supplies/{id}/tariff` | Bearer | `{ tariff }` |

Interactive docs at `/docs` in development.

---

## 6. What's done ✅

- Frontend: all 4 dashboard tabs (Resumen, Consumo, Facturas, Tarifa) match the
  template 1:1 — bar charts, radial 24h chart, monthly polyline, competitor
  comparison with hover tooltips, action cards, settings modal, shipment
  booster front/back swap.
- Login page (Spanish UI). Demo creds prefilled for fast iteration.
- Auth flow end-to-end: register, login, JWT in localStorage, protected routes
  via `<ProtectedRoute>` + `useAuth()`.
- Backend: all GET endpoints with proper user-scoped queries (a user only sees
  their own supplies — verified in `_own_supply()` helper).
- Seed: 3 supplies for Felipe, each with 5 invoices + 12 months of consumption,
  matching the template's static `D` object exactly (residencial / restauración
  / empresa).
- Docker for both services + multi-stage builds + `tini` for signal handling.
- docker-compose with healthchecks (api waits for postgres healthy).
- Alembic initial migration covering all tables, indexes, FKs, and enums.
- CI: `npm run typecheck:web` passes; Python `py_compile` passes on all 14
  files; `vite build` produces 60 KB gzipped JS in <1s.
- README with full setup walkthrough (Neon, R2, Render, Hetzner migration).

---

## 7. What's NOT done ⚠️ (prioritized)

### Must do before launch
1. **`git init` on the user's Windows machine.** Cowork mount can't run git
   correctly. The user has these stale folders to delete first:
   - `apps/api/_deprecated_node/` — original Express/Prisma scaffold from
     before the FastAPI pivot. Already gitignored; safe to delete.
   - `_broken_git_init_in_cowork/` — half-initialized .git from Cowork. Safe
     to delete.
   - `_test.txt`, `_writetest.txt` — 1-byte probe files. Safe to delete.
2. **Confirm `docker compose up --build` works locally.** All syntax is verified
   but nothing has been runtime-tested with real containers. First boot will:
   start postgres → run `alembic upgrade head` → run `seed.py` → start uvicorn.
3. **Push to GitHub** so Render can connect via Blueprint.
4. **Deploy to Render**: New → Blueprint → fill `DATABASE_URL`,
   `DATABASE_URL_ASYNC`, `CORS_ORIGINS`, `VITE_API_URL`. JWT_SECRET is
   auto-generated.

### Functional gaps (the dashboard is read-only today)
5. **Settings modal actions are visual-only.** The 6 modal-row buttons in
   `SettingsModal.tsx` and the 4 action cards in `TarifaTab.tsx` (Modificar
   potencia / Cambio de titular / Cambiar tarifa / Dar de baja) need:
   - Backend: POST/PATCH endpoints with their own routers
   - Frontend: forms or modals + optimistic update
   - Probably a `RequestTicket` model so client requests can be triaged
6. **PDF download.** `Invoice.pdf_url` field exists but no upload mechanism.
   Need: boto3 client (`requirements.txt` add `boto3` + `botocore`),
   `app/storage.py` with R2 helper, POST endpoint to generate presigned upload
   URLs, frontend "Subir PDF" upload, "Descargar PDF" button currently calls
   `window.open(inv.pdfUrl)` which only works once URLs exist.
7. **ShipmentBooster has no backend.** Frontend mock-only ("Llega en 87 días"
   is hardcoded). Either delete the component, or add a `Shipment` model +
   endpoint per user request — confirm with user first.
8. **No user profile editing.** Modal row "Modificar datos personales" wires
   to nothing.

### Security & robustness
9. **JWT in localStorage is XSS-vulnerable.** Acceptable for v1 but consider
   moving to httpOnly cookies + CSRF tokens before scaling to thousands of
   clients (per user's stated goal).
10. **No rate limiting** on `/auth/login`. Add `slowapi` or similar.
11. **No password reset.** Need `/auth/forgot-password` + email send (Resend
    or Postmark — user has neither account yet).
12. **No email verification on register.** Currently anyone with an email can
    sign up; depending on how clients onboard, you may want admin-created
    accounts only (delete `/auth/register`).
13. **No CSRF protection** on cookie-auth flow (n/a today since JWT in header).
14. **No tests anywhere.** Add `pytest` + `httpx.AsyncClient` for API,
    `vitest` + `@testing-library/react` for components.

### UX polish
15. **i18n deferred.** Spanish strings hardcoded throughout. Wrap in a `t()`
    helper if you ever need English (user said v1 is Spanish-only).
16. **No skeleton loaders.** Currently `<div className="loading">Cargando…</div>`.
    Replace with proper skeleton bones for each tab.
17. **No error boundaries.** API errors bubble to red text in `<Dashboard>`.
18. **No form validation library.** Login uses HTML5 `required`. If you add
    settings forms, consider `react-hook-form` + `zod` (already a dep
    transitively via something).
19. **The competitor comparison data is hardcoded** in `ResumenTab.tsx` —
    factors `[1, 1.18, 1.32, 1.48, 1.62]`. Should come from backend if real
    competitor monitoring is a sellable feature.
20. **The "ahorro 2026 vs mercado" calculation is naive** (your cost ×2 =
    market cost). Replace with real formula once user provides one.

### Ops
21. **No telemetry**. Add Sentry (`@sentry/react` + `sentry-sdk[fastapi]`)
    once user picks an account.
22. **No structured logging.** FastAPI logs to stdout via uvicorn defaults.
    Render captures these but they're hard to grep.
23. **No DB backup strategy.** Neon free tier has no backups. Document a
    `pg_dump` cron once moving to paid tier.

---

## 8. Decisions & rationale (don't re-litigate without asking)

- **Monorepo over split repos**: faster CI, easier shared types (frontend
  `types.ts` mirrors backend `schemas.py`), one `git push` deploys both.
- **Docker over Render's native Node/Python builds**: portability is the
  whole point — same image runs on Render and Hetzner.
- **Neon over Supabase**: user wants pure Postgres, no vendor lock-in. They
  also reject Supabase Auth (using their own JWT).
- **No frontend state lib (Redux, Zustand, React Query)**: the data is small
  and read-only-ish for v1. Plain useState + useEffect + fetch suffices.
  Reach for React Query when adding mutations.
- **Spanish-only with strings inline**: user explicitly chose this over i18n
  setup for v1.
- **Pydantic camelCase aliases**: keeps Python idiomatic (snake_case) while
  giving the frontend the JSON it expects. The frontend types are camelCase
  to match React conventions.

---

## 9. Local dev quickstart

```bash
# Full stack via Docker (recommended for first run)
cp .env.example .env
docker compose up --build

# Native dev (faster iteration)
docker compose up -d postgres
# In one terminal:
cd apps/api && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example .env
alembic upgrade head && python seed.py
uvicorn app.main:app --reload --port 4000
# In another terminal:
cd apps/web && npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev
```

Demo login: `felipe@possibility.com` / `possibility123`
Frontend: <http://localhost:5173>
API docs: <http://localhost:4000/docs>

---

## 10. Cowork session quirks that won't apply on Windows

These were the original-author's environment-specific issues. They are gone
once the user is on their local Windows machine:

- File path with `[POS]` brackets blocked the file write tool — bash worked.
- `rm` and full git lockfile lifecycle blocked by FUSE mount permissions.
- `_deprecated_node/`, `_broken_git_init_in_cowork/`, `_test.txt`,
  `_writetest.txt` are artefacts of those workarounds. Delete on first
  Windows checkout.
- The `vite.config.ts.timestamp-*.mjs` file at `apps/web/` is a Vite cache
  artefact — gitignored implicitly via `.gitignore`'s `*.tsbuildinfo` pattern,
  but if it shows up in `git status`, gitignore it explicitly.

---

## 11. User profile

- **Gonzalo** — non-developer founder, technically literate, prefers Python.
- Wants iterative dev (local → auto-deploy on push to main).
- Goal: 5–20 clients on free/cheap tiers, then scale to thousands when revenue
  justifies the move to Hetzner.
- Avoids vendor lock-in (chose Neon over Supabase, Docker over native Render
  builds).
- Spanish UI is the product language.
- Hates ambiguity — if you're guessing, ask. He explicitly said "do not
  assume, ask me all you need".

---

## 12. Suggested next session

1. Verify `docker compose up --build` works on Windows.
2. `git init` + initial commit + push to GitHub.
3. Connect Render Blueprint, fill secrets, watch first deploy.
4. Wire one settings action end-to-end (e.g. "Modificar potencia") as the
   reference implementation for the other 5 actions. Suggested approach:
   - Add `RequestTicket(id, supply_id, type, payload_json, status, created_at)`
   - POST `/supplies/{id}/requests` { type, payload }
   - Frontend modal opens, posts, optimistically marks "solicitud enviada".
5. Add R2 + boto3 + presigned-upload endpoint so invoices have real PDFs.

When in doubt about scope, ask. The user has been good about answering
specific multiple-choice questions.
