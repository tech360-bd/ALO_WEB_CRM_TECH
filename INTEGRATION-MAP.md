# INTEGRATION-MAP — ALO Education Web CRM

Snapshot: **2026-10-18**, branch `arena/ef31f574-alo-web-crm-tech`, base `ef7fb8b2`

Status vocabulary used throughout:

| Status | Meaning |
|---|---|
| **Implemented** | Code exists, is wired, and is covered by a test that ran green in this session |
| **Partial** | Code exists and is wired, but a required piece is missing or unproven |
| **Missing** | No server-side implementation exists |
| **Blocked** | Cannot be completed without something outside this repository (credentials, contract, daemon, approval) |

> **"Implemented" never means "live in production."** This environment has no
> production access and no provider credentials. Runtime state is a separate
> question, addressed in `PRODUCTION-VERIFICATION.md`.

---

## 1. Measured totals

```
API route files        911     find src/app/api -name route.ts
Page routes            413     find src/app -name page.tsx
Prisma models          533     grep -c '^model ' prisma/schema.prisma
Test files             201     find tests -name '*.test.*'
Registered cron jobs    21     src/lib/cron/job-registry.ts
```

---

## 2. Core CRM

| Feature | Status | Source | Notes |
|---|---|---|---|
| Lead capture (public forms) | Implemented | `src/app/api/website/lead`, `src/app/api/lead-forms`, `src/lib/lead-reference.ts` | `LeadForm` is the single queue; `createLeadWithReference` is the shared writer |
| Lead scoring | Implemented | `src/app/api/lead-scoring`, `src/lib/ai-whatsapp-engine.ts` (`calculateLeadScore`) | Models `Lead`, `MarketingLead`, `MarketingLeadScore`, `AiLeadScore` |
| Manual lead add (counsellor) | **Implemented (fixed)** | `src/app/api/crm/leads/counselling/route.ts` | Student ID now via `allocateIdentifier`; see `CURRENT-STATE-AUDIT.md` F-01 |
| Unified inbox | Implemented | `src/app/api/inbox/unified`, `src/lib/inbox/` | Models `UccConversation`, `UccMessage`, `SocialInbox`, `SocialInboxMessage` |
| Applications & timeline | Implemented | `src/app/api/applications/**`, `src/app/api/crm/**` | Models `Application`, `TimelineEvent`, `PortalStudentApplication` |
| SLA engine | Implemented | `src/lib/sla-engine.ts`, cron `sla-monitoring` | `CommunicationSlaIncident`, `SlaIncidentCounter` |
| Duplicate-safe Student ID | **Implemented (fixed)** | `src/lib/identity/student-id.ts` + `src/lib/identity/student-create-lock.ts` | Atomic `LAST_INSERT_ID` sequence + advisory lock on natural key |

---

## 3. WhatsApp Business Cloud API

| Feature | Status | Source | Config vars (names only) |
|---|---|---|---|
| Webhook verify + receive | Implemented | `src/app/api/whatsapp/webhook/route.ts` (1,077 lines) | `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` |
| HMAC signature verification | Implemented | same, `verifySignature()` | `WHATSAPP_APP_SECRET` — **required in production**, unsigned rejected |
| Message-type extraction (10 types) | Implemented | `extractMessageContent()` | text, image, document, audio, video, location, contacts, interactive, button |
| Inbound media download | Implemented | `src/lib/whatsapp-inbound-media.ts`, `src/lib/whatsapp-media-ingestion.ts` | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| Outbound send | Implemented | `src/app/api/whatsapp/send`, `src/lib/whatsapp-cloud-api.ts` | Graph `v20.0` (handler) / `v18.0` (webhook route) |
| Number pool + routing | Implemented | `src/lib/whatsapp-number-pool.ts`, `src/app/api/whatsapp/routing` | `ALO_MAIN_WHATSAPP_NUMBER`, `ALO_COO_WHATSAPP_NUMBER`, `ALO_FOLLOWUP_WHATSAPP_NUMBER`, `ALO_EMPLOYEE_WHATSAPP_START/END`, `ALO_COMPLAINT_WHATSAPP_NUMBER` |
| Follow-up sequences | Implemented | `src/lib/whatsapp-followup-engine.ts`, cron `whatsapp-followups` | Models `WhatsAppFollowUpSchedule`, `WhatsAppFollowUpTemplate` |
| Retry queue | Implemented | cron `failed-message-retry` | `WhatsAppRetryQueue`, max 3 attempts |
| Idempotency | Implemented | `src/lib/communications/webhook-idempotency.ts` | `WebhookEvent` has `@@unique([provider, eventId])` |
| STOP/START consent | Implemented | `handleStopStartCommand()` | `src/app/api/omnichannel/consent` |
| Analytics | Implemented | `src/app/api/whatsapp/analytics` | `WhatsAppAnalyticsDaily` |
| **Type safety of main webhook** | **Partial** | `// @ts-nocheck` at line 1 | See F-05 — the 911-route `tsc` pass **does not cover this file** |
| **Live provider connection** | **Blocked** | — | Needs `WHATSAPP_TOKEN` + registered webhook URL. No call was made. |

**Version inconsistency (LOW):** the consolidated handler posts to Graph `v20.0`
(`src/lib/whatsapp-webhook-handler.ts:71`) while the webhook route posts to
`v18.0` (`src/app/api/whatsapp/webhook/route.ts:63`) and
`SocialIntegration.apiVersion` defaults to `v19.0`. Three different Graph
versions in one system. `WHATSAPP_GRAPH_VERSION` exists as a variable but is not
used by these call sites.

---

## 4. Document ingestion & storage

Full detail in `DOCUMENT-STORAGE-ARCHITECTURE.md`.

| Feature | Status | Source |
|---|---|---|
| Private storage, never web-served | Implemented | `src/lib/storage/private-file-store.ts` |
| Storage-root/web-root overlap guard | Implemented | `validatedStorageRoot()` rejects roots inside `public`, `public_html`, `.next` |
| Magic-byte MIME validation | Implemented | `detectMime()` in both upload routes |
| File ownership + access control | Implemented | `src/lib/documents/document-access.ts`, `document-access-resolver.ts`, `src/lib/ucc/document-access.ts` |
| Download authorization | Implemented | `src/app/api/documents/[id]/download`, `src/app/api/student-portal/documents/[id]/download` |
| Rejection reasons + audit | Implemented | `src/lib/documents/document-rejection.ts`, models `DocumentAudit`, `DocumentSecurityIncident` |
| **Malware scanning** | **Implemented (new)** | `src/lib/documents/malware-scan.ts` |
| **ClamAV daemon** | **Blocked** | Code ready; no clamd deployed. `CLAMAV_HOST`, `CLAMAV_PORT` |
| **Scan verdict persisted** | **Missing** | Verdict is enforced but not written to any audit table (needs schema change) |
| Retention policy | **Partial** | cron `temp-file-cleanup`, `document-expiry-alerts` exist; no per-category retention schedule found |

---

## 5. Social & marketing

Detail in `SOCIAL-API-CONNECTIONS.md`.

| Platform | Status | Evidence |
|---|---|---|
| Facebook Pages | **Implemented (hardened)** | `src/app/api/facebook/auth`, `/callback`, `/webhook`; model `FacebookIntegration` |
| Facebook lead ads | Implemented | `src/lib/facebook-lead-sync.ts`; model `FacebookLeadRaw`; scope `leads_retrieval` |
| Instagram | **Missing** | Env vars only; no OAuth route. `social_instagram` exists in `src/lib/communications/channel-registry.ts` as a channel *definition* |
| Google Ads | **Missing** | No env vars, no route. Only a UI component mentions it |
| YouTube | **Missing** | `YOUTUBE_CLIENT_ID/SECRET` declared, unused server-side |
| LinkedIn | **Missing** | `social_linkedin` declared in channel registry only |
| Email (SMTP) | Implemented | `src/app/api/email/**`; models `EmailOutboxItem`, `EmailEvent`, `EmailSuppression`, `EmailCampaign` |
| SMS (httpSMS) | Implemented | `src/app/api/integrations/httpsms/webhook`; `SMS_PROVIDER_URL`, `SMS_PROVIDER_API_KEY`, `HTTPSMS_PHONE_ID` |
| 3CX telephony | Implemented | 16 routes under `src/app/api/integrations/3cx/**`; model `ThreeCxIntegration` |
| Marketing campaigns | Implemented | `src/app/api/marketing/**`, `src/app/api/campaigns/**`; `MarketingCampaign`, `Campaign`, `CampaignPost` |

---

## 6. Super Admin Integration Center

| Feature | Status | Source |
|---|---|---|
| Integration Center UI | Partial | `src/app/admin/integration-center/page.tsx`, `src/app/crm/integration-center/page.tsx`, `src/components/admin/SocialIntegrationCenterPage.tsx` |
| Backing API | Partial | `src/app/api/crm/ucc/integrations/route.ts` — 145 lines, `GET`/`POST`/`DELETE`, exposes `healthStatus` |
| OAuth wizard UI | Partial | `src/components/communication/OAuthIntegrationWizard.tsx` |
| Integration model | Implemented | `SocialIntegration` (provider, accessToken, refreshToken, tokenExpiresAt, webhookStatus, healthStatus, lastSyncAt) |
| Integration audit trail | Implemented | `IntegrationAuditLog` (actor, action, previousState, newState, ipAddress, requestId, result) |
| Webhook event log | Implemented | `WebhookEvent` (provider, eventId, verified, processed, errorMessage), `SocialWebhookEvent`, `UccWebhookEvent` |
| **Central credential vault** | **Partial** | `src/lib/vaultwarden-client.ts` exists and reuses AES-256-GCM, but tokens are still written to ordinary columns. See F-08 |
| **Connection health probing** | **Partial** | `healthStatus` is a stored string; the `GET` returns `'unknown'` when unset. No active probe found |
| **Cross-platform connection manager** | **Missing** | Only Facebook has a complete connect flow |

---

## 7. AI

Detail in `AI-AGENT-INTEGRATION.md`.

| Feature | Status | Source |
|---|---|---|
| AI model registry | Implemented | `src/app/api/ai-models`, `src/app/api/ai-registry`; `AiModel`, `AiModelVersion`, `AiModelDeployment`, `AiModelEvaluation` |
| AI agents | Implemented | `src/lib/ai-agents/**`, `src/app/api/ai-agents`; `AiAgent`, `AiEmployee`, `AiTask`, `AiAction` |
| Agent guardrails | Implemented | `src/app/api/ai-safety`; `AGENT_MAX_STEPS`, `AGENT_MAX_TOOL_CALLS`, `AGENT_TOKEN_BUDGET`, `AGENT_MAX_RUNTIME_MS`, `AGENT_APPROVAL_POLICY`, `GlobalAiPause` |
| Durable background queue | Implemented | `src/lib/cron/job-runner.ts`, `job-registry.ts`, `cron-lock.ts`; `CronJobLog`, `MonitoringJob`, `MarketingAgentJob` |
| WhatsApp AI reply/intent | Implemented | `src/lib/ai-whatsapp-engine.ts`; `AiIntentLog`, `AiReplyLog`, `AiSentimentLog`, `AiReplyDraft` |
| Document AI classification | Implemented | cron `ai-document-processing`; `AiDocumentClassification`, `OcrJob` |
| LLM providers | Implemented | `GROQ_API_KEY`, `ZAI_API_KEY`, `LOCAL_AI_URL`, `LOCAL_AI_MODEL`, `LOCAL_AI_API_KEY` |
| **ALO Labs connection** | **Blocked** | Zero references in the repository. Needs API contract + credentials |

Cron dispositions (from `job-registry.ts`, counted):

```
15  job                  → real work under a lease with a durable log entry
 2  external-dependency  → refuses to run, names the missing outside resource
 4  superseded           → refuses to run, names the live implementation instead
```

The registry is explicit that *"No entry is a placeholder: a job that cannot do
its job says so and never reports success."* `database-backup` is one of the two
`external-dependency` jobs — **backups are not performed by this application.**

---

## 8. Access boundaries

| Role | Portal | Status |
|---|---|---|
| Student | `src/app/student/**`, `src/app/portal/**` | Implemented |
| Partner | `src/app/partner/**`, `src/app/partner-admin/**` | Implemented |
| Counselor | `src/app/counselor/**` (21 sections) | Implemented |
| Employee | `src/app/employee/**` (role-specific dashboards) | Implemented |
| Super Admin | `src/app/super-admin/**`, `src/app/admin/**` | Implemented |

Mechanism: `src/lib/unified-auth.ts` returns a discriminated
`{ type: 'portal' } | { type: 'student' }` context; policy lives in
`src/lib/access-control/central-security-engine.ts`, `object-scope.ts`,
`src/lib/rbac/permission-service.ts`, `role-service.ts`. Models: `Role`,
`Permission`, `RolePermission`, `PortalRole`, `PortalPermission`,
`PortalRolePermission`, `PermissionPackage`, `EmployeePermissionPackageAssignment`.

Document-level review authority is enforced by
`evaluateDocumentTransition()` in `src/lib/communications/document-policy.ts`:
only `counselor`, `admin`, `system` may verify or reject; deletion is never a
lifecycle transition. Verified by `tests/unit/whatsapp-student-journey.test.ts`.

---

## 9. Cross-cutting gaps

| # | Gap | Severity | Owner |
|---|---|---|---|
| G-1 | `@ts-nocheck` on 8 files incl. the main WhatsApp webhook | MED | Eng |
| G-2 | Three Graph API versions in use (v18.0 / v19.0 / v20.0) | LOW | Eng |
| G-3 | No malware-scan verdict persisted | MED | Eng (needs schema change) |
| G-4 | No ClamAV daemon in any environment | HIGH | Ops |
| G-5 | Instagram / Google Ads / YouTube / LinkedIn not connected | MED | Eng + Marketing |
| G-6 | ALO Labs contract and credentials absent | MED | Product |
| G-7 | 58,758 vendored `node_modules` files tracked in git | MED | Eng |
| G-8 | No retention schedule per document category | LOW | Compliance |
