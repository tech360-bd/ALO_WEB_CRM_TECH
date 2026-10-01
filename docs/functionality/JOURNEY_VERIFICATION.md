# End-to-end journey execution ledger

**No complete production journey has passed.** These are explicit acceptance journeys, not claims that a displayed button or a test double proves a workflow. The seven suites below cover the requested A–G business areas; confirm exact approved accounts/records/recipients and scenario mapping before execution. No production mutation, actual mail/send, upload or financial event was attempted.

For every journey preserve pseudonymous test IDs, route/actor/role, validation errors, request/response status, transactional DB observations, before/after authorized visible sets, audit records and reload state. Run negative cases first, then valid cases, concurrent retries and compensating cleanup on a restored staging DB. Production verification requires separate explicit approval. Do not put real PII/tokens in reports.

| Journey | Required continuous execution path | Current blocking evidence | Status |
|---|---|---|---|
| A — Lead to student | Public form → input/consent → API → dedup/assignment → persisted lead → counselor tasks/timeline → reload → conversion/canonical student → audit → unauthorized ID rejection | LeadForm/Lead/MarketingLead paths differ; CRM generic auth and empty-success DB fallback; current DB login failure | BLOCKED |
| B — Student/application/documents | Registration/login/reset → own profile → real university/course → application states → file bytes/checksum/private download → assigned review → offer/visa status → timeline/notification/audit | Two student identities/auth paths; metadata-only document upload, portal-student ownership locally repaired; staff scope still incomplete; persistent storage unverified | BLOCKED |
| C — Communication/integrations | Signed Facebook event → exact-once CRM result; authorized WhatsApp send → provider ID → delivery webhook → conversation/timeline; SMTP reset/notification → provider acceptance → inbox delivery | No approved provider/account/recipient; event dedup/outcome/queue persistence not fully proven; no actual send | BLOCKED |
| D — Finance/commission | Authorized obligation → amount/currency/reference validation → provider/offline evidence → settlement → allocation → journal → commission calculation/review → reconciliation → partial/full refund/reversal → reports/audit | Pending-only student intent locally repaired; no complete finance graph or canonical payment mapping, mixed currencies, payroll overlap | BLOCKED |
| E — HR/payroll | Employee onboarding → HR data/private profile → attendance/leave → salary calculation → draft → maker-checker review/approve → payout evidence → audit/report → reverse/correct | Existing payroll unit tests, but four representations and deployed schema/history unknown; EmployeeHR ≠ EmployeeHRProfile | BLOCKED |
| F — AI/question/automation | Authorized request → provider/tool grants → validated input → true provider result → persist claim/outcome → human approval → execution → audit; questions: near-duplicate detection, no answer leakage, start/submit/grade/credit accounting | Lead-scoring-only runtime subset; fake weekly scan quarantined; generic question builder not traced; mock-test credits fail open; no real provider/DB | BLOCKED |
| G — Management/reports/responsive | Each role login → permitted dashboard queries → filters/sort/pagination → detail CRUD → export all scoped matching records → audit → mobile/keyboard/errors/session change | CEO source repaired only; remaining KPI/action/query/export paths incomplete; no browser/performance/real DB journey | BLOCKED |

## Browser/UI acceptance grid

Apply to each form/control occurrence in surfaces.jsonl and each page/SPA view (components can mount repeatedly, so occurrence counts are not unique business-feature counts):
- Initial loading; success with actual values; legitimate zero; missing dependency; unauthorized/session expiry; network failure; stale-response/session-switch; retry; double submit; cancellation; validation preserving input.
- Keyboard focus, label/name, errors linked to inputs, dialog dismissal, disabled reason, desktop/mobile layouts, long names/amounts, touch targets, overflow and reduced motion.
- Button/anchor target exists and enforces permissions; an open modal is not a completed action. File select is not persisted upload; provider accepted is not delivered; paid label is not settled.
- Search/filter must change server query/result set, sort must be stable and allowlisted, pagination must include total/empty/out-of-range behavior, export must honor identical filters and complete scope, formula injection/PII checks and audit.
- Reload/relogin must reproduce persistent data; stale records must disappear on identity/role switch. Negative tests must show no unauthorized database access or side effect.

No responsive/performance pass inferred from Tailwind breakpoints or successful compilation. Tests in this round cover named handler/response/presentation contracts with isolated doubles and a few explicit source guards; they are not browser or real-persistence evidence.
