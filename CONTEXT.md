# CONTEXT.md — handoff for the next agent

> You are taking over an in-progress project. Read this top-to-bottom before
> editing or running anything. The user (Gonzalo) is non-developer-friendly
> but technically literate; he wants iterative local dev with auto-deploy to
> Render and the ability to migrate to Hetzner later. Don't second-guess the
> stack choices below — they were debated and locked in.

---

## 1. Project at a glance

**Possibility® Área Cliente** — Spanish-language energy invoice management
SaaS. Two frontends, one backend:

- `app.possibility.es` (clients) — energy dashboard. The visual design is
  fixed by `Template.html` at the repo root.
- `pipe.possibility.es` (admin) — onboarding + user management for Gonzalo.
- One FastAPI service serves both, role-gated.

---

## 2. Stack (locked-in)

| Layer | Choice | Why |
|---|---|---|
| Frontend (clients) | Vite + React 18 + TS — `apps/web` | SPA, deploys as static site |
| Frontend (admin) | Vite + React 18 + TS — `apps/admin` | Separate app for `pipe.possibility.es`, smaller client bundle, isolated auth |
| Backend | FastAPI + SQLAlchemy 2 (async) + Alembic | User pivoted from Express/Prisma mid-build (Python familiarity) |
| Auth | JWT (HS256) + bcrypt via passlib | Single users table, `role` column gates ADMIN vs CLIENT |
| ORM | SQLAlchemy 2.0 with `Mapped[]` typed mappings | Async via asyncpg |
| Migrations | Alembic | 0001_initial + 0002_admin_and_ocr |
| DB | Postgres 16 | Neon in prod, local container in dev |
| Object storage | Cloudflare R2 | S3-compatible — env templated, **NOT yet wired** |
| OCR | Python module at `apps/api/app/ocr/extractor.py` | **STUB — returns mock data**. Real implementation lives here. |
| Deploy | Render (Docker), 3-service blueprint | User's accounts: GitHub, Render, Neon, Cloudflare (all GitHub-OAuth-linked) |
| CI | GitHub Actions: parallel api/web/admin lint + docker matrix | Portability via GHCR images |
| Local dev | `docker compose up` (postgres + api + web + admin) | Same Dockerfiles run on Render and (eventually) Hetzner |

---

## 3. Architecture

```
                                              ┌──────────────────────┐
                                              │  Cloudflare R2       │
                                              │  (invoice PDFs)      │
                                              │  ⚠ env templated     │
                                              └────────┬─────────────┘
                                                       │
  Browser (client)  ──HTTPS──> nginx (apps/web)  ─────►│
                                                       │ Bearer JWT
  Browser (admin)   ──HTTPS──> nginx (apps/admin) ────►│
                                                       ▼
                                FastAPI (apps/api, uvicorn :4000)
                                  │ /auth, /supplies (clients)
                                  │ /admin/* (role==ADMIN gate)
                                  ▼
                                Postgres (Neon prod, container dev)
```

**Repo layout**:

```
apps/web/                Vite + React + TS — clients (app.possibility.es)
  src/
    pages/               Login, Dashboard
    components/          Header, HeroBanner, ResumenTab, ConsumoTab,
                         FacturasTab, TarifaTab, SettingsModal, ShipmentBooster
    lib/                 api.ts, auth.tsx (incl. impersonation receiver)
    types.ts, index.css
  Dockerfile, nginx.conf

apps/admin/              Vite + React + TS — admin (pipe.possibility.es)
  src/
    pages/               Login, ClientsList, NewClientWizard (4 steps),
                         ClientDetail, SupplyDetail
    components/          Layout (sidebar shell), PdfDropzone,
                         OcrReviewTable, TempPasswordCard
    lib/                 api.ts, auth.tsx, format.ts
    types.ts, index.css  (separate design system w/ sidebar layout)
  Dockerfile, nginx.conf

apps/api/                FastAPI backend
  app/
    main.py              CORS + router includes
    config.py, db.py
    models.py            SQLAlchemy: User, Supply, Tariff, Invoice, Consumption
    schemas.py           Pydantic v2 with camelCase serialization aliases
    security.py          hash/verify password, create/decode JWT, generate_temp_password
    deps.py              get_current_user, get_current_admin (role gate)
    ocr/                 ⚠ STUB — replace extract_invoice() with real OCR
    routers/             auth.py (public), supplies.py (clients), admin.py (admin-only)
  alembic/versions/      0001_initial.py, 0002_admin_and_ocr.py
  seed.py                Idempotent: creates 1 admin + 1 client (Felipe) + 3 supplies
  Dockerfile, requirements.txt

.github/workflows/       ci.yml (3-service matrix), deploy.yml (push to GHCR)
docker-compose.yml       Local stack (postgres + api + web + admin)
render.yaml              3 Render services: possibility-api, -web, -admin
.env.example             All env vars documented
Template.html            Original client-dashboard design reference
```

---

## 4. Data model

5 entities. Migrations are the source of truth — keep `app/models.py` in sync
when editing either.

```
User (role: ADMIN | CLIENT, is_active, must_change_password)
  ▶ Supply (alias, address, zone, type, contracted_power, cups, supplier)
       ▶ Tariff (1:1, optional)
       ▶ Invoice (number, period, amount, status, supplier, raw_ocr JSON, pdf_url)
       ▶ Consumption (year+month unique, total_kwh, hourly_profile JSON[])
```

Frontend expects **camelCase JSON** — Pydantic schemas use
`Field(serialization_alias="...")`. Don't break this convention; the TS types
in both `apps/web/src/types.ts` and `apps/admin/src/types.ts` rely on it.

---

## 5. API endpoints

### Public / client (read-only data)
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/auth/register` | Self-signup (consider disabling for production — see "what's NOT done") |
| POST | `/auth/login` | Returns `{ token, user }` |
| GET | `/auth/me` | Bearer required |
| GET | `/supplies` | Logged-in user's own supplies |
| GET | `/supplies/{id}` | Full detail (tariff + invoices + consumption) |
| GET | `/supplies/{id}/invoices` | Invoices only |
| GET | `/supplies/{id}/consumption` | Consumption history |
| GET | `/supplies/{id}/tariff` | Tariff details |

### Admin (`/admin/*`, role==ADMIN required)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/clients` | List with `suppliesCount` + `lastInvoiceAt` |
| POST | `/admin/clients` | Returns `{ user, tempPassword }` — admin shows it to client |
| GET | `/admin/clients/{id}` | Full client detail |
| PATCH | `/admin/clients/{id}` | Update name/email/isActive |
| DELETE | `/admin/clients/{id}` | Soft delete (sets `is_active=false`) |
| POST | `/admin/clients/{id}/supplies` | Create supply for a client |
| PATCH | `/admin/supplies/{supply_id}` | Update supply |
| DELETE | `/admin/supplies/{supply_id}` | Cascade-deletes invoices+consumption |
| POST | `/admin/supplies/{supply_id}/ocr-preview` | Multipart upload → OCR → preview WITHOUT saving |
| POST | `/admin/supplies/{supply_id}/invoices/bulk` | Save admin-confirmed invoices |
| POST | `/admin/clients/{id}/impersonate` | Returns short-lived JWT (1h, with `impersonator` claim) |
| POST | `/admin/clients/{id}/reset-password` | Returns new `{ tempPassword }` |

### Impersonation flow (already wired)
1. Admin clicks "Ver como cliente" in `apps/admin/ClientDetail`.
2. Frontend calls `/admin/clients/{id}/impersonate` → gets a JWT with
   `impersonator: <admin_id>` claim and 1h expiry.
3. Admin app opens `apps/web` with `?impersonation=TOKEN` in URL.
4. Client app's `auth.tsx` consumes the param, stores token, strips URL.
5. Client app shows a black banner: "Estás viendo esta cuenta como
   administrador (sesión de 1h)."

---

## 6. What's done ✅

### Backend
- All 5 models + 2 Alembic migrations applied automatically on container start.
- JWT auth (login, register, me) with bcrypt password hashing.
- `get_current_admin` dependency gates all `/admin/*` routes by role.
- Admin endpoints: full CRUD on clients (with soft-delete), supplies create/
  update/delete, OCR preview (multipart upload), bulk invoice import (with
  duplicate-by-number skip), impersonation token issuance, password reset.
- OCR adapter stub at `app/ocr/extractor.py` with documented integration
  contract; `is_stub()` returns True so the admin UI shows a warning banner.
- Seed: 1 admin + 1 client (Felipe) + 3 supplies + 12 months consumption +
  5 invoices each.

### Client app (apps/web)
- All 4 dashboard tabs match the template 1:1.
- Login + JWT in localStorage + protected routes.
- **Impersonation receiver** wired in `auth.tsx` — auto-consumes
  `?impersonation=TOKEN` URL param on first load.
- Banner in `Header.tsx` when impersonation is active.

### Admin app (apps/admin)
- Sidebar layout shell.
- Login (rejects role!=ADMIN with "Esta cuenta no tiene permisos…").
- Clients list with search filter + supplies-count + last-invoice-at columns.
- **4-step new-client wizard**: client info → temp-password reveal + first
  supply form → PDF dropzone + editable OCR review table → success page with
  temp-password copy button.
- Client detail: edit, soft-delete, reset password, view-as-client, supplies
  table.
- Supply detail: standalone PDF upload + OCR review (for adding more
  invoices to existing supplies later).
- Stub-mode warning banner ("⚠ El módulo OCR aún está en modo placeholder")
  shown when `OcrPreview.isStub === true`.

### Infrastructure
- Multi-stage Dockerfiles for all 3 services (Python 3.12-slim API, Node→
  nginx for web and admin).
- `docker-compose.yml`: postgres (healthcheck) + api + web (:5173) + admin
  (:5174).
- `render.yaml`: 3 services with autoDeploy + Frankfurt region. Admin
  service has a comment about adding `pipe.possibility.es` as a custom
  domain after first deploy.
- CI: parallel `api-lint` (ruff + mypy), `web-lint`, `admin-lint`, then
  docker-build matrix with GHCR cache scoped per service.
- Deploy workflow: pushes images to `ghcr.io/<repo>/{api,web,admin}:{sha,latest}`.

### Verification done
- All Python files compile (`py_compile`).
- Both frontends typecheck (`tsc --noEmit`) clean.
- Both frontends build (`vite build`): web 60 KB gzipped, admin 79 KB.

---

## 7. What's NOT done ⚠️ (prioritized)

### Must do before launch
1. **`git init` on Windows.** Cowork mount can't run git correctly. Stale
   folders to delete first: `apps/api/_deprecated_node/` (Express scaffold
   pre-pivot), `_broken_git_init_in_cowork/`, `_test.txt`, `_writetest.txt`.
2. **Confirm `docker compose up --build` works.** First boot runs `alembic
   upgrade head` then `python seed.py`.
3. **Push to GitHub** so Render Blueprint can connect.
4. **Deploy 3 Render services** (api, web, admin). Fill secrets per `render.yaml`.
5. **Add `pipe.possibility.es` custom domain** in Render dashboard for the
   admin service. Update Cloudflare DNS CNAME. Render auto-provisions SSL.
6. **CORS origins** in api env: must include both client and admin domains.

### Replace the OCR stub
7. The integration point is `apps/api/app/ocr/extractor.py` —
   `extract_invoice(pdf_bytes: bytes) -> OcrResult`. The OcrResult dataclass
   has all the fields we map to the Invoice model; supplier-specific extras
   go into `extra_fields` and are persisted as `Invoice.raw_ocr` JSON.
   When you replace it, also flip `is_stub()` to return False — the admin UI
   reads this to decide whether to show the warning banner.

### Functional gaps
8. **Settings modal client-side actions are still visual-only** (in
   `apps/web/src/components/SettingsModal.tsx`): "Modificar potencia",
   "Cambio de titular", "Cambiar tarifa", "Otra petición", "Dar de baja".
   These need a `RequestTicket` model + admin queue.
9. **Admin doesn't have a way to create a supply outside the wizard.** The
   `ClientDetail` page has a placeholder "+ Añadir suministro" button that
   alerts. Wire it to a modal that POSTs `/admin/clients/{id}/supplies`.
10. **No way to edit an invoice after import.** Add `PATCH /admin/invoices/{id}`
    + edit UI in `SupplyDetail`.
11. **PDF storage to R2.** R2 env vars are templated but no boto3 client
    exists. Add `boto3` to requirements.txt, `app/storage.py` with
    presigned-upload helper, store the URL on `Invoice.pdf_url`. The OCR
    preview endpoint currently reads bytes but doesn't persist the PDF.
12. **Audit log of admin actions.** User opted out for v1 but it's worth
    building before clients see real money.
13. **Tariff and Consumption are not populated from OCR yet.** The OCR
    schema has fields for them (`price_per_kwh`, `total_kwh`, etc.) but the
    bulk-import endpoint only saves Invoice rows. When real OCR returns these,
    extend `bulk_import_invoices` to upsert Tariff and create Consumption rows.

### Security
14. **`/auth/register` is public** — anyone with the API URL can sign up.
    Consider disabling it (admin-only client creation) before launch.
15. **JWT in localStorage** is XSS-vulnerable. Acceptable for v1; move to
    httpOnly cookies + CSRF before scaling.
16. **No rate limiting** on `/auth/login` or `/admin/clients/{id}/impersonate`.
17. **No password reset flow for clients** (admin can reset; client can't
    self-serve). Add when you have email infra.
18. **Email infra (zero)** — `must_change_password` flag exists but the UI
    doesn't enforce a password change on first login yet. Add a "set new
    password" interstitial.

### UX polish
19. **No skeleton loaders** anywhere — just "Cargando…" text.
20. **No optimistic updates** — all mutations refetch.
21. **No form validation library** — admin uses HTML5 + manual checks.
22. **Spanish hardcoded** (deferred i18n).

### Ops
23. **No telemetry/Sentry/structured logs.**
24. **No DB backup** — Neon free tier has none. Document a `pg_dump` cron
    when going to paid Neon.

---

## 8. Decisions & rationale

- **Two separate Vite apps** instead of one app with `/admin` routes: clean
  bundle separation, can deploy admin to its own subdomain without exposing
  admin code to clients, simpler auth gating.
- **Single Users table with role column** instead of separate AdminUser
  table: less code, one auth flow, impersonation is trivial.
- **Temp password shown to admin** instead of magic-link email: zero email
  infra needed for v1. Admin pastes via WhatsApp/in-person.
- **Impersonation via short-lived JWT in URL hash**: works across
  subdomains without cookie-cross-domain complications, 1h expiry limits
  blast radius, `impersonator` claim is trivial to log later.
- **OCR as a swap-in module**: lets the system be fully clickable with
  mock data while the real OCR is finalized. Don't refactor the OCR
  contract — just replace the function body.
- **Pydantic camelCase aliases**: keeps Python idiomatic, gives frontend
  the JSON it expects.

---

## 9. Local dev quickstart

```bash
cp .env.example .env
docker compose up --build
```

- Client app: <http://localhost:5173> · login `felipe@possibility.com` / `possibility123`
- Admin app: <http://localhost:5174> · login `admin@possibility.com` / `possibility-admin`
- API docs: <http://localhost:4000/docs>

Native dev (faster reload):
```bash
docker compose up -d postgres
# Terminal 1
cd apps/api && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp ../../.env.example .env
alembic upgrade head && python seed.py
uvicorn app.main:app --reload --port 4000

# Terminal 2
cd apps/web && npm install && npm run dev

# Terminal 3
cd apps/admin && npm install && npm run dev
```

---

## 10. Cowork session quirks (won't apply on Windows)

- **The FUSE mount intermittently truncated files mid-write** during heavy
  disk activity (npm install). I had to rewrite ~10 files multiple times.
  This won't happen on a normal filesystem. If a file looks weirdly short,
  check the end with `tail`.
- **`rm` and `git init` lockfiles fail** — the mount denies `unlink` on
  some operations. The user runs git on Windows.
- **Quarantined cruft** to delete on Windows checkout: `_deprecated_node/`,
  `_broken_git_init_in_cowork/`, `_test.txt`, `_writetest.txt`. All are
  gitignored already.
- **`vite build` can't empty an existing `dist/`** in this mount. If the user
  ever sees that, `rm -rf apps/web/dist` then rebuild.

---

## 11. User profile

- **Gonzalo** — non-developer founder, technically literate, prefers Python.
- Wants iterative dev (local → auto-deploy on push to main).
- Goal: 5–20 clients on free/cheap tiers, then scale to thousands when
  revenue justifies a Hetzner move.
- Avoids vendor lock-in (chose Neon over Supabase, Docker over native
  Render builds, separate apps over a monolith).
- Spanish UI is the product language.
- **Hates ambiguity — if you're guessing, ask.** He explicitly said "do not
  assume, ask me all you need". When in doubt, use the AskUserQuestion tool.
- Has accounts: GitHub, Render, Neon, Cloudflare (all OAuth-linked via
  GitHub).
- Has a working OCR (Python script) ready to drop into
  `apps/api/app/ocr/extractor.py` — currently a stub returning mock data.

---

## 12. Suggested next session

1. Verify `docker compose up --build` works on Windows.
2. `git init` + push to GitHub.
3. Connect Render Blueprint, fill secrets per `render.yaml`.
4. Add `pipe.possibility.es` custom domain on Render's admin service +
   Cloudflare DNS CNAME.
5. Drop the real OCR module into `apps/api/app/ocr/extractor.py`, flip
   `is_stub()` to False.
6. Onboard a real client end-to-end via the wizard. Verify temp password
   flow actually works (client logs in, dashboard renders).
7. Wire R2 PDF upload (boto3 + presigned URLs) so invoices store the source
   PDF.
8. Wire the settings-modal "Modificar potencia / Cambiar tarifa / etc."
   actions through a `RequestTicket` model + admin queue.

When in doubt about scope, ask. The user has been good about answering
multiple-choice questions.
