# Alaminn.info — Premium Build 2026-08-14

Premium executive authority platform for **Al Aminn** — a single integrated
application combining a public executive-authority website, a Higher Study
advisory platform, an English Learning platform, a private Command Center
(CRM + AI Workspace + Approvals + Audit), and an AI-powered WhatsApp Agent.

Built with **Next.js 16.1.3** (App Router, Turbopack), **TypeScript 5**,
**Tailwind CSS 4**, **shadcn/ui**, **Prisma ORM 6** (SQLite for dev, MySQL for
production), **Framer Motion 12**, and **Bun 1.3.14** runtime.

> **📖 For the complete, exhaustive developer guide covering every file, every
> command, every env variable, and every route — see
> [DEVELOPMENT.md](./DEVELOPMENT.md).** That document is the single source of
> truth for this project.

---

## What's New in This Build (2026-08-14)

This ZIP supersedes `ALAMINN-INFO-UPDATED-2026-08-13.zip` and
`ALAMINN-INFO-COMPLETE-2026-08-04.zip`. Highlights:

1. **Premium Navigation Simplification** — Main navbar reduced to **6 premium
   destinations + 1 CTA**: `Logo (→ /) | About & Expertise | Impact | Projects |
   Insights | Higher Study | Work With Me | [Schedule a Meeting]`. "Home" item
   removed (logo links to `/`). Mega menu and Projects dropdown removed for a
   cleaner, executive feel.
2. **Higher Study Nav Takeover** — When the user enters Higher Study, the main
   Alaminn.info navigation **completely disappears**. A dedicated Higher Study
   navbar renders with only the Al Aminn logo (→ `/`) + 8 Higher Study links
   (Universities, Courses, Scholarships, PhD & Research, Supervisors,
   Destinations, Resources, Compare) + Apply Now CTA.
3. **Merged Pages** (cleaner IA, fewer routes, more depth per page):
   - `/about` — **About & Expertise** combined (professional profile, bio,
     career journey timeline, core expertise & capabilities, operating
     philosophy, full executive profile).
   - `/insights` — **Insights hub** combining Articles + Resources with tab
     filters. Fetches real published content from the DB.
   - `/work-with-me` — **Work With Me + Contact** combined (engagement types,
     services, collaboration process, schedule + inquiry form + trust card).
4. **Clean Redirects** — Old routes preserved and redirected:
   `/expertise → /about`, `/contact → /work-with-me`, `/articles → /insights`.
   Individual article pages (`/articles/[slug]`) still work. No broken links.
5. **Homepage restructure** (from 2026-08-13 build, retained) — Removed the
   two post-Hero sections (StatsTicker + ExecutiveIntro). Added a premium
   **Contact / Professional Profile / Social** section as Section 2.
6. **AI WhatsApp Agent** (from 2026-08-13 build, retained) — 14-intent
   conversational agent on `01716609554`, real LLM via `z-ai-web-dev-sdk`,
   knowledge retrieval across 6 Prisma models, CRM lead creation with explicit
   consent, human-handoff SLA, full admin dashboard at `/admin/whatsapp-ai`,
   privacy-first (no message content stored).
7. **Premium homepage sections** (from 2026-08-13 build, retained) — My Work,
   real photo gallery with lightbox, Social Media Hub (8 platforms, verified
   badges), Latest Updates rail, Work With Me, Schedule a Meeting.
8. **Real data only** — Real user-provided photos in `/public/gallery/`, real
   verified social URLs (Facebook + WhatsApp), real WhatsApp number. No
   invented accounts, credentials, or handles.
9. **Full production audit completed** — 166 route.ts files audited; 95%
   directly tested via curl. 0 critical security issues. All admin endpoints
   return 401 without auth. Rate limiting on all sensitive endpoints. CSP,
   X-Frame-Options:DENY, X-Content-Type-Options:nosniff, Referrer-Policy,
   Permissions-Policy all present. WhatsApp AI agent operational end-to-end.

---

## Quick Start (Development, 5 minutes)

```bash
# 1. Install dependencies (requires Bun — https://bun.sh)
bun install

# 2. Configure environment
cp .env.example .env
#   → Edit .env: set AUTH_SECRET (openssl rand -hex 32)

# 3. Initialize database
bun run db:push       # Push schema.prisma → SQLite (dev)
# bun run db:seed     # Optional: populate demo content

# 4. Start dev server
bun run dev
#   → Open http://localhost:3000

# 5. (Optional) Start mini-services
cd mini-services/email-worker      && bun install && bun run dev &
cd mini-services/audit-worker      && bun install && bun run dev &
cd mini-services/health-monitor    && bun install && bun run dev &
cd mini-services/notification-service && bun install && bun run dev &
cd mini-services/ai-worker         && bun install && bun run dev &
```

See [INSTALL.md](./INSTALL.md) for the production deployment guide.

---

## Project Structure

```
alaminn.info/
├── src/
│   ├── app/                    # Next.js App Router (pages + API routes)
│   │   ├── page.tsx            # Homepage (restructured)
│   │   ├── admin/              # Command Center (CRM + AI + Approvals + Audit)
│   │   ├── higher-study/       # Higher Study advisory platform
│   │   ├── english-learning/   # English Learning platform
│   │   ├── about/ expertise/ projects/ articles/ ...
│   │   └── api/v1/             # REST API (auth, whatsapp, higher-study, ...)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (New York style)
│   │   ├── site/               # Public-site components
│   │   │   ├── navbar.tsx footer.tsx hero.tsx ...
│   │   │   └── sections/       # 25 homepage sections (incl. contact-profile-social)
│   │   ├── higher-study/       # Higher Study shell + explorer + widgets
│   │   ├── admin/              # Command Center UI
│   │   └── whatsapp/           # WhatsApp chat widget + button
│   ├── lib/                    # Auth, db, env, logger, site-data, ...
│   ├── proxy.ts                # Next.js 16 middleware (replaces middleware.ts)
│   └── instrumentation.ts      # OpenTelemetry / Sentry hooks
├── prisma/
│   └── schema.prisma           # 55 models (DB-agnostic — SQLite or MySQL)
├── public/
│   ├── brand/                  # Logos + portraits (real)
│   ├── gallery/                # Real user-provided photos
│   └── favicon.svg logo.svg sw.js
├── mini-services/              # 5 independent Bun services
│   ├── _shared/                # Shared utilities
│   ├── email-worker/           # Port 3002 — outbound email (SMTP/Resend)
│   ├── audit-worker/           # Port 3003 — audit log writer
│   ├── health-monitor/         # Port 3004 — uptime + health checks
│   ├── notification-service/   # Port 3005 — in-app + push notifications
│   └── ai-worker/              # Port 3006 — background AI jobs
├── scripts/                    # DB seed, verify, backup scripts
├── deploy/                     # cPanel / Nginx / OpenLiteSpeed / PM2 / systemd
├── .env.example                # Template env file
├── package.json                # Bun/Next.js scripts
├── tsconfig.json next.config.ts tailwind.config.ts
├── Caddyfile Dockerfile docker-compose.yml
├── README.md INSTALL.md DEVELOPMENT.md
└── prisma/schema.prisma
```

---

## Quality Gates (Verified 2026-08-14)

- ✅ **ESLint**: 0 errors, 0 warnings
- ✅ **TypeScript** (`tsc --noEmit`): 0 errors
- ✅ **Production build** (`bun run build`): 147/147 static pages (added `/insights` and `/work-with-me`)
- ✅ **Routes**: 20/20 key routes return HTTP 200
- ✅ **Mobile**: No horizontal overflow at 375/390/414/768/1024/1280/1440px
- ✅ **No console errors** on desktop or mobile
- ✅ **WhatsApp AI E2E**: 20/20 spec scenarios pass
- ✅ **Single global Navbar** on main site; dedicated **Higher Study Navbar** on `/higher-study/*` (main nav hidden)
- ✅ **Merged pages**: `/about` (About+Expertise), `/insights` (Articles+Resources), `/work-with-me` (Work+Contact)
- ✅ **Redirects**: `/expertise → /about`, `/contact → /work-with-me`, `/articles → /insights`
- ✅ **166 routes audited** — 0 critical security issues, all admin endpoints protected, rate limiting on all sensitive endpoints

---

## Key Documentation

- [README.md](./README.md) — This file (quick start)
- [INSTALL.md](./INSTALL.md) — Production deployment (5 minutes)
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Exhaustive developer guide
- [.env.example](./.env.example) — All environment variables

---

## License

Proprietary — © Al Aminn. All rights reserved.
