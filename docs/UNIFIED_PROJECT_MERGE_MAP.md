# Unified Project Merge Map

**Date:** 2026-10-27
**Canonical repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Canonical branch:** `arena/00d5c43f-alo-web-crm-tech`
**Base commit:** `e4e3d75a02c0c42604693a47b02cd4d6e1d17fd7`

---

## 1. Source-of-truth decision

| Candidate | Verdict | Reason |
|---|---|---|
| `tech360-bd/ALO_WEB_CRM_TECH` (this checkout) | **CANONICAL** | Active `main`, 68,289 tracked files, 457 pages, 1,034 API routes, 604 Prisma models, 41 migrations, 25 seed scripts, GitHub Actions, Docker/deploy scripts. Most complete and most recently merged (PR #37). |
| `alo-education-web-crm-final/` (in-repo duplicate) | **Duplicate — do not merge back** | Older snapshot; superseded by the root project. Kept on disk but not a source of truth. |
| `deploy-build/` (in-repo duplicate) | **Build artifact copy** | Contains a `prisma/schema.prisma` and build output; not authoritative. |
| `imports/alo-education-full/` | **Vendored snapshot** | Has its own `node_modules/.prisma/client` (a generated client for a *different* schema). Not authoritative; schema mismatch risk. |
| `imports/alo-education-source/` | **Vendored snapshot** | Same as above. |
| `.repair-backup-20260819/` | **Backup** | Saved config/schema from 2026-08-19 repair. Reference only. |

**Decision:** Treat the root checkout as the single canonical project. Do **not** overwrite it
with any duplicate. Duplicates are documented, not merged.

---

## 2. Repositories inspected

| Repo | Access | Relevance | Action |
|---|---|---|---|
| `tech360-bd/ALO_WEB_CRM_TECH` | ✅ accessible (3 refs) | **Canonical project** | Audited & repaired |
| `engralaminn-collab/alo-education-uk-final` | ❌ "Repository not found" | User's sibling (education UK) | **Blocked** — request access |
| `engralaminn-collab/ukvi-ai-markting_n8n` | ❌ "Repository not found" | User's sibling (n8n marketing) | **Blocked** — request access |
| `engralaminn-collab/Ai-Markting-crm` | ❌ "Repository not found" | User's sibling (AI marketing CRM) | **Blocked** — request access |

All other URLs in the brief (video generators, Ubuntu CIS, language tools, CRM
samples such as `wacrm`, `Django-CRM`, `frappe/crm`, `CRMEB`, `idurar-erp-crm`,
`fat_free_crm`, agent platforms, `cometchat`, etc.) are **third-party reference /
inspiration material**, not part of this project's codebase. They were evaluated for
relevance and classified as **reference-only**; none were merged. Marketing sites
(osom.global, speak.com, osam.ai, bdtechlabs.com, etc.) were **not reachable** from the
sandbox (outbound allowlist) and could not be inspected.

---

## 3. Duplicate / overlapping implementations found

| Item | Location A | Location B | Resolution |
|---|---|---|---|
| Homepage | `src/app/page.tsx` (632 lines, SPA router) | `src/components/alo/views/public-home.tsx` (2,075 lines) | `page.tsx` is the router; `public-home.tsx` is the view. Kept, not duplicated. |
| Super-admin dashboard | `src/components/admin/EnhancedSuperAdminControlCenter.tsx` | `src/components/admin/super-admin-command-center/` (new) | **Both kept** as sibling routes (`/super-admin/control-center` vs `/super-admin/dashboard`) so no capability is lost. |
| Prisma schema | `prisma/schema.prisma` (604 models) | `imports/alo-education-full/prisma/schema.prisma`, `alo-education-web-crm-final/prisma/schema.prisma`, `deploy-build/prisma/schema.prisma`, `.repair-backup-20260819/schema.prisma` | Root `prisma/schema.prisma` is canonical. |
| Generated Prisma client | `node_modules/.prisma/client` (stub, 3,989 B) | `imports/alo-education-full/node_modules/.prisma/client` (real, but different schema) | **Do not use** the vendored client — schema mismatch. |

---

## 4. Integration map (canonical project)

```
Next.js 16 (App Router, webpack build)
├── src/app/**            457 pages, 6 layouts
├── src/app/api/**        1,034 route handlers (admin/crm/phd/visa/employee/... )
├── src/proxy.ts          662-line fail-closed route/auth gate
├── src/lib/**            454 modules (db, ai-workforce, accounting, crm, rules, ...)
├── prisma/schema.prisma  604 models, MySQL datasource
├── prisma/migrations/    41 migrations
├── scripts/              assert-node22, verify-prisma-client, ai-workforce mirror/verify
├── .github/workflows/    CI/CD
└── docs/                 this documentation set
```

**Data flow:** browser → `src/proxy.ts` (auth) → Next route/API → Prisma → MySQL.
**AI surface:** `api/ai-workforce`, `api/agentos`, `api/brains`, `api/ai-command` →
`lib/ai-workforce/*`, `lib/model-router.ts`, `lib/ai-gateway.ts`.

---

## 5. Conflicts resolved (this session)

| Conflict | Resolution |
|---|---|
| `/super-admin/dashboard` previously rendered `EnhancedSuperAdminControlCenter` | Repointed to the new Command Center; original preserved at `/super-admin/control-center` and `/admin/dashboard`. |
| Next 16 Turbopack vs `webpack` config in `next.config.ts` | `dev` script now passes `--webpack` explicitly (matches the canonical build). |
| Root page `useSearchParams()` required a Suspense boundary whose fallback was blank white | Fallback now renders `<PublicView view="website" />` so the first paint is real content. |

---

## 6. Proposed (not executed) consolidations

- Collapse `imports/*`, `alo-education-web-crm-final/`, `deploy-build/` duplicates —
  **requires authorization** (they are tracked files; deletion is destructive to history).
- Reduce 457 pages / 1,034 API routes to a maintainable surface — **requires a plan and
  authorization**; not silently executed.
- Reconcile the 25 seed scripts into one canonical seed — **proposed**, not executed.
