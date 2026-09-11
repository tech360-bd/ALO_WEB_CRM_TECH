# ALO Education — Development Guide

## Prerequisites
- Bun 1.x or Node.js 22.x
- SQLite (development) / PostgreSQL 16+ (production)

## Setup
```bash
bun install
cp .env.example .env
# Edit .env with your values
bun run db:push
bun run db:seed
bun run dev
```

## Available Scripts
| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint check |
| `bun run typecheck` | TypeScript check |
| `bun run test` | Run tests |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Run all 13 seed scripts |
| `bun run audit` | Run lint + typecheck |

## Project Structure
```
src/
├── app/
│   ├── api/          # 97 API routes
│   ├── globals.css   # Design system
│   ├── layout.tsx    # Root layout (Inter font)
│   └── page.tsx      # View router (53 views)
├── components/
│   ├── alo/          # 7 shared components
│   └── alo/views/    # 53 view components
├── lib/
│   ├── ai.ts         # z-ai-web-dev-sdk
│   ├── auth.ts       # NextAuth config
│   ├── access-control.ts # RBAC engine
│   ├── db.ts         # Prisma client
│   └── alo-types.ts  # Types & constants
└── middleware.ts     # Route protection + RBAC

prisma/
├── schema.prisma     # 113 models
└── seed*.ts          # 13 seed scripts
```

## Adding a New View
1. Create `src/components/alo/views/my-view.tsx`
2. Add ViewKey in `src/lib/alo-types.ts`
3. Add NAV_ITEMS entry
4. Import and render in `src/app/page.tsx`

## Adding a New API
1. Create `src/app/api/my-route/route.ts`
2. Add to PUBLIC_API_ROUTES in middleware (if public)
3. Use `db` from `@/lib/db` for database access
