# ALAMINN.INFO — Production Deployment Package

**Version:** 1.0.0
**Live site:** https://alaminn.info
**Built with:** Next.js 16.1.3 (App Router, Turbopack) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 · shadcn/ui (New York) · Prisma 6 · SQLite (dev) / MySQL (prod) · Framer Motion 12 · Zustand
**Runtime:** Bun 1.3.x / Node 20+
**Package:** `ALAMINN-INFO-FINAL-PRODUCTION.zip`

---

## 1. What this project is

`alaminn.info` is the **personal professional website** of **Al Aminn** — a premium, executive, editorial-grade personal website that combines:

1. **Personal profile, biography, expertise, impact, projects, insights**
2. **Higher Study sub-platform** — a dedicated, self-contained guidance hub for students considering overseas education (programs, courses, universities, intakes, destinations, eligibility checker, course finder, application guide, PhD/research paths, book consultation, compare, saved items)
3. **Work-with-me / contact** — meeting scheduling, email & WhatsApp contact channels, newsletter

The public site is intentionally **personal and minimal**. Internal-only systems (CRM, student applications admin, AI workforce, family-AI studio, WhatsApp CRM, audit dashboards) are **out of scope of this personal website** and are NOT linked from, or surfaced in, any public page.

---

## 2. Project facts (measured from source)

| Metric | Value |
|---|---|
| Next.js App-Router routes (`page.tsx` + `route.ts`) | 282 |
| React components | 147 |
| Library modules (`src/lib`) | 44 |
| Prisma models | 55 |
| Mini-services (independent Bun processes) | 5 |
| Public static assets | 17 |
| Homepage sections | 22 |

---

## 3. Public navigation (personal website scope)

The main navbar is intentionally minimal — 6 links + a Schedule CTA. The logo links to `/`.

| Label | Route | Notes |
|---|---|---|
| **About & Expertise** | `/about` | Merged About + Expertise page. (`/expertise` 308-redirects here.) |
| **Impact** | `/impact` | Public impact / measurable outcomes. |
| **Projects** | `/projects` | Public project portfolio. |
| **Insights** | `/insights` | Articles + Resources hub. (`/articles` 308-redirects here.) |
| **Higher Study** | `/higher-study` | Higher Study sub-platform. Triggers a **nav takeover** — the main navbar is hidden and a dedicated Higher Study navbar is shown across all `/higher-study/*` routes. |
| **Work With Me** | `/work-with-me` | Work / Contact / Schedule meeting. (`/contact` 308-redirects here.) |
| **Schedule a Meeting** (CTA) | opens schedule modal | Always-visible CTA in the navbar. |

The footer mirrors this structure with additional legal / social / contact channels.

---

## 4. Higher Study sub-platform

A complete, self-contained guidance hub. The main site navbar is **replaced** with a dedicated Higher Study navbar (logo + 8 links + Apply Now CTA) on every `/higher-study/*` route. Sub-routes:

```
/higher-study                       ← overview
/higher-study/programs              (not built — use /courses or /course-finder)
/higher-study/courses               ← course catalog
/higher-study/course-finder          ← interactive finder
/higher-study/compare                ← compare courses/schools side-by-side
/higher-study/global-universities    ← partner / featured universities
/higher-study/destinations           ← study-destination country guides
/higher-study/intakes                ← intake calendar
/higher-study/eligibility-check      ← eligibility self-assessment
/higher-study/application-guide     ← step-by-step application playbook
/higher-study/phd-research          ← PhD / research-path guide
/higher-study/research              ← research-area deep dives
/higher-study/resources             ← downloads / templates / checklists
/higher-study/saved                  ← saved items (local + server-backed)
/higher-study/apply                  ← application intake form
/higher-study/book-consultation      ← book a 1:1 consultation
```

---

## 5. Tech stack (do not swap)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 16.1.3** (App Router, Turbopack) | Non-negotiable. `proxy.ts` is used instead of `middleware.ts` per Next.js 16 conventions. |
| Language | **TypeScript 5** (strict) | Non-negotiable. |
| Styling | **Tailwind CSS 4** + **shadcn/ui (New York)** | All UI components use the existing `src/components/ui/*` set. |
| Icons | **lucide-react** | |
| Animations | **Framer Motion 12** | |
| Client state | **Zustand** | |
| Server state | **TanStack Query** | |
| ORM | **Prisma 6** (`@prisma/client` 6.11) | SQLite for dev, MySQL for production. |
| Database client | `@/lib/db` (singleton Prisma Client) | |
| Auth | **Custom HMAC session-cookie** (NOT NextAuth) | See `src/lib/auth`. |
| Email | `@react-email/components` + Nodemailer | Sent via the `email-worker` mini-service. |
| Runtime | **Bun 1.3.x** for dev + mini-services; **Node 20+** for production standalone | |
| Process manager (prod) | `pm2` (`deploy/ecosystem.pm2.cjs`) | |
| Reverse proxy (this sandbox) | **Caddy** (`Caddyfile`) | Production typically uses Nginx or OpenLiteSpeed — see `deploy/`. |

---

## 6. Mini-services (independent Bun processes)

Each mini-service is its own Bun project with its own `package.json` and a fixed port. They are started independently and talk to each other over HTTP. Front-end access is routed via the Caddy gateway using the `?XTransformPort=<port>` query param.

| Service | Port | Purpose |
|---|---|---|
| `email-worker` | **3002** | Outbound email (transactional + marketing). Wraps Nodemailer + React Email templates. |
| `audit-worker` | **3003** | Append-only audit log writes (decoupled from request path). |
| `health-monitor` | **3004** | Liveness + readiness + deep health probes. |
| `notification-service` | **3005** | Multi-channel notifications (email, in-app, webhook). |
| `ai-worker` | **3006** | LLM calls (z-ai-web-dev-sdk). Used by Higher Study chatbot + content assists. |

Start them all (dev):

```bash
cd mini-services/email-worker          && bun install && bun run dev &
cd mini-services/audit-worker          && bun install && bun run dev &
cd mini-services/health-monitor        && bun install && bun run dev &
cd mini-services/notification-service  && bun install && bun run dev &
cd mini-services/ai-worker             && bun install && bun run dev &
```

---

## 7. Quick start (local development)

```bash
# 1. Install dependencies (this also runs `prisma generate` via postinstall)
bun install

# 2. Configure environment
cp .env.example .env   # then edit .env with real values

# 3. Push the database schema (SQLite by default for dev)
bun run db:push

# 4. (Optional) Seed an admin user
bun run db:seed

# 5. Start the dev server (port 3000)
bun run dev
# → http://localhost:3000

# 6. (Recommended) start the mini-services too — see section 6.
```

Useful scripts:

```bash
bun run lint              # ESLint (read-only)
bun run typecheck         # tsc --noEmit (read-only)
bun run test              # Vitest (read-only)
bun run db:verify         # DB integrity check (read-only)
bun run db:backup         # Snapshot the DB to db/backups/
bun run db:restore        # Restore from db/backups/
bun run security:test     # security-tests.ts
bun run verify:production # scripts/verify-production.sh
bun run images:optimize   # generate blur placeholders + modern formats
```

---

## 8. Production deployment

The project ships **multiple deployment paths**. Pick the one that matches your host.

### 8a. VPS / dedicated server (Nginx + PM2) — recommended

```bash
# On the server:
git clone <repo> /var/www/alaminn.info && cd /var/www/alaminn.info
cp .env.example .env && nano .env            # set production secrets
bun install                                  # or npm ci
bun run db:push                              # apply schema
bun run build                                # produces .next/standalone + static
pm2 start deploy/ecosystem.pm2.cjs
pm2 save && pm2 startup
# Configure Nginx vhost from deploy/nginx-alaminn-info.conf
```

### 8b. cPanel / Node.js app

See `README-CPANEL-NODE.md` and `deploy/cpanel/`. Use the Node.js selector, set the entry to `server.js`, set `NODE_ENV=production`, and run `bun run build` from the terminal first.

### 8c. Docker

```bash
docker build -t alaminn-info .
docker run -d --name alaminn-app -p 3000:3000 --env-file .env alaminn-info
# or:
docker compose up -d --build
```

### 8d. CyberPanel / OpenLiteSpeed

Use `deploy/ols-vhost.conf` and `deploy/install-server.sh`.

### 8e. Systemd (bare metal)

```bash
sudo cp deploy/alaminn-info.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now alaminn-info
```

### Production checklist

- [ ] `NODE_ENV=production`
- [ ] `AUTH_SECRET` is a strong 32+ char random string (NOT the dev fallback)
- [ ] `DATABASE_URL` points to MySQL (production), not SQLite
- [ ] `NEXT_PUBLIC_SITE_URL=https://alaminn.info`
- [ ] Email SMTP credentials set (`EMAIL_SERVER_*` / `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`)
- [ ] CORS / CSP headers reviewed (`next.config.ts`)
- [ ] `bun run build` succeeds without errors
- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run verify:production` passes
- [ ] HTTPS certificate installed (Let's Encrypt or commercial)
- [ ] All 5 mini-services started and reachable
- [ ] Backups scheduled (`scripts/backup.sh` cron)

---

## 9. Environment variables

Required environment variables (copy `.env.example` → `.env`):

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://alaminn.info
PORT=3000

# Database
DATABASE_URL="mysql://user:pass@host:3306/alaminn"
# (dev: "file:./prisma/dev.db")

# Auth (custom HMAC session-cookie)
AUTH_SECRET="<32+ char random string>"
AUTH_COOKIE_NAME=alaminn_session
SESSION_TTL_SECONDS=604800          # 7 days

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="Al Aminn <hello@alaminn.info>"

# WhatsApp (optional, for the contact CTA link only — NOT a CRM integration)
WHATSAPP_NUMBER=+8801XXXXXXXXX

# Analytics (first-party, cookie-less)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=/api/health   # or your collector

# Mini-service URLs (used for inter-service calls in production)
EMAIL_WORKER_URL=http://127.0.0.1:3002
AUDIT_WORKER_URL=http://127.0.0.1:3003
HEALTH_MONITOR_URL=http://127.0.0.1:3004
NOTIFICATION_SERVICE_URL=http://127.0.0.1:3005
AI_WORKER_URL=http://127.0.0.1:3006
```

> **Never commit `.env`.** The production ZIP excludes `.env` files entirely. Always regenerate `AUTH_SECRET` on first production deploy.

---

## 10. Security model

| Concern | Implementation |
|---|---|
| Authentication | Custom HMAC-signed session cookie. Session record stored in DB. NOT NextAuth. |
| Authorization | Role-based (`admin`, `editor`, `staff`). Enforced in API route handlers, not just the proxy. |
| Password hashing | `argon2id` (via `argon2` npm). |
| CSRF | Same-site=Lax cookies + double-submit token on mutating forms. |
| Input validation | `zod` schemas on every API route. |
| Rate limiting | In-memory token-bucket per IP+route on auth + form-submit endpoints. |
| Security headers | Set in `next.config.ts`: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Content-Security-Policy`. |
| Secrets | All secrets live in `.env`. Never in client bundles. `NEXT_PUBLIC_*` is the only prefix that reaches the browser — audited. |
| Public data exposure | The public homepage and pages only fetch PUBLIC DB rows (`visibility: "public"`, `status: "published"`). All private CRM rows live behind authenticated `/api/v1/admin/*` endpoints. |
| Audit log | Append-only. Written via the `audit-worker` mini-service (port 3003) so it never blocks the request path. |
| Backups | `scripts/backup.sh` snapshots to `db/backups/` with SHA256 manifest. |

---

## 11. Database

- **Dev:** SQLite (`prisma/dev.db`) — file-based, zero-config.
- **Prod:** MySQL 8+ (recommended) or MariaDB 10.6+.
- **Schema:** `prisma/schema.prisma` (55 models).
- **Client:** `src/lib/db.ts` exports a singleton `db` Prisma Client — import as `import { db } from "@/lib/db"`.

Commands:

```bash
bun run db:push           # apply schema to dev DB (no migration history)
bun run db:migrate:deploy # apply migrations to prod DB (CI/CD)
bun run db:validate       # validate schema syntax
bun run db:generate       # regenerate Prisma Client
bun run db:seed           # seed admin + reference data
bun run db:backup         # snapshot to db/backups/
bun run db:restore        # restore from db/backups/
bun run db:verify         # integrity check (FK, required fields, enums)
```

---

## 12. Health & observability

- **Liveness:** `GET /api/health` → `{ status: "ok" }` (cheap, no DB call)
- **Deep health:** `GET /api/health/deep` → checks DB, all 5 mini-services, disk space, backup recency
- **Sitemap:** `GET /sitemap.xml` (generated from public content)
- **Robots:** `GET /robots.txt`
- **Manifest:** `GET /manifest.ts` (PWA support)

---

## 13. SEO

- Per-page `metadata` export (title, description, canonical, OG, Twitter Card).
- Person schema + Article schema + BreadcrumbList schema injected via `JsonLd` component.
- `sitemap.ts` enumerates all public pages + public projects + published articles.
- `robots.ts` allows all, points to sitemap.
- Semantic HTML throughout (`main`, `header`, `nav`, `section`, `article`, `footer`).
- All images have descriptive `alt` text or are marked decorative.

---

## 14. Accessibility

- Semantic HTML5 landmarks.
- Keyboard-navigable: visible focus rings on all interactive elements.
- ARIA labels on icon-only buttons, modal dialogs, tabs, accordions.
- `sr-only` text where visual-only labels would otherwise be unlabeled.
- Respects `prefers-reduced-motion` (Framer Motion variants degrade gracefully).
- Color contrast meets WCAG AA.

---

## 15. Responsive design

Mobile-first. Tested across 8 breakpoints:

| Width | Device class |
|---|---|
| 375px | iPhone SE / small phone |
| 414px | iPhone Plus |
| 768px | iPad portrait |
| 1024px | iPad landscape / small laptop |
| 1280px | laptop |
| 1440px | desktop |
| 1536px | large desktop |
| 1920px | Full HD |

The footer is **sticky to the bottom** of the viewport on short pages (root wrapper is `min-h-screen flex flex-col`, footer has `mt-auto`), and is pushed down naturally on long pages.

---

## 16. Gateway / Caddy note (sandbox only)

This sandbox exposes a single external port. Caddy (`Caddyfile`) routes:

- requests with `?XTransformPort=<port>` → `localhost:<port>` (mini-service)
- everything else → `localhost:3000` (Next.js)

In production (Nginx / OLS), configure each mini-service on its own subdomain or upstream block.

---

## 17. Live URL verification (post-deploy)

After deploying to https://alaminn.info, verify:

```bash
curl -sI https://alaminn.info/                 | head -1     # HTTP/2 200
curl -sI https://alaminn.info/about            | head -1
curl -sI https://alaminn.info/higher-study     | head -1
curl -sI https://alaminn.info/work-with-me     | head -1
curl -sI https://alaminn.info/api/health       | head -1
curl -s  https://alaminn.info/sitemap.xml       | head -3
curl -s  https://alaminn.info/robots.txt
```

Also verify in a browser:
- [ ] Homepage loads with hero + content
- [ ] Navbar shows 6 links + Schedule CTA
- [ ] `/higher-study` shows the **Higher Study navbar** (main navbar hidden)
- [ ] Footer is sticky to bottom on short pages
- [ ] Mobile (375px) layout has no horizontal scroll
- [ ] Schedule Meeting modal opens and submits
- [ ] Contact form on `/work-with-me` submits successfully
- [ ] All redirects work: `/expertise→/about`, `/contact→/work-with-me`, `/articles→/insights`

---

## 18. ZIP contents

`ALAMINN-INFO-FINAL-PRODUCTION.zip` contains the **complete project source**:

```
src/                    # Next.js app + components + lib (5.6 MB)
prisma/                 # schema, migrations, seed
public/                 # static assets (5.3 MB)
mini-services/          # 5 Bun mini-services (sources only — no node_modules)
scripts/                # ops scripts (backup, restore, verify, security-tests)
deploy/                 # cpanel / nginx / ols / systemd / pm2 / docker
docs/                   # architecture, security, deployment docs
examples/               # websocket demo + reference snippets
skills/                 # skill manifests (used by ai-worker)
db/                     # SQLite dev DB + backups
Caddyfile               # sandbox gateway
Dockerfile, docker-compose.yml
eslint.config.mjs, postcss.config.mjs, components.json
next.config.ts, tsconfig.json
package.json, bun.lock
PRODUCTION_README.md    # this file
README.md               # project README
```

**Excluded from the ZIP** (must be regenerated locally):
- `node_modules/` (1.4 GB — install with `bun install`)
- `.next/` (build output — regenerate with `bun run build`)
- `.env`, `.env.*` (secrets — copy `.env.example`)
- `coverage/`, `*.log`, `.DS_Store`

---

## 19. Independent verification (run after extracting the ZIP)

```bash
unzip ALAMINN-INFO-FINAL-PRODUCTION.zip -d alaminn-info-final
cd alaminn-info-final
bun install
cp .env.example .env       # fill in real values
bun run db:push
bun run lint               # expect: 0 errors
bun run typecheck          # expect: 0 errors
bun run test               # expect: pass
bun run build              # expect: success
bun run dev                # → http://localhost:3000
```

Compute the SHA256 of the ZIP and compare it against the value reported in the delivery message:

```bash
sha256sum ALAMINN-INFO-FINAL-PRODUCTION.zip
```

---

## 20. Support & maintenance

- **Daily maintenance cron** (read-only assessment): scheduled for 03:00 Asia/Dhaka. Produces a maintenance report and **waits for explicit approval** before any mutating action.
- **15-minute web-dev review cron**: assesses project state via agent-browser, fixes bugs or proposes next-step improvements, and updates `/home/z/my-project/worklog.md`.
- **Worklog**: `/home/z/my-project/worklog.md` is the canonical handover document across sessions.

---

## 21. License & ownership

© Al Aminn. All rights reserved. This source is private and confidential. Do not redistribute.

---

**End of PRODUCTION_README.md**
