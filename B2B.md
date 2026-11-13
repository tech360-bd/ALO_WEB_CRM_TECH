# ALO EDUCATION — B2B PARTNER ECOSYSTEM

Spec s34–s39, s69, s36, s37, s38.

---

## 1. Scope

A separate B2B ecosystem for partner agents: onboarding, KYC, agreement, training, student referral,
application, offer, deposit, enrolment, commission, reconciliation and performance/risk monitoring.

**API surface:** `partner` 23 routes, `agentos` 11, plus partner-scoped routes across `applications`,
`communications` and `webhooks`. **UI:** `src/components/partner/*`, `PartnerSuperAdminDashboard`,
`PartnerNotificationsPage`, the partner portal views in `src/app/page.tsx`, and
`src/app/partner/*`.

---

## 2. Data model

| Model | Line | Purpose |
|---|---|---|
| `PartnerProfile` | 3120 | **`partnerId` is the tenant key and is NOT unique** — one organisation can hold several profile rows |
| `PartnerLead` | 2293 | Leads referred by a partner |
| `PartnerPackage` | 3661 | Permission/quota package |
| `PartnerQuota` | 3684 | Usage limits |
| `PartnerPackageAssignment` | 3769 | Package → partner binding |
| `PartnerUserSeatRequest` | 3826 | Seat provisioning workflow |
| `PartnerMarketingQuota` / `Usage` / `Request` | 3847 / 3863 / 3882 | Marketing entitlements |
| `PartnerEmailUpdate` | 2661 | Contact change requests |
| `B2bProvider` | 5494 | External B2B provider |
| `B2bApplication` | 5525 | Application submitted through a B2B channel |
| `Commission` | — | `commissionCode` `@unique`; statuses `EXPECTED → PENDING → APPROVED → PAYABLE → PAID`, plus `DISPUTED` and `CLAWED_BACK` |

---

## 3. Onboarding workflow (s34)

`Registered → KYC → Review → Approved → Agreement → Training → Active → Suspended → Terminated`

Registration captures company, country, city, website, contact, directors, staff, licence/registration,
KYC documents, references, recruitment history, agreement and commission terms.

---

## 4. Tenant isolation (s69) — the critical property

**Partner A must never see Partner B's students, internal ALO notes, or confidential commission data.**

This is enforced structurally, not by filtering a fully-loaded result set:

- The tenant `partnerId` is resolved from the **session** (`auth.partnerId`), never from a request body
  or query parameter. A partner cannot widen their own scope by editing a payload.
- Webhook routes derive their filter from `auth.partnerId` on the **stored row**. A partner cannot page
  through another tenant's delivery log by omitting the filter — allowed subscription ids are resolved
  first, and if the tenant owns none the response is an empty list rather than an unfiltered query.
- The opportunity graph refuses a partner who has no application linked to the requested student with
  `TENANT_MISMATCH`, and does not produce internal-only edge types (`RETENTION_RISK`,
  `INTERNAL_REVIEW_NEEDED`) for a partner caller at all.
- `Application.safeStatus` is the only externally-shareable status projection; `stage` and
  `reviewStatus` are internal.
- Shared guard: `src/lib/partner-tenant-guard.ts`.

`universityId` on the institution portal is bound the same way — to the stored
`UniversityPortalAccount`, never to a parameter (s39).

---

## 5. Partner capabilities (s35)

Create and manage students, search programmes, view eligible programmes, submit applications, upload
documents, track applications, view offers, track deposits, view visa status where permitted, view
deadlines, communicate with ALO, view commissions, download statements, access training, view
announcements, and raise support tickets.

Quotas are checked before an action and recorded after: `checkQuotaBeforeAction` follows
**CHECK → ALLOW/REJECT → RECORD**, defaulting to a limit of 100 (200 with a package). Exceeding it
creates an `extraQuotaRequest` in `REQUESTED → REVIEWING → APPROVED/REJECTED` rather than silently
allowing the action.

---

## 6. Commission engine (s36)

Commission is a financial subsystem, not a field. It supports university, programme, country, intake
and partner dimensions; percentage, fixed, tiered and bonus models; clawback and refund adjustment;
currency; payment status; invoice and statement generation.

**Paid commission cannot be changed manually without an audit trail.** A commission adjustment is one of
the s116 human-in-the-loop actions, alongside visa submission, application submission, financial
decisions and regulatory rule changes.

Reconciliation is served by the `commissions` routes and the accounting ledger
(`src/lib/accounting/ledger.ts`, written to be cents-safe, and `src/lib/double-entry-ledger.ts`).

---

## 7. Partner performance and risk (s37)

Dashboard: students referred, applications, offers, deposits, enrolments, visa grants, visa refusals,
conversion rate, commission, average quality, average processing time.

Risk grading is **Green / Amber / Red** from signals including high refusal rate, low conversion,
duplicate applications, document irregularities, missing training, repeated deadline failures and
unusual activity. `AI_PARTNER_RISK` is the feature flag; it bootstraps **disabled at 0% rollout**
(s117), so partner risk grading is off until an administrator enables it with a recorded reason.

---

## 8. Partner training (s38)

Training courses, country updates, visa updates, university updates, compliance training, product
training, quizzes, certificates and completion tracking. Training status can influence partner
permissions and risk — missing training is one of the s37 risk signals.

---

## 9. Partner AI assistant (s83)

A partner may ask which programmes fit a student, what documents are missing, the application status,
upcoming deadlines and expected commission. **Only permitted data is shown** — the same allowlist and
tenant rules as the rest of the portal apply, and the assistant is subject to s93 (no fabricated
answers) and the `validateAiAction` split between low-risk autonomous actions and high-risk actions
requiring a human.

---

## 10. Verification status

| Item | Status |
|---|---|
| Tenant isolation logic | **PASS** — unit tested (webhooks 35 tests, opportunity graph 40, university portal 33) |
| Commission arithmetic and ledger | **PARTIAL** — `accounting-ledger` tests pass; cents-safety reviewed statically, not exercised against a database |
| Partner portal UI | **PASS** (compiles, included in a successful production build) / **NOT VERIFIED** at runtime |
| Quota enforcement | **PARTIAL** — implemented and covered by `access-control-center` APIs; not exercised at runtime |
| Cross-partner access probes over HTTP (s99) | **NOT CONFIGURED** — no running server or database |
| End-to-end journey B (s97, s126) | **NOT VERIFIED** |

**Journey B has never been executed.** It requires a database: partner registration → KYC → approval →
agreement → training → student creation → application → offer → deposit → enrolment → commission →
statement, with permission checks at each step.
