# ALO Education — Development Audit (Port 3025)

## PROJECT LOCATION
- **Path:** `/home/z/my-project` (Note: `/home/aloeduca/alo-education-dev` does not exist in this environment — no root permissions to create it)
- **Source ZIP:** `ALO-EDUCATION-3025-SOURCE.zip` — NOT FOUND in this environment

## FRAMEWORK
- **Framework:** Next.js 16.1.3 (Turbopack)
- **React:** 19
- **TypeScript:** 5.x
- **Package Manager:** Bun
- **Prisma:** 6.x
- **Database Provider:** SQLite (dev) / MySQL (production schema)
- **Authentication:** NextAuth.js v4
- **API Architecture:** Next.js App Router API routes

## DEPENDENCIES
- Next.js 16.1.3
- React 19
- Prisma 6.x (@prisma/client)
- NextAuth.js v4
- Tailwind CSS 4
- shadcn/ui (48 components)
- Lucide React (icons)
- z-ai-web-dev-sdk (AI)
- bcryptjs, date-fns, etc.

## DATABASE
- **Provider (dev):** SQLite at `file:/home/z/my-project/db/custom.db`
- **Provider (production):** MySQL at `mysql://user_edu:...@127.0.0.1:3306/db_education`
- **Schema:** 180 Prisma models
- **Data:** 100 departments, 2000 AI employees, 10000 skills, 50000 prompts, 500 rules, 500 SOPs, 20 engines, 26 leads, 12 students, 12 applications

## INVENTORY
| Metric | Count |
|--------|-------|
| API Routes | 177 |
| View Components | 118 |
| Prisma Models | 180 |
| shadcn UI Components | 48 |
| ALO Design System Components | 11 |
| Seed Files | 19 |
| Mini Services | 3 |
| AI-Generated Images | 12 |
| AI Command Routes | 5 |
| Communication Routes | 21 |

## AUTH/RBAC
- NextAuth.js v4 with Credentials provider
- JWT session strategy (30-day max age)
- bcrypt password hashing
- Role-based access control (SUPER_ADMIN, ADMIN, COUNSELOR, etc.)
- Middleware enforces RBAC on all /api routes
- Sensitive routes require specific roles (SUPER_ADMIN, ADMIN, FINANCE, etc.)

## CURRENT PORT
- **Configured:** 3025 (in package.json dev script)
- **.env PORT:** 3025
- **Status:** ✅ Running on port 3025

## BUILD STATUS
- **Lint:** ✅ 0 errors, 0 warnings
- **Typecheck:** ✅ 0 errors
- **Build:** NOT RUN (build requires significant memory; dev server used for testing)

## KNOWN ERRORS
1. **Server memory pressure:** The dev server dies after ~5-6 rapid requests due to 4GB RAM limit with no swap. Sequential single-request testing works fine.
2. **Prisma client provider mismatch:** Schema is set to MySQL for production, but dev uses SQLite. Requires `prisma generate` with correct provider before starting.

## KNOWN RISKS
1. Production deployment requires MySQL — schema must be `provider = "mysql"`
2. Dev environment requires SQLite — schema must be temporarily switched
3. The `log: ['query']` Prisma setting was changed to `['error', 'warn']` to reduce memory usage
4. No swap space available — heavy concurrent requests can OOM the server
