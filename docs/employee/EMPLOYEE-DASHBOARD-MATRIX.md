# Employee Dashboard & Permission Matrix

> Mandate §54. Every permission below must be backed by actual RBAC code.
> The authoritative RBAC lives in `src/lib/permissions.ts`, `src/lib/rbac/`,
> `src/lib/marketing/permissions.ts`, and `src/lib/auth-middleware.ts`.
> This matrix documents the intended mapping; where a control is not yet
> wired to a specific role it is marked `PLANNED`.

## How access is decided

```
USER → EMPLOYEE → ROLE → DEPARTMENT → PERMISSIONS → ASSIGNED ACCOUNTS → ASSIGNED WORK
```

A widget/API is visible only when the employee's role grants the permission
AND (for scoped data) the record belongs to the employee, their team, their
department, or they hold an override permission. Server-side checks are
mandatory; hiding a button in the UI is never authorization (mandate §70).

## Legend
- ✅ granted · ⛔ denied · 👁 view-only · PLANNED = designed, not yet role-wired

## Core role matrix

| Capability | CEO | Super Admin | Admin | HR Mgr | Team Lead | Counselor | Sr Counselor | Admissions | Visa | Finance | Marketing | Social Media | IT | Security |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View own dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all conversations | 👁 | ✅ | ✅ | ⛔ | team | own | team | dept | dept | ⛔ | ⛔ | assigned | ⛔ | 👁 |
| Reply to conversation | ⛔ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| Assign conversation | ⛔ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Reassign conversation | ⛔ | ✅ | ✅ | ⛔ | ✅ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| View CRM contact | ✅ | ✅ | ✅ | 👁 | team | own | team | dept | dept | ⛔ | own | ⛔ | ⛔ | 👁 |
| Edit CRM contact | ⛔ | ✅ | ✅ | ⛔ | ⛔ | own | team | dept | ⛔ | ⛔ | own | ⛔ | ⛔ | ⛔ |
| Create lead | ⛔ | ✅ | ✅ | ⛔ | ✅ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ✅ | ✅ | ⛔ | ⛔ |
| Upload documents | ⛔ | ✅ | ✅ | ✅ | ⛔ | own | team | dept | dept | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| View private documents | ⛔ | ✅ | ✅ | dept | ⛔ | own | team | dept | dept | ⛔ | ⛔ | ⛔ | ⛔ | 👁 |
| Connect provider | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Disconnect provider | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Manage OAuth/webhooks | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| View provider logs | ⛔ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| View audit logs | 👁 | ✅ | 👁 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ✅ |
| Manage employees | ⛔ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Manage roles/permissions | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | 👁 |
| Use AI assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve AI action | ✅ | ✅ | ✅ | dept | team | ⛔ | team | ⛔ | ⛔ | ⛔ | dept | ⛔ | ⛔ | ⛔ |
| View financials | ✅ | ✅ | 👁 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |

> "own" = records assigned to the employee · "team"/"dept" = records within the
> employee's team/department · 👁 = read-only aggregate, no message-level content.

## Financial confidentiality (mandate §29)
Confidential financial data (salaries, revenue, commissions) is exposed only to
CEO, Super Admin, and Finance. `/api/hr/payroll` and `/api/finance` are gated by
`withAuth` + `requireUserTypes` (see `tests/unit/finance-authz-regression.test.ts`).

## Department dashboards (mandate §55)
The dashboard engine must support department-specific widgets for: Admissions,
Counseling, Visa, Documentation, Marketing, Sales, Finance, HR, IT, Customer
Support, International Relations, Partner Management, Operations, Management,
Compliance, Content, Social Media. Department widgets are configured by admins,
not hardcoded per department.

## Verification status
- RBAC enforcement on the sensitive finance/payroll/student-profile routes:
  **VERIFIED** by regression tests (251-test suite).
- Role→widget wiring for the full matrix above: **PLANNED** — the dashboard
  engine and permission constants exist; per-role widget configs are not all
  wired. Marked honestly, not claimed complete.
