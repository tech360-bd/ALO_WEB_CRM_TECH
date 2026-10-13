# 📘 Alaminn.info — Full Project Guide

> **Complete build & deployment guide — from first step to live production.**
> Every action is numbered (Serial No. 1 → 60). Follow in order.

---

## 📋 Project Overview

| Field | Value |
|-------|-------|
| **Project name** | Alaminn.info |
| **Owner** | Al Aminn |
| **Framework** | Next.js 16.1.3 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | Prisma ORM (SQLite dev / MySQL 8 prod) — 55 models |
| **Auth** | Custom HMAC-signed cookies, scrypt hashing, RBAC (11 roles, 100+ permissions) |
| **UI** | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons |
| **Build output** | Standalone (`.next/standalone/server.js`) |
| **Total source files** | 434 (.ts + .tsx) |
| **Higher Study sections** | 21 |
| **API routes** | 150+ |
| **Tests** | 171/171 passing |

### Three Integrated Platforms
1. **Executive Authority Platform** — Main website (homepage + 13 sections + CRM Command Center)
2. **Higher Study Platform** — 21 sections (UK/Global universities, courses, scholarships, PhD, supervisors, etc.)
3. **English Learning Platform** — Courses, tutors, practice tests, resources

### ALO Education Integration
- HMAC-signed referral transfer (server-to-server)
- PII guard (25 forbidden keys)
- 24-hour TTL on opportunity preservation
- 12-step student application journey

---

## 🗂️ PART A — LOCAL DEVELOPMENT (Serial 1–15)

### Serial 1. Verify Prerequisites

**Why:** The project requires specific runtime versions. Mismatched versions cause silent failures.

**Action:**
```bash
node --version    # Must be >= 20.0.0 (22+ preferred)
npm --version     # Must be >= 10.0.0
git --version
```

**Expected success output:**
```
v22.x.x  (or v20.x.x / v24.x.x)
10.x.x
2.x.x
```

**Failure remediation:**
- Install Node.js 22 from https://nodejs.org (LTS)
- Or use `nvm install 22 && nvm use 22`

---

### Serial 2. Extract the Project ZIP

**Why:** The deliverable `ALAMINN-INFO-FULL-PROJECT.zip` contains the entire codebase.

**Action:**
```bash
# On your machine / server
mkdir -p ~/alaminn.info
cd ~/alaminn.info
unzip /path/to/ALAMINN-INFO-FULL-PROJECT.zip
```

**Expected success output:**
```
inflating: package.json
inflating: next.config.ts
inflating: server.js
inflating: prisma/schema.prisma
inflating: src/app/page.tsx
... (1900+ files)
```

**Failure remediation:**
- Ensure `unzip` is installed: `apt install unzip` (Ubuntu) / `brew install unzip` (macOS)
- Verify ZIP integrity: `unzip -t ALAMINN-INFO-FULL-PROJECT.zip`

---

### Serial 3. Install Dependencies

**Why:** All Node.js packages must be installed before the project can run.

**Action:**
```bash
cd ~/alaminn.info
npm ci
```

**Expected success output:**
```
added 432 packages in 45s
```

**Failure remediation:**
- If `npm ci` fails (lockfile mismatch): `npm install`
- If peer dep errors: `npm install --legacy-peer-deps`
- Clear cache: `npm cache clean --force && npm install`

---

### Serial 4. Generate Prisma Client

**Why:** The Prisma ORM generates a type-safe database client. The `postinstall` script runs this automatically, but verify it succeeded.

**Action:**
```bash
npm run db:generate
```

**Expected success output:**
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in 250ms
```

**Failure remediation:**
- Delete `.prisma/` cache: `rm -rf node_modules/.prisma && npm run db:generate`
- Check `prisma/schema.prisma` syntax: `npm run db:validate`

---

### Serial 5. Configure Environment Variables

**Why:** The app reads secrets (DB URL, AUTH_SECRET, SMTP) from `.env`. The `.env.example` template lists every required variable.

**Action:**
```bash
cp .env.example .env
nano .env
```

**Minimum required variables (dev):**
```env
DATABASE_URL="file:./db/custom.db"
AUTH_SECRET="generate-a-32+byte-random-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Generate a secure AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Expected success output:**
- `.env` file exists with all required keys
- No `WARN: AUTH_SECRET not set` in dev log

**Failure remediation:**
- Compare against `.env.example` — every key must have a value
- Ensure no trailing spaces or quotes issues

---

### Serial 6. Initialize the Database (Dev — SQLite)

**Why:** Creates all 55 tables and seeds initial content (admin user, demo data).

**Action:**
```bash
mkdir -p db
npm run db:push      # Creates tables from schema
npm run db:seed      # Seeds 251+ rows of content
```

**Expected success output:**
```
🚀 Your database is now in sync with your Prisma schema.
✔ Database seeded successfully (251 rows)
```

**Failure remediation:**
- If `db/custom.db` is locked: `rm db/custom.db db/custom.db-journal && npm run db:push`
- If seed fails: `npm run db:reset` (WARNING: destroys data)

---

### Serial 7. Verify Database Integrity

**Why:** Confirms no corruption, no broken foreign keys, no empty required tables.

**Action:**
```bash
npm run db:verify
```

**Expected success output:**
```
✓ PRAGMA integrity_check: ok
✓ PRAGMA foreign_key_check: 0 violations
✓ All required tables populated
0 anomalies found
```

**Failure remediation:**
- Re-run `npm run db:push && npm run db:seed`
- For corruption: `rm db/custom.db && npm run db:push && npm run db:seed`

---

### Serial 8. Run Code Quality Checks

**Why:** Catches TypeScript errors and ESLint violations before they reach production.

**Action:**
```bash
npm run lint
npm run typecheck
```

**Expected success output:**
```
# lint
✔ No ESLint warnings or errors

# typecheck
(no output = success)
```

**Failure remediation:**
- Fix errors one by one; do NOT use `--ignoreBuildErrors`
- For unused imports: `npx eslint . --fix`

---

### Serial 9. Run the Test Suite

**Why:** 171 unit + integration tests verify auth, RBAC, API contracts, and email templates.

**Action:**
```bash
npm run test
```

**Expected success output:**
```
Test Files  8 passed (8)
     Tests  171 passed (171)
  Duration  ~5s
```

**Failure remediation:**
- Run a specific test: `npx vitest run tests/lib/auth.test.ts`
- Re-seed DB if test data is missing: `npm run db:seed`

---

### Serial 10. Run Security Tests

**Why:** 22 security tests verify auth hardening, RBAC enforcement, PII guard, and HMAC signing.

**Action:**
```bash
npm run test:security
```

**Expected success output:**
```
✓ 22/22 security tests passed
```

**Failure remediation:**
- Ensure `AUTH_SECRET` is set in `.env`
- Re-seed DB to restore test admin user

---

### Serial 11. Start Dev Server

**Why:** Run the project locally to test changes in real-time.

**Action:**
```bash
npm run dev
```

**Expected success output:**
```
▲ Next.js 16.1.3 (Turbopack)
- Local:        http://localhost:3001
✓ Ready in 1.2s
```

**Failure remediation:**
- Port 3001 in use: `lsof -i :3001` then kill the process
- OOM in low-RAM environments: `NODE_OPTIONS="--max-old-space-size=1024" npm run dev`

---

### Serial 12. Verify Local Endpoints

**Why:** Confirms the server responds correctly.

**Action:**
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/deep
curl http://localhost:3001/api/readiness
```

**Expected success output:**
```json
{"success":true,"message":"Alaminn.info is operational.","data":{"status":"ok"}}
```

**Failure remediation:**
- Check `dev.log` for compile errors
- Restart dev server

---

### Serial 13. Visit the Homepage

**Why:** Confirms the main website renders with all 13 sections.

**Action:** Open browser to `http://localhost:3001`

**Expected:** Homepage loads with:
- Hero + Operating Constellation animation
- Stats Ticker
- Executive Introduction
- Expertise mega-menu
- Work System
- Impact, Ecosystem, Case Studies
- Testimonials, Alo Labs
- Audience Pathways, Insights, Resources
- FAQ, Verification, Profile
- Work With Me, Newsletter, Contact Finale
- Footer (sticky)
- Navbar with "Higher Study" link on the right

**Failure remediation:**
- Check browser console for errors
- Check `dev.log` for server-side errors

---

### Serial 14. Visit the Higher Study Platform

**Why:** Confirms the Higher Study sub-platform loads.

**Action:** Click "Higher Study" in the navbar (or visit `http://localhost:3001/higher-study`).

**Expected:** Higher Study homepage loads with:
- Hero section
- 21 sub-sections accessible via internal navigation:
  - Destinations, UK Universities, Global Universities
  - Course Finder, Scholarships, PhD & Research
  - Supervisor Finder, Study Resources, Comparisons
  - Saved Items, Eligibility Checker, Application Guidance
  - Book Consultation, Apply, Intakes
  - Universities, Subjects, Research, Resources, Courses

**Failure remediation:**
- If page is blank: check `src/app/higher-study/page.tsx` exists
- If 404: verify route exists in `src/app/higher-study/`

---

### Serial 15. Visit the Admin Command Center

**Why:** Confirms the CRM/Command Center is accessible.

**Action:**
- Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on macOS) on the homepage
- Or visit `http://localhost:3001/admin/login`
- Login with seeded admin credentials

**Default admin credentials (dev only):**
```
Email:    admin@alaminn.info
Password: (from ADMIN_PASSWORD env var, or "ChangeMe!2024" in dev)
```

**Expected:** Command Center opens with dashboard, CRM, AI Workspace, Approvals, Audit logs.

**Failure remediation:**
- Reset admin password: `npm run db:seed` (re-seeds admin user)
- Check `src/app/admin/` for route files

---

## 🗂️ PART B — PRODUCTION BUILD (Serial 16–25)

### Serial 16. Switch to Production Prisma Schema (MySQL)

**Why:** Production uses MySQL 8, not SQLite. The MySQL schema is in `prisma/schema.mysql.prisma`.

**Action:**
```bash
# Backup SQLite schema
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak

# Activate MySQL schema
cp prisma/schema.mysql.prisma prisma/schema.prisma

# Validate
npm run db:validate
```

**Expected success output:**
```
The schema at prisma/schema.prisma is valid 🚀
```

**Failure remediation:**
- Ensure `prisma/schema.mysql.prisma` has `provider = "mysql"`
- Check `DATABASE_URL` starts with `mysql://`

---

### Serial 17. Configure Production Environment

**Why:** Production needs a real MySQL database, secure AUTH_SECRET, SMTP credentials.

**Action:**
```bash
cp deploy/cpanel/.env.production.example .env.production
nano .env.production
```

**Required production variables:**
```env
DATABASE_URL="mysql://USER:PASS@localhost:3306/DBNAME"
AUTH_SECRET="32+ byte random hex string"
NEXT_PUBLIC_APP_URL="https://alaminn.info"
NODE_ENV="production"
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
EMAIL_FROM="Alaminn.info <noreply@alaminn.info>"
```

**Expected success output:**
- `.env.production` exists with all keys filled
- `AUTH_SECRET` is at least 64 characters

**Failure remediation:**
- Generate AUTH_SECRET: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Test DB connection: `npx prisma db pull --schema prisma/schema.prisma`

---

### Serial 18. Create Prisma Migration

**Why:** Production uses `prisma migrate deploy` (NOT `db push`) for safe, versioned schema changes.

**Action:**
```bash
# Set DATABASE_URL to production MySQL
export DATABASE_URL="mysql://USER:PASS@localhost:3306/DBNAME"

# Create migration
npx prisma migrate dev --name init --create-only

# Review the generated SQL in prisma/migrations/
```

**Expected success output:**
```
✔ Created migration at prisma/migrations/20260720000000_init/migration.sql
```

**Failure remediation:**
- Ensure MySQL is running and credentials are correct
- For "database does not exist": create it first in cPanel → MySQL Databases

---

### Serial 19. Deploy Migration to Production Database

**Why:** Applies the migration SQL to the live MySQL database.

**Action:**
```bash
npm run db:migrate:deploy
```

**Expected success output:**
```
55 migrations found in prisma/migrations
Applying migration 20260720000000_init
Migration 20260720000000_init applied
All migrations applied successfully.
```

**Failure remediation:**
- For "Migration failed": check `prisma/migrations/_prisma_migrations` table
- Rollback: `npx prisma migrate resolve --rolled-back 20260720000000_init`

---

### Serial 20. Seed Production Database

**Why:** Populates the database with initial admin user, demo content, and reference data.

**Action:**
```bash
NODE_ENV=production npm run db:seed
```

**Expected success output:**
```
✔ Admin user created (admin@alaminn.info)
✔ 251 rows seeded across 55 tables
```

**Failure remediation:**
- If admin already exists: seed uses upserts, safe to re-run
- For permission errors: check DB user has INSERT/UPDATE privileges

---

### Serial 21. Build the Production Bundle

**Why:** Creates an optimized, standalone production build.

**Action:**
```bash
npm run build
```

**Expected success output:**
```
▲ Next.js 16.1.3 (Turbopack)
Creating an optimized production build ...
✓ Compiled successfully
✓ Route (app)                                 Size
✓ /                                           12.3 kB
✓ /higher-study                              8.7 kB
... (all routes)
✓ Build completed successfully
```

**Failure remediation:**
- TypeScript errors: fix them (do NOT use `ignoreBuildErrors`)
- Memory issues: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

---

### Serial 22. Verify the Standalone Build

**Why:** Ensures the standalone server bundle is complete and can boot.

**Action:**
```bash
ls -la .next/standalone/
ls -la .next/standalone/.next/static/
ls -la .next/standalone/public/
```

**Expected success output:**
```
.next/standalone/server.js   (present)
.next/standalone/.next/static/ (present, contains chunks)
.next/standalone/public/      (present, contains images)
```

**Failure remediation:**
- If `static/` is missing: `cp -r .next/static .next/standalone/.next/`
- If `public/` is missing: `cp -r public .next/standalone/`

---

### Serial 23. Test Production Server Locally

**Why:** Boots the standalone server to verify the production build works.

**Action:**
```bash
NODE_ENV=production PORT=3000 node server.js
# In another terminal:
curl http://localhost:3000/api/health
```

**Expected success output:**
```json
{"success":true,"message":"Alaminn.info is operational."}
```

**Failure remediation:**
- If `.env` not loaded: ensure `server.js` is in the app root
- If port in use: change `PORT=3001`

---

### Serial 24. Run Production Verification Script

**Why:** Runs the full `verify:production` checklist.

**Action:**
```bash
npm run verify:production
```

**Expected success output:**
```
✓ Build artifacts present
✓ Environment variables configured
✓ Database connection OK
✓ Health endpoints responding
✓ Security headers present
✓ All 33 acceptance criteria passed
PRODUCTION READY
```

**Failure remediation:**
- Address each failed criterion individually
- Re-run after each fix

---

### Serial 25. Create Database Backup

**Why:** Always back up before deploying to production.

**Action:**
```bash
mkdir -p db/backups
npm run db:backup
```

**Expected success output:**
```
✓ Backup created: db/backups/alaminn-info-2026-07-20.sql.gz
```

**Failure remediation:**
- Ensure `db/backups/` directory exists
- Check disk space: `df -h`

---

## 🗂️ PART C — CPANEL DEPLOYMENT (Serial 26–45)

### Serial 26. Log in to cPanel

**Why:** cPanel is the control panel for your shared hosting.

**Action:**
- Visit `https://yourdomain.com:2083`
- Log in with your cPanel username and password

**Expected:** cPanel dashboard loads.

**Failure remediation:**
- Contact your hosting provider for cPanel credentials
- Some hosts use a different port (2082 for HTTP, 2083 for HTTPS)

---

### Serial 27. Create MySQL Database & User

**Why:** Production requires a dedicated MySQL database and user.

**Action:**
1. cPanel → **MySQL Databases**
2. **Create New Database**: `aloeduca_alamin_crm` → Click "Create Database"
3. **Add New User**: username `aloeduca_alamin_crm`, password `ALO2026a` → Click "Create User"
4. **Add User to Database**: select both → Click "Add"
5. **Privileges**: check **ALL PRIVILEGES** → Click "Make Changes"

**Expected success output:**
```
✓ User aloeduca_alamin_crm added to database aloeduca_alamin_crm
```

**Failure remediation:**
- Username max 32 chars (cPanel prefixes with account name)
- Password must meet strength requirements

---

### Serial 28. Note the Database Connection String

**Why:** Needed for `.env.production`.

**Action:** Construct the connection string:
```
mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm
```

**Expected:** Connection string saved for Serial 17.

---

### Serial 29. Upload Project to cPanel

**Why:** The project files must be on the server.

**Action:**
1. cPanel → **File Manager**
2. Navigate to `/home/aloeduca/` (above `public_html`)
3. Click "Upload" → select `ALAMINN-INFO-FULL-PROJECT.zip`
4. After upload, right-click → "Extract" → to `/home/aloeduca/alaminn.info/`

**Alternative (Terminal):**
```bash
cd ~
unzip ALAMINN-INFO-FULL-PROJECT.zip -d alaminn.info/
```

**Expected success output:**
```
Extraction complete
/home/aloeduca/alaminn.info/package.json (exists)
```

**Failure remediation:**
- Ensure extraction is to `/home/aloeduca/alaminn.info/`, NOT inside `public_html`
- If extraction fails: try via Terminal (cPanel → Terminal)

---

### Serial 30. Set File Permissions

**Why:** cPanel requires specific permissions for the Node.js app to run.

**Action (via cPanel Terminal):**
```bash
cd ~/alaminn.info
chmod -R 755 .
chmod 644 .env.production
chmod 755 server.js
chmod -R 755 scripts/
chmod -R 755 deploy/
```

**Expected success output:**
- No errors; permissions updated

**Failure remediation:**
- If `chmod` fails: ensure you own the files (`chown -R $USER:$USER .`)

---

### Serial 31. Copy .env.production to .env

**Why:** The `server.js` entry point loads `.env` from the app root.

**Action (via Terminal):**
```bash
cd ~/alaminn.info
cp deploy/cpanel/.env.production .env
nano .env   # Verify the values are correct
```

**Expected success output:**
- `.env` file exists with `DATABASE_URL`, `AUTH_SECRET`, etc.

**Failure remediation:**
- Compare against `.env.example`
- Ensure no trailing spaces or quotes

---

### Serial 32. Install Dependencies on Server

**Why:** Native modules must be installed on the server's architecture.

**Action (via Terminal):**
```bash
cd ~/alaminn.info
npm ci --omit=dev
```

**Expected success output:**
```
added 432 packages in 60s
```

**Failure remediation:**
- Memory limit: `NODE_OPTIONS="--max-old-space-size=1024" npm ci --omit=dev`
- If `npm ci` fails: `npm install --omit=dev`

---

### Serial 33. Generate Prisma Client on Server

**Why:** The Prisma client must be regenerated for the server's Node.js version.

**Action:**
```bash
npm run db:generate
```

**Expected success output:**
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in 250ms
```

**Failure remediation:**
- Delete cache: `rm -rf node_modules/.prisma && npm run db:generate`

---

### Serial 34. Run Prisma Migration on Production DB

**Why:** Creates all 55 tables in the MySQL database.

**Action:**
```bash
npm run db:migrate:deploy
```

**Expected success output:**
```
55 migrations found
Applying migration 20260720000000_init
All migrations applied successfully.
```

**Failure remediation:**
- Verify `DATABASE_URL` in `.env` points to MySQL
- Check DB user has CREATE, ALTER, INDEX privileges

---

### Serial 35. Seed Production Database

**Why:** Populates admin user and reference data.

**Action:**
```bash
NODE_ENV=production npm run db:seed
```

**Expected success output:**
```
✔ Admin user created
✔ 251 rows seeded
```

**Failure remediation:**
- Re-run safely (upserts)
- Check DB user has INSERT privilege

---

### Serial 36. Build Production Bundle on Server

**Why:** Creates the optimized standalone build on the server's architecture.

**Action:**
```bash
NODE_ENV=production npm run build
```

**Expected success output:**
```
✓ Compiled successfully
✓ Build completed
```

**Failure remediation:**
- Memory: `NODE_OPTIONS="--max-old-space-size=2048" npm run build`
- Disk space: `df -h` (need ~1 GB free)

---

### Serial 37. Create Node.js App in cPanel

**Why:** cPanel's "Setup Node.js App" UI manages the Node.js process.

**Action:**
1. cPanel → **Software** → **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 22 (or 20 minimum)
   - **Application mode**: Production
   - **Application root**: `alaminn.info`
   - **Application URL**: `alaminn.info` (your domain)
   - **Application startup file**: `server.js`
4. Click **Create**

**Expected success output:**
```
✓ Application created
Node.js app running on port (auto-assigned)
```

**Failure remediation:**
- If "Application root" doesn't exist: ensure files are uploaded first
- If port auto-assign fails: cPanel will retry on save

---

### Serial 38. Configure Environment in cPanel App UI

**Why:** cPanel's UI lets you set env vars without editing `.env`.

**Action:**
1. In the Node.js App page, scroll to **Environment variables**
2. Add each variable from `.env`:
   - `DATABASE_URL` = `mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm`
   - `AUTH_SECRET` = (your 32+ byte hex string)
   - `NEXT_PUBLIC_APP_URL` = `https://alaminn.info`
   - `NODE_ENV` = `production`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
3. Click **Save**

**Expected success output:**
- All env vars listed in the UI

**Failure remediation:**
- Variables with special characters: wrap in quotes
- Restart the app after saving: click "Restart"

---

### Serial 39. Install .htaccess for Rewrites (Optional)

**Why:** If using Apache + Passenger (some cPanel hosts), `.htaccess` rewrites requests to the Node.js app.

**Action:**
1. cPanel → File Manager → `public_html`
2. Create `.htaccess` with:
```apache
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:PORT/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:PORT/$1 [P,L]
```
Replace `PORT` with the port cPanel assigned (visible in the Node.js App UI).

**Expected success output:**
- `.htaccess` saved in `public_html`

**Failure remediation:**
- If using NGINX (some hosts): skip this step; cPanel configures automatically
- For 502 errors: verify the Node.js app is running (click "Run" in the App UI)

---

### Serial 40. Start the Node.js App

**Why:** Boots the production server.

**Action:**
1. cPanel → Setup Node.js App → your app
2. Click **Run NPM Install** (if not done in Serial 32)
3. Click **Restart**

**Expected success output:**
```
✓ App started
Status: Running
```

**Failure remediation:**
- Check the app's error log (visible in the App UI)
- Common: missing `.env`, wrong `DATABASE_URL`, port conflict

---

### Serial 41. Verify Production Health Endpoints

**Why:** Confirms the live app responds.

**Action:**
```bash
curl https://alaminn.info/api/health
curl https://alaminn.info/api/health/deep
curl https://alaminn.info/api/readiness
```

**Expected success output:**
```json
{"success":true,"message":"Alaminn.info is operational.","data":{"status":"ok"}}
```

**Failure remediation:**
- 502/503: app not running — check App UI
- 500: check error log in App UI
- DNS not resolving: wait for DNS propagation (up to 24h)

---

### Serial 42. Verify Homepage Loads

**Why:** Confirms the main website renders.

**Action:** Visit `https://alaminn.info` in browser.

**Expected:** Homepage loads with all 13 sections + "Higher Study" link in navbar.

**Failure remediation:**
- Blank page: check browser console for JS errors
- Missing styles: ensure `.next/static/` was copied (Serial 22)

---

### Serial 43. Verify Higher Study Platform

**Why:** Confirms the Higher Study sub-platform works.

**Action:** Click "Higher Study" in navbar.

**Expected:** Higher Study homepage loads with all 21 sub-sections.

**Failure remediation:**
- 404: verify `src/app/higher-study/page.tsx` exists in the build
- Blank: check `dev.log` or App UI error log

---

### Serial 44. Test Admin Login

**Why:** Confirms the CRM/Command Center is accessible.

**Action:**
1. Visit `https://alaminn.info/admin/login`
2. Log in with `admin@alaminn.info` and your `ADMIN_PASSWORD`

**Expected:** Dashboard loads with CRM, AI Workspace, Approvals, Audit.

**Failure remediation:**
- Wrong password: re-seed admin (`npm run db:seed`)
- 403 Forbidden: check RBAC permissions in `src/lib/rbac.ts`

---

### Serial 45. Verify SSL Certificate

**Why:** HTTPS is required for production (security + SEO).

**Action:**
1. cPanel → **SSL/TLS Status**
2. Ensure your domain shows "Private and Secure"
3. If not, click **Run AutoSSL**

**Expected success output:**
```
✓ alaminn.info — Private and Secure
```

**Failure remediation:**
- Wait for AutoSSL to complete (up to 15 min)
- For persistent failure: contact hosting provider

---

## 🗂️ PART D — POST-LAUNCH (Serial 46–55)

### Serial 46. Configure SMTP Email

**Why:** Transactional emails (OTP, registration, consultation) require SMTP.

**Action:**
1. Sign up for SMTP service (Resend, SendGrid, Mailgun, or your host's SMTP)
2. Add credentials to `.env`:
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx
EMAIL_FROM="Alaminn.info <noreply@alaminn.info>"
```
3. Restart the Node.js app

**Expected success output:**
- Test email arrives in inbox

**Failure remediation:**
- Verify DNS records (SPF, DKIM, DMARC) per your SMTP provider's docs
- Check port 587 is not blocked by your host

---

### Serial 47. Set Up Cron Jobs

**Why:** 13 automated tasks (backups, email queue, deadline alerts) need scheduling.

**Action:**
1. cPanel → **Cron Jobs**
2. Add each cron job (use `wget` with auth token):

| Frequency | Command |
|-----------|---------|
| Every 5 min | `wget -q -O- "https://alaminn.info/api/cron/email-queue?token=CRON_SECRET" >/dev/null 2>&1` |
| Every 5 min | `wget -q -O- "https://alaminn.info/api/cron/notification-queue?token=CRON_SECRET" >/dev/null 2>&1` |
| Every 15 min | `wget -q -O- "https://alaminn.info/api/cron/health-monitor?token=CRON_SECRET" >/dev/null 2>&1` |
| Hourly | `wget -q -O- "https://alaminn.info/api/cron/scholarship-deadlines?token=CRON_SECRET" >/dev/null 2>&1` |
| Hourly | `wget -q -O- "https://alaminn.info/api/cron/phd-deadlines?token=CRON_SECRET" >/dev/null 2>&1` |
| Hourly | `wget -q -O- "https://alaminn.info/api/cron/referral-retry?token=CRON_SECRET" >/dev/null 2>&1` |
| Daily 2 AM | `wget -q -O- "https://alaminn.info/api/cron/backup?token=CRON_SECRET" >/dev/null 2>&1` |
| Daily 3 AM | `wget -q -O- "https://alaminn.info/api/cron/session-cleanup?token=CRON_SECRET" >/dev/null 2>&1` |
| Daily 4 AM | `wget -q -O- "https://alaminn.info/api/cron/temp-cleanup?token=CRON_SECRET" >/dev/null 2>&1` |
| Daily 5 AM | `wget -q -O- "https://alaminn.info/api/cron/data-verification?token=CRON_SECRET" >/dev/null 2>&1` |
| Daily 6 AM | `wget -q -O- "https://alaminn.info/api/cron/sitemap-generate?token=CRON_SECRET" >/dev/null 2>&1` |

**Expected success output:**
- All cron jobs listed in cPanel → Cron Jobs → Current Cron Jobs

**Failure remediation:**
- Replace `CRON_SECRET` with the value from your `.env` `CRON_SECRET` variable
- Test a cron manually: `wget "https://alaminn.info/api/cron/backup?token=SECRET"`

---

### Serial 48. Configure Google Analytics (Optional)

**Why:** Track visitor behavior (privacy-friendly, first-party analytics already built-in).

**Action:**
1. Set `NEXT_PUBLIC_GA_ID=G-XXXXXXXX` in `.env`
2. Restart the app

**Expected:** Analytics events tracked in Google Analytics dashboard.

---

### Serial 49. Submit Sitemap to Google Search Console

**Why:** Ensures search engines index your site.

**Action:**
1. Visit `https://alaminn.info/sitemap.xml` — confirm it loads
2. Submit to Google Search Console: `https://search.google.com/search-console`
3. Add property → verify ownership → submit sitemap

**Expected success output:**
- Sitemap submitted; status "Pending" then "Success"

---

### Serial 50. Test the ALO Education Integration

**Why:** Verifies the referral transfer flow works end-to-end.

**Action:**
1. Submit a test inquiry on `/higher-study/book-consultation`
2. Check the ALO Education callback endpoint receives the referral
3. Verify the referral appears in the admin dashboard

**Expected success output:**
- Referral created with HMAC signature
- Callback received and verified

**Failure remediation:**
- Check `ALO_EDUCATION_API_KEY` and `ALO_EDUCATION_HMAC_SECRET` in `.env`
- Review `src/lib/higher-study/integration.ts` for the PII guard

---

### Serial 51. Run a Backup

**Why:** Confirms the backup system works in production.

**Action:**
```bash
cd ~/alaminn.info
npm run db:backup
ls -la db/backups/
```

**Expected success output:**
```
db/backups/alaminn-info-2026-07-20.sql.gz
```

**Failure remediation:**
- Ensure `db/backups/` exists: `mkdir -p db/backups`
- Check DB user has `LOCK TABLES` privilege

---

### Serial 52. Test Restore (in staging only)

**Why:** A backup you can't restore is useless.

**Action:**
```bash
# Create a test DB
mysql -u root -e "CREATE DATABASE alaminn_test_restore"

# Restore
DATABASE_URL="mysql://USER:PASS@localhost:3306/alaminn_test_restore" npm run db:restore -- db/backups/alaminn-info-2026-07-20.sql.gz

# Verify
DATABASE_URL="mysql://USER:PASS@localhost:3306/alaminn_test_restore" npm run db:verify

# Cleanup
mysql -u root -e "DROP DATABASE alaminn_test_restore"
```

**Expected success output:**
```
✓ Restore complete
✓ All tables present
✓ Integrity check passed
```

---

### Serial 53. Monitor Health

**Why:** Catch issues before users do.

**Action:**
- Bookmark `https://alaminn.info/api/health/deep`
- Check daily for the first week
- Set up uptime monitoring (Uptime Robot, Better Stack, etc.) on `https://alaminn.info/api/health`

**Expected:** Status `ok` on all checks.

---

### Serial 54. Set Up Log Rotation (Optional)

**Why:** Logs can fill disk space over time.

**Action:**
```bash
# In cPanel Terminal
cat > ~/alaminn.info/logrotate.conf << 'EOF'
/home/aloeduca/alaminn.info/logs/*.log {
  weekly
  rotate 4
  compress
  missingok
  notifempty
}
EOF

# Add to crontab
echo "0 0 * * 0 /usr/sbin/logrotate -f ~/alaminn.info/logrotate.conf" | crontab -
```

**Expected:** Logs rotate weekly.

---

### Serial 55. Document Your Configuration

**Why:** Future you will thank you.

**Action:** Save the following in a secure location (password manager):
- cPanel URL, username
- MySQL DB name, user, password
- AUTH_SECRET
- SMTP credentials
- Admin email and password
- Domain registrar info
- SSL certificate expiry date

---

## 🗂️ PART E — MAINTENANCE & UPDATES (Serial 56–60)

### Serial 56. Update the Project

**Why:** Apply security patches and new features.

**Action:**
```bash
cd ~/alaminn.info
# Upload new ZIP (overwrite)
unzip -o ALAMINN-INFO-FULL-PROJECT.zip

# Install any new dependencies
npm ci --omit=dev

# Run any new migrations
npm run db:migrate:deploy

# Rebuild
NODE_ENV=production npm run build

# Restart app (cPanel → Setup Node.js App → Restart)
```

**Expected success output:**
- App restarts with new code
- No errors in log

**Failure remediation:**
- Rollback: see Serial 60

---

### Serial 57. Backup Before Every Update

**Why:** Always have a rollback point.

**Action:**
```bash
npm run db:backup
```

**Expected:** Backup file in `db/backups/`.

---

### Serial 58. Monitor Database Size

**Why:** Shared hosting has DB size limits.

**Action:**
```bash
# In cPanel Terminal
mysql -u aloeduca_alamin_crm -p aloeduca_alamin_crm -e "
SELECT table_schema 'DB',
ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) 'MB'
FROM information_schema.tables
GROUP BY table_schema;"
```

**Expected:** Size under your hosting limit (typically 1–5 GB).

**Failure remediation:**
- Archive old audit logs: `DELETE FROM "AuditLog" WHERE "createdAt" < '2025-01-01';`
- Optimize tables: `mysql -u USER -p DB -e "OPTIMIZE TABLE AuditLog, Event;"`

---

### Serial 59. Renew SSL Certificate

**Why:** SSL expires annually (AutoSSL handles this automatically, but verify).

**Action:**
- cPanel → SSL/TLS Status → check expiry date
- If expired: click "Run AutoSSL"

**Expected:** Certificate valid for at least 60 more days.

---

### Serial 60. Rollback (Emergency)

**Why:** If a deployment breaks the site, roll back immediately.

**Action:**
```bash
cd ~/alaminn.info

# 1. Stop the app (cPanel → Setup Node.js App → Stop)

# 2. Restore database from backup
npm run db:restore -- db/backups/alaminn-info-PREVIOUS-DATE.sql.gz

# 3. Restore code from previous ZIP
unzip -o ALAMINN-INFO-FULL-PROJECT-PREVIOUS.zip

# 4. Reinstall dependencies
npm ci --omit=dev

# 5. Rebuild
NODE_ENV=production npm run build

# 6. Start the app (cPanel → Setup Node.js App → Run)
```

**Expected success output:**
- Site back online with previous version

**Failure remediation:**
- Contact hosting provider if app won't start
- Restore from hosting provider's server snapshot (if available)

---

## 📦 Deliverables in This Package

| # | File | Purpose |
|---|------|---------|
| 1 | `ALAMINN-INFO-FULL-PROJECT.zip` | Full source code (this ZIP) |
| 2 | `FULL-PROJECT-GUIDE.md` | This guide (60 serial steps) |
| 3 | `package.json` | Dependencies and scripts |
| 4 | `package-lock.json` | Locked dependency versions |
| 5 | `server.js` | Production entry point |
| 6 | `next.config.ts` | Next.js configuration |
| 7 | `prisma/schema.prisma` | SQLite dev schema |
| 8 | `prisma/schema.mysql.prisma` | MySQL prod schema |
| 9 | `prisma/seed.ts` | Database seeder |
| 10 | `.env.example` | Environment variable template |
| 11 | `deploy/cpanel/setup-cpanel.sh` | Automated cPanel setup |
| 12 | `deploy/cpanel/redeploy.sh` | Update script |
| 13 | `deploy/cpanel/.env.production` | Pre-filled production env |
| 14 | `scripts/verify-db.ts` | DB integrity check |
| 15 | `scripts/backup-db.ts` | DB backup script |
| 16 | `scripts/restore-db.ts` | DB restore script |
| 17 | `scripts/security-tests.ts` | 22 security tests |
| 18 | `scripts/verify-production.sh` | Production readiness check |
| 19 | `src/` | Full source code (434 .ts/.tsx files) |
| 20 | `mini-services/` | 4 background services (optional) |

---

## ✅ Acceptance Criteria (33 checks)

Verify each before declaring production-ready:

- [ ] 1. Node.js 20+ installed
- [ ] 2. npm 10+ installed
- [ ] 3. Project ZIP extracted
- [ ] 4. `npm ci` succeeds
- [ ] 5. `npm run db:generate` succeeds
- [ ] 6. `.env` configured with all required vars
- [ ] 7. `AUTH_SECRET` is 32+ bytes
- [ ] 8. `DATABASE_URL` points to MySQL in production
- [ ] 9. `npm run db:push` succeeds (dev)
- [ ] 10. `npm run db:seed` succeeds
- [ ] 11. `npm run db:verify` reports 0 anomalies
- [ ] 12. `npm run lint` reports 0 errors
- [ ] 13. `npm run typecheck` reports 0 errors
- [ ] 14. `npm run test` — 171/171 pass
- [ ] 15. `npm run test:security` — 22/22 pass
- [ ] 16. `npm run dev` starts without errors
- [ ] 17. `/api/health` returns 200
- [ ] 18. `/api/health/deep` returns 200
- [ ] 19. `/api/readiness` returns 200
- [ ] 20. Homepage loads at `/`
- [ ] 21. Higher Study loads at `/higher-study`
- [ ] 22. Admin login works at `/admin/login`
- [ ] 23. `npm run build` succeeds
- [ ] 24. `.next/standalone/server.js` exists
- [ ] 25. `.next/standalone/.next/static/` exists
- [ ] 26. `.next/standalone/public/` exists
- [ ] 27. `node server.js` boots in production
- [ ] 28. cPanel MySQL DB created
- [ ] 29. cPanel Node.js App created
- [ ] 30. `.env` in `/home/aloeduca/alaminn.info/` (outside public_html)
- [ ] 31. SSL certificate active
- [ ] 32. Cron jobs configured
- [ ] 33. `npm run verify:production` passes

When all 33 boxes are checked → **PRODUCTION READY** ✅

---

## 🆘 Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Blank page | JS error | Check browser console |
| 500 error | Server error | Check `dev.log` or App UI error log |
| 502/503 | App not running | Restart in cPanel App UI |
| 404 | Route missing | Verify file in `src/app/` |
| DB connection error | Wrong `DATABASE_URL` | Verify in `.env` |
| Auth failed | Wrong `AUTH_SECRET` | Regenerate and restart |
| Email not sent | SMTP not configured | Set `SMTP_*` vars |
| OOM during build | Low memory | `NODE_OPTIONS="--max-old-space-size=4096"` |
| Prisma client error | Stale client | `rm -rf node_modules/.prisma && npm run db:generate` |
| Migration failed | DB permission | Grant ALL PRIVILEGES to DB user |

---

## 📞 Support

- **Documentation**: This guide + inline code comments
- **Code quality**: 171 tests + 22 security tests
- **Verification**: `npm run verify:production` (33 checks)
- **Health monitoring**: `/api/health/deep` endpoint
- **Audit trail**: All admin actions logged in `AuditLog` table

**End of Guide — 60 Serial Steps Complete** 🎉
