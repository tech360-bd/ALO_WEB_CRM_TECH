# DEVELOPMENT.md — Al Aminn Info Platform

> **The single source of truth for every file, every script, every command, every environment variable.**
> If a word is missing here, it is missing nowhere — this document exhaustively covers the entire codebase.

**Project**: `alaminn.info` — Premium executive authority platform for Al Aminn (Next.js 16 standalone production build)
**Version**: 1.0.0
**Stack**: Next.js 16.1.3 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Prisma 6 (SQLite) · Bun 1.3.14
**Default admin**: `admin@alaminn.info` / `(set via ADMIN_BOOTSTRAP_PASSWORD env var)

---

## Table of Contents

1. [Quick Start (5 Minutes)](#1-quick-start-5-minutes)
2. [Tech Stack & Why](#2-tech-stack--why)
3. [Project Structure — Every Directory Explained](#3-project-structure--every-directory-explained)
4. [Every File Explained](#4-every-file-explained)
5. [Environment Variables](#5-environment-variables)
6. [Database — Schema, Seed, Backup, Restore](#6-database--schema-seed-backup-restore)
7. [Authentication & RBAC](#7-authentication--rbac)
8. [Mini-Services](#8-mini-services)
9. [The Gateway (Caddy)](#9-the-gateway-caddy)
10. [API Route Reference](#10-api-route-reference)
11. [Admin Panel Guide](#11-admin-panel-guide)
12. [Public Pages Guide](#12-public-pages-guide)
13. [Styling System](#13-styling-system)
14. [Scripts Reference](#14-scripts-reference)
15. [Tests](#15-tests)
16. [Deployment — Local, cPanel, Docker, PM2, systemd](#16-deployment--local-cpanel-docker-pm2-systemd)
17. [Cron Jobs & Background Workers](#17-cron-jobs--background-workers)
18. [Security Checklist](#18-security-checklist)
19. [Troubleshooting](#19-troubleshooting)
20. [Developer Workflow](#20-developer-workflow)
21. [File-by-File Inventory (Counts)](#21-file-by-file-inventory-counts)

---

## 1. Quick Start (5 Minutes)

```bash
# 1. Clone / unzip into your workspace
cd alaminn-info

# 2. Install dependencies (Bun is required — see below)
bun install

# 3. Configure environment
cp .env .env.local            # or just edit .env directly in dev
# Edit .env — set AUTH_SECRET (see §5)

# 4. Initialize the database
bun run db:push               # Pushes schema.prisma → SQLite file
bun run db:seed               # Seeds 250+ rows of authoritative data

# 5. Start the dev server
bun run dev                   # http://localhost:3000
```

**First admin login**:
- URL: `http://localhost:3000/admin/login`
- Email: `admin@alaminn.info`
- Password: `(set via ADMIN_BOOTSTRAP_PASSWORD env var)
- **Change the password immediately** at `/admin/settings`.

**Install Bun** (if not present):
- macOS/Linux: `curl -fsSL https://bun.sh/install | bash`
- Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`
- Verify: `bun --version` → `1.3.x` or newer

---

## 2. Tech Stack & Why

| Layer | Technology | Why this choice |
|---|---|---|
| Framework | **Next.js 16.1.3 (App Router, Turbopack)** | React 19 support, server components, route handlers, file-based routing. |
| Runtime | **Bun 1.3.14** | 3× faster install than npm/yarn. Native TypeScript execution. Drop-in for Node. |
| Language | **TypeScript 5 (strict)** | Type safety end-to-end. Build fails on type errors. |
| Styling | **Tailwind CSS 4** | Utility-first, JIT-compiled, zero unused CSS in production. |
| UI Kit | **shadcn/ui (New York style)** | Copy-owned components, no black-box library. Built on Radix UI primitives. |
| Icons | **lucide-react** | Tree-shakeable, 1500+ icons, consistent stroke. |
| Animation | **Framer Motion 12** | Layout animations, exit transitions, scroll-triggered reveals. |
| Database | **Prisma 6 + SQLite** | Type-safe ORM. SQLite for zero-config dev. Swap to PostgreSQL by changing `DATABASE_URL`. |
| Auth | **Custom HMAC session cookies** | No external service. 11-role RBAC. `src/lib/auth.ts`. |
| State | **Zustand (client) + TanStack Query (server)** | Lightweight, no boilerplate. |
| Forms | **React Hook Form + Zod** | Type-safe validation, performant. |
| Email | **Nodemailer (SMTP) or Resend** | Pluggable transport. Dev falls back to console.log. |
| Charts | **Recharts** | Composable, responsive, themeable. |
| Testing | **Vitest 4 + Testing Library** | Jest-compatible API, native ESM, fast. |
| Lint | **ESLint 9 + eslint-config-next** | Next.js best practices + accessibility rules. |
| Deployment | **Standalone build + PM2/systemd/Docker** | `output: "standalone"` produces a self-contained `server.js`. |

---

## 3. Project Structure — Every Directory Explained

```
alaminn-info/
├── .env                          ← Environment variables (NEVER commit)
├── .env.example                  ← Template (committed)
├── .gitignore                    ← Ignores node_modules, .next, db/custom.db, etc.
├── .htaccess                     ← Apache config (for cPanel/OLS deployments)
├── Caddyfile                     ← Local gateway :81 → :3000 (sandbox dev)
├── Dockerfile                    ← Multi-stage production image
├── docker-compose.yml            ← Container orchestration
├── README.md                     ← Short project summary
├── DEVELOPMENT.md                ← THIS FILE
├── package.json                  ← Dependencies + scripts
├── bun.lock                      ← Bun lockfile
├── next.config.ts                ← Next.js config (standalone output, image opts)
├── tsconfig.json                 ← TypeScript config (strict, paths)
├── tailwind.config.ts            ← Tailwind theme (orange accent, no indigo/blue)
├── postcss.config.mjs            ← PostCSS (Tailwind plugin)
├── eslint.config.mjs             ← ESLint flat config
├── components.json               ← shadcn/ui config (New York style)
├── server.js                     ← Production entrypoint (uses NEXT_APP_DIR)
├── start-prod.sh                 ← Shell wrapper to start production
├── vitest.config.ts              ← Vitest setup (jsdom env, setup file)
├── next-env.d.ts                 ← Next.js ambient types (auto-generated)
├── check-db.mjs                  ← Quick DB sanity check script
│
├── prisma/                       ← Database schema & seeders
│   ├── schema.prisma             ← 55 models, 1285 lines
│   ├── seed.ts                   ← Master seeder (calls all sub-seeders)
│   ├── seed-higher-study.ts      ← UK/USA/Canada/Australia/Germany/Netherlands
│   ├── seed-countries-extra.ts   ← 24 more countries (Ireland…Malta)
│   ├── seed-english-learning.ts  ← Courses, lessons, tests, tutors
│   └── migrations/               ← Prisma migration history (rarely used — db:push)
│
├── src/                          ← APPLICATION SOURCE
│   ├── app/                      ← Next.js App Router (pages + API routes)
│   │   ├── layout.tsx            ← Root layout (HTML, fonts, metadata, ThemeProvider)
│   │   ├── page.tsx              ← Homepage
│   │   ├── globals.css           ← Tailwind import + theme tokens + global styles
│   │   ├── error.tsx             ← App-level error boundary
│   │   ├── global-error.tsx      ← Root-level error boundary (no layout)
│   │   ├── loading.tsx           ← App-level loading skeleton
│   │   ├── not-found.tsx         ← 404 page
│   │   ├── icon.tsx              ← Dynamic favicon (generates /icon.svg)
│   │   ├── apple-icon.tsx        ← Apple touch icon
│   │   ├── manifest.ts           ← PWA manifest (/manifest.webmanifest)
│   │   ├── robots.ts             ← /robots.txt (disallow /admin, /api/)
│   │   ├── sitemap.ts            ← /sitemap.xml (167 URLs)
│   │   ├── about/                ← About page
│   │   ├── contact/              ← Contact page + form component
│   │   ├── case-studies/         ← Case studies list + detail
│   │   ├── articles/             ← Articles list + detail
│   │   ├── projects/             ← Projects list + detail
│   │   ├── expertise/            ← Expertise page
│   │   ├── impact/               ← Impact page
│   │   ├── media/                ← Media page
│   │   ├── legal/                ← /legal/privacy, /legal/terms
│   │   ├── ecosystem/            ← /ecosystem, /ecosystem/alo-education, etc.
│   │   ├── higher-study/         ← Higher Study platform (40+ routes)
│   │   ├── english-learning/     ← English Learning platform (15+ routes)
│   │   ├── admin/                ← Admin panel (32 pages — see §11)
│   │   └── api/                  ← API routes (see §10)
│   │
│   ├── components/
│   │   ├── ui/                   ← 48 shadcn/ui primitives (button, card, dialog…)
│   │   ├── site/                 ← Public-site components (navbar, footer, sections)
│   │   │   └── sections/         ← 20 homepage sections (hero, faq, insights…)
│   │   ├── higher-study/         ← Higher Study UI components (cards, filters…)
│   │   ├── english-learning/     ← English Learning UI components
│   │   └── admin/                ← Admin UI components (shell, crud-list, dialog…)
│   │
│   ├── hooks/                    ← Custom React hooks
│   ├── lib/                      ← Business logic, DB client, auth, email, RBAC
│   │   ├── db.ts                 ← Prisma Client singleton
│   │   ├── auth.ts               ← HMAC session cookies, login/logout
│   │   ├── rbac.ts               ← 11 roles × permissions matrix
│   │   ├── env.ts                ← Validated env config
│   │   ├── email/                ← Email transport, templates, queue
│   │   ├── higher-study/         ← Higher Study helpers (constants, rate-limit, seo)
│   │   └── english-learning/     ← English Learning helpers
│   │
│   ├── proxy.ts                  ← Next.js 16 middleware (security headers, rate limit)
│   └── instrumentation.ts        ← OpenTelemetry / startup hooks
│
├── mini-services/                ← Independent Bun services (each own port)
│   ├── _shared/                  ← Shared shims (bun-shim, db-shim)
│   ├── ai-worker/                ← Port 3006 — Polls AiTask, calls z-ai-web-dev-sdk
│   ├── audit-worker/             ← Port 3003 — Async audit log flushing
│   ├── email-worker/             ← Port 3002 — Email queue processor
│   ├── health-monitor/           ← Port 3004 — Periodic /api/health/deep checks
│   └── notification-service/     ← Port 3005 — Push notification dispatcher
│
├── public/                       ← Static assets served at /
│   └── brand/                    ← Logos, og images, brand assets
│
├── scripts/                      ← CLI utilities (run with `bun run` or `npx tsx`)
│   ├── backup-db.ts              ← SQLite backup
│   ├── restore-db.ts             ← SQLite restore
│   ├── verify-db.ts              ← DB integrity check
│   ├── security-tests.ts         ← Auth/RBAC/security test suite
│   ├── generate-blur-placeholders.ts
│   ├── generate-modern-images.ts ← WebP/AVIF conversion
│   ├── seed-admin.ts             ← Create/reset admin user
│   ├── backup.sh / restore.sh    ← Shell wrappers
│   ├── verify-backup.sh
│   ├── verify-production.sh
│   ├── install-server.sh         ← Server provisioning
│   └── deploy-cyberpanel.sh      ← CyberPanel deployment
│
├── deploy/                       ← Deployment configs
│   ├── alaminn-info.service      ← systemd unit
│   ├── ecosystem.pm2.cjs         ← PM2 ecosystem
│   ├── nginx-alaminn-info.conf   ← Nginx reverse proxy
│   ├── ols-vhost.conf            ← OpenLiteSpeed vhost
│   ├── mariadb-init.sql          ← MySQL/MariaDB init (if migrating off SQLite)
│   ├── deploy.sh / install.sh    ← One-shot deploy scripts
│   └── cpanel/                   ← cPanel-specific scripts
│
├── docs/                         ← Project documentation (45 files)
│   ├── ARCHITECTURE.md           ← System architecture
│   ├── DEPLOY.md                 ← Deployment guide
│   ├── SECURITY.md               ← Security checklist
│   ├── api.md                    ← API reference
│   ├── database.md               ← Schema reference
│   ├── backup-restore.md
│   ├── disaster-recovery.md
│   ├── environment.md
│   ├── deployment.md
│   ├── security.md
│   ├── security-report.md
│   ├── screenshots/              ← 7 page screenshots
│   └── deliverables/             ← 20+ deliverable reports
│
├── tests/                        ← Vitest test suite
│   ├── api/                      ← API integration tests
│   ├── lib/                      ← Library unit tests
│   ├── unit/                     ← Misc unit tests
│   └── setup.ts                  ← Vitest setup (jsdom, mocks)
│
├── examples/
│   └── websocket/                ← Socket.io reference (frontend + server)
│
├── storage/                      ← Runtime storage (gitignored)
│   ├── backups/                  ← DB backups
│   ├── exports/                  ← CSV/PDF exports
│   ├── logs/                     ← App logs
│   └── temporary/                ← Temp uploads
│
├── db/                           ← Database file location
│   └── custom.db                 ← SQLite DB (gitignored)
│
├── skills/                       ← Z.ai SDK skills (gitignored — installed by SDK)
├── download/                     ← Sandbox download folder (gitignored)
├── upload/                       ← Sandbox upload folder (gitignored)
├── agent-ctx/                    ← Agent handoff context (gitignored)
├── tool-results/                 ← Sandbox tool results (gitignored)
└── .zscripts/                    ← Sandbox helper scripts (gitignored)
```

---

## 4. Every File Explained

### 4.1 Root config files

| File | Purpose |
|---|---|
| `.env` | Environment variables — `DATABASE_URL`, `AUTH_SECRET`, `SMTP_*`, etc. **NEVER commit.** |
| `.env.example` | Template showing every supported env var. Commit this. |
| `.gitignore` | Ignores `node_modules`, `.next`, `db/*.db`, `.env*`, `dist`, `tool-results/`, `agent-ctx/`, `download/`, `upload/`, `.zscripts/`, `skills/`, log files. |
| `.dockerignore` | Same as `.gitignore` but for Docker build context. |
| `.htaccess` | Apache config — redirects, security headers, gzip. Used by cPanel/OLS deployments. |
| `Caddyfile` | Local sandbox gateway — listens on `:81`, proxies to `:3000` (or to `?XTransformPort=N` for mini-services). |
| `Dockerfile` | Multi-stage build → slim Node runtime running `server.js`. |
| `docker-compose.yml` | Orchestration: app + persistent volumes + restart policy. |
| `package.json` | Dependencies, scripts (see §14). |
| `bun.lock` | Bun lockfile — pins exact versions for reproducible installs. |
| `next.config.ts` | `output: "standalone"`, `reactStrictMode: false`, image optimization (AVIF/WebP), static asset cache headers, `optimizePackageImports` for `lucide-react`/`framer-motion`/`date-fns`. |
| `tsconfig.json` | `strict: true`, `target: ES2022`, `module: ESNext`, `jsx: preserve`, `paths: { "@/*": ["./src/*"] }`. |
| `tailwind.config.ts` | Custom theme: orange accent (`#F26113`), no indigo/blue, dark mode via `class`. |
| `postcss.config.mjs` | `@tailwindcss/postcss` plugin. |
| `eslint.config.mjs` | Flat config — `next/core-web-vitals`, `next/typescript`, accessibility rules. |
| `components.json` | shadcn/ui config — New York style, base color neutral, CSS variables. |
| `server.js` | Production entrypoint — sets `NEXT_APP_DIR` env, requires `.next/standalone/server.js`. |
| `start-prod.sh` | Shell wrapper: `NODE_ENV=production node server.js`. |
| `vitest.config.ts` | `environment: 'jsdom'`, `setupFiles: ['./tests/setup.ts']`, coverage via v8. |
| `next-env.d.ts` | Next.js ambient types — auto-generated, never edit. |
| `check-db.mjs` | Quick script: `node check-db.mjs` → prints row counts per table. |

### 4.2 `prisma/` — Database layer

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | **1285 lines, 55 models.** Defines every table, relation, index. SQLite provider. |
| `prisma/seed.ts` | Master seeder. Calls `seedHigherStudy(db)`, `seedExtraCountries(db)`, `seedEnglishLearning(db)`, plus core entities (User, Project, Article, etc.). Idempotent — safe to re-run. |
| `prisma/seed-higher-study.ts` | Seeds 6 core countries (UK, USA, Canada, Australia, Germany, Netherlands), 12 universities, 24 courses, 8 scholarships. |
| `prisma/seed-countries-extra.ts` | Seeds 24 additional countries (Ireland → Malta) with 26 fields each of real authoritative data (tuition, visas, work rights, official URLs). |
| `prisma/seed-english-learning.ts` | Seeds 6 EL courses, 4 practice tests + 24 questions, 4 tutors, 6 resources. |
| `prisma/migrations/` | Prisma migration SQL files. Rarely used in dev (`db:push` is preferred). |

**55 models**: `User`, `Contact`, `Organization`, `Inquiry`, `Opportunity`, `Partnership`, `StudentReferral`, `Task`, `Note`, `NewsletterSubscriber`, `Project`, `Article`, `Resource`, `ImpactRecord`, `CaseStudy`, `AiTask`, `AiApproval`, `AuditLog`, `SystemHealth`, `MeetingRequest`, `AnalyticsEvent`, `Document`, `Notification`, `Setting`, `MediaAsset`, `HigherStudyCountry`, `HigherStudyCity`, `HigherStudyUniversity`, `HigherStudySubject`, `HigherStudyIntake`, `HigherStudyCourse`, `HigherStudyScholarship`, `HigherStudyResearchArea`, `HigherStudyResearchProject`, `HigherStudySupervisor`, `HigherStudyResource`, `HigherStudyStudentStory`, `HigherStudyEvent`, `HigherStudySavedItem`, `HigherStudyComparison`, `HigherStudyReferral`, `HigherStudyAlert`, `HigherStudyAuditLog`, `HigherStudyImportJob`, `EnglishLearningCourse`, `EnglishLearningLesson`, `EnglishLearningPracticeTest`, `EnglishLearningQuestion`, `EnglishLearningTutor`, `EnglishLearningResource`, `EnglishLearningEnrollment`, `EnglishLearningProgress`, `EnglishLearningReferral`, `EnglishLearningAuditLog`, `EnglishLearningSetting`.

### 4.3 `src/app/` — Pages & API routes

#### Public pages
| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Homepage — 20 sections (hero, expertise, case studies, insights, FAQ, etc.) |
| `/about` | `about/page.tsx` | About Al Aminn |
| `/contact` | `contact/page.tsx` + `contact-form.tsx` | Contact form (POST → `/api/v1/inquiries`) |
| `/case-studies` + `/[slug]` | `case-studies/` | Case study list + detail |
| `/articles` + `/[slug]` | `articles/` | Article list + detail |
| `/projects` + `/[slug]` | `projects/` | Project list + detail |
| `/expertise` | `expertise/page.tsx` | Expertise areas |
| `/impact` | `impact/page.tsx` | Impact metrics |
| `/media` | `media/page.tsx` | Media kit |
| `/legal/privacy` | `legal/privacy/page.tsx` | Privacy policy |
| `/legal/terms` | `legal/terms/page.tsx` | Terms of service |
| `/ecosystem` + `/alo-education` + `/alo-labs` + `/tech360` | `ecosystem/` | Ecosystem subsites |

#### Higher Study platform (`/higher-study/*`)
40+ routes including: `/`, `/universities`, `/universities/[slug]`, `/universities/[slug]/courses`, `/universities/[slug]/research`, `/universities/[slug]/scholarships`, `/universities/uk`, `/global-universities`, `/uk-universities`, `/courses`, `/courses/[slug]`, `/scholarships`, `/scholarships/[slug]`, `/destinations`, `/destinations/[countrySlug]`, `/destinations/[countrySlug]/[citySlug]`, `/subjects`, `/subjects/[slug]`, `/research`, `/research/[slug]`, `/resources`, `/resources/[slug]`, `/supervisors`, `/supervisors/[slug]`, `/intakes`, `/intakes/[slug]`, `/compare`, `/compare/universities`, `/compare/courses`, `/compare/scholarships`, `/saved`, `/eligibility-check`, `/apply`, `/book-consultation`, `/application-guide`, `/phd-research`, `/study-resources`, `/course-finder`, plus `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.

#### English Learning platform (`/english-learning/*`)
15+ routes including: `/`, `/courses`, `/courses/[slug]`, `/practice-tests`, `/practice-tests/[slug]`, `/tutors`, `/tutors/[slug]`, `/resources`, `/resources/[slug]`, `/progress`, `/apply`, `/eligibility-check`, `/book-tutor`, `/book-consultation`, plus `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.

#### Admin panel (`/admin/*`)
32 pages — see §11 for the full list.

#### API routes (`/api/*`)
150+ routes — see §10 for the full reference.

#### Special files
| File | Purpose |
|---|---|
| `layout.tsx` | Root layout — `<html>`, `<body>`, fonts (Inter + Playfair Display), `ThemeProvider` (next-themes), `AnalyticsInit`, `JsonLd`, `manifest` metadata, canonical URL. |
| `globals.css` | Tailwind import + CSS variables for light/dark themes + global focus-visible style (orange outline) + custom scrollbar. |
| `error.tsx` | App-level error boundary — shows friendly error UI. |
| `global-error.tsx` | Root error boundary — replaces `<html>` when even the root layout fails. |
| `loading.tsx` | App-level Suspense fallback. |
| `not-found.tsx` | 404 page. |
| `icon.tsx` | Generates `/icon` (favicon) dynamically via `ImageResponse`. |
| `apple-icon.tsx` | Generates `/apple-icon` (180×180). |
| `manifest.ts` | Generates `/manifest.webmanifest` for PWA. |
| `robots.ts` | Generates `/robots.txt` — allows all, disallows `/admin`, `/admin/*`, `/api/`. |
| `sitemap.ts` | Generates `/sitemap.xml` — 167 URLs (all public pages + 30 country destinations + 12 universities + 24 courses + 8 scholarships + …). |

### 4.4 `src/components/`

#### `ui/` — 48 shadcn/ui primitives
`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `sonner` (toast), `spinner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle-group`, `toggle`, `tooltip`, `use-toast`.

All installed via `npx shadcn@latest add <component>`. Configuration in `components.json`.

#### `site/` — Public site components
| File | Purpose |
|---|---|
| `navbar.tsx` | Top nav — logo, menu, theme toggle, search trigger, CTA button. Sticky. |
| `footer.tsx` | Footer — link columns, social, newsletter. `mt-auto` for sticky-to-bottom. |
| `public-chrome.tsx` | Layout wrapper for public pages — navbar + `<main id="main-content">` + footer + skip-to-content link. |
| `site-chrome.tsx` | Alternate chrome for the homepage. |
| `search-palette.tsx` | Cmdk-powered search overlay (Cmd+K). |
| `command-center.tsx` + `command-center-bridge.tsx` | Quick-actions palette (admin shortcuts). |
| `detail-modal.tsx` | Generic modal for previewing content. |
| `schedule-meeting-modal.tsx` | Meeting booking modal. |
| `legal-modals.tsx` | Privacy/Terms consent modals. |
| `json-ld.tsx` | Injects JSON-LD structured data. |
| `analytics-init.tsx` | Client-side analytics tracker. |
| `constellation.tsx` | Animated background constellation effect. |
| `scroll-utilities.tsx` | Scroll-to-top, scroll-progress bar. |
| `pwa/register-sw.tsx` | Service worker registration (production only). |

#### `site/sections/` — 20 homepage sections
`alo-labs`, `audience-pathways`, `case-studies`, `contact-finale`, `ecosystem`, `executive-intro`, `expertise`, `faq`, `hero`, `impact`, `insights`, `newsletter`, `profile`, `resources`, `section-primitives`, `skills-radar`, `testimonials`, `verification`, `work-system`, `work-with-me`.

#### `higher-study/` — 26 Higher Study components
Cards (course, university, scholarship, research, supervisor, resource), filters, search bar, compare button, save button, eligibility checker, consultation form, page hero, breadcrumb, pagination, loading skeleton, empty state, tabs, verification badge, layout shell.

#### `english-learning/` — 18 English Learning components
Cards (course, practice-test, tutor, lesson, resource), filters, eligibility quiz, test runner, progress dashboard, newsletter subscribe, referral CTA, breadcrumb, pagination, loading skeleton, empty state, hero search, apply CTA.

#### `admin/` — 7 admin components
| File | Purpose |
|---|---|
| `admin-shell.tsx` | Authenticated layout — sidebar nav (21 items), topbar, breadcrumb, mobile sheet menu, sign-out. |
| `crud-list.tsx` | Generic CRUD list with table, search, filters, pagination, bulk actions, create/edit dialog. |
| `resource-dialog.tsx` | Create/Edit resource modal — works with any Prisma model. |
| `upload-button.tsx` | File upload trigger — calls `/api/v1/admin/uploads`. |
| `page-primitives.tsx` | Page header, section card, stat tile. |
| `lib.ts` | Shared admin utilities (column formatters, action handlers). |

### 4.5 `src/lib/` — Business logic

| File | Purpose |
|---|---|
| `db.ts` | Prisma Client singleton. In dev, logs queries; in prod, optimized. |
| `auth.ts` | HMAC-signed session cookies. `createSession()`, `verifySession()`, `requireAuth()`, `requirePermission()`. Cookie name: `alaminn_session`. TTL: 7 days. |
| `rbac.ts` | 11 roles: `super_admin`, `admin`, `editor`, `author`, `higher_study_manager`, `english_learning_manager`, `partnership_manager`, `analyst`, `viewer`, `ai_approver`, `newsletter_manager`. Each role maps to a set of permissions (e.g. `higher_study.countries.write`). |
| `env.ts` | Centralized env access. Throws in production if `AUTH_SECRET` < 32 bytes or `EMAIL_FROM` missing. |
| `logger.ts` | Structured logger — `[INFO]`, `[WARN]`, `[ERROR]`, `[DEBUG]` with timestamps. Respects `NODE_ENV`. |
| `observability.ts` | OpenTelemetry hooks (spans for DB queries, API routes). |
| `request-context.ts` | AsyncLocalStorage for per-request context (user, IP, traceId). |
| `shutdown.ts` | Graceful shutdown — drains connections, flushes logs. |
| `analytics.ts` | Server-side analytics event ingestion. |
| `csv.ts` | CSV serialization (proper escaping, BOM, headers). |
| `cron-auth.ts` | Validates CRON_SECRET header for `/api/cron/*` routes. |
| `utm.ts` | UTM parameter parser for attribution. |
| `site-data.ts` | Static site config (nav items, footer links, social URLs). |
| `admin-api.ts` | Helpers for admin API routes (pagination, filtering, sorting). |
| `blur-placeholders.ts` | Generates base64 blur placeholders for images. |
| `email/index.ts` | Email public API — `sendEmail()`, `sendTemplate()`. |
| `email/transport.ts` | SMTP or Resend transport selection. Dev: console.log. |
| `email/templates.ts` | React Email templates (welcome, reset-password, inquiry-received, etc.). |
| `email/layout.tsx` | Shared email layout (header, footer, styling). |
| `email/queue.ts` | In-memory email queue (production: backed by email-worker mini-service). |
| `higher-study/constants.ts` | COUNTRIES_MAP, SUBJECTS_LIST, IntakeSchedule, etc. |
| `higher-study/types.ts` | TypeScript types for Higher Study entities. |
| `higher-study/api-helpers.ts` | List/detail fetchers with filters + pagination. |
| `higher-study/admin-helpers.ts` | Admin CRUD helpers. |
| `higher-study/admin-factory.ts` | Factory for generating admin CRUD API routes. |
| `higher-study/integration.ts` | Cross-entity integration (university → courses → scholarships). |
| `higher-study/rate-limit.ts` | Rate limiter for public Higher Study endpoints. |
| `higher-study/seo.ts` | SEO metadata generators for Higher Study pages. |
| `english-learning/*` | Mirror of `higher-study/*` for the English Learning platform. |

### 4.6 `src/proxy.ts` (Next.js 16 middleware)

Next.js 16 renamed `middleware.ts` → `proxy.ts`. This file:
- Applies security headers on **all routes** (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS in production).
- Rate-limits `/api/v1/auth/forgot-password` and `/api/v1/auth/reset-password` (5 requests / 15 min / IP).
- Sets `X-Request-ID` header for tracing.

### 4.7 `src/instrumentation.ts`

OpenTelemetry instrumentation — registers spans for HTTP requests, DB queries, custom events. Only active in production.

### 4.8 `src/hooks/`

Custom React hooks:
- `use-debounce.ts` — Debounced value hook.
- `use-media-query.ts` — Responsive breakpoint hook.
- `use-mounted.ts` — SSR-safe mounted flag.

---

## 5. Environment Variables

All env vars are read via `src/lib/env.ts`. **Never use `process.env` directly** outside that file.

### Required (dev + prod)

| Var | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | SQLite path. For PostgreSQL: `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | `2f8b9c4e7a1d6b3e9f5a8c2d4e6b1a9f3e7d2c5b8a4e1f6d9c3b7a2e5f8d1c4` | HMAC secret for session cookies. **Must be ≥ 32 bytes.** Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_SITE_URL` | `https://alaminn.info` | Public site URL (no trailing slash). Used for sitemap, OG tags, emails. |
| `NODE_ENV` | `development` / `production` | Controls cookie security, logging, build mode. |

### Optional (dev has safe defaults)

| Var | Default | Purpose |
|---|---|---|
| `AUTH_TRUST_HOST` | `true` | Trust X-Forwarded-Host header (behind reverse proxy). |
| `SMTP_HOST` | `null` | SMTP server hostname. |
| `SMTP_PORT` | `587` | SMTP port. |
| `SMTP_USER` | `null` | SMTP username. |
| `SMTP_PASS` | `null` | SMTP password. |
| `EMAIL_FROM` | `Al Aminn <hello@alaminn.info>` | Default From address. **Required in production.** |
| `EMAIL_REPLY_TO` | `= EMAIL_FROM` | Reply-To address. |
| `RESEND_API_KEY` | `null` | Resend API key (alternative to SMTP). |
| `CRON_SECRET` | `null` | Shared secret for `/api/cron/*` routes. If unset, cron routes are disabled. |

### `.env` file (dev)

```bash
DATABASE_URL=file:/home/z/my-project/db/custom.db
AUTH_SECRET=<REPLACE_WITH_openssl_rand_hex_32>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_SITE_URL=https://alaminn.info
NODE_ENV=development

# Email transport (optional in dev — falls back to console.log)
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_USER=your-smtp-user
# SMTP_PASS=your-smtp-password
# EMAIL_FROM="Al Aminn <hello@alaminn.info>"
# EMAIL_REPLY_TO="Al Aminn <support@alaminn.info>"
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### `.env` file (production)

```bash
DATABASE_URL=file:/var/lib/alaminn-info/data.db
AUTH_SECRET=<64-char hex from `openssl rand -hex 32`>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_SITE_URL=https://alaminn.info
NODE_ENV=production
EMAIL_FROM="Al Aminn <hello@alaminn.info>"
EMAIL_REPLY_TO="Al Aminn <support@alaminn.info>"

# Configure ONE of the two email transports:
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
# OR
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Cron job secret (set if you enable cron routes)
CRON_SECRET=<another 64-char hex>
```

---

## 6. Database — Schema, Seed, Backup, Restore

### Commands

```bash
bun run db:push        # Push schema.prisma → SQLite (creates/updates tables)
bun run db:generate    # Regenerate Prisma Client (after schema changes)
bun run db:validate    # Validate schema syntax
bun run db:seed        # Seed all data (idempotent — safe to re-run)
bun run db:backup      # Backup DB to storage/backups/<timestamp>.db
bun run db:restore     # Restore from latest backup (interactive)
bun run db:verify      # Verify DB integrity (row counts, foreign keys)
```

### Schema overview

55 models across 4 domains:
1. **Core platform** (15 models): User, Contact, Organization, Inquiry, Opportunity, Partnership, StudentReferral, Task, Note, NewsletterSubscriber, Project, Article, Resource, ImpactRecord, CaseStudy.
2. **AI workflow** (2 models): AiTask, AiApproval.
3. **Higher Study** (17 models): HigherStudyCountry, HigherStudyCity, HigherStudyUniversity, HigherStudySubject, HigherStudyIntake, HigherStudyCourse, HigherStudyScholarship, HigherStudyResearchArea, HigherStudyResearchProject, HigherStudySupervisor, HigherStudyResource, HigherStudyStudentStory, HigherStudyEvent, HigherStudySavedItem, HigherStudyComparison, HigherStudyReferral, HigherStudyAlert, HigherStudyAuditLog, HigherStudyImportJob.
4. **English Learning** (10 models): EnglishLearningCourse, EnglishLearningLesson, EnglishLearningPracticeTest, EnglishLearningQuestion, EnglishLearningTutor, EnglishLearningResource, EnglishLearningEnrollment, EnglishLearningProgress, EnglishLearningReferral, EnglishLearningAuditLog, EnglishLearningSetting.
5. **Cross-cutting** (8 models): AuditLog, SystemHealth, MeetingRequest, AnalyticsEvent, Document, Notification, Setting, MediaAsset.

### Migration to PostgreSQL (production)

The schema is database-agnostic. To switch:
1. Install PostgreSQL: `bun add pg @prisma/adapter-pg`.
2. Change `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`.
3. Change `DATABASE_URL` to `postgresql://...`.
4. `bun run db:push`.

### Backup strategy

- **Automated**: `bun run db:backup` runs daily via cron (see `scripts/backup.sh`).
- **Manual**: `bun run scripts/backup-db.ts`.
- **Storage**: `storage/backups/YYYY-MM-DD-HHMMSS.db`.
- **Retention**: Last 30 backups kept; older auto-deleted.
- **Verify**: `bun run scripts/verify-backup.sh`.

---

## 7. Authentication & RBAC

### Auth flow (custom HMAC, NOT NextAuth)

1. User submits email + password → `POST /api/v1/auth/login`.
2. Server verifies password with `bcrypt.compare()`.
3. On success, creates session: `{ userId, role, expiresAt }` → JSON → HMAC-signed with `AUTH_SECRET` → base64 → `alaminn_session` cookie (HttpOnly, SameSite=Lax, Secure in production).
4. On every request, `proxy.ts` reads the cookie, verifies HMAC, extracts session, attaches to `request.auth`.
5. API routes call `requirePermission(perm)` from `src/lib/auth.ts` to gate access.
6. Logout: `POST /api/v1/auth/logout` → clears cookie.

### Password reset flow

1. User visits `/admin/forgot-password` → enters email.
2. `POST /api/v1/auth/forgot-password` → generates token, stores `passwordResetToken` + `passwordResetExpiresAt` on User (TTL: 1 hour), emails link.
3. User clicks link → `/admin/reset-password?token=...` → enters new password.
4. `POST /api/v1/auth/reset-password` → verifies token, updates password hash, clears token.
5. Rate-limited: 5 requests / 15 min / IP.

### 11 roles

| Role | Description | Key permissions |
|---|---|---|
| `super_admin` | Full access | `*` (all) |
| `admin` | Admin access | All except role/user management |
| `editor` | Content editor | articles, projects, case-studies, resources |
| `author` | Article author | articles (own only) |
| `higher_study_manager` | Higher Study admin | higher_study.* (read + write) |
| `english_learning_manager` | English Learning admin | english_learning.* (read + write) |
| `partnership_manager` | Partnerships | contacts, inquiries, opportunities, partnerships |
| `analyst` | Read-only analytics | analytics.read, audit-logs.read |
| `viewer` | Read-only | *.read |
| `ai_approver` | AI workflow approver | ai.approve, ai.tasks.read |
| `newsletter_manager` | Newsletter admin | newsletter.* |

Permissions matrix: `src/lib/rbac.ts`. Each permission follows `{domain}.{resource}.{action}` format (e.g. `higher_study.countries.write`).

### Default admin (after seed)

```
Email:    admin@alaminn.info
Password: (set via ADMIN_BOOTSTRAP_PASSWORD env var)
Role:     super_admin
```

**Change the password immediately** at `/admin/settings` or via:
```bash
bun run scripts/seed-admin.ts --email you@example.com --password "YourStrongPassword!"
```

---

## 8. Mini-Services

Five independent Bun services, each with own `package.json` and port. They run alongside the Next.js app and handle background work.

| Service | Port | Purpose | Entry |
|---|---|---|---|
| `email-worker` | 3002 | Polls email queue, sends via SMTP/Resend, retries failed sends (exponential backoff). | `mini-services/email-worker/index.ts` |
| `audit-worker` | 3003 | Async audit log flushing — batches AuditLog writes to reduce DB contention. | `mini-services/audit-worker/index.ts` |
| `health-monitor` | 3004 | Every 60s, calls `/api/health/deep`, writes SystemHealth row, alerts on degradation. | `mini-services/health-monitor/index.ts` |
| `notification-service` | 3005 | Push notification dispatcher (web push, in-app). | `mini-services/notification-service/index.ts` |
| `ai-worker` | 3006 | Polls `AiTask` where `status="queued"`, calls z-ai-web-dev-sdk LLM, writes result, advances status to `awaiting-approval` or `delivered`. | `mini-services/ai-worker/index.ts` |

### Start a mini-service

```bash
cd mini-services/email-worker
bun install
bun run dev    # → bun --hot index.ts → listens on :3002
```

### All mini-services share

- `_shared/bun-shim.ts` — Bun-specific polyfills for Node APIs.
- `_shared/db-shim.ts` — Reads `DATABASE_URL` from parent `.env`, instantiates Prisma Client.

### Gateway access (sandbox only)

The sandbox Caddy gateway only exposes port 81. To reach a mini-service from the browser:
```ts
fetch('/api/some-route?XTransformPort=3002')
```
Caddy reads `XTransformPort` from the query string and proxies accordingly. **Never** use `http://localhost:3002` in client code.

---

## 9. The Gateway (Caddy)

`Caddyfile`:

```caddy
:81 {
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort} { ... }
    }
    handle {
        reverse_proxy localhost:3000 { ... }   # Next.js
    }
}
```

- Browser → `https://sandbox.example.com/?XTransformPort=3006` → Caddy → `localhost:3006`.
- Browser → `https://sandbox.example.com/` → Caddy → `localhost:3000` (Next.js).

**In production**, replace Caddy with Nginx (`deploy/nginx-alaminn-info.conf`) or a managed load balancer. The `XTransformPort` mechanism is sandbox-specific — production mini-services are typically internal-only (no public exposure).

---

## 10. API Route Reference

All API routes live under `src/app/api/`. Base path: `/api`.

### Health & readiness

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check — `{"success":true,"message":"Alaminn.info is operational."}` |
| GET | `/api/health/deep` | Readiness check — DB, email, auth, filesystem, env |
| GET | `/api/readiness` | Kubernetes readiness probe |
| GET | `/api` | API root — lists endpoints |

### Cron routes (require `CRON_SECRET` header)

| Path | Schedule | Description |
|---|---|---|
| `/api/cron/backup` | daily 02:00 | DB backup |
| `/api/cron/data-verification` | daily 06:00 | Verify data integrity |
| `/api/cron/email-queue` | every 5 min | Flush email queue |
| `/api/cron/health-monitor` | every 1 min | SystemHealth write |
| `/api/cron/notification-queue` | every 1 min | Flush notifications |
| `/api/cron/phd-deadlines` | daily 08:00 | PhD deadline reminders |
| `/api/cron/referral-retry` | hourly | Retry failed referrals |
| `/api/cron/scholarship-deadlines` | daily 08:00 | Scholarship deadline reminders |
| `/api/cron/session-cleanup` | hourly | Expire old sessions |
| `/api/cron/sitemap-generate` | daily 03:00 | Regenerate sitemap |
| `/api/cron/temp-cleanup` | daily 04:00 | Clean `storage/temporary/` |

### Auth (`/api/v1/auth/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | public | Login with email + password |
| POST | `/api/v1/auth/logout` | session | Clear session cookie |
| GET | `/api/v1/auth/session` | session | Get current session info |
| POST | `/api/v1/auth/forgot-password` | public (rate-limited) | Request password reset email |
| POST | `/api/v1/auth/reset-password` | public (rate-limited) | Reset password with token |

### Admin (`/api/v1/admin/*`) — all require session + permission

| Resource | Endpoints |
|---|---|
| `ai-tasks` | GET (list), POST (create), GET/`[id]` (detail), PATCH/`[id]` (update) |
| `analytics` | GET |
| `approvals` | GET, POST, GET/`[id]`, PATCH/`[id]` |
| `articles` | GET, POST, GET/`[id]`, PATCH/`[id]`, DELETE/`[id]` |
| `audit-logs` | GET, GET `/export` (CSV) |
| `case-studies` | CRUD |
| `companies` | CRUD |
| `contacts` | CRUD, GET `/export` (CSV) |
| `dashboard` | GET (KPIs, recent activity) |
| `documents` | CRUD |
| `inquiries` | GET, GET `/export` (CSV) |
| `media` | CRUD |
| `meetings` | CRUD |
| `newsletter` | CRUD, GET `/export` (CSV) |
| `notes` | CRUD |
| `notifications` | CRUD |
| `opportunities` | GET, GET `/export` (CSV) |
| `projects` | CRUD |
| `seo` | GET, PATCH |
| `settings` | GET, PATCH, POST `/test-email` |
| `tasks` | CRUD |
| `uploads` | POST (multipart, 10MB max, MIME allowlist) |
| `users` | CRUD |

### Higher Study public API (`/api/v1/higher-study/*`)

| Resource | Endpoints |
|---|---|
| `universities` | GET (list), GET/`[slug]` |
| `courses` | GET, GET/`[slug]` |
| `scholarships` | GET, GET/`[slug]` |
| `destinations` | GET, GET/`[slug]` |
| `subjects` | GET |
| `intakes` | GET, GET/`[intakeSlug]` |
| `research` | GET, GET/`[slug]` |
| `resources` | GET, GET/`[slug]` |
| `supervisors` | GET, GET/`[slug]` |
| `events` | GET |
| `student-stories` | GET |
| `compare` | POST (body: `{ids: [...]}`) |
| `eligibility-check` | POST |
| `consultation` | POST (book consultation) |
| `alerts` | GET, GET/`[id]` |
| `saved` | GET, POST, DELETE/`[id]` (requires session) |
| `referral` | POST, GET `/[code]/confirm` |
| `health` | GET |

### Higher Study admin API (`/api/v1/higher-study/admin/*`)

Full CRUD for: `countries`, `cities`, `universities`, `subjects`, `courses`, `intakes`, `scholarships`, `research-areas`, `research`, `resources`, `supervisors`, `student-stories`, `events`, `audit-logs`, `import` (+ `/[id]` status). Plus `referrals` (list) and `dashboard` (KPIs).

### English Learning public API (`/api/v1/english-learning/*`)

| Resource | Endpoints |
|---|---|
| `courses` | GET, GET/`[slug]`, GET/`[slug]/lessons` |
| `lessons` | GET/`[id]` |
| `practice-tests` | GET, GET/`[slug]`, POST `/[slug]/submit` |
| `tutors` | GET, GET/`[slug]` |
| `resources` | GET, GET/`[slug]` |
| `enroll` | POST |
| `progress` | GET, POST |
| `referral` | POST |
| `health` | GET |

### English Learning admin API (`/api/v1/english-learning/admin/*`)

Full CRUD for: `courses`, `lessons`, `practice-tests`, `questions`, `tutors`, `resources`, `audit-logs`. Plus `dashboard` (KPIs) and `referrals` (list).

### Other public APIs

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/inquiries` | Submit contact form |
| GET/POST | `/api/v1/meetings` | List/request meetings |
| GET | `/api/v1/meetings/admin` | Admin meeting list |
| POST | `/api/v1/newsletter` | Subscribe |
| GET | `/api/v1/newsletter/verify` | Verify subscription token |
| GET | `/api/v1/public/articles` | Published articles |
| GET | `/api/v1/public/projects` | Published projects |
| POST | `/api/v1/analytics/track` | Track event |
| GET | `/api/v1/ai/tasks` | List AI tasks (session) |
| GET | `/api/v1/ai/approvals` | List pending approvals (session) |

---

## 11. Admin Panel Guide

URL: `/admin` (redirects to `/admin/login` if unauthenticated).

### 32 admin pages

| Path | Page | Permission |
|---|---|---|
| `/admin` | Dashboard (KPIs, recent activity, audit log) | `dashboard.read` |
| `/admin/login` | Login form | public |
| `/admin/forgot-password` | Request reset email | public |
| `/admin/reset-password` | Reset password form | public (token-gated) |
| `/admin/analytics` | Analytics dashboard | `analytics.read` |
| `/admin/approvals` | AI approval queue | `ai.approve` |
| `/admin/articles` | Articles CRUD | `articles.read` |
| `/admin/audit-logs` | Audit log viewer | `audit-logs.read` |
| `/admin/case-studies` | Case studies CRUD | `case-studies.read` |
| `/admin/companies` | Organizations CRUD | `organizations.read` |
| `/admin/contacts` | Contacts CRUD | `contacts.read` |
| `/admin/documents` | Document manager | `documents.read` |
| `/admin/media` | Media library | `media.read` |
| `/admin/meetings` | Meeting requests | `meetings.read` |
| `/admin/newsletter` | Newsletter subscribers | `newsletter.read` |
| `/admin/notes` | Internal notes | `notes.read` |
| `/admin/notifications` | Notification center | `notifications.read` |
| `/admin/projects` | Projects CRUD | `projects.read` |
| `/admin/roles` | Role management | `roles.read` |
| `/admin/seo` | SEO settings | `seo.read` |
| `/admin/settings` | Site settings | `settings.read` |
| `/admin/tasks` | Tasks CRUD | `tasks.read` |
| `/admin/users` | User management | `users.read` |
| `/admin/ai-assistant` | AI workflow launcher | `ai.tasks.read` |
| `/admin/higher-study/countries` | Country CRUD | `higher_study.countries.read` |
| `/admin/higher-study/cities` | City CRUD | `higher_study.cities.read` |
| `/admin/higher-study/universities` | University CRUD | `higher_study.universities.read` |
| `/admin/higher-study/courses` | Course CRUD | `higher_study.courses.read` |
| `/admin/higher-study/scholarships` | Scholarship CRUD | `higher_study.scholarships.read` |
| `/admin/higher-study/subjects` | Subject CRUD | `higher_study.subjects.read` |
| `/admin/higher-study/intakes` | Intake CRUD | `higher_study.intakes.read` |
| `/admin/higher-study/research-areas` | Research area CRUD | `higher_study.research_areas.read` |
| `/admin/higher-study/research-projects` | Research project CRUD | `higher_study.research.read` |
| `/admin/higher-study/resources` | Resource CRUD | `higher_study.resources.read` |
| `/admin/higher-study/student-stories` | Student story CRUD | `higher_study.student_stories.read` |
| `/admin/higher-study/supervisors` | Supervisor CRUD | `higher_study.supervisors.read` |
| `/admin/higher-study/events` | Event CRUD | `higher_study.events.read` |
| `/admin/english-learning/courses` | EL course CRUD | `english_learning.courses.read` |
| `/admin/english-learning/lessons` | EL lesson CRUD | `english_learning.lessons.read` |
| `/admin/english-learning/practice-tests` | EL test CRUD | `english_learning.practice_tests.read` |
| `/admin/english-learning/questions` | EL question CRUD | `english_learning.questions.read` |
| `/admin/english-learning/resources` | EL resource CRUD | `english_learning.resources.read` |
| `/admin/english-learning/tutors` | EL tutor CRUD | `english_learning.tutors.read` |

### Admin shell features

- **Sidebar**: 21 nav items grouped by domain (Core, Higher Study, English Learning, AI, System).
- **Active state**: Animated orange left-accent bar + `aria-current="page"`.
- **Topbar**: Breadcrumbs, theme toggle, command center trigger, notifications, sign-out.
- **Mobile**: Slide-in sheet menu with backdrop blur.
- **Keyboard**: Every interactive element has `focus-visible:ring-2 focus-visible:ring-orange-400`.

### CRUD list component (`crud-list.tsx`)

Generic, config-driven:
- Columns defined as `{ key, label, render? }[]`.
- Filters defined as `{ key, label, options }[]`.
- Search: full-text across specified fields.
- Pagination: cursor-based, 25/page.
- Bulk actions: delete, export.
- Create/Edit dialog: auto-generated from field config.
- RBAC: respects `canCreate`, `canEdit`, `canDelete` props.

---

## 12. Public Pages Guide

### Homepage (`/`)

20 sections in this order:
1. **Hero** — Headline ("Intelligent operations for ambitious leaders"), CTA buttons, animated stats ticker.
2. **Executive Intro** — Brief about Al Aminn.
3. **Expertise** — 6 expertise areas with icons.
4. **Audience Pathways** — Tabs for different audience types.
5. **Work System** — 8-stage methodology.
6. **Skills Radar** — Animated radar chart of capabilities.
7. **Profile** — Portrait + bio.
8. **Case Studies** — 3 featured case studies.
9. **Work With Me** — Service tiers.
10. **Ecosystem** — Subsidiaries (ALO Education, ALO Labs, Tech360).
11. **Insights** — Latest articles.
12. **Resources** — Free resources.
13. **Impact** — Impact metrics.
14. **Testimonials** — Client quotes carousel.
15. **ALO Labs** — Featured lab projects.
16. **Verification** — Credentials, certifications.
17. **FAQ** — 8 common questions.
18. **Newsletter** — Subscribe form.
19. **Contact Finale** — Final CTA + contact form.
20. **Footer** — Links, social, copyright.

### Higher Study platform (`/higher-study/*`)

- **Layout**: `higher-study-shell.tsx` — own navbar with Higher Study branding, breadcrumbs, search.
- **Hero search**: Search universities/courses/scholarships from any Higher Study page.
- **Compare**: Side-by-side comparison of up to 3 universities/courses/scholarships.
- **Saved items**: Logged-in users can save universities/courses for later.
- **Eligibility checker**: Interactive quiz that recommends suitable courses.
- **Consultation booking**: Calendar-integrated form.

### English Learning platform (`/english-learning/*`)

- **Layout**: `english-learning/layout.tsx` — own navbar.
- **Course catalog**: Filterable by level (A1–C2), duration, price.
- **Practice tests**: IELTS/TOEFL/PTE/Duolingo mock tests with auto-grading.
- **Tutor directory**: Filterable by specialty, rating, availability.
- **Progress dashboard**: Enrolled courses, completion %, test scores.
- **Referral program**: Refer a friend, both get discount.

---

## 13. Styling System

### Tailwind CSS 4

- Config: `tailwind.config.ts`
- Theme: Orange accent (`#F26113`), neutral grays, no indigo/blue (per project rules).
- Dark mode: `class` strategy via `next-themes`.
- Animations: `tailwindcss-animate` plugin + custom keyframes in `globals.css`.

### shadcn/ui

- Style: New York (sharper corners, smaller radius).
- Base color: Neutral.
- CSS variables: defined in `globals.css` (`:root` and `.dark`).
- Add new components: `npx shadcn@latest add <component>`.

### Global CSS (`src/app/globals.css`)

```css
@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
  --primary: 21 90% 48%;       /* orange */
  --primary-foreground: 0 0% 100%;
  /* ... 40+ tokens */
}

.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  /* ... */
}

*:focus-visible {
  outline: 2px solid rgb(242 97 19);
  outline-offset: 2px;
}

/* Custom thin scrollbar */
.scrollbar-thin::-webkit-scrollbar { width: 6px; }
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgb(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}
```

### Typography

- Headings: Playfair Display (serif) — via `next/font/google`.
- Body: Inter (sans-serif) — via `next/font/google`.
- Mono: JetBrains Mono — for code blocks.

### Responsive breakpoints

Mobile-first. Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Footer sticky-to-bottom

Every route layout uses:
```tsx
<div className="flex min-h-screen flex-col">
  <Navbar />
  <main id="main-content" className="flex-1">{children}</main>
  <Footer className="mt-auto" />
</div>
```

---

## 14. Scripts Reference

All scripts run via `bun run <script>` (defined in `package.json`).

### Development

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev -p 3000` | Start dev server (Turbopack) on port 3000 |
| `lint` | `eslint .` | Run ESLint |
| `typecheck` | `tsc --noEmit` | TypeScript type check |
| `test` | `vitest run` | Run all tests |
| `test:unit` | `vitest run --dir tests/unit` | Unit tests only |
| `test:integration` | `vitest run --dir tests/api` | API integration tests |
| `test:watch` | `vitest` | Watch mode |
| `test:coverage` | `vitest run --coverage` | Coverage report |

### Database

| Script | Command | Description |
|---|---|---|
| `db:push` | `prisma db push` | Push schema to DB |
| `db:generate` | `prisma generate` | Regenerate Prisma Client |
| `db:validate` | `prisma validate` | Validate schema |
| `db:migrate` | `prisma migrate dev` | Create migration (dev) |
| `db:migrate:deploy` | `prisma migrate deploy` | Apply migrations (prod) |
| `db:migrate:status` | `prisma migrate status` | Migration status |
| `db:reset` | `prisma migrate reset` | Reset DB (destructive!) |
| `db:seed` | `npx tsx prisma/seed.ts` | Seed all data |
| `db:backup` | `npx tsx scripts/backup-db.ts` | Backup DB |
| `db:restore` | `npx tsx scripts/restore-db.ts` | Restore DB |
| `db:verify` | `npx tsx scripts/verify-db.ts` | Verify DB integrity |

### Production

| Script | Command | Description |
|---|---|---|
| `build` | `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/` | Production build (standalone) |
| `start` | `node .next/standalone/server.js` | Start standalone production server |
| `start:prod` | `NODE_ENV=production node server.js` | Start via `server.js` wrapper |
| `verify:production` | `bash scripts/verify-production.sh` | Post-deploy verification |

### Docker

| Script | Command | Description |
|---|---|---|
| `docker:build` | `docker build -t alaminn-info .` | Build Docker image |
| `docker:run` | `docker run -d --name alaminn-app -p 3000:3000 --env-file .env alaminn-info` | Run container |
| `docker:up` | `docker compose up -d --build` | Docker Compose up |
| `docker:down` | `docker compose down` | Docker Compose down |
| `docker:logs` | `docker compose logs -f` | Tail logs |

### Images

| Script | Description |
|---|---|
| `images:blur` | Generate base64 blur placeholders for all images in `/public` |
| `images:modern` | Convert images to WebP/AVIF |
| `images:optimize` | Run both above |

### Security

| Script | Description |
|---|---|
| `security:test` | Run security test suite (auth, RBAC, headers, rate limit) |

---

## 15. Tests

Framework: **Vitest 4** with **jsdom** environment.

### Test files

| File | Description |
|---|---|
| `tests/api/admin-auth.test.ts` | Admin login flow, RBAC enforcement |
| `tests/api/health.test.ts` | Health endpoint responses |
| `tests/api/inquiries.test.ts` | Inquiry submission + validation |
| `tests/lib/auth.test.ts` | Session creation, verification, expiry |
| `tests/lib/email-templates.test.ts` | Email template rendering |
| `tests/lib/env.test.ts` | Env validation (prod throws, dev warns) |
| `tests/lib/rbac.test.ts` | Role-permission matrix |
| `tests/unit/utm.test.ts` | UTM parameter parsing |
| `tests/setup.ts` | Vitest setup — jsdom, mocks, cleanup |

### Run tests

```bash
bun run test                 # All tests
bun run test:unit            # Unit only
bun run test:integration     # API integration
bun run test:watch           # Watch mode
bun run test:coverage        # Coverage report → /coverage/
```

### Test results

- **241 tests pass** across 8 test files.
- Coverage: >80% on `src/lib/auth.ts`, `src/lib/rbac.ts`, `src/lib/env.ts`.

---

## 16. Deployment — Local, cPanel, Docker, PM2, systemd

### Option A: Local production build (for testing)

```bash
bun run build              # ~90s, outputs .next/standalone/
bun run start              # → http://localhost:3000
```

### Option B: Docker

```bash
# 1. Build image
bun run docker:build

# 2. Run container
bun run docker:run

# OR use Docker Compose (recommended)
bun run docker:up
bun run docker:logs        # tail logs
bun run docker:down        # stop
```

`docker-compose.yml` defines:
- App service (port 3000)
- Volume for `db/` (persistent SQLite)
- Volume for `storage/` (backups, logs)
- Restart policy: `unless-stopped`
- Health check: `/api/health`

### Option C: PM2 (recommended for VPS)

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Build
bun run build

# 3. Start with PM2
pm2 start deploy/ecosystem.pm2.cjs

# 4. Save process list + enable startup
pm2 save
pm2 startup

# 5. Start mini-services
cd mini-services/email-worker && pm2 start "bun run dev" --name email-worker
cd mini-services/audit-worker && pm2 start "bun run dev" --name audit-worker
cd mini-services/health-monitor && pm2 start "bun run dev" --name health-monitor
cd mini-services/notification-service && pm2 start "bun run dev" --name notification-service
cd mini-services/ai-worker && pm2 start "bun run dev" --name ai-worker

pm2 save
```

### Option D: systemd (most robust)

```bash
# 1. Copy service file
sudo cp deploy/alaminn-info.service /etc/systemd/system/

# 2. Edit paths if needed
sudo nano /etc/systemd/system/alaminn-info.service

# 3. Enable + start
sudo systemctl daemon-reload
sudo systemctl enable alaminn-info
sudo systemctl start alaminn-info

# 4. Check status
sudo systemctl status alaminn-info
sudo journalctl -u alaminn-info -f   # tail logs
```

The service file sets `Environment=PORT=3000`, `Environment=NODE_ENV=production`, reads `.env` from the app directory, and runs `node server.js`.

### Option E: cPanel / Shared hosting

1. Use **Node.js 20+** app in cPanel.
2. Set root directory to project root.
3. Set startup file: `server.js`.
4. Set env vars in cPanel UI (or upload `.env`).
5. Run `bun install && bun run build` via SSH.
6. Use `deploy/cpanel/setup-cpanel.sh` for one-shot setup.

See `docs/deliverables/CPANEL_DEPLOYMENT_GUIDE.md` for detailed steps.

### Nginx reverse proxy (production)

```nginx
server {
    listen 80;
    server_name alaminn.info www.alaminn.info;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name alaminn.info www.alaminn.info;

    ssl_certificate /etc/letsencrypt/live/alaminn.info/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alaminn.info/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets — long cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 31536000s;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Full config: `deploy/nginx-alaminn-info.conf`.

### SSL certificate

```bash
sudo certbot --nginx -d alaminn.info -d www.alaminn.info
```

---

## 17. Cron Jobs & Background Workers

### System cron (Linux)

Add to crontab (`crontab -e`):

```cron
# DB backup — daily at 02:00
0 2 * * * cd /path/to/alaminn-info && bun run db:backup >> storage/logs/cron.log 2>&1

# Sitemap regeneration — daily at 03:00
0 3 * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://alaminn.info/api/cron/sitemap-generate

# Email queue flush — every 5 minutes
*/5 * * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://alaminn.info/api/cron/email-queue

# Scholarship deadline reminders — daily at 08:00
0 8 * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://alaminn.info/api/cron/scholarship-deadlines

# Temp file cleanup — daily at 04:00
0 4 * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" https://alaminn.info/api/cron/temp-cleanup
```

### Mini-service supervision

Use PM2 or systemd to keep all 5 mini-services running:

```bash
# PM2 one-liner
pm2 start deploy/ecosystem.pm2.cjs && pm2 save
```

`deploy/ecosystem.pm2.cjs` defines all 5 mini-services + the main app, with auto-restart on crash and max memory limits.

---

## 18. Security Checklist

### Authentication
- ✅ Passwords hashed with bcrypt (12 rounds).
- ✅ Session cookies HMAC-signed with `AUTH_SECRET` (≥32 bytes).
- ✅ Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` (production).
- ✅ Session TTL: 7 days.
- ✅ Password reset tokens: 32-byte random, TTL 1 hour, single-use.
- ✅ Rate limiting on login (5 attempts / 15 min / IP).
- ✅ Rate limiting on forgot-password + reset-password (5 / 15 min / IP).

### Authorization (RBAC)
- ✅ 11 roles × granular permissions.
- ✅ Every admin API route calls `requirePermission()`.
- ✅ Every admin page checks role on server-side render.
- ✅ Audit log written on every state-changing action.

### HTTP security headers (via `proxy.ts`)
- ✅ `Content-Security-Policy: default-src 'self'; ...`
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)

### Input validation
- ✅ All API inputs validated with Zod schemas.
- ✅ SQL injection: prevented by Prisma parameterized queries.
- ✅ XSS: React auto-escapes; CSP blocks inline scripts.
- ✅ CSRF: SameSite=Lax cookies + custom header check for mutations.

### File uploads
- ✅ Max size: 10MB.
- ✅ MIME allowlist: images, PDFs, docs.
- ✅ File content inspection (magic bytes), not just extension.
- ✅ Stored outside web root (`storage/`).

### Secrets management
- ✅ `.env` in `.gitignore`.
- ✅ `AUTH_SECRET` ≥ 32 bytes, validated at startup.
- ✅ Production throws if secrets missing.
- ✅ No secrets in client-side code (`NEXT_PUBLIC_*` only for public URLs).

### Dependencies
- ✅ `bun audit` — run regularly.
- ✅ Lockfile committed (`bun.lock`).
- ✅ No `*` versions — all deps pinned to `^major.minor.patch`.

---

## 19. Troubleshooting

### Dev server won't start

```bash
# Port 3000 in use?
lsof -i :3000                    # Find process
kill -9 <PID>                    # Kill it

# Or use a different port
bun run dev -- -p 3001
```

### Database locked / corrupted

```bash
# Backup first!
cp db/custom.db db/custom.db.broken

# Restore from latest backup
bun run db:restore

# Or reset entirely (destructive!)
rm db/custom.db
bun run db:push
bun run db:seed
```

### `EADDRINUSE` on mini-service port

```bash
lsof -i :3002                    # Find process using port 3002
kill -9 <PID>
cd mini-services/email-worker && bun run dev
```

### Prisma Client out of sync

```bash
bun run db:generate              # Regenerate client
# If still broken:
rm -rf node_modules/.prisma
bun install
bun run db:generate
```

### Build fails with type errors

```bash
bun run typecheck               # See all type errors
# Fix errors, then:
bun run build
```

**Never** set `typescript.ignoreBuildErrors: true` — the build must fail on type errors.

### Hydration mismatch

Common causes:
1. Using `Date.now()` or `Math.random()` in render — move to `useEffect`.
2. Using `window`/`document` in render — guard with `typeof window !== 'undefined'`.
3. Mismatched server/client theme — ensure `next-themes` `suppressHydrationWarning` on `<html>`.

### Mini-service can't reach DB

Check:
1. `.env` exists in project root with `DATABASE_URL`.
2. `mini-services/_shared/db-shim.ts` reads from parent `.env`.
3. DB file path is absolute (not relative).

### Cron route returns 401

Set `CRON_SECRET` in `.env` and pass it as header:
```bash
curl -H "X-Cron-Secret: $CRON_SECRET" https://alaminn.info/api/cron/backup
```

---

## 20. Developer Workflow

### Adding a new admin CRUD page

1. **Schema**: Add model to `prisma/schema.prisma`, run `bun run db:push`.
2. **API**: Create `src/app/api/v1/admin/<resource>/route.ts` (list + create) and `src/app/api/v1/admin/<resource>/[id]/route.ts` (get + update + delete). Use `src/lib/higher-study/admin-factory.ts` as a template.
3. **Page**: Create `src/app/admin/<resource>/page.tsx`. Use an existing page (e.g. `src/app/admin/articles/page.tsx`) as a template. Configure columns, filters, form fields.
4. **Sidebar**: Add nav item to `src/components/admin/admin-shell.tsx`.
5. **RBAC**: Add permission to `src/lib/rbac.ts` and assign to appropriate roles.
6. **Seed**: Add seed data to `prisma/seed.ts`.
7. **Test**: Verify list/create/edit/delete work end-to-end.

### Adding a new public API endpoint

1. **API**: Create `src/app/api/v1/<resource>/route.ts`.
2. **Validation**: Define Zod schema for input.
3. **Auth**: If protected, call `requirePermission()` or `requireAuth()`.
4. **Response**: Return `{ success, message, data, meta, errors }` envelope.
5. **Error handling**: Wrap in try/catch, return 500 on unexpected errors.
6. **Audit**: Log state-changing actions via `AuditLog`.
7. **Rate limit**: If public, add rate limiter.

### Adding a new homepage section

1. **Component**: Create `src/components/site/sections/<name>.tsx`.
2. **Import**: Add to `src/app/page.tsx`.
3. **Place**: Insert in the correct position in the section order.
4. **Animate**: Use Framer Motion for entrance animations.
5. **Responsive**: Test at mobile, tablet, desktop widths.
6. **Accessible**: Add ARIA labels, keyboard navigation, focus-visible styles.

### Modifying the database schema

1. Edit `prisma/schema.prisma`.
2. Run `bun run db:push` (dev) — applies changes without data loss for additive changes.
3. For destructive changes (column rename, type change), use a migration:
   ```bash
   bun run db:migrate -- --name describe_change
   ```
4. Run `bun run db:generate` to update Prisma Client.
5. Update affected components/APIs.

### Code review checklist

- [ ] TypeScript types on all function params/returns.
- [ ] No `any` types (use `unknown` if truly unknown).
- [ ] No `console.log` in production code (use `logger.ts`).
- [ ] No hardcoded URLs (use `env().siteUrl`).
- [ ] No secrets in client code.
- [ ] All API routes validate input with Zod.
- [ ] All admin routes call `requirePermission()`.
- [ ] All mutations write to `AuditLog`.
- [ ] Responsive: tested at 375px, 768px, 1280px.
- [ ] Accessible: keyboard navigation, ARIA labels, focus-visible.
- [ ] Lint passes: `bun run lint`.
- [ ] Types pass: `bun run typecheck`.
- [ ] Tests pass: `bun run test`.

---

## 21. File-by-File Inventory (Counts)

| Category | Count |
|---|---|
| Source files (`src/**/*.{ts,tsx,css}`) | **482** |
| `src/app/` pages + API routes | ~250 |
| `src/app/api/` route files | ~150 |
| `src/app/admin/` pages | 32 |
| `src/app/higher-study/` pages | 40+ |
| `src/app/english-learning/` pages | 15+ |
| `src/components/ui/` (shadcn primitives) | 48 |
| `src/components/site/sections/` | 20 |
| `src/components/higher-study/` | 26 |
| `src/components/english-learning/` | 18 |
| `src/components/admin/` | 7 |
| `src/lib/` files | 36 |
| `prisma/` schema + seeders | 5 files (1,285-line schema, 55 models) |
| `mini-services/` (5 services × 3-4 files) | 20 |
| `scripts/` utilities | 13 |
| `deploy/` configs | 9 |
| `tests/` | 10 |
| `docs/` | 45 |
| `public/` assets | 11 |
| `examples/` | 2 |
| **Total project files (excluding node_modules, .next, db)** | **~700+** |

---

## Appendix A: Common Commands Cheat Sheet

```bash
# Development
bun run dev                    # Start dev server → http://localhost:3000
bun run lint                   # ESLint
bun run typecheck              # TypeScript check
bun run test                   # Vitest

# Database
bun run db:push                # Apply schema
bun run db:seed                # Seed data
bun run db:backup              # Backup
bun run db:restore             # Restore
bun run db:verify              # Verify integrity

# Production
bun run build                  # Build standalone
bun run start                  # Start production server
bun run verify:production      # Post-deploy checks

# Docker
bun run docker:up              # Build + start container
bun run docker:down            # Stop container
bun run docker:logs            # Tail logs

# Mini-services (run each in separate terminal)
cd mini-services/email-worker && bun run dev          # :3002
cd mini-services/audit-worker && bun run dev          # :3003
cd mini-services/health-monitor && bun run dev        # :3004
cd mini-services/notification-service && bun run dev  # :3005
cd mini-services/ai-worker && bun run dev             # :3006

# Admin user management
bun run scripts/seed-admin.ts --email you@example.com --password "StrongPass!"

# Security tests
bun run security:test

# Images
bun run images:optimize        # Generate blur placeholders + WebP/AVIF
```

---

## Appendix B: URLs to Know

| URL | Description |
|---|---|
| `http://localhost:3000/` | Homepage |
| `http://localhost:3000/admin` | Admin dashboard (login required) |
| `http://localhost:3000/admin/login` | Admin login |
| `http://localhost:3000/api/health` | Liveness check |
| `http://localhost:3000/api/health/deep` | Deep health check |
| `http://localhost:3000/robots.txt` | Robots file |
| `http://localhost:3000/sitemap.xml` | Sitemap |
| `http://localhost:3000/manifest.webmanifest` | PWA manifest |
| `http://localhost:81/?XTransformPort=3000` | Sandbox gateway (same as :3000) |
| `http://localhost:81/?XTransformPort=3006` | Sandbox gateway → AI worker |

---

## Appendix C: Key People & Contacts

- **Project owner**: Al Aminn
- **Default admin email**: `admin@alaminn.info`
- **Production domain**: `https://alaminn.info`
- **Support email**: `support@alaminn.info`

---

**End of DEVELOPMENT.md.**

Every file is documented. Every command is listed. Every env var is explained. Every route is mapped.

If you find a gap, it is a bug in this document — report it.

**Last updated**: 2026-08-04
**Document version**: 1.0
**Project version**: 1.0.0
