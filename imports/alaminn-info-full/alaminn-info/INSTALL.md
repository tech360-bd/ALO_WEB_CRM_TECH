# INSTALL.md — Al Aminn Info Platform

> **TL;DR**: 5-minute setup. For the complete guide, see **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Bun** | ≥ 1.3.14 | `curl -fsSL https://bun.sh/install \| bash` |
| **Node.js** | ≥ 20 (optional, for some scripts) | https://nodejs.org |
| **Git** | any | https://git-scm.com |

Verify:
```bash
bun --version    # should print 1.3.x or newer
```

## Setup (5 steps)

### 1. Unzip
```bash
unzip alaminn-info-FULL-SOURCE.zip
cd alaminn-info-FULL-SOURCE
```

### 2. Install dependencies
```bash
bun install
```
This also runs `prisma generate` automatically (postinstall hook).

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set at minimum:
```bash
AUTH_SECRET=<output of: openssl rand -hex 32>
DATABASE_URL=file:./db/custom.db    # or absolute path
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Initialize the database
```bash
bun run db:push     # Creates SQLite file + tables (55 models)
bun run db:seed     # Seeds 250+ rows: admin user, 30 countries, 12 universities, 24 courses, 8 scholarships, EL courses, etc.
```

### 5. Start the dev server
```bash
bun run dev
```
→ Open **http://localhost:3000**

## First login

- URL: **http://localhost:3000/admin/login**
- Email: `admin@alaminn.info`
- Password: `ChangeMeNow!2024`
- **Change the password immediately** at `/admin/settings` → Account.

## Verify it works

```bash
# Health check
curl http://localhost:3000/api/health
# → {"success":true,"message":"Alaminn.info is operational."}

# Lint
bun run lint
# → 0 errors, 0 warnings

# Tests
bun run test
# → 241 tests pass

# Type check
bun run typecheck
# → 0 errors
```

## Common next steps

- **Add a new admin page**: see DEVELOPMENT.md §20 "Adding a new admin CRUD page"
- **Add a new API route**: see DEVELOPMENT.md §20 "Adding a new public API endpoint"
- **Configure email**: uncomment `SMTP_*` or `RESEND_API_KEY` in `.env`
- **Start mini-services**: see DEVELOPMENT.md §8
- **Deploy to production**: see DEVELOPMENT.md §16

## Need help?

- **Complete guide**: [DEVELOPMENT.md](./DEVELOPMENT.md) — every file, every command, every env var
- **Deployment**: [DEVELOPMENT.md §16](./DEVELOPMENT.md#16-deployment--local-cpanel-docker-pm2-systemd)
- **Troubleshooting**: [DEVELOPMENT.md §19](./DEVELOPMENT.md#19-troubleshooting)

---

**Default admin**: `admin@alaminn.info` / `ChangeMeNow!2024` — change it!
