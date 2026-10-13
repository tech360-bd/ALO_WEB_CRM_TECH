# 📖 ALAMINN.INFO — HOW TO EDIT & RUN (Complete Guide)

> **Read this first.** This guide answers three questions in order:
> 1. **HOW?** — How do you run the project on your computer / server?
> 2. **WHERE?** — Where do you edit content, text, images, colors, pages?
> 3. **HOW?** — How do you deploy your edits to the live website?

---

## 📦 WHAT IS IN THE ZIP

The ZIP `ALAMINN-INFO-PRODUCTION.zip` contains **only the files needed to run the website live**. It does NOT contain `node_modules` (installed by `npm install`) or the `.next` build folder (created by `npm run build`).

```
ALAMINN-INFO-PRODUCTION.zip
├── src/                    ← All application code (pages, APIs, components)
├── prisma/                 ← Database schema + migrations + seed data
├── public/                 ← Logo, favicon, brand images
├── scripts/                ← Backup, restore, verify, security-test scripts
├── mini-services/          ← 4 background workers (email, audit, health, notifications)
├── deploy/                 ← cPanel / VPS / Docker / Nginx configs
├── docs/                   ← Documentation + deliverables
├── storage/                ← Runtime folders (logs, backups, exports) — empty, with .gitkeep
├── db/                     ← SQLite dev database folder (empty, with .gitkeep)
├── tests/                  ← Unit + API tests (vitest)
│
├── package.json            ← Dependencies + npm scripts (DO NOT rename scripts)
├── package-lock.json       ← Pinned dependency versions (keeps installs reproducible)
├── next.config.ts          ← Next.js configuration
├── tsconfig.json           ← TypeScript configuration
├── tailwind.config.ts      ← Tailwind CSS theme (colors, fonts)
├── postcss.config.mjs      ← PostCSS (Tailwind processor)
├── components.json         ← shadcn/ui component config
├── eslint.config.mjs       ← ESLint rules
├── .env.example            ← Environment variable template (copy to .env)
├── .gitignore              ← Files excluded from git
├── .htaccess               ← Apache security rules (cPanel)
├── .dockerignore           ← Files excluded from Docker build
├── Dockerfile              ← Docker production build
├── docker-compose.yml      ← Docker stack (app + optional MySQL + Nginx)
├── Caddyfile               ← Caddy reverse-proxy config (alternative)
├── server.js               ← Production startup file (used by cPanel/PM2)
├── start-prod.sh           ← Production start helper script
├── README.md               ← Project overview
├── GO-LIVE-GUIDE.md        ← Full deployment guide (cPanel / VPS / Docker)
└── HOW-TO-RUN-AND-EDIT.md  ← THIS FILE
```

---

# PART 1 — HOW TO RUN (on your computer for testing)

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 20 LTS or 22 LTS | https://nodejs.org/ |
| **npm** | comes with Node | (included) |
| **Git** | any recent | https://git-scm.com/ |

> You do **NOT** need Bun, MySQL, Redis, or Docker for local development. SQLite is used by default and is a single file (`db/custom.db`).

## Step-by-step (5 minutes)

### Step 1 — Unzip the project

```bash
# Windows: right-click the ZIP → Extract All
# Mac/Linux:
unzip ALAMINN-INFO-PRODUCTION.zip -d alaminn.info
cd alaminn.info
```

### Step 2 — Create your `.env` file

```bash
# Copy the template
cp .env.example .env
```

Open `.env` in any text editor. For local dev, you only need to set these (leave the rest empty):

```env
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3001
DATABASE_URL=file:./db/custom.db
# Leave AUTH_SECRET empty in dev (a fallback is used with a warning)
AUTH_SECRET=
ADMIN_EMAIL=admin@alaminn.info
ADMIN_PASSWORD=<set_your_own_strong_password>
```

### Step 3 — Install dependencies (first time only, ~2 minutes)

```bash
npm install
```

This downloads all packages listed in `package.json` into `node_modules/`.

### Step 4 — Set up the database

```bash
# Create all database tables (SQLite file at db/custom.db)
npx prisma db push

# Generate the Prisma Client (TypeScript database access layer)
npx prisma generate

# Seed initial data (admin user, sample content)
npm run db:seed
```

### Step 5 — Start the dev server

```bash
npm run dev
```

You will see:
```
▲ Next.js 16.1.3 (Turbopack)
- Local:        http://localhost:3001
✓ Ready in ~1s
```

### Step 6 — Open the website

Open your browser to **http://localhost:3001**

You should see the Alaminn.info homepage with all 13 sections.

**Other useful URLs:**
| URL | What |
|-----|------|
| http://localhost:3001/ | Homepage |
| http://localhost:3001/higher-study | Higher Study platform |
| http://localhost:3001/english-learning | English Learning platform |
| http://localhost:3001/admin/login | Admin login (use ADMIN_EMAIL / ADMIN_PASSWORD from .env) |
| http://localhost:3001/api/health | Health check JSON |

---

# PART 2 — WHERE TO EDIT (file locations for every type of change)

## 🎨 2.1 Brand colors, fonts, theme

**File:** `tailwind.config.ts`

```ts
// Edit the color palette here:
colors: {
  brand: {
    orange: "#F26113",   // ← change to your brand orange
    blue: "#0B63CE",     // ← change to your brand blue
  }
}
```

**File:** `src/app/globals.css` — CSS variables for light/dark mode, gradients, shadows.

## 📝 2.2 Homepage content (text, headings, sections)

**File:** `src/app/page.tsx`

This is the main homepage. It imports 13 section components:
- `Hero`, `CredibilityBar`, `ExecutiveIntro`, `OperatingModel`, `Expertise`,
  `Impact`, `WorkSystem`, `CaseStudies`, `Insights`, `Resources`, `Testimonials`,
  `FAQ`, `ContactFinale`

To edit a specific section's text, open its component file in:
`src/components/site/sections/`

For example:
- Hero section → `src/components/site/sections/hero.tsx`
- FAQ section → `src/components/site/sections/faq.tsx`
- Contact section → `src/components/site/sections/contact-finale.tsx`

## 🧭 2.3 Navigation bar links

**File:** `src/lib/site-data.ts`

```ts
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Expertise", href: "/expertise" },
  { label: "Impact", href: "/impact" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/media" },
  { label: "Resources", href: "/ecosystem" },
  { label: "Higher Study", href: "/higher-study" },
  // ← add / remove / reorder links here
];
```

## 🎓 2.4 Higher Study platform (16 sections)

**Folder:** `src/app/higher-study/`

| Page | File |
|------|------|
| Higher Study home | `src/app/higher-study/page.tsx` |
| UK Universities | `src/app/higher-study/uk-universities/page.tsx` |
| Global Universities | `src/app/higher-study/global-universities/page.tsx` |
| Course Finder | `src/app/higher-study/course-finder/page.tsx` |
| Courses | `src/app/higher-study/courses/page.tsx` |
| Scholarships | `src/app/higher-study/scholarships/page.tsx` |
| Destinations | `src/app/higher-study/destinations/page.tsx` |
| Subjects | `src/app/higher-study/subjects/page.tsx` |
| Supervisors | `src/app/higher-study/supervisors/page.tsx` |
| PhD Research | `src/app/higher-study/phd-research/page.tsx` |
| Study Resources | `src/app/higher-study/study-resources/page.tsx` |
| Eligibility Check | `src/app/higher-study/eligibility-check/page.tsx` |
| Compare | `src/app/higher-study/compare/page.tsx` |
| Saved | `src/app/higher-study/saved/page.tsx` |
| Apply | `src/app/higher-study/apply/page.tsx` |
| Book Consultation | `src/app/higher-study/book-consultation/page.tsx` |
| Application Guide | `src/app/higher-study/application-guide/page.tsx` |

Reusable Higher Study components live in: `src/components/higher-study/`

## 🇬🇧 2.5 English Learning platform (10 sections)

**Folder:** `src/app/english-learning/`

Pages: courses, tutors, pricing, chevening, ielts, resources, blog, faq, enroll, success-stories.

Reusable components: `src/components/english-learning/`

## 📧 2.6 Email templates (22 types)

**File:** `src/lib/email/templates.ts`

Templates: registration, OTP, account activation, consultation (requested/confirmed/scheduled), application-status, scholarship-deadline, phd-deadline, newsletter-confirmation, inquiry, meeting, AI-task, password-reset, staff-invitation, security-alert.

Edit the HTML/text content of each template function.

## 🔐 2.7 User roles & permissions

**File:** `src/lib/rbac.ts`

11 roles: SUPER_ADMIN, ADMIN, EDITOR, AUTHOR, ANALYST, COUNSELLOR, STUDENT, TUTOR, MODERATOR, VIEWER, GUEST.

100+ permissions across all resources. Edit the `PERMISSIONS` map to change who can do what.

## 🗄️ 2.8 Database schema (tables & columns)

**Files:**
- `prisma/schema.prisma` — SQLite (used in development)
- `prisma/schema.mysql.prisma` — MySQL (used in production)

55 models. After editing either schema:

```bash
# Development (SQLite):
npx prisma db push          # apply changes to dev DB
npx prisma generate         # regenerate Prisma Client

# Production (MySQL) — see Part 3 deployment
```

## 🖼️ 2.9 Images & static files

**Folder:** `public/`

| File | What |
|------|------|
| `public/logo.svg` | Site logo (SVG) |
| `public/favicon.svg` | Browser tab icon |
| `public/brand/` | Brand image assets |

Upload new images here. Reference them in code as `/logo.svg`, `/brand/my-image.png`, etc.

## ⚙️ 2.10 Environment variables (secrets, config)

**File:** `.env` (never committed to git — created from `.env.example`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Database connection string |
| `AUTH_SECRET` | HMAC key for session cookies (32+ hex chars) |
| `CRON_SECRET` | Protects `/api/cron/*` endpoints |
| `SMTP_HOST/PORT/USER/PASS` | Email server credentials |
| `EMAIL_FROM` | From address for outgoing email |
| `ADMIN_EMAIL/PASSWORD` | Initial admin user (seed only) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site |

## 🔌 2.11 API routes (150 endpoints)

**Folder:** `src/app/api/`

| Path prefix | Purpose |
|-------------|---------|
| `/api/auth/*` | Authentication (login, logout, session) |
| `/api/admin/*` | Admin panel data operations |
| `/api/higher-study/*` | Higher Study platform APIs |
| `/api/english-learning/*` | English Learning platform APIs |
| `/api/cron/*` | Scheduled job endpoints (protected by CRON_SECRET) |
| `/api/health` | Health check |
| `/api/public/*` | Public-facing data APIs |

Each route is a `route.ts` file exporting `GET` / `POST` / etc. handlers.

## 🤖 2.12 Mini-services (4 background workers)

**Folder:** `mini-services/`

| Service | Port | Purpose |
|---------|------|---------|
| `email-worker/` | 3002 | Retry queue for failed emails |
| `audit-worker/` | 3003 | Read-only audit log reporting & export |
| `health-monitor/` | 3004 | Pings all services every 30s |
| `notification-service/` | 3005 | In-memory notification ingestion |

These are **optional** for basic deployment but recommended for production.

Each runs independently:
```bash
cd mini-services/email-worker
npm install        # first time only
npm run dev        # uses tsx (Node.js) — OR: npm run dev:bun (if Bun installed)
```

---

# PART 3 — HOW TO DEPLOY YOUR EDITS TO LIVE

Choose one of three deployment methods. **Way 1 (cPanel)** is easiest for shared hosting. **Way 3 (Docker)** is fastest on a VPS.

> 📖 **For full deployment steps, see `GO-LIVE-GUIDE.md`** (included in the ZIP).
> Below is the short version for each method.

## 🟦 WAY 1 — cPanel (shared hosting)

### First-time setup (30 min)
1. Upload ZIP to `/home/YOURUSER/` → extract to `alaminn.info/`
2. Create `.env` from `deploy/cpanel/.env.production` → fill in real values
3. cPanel → **Setup Node.js App** → Node 22 → startup file `server.js`
4. `npm install` → switch to MySQL schema → `npx prisma migrate deploy` → `npm run db:seed` → `npm run build`
5. Restart the Node app in cPanel
6. Add cron jobs (see GO-LIVE-GUIDE.md Step 9)
7. Enable SSL via cPanel AutoSSL

### After editing (redeploy — 5 min)
```bash
cd /home/aloeduca/alaminn.info
# Upload your edited files via cPanel File Manager OR git pull
npm install           # only if package.json changed
npx prisma generate   # only if schema changed
npx prisma migrate deploy  # only if migrations added
npm run build         # rebuild (3-5 min)
# Click "Restart" in cPanel → Setup Node.js App
```

## 🟩 WAY 2 — VPS with PM2 (DigitalOcean / Linode / Vultr)

### First-time setup (20 min)
```bash
mkdir -p /var/www/alaminn.info && cd /var/www/alaminn.info
unzip ALAMINN-INFO-PRODUCTION.zip
nano .env              # fill in production values
npm install
cp prisma/schema.mysql.prisma prisma/schema.prisma
npx prisma generate && npx prisma migrate deploy && npm run db:seed
npm run build
pm2 start server.js --name alaminn-info
pm2 save && pm2 startup
# Configure Nginx reverse proxy + Let's Encrypt SSL (see GO-LIVE-GUIDE.md)
```

### After editing (redeploy — 3 min)
```bash
cd /var/www/alaminn.info
git pull              # OR upload edited files
npm install           # if package.json changed
npx prisma generate   # if schema changed
npx prisma migrate deploy  # if migrations added
npm run build
pm2 restart alaminn-info
```

## 🐳 WAY 3 — Docker (fastest, 10 min)

### First-time setup
```bash
mkdir -p /opt/alaminn && cd /opt/alaminn
unzip ALAMINN-INFO-PRODUCTION.zip
cp deploy/cpanel/.env.production .env
nano .env             # fill in AUTH_SECRET, CRON_SECRET, SMTP_PASS, DATABASE_URL
docker compose up -d --build
docker exec alaminn-app npx prisma migrate deploy
docker exec alaminn-app npm run db:seed
```

### After editing (redeploy — 3 min)
```bash
cd /opt/alaminn
# upload edited files OR git pull
docker compose up -d --build
```

---

# PART 4 — COMMON EDITING TASKS (copy-paste recipes)

## ✏️ Task A — Change the hero headline

1. Open `src/components/site/sections/hero.tsx`
2. Find the `<h1>` element
3. Edit the text inside
4. Save the file
5. Dev server auto-reloads (or run `npm run build` for production)

## 🖼️ Task B — Add a new image to the homepage

1. Put `my-image.png` into `public/brand/`
2. In any component, reference it as:
   ```tsx
   <img src="/brand/my-image.png" alt="Description" />
   // or with Next.js Image:
   <Image src="/brand/my-image.png" alt="Description" width={400} height={300} />
   ```
3. Save → rebuild

## 📄 Task C — Add a new page (e.g. `/services`)

1. Create `src/app/services/page.tsx`:
   ```tsx
   export default function ServicesPage() {
     return (
       <main className="container mx-auto py-20">
         <h1>Our Services</h1>
         <p>Content here...</p>
       </main>
     );
   }
   ```
2. Add to navbar in `src/lib/site-data.ts`:
   ```ts
   { label: "Services", href: "/services" },
   ```
3. Save → visit `http://localhost:3001/services`

## 🗃️ Task D — Add a new database table

1. Edit `prisma/schema.prisma` (and `prisma/schema.mysql.prisma`):
   ```prisma
   model MyTable {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```
2. Apply:
   ```bash
   npx prisma db push      # dev (SQLite)
   npx prisma generate     # regenerate client
   # For production: npx prisma migrate dev --name add_my_table
   ```
3. Use in code:
   ```ts
   import { db } from "@/lib/db";
   const items = await db.myTable.findMany();
   ```

## 🔐 Task E — Change the admin password

The admin password is set during `npm run db:seed` from `ADMIN_PASSWORD` in `.env`.

To change it later:
1. Update `ADMIN_PASSWORD` in `.env`
2. Run `npm run db:seed` again (it upserts the admin user)

Or directly via the admin panel → Users → change password.

## 📧 Task F — Configure real email sending

1. In `.env`, set:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@gmail.com
   SMTP_PASS=your-app-password   # Gmail: use App Password, not your login password
   SMTP_SECURE=starttls
   EMAIL_FROM="Alaminn.info <noreply@alaminn.info>"
   ```
2. Restart the app
3. Test: trigger any email flow (e.g. register a user, or visit `/api/cron/email-queue`)

---

# PART 5 — VERIFY YOUR EDITS WORK

After every edit, run these checks:

```bash
# 1. Lint (catches syntax/style errors) — should show 0 errors
npm run lint

# 2. Type-check (catches TypeScript errors)
npm run typecheck

# 3. Dev server (visit http://localhost:3001 and click around)
npm run dev

# 4. Health check
curl http://localhost:3001/api/health
# Expected: {"status":"ok",...}

# 5. Database verification
npm run db:verify
```

For production after deploy:
```bash
curl https://alaminn.info/api/health       # {"status":"ok"}
curl https://alaminn.info/api/health/deep  # DB + email + runtime
```

---

# PART 6 — TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, run `npm install` again |
| Blank page after build | Run `npm run build` again, watch for errors, then restart |
| `AUTH_SECRET is missing` | Run `openssl rand -hex 32`, put the result in `.env` as `AUTH_SECRET` |
| Database error | Check `DATABASE_URL` in `.env`; for SQLite ensure `db/` folder is writable |
| Emails not sending | Verify `SMTP_*` in `.env`; check `storage/logs/` for errors |
| Cron jobs not running | Ensure `CRON_SECRET` in `.env` matches the `?token=` in cron URLs |
| Build out of memory | Add swap: `sudo fallocate -l 4G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Port 3001 in use | `lsof -i :3001` to find process, then `kill -9 <PID>` |
| CSS missing in production | Rebuild: `npm run build` (copies static assets to standalone) |

---

# PART 7 — QUICK REFERENCE CARD

```bash
# ─── LOCAL DEV ────────────────────────────────────
npm install                  # install deps (first time)
cp .env.example .env         # create env file
npx prisma db push           # create DB tables
npx prisma generate          # generate DB client
npm run db:seed              # seed initial data
npm run dev                  # start dev server → http://localhost:3001

# ─── EDIT ─────────────────────────────────────────
# src/app/page.tsx              ← homepage
# src/lib/site-data.ts          ← navbar links
# src/components/site/sections/ ← homepage sections
# tailwind.config.ts            ← colors & fonts
# .env                          ← secrets & config

# ─── CHECK ────────────────────────────────────────
npm run lint                  # 0 errors expected
npm run typecheck             # 0 errors expected
npm run db:verify             # DB health

# ─── PRODUCTION BUILD ─────────────────────────────
npm run build                 # build standalone production bundle
npm run start                 # start production server (after build)

# ─── DEPLOY (choose one) ──────────────────────────
# cPanel:  upload → npm install → build → restart Node app
# VPS:     git pull → npm install → build → pm2 restart alaminn-info
# Docker:  docker compose up -d --build
```

---

**That's it.** You now know HOW to run, WHERE to edit, and HOW to deploy. For the full deployment walkthrough with screenshots-level detail, open `GO-LIVE-GUIDE.md`.
