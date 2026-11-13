# 5 · FRONTEND · BACKEND · PORTAL AUDIT

> **PARTIALLY SUPERSEDED (2026-11-02, Phase 0C):** the §6 auth-coverage counts in this report
> come from a handler-level regex and therefore understate protection. The authoritative per-route
> matrix is [`phase0c/authz-matrix.csv`](phase0c/authz-matrix.csv) (1,099 routes: 659 role-gated,
> 261 handler-gated, 69 public, 33 public-write, 77 auth-only, 3 mutating auth-only). See
> [`phase0c/07-SECURITY-AND-TEST-ROOT-CAUSE.md`](phase0c/07-SECURITY-AND-TEST-ROOT-CAUSE.md).


**Method:** full walk of `src/` (2,699 code files), import-graph resolution, URL-reference scan for API routes, navigation-link scan for pages, and source inspection of auth helpers. Machine data: [`portal-linkage.json`](portal-linkage.json), [`api-auth-scan.json`](api-auth-scan.json), [`usage-analysis.json`](usage-analysis.json).

---

## 1. Surface summary

| Surface | Pages | Layout | Notes |
| --- | --- | --- | --- |
| Public website | 55 top-level routes (+ nested `blog`, `guides`, `news`, `services`, `destinations`, `universities`, `courses`, …) | `src/app/layout.tsx` | `PublicNavbar.tsx`, `PublicFooter.tsx`, `FloatingActionWidget`, `LiveUniversityCount` |
| `/admin` | **90** | **none** (no `admin/layout.tsx`) | 31 pages unreferenced by any code |
| `/crm` | **63** | none | 19 unreferenced |
| `/student` | **57** | `student/layout.tsx` | 10 unreferenced |
| `/employee` | **49** | `employee/layout.tsx` | 11 unreferenced |
| `/counselor` | **26** | none | **18 of 26 unreferenced** |
| `/partner-admin` | **24** | `partner-admin/layout.tsx` | 1 unreferenced |
| `/partner` | **22** | `partner/layout.tsx` | 2 unreferenced |
| `/application-manager` | **19** | `application-manager/layout.tsx` | 0 unreferenced |
| `/super-admin` | **5** | none | 3 unreferenced |
| `/dashboard`, `/parent-portal`, `/university-portal` | 1 each | none | reachable |
| **Total page routes** | **465** | 6 layouts | 95 portal pages unreferenced (§2) |

Only **6 layouts** exist for 12 portal areas: `admin`, `crm`, `counselor`, `super-admin`, `dashboard` render without a shared portal shell — each page builds its own chrome (evidence: `MasterSuperAdminDashboard` mounted from 10 different admin pages).

---

## 2. Pages implemented but not reachable from navigation (95)

| Portal | Pages | Referenced | Unreferenced | Unreferenced examples |
| --- | --- | --- | --- | --- |
| `/admin` | 90 | 59 | **31** | `/admin/agent-center`, `/admin/ai-monitor`, `/admin/attention`, `/admin/branches`, `/admin/crm-command`, `/admin/data-freshness`, `/admin/destinations`, `/admin/google-stack`, `/admin/import-center/{students,scholarships,countries,country-facts,country-pages,city-living-costs,visa-rules}`, `/admin/opportunity-graph`, `/admin/parents`, `/admin/risk`, `/admin/rule-versions`, `/admin/sla-monitor`, `/admin/social-media-management`, `/admin/source-verification`, `/admin/settings/digital-assets`, `/admin/countries/create`, `/admin/countries/edit/[id]` |
| `/crm` | 63 | 44 | **19** | `/crm/ucc`, communications and campaign views |
| `/counselor` | 26 | 8 | **18** | marketing sub-pages (campaigns/content/image/posts/video) that all wrap the same orphaned view |
| `/employee` | 49 | 38 | **11** | — |
| `/student` | 57 | 47 | **10** | — |
| `/super-admin` | 5 | 2 | **3** | — |

**Reading:** the codebase contains substantially more portal surface than the navigation exposes. Some of these are reachable by direct URL or from another page's internal state — but no first-party file links to them, so they are not discoverable by a user.

---

## 3. Modules implemented but imported by nothing (226 dead + 33 test-only)

| Directory | Orphans | Comment |
| --- | --- | --- |
| `src/components/alo` | **100** | A complete parallel UI library (~40 portal views: `crm-dashboard`, `application-manager-portal`, `approval-center`, `audit-logs`, `auth-*`, `super-admin-dashboard`, `command-palette`, `card-system`, …) — **zero importers** |
| `src/components/ui` | 20 | Unused shadcn-style primitives |
| `src/components/communication` | 13 | |
| `src/components/course-finder` | 8 | |
| `src/lib/video-engine` | 7 | |
| `src/components/website` | 6 | |
| `src/lib/{ai-agents,communications}` | 8 | |
| others (`admin`, `research`, `voip`, `hrms`, `official-crawlers`, `phd`, `rbac`, `ucc`, `cron/worker.ts`, `ai-tool-loop.ts`, `all-universities.ts`, …) | 96 | Includes `src/cron/worker.ts` — a standalone cron worker nothing references |

**Definition split:** **226** modules are imported by **nothing anywhere** (dead). A further **33** are imported **only by `tests/` or `scripts/`** — alive for tooling, unreachable from the running app (e.g. `lib/course-finder/intake-window-backfill.ts`, `lib/data-normalizer.ts`, `components/website/YouTubeEmbed.tsx`). Both lists are in `inventory-enriched.csv` (disposition `orphan`; importer path reveals the test-only set) and in `usage-analysis.json` → `orphanModules`.

---

## 4. Backend: 1,099 API routes

| Measure | Value |
| --- | --- |
| Route handler files | **1,099** |
| With a recognisable auth / cron / signature guard | **817** (74 %) |
| With **no** guard token of any kind | **282** |
| …of those, **mutating** (POST/PUT/PATCH/DELETE) | **102** |
| Confirmed **zero** auth-related tokens in file | **7** (§6) |
| Rate-limited (`rateLimit*` present) | 43 |
| Re-export alias routes | 6 |
| Referenced by no first-party caller | **123** (`unreferenced-api-routes.txt`) |

Guard helpers actually in use (counts): `withAuth` 371, `authenticateRequest` 165, `withStudentAuth` 13, `requireCron` 11, `authenticateUnified` 11, `requireMonitoringAdmin` 9, `authenticateStudentRequest` 9, `getOptionalAuth` 5, `requireStudentResource` 3, plus `getServerSession`/`getContentAdminSession`/local `guard()` helpers.

**Sampled verification of "unguarded" routes** (4 of 102 inspected): 3 were false positives using a different helper (`getContentAdminSession`, local `guard(request,'awf.agent.read')`, `requireSeoStaff`), 1 was genuinely unguarded (`/api/hr/leave`). The 102 must be triaged individually — the count is a *screening* result, not a vulnerability list.

---

## 5. Database relationships used by the UI

| Surface | Models read |
| --- | --- |
| Course Finder / courses / destinations | `CrmCourse`, `CrmUniversity`, `CrmCourseIntakeFee`, `CrmCourseRequirement`, `CrmScholarship`, `Country` |
| University/course detail | `CrmUniversity` **or** `UniversityPage`; `CrmCourse` **or** `CoursePage`; `DataConflict` for the legacy gate |
| Student portal | Student, Application, Document, Notification, SavedCourse, CourseComparison |
| Employee portal | PortalUser, EmployeeAccess*, leave/payroll/attendance models |
| Partner | Partner, PartnerUser, quota/voucher/commission models |
| CRM | Lead, CrmUcc*, Communication*, Campaign*, Task |
| Admin catalogue | Crm* + ImportBatch/ImportError + UniversityUpdateRequest + ApprovalQueueItem + PortalAuditLog |

**Audit logging:** `CrmAuditLog`, `PortalAuditLog`, `AuditLog`, `contentAuditLog`, `logAuditAction` (138 usages) — present and widely used, but not universal (the 7 unguarded routes log nothing).

---

## 6. Confirmed unguarded endpoints (independent security review required)

These files contain **no** session, token, role, permission, guard or secret check of any kind:

| Route | Methods | Exposure |
| --- | --- | --- |
| `/api/hr/leave` | GET, POST | Reads/creates leave requests for **any** `employeeId` supplied by the caller |
| `/api/hr/devices` | GET, POST | Employee device records |
| `/api/official-emails` | GET, POST | Official email records |
| `/api/university-agreements` | GET, POST | University agreement/contract records |
| `/api/b2b-contacts` | GET, POST | B2B contact records |
| `/api/communications/templates` | GET, POST | Internal communication templates |
| `/api/interview-questions` | GET, POST | Question bank (may be intentionally public content; verify) |

Guarded equivalents exist for some of these (`/api/employee-access/leave`, `/api/employee-access/*`), which suggests the `hr/*` and a few others are **legacy duplicates that were superseded but never removed**.

---

## 7. Public website integrity

| Check | Result |
| --- | --- |
| One footer / one navbar owner | Yes (`PublicFooter.tsx`, `PublicNavbar.tsx`); brand tests enforce a single footer landmark |
| Homepage composition | `HomepagePart1–4` + `TopUniversitiesSection` + `LiveUniversityCount` (live count from `/api/universities`) |
| Public pages that show catalogue data | `/course-finder`, `/courses`, `/course/[slug]`, `/courses/[slug]`, `/universities`, `/universities/[slug]`, `/destinations`, `/compare`, `/scholarships`, `/all-university-information` |
| Gate consistency | All of the above use `src/lib/public-catalog.ts` helpers (verified by source inspection and by 57 passing catalogue tests) |
| Placeholder/demo pages still public | `/test-student`, `/dreamframe`, `/review`, `/verify-email`, `/offline` — confirm intent before go-live |

---

## 8. Frontend/Backend integration verdict

- **Implemented:** 26 capabilities, 465 pages, 1,099 routes, 555 components, 554 lib modules.
- **Connected:** of the 358 portal pages, **263 are referenced and 95 are not**; public pages were not individually measured. **976 of 1,099** API routes are referenced somewhere.
- **Not connected:** 95 pages, 123 routes, 258 modules (incl. an entire 132-file UI library).
- **Tested:** 304/326 unit files pass; integration and e2e **not executed** (no DB / no browser).
- **Proven in a browser:** **nothing** — no server was started and no database exists in this environment.
