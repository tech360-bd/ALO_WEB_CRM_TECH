# RBAC Matrix

> Mandate §26, §96. Backed by `src/lib/permissions.ts`, `src/lib/rbac/`,
> `src/lib/auth-middleware.ts`, `src/lib/marketing/permissions.ts`.
> Server-side enforcement is mandatory; hiding a button is never authorization (§70).
> The detailed role×capability grid is in `docs/employee/EMPLOYEE-DASHBOARD-MATRIX.md`;
> this file records the verification status per the §26 action verbs.

## Action verbs (§26) — enforcement status

| Verb | Enforcement point | Status |
|---|---|---|
| LOGIN | `/api/auth`, portal-auth | CODE_COMPLETE |
| VIEW / READ | per-route `authenticateRequest` | VERIFIED (audited routes) |
| CREATE / UPDATE / DELETE | per-route `requireUserTypes` | VERIFIED (finance/payroll) / CODE_COMPLETE (rest) |
| ASSIGN | conversation/lead assign routes | CODE_COMPLETE |
| APPROVE | AI approval queue, content approval | CODE_COMPLETE |
| EXPORT | report export routes | IMPLEMENTED_BUT_UNVERIFIED |
| COMMUNICATE | UCC reply routes | IMPLEMENTED_BUT_UNVERIFIED |
| AI | orchestrator approval policy | CODE_COMPLETE |
| DOCUMENT | owner/role checks on download | VERIFIED (fixed IDOR) |
| REPORT | analytics routes | IMPLEMENTED_BUT_UNVERIFIED |
| ADMIN | `requireUserTypes([ADMIN,SUPER_ADMIN])` | VERIFIED (audited routes) |

## Roles present in the system (§25)
Roles are data-driven (`Role` model + `PERMISSION_INVENTORY.csv` /
`ROLE_INVENTORY.csv`). The mandate's role list is supported **where the role
actually exists** — no fake roles were created to satisfy the list (§25).
Confirmed role families: CEO/Owner, Super Admin, Admin, HR/HR Manager, Team Lead,
Department Manager, Counselor/Senior Counselor, Admissions, Visa Officer,
Documentation Officer, Finance, Marketing, Social Media, Content, Designer, SEO,
Ads, Sales, Customer Support, Partner Manager, International Relations, IT,
Security, Operations.

## Verification status
- **VERIFIED:** unauthorized requests fail server-side on the regression-tested
  routes (finance, payroll, student profile, employee documents, commissions,
  counselor students, crm/seed, all 9 cron routes) — 23 regression tests
  (11 api-authz + 7 cron-auth + 5 finance-authz).
- **CODE_COMPLETE:** the RBAC layer (`requireUserTypes`, permission service)
  exists and is applied across 576 authenticated routes.
- **IMPLEMENTED_BUT_UNVERIFIED:** the full §26 verb×role matrix has not been
  exhaustively tested route-by-route; a comprehensive RBAC test suite
  (`tests/rbac/employee-dashboard-matrix`, §94) is a recommended OWNER/dev action.

## Recommended next step (§94)
Add `tests/rbac/employee-dashboard-matrix` asserting, per role: can login, view
dashboard, view inbox, view assigned conversations, reply, assign, reassign,
view/edit CRM, upload/view documents, connect/disconnect provider, view provider
logs, view audit logs, manage employees/roles/permissions, use AI, approve AI,
perform admin actions — each against the real authorization checks.
