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

## Core role matrix — historical design reference, NOT a live grant list

**Security correction (2026-10-24): do not treat the matrix below as runtime authorization evidence.** The repository contains overlapping permission catalogs and role defaults, and the full role×API matrix is not verified. In particular, executive titles and branch-manager roles must not inherit HR salary, Finance approval, or RBAC powers from designation alone. Runtime access must be checked against authenticated server-side permissions, scope, object, workflow state, and approval rules. The code-level helper `PERMISSION_MATRIX` was patched so Chairman/CEO/Director designations carry no wildcard capability by default; remaining role defaults and APIs still require route-by-route audit and negative tests.

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
Salary and HR financial fields require explicit permission and field-level audit;
Finance access to payroll calculations does not grant unrelated HR profile
access. A CEO/Director title alone is not an access grant. The `/api/hr/payroll`,
`/api/finance`, employee payroll, and reporting routes must each be verified for
both server-side permission and ownership/scope. Existing auth tests cover only
the routes and cases named in their tests; they do not prove every HR/finance
endpoint or every field is private.

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
