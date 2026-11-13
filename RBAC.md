# ALO EDUCATION — RBAC & ACCESS CONTROL

Spec s5, s66, s67, s69, s99, s116.

---

## 1. Layers

Access control is defence-in-depth. No single layer is trusted alone.

| Layer | Location | Role |
|---|---|---|
| Route gate | `withAuth` in `src/lib/auth-middleware.ts` | Rejects unauthenticated calls and enforces `requireUserTypes` / `requireRoles` / `requirePermissions` |
| Session resolution | `authenticateRequest` | Resolves `userType`, `roles`, `partnerId`, `actorUserId`, `actorEmail` from the token — **never from the request body** |
| Ownership | `checkOwnership` | Record-level authorisation |
| Domain guard | `src/lib/partner-tenant-guard.ts`, `src/lib/rbac/`, `src/lib/access-control/` | Tenant and capability rules |
| Service layer | `src/lib/**` | Re-checks capability before mutating, so a new route cannot bypass it |
| Database models | `Permission` (2251), `Role` (2260), `RolePermission` (2270), `UserRole` (2282), `PermissionPackage` (4003) | Persisted grants |
| Audit | `logAuditAction` | Append-only record of critical actions (s65) |

`SUPER_ADMIN` and `ADMIN` bypass role/permission checks at the `withAuth` layer.

---

## 2. User types

`ADMIN`, `SUPER_ADMIN`, `EMPLOYEE`, `CEO`, `COUNSELOR`, `FINANCE`, `FINANCE_MANAGER`, `PARTNER`,
`STUDENT`, `UNIVERSITY`, `PARENT`, `GUARDIAN`.

Custom roles and granular permissions are supported through the `Role` / `Permission` /
`RolePermission` models and `src/lib/rbac/{permission-service,role-service}.ts`. Designations observed
in the admin surface include Chairman, CEO, Director, Office Manager, Country Manager, Counselor,
Senior Counselor, Application Manager, Application Team, Visa Officer, Finance, Marketing, Front Desk,
HR, Support and Viewer.

Permission keys follow the `verb_object` shape named in s5: `view_students`, `edit_students`,
`view_finance`, `view_commission`, `manage_partners`, `manage_applications`, `manage_visa`,
`approve_documents`, `approve_offers`, `export_data`, `view_sensitive_documents`, `manage_users`,
`manage_settings`.

---

## 3. Capability sets added by this work

### University portal (s39)

Roles: `UNIVERSITY_REPRESENTATIVE`, `UNIVERSITY_MANAGER`. Permissions are resolved from the stored
`UniversityPortalAccount.permissions` and normalised against `UNIVERSITY_PORTAL_PERMISSIONS`; an
unknown value is dropped rather than honoured.

`UNIVERSITY_PORTAL_FORBIDDEN_FIELDS` lists what an institution account may never receive — internal
notes, counselor identity, partner ids and commission data. The application query uses an **explicit
allowlist**, never `select: true`, so a new column cannot leak by default.

Deposit data is exposed as **counts only**. Amounts and payer identity are not returned at any
permission level.

Ordering matters: the permission check runs **before** the tenant check, so an unauthorised caller gets
`PERMISSION_DENIED:<capability>` and learns nothing about whether the record exists. An authorised
caller reaching another institution's record gets `TENANT_MISMATCH`.

### Parent / guardian (s13, s67)

`ACCESS_LEVEL_CAPABILITIES` maps each level to an explicit capability list:

| Level | Capabilities |
|---|---|
| `NONE` | *(empty)* |
| `LIMITED` | student name, journey stage, application status, deadlines |
| `FULL_JOURNEY` | the above plus university, course, country, intake and contact details |

`resolveParentAccess(parentId, studentId?)` is the single gate. It returns
`{allowed, reason, accessLevel, capabilities, forbiddenFields}` and refuses with a specific reason:
`PARENT_NOT_FOUND`, `PARENT_STATUS_SUSPENDED`, `ACCESS_LEVEL_NONE`, `PORTAL_NOT_ENABLED`,
`CROSS_STUDENT_ACCESS_DENIED`.

Access is resolved **server-side from stored rows only**. A student id in the query is accepted only if
it matches the linked one; anything else is a cross-student read attempt (IDOR, s99).

`PARENT_FORBIDDEN_FIELDS` includes `internalNotes`, `commissionAmount` and `isB2bConfidential`. No
access level grants internal notes, commission, B2B, audit or risk capabilities — a test asserts this
for all three levels.

`canContactParent` requires **both** an active `COMMUNICATION` consent **and** the channel in the
parent's preferences. Having `EMAIL`/`SMS`/`WHATSAPP` stored is not sufficient.

Consent is **append-only**: the latest row per type governs, a revocation wins, and history is never
edited or deleted (s67).

Contact is also refused when the parent is suspended or unknown, and corrupt preference JSON degrades
to "no channels" rather than throwing.

### Feature flags (s117)

Any authenticated user may evaluate flags **for themselves** — that is how a portal decides what to
render. Only `ADMIN` / `SUPER_ADMIN` may read the full table, the audit trail, or mutate a flag.
Evaluation **fails closed**.

---

## 4. Multi-tenant isolation (s69)

`PartnerProfile.partnerId` is the tenant key and is **not unique** — one partner organisation can hold
several profile rows. Every partner-scoped query must filter on the `partnerId` resolved from the
session.

Enforced as follows:

- Webhook subscriptions and deliveries: a partner's filter derives from `auth.partnerId` on the stored
  row. A partner cannot page through another tenant's delivery log by omitting the filter — allowed
  subscription ids are resolved first.
- Opportunity graph: a partner with no application linked to the requested student gets
  `TENANT_MISMATCH`. Internal-only edge types (`RETENTION_RISK`, `INTERNAL_REVIEW_NEEDED`) are not
  produced for a partner caller at all.
- University portal: `universityId` is bound to the stored account and cannot be overridden.
- Parent portal: identity comes from the session, never from a parameter.

**Guarantee required by s69:** Partner A must never see Partner B's students, internal ALO notes, or
confidential commission data. This is enforced structurally (session-derived filters, explicit
allowlists) rather than by filtering a fully-loaded result set.

---

## 5. Human-in-the-loop (s116)

These actions require a named human approver and cannot be performed by a system job or an AI agent:

| Action | Enforcement |
|---|---|
| Visa submission | Approval workflow |
| Application submission | Approval workflow |
| Financial decision | Finance role + approval |
| Commission adjustment | Audited; paid commission cannot change without a trail (s36) |
| **Regulatory rule change** | `approveRuleVersion` requires a non-empty actor and refuses one; `APPROVAL_REQUIRED_RULE_TYPES` covers visa, entry, English, financial, work-right and policy rules |

A policy change alert carries `requiresApproval` defaulting to **true**, and
`requiresHumanApproval(ruleType)` forces it true for high-risk types **even when the caller asks
otherwise** — a caller may raise the bar, never lower it.

---

## 6. Data that must never be exposed (s66)

Passwords, API secrets, tokens, payment credentials and private documents.

- Webhook secrets are stored encrypted (AES-256-GCM, `ENCRYPTION_KEY`) and returned in plaintext
  exactly once, at creation or rotation. `redactSubscription` replaces the secret with a
  `secretConfigured` boolean in every list and read response.
- The parent portal selects only display fields; a test asserts `password` is not in the select list.
- The university portal uses an explicit allowlist and excludes `reviewerId` / `reviewerNote`.

---

## 7. Verification

`tests/unit/api-authz-regression.test.ts` (11 tests) passes, and the new suites pin tenant isolation,
IDOR refusal, permission-before-tenant ordering, append-only consent and capability limits
(`university-portal` 33, `parent-guardian` 36, `rule-versioning` 92, `feature-flags` 22, `webhooks` 35).

**Not verified:** runtime enforcement against a live server. No cross-role, cross-partner or
direct-object-reference probe was executed over HTTP, because no database or deployment was available.
The s99 security test suite (rate limiting, session handling, XSS, CSRF, SQL injection, sensitive data
exposure) is **NOT CONFIGURED** in this environment.
