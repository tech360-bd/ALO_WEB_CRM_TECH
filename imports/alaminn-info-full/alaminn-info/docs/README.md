<!--
  Title: Alaminn.info — Project Overview
  Canonical Stack: Next.js 16 · React 19 · TypeScript · PostgreSQL 17 · Prisma · Redis · BullMQ · Auth.js · Caddy · systemd · Ubuntu 24.04 LTS
  Last Updated: 2025
  Audience: Engineers, operators, contributors
-->

# Alaminn.info — Project Overview

> Premium executive authority platform for **Al Aminn**: a single Next.js 16 application
> hosting the executive website, the Higher Study platform, the English Learning platform,
> and the Admin portal (Command Center) — backed by PostgreSQL 17, Redis, and BullMQ.

This document is the entry point for the project documentation. It describes the product,
the canonical stack, how to run the project locally and in production, and links to every
related document in the `docs/` tree.

---

## Table of Contents

1. [What Is Alaminn.info?](#1-what-is-alaminninfo)
2. [Feature Surface](#2-feature-surface)
3. [Canonical Stack](#3-canonical-stack)
4. [Repository Layout](#4-repository-layout)
5. [Local Quick Start](#5-local-quick-start)
6. [Production Quick Start](#6-production-quick-start)
7. [Configuration Model](#7-configuration-model)
8. [Documentation Index](#8-documentation-index)
9. [Conventions](#9-conventions)
10. [Glossary](#10-glossary)

---

## 1. What Is Alaminn.info?

Alaminn.info is a multi-surface production platform with four logical products running
inside one Next.js application:

| Surface | Route prefix | Purpose |
|---|---|---|
| Executive website | `/` | Al Aminn's authority site — 13 homepage sections, articles, case studies, projects, impact records, contact, newsletter, legal pages. |
| Higher Study | `/higher-study` | Universities, courses, scholarships, PhD research, supervisors, resources, destinations, intakes, events, student stories, compare tools, eligibility checker. |
| English Learning | `/english-learning` | Courses, lessons, practice tests, questions, tutors, resources, progress tracking, eligibility quiz, referral program. |
| Admin portal (Command Center) | `/admin` | CRM (contacts, inquiries, opportunities, meetings), AI Workspace (tasks + approvals), content management, audit logs, user management, analytics, settings. |

The platform is built on a **single canonical stack** (see §3). There is no SQLite, no
MySQL, no PM2, no Nginx, no Apache, no cPanel in the production path. The legacy artifacts
that referenced those technologies have been retired in the v6 rebuild.

---

## 2. Feature Surface

### 2.1 Executive Website

- **Hero** with the Operating Constellation animation and live status indicators.
- **Credibility Signal Bar** — 8 capability labels.
- **Executive Introduction** — 7-stage Vision→Growth flow + People/Process/Technology/Data pillars.
- **Expertise** — capabilities grid with skills radar.
- **Work System** — operating model diagram.
- **Case Studies** — filterable case study cards.
- **Impact** — quantified outcomes with stats ticker.
- **Insights / Articles** — published articles with markdown rendering.
- **Ecosystem** — ALO Labs, ALO Education, Tech360.
- **Resources** — downloadable resources.
- **Testimonials**, **FAQ**, **Newsletter**, **Contact Finale**, **Work With Me**, **Profile**.

### 2.2 Higher Study Platform

- Searchable university / course / scholarship directories with verified badges.
- PhD research area and supervisor discovery.
- Compare tools for universities, courses, and scholarships.
- Eligibility checker, application guide, book-consultation flow.
- Destinations (countries → cities), intakes calendar, events, student stories.
- Saved items (per-session), referral program, alerts.

### 2.3 English Learning Platform

- Course catalog with lessons and progress tracking.
- Practice tests with timed question runner and auto-grading.
- Tutor directory with booking flow.
- Resources library, eligibility quiz, referral program.
- Enrollment and progress persistence per learner.

### 2.4 Admin Command Center

- **Dashboard** — KPIs (inquiries, pipeline, articles, contacts, pending AI, newsletter).
- **CRM** — contacts, inquiries, opportunities, meetings, tasks, notes, documents.
- **AI Workspace** — AI tasks queue, approvals (approve / reject / request revision).
- **Content** — articles, resources, projects, case studies, impact records, newsletter.
- **Partnerships** — organizations, partnerships, student referrals.
- **Security** — audit logs, security settings, integration settings, user management.
- **Settings** — site settings, SEO, media library, analytics.

---

## 3. Canonical Stack

The v6 rebuild standardizes on a single, opinionated stack. Every doc in this tree assumes
this stack. If you find a reference to a different technology, treat it as legacy and
follow the canonical stack instead.

| Layer | Technology | Notes |
|---|---|---|
| Runtime | **Node.js 22 LTS** | Single runtime for app + worker. |
| Framework | **Next.js 16** (standalone output) | React 19, App Router, Server Components. |
| Language | **TypeScript 5** | Strict mode. |
| Styling | **Tailwind CSS 4** | `@tailwindcss/postcss`, `tw-animate-css`. |
| UI primitives | **shadcn/ui** (Radix-based) | See `src/components/ui/`. |
| Animation | **Framer Motion 12** | Used sparingly, respects `prefers-reduced-motion`. |
| Database | **PostgreSQL 17** | Single canonical database — no SQLite, no MySQL. |
| ORM | **Prisma 6** | One `prisma/schema.prisma`, versioned migrations. |
| Cache / queues / sessions | **Redis 7** | Used for BullMQ, rate limiting, session cache, hot caches. |
| Background worker | **BullMQ 5** | Replaces all standalone mini-services. |
| Auth | **Auth.js (NextAuth) v5** | JWT strategy, RBAC + permissions, MFA-ready. |
| Reverse proxy / TLS | **Caddy 2** | Automatic HTTPS via Let's Encrypt. NOT Nginx, NOT Apache. |
| Process manager | **systemd** | Two units: `alaminn-info-web.service`, `alaminn-info-worker.service`. NOT PM2. |
| OS | **Ubuntu 24.04 LTS** | Deployment target. |
| Object storage | **S3-compatible** (e.g. MinIO, Cloudflare R2, AWS S3) | For media uploads and backups. |
| Logging | **Pino** | Structured JSON logs to journald. |
| Email | **nodemailer** (SMTP) or Resend | Via `src/lib/email/`. |
| Forms / validation | **react-hook-form** + **zod 4** | Both client and server. |
| AI | **z-ai-web-dev-sdk** | AI tasks and approvals in the Command Center. |
| Testing | **vitest 4** + **Playwright** | Unit, integration, E2E. |

---

## 4. Repository Layout

```
my-project/
├── docs/                          # ← this documentation tree
│   ├── README.md                  # project overview (you are here)
│   ├── DEPLOY.md                  # canonical Ubuntu 24.04 deployment
│   ├── ARCHITECTURE.md            # system architecture & request flow
│   ├── SECURITY.md                # threat model, auth, hardening
│   ├── DATABASE.md                # PostgreSQL 17 + Prisma
│   ├── API.md                     # API standardization & endpoint index
│   ├── ENVIRONMENT.md             # every env var documented
│   ├── BACKUP.md                  # backup strategy
│   ├── RESTORE.md                 # restore procedure
│   ├── OPERATIONS.md              # day-to-day ops runbook
│   ├── TROUBLESHOOTING.md         # common issues & fixes
│   ├── TESTING.md                 # test strategy
│   ├── MIGRATION-TO-POSTGRESQL.md # SQLite/MySQL → PG migration
│   ├── ROLE-PERMISSION-MATRIX.md  # 11 roles × resources × actions
│   └── CHANGELOG.md               # [Unreleased] v6 rebuild
├── src/
│   ├── app/                       # Next.js App Router (pages + route handlers)
│   │   ├── api/v1/                # versioned API surface
│   │   ├── admin/                 # Command Center
│   │   ├── higher-study/          # Higher Study platform
│   │   ├── english-learning/      # English Learning platform
│   │   └── (public)/              # executive website pages
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── site/                  # executive website components
│   │   ├── admin/                 # Command Center components
│   │   ├── higher-study/          # Higher Study components
│   │   └── english-learning/      # English Learning components
│   └── lib/
│       ├── env.ts                 # centralized, validated env access
│       ├── config/env.ts          # structured config builder
│       ├── auth.ts                # Auth.js session handling
│       ├── rbac.ts                # roles + permissions (source of truth)
│       ├── db.ts                  # Prisma client singleton
│       ├── redis.ts               # Redis client singleton
│       ├── logger.ts              # Pino structured logger
│       ├── observability.ts       # metrics + tracing helpers
│       ├── email/                 # email transport + templates + queue
│       ├── admin-api.ts           # shared admin route helpers
│       ├── higher-study/          # Higher Study domain logic
│       └── english-learning/      # English Learning domain logic
├── prisma/
│   ├── schema.prisma              # single canonical schema (55 models)
│   ├── migrations/                # versioned SQL migrations
│   ├── seed.ts                    # base seed
│   ├── seed-higher-study.ts       # Higher Study seed
│   └── seed-english-learning.ts   # English Learning seed
├── deploy/
│   ├── systemd/                   # alaminn-info-web.service, alaminn-info-worker.service
│   ├── caddy/                     # Caddyfile (site block + reverse_proxy)
│   └── env/                       # production env templates
├── scripts/                       # operational scripts (backup, verify, seed)
├── tests/                         # vitest unit + integration, playwright E2E
├── server.js                      # production entry (graceful shutdown)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── worklog.md                     # project history (append-only)
```

---

## 5. Local Quick Start

### 5.1 Prerequisites

- **Node.js 22 LTS** (check with `node -v`)
- **pnpm** or **npm** (npm is used in all examples)
- **PostgreSQL 17** running locally (or Docker: `docker run -d --name pg17 -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17`)
- **Redis 7** running locally (or Docker: `docker run -d --name redis7 -p 6379:6379 redis:7`)
- **git**

### 5.2 Steps

```bash
# 1. Clone
git clone <your-repo-url> alaminn-info
cd alaminn-info

# 2. Install dependencies (postinstall runs prisma generate)
npm install

# 3. Create local .env from the example
cp .env.example .env
# Edit .env: set DATABASE_URL, REDIS_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL

# 4. Apply schema + seed
npx prisma migrate dev --name init
npm run db:seed

# 5. Start the dev server (port comes from .env PORT, default 3001)
npm run dev

# 6. (Optional) Start the BullMQ worker in a second terminal
npm run worker
```

Open `http://localhost:${PORT}` (default `http://localhost:3001`). The admin portal is at
`/admin/login`. The default seeded admin credentials are in `prisma/seed.ts`.

### 5.3 Useful npm scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server. |
| `npm run build` | Production standalone build (`output: 'standalone'`). |
| `npm run start` | Start the standalone production server. |
| `npm run worker` | Start the BullMQ worker process. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Run vitest once. |
| `npm run test:watch` | Vitest watch mode. |
| `npm run test:coverage` | Vitest with coverage. |
| `npm run db:migrate:deploy` | Apply pending migrations (production). |
| `npm run db:seed` | Run the base seed. |
| `npm run db:backup` | Run the backup script. |
| `npm run db:restore` | Run the restore script. |

---

## 6. Production Quick Start

The full production deployment is documented in **[DEPLOY.md](./DEPLOY.md)**. The
condensed version:

1. Provision an **Ubuntu 24.04 LTS** server with a non-root sudo user.
2. Install Node.js 22, PostgreSQL 17, Redis 7, Caddy 2.
3. Create the database and a dedicated role:

   ```bash
   sudo -u postgres psql <<'SQL'
   CREATE ROLE alaminn_info WITH LOGIN PASSWORD '${PG_PASSWORD}' CREATEDB;
   CREATE DATABASE alaminn_info OWNER alaminn_info;
   SQL
   ```

4. Clone the repo, install dependencies, build the standalone bundle.
5. Configure `/etc/alaminn-info/env` with production secrets (see **ENVIRONMENT.md**).
6. Install the systemd units from `deploy/systemd/` and start them:

   ```bash
   sudo systemctl enable --now alaminn-info-web.service
   sudo systemctl enable --now alaminn-info-worker.service
   ```

7. Install the Caddy site block from `deploy/caddy/Caddyfile` and reload Caddy:

   ```bash
   sudo systemctl reload caddy
   ```

8. Run migrations and seed:

   ```bash
   sudo -u alaminn-info /usr/bin/npm run db:migrate:deploy
   sudo -u alaminn-info /usr/bin/npm run db:seed
   ```

9. Verify — see the verification checklist in **DEPLOY.md §Verify**.

---

## 7. Configuration Model

The platform follows a **zero-hardcoding** configuration principle:

- **No domains, ports, paths, or secrets are hardcoded** in source files.
- Every runtime value is read from the environment via `src/lib/env.ts` (and
  `src/lib/config/env.ts` for structured config).
- The app **refuses to start in production** if required secrets are missing or too short.
- In development, missing secrets fall back to safe dev values with a console warning.

See **[ENVIRONMENT.md](./ENVIRONMENT.md)** for the complete variable reference.

### 7.1 The secure bootstrap pattern

`src/lib/env.ts` is the **only** module permitted to read `process.env` directly. Every
other module imports the validated `env()` object. This guarantees:

1. Every variable access is typed and documented in one place.
2. Production requirements are enforced at boot, not at first use.
3. Tests can call `_resetEnv()` to re-evaluate the environment between cases.

---

## 8. Documentation Index

| Document | What it covers |
|---|---|
| **[README.md](./README.md)** | This file — overview, stack, quick start. |
| **[DEPLOY.md](./DEPLOY.md)** | Canonical Ubuntu 24.04 deployment, step-by-step. |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System diagram, request flow, service boundaries, BullMQ design, auth flow. |
| **[SECURITY.md](./SECURITY.md)** | Threat model, Auth.js, RBAC, CSRF, rate limiting, CSP, headers, secrets, uploads, audit. |
| **[DATABASE.md](./DATABASE.md)** | PostgreSQL 17 setup, 55-model Prisma schema, migrations, seed, backup/restore, indexes, pooling. |
| **[API.md](./API.md)** | Response formats, auth headers, pagination, filtering, rate limits, endpoint groups. |
| **[ENVIRONMENT.md](./ENVIRONMENT.md)** | Every env var: name, purpose, required/optional, example, validation rule. |
| **[BACKUP.md](./BACKUP.md)** | `pg_dump` + S3 sync, retention, encryption, systemd timer, verification. |
| **[RESTORE.md](./RESTORE.md)** | Restore procedure: stop app, restore DB, restore uploads, verify, smoke test. |
| **[OPERATIONS.md](./OPERATIONS.md)** | Logs (journalctl), health checks, metrics, queue monitoring, restart, rollback, scaling. |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Common issues table with diagnosis + fix. |
| **[TESTING.md](./TESTING.md)** | Unit (vitest), integration (vitest + test DB), E2E (Playwright), coverage targets. |
| **[MIGRATION-TO-POSTGRESQL.md](./MIGRATION-TO-POSTGRESQL.md)** | Migrating existing SQLite/MySQL data into PostgreSQL 17. |
| **[ROLE-PERMISSION-MATRIX.md](./ROLE-PERMISSION-MATRIX.md)** | 11 roles × all resources × actions (allow/deny). |
| **[CHANGELOG.md](./CHANGELOG.md)** | `[Unreleased]` — v6 rebuild (PostgreSQL, Auth.js, BullMQ, Caddy/systemd, zero-hardcoding). |

---

## 9. Conventions

### 9.1 Branching & commits

- `main` is always deployable.
- Feature branches: `feat/<short-slug>`, fix branches: `fix/<short-slug>`,
  docs branches: `docs/<short-slug>`.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`,
  `refactor:`, `test:`).

### 9.2 Code style

- TypeScript strict mode; no `any` without an inline justification comment.
- ESLint + Prettier enforced via `eslint.config.mjs`.
- Server-only logic lives under `src/lib/` and is never imported by client components.
- Database access is **only** through Prisma (`src/lib/db.ts`). No raw SQL except in
  migrations and the migration helper scripts.

### 9.3 API versioning

- All HTTP API routes live under `/api/v1/...`.
- Breaking changes require a new version (`/api/v2/...`) and a deprecation period.

### 9.4 Environment-driven examples

All command examples in these docs use placeholders:

| Placeholder | Meaning |
|---|---|
| `${APP_URL}` | The public site URL (e.g. `https://alaminn.example`). |
| `${PORT}` | The port the Next.js server listens on (default `3001`). |
| `${DB_NAME}` | The PostgreSQL database name (e.g. `alaminn_info`). |
| `${DB_USER}` | The PostgreSQL role. |
| `${DB_PASSWORD}` | The PostgreSQL role password. |
| `${REDIS_URL}` | The Redis connection URL. |
| `${S3_BUCKET}` | The S3-compatible bucket name. |
| `your-domain.example` | Placeholder domain — replace with your real domain. |

Never copy a command verbatim without substituting these placeholders.

---

## 10. Glossary

- **Command Center** — the admin portal at `/admin` (CRM, AI Workspace, content, security).
- **Higher Study** — the higher-education platform at `/higher-study`.
- **English Learning** — the English-language learning platform at `/english-learning`.
- **BullMQ worker** — the background process that consumes Redis-backed queues (email,
  notifications, audit, scheduled jobs). Replaces the legacy mini-services.
- **Standalone build** — Next.js `output: 'standalone'` produces a self-contained
  `.next/standalone/server.js` that runs under plain `node` without a full `node_modules`.
- **Zero-hardcoding** — no domain, port, path, or secret is ever written literally in
  source; everything flows through `src/lib/env.ts`.

---

*For the project history, see `worklog.md` at the repository root (append-only). For the
changelog of the v6 rebuild, see [CHANGELOG.md](./CHANGELOG.md).*
