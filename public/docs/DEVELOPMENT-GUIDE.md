# ALO Education ERP — Development Guide

## 1. Prerequisites

- Node.js 22.x (verified on 22.23.1)
- npm 10.x (verified on 10.9.8)
- Git
- (Optional) MySQL CLI for inspecting the dev DB

## 2. First-time Setup

```bash
git clone <repo-url> alo-education-erp
cd alo-education-erp

# Install dependencies (exact versions from lockfile)
npm ci

# Copy environment template
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Create local MySQL DB and apply migrations
npx prisma migrate reset --force   # also runs seed

# (Optional) Re-run seed only
npx prisma db seed
```

After setup, login credentials (from seed):

| Portal    | Email                     | Password        |
|-----------|---------------------------|-----------------|
| Admin     | admin@aloeducation.com          | SET_VIA_ENVIRONMENT_ONLY   |
| Employee  | counselor@alo.edu.bd      | SET_VIA_ENVIRONMENT_ONLY   |
| Student   | student@alo.edu.bd        | SET_VIA_ENVIRONMENT_ONLY   |
| Partner   | partner.global@alo.edu.bd | SET_VIA_ENVIRONMENT_ONLY   |

All portals share the same password. **Change on first login in production.**

## 3. Common Scripts

```bash
npm run dev            # Dev server at http://localhost:3000
npm run typecheck      # tsc --noEmit (must pass with 0 errors)
npm run lint           # ESLint (must pass with 0 errors)
npm run test           # Vitest unit + integration
npm run test:integration
npm run test:e2e       # Playwright (requires `npx playwright install`)
npm run build          # prisma generate && next build && prepare-standalone
npm start              # Run standalone server (production)
npm run db:validate    # Validate Prisma schema
npm run db:generate    # Regenerate Prisma Client
npm run db:migrate     # Create new migration from schema changes
npm run db:deploy      # Apply pending migrations
npm run db:reset       # Drop & recreate DB, apply migrations, seed
npm run db:seed        # Run seed script (idempotent)
npm run check          # Full pipeline: validate + generate + typecheck + lint + test + build
```

## 4. Project Structure

```
alo-education-erp/
├── prisma/
│   ├── schema.prisma           # Source of truth for DB
│   ├── seed-complete.ts        # Canonical idempotent seed
│   ├── seed-universities.ts    # Optional university data
│   └── migrations/             # Committed migrations
├── src/
│   ├── app/
│   │   ├── page.tsx            # SPA entry (renders all portal views via Zustand)
│   │   ├── api/                # API routes (139 routes)
│   │   └── ...
│   ├── components/
│   │   ├── website/            # Public website components
│   │   ├── crm/                # Staff CRM dashboard
│   │   ├── student/            # Student portal
│   │   ├── partner/            # Partner portal
│   │   ├── marketing/          # Marketing hub
│   │   └── auth/               # Login / register
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── auth-middleware.ts  # withAuth, RBAC helpers
│   │   └── ...
│   └── stores/
│       └── portal-store.ts    # Zustand SPA state
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                    # Playwright specs
├── scripts/                    # Maintenance scripts
├── deploy/ubuntu/              # Deployment artifacts
└── next.config.ts              # Standalone build + SPA rewrites
```

## 5. Architecture Notes

### 5.1 SPA Routing

The app uses a **single Next.js page route (`/`)** with URL rewrites in `next.config.ts`. Public routes like `/book-consultation`, `/course-finder`, `/student/login` are rewritten to `/?p=<view>`. The home page reads the `?p=` query param on mount and sets the active view in the Zustand store.

To add a new public route:
1. Add a rewrite rule in `next.config.ts`
2. Add a view handler in `src/stores/portal-store.ts`
3. Add the view component in `src/components/website/`

### 5.2 Authentication & RBAC

Authentication uses bearer tokens stored in the `PortalSession` table. The `withAuth` HOC in `src/lib/auth-middleware.ts` handles validation and RBAC checks.

```typescript
// Pattern 1: Direct export (preferred for simple routes)
export const GET = withAuth(
  async (request, auth) => { /* ... */ },
  { requireRoles: ['counselor', 'admin'] }
);

// Pattern 2: Wrapper (for routes needing pre-handler logic)
export async function GET(request: Request) {
  // pre-handler logic
  return withAuth(
    async (req, auth) => { /* ... */ },
    { requirePermissions: ['leads.read'] }
  )(request);
}
```

13 RBAC roles are seeded:
- SUPER_ADMIN, ADMIN, HR_MANAGER, BRANCH_MANAGER, COUNSELOR
- APPLICATION_TEAM, VISA_OFFICER, FINANCE, MARKETING
- FRONT_DESK, SUPPORT_STAFF, PARTNER, STUDENT

3 scope levels: ALL, BRANCH, ASSIGNED, NONE.

### 5.3 Database

MySQL for development. Prisma schema at `prisma/schema.prisma` is the source of truth. To change the schema:

1. Edit `prisma/schema.prisma`
2. Create a migration: `npm run db:migrate -- --name <descriptive_name>`
3. The migration SQL is committed; review it
4. Run `npm run db:generate` to refresh the Prisma Client
5. Update affected APIs and seed scripts
6. Add tests

Never use `prisma db push` for production migrations — always use `prisma migrate dev` (local) / `prisma migrate deploy` (prod).

### 5.4 Adding a New API Route

```bash
mkdir -p src/app/api/<resource>
cat > src/app/api/<resource>/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export const GET = withAuth(
  async (request, auth) => {
    const items = await db.someModel.findMany({ /* ... */ });
    return NextResponse.json({ success: true, data: items });
  },
  { requirePermissions: ['<resource>.read'] }
);

export const POST = withAuth(
  async (request, auth) => {
    const body = await request.json();
    const created = await db.someModel.create({ data: body });
    await logAuditAction(auth, '<resource>.create', 'SomeModel', created.id, body);
    return NextResponse.json({ success: true, data: created });
  },
  { requirePermissions: ['<resource>.create'] }
);
EOF
```

## 6. Testing

### 6.1 Unit Tests

Located in `tests/unit/`. Use Vitest. No DB access — pure logic.

```bash
npm test                    # All tests
npm test -- tests/unit/     # Unit only
```

### 6.2 Integration Tests

Located in `tests/integration/`. Use Vitest with a real test database (in-memory or temporary file).

### 6.3 E2E Tests (Playwright)

Located in `tests/e2e/`. Requires Playwright browsers installed:

```bash
npx playwright install
npm run test:e2e
```

## 7. Code Style

- **TypeScript strict mode** — no `any`, no `as any`, no `@ts-ignore`
- **No build suppression** — `next.config.ts` must NOT contain `typescript.ignoreBuildErrors`
- **Linting** — ESLint with `eslint-config-next`. 0 errors required.
- **Formatting** — Prisma schema must be formatted (`npx prisma format`)
- **Imports** — Use `@/` alias for `src/` paths
- **Error handling** — Try/catch at API boundaries; return `NextResponse.json({ success: false, error: '...' }, { status: <code> })`

## 8. Adding a New RBAC Role

1. Edit `prisma/seed-complete.ts` — add to `roles` array
2. Edit `src/lib/auth-middleware.ts` — update role checks if needed
3. Edit `src/components/auth/RegisterPage.tsx` — add to portal selection if relevant
4. Create a migration if any new permission junction is needed
5. Add tests covering the new role

## 9. Debugging

### Prisma Client errors

```bash
# Regenerate after schema changes
npx prisma generate

# Check what's actually in the generated client
ls node_modules/.prisma/client/
```

### Login issues

```bash
# Check user exists and status
node scripts/check-users.mjs

# Check session table
node -e "import('@prisma/client').then(({PrismaClient}) => { const p = new PrismaClient(); p.portalSession.findMany({include:{user:true}}).then(r => console.log(r)) })"
```

### Build issues

```bash
rm -rf .next tsconfig.tsbuildinfo node_modules
npm ci
npm run typecheck
npm run build
```

## 10. Contributing

1. Create a feature branch: `git checkout -b feat/<name>`
2. Make changes — keep commits focused
3. Run `npm run check` — must pass with 0 errors
4. Add or update tests
5. Submit PR — describe the change and link the issue

## 11. FAQ

**Q: Why does `npm ci` print `allow-scripts` warnings?**
A: npm 10+ requires explicit approval for postinstall scripts. The warnings are harmless — the scripts run because they are in the `allow-scripts` allowlist. To suppress: `npm approve-scripts` (interactive).

**Q: Where are uploaded files stored?**
A: Local filesystem at `./upload/` by default. Set `STORAGE_PROVIDER=s3` and configure S3 credentials in `.env` for production.

**Q: How do I reset the DB to a clean state?**
A: `npm run db:reset` — drops, recreates, applies migrations, and seeds.

**Q: Can I use MySQL/MariaDB instead of MySQL?**
A: The Prisma schema uses MySQL-compatible types. MySQL is the recommended production target. MariaDB/MySQL requires schema review (e.g. remove `String` `@db.Text` annotations, replace with native types).

**Q: Why is `reactStrictMode: false` in next.config.ts?**
A: Historical — some shadcn/ui components had double-render issues. Safe to set `true` if you verify the UI still works.
