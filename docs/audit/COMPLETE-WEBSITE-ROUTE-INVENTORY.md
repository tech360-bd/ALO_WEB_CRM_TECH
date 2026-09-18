# Complete Website Route Inventory

> Generated from the filesystem on 2026-09-18. **367 pages**, **5 layouts.**
> Cross-referenced against the API inventory; nav-link/sitemap reconciliation is a manual OWNER step (§6).

## Canonical layout (§9/§10/§11)

```
src/app/application-manager/layout.tsx
src/app/employee/layout.tsx
src/app/layout.tsx
src/app/partner/layout.tsx
src/app/student/layout.tsx
```

> **No `src/middleware.ts` exists** — there is no edge-level auth/rate-limiting;
> authorization is enforced per-route in the API handlers (see API inventory).

## Page groups (by first path segment)

| Group | Pages |
|---|---|
| `/admin` | 69 |
| `/crm` | 53 |
| `/student` | 43 |
| `/employee` | 37 |
| `/counselor` | 24 |
| `/partner-admin` | 23 |
| `/application-manager` | 19 |
| `/language-prep` | 18 |
| `/partner` | 16 |
| `/destinations` | 8 |
| `/resources` | 5 |
| `/blog` | 2 |
| `/english-test-prep` | 2 |
| `/news` | 2 |
| `/scholarships` | 2 |
| `/services` | 2 |
| `/success-stories` | 2 |
| `/team` | 2 |
| `/universities` | 2 |
| `/visa-support` | 2 |
| `/about` | 1 |
| `/accessibility` | 1 |
| `/admission-requirements` | 1 |
| `/application-guide` | 1 |
| `/application-process` | 1 |
| `/book-consultation` | 1 |
| `/communication-policy` | 1 |
| `/compare` | 1 |
| `/contact` | 1 |
| `/cookies` | 1 |
| `/course-finder` | 1 |
| `/course` | 1 |
| `/courses` | 1 |
| `/dashboard` | 1 |
| `/eligibility-check` | 1 |
| `/eligibility-checker` | 1 |
| `/english-tests` | 1 |
| `/events` | 1 |
| `/faqs` | 1 |
| `/forgot-password` | 1 |
| `/lead-data-usage-policy` | 1 |
| `/login` | 1 |
| `/offline` | 1 |
| `/(root)` | 1 |
| `/portal` | 1 |
| `/privacy-policy` | 1 |
| `/register` | 1 |
| `/research-opportunities` | 1 |
| `/reset-password` | 1 |
| `/student-journey` | 1 |
| `/super-admin` | 1 |
| `/terms` | 1 |
| `/user-guide` | 1 |
| `/visa` | 1 |

## Portal route coverage (§18–§23)

| Portal | Prefix | Pages |
|---|---|---|
| Student | `/student` | 44 |
| Employee | `/employee` | 37 |
| Counselor | `/counselor` | 24 |
| Partner | `/partner` | 39 |
| Partner Admin | `/partner-admin` | 23 |
| Admin | `/admin` | 69 |
| Super Admin | `/super-admin` | 1 |
| CRM | `/crm` | 53 |
| Application Manager | `/application-manager` | 19 |
