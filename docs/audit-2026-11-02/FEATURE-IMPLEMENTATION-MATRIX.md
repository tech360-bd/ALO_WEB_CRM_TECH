# 2 · FEATURE IMPLEMENTATION MATRIX

**Question answered:** for every major capability — is it **implemented**, **connected**, **tested**, **configured for deployment**, and **proven working**?
Those are five separate criteria; a feature can pass one and fail the next.

**Legend**
- **Implemented** — first-party code exists (file evidence given).
- **Connected** — reachable from a page/route that is linked in-app, and calls real APIs.
- **Tested** — an automated test exists **and was executed in this audit** (or is explicitly marked NOT RUN/BLOCKED).
- **Deploy-ready** — CI/deployment configuration covers it.
- **Proven working** — evidence from a live run. **No live database was reachable**, so no row below can claim this. Runtime proof is impossible in this environment and is marked `UNPROVEN`.

---

## 1. Summary

| # | Capability | Implemented | Connected | Tested | Deploy-ready | Proven working |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Public website (home, nav, footer, static pages) | Yes — 55 public pages, `src/components/website/*` | Yes | Partly (10 UI/brand tests pass) | Yes | UNPROVEN |
| 2 | Course Finder (public search) | Yes — `/course-finder`, `/api/course-finder` + 16 sub-routes | Yes | Yes — 57 catalogue tests pass | Yes | UNPROVEN |
| 3 | University directory + detail pages | Yes — `/universities`, `/api/course-finder/universities`, `/universities/[slug]` | Yes | Yes | Yes | UNPROVEN |
| 4 | Course detail pages (dual model) | Yes — `/course/[slug]`, `/courses/[slug]` (CrmCourse → CoursePage fallback) | Yes | Yes | Yes | UNPROVEN |
| 5 | Eligibility check + engine | Yes — `/eligibility-check`, `/api/course-finder/eligibility-engine`, `/eligible` | Partly (engine route has no client reference) | Yes — eligibility rules tests pass | Yes | UNPROVEN |
| 6 | Course compare / shortlist / saved | Yes — `/compare`, `/api/course-finder/{compare,public-compare,shortlist,saved}` | Yes | Partly | Yes | UNPROVEN |
| 7 | Lead capture / enquiry / consultation | Yes — `/api/leads`, `/api/lead-forms`, `/book-consultation` | Yes | Partly | Yes | UNPROVEN |
| 8 | Student self-registration → activation → dashboard | Yes — `/api/portal-auth/*`, `/api/student/auth/*`, 57 `/student` pages | Yes | Yes — auth/security tests pass | Yes | UNPROVEN |
| 9 | Applications workflow (student → counsellor → offer → visa) | Yes — 27 API routes, 22 pages, `/api/applications/*` | Yes | Yes — application tests pass | Yes | UNPROVEN |
| 10 | Counsellor workspace | Yes — 26 `/counselor` pages | **18 of 26 pages unreferenced** | Partly | Yes | UNPROVEN |
| 11 | Employee portal + access control (RBAC, quotas, break-glass) | Yes — 49 pages, 34 `/api/employee-access/*` | Mostly (11 pages unreferenced) | Yes — 32 HR/employee tests pass | Yes | UNPROVEN |
| 12 | Super Admin dashboards | Yes — **4 competing implementations** (see report 4) | Yes (all 4 mounted) | Partly | Yes | UNPROVEN |
| 13 | CRM (leads, pipeline, communications, UCC) | Yes — 63 `/crm` pages, 11 `/api/crm/*` + 34 UCC routes | Mostly (19 pages unreferenced) | Yes — 40 communication tests pass | Yes | UNPROVEN |
| 14 | Partner / Agent / B2B portals | Yes — `/partner` 22, `/partner-admin` 24 pages | Yes (1–2 unreferenced) | Partly — 8 tests | Yes | UNPROVEN |
| 15 | Finance / accounting / commissions | Yes — `/api/accounting/*` (9 routes), `commissions`, payroll APIs | **Partially** — 0 finance pages; API-only | Partly — 4 tests | Yes | UNPROVEN |
| 16 | Visa module + AI interview | Yes — 43 API routes, `/visa` pages, interview sessions | Partly | Yes — 12 visa tests | Yes | UNPROVEN |
| 17 | PhD research workspace | Yes — 52 lib files, 54 API routes | **No `/phd` pages** (API + components only) | Yes — 17 tests | Yes | UNPROVEN |
| 18 | AI agents / AgentOS / AI Workforce / Brains | Yes — 100 API routes, 50 lib files, `agents/` payload | Partly (many routes unreferenced) | Yes — 33 tests | Yes | UNPROVEN |
| 19 | WhatsApp / SMS / email / omni-channel comms | Yes — 82 API routes, 17 cron jobs incl. follow-ups | Yes | Yes — 40 tests | Yes | UNPROVEN |
| 20 | Marketing automation / SEO / content engine | Yes — 63 API routes | Partly | Yes — 23 tests | Yes | UNPROVEN |
| 21 | Language prep + English tests catalogue | Yes — 26 pages, 9 API routes, 8 lib files | Yes | Yes | Yes | UNPROVEN |
| 22 | Documents, upload, signed storage | Yes — `/api/documents/*`, `document-security.ts`, `storage-service.ts` | Yes | Partly | Yes | UNPROVEN |
| 23 | Catalogue admin: import, dedupe, review, approve, publish | Yes — `/api/admin/import/*`, `/catalog-review`, `/catalog-changes/apply`, `/api/university-catalogue/coverage/decide` | Mostly (2 routes unreferenced) | Yes — 57 catalogue tests | Yes | UNPROVEN |
| 24 | University data monitoring / source verification | Yes — `/api/university-monitoring/*`, `/api/source-intelligence/*`, cron `university-monitoring` | Partly | Yes — monitoring tests | Yes | UNPROVEN |
| 25 | Backup / restore / health / cron platform | Yes — `backup-mysql.sh`, `restore-mysql.sh`, `/api/cron/database-backup`, 17 cron entries, `/api/health` | Yes | Partly | Yes | UNPROVEN |
| 26 | CMS / page builder / homepage builder | Yes — `/admin/homepage-builder`, `/api/admin/builder`, `/api/live-edit` | Yes | Partly | Yes | UNPROVEN |

**Totals:** 26 capabilities implemented; 26 connected at least partially; 17 have executed passing tests in this audit; 26 have deployment configuration; **0 proven working at runtime**.

---

## 2. Domain file counts (evidence for "implemented")

| Domain | API routes | Pages | Lib files |
| --- | --- | --- | --- |
| University/course catalogue | 65 | 17 | 29 |
| Applications & admission | 27 | 22 | 9 |
| Student portal | 69 | 62 | 8 |
| Employee & HR | 102 | 75 | 8 |
| Finance & accounting | 9 | 0 | 3 |
| Partner / B2B | 42 | 46 | 4 |
| Visa | 43 | 2 | 7 |
| PhD | 54 | 0 | 52 |
| AI / agents / automation | 100 | 0 | 50 |
| Communications (WA/SMS/email) | 82 | 0 | 52 |
| Marketing / SEO / content | 63 | 0 | 27 |
| Language prep & tests | 9 | 26 | 8 |
| Documents & storage | 12 | 0 | 11 |
| Website / CMS content | 32 | 0 | 2 (+51 components) |
| Admin & governance | 161 | 96 | 0 |
| Analytics & reporting | 6 | 0 | 8 |
| *(unclassified remainder)* | 223 | 119 | 276 |

---

## 3. Tests actually executed in this audit

| Suite | Files | Executed? | Result |
| --- | --- | --- | --- |
| `tests/unit` | 326 | **Yes** (`npx vitest run tests/unit`) | **304 files pass / 22 fail** · **3,447 tests pass / 31 fail** |
| `tests/integration` | 14 | **BLOCKED** | Requires `TEST_DATABASE_URL` (absent) → suites self-skip |
| `tests/e2e` | 6 | **NOT RUN** | Requires a running server + Playwright browsers (not installed) |
| `node --test tests/*.mjs` (CI parity/ownership) | 3 | **Yes** | pass |
| ESLint over `src/` | 2,699 | **Yes** | 0 errors, 1 warning |

The 22 failing unit files were re-checked against the base commit (`git stash` → rerun) and fail **before** any change of mine — they are pre-existing (WhatsApp number pool, PHD storage-security, several route-mock suites). No failing test is claimed as passing.

---

## 4. Honest gaps in this matrix

1. **"Working" is unproven everywhere.** Without a database, no endpoint was executed end-to-end.
2. **Connectedness is measured by code reference**, not by clicking the UI. A page referenced only from a dead component counts as referenced; the 95 unreferenced portal pages are listed explicitly in report 5.
3. **Finance, PhD and AI domains are API-heavy with little or no UI** — implemented, but a user cannot reach them from navigation today.
4. **Deployment configuration ≠ deployment.** Whether production matches this branch is unknown (no `.env`, no environment confirmation).
