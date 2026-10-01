# RBAC functionality matrix — 2026-10-01

**PARTIAL source verification, BLOCKED production verification.** UI visibility is not authorization. Full endpoint index includes direct guard/policy signals; those are file-level observations, not proof that every exported method is protected. Runtime role assignments, branch/team ownership and IDOR tests remain incomplete.

## Existing authority paths (do not replace with a new permission system)

- `auth-middleware.ts`: portal cookie/Bearer → PortalSession → active user/roles/grants; alternative NextAuth → User. Existing SUPER_ADMIN/ADMIN role/user-type bypass is retained. `x-acting-as-user` is super-admin-only in this middleware; actor and acting user differ in audits.
- `student-auth.ts`: separate StudentSession → canonical Student.id. `unified-auth.ts` selects student vs portal path; **auth.type === portal does not mean staff**. Portal students must be checked by userType/roles and mapped to canonical ownership too.
- `proxy.ts`: public read/write lists and path-boundary role map. Handler checks remain necessary, especially aliases and direct requests. Some APIs rely on proxy alone; role map must not be inferred from a rendered page.
- `permissions.ts` + `rbac/*`: permission catalog/default roles/DB assignments; seed declarations are not actual production grants. Existing type suppressions were inventoried, not silently accepted as correctness.
- `hrms/rbac.ts`: separate payroll/employee role helpers. `student-resource-auth.ts`: existing canonical ownership helpers; branch manager currently broadly privileged, requiring branch-scope review rather than copying that assumption everywhere.

| ROLE / SUBJECT | EXPECTED TEST | SOURCE EVIDENCE | LOCAL RESULT | PRODUCTION |
|---|---|---|---|---|
| Anonymous | No staff payments, executive dashboard, payroll/approvals; no cron/upload mutation | Real auth middleware exercised in unit tests; bounded public payroll/approval probes rejected | PARTIAL | BLOCKED |
| Student (NextAuth / PortalSession) | Own payment history/pending request only, no settlement, no target override | New payment tests use NextAuth path; own profile lookup, forbidden extra target/status; generic admin bypass retained | PARTIAL | BLOCKED |
| StudentSession bearer | Own canonical student resources; never global list/review via portal selector | Document dual-auth ownership tests pass; broader resource coverage incomplete | PARTIAL | BLOCKED |
| Finance (legacy FINANCE) | Finance read/create; unrelated student/partner/employee denied | New real-middleware tests: authorized finance GET, denied other-role GET/POST | PARTIAL | BLOCKED |
| EMPLOYEE + finance / finance_officer | Preserve established seed roles, not blanket employee access | PortalSession test covers both aliases; role gate in CRM finance includes them | PARTIAL | BLOCKED |
| CEO (legacy / EMPLOYEE+ceo) | Finance and executive oversight, no fabricated metrics | Finance tests cover legacy+portal; executive tests cover legacy. Seed CEO is EMPLOYEE; handler allows ceo role | PARTIAL | BLOCKED |
| ADMIN / SUPER_ADMIN | Preserve authorized management and actor-aware audit; not anonymous escalation | Prior and new handler tests; unchanged bypass; required transactional audit helper | PARTIAL | BLOCKED |
| Counselor / branch manager | Assigned/branch records only; no organization finance enumeration | New finance denial tests; broader lead/document scope requires repair/review | PARTIAL | BLOCKED |
| Partner / partner_manager | Own organization/student/commission scope, no unrelated IDs | Finance denial tests only; organization traversal not completed | PARTIAL | BLOCKED |
| HR / employee | Own salary vs HR authority, maker-checker, salary IDOR denial | Existing payroll tests and source; cross-entry payroll accounting unresolved | PARTIAL | BLOCKED |
| Document/application/visa roles | Assigned records; validate status transitions and owner on every read/write | Source inventoried, full route-level policy not reconciled | NOT VERIFIED | BLOCKED |
| Marketing/front desk/support/data/AI roles | Least privilege + object scope, no finance access via generic auth | Seed/catalog indexed; broad endpoint matrix not executed | NOT VERIFIED | BLOCKED |
| Cron secret / admin session | Reject bad/missing auth in production; no stub side effects | Shared guard + isolated quarantine tests | PARTIAL | BLOCKED |
| Provider webhook | Verify raw body signature, replay/idempotency, tenant identity | Facebook/UCC/WhatsApp implementations and existing tests; real delivery unavailable | PARTIAL | BLOCKED |

## Confirmed authorization findings and remaining gates (not external-credential problems)

1. `/api/crm/leads` uses generic `withAuth` without role/assignment scope; GET can enumerate MarketingLead and query caller-selected counselor. Missing-table error becomes empty success. Full CRM lifecycle is **BLOCKED**, not certified by payment fixes.
2. `/api/documents` previously checked only `auth.type === 'student'`, treating portal students as staff. **Locally repaired:** both auth paths now get own canonical Student.id scope; cross-ID access and all student review are denied. Nine isolated tests cover own/other/missing/anonymous/StudentSession/admin cases. Full document lifecycle remains BLOCKED: non-student staff/partner assignment scope, metadata-only upload, associated Student projection and atomic timeline/audit require review. Deployed presence/impact not verified.
3. `/api/interview-questions` relies on proxy role map for writes; handler itself has no auth gate. Public suggested answers may be intentional interview guidance, not automatically a graded-test leak. Trace concrete graded-session projections before classification.
4. Other generic `withAuth` APIs, role-dependent frontend dispatch, branch/team ownership and exports remain NOT VERIFIED. A lexical “guard present” is not a PASS.

## Required negative journey grid

For each relevant endpoint: anonymous; expired/revoked/suspended session; wrong role; legitimate own ID; unrelated ID; nonexistent ID; empty target; forged actor/tenant; portal-vs-student header; cross-branch/org; elevated body fields; duplicate/replayed/concurrent submission. Verify status + non-sensitive body **and no unauthorized query/write/send/audit contamination**. Legitimate requests must also persist and reappear after reload. Real DB tests and production permission snapshots are pending; do not relax guards to make a UI work.
