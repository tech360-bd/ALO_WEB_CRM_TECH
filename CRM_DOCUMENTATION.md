# ALO Education — CRM & Operations Documentation

> Describes the **actual** CRM implementation: modules, lifecycles, SLA,
> communication stack and portals.

## 1. CRM modules

Routes live under `src/app/crm`, `src/app/admin`, `src/app/employee`,
`src/app/counselor`, `src/app/application-manager`, `src/app/partner`, and
API equivalents under `src/app/api` (820 handlers). Implemented modules:

| Module | Location (representative) |
|---|---|
| CRM dashboard | `/crm`, `/api/crm/dashboard` |
| Leads | `CrmLeadsPage`, `/api/crm/leads`, lead validation + scoring engines |
| Students | `/student`, `EmployeeStudentsPage`, `Student*` models |
| Applications | `/api/applications`, `application-manager` module |
| Universities & courses | `CrmUniversity`/`CrmCourse` + data-update center |
| Counselors | `/counselor`, counselor dashboard API |
| Tasks & appointments | `Task`, `Appointment` models + APIs |
| Documents | `AloDocument`, `StudentDocument`, document security lib |
| Communications (UCC) | `/api/crm/ucc/*`, `src/lib/communication/` |
| WhatsApp | `/api/whatsapp/*`, `/api/crm/ucc/webhooks/whatsapp` |
| Campaigns & marketing OS | `Marketing*` models, `/api/campaigns`, marketing hub |
| Follow-ups | `leadOutreach`, follow-up automation |
| Reports | dashboards + `MarketingReport`, analytics APIs |
| Finance | payments, double-entry ledger, commissions |
| Partners (B2B) | `/partner`, `partner-admin`, b2b APIs |
| Audit logs | `AloAuditLog` + `logAuditAction` on mutations |
| Settings | admin system settings |

## 2. Lead lifecycle

`Lead.status` starts `NEW`; assignment, scoring (`leadScore`/`leadTier`),
dedupe (`duplicateOfId`) and outreach tracking (`LeadOutreach`) are
implemented. Conversion flows into the student record (`studentId` link).

Application milestones follow `APP_STAGES` (`src/lib/alo-types.ts`), a
production superset of the specification's lifecycle:
`COUNSELING → ELIGIBILITY_CHECKED → DOCUMENTS_* → UNIVERSITY_SHORTLISTED →
APPLICATION_PREPARING/SUBMITTED → CONDITIONAL/UNCONDITIONAL_OFFER →
DEPOSIT_PENDING → CAS_* → VISA_* → PRE_DEPARTURE → ENROLLED` (+ `ALUMNI`).
Stage history is persisted (`ApplicationStageHistory`, `TimelineEvent`) and
**status transitions are auditable** through the central audit log
(`logAuditAction` → `AloAuditLog`).

## 3. 30-minute SLA

`src/lib/sla-engine.ts` (+ `sla-holiday.ts`): office-hour aware, 30/20/10
minute escalation, at-risk and breach states, manager notification and the
global dashboard alarm service (`dashboard-alarm-service.ts`). SLA widgets:
Open Leads / Within SLA / At Risk / Breached / Average Response Time.
Marketing-side WhatsApp SLA: `/api/marketing/whatsapp-sla`.

## 4. Lead sources → CRM flow

Website consultation form, WhatsApp webhook, Facebook lead sync
(`facebook-lead-sync.ts`), Chatwoot inbox bridge, CSV import, B2B partner
portal → `lead-validation` → dedupe → assignment (`counselorId`, reason) →
welcome message → CRM queues + SLA timers. UTM attribution
(`utmSource/Medium/Campaign`, landing page, referrer) is captured on `Lead`.

## 5. Unified Communication Center (UCC)

- Channels: WhatsApp Cloud API, email (SMTP), OTP engine, broadcast engine,
  after-hours auto-responder, 3Cx telephony journaling, Chatwoot bridge.
- Conversation records bind `leadId`, `studentId`, `counselorId`,
  `conversationId`, channel, direction, timestamps, delivery status.
- Security: webhook signature verification, employee scope tests, negative
  security tests (`visa-security-negative`, `ucc-webhook-security`).

## 6. Portals

| Portal | Audience | Entry |
|---|---|---|
| Student portal | Students | `/student`, `/portal` |
| Employee portal | Counselors, admissions, visa officers, marketing, finance | `/employee` |
| Counselor | Counselors | `/counselor` |
| Application manager | Admissions team | `/application-manager` |
| Partner (B2B) | Partner orgs | `/partner`, `/partner-admin` |
| Super admin | Executives | `/super-admin` |
| Admin command center | Admins | `/admin/*` (30+ modules) |

RBAC: 13 roles, 68 permissions, 239+ role-permission grants
(`prisma/seed-rbac.ts`), enforced server-side via `withAuth` and the
access-check engine; UI hiding is never the only control.

## 7. Marketing OS

Campaigns, content calendar + engine, SEO brain, landing pages, lead
sources, UTM tracking (first/last touch), social publishing + webhook
events, email/WhatsApp sends, attribution and reports. AI marketing
director coordinates agent jobs with approvals and audit.
