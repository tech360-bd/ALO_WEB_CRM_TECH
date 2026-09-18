# Feature Trace Matrix

> Mandate §66/§67. Proves `Frontend → API → Backend → Database → Provider → Auth →
> Test → Status` for the platform's critical flows. Status uses the §97 vocabulary.
> A flow is VERIFIED only when the whole chain has passed; here most are
> CODE_COMPLETE or IMPLEMENTED_BUT_UNVERIFIED because live provider/DB runs are
> not possible in this sandbox.

| Feature | Frontend | API | Backend | Database | Provider | Auth | Test | Status |
|---|---|---|---|---|---|---|---|---|
| Public site render | `src/app/**/page.tsx` (367) | — | RSC | CrmUniversity/CrmCourse | — | public | build (CI) | CODE_COMPLETE |
| Enquiry → Lead | enquiry forms | `/api/crm/leads/*` | lead service | `Lead`, `LeadForm` | — | public+validate | regression | CODE_COMPLETE |
| Lead → Contact identity | CRM UI | `/api/crm/*` | identity match | `ContactMatchReview`, `UnknownIncomingContact` | — | session | partial | IMPLEMENTED_BUT_UNVERIFIED |
| Student login → portal | `/login`, `/student` | `/api/auth`, `/api/student/*` | auth-middleware | `User`, `Student` | — | session | regression | CODE_COMPLETE |
| Employee dashboard | `/employee` | `/api/employee/*` | RBAC | `Employee`+ | — | session+RBAC | regression | CODE_COMPLETE |
| Counselor inbox | `/counselor/inbox` | `/api/counselor/inbox` | UCC | `UccConversation` | Meta/WhatsApp | session | partial | IMPLEMENTED_BUT_UNVERIFIED |
| Unified conversation | UCC UI | `/api/crm/ucc/conversations` | UCC | `UccConversation`/`UccMessage` | providers | session | partial | IMPLEMENTED_BUT_UNVERIFIED |
| Inbound webhook → message | — | `/api/crm/ucc/webhooks/[provider]` | webhook-security | `WebhookEvent` | Meta/Telegram/X | signature | 24 unit tests | CODE_COMPLETE (sig) / LIVE_TEST_PENDING (provider) |
| Outbound reply → provider | UCC reply | `/api/crm/ucc/conversations/[id]/reply` | adapter | `UccMessage` | provider API | session+perm | unit (adapter) | IMPLEMENTED_BUT_UNVERIFIED |
| Application workflow | `/application-manager` | `/api/applications/*` | app service | `Application`+ | — | session+RBAC | partial | CODE_COMPLETE |
| Document upload | portal UI | `/api/storage/*`, `/api/employee/documents/*` | storage | `Document`+ | storage | session+owner | regression (download) | CODE_COMPLETE |
| AI agent action | AgentOS UI | `/api/agentos/*` | orchestrator | `agentTask`, `automationEvent` | model | session+approval | runtime unit | IMPLEMENTED_BUT_UNVERIFIED |
| AI reply draft → approval → send | UCC AI assist | `/api/crm/ucc/ai-assistant` | orchestrator | `AgentApprovalQueue` | provider | session+approval | partial | IMPLEMENTED_BUT_UNVERIFIED |
| SLA tracking | dashboards | `/api/crm/ucc/sla` | SLA engine | `SlaPolicy`, `CommunicationSlaEvent` | — | session | partial | CODE_COMPLETE |
| Escalation | dashboards | `/api/crm/ucc/*` | escalation | `EscalationEvent` | — | session | partial | CODE_COMPLETE |
| Marketing campaign | `/crm` marketing | `/api/marketing/*` | marketing | `MarketingCampaign`+ | providers | session+RBAC | partial | IMPLEMENTED_BUT_UNVERIFIED |
| Cron job | — | `/api/cron/*` (9) | cron-auth | various | — | cron-secret | 7 unit tests | VERIFIED (auth) |
| Finance/payroll | admin UI | `/api/finance`, `/api/hr/payroll` | withAuth | `EmployeeSalary`+ | — | session+role | 5 regression | VERIFIED (authz) |

## Reading this matrix
- **VERIFIED** — the chain passed an automated test in this repo (e.g. cron auth,
  finance authz, webhook signature).
- **CODE_COMPLETE** — the full chain exists in code and typechecks/builds, but no
  end-to-end test exercises it here.
- **IMPLEMENTED_BUT_UNVERIFIED** — the chain exists but depends on a live
  provider/model/database that cannot run in this sandbox.
- **LIVE_TEST_PENDING** — requires real provider interaction (§94).

## The §115 end-to-end acceptance chain
`VISITOR → WEBSITE → FORM/SOCIAL/EMAIL/WHATSAPP/CALL → PROVIDER → WEBHOOK/API →
IDENTITY MATCH → CONTACT → LEAD → CRM → AI AGENT → QUALIFICATION → EMPLOYEE →
SLA → COMMUNICATION → TASK → APPLICATION → DOCUMENT → UNIVERSITY → OFFER → VISA →
CONVERSION → ANALYTICS → AUDIT`

**Status: IMPLEMENTED_BUT_UNVERIFIED.** Every link exists in code, but the chain
cannot be exercised end-to-end here because it requires live provider credentials,
a configured model, and a production database. It must be run with safe test
records on the production VPS (§115) — an OWNER action.
