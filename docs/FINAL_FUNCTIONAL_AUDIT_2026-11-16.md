# ALO CRM — Final Functional Audit & Live Integration Verification

Date: 2026-11-16 · Branch: `arena/92d9a42c-alo-web-crm-tech` (from `6e14a614` of main) · Auditor: automated repository audit + offline evidence collection

## 0. Environment ground truth (read this first)

| Fact | Value |
| --- | --- |
| Database | **None reachable.** `DATABASE_URL` bootstrap at 127.0.0.1:3306 fails (P1001). Every DB-backed workflow is verified by code inspection + unit tests with mocked Prisma boundaries, never against live data. |
| Outbound network | Restricted to GitHub/npm/PyPI registries. Google, Meta, SMTP/IMAP, clamd, and provider endpoints are **unreachable** from this environment. |
| Secrets | None provisioned. No `.env` exists. `.env.example` documents the required keys. |
| Offline evidence (re-verified 2026-11-16, this session, after `npm ci` + vendored Prisma engines) | Vitest: **3,939 passed / 148 skipped / 0 failed** (370 files, 357 run / 13 skipped) — re-ran green. `tsc --noEmit`: **NOT VERIFIED** — killed twice (Exit 137) at ~3.9 GB RAM; sandbox lacks the heap headroom. Production build: **NOT VERIFIED** in this session (`node_modules` absent from snapshot; `.next` not persisted); a prior build pass (`ctiLjopBfnm3YYuQswLZU`, pre-snapshot state) is not reproducible from the current workspace. Secret scan: not re-run this session. Changes since last known green were untracked Phase-3 source files; the suite validates them indirectly, `tsc`/build do not. |
| Live evidence | **None exists.** No part of this report may be read as "works in production". Live verification requires the credentials and database listed per feature. |

**Status vocabulary used:** PASS / PARTIAL / MOCK / NOT CONNECTED / CONFIGURATION REQUIRED / FAILED / NOT IMPLEMENTED. PASS is granted only where a real test ran (or the environment-independent code contract ran). Everything else says exactly what is missing.

## 1. What this repository actually is

| Layer | Actual contents |
| --- | --- |
| API routes | 1,120 (`src/app/api/**/route.ts`) |
| Pages | 499 (`src/app/**/page.tsx`) |
| Prisma models | 633 |
| Test files | 362 (`tests/unit`, `tests/integration`) |
| Cron jobs | 17 configured in `vercel.json` + `cron-definitions.ts`; policy check `failed: 0`; `scripts/verify-15-cron.ts` present |
| Branch state | Working tree carries the contact-registry Phase-3 work (uncommitted by design); nothing merged, deployed, migrated or pushed to main |

This is not a small CRM. It is a very large, largely self-consistent codebase that has never been verified against a running production database or a live provider. That single fact dominates every status below.

## 2. Part-by-part audit

### PART 1 — Full system audit (modules exist; live function mostly unverified)

Module presence (frontend route ↔ API namespace ↔ models):

| Module | Frontend | Backend | Models | Live state |
| --- | --- | --- | --- | --- |
| CRM leads/contacts | `/crm/contacts*`, `/crm/leads` | `/api/crm/contacts*`, `/api/crm/leads` | WhatsAppContact, ContactPhone, MarketingLead | DB: UNVERIFIED |
| Student management | `/crm/students`, `/counselor/students/[id]`, `/employee/students` | `/api/counselor/students/*`, `/api/students*` | Student, StudentIdSequence | DB: UNVERIFIED |
| Employee portal | `/employee/*` (30+ pages incl. my-accounts, settings, inbox, tasks) | `/api/employee/*` | Employee, EmployeeCommunicationProfile, EmployeeProfile | UNVERIFIED |
| Partner portal | `/partner/*`, `/partner-admin/*` | `/api/partner*`, `/api/partner-portal*`, `/api/b2b*` | PartnerProfile, B2BContact | UNVERIFIED |
| Student Portal | `/student/*` (SPA via `/student-portal` shell) | `/api/student-portal/*` | PortalStudentProfile, PortalStudentDocument | UNVERIFIED |
| WhatsApp | `/crm/whatsapp`, `/admin/whatsapp-numbers`, `/admin/whatsapp-followup` | `/api/whatsapp/*`, webhook | WhatsAppOfficialNumber, WhatsAppMessageArchive, WhatsAppFollowUpSchedule, WhatsAppNumberAssignmentAudit | Code: strong · Live: NOT CONNECTED |
| Email | queue UIs + `/admin/marketing-automation` | `/api/official-emails`, `/api/email/*`, `/api/cron/email-outbox` | OfficialEmail, EmailOutboxItem, EmailEvent, EmailSuppression | Code: strong · Live: NOT CONNECTED (flag default-off) |
| Social | `/employee/social-media`, marketing hub, integration center | `/api/social/*`, `/api/social/[provider]/*`, `/api/crm/ucc/*` | SocialIntegration, SocialInbox, SocialInboxMessage, SocialConnectedAccount, SocialAccountOwnership | Marketing OAuth: implemented for instagram/linkedin/youtube · Facebook OAuth: not offered · UCC OAuth start: **refuses with 501 NOT_VERIFIED by design** |
| AI agents | `/admin/ai-*`, `/crm/ai-command-center`, ucc ai-assistant | `/api/crm/ucc/ai-assistant`, `/api/whatsapp/ai-intent`, `/api/ai-agents/*` | AiAgent* (70 ai/agent models), AiIntentLog, AiReplyLog | Provider calls NOT VERIFIED (no keys) |
| Enquiries | via leads/chat/whatsapp | `/api/crm/leads*`, `/api/crm/ucc/*` | MarketingLead, UccConversation | UNVERIFIED |
| Ticketing | **No ticket module** | `/api/employee/support-ticket` (fake — see MOCK list), `/api/communications/escalations` (real EscalationEvent) | EscalationEvent, CommunicationEscalation | **PART 7 is the weakest area** |
| Documents | `/crm/students/[id]`, student portal documents, `/admin/document-security` | `/api/application-documents/*`, `/api/documents/auto-upload`, `/api/student-portal/documents`, `/api/messages/document-auto-upload` | StudentDocument, PortalStudentDocument, EmployeeDocumentVersion, DocumentAudit | Code: strong · Live: UNVERIFIED |
| Google Contacts | `/admin/google-contacts`, `/admin/google-stack` panel | `/api/google/contacts/{status,sync}` | WhatsAppContact(source=GOOGLE_CONTACTS), ImportBatch, ContactMatchReview | Code: strong + unit tested · Live: WAITING FOR CREDENTIALS (never called Google) |
| Automation | `/admin/ai-command-center`, n8n hooks | `/api/crm/automation*`, `/api/cron/*` | AgentSchedule, AgentRun | UNVERIFIED |
| Integration settings | `/admin/integration-center`, `/admin/integration-wizard`, `/crm/communications/settings`, `/admin/integration-health` | `/api/crm/ucc/integrations`, `/api/google/contacts/status`, `/api/whatsapp/numbers` | SocialIntegration, WhatsAppOfficialNumber | UNVERIFIED |
| Permissions/RBAC | role-permissions UIs | `withAuth`, `staffGuardDenied`, `DataScope` | UserPermissionOverride, Employee/Department tables | Code: strong + unit tested · DB enforcement UNVERIFIED |

### PART 2 — Individual employee official accounts

**Code that exists:** `EmployeeCommunicationProfile` (officialEmail/officialPhone/whatsappNumberId/facebookAccess/instagramAccess/assignedPages/channelPermissions/working hours/escalationLevel/offboarding), `Employee` table (employeeId, branch, department, designation, official phone), `SocialAccountOwnership` + `SocialConnectedAccount` + `SocialAccount` models, `EmployeeProfile`, `/employee/my-accounts` (own accounts view + disabled Connect buttons), `/employee/settings`, `/employee/social-media`, `/employee/ucc`, `/admin/whatsapp-numbers` (full assignment lifecycle + history), `/api/crm/ucc/employee-profiles` + `offboard`.

**Findings (honest):**

| Check | Status | Evidence |
| --- | --- | --- |
| Employee logs in to own portal | CONFIGURATION REQUIRED | `/employee/login` exists; portal auth unverified live |
| Open Account & Communication Settings | PARTIAL | `/employee/my-accounts` renders live rows from `socialAccountOwnership`/`socialConnectedAccount` (server component); settings page exists |
| View assigned official phone / WhatsApp | PARTIAL | Renders from `EmployeeCommunicationProfile` if a row exists — nothing creates those rows automatically; no migration seeds them |
| Add/verify phone or WhatsApp number | NOT IMPLEMENTED | No employee-facing phone verification flow. Number assignment exists **admin-side only** (`/admin/whatsapp-numbers`), and verification is Meta-provider-gated |
| Connect Facebook / Instagram / other accounts | **NOT CONNECTED (by honest design)** | `SocialAccountActions`: "Connect OAuth — unavailable", token exchange/live verification explicitly not configured (`OAUTH_START_REFUSED`, 501). UCC equivalent intentionally refuses. Marketing hub *does* build authorize URLs for instagram/linkedin/youtube with env gating and a real token exchange + encryption (`src/lib/social/providers.ts`, `token-encryption.ts`) — but only for the marketing hub persona, only those 3 providers, Facebook OAuth not offered |
| Disconnect an account | PARTIAL | Local disconnect works (`DELETE /api/communications/social-accounts/[id]`) — provider-side revocation must be done manually (button says so) |
| Reconnect expired integration | NOT IMPLEMENTED | No health/expiry detection job for social tokens; no re-auth flow |
| View recent integration activity | PARTIAL | `/api/crm/ucc/integrations` lists provider rows + healthStatus strings stored in DB — these are **stored labels**, not live probes |
| Employee Number Assignment (Super Admin) | PARTIAL → CONFIGURATION REQUIRED | Add/assign/transfer/suspend/revoke + full `WhatsAppNumberAssignmentAudit` history + `verify_connection` action all implemented and unit-tested — but every action is Meta-provider-gated; **no number is verified**, assignments can be recorded but connectivity cannot be proven here |
| "A number must not be assigned to two employees" | PARTIAL | `/api/whatsapp/numbers` assignment validates ownership/conflict for `ownerType EMPLOYEE` rows; employee↔number also appears on `EmployeeCommunicationProfile.whatsappNumberId` — the two are not transactionally linked (inconsistency risk; see Gaps) |
| Connection history per employee | PARTIAL | `WhatsAppNumberAssignmentAudit` covers numbers; social account connect/disconnect history has no dedicated table (only AiAuditLog-ish generic logs) |

### PART 3 — Individual WhatsApp integration

| Check | Status | Why |
| --- | --- | --- |
| Official WhatsApp Business Platform path | Implemented | Cloud API adapter `whatsapp-cloud-api.ts` (765 lines), WABA ids, phone_number_id, templates, webhook verification (HMAC `X-Hub-Signature-256`, prod refuses unsigned), delivery/read statuses |
| Multiple authorised business numbers | Implemented (records) / NOT CONNECTED (proven) | 20 requested records seeded idempotently as `disconnected`; env-driven; `verify_connection` exists; **nothing is Meta-verified** |
| Employee-specific conversation assignment | PARTIAL | Assignment fields exist on conversations; routing engine `/api/whatsapp/routing` implements priority explicit > counselor > branch > department > purpose > fallback; untested live |
| Central message storage | Implemented | `WhatsAppMessageArchive` (unique whatsappMessageId), UccConversation/UccMessage, raw `WebhookEvent` |
| Student identification in conversation | Implemented (policy) / UNVERIFIED (live) | identification.ts + journey tests with fakes pass |
| Contact identification | Implemented | identify endpoint + card, scope + audit |
| Human handover | Implemented (policy) | shouldHandover in ai-whatsapp-engine; complaint/urgent/sensitive intents detected; handover logged; NOT exercised live |
| Delivery/read status | Implemented | archive stores sent/delivered/read/failed; failure webhook handled |
| Message failure handling | Implemented | WhatsAppRetryQueue model + retry engine; failure classification; NOT exercised live |
| Conversation history per contact | Implemented | contact detail page shows archive; retention fields present |
| Per-employee provider status (the employee-by-employee table requested) | **NOT CONNECTED** | No employee has a WhatsApp Business `phone_number_id` recorded; per-employee WABA does not exist; template approval is per WABA |
| Personal WhatsApp accounts | **Platform limitation (stated, not worked around)** | Personal WhatsApp cannot be connected via the official Cloud API. Only WhatsApp Business Platform numbers (app or API) with Meta verification can. The code correctly refuses to fake this; unofficial automation is prohibited by the repo's own docs and was not added |

**The exact table requested for Part 3 (Employee ID / name / number / WABA / status / last communication) cannot be produced truthfully** — the registry contains zero verified rows. Any "connected" answer would be fabricated.

### PART 4 — Individual social media integration

| Check | Status | Evidence |
| --- | --- | --- |
| Facebook Pages via OAuth | **NOT CONNECTED** | Facebook is not an OAuth provider in the marketing hub (`SOCIAL_OAUTH_PROVIDERS = instagram, linkedin, youtube`); UCC refuses with 501; `FACEBOOK_*` env keys exist but are unused by any working exchange |
| Instagram professional accounts | CONFIGURATION REQUIRED (the only social path that is real code) | `src/lib/social/providers.ts`: authorize URL + `checkProviderEnv` + encrypted token storage + callback exchange exist — **never executed** (no app credentials here); professional vs personal account type is inferred from token scope, not verified |
| LinkedIn | CONFIGURATION REQUIRED | Same path as Instagram |
| YouTube | CONFIGURATION REQUIRED | Same path + YouTube read-only/upload scopes exist |
| Incoming enquiries → CRM records | PARTIAL | `/api/social/[provider]/webhook` exists; `/api/social/inbox` lists `SocialInbox` rows — ingestion path is plausible but unproven; no Page subscription has ever been registered |
| Replies | **MOCK / misleading** | `/api/social/reply` does **not call Meta** — it flips `SocialInbox.status='replied'`, writes `SocialInboxMessage` + audit, and returns `'Reply sent (official API)'` with a trailing "configure access token" note. **No provider call occurs.** Flagged as a defect (see Gaps #6) |
| Token expiry detection / reconnect | NOT IMPLEMENTED | Tokens stored encrypted with `tokenExpiresAt` — no job checks expiry; no reconnect flow except re-running OAuth |
| Disconnect | PARTIAL | Local disconnect works; provider-side revocation manual |
| Account ownership verification | NOT IMPLEMENTED | Ownership is asserted from the OAuth grant + `assignedPages` JSON; no Business Manager ownership proof |
| Personal vs Page vs Business distinction | PARTIAL | `assetType` exists in models/UCC integration rows; nothing enforces or displays it consistently |

### PART 5 — Central email system

| Check | Status | Evidence |
| --- | --- | --- |
| Central approved sender | PARTIAL | `MAIL_FROM_ADDRESS`/`SMTP_FROM` + `EMAIL_FROM_NAME`; marketing config `readEmailMarketingConfig` (name/address/caps); no enforcement that *all* automations use it — two parallel stacks exist (`email-service.ts` + `email-marketing/*`) |
| Student registration emails | CONFIGURATION REQUIRED | No queue item is enqueued by the registration path (`canonical-student.ts` creates profile/lead; no email call found) — registration email is **not wired** |
| Application updates / document requests / ticket notifications / partner notifications / employee alerts | PARTIAL (varies) | email-outbox worker + templates engine exist; document-request path exists via followups/UCC; ticket notification impossible (no tickets); employee alerts via whatsapp-followup admin route exist |
| Email replies captured | **NOT IMPLEMENTED** | IMAP/POP keys exist in `.env.example`; zero code references `IMAP_HOST`/`POP3_HOST`; `EmailSync` model exists with no writer; replies cannot arrive |
| Replies routed to Contact ID / Student ID | NOT IMPLEMENTED | Same root cause |
| Delivery failure recorded | PARTIAL | `EmailOutboxItem.status`/`EmailEvent` + failure classification (`email-marketing/failures.ts`) for outbound worker only |
| Duplicate emails prevented | PARTIAL | Idempotency keys in worker; no end-to-end test |
| Provider authentication actually works | **NOT VERIFIED** | nodemailer code is correct-looking (pooling, TLS, timeouts, caps); zero live sends; `EMAIL_SENDING_ENABLED` defaults off; **SPF/DKIM/DMARC: documentation mentions exist (`docs/HOSTINGER-PRODUCTION-RECONCILIATION.md` etc.) but no zone records were inspected from here — NOT VERIFIED** |
| Credentials not exposed | PASS | SMTP secrets are server-side only; scan clean |

### PART 6 — AI enquiry & communication system

Scenarios from the brief, tested statically against `ai-whatsapp-engine.ts` + `/api/crm/ucc/ai-assistant` + webhook pipeline:

| # | Scenario | Code support | Status |
| --- | --- | --- | --- |
| 1 New student enquiry | Intent map + routing | PARTIAL (untested live) |
| 2 Existing student enquiry | identifyByPhone → Student | PARTIAL |
| 3 Parent enquiry | GUARDIAN_NUMBER state + ParentGuardian | PARTIAL |
| 4 Agent enquiry | lead source/partner match | PARTIAL |
| 5 Partner enquiry | b2B matching | PARTIAL |
| 6 Unknown phone number | UNKNOWN state, creates nothing | **PASS (policy + tests)** |
| 7 Existing Student ID | exact_student_id match | **PASS (policy + tests)** |
| 8 Missing information | lead scoring + questions templates | PARTIAL |
| 9 Document request | DOCUMENT_REQUIREMENT intent + escalation | PARTIAL |
| 10 Admission question | admission intent | PARTIAL |
| 11 Visa question | visa intent | PARTIAL |
| 12 Payment question | payment/refund intents | PARTIAL |
| 13 Complaint | complaint intent + handover trigger | PARTIAL |
| 14 Urgent enquiry | urgent_support + isUrgent + SLA start | PARTIAL |
| 15 Sensitive enquiry | isHighRisk sentiment + escalation intents | PARTIAL |
| 16 Human assistance | counselor_request → handover | PARTIAL |

**The AI cannot invent student details** — enforced by construction (`generateAiReply` forbids guarantees/fabrications, answers are template-bounded) and by tests; **however every scenario above is untested against a real provider key and real conversation data.** The UCC AI assistant correctly returns `CONFIGURATION REQUIRED` when no provider is configured (verified by code read). Live test accounts do not exist in this environment. Status: **PARTLY IMPLEMENTED, NONE LIVE**.

### PART 7 — Escalation and ticketing

| Check | Status | Evidence |
| --- | --- | --- |
| Unique Ticket ID for every enquiry | **NOT IMPLEMENTED** | No `Ticket` model anywhere. `portalAuditLog` rows are abused as tickets in `/api/employee/support-ticket` with `entityId: ticket-<Date.now()>` and a DB-failure catch that fabricates a success object |
| Urgent / complaint / financial / visa-refusal / sensitive / unresolved classes | PARTIAL (as events, not tickets) | `EscalationEvent` + `CommunicationEscalation` models with RBAC'd routes — real persistence, no SLA routing engine, no acknowledgement, no department queue |
| Department/employee receives ticket | NOT IMPLEMENTED | No assignment workflow for tickets; escalations carry optional counselorId/supervisorId |
| Notification delivery + acknowledgement | NOT IMPLEMENTED (tickets) / UNVERIFIED (SLA alerts) | SLA monitoring cron exists (`*/1` SLA checks) with alerting unverified; nothing can be delivered without providers |
| Updates appear in central CRM / student profile | PARTIAL | Escalations link studentId/communicationId and are audited |
| **Escalation numbers 01805020101 vs 01805030101** | **RESOLVED 2026-11-16: the authorised administrator confirmed 01805020101** as the emergency escalation number. The assigned employee/department name was not provided with the answer, and no delivery test has been executed — attempted tests require production credentials (see §5/§9/§10). Delivery test remains pending; 01805030101 is not referenced anywhere in the codebase |
| Ticket creation from AI conversation | NOT IMPLEMENTED | AI escalation writes an escalation/`UnknownIncomingContact`/follow-up — no ticket |

**Verdict: PART 7 is the weakest requirement in the audit. It must NOT be reported as working.**

### PART 8 — Student document management

| Check | Status | Evidence |
| --- | --- | --- |
| Student login / own Student ID / application / checklist | PARTIAL | Portal auth exists (`portal-auth`, `/student/*`); dashboard/checklist views exist; UNVERIFIED live |
| Upload → private storage | Implemented | `storePrivateFile` (signature-checked, randomized names, private dir); upload routes: `/api/documents/auto-upload`, `/api/whatsapp/document-upload`, `/api/messages/document-auto-upload`, `/api/crm/ucc/documents/upload`, `/api/storage/upload`, `/api/counselor/documents/upload-on-behalf` |
| File type / size validation | Implemented | Magic-byte signature detection (`detectedMime`), size caps; unit-tested |
| Malware scan | Implemented (built-in sigs always; ClamAV only when `CLAMAV_HOST` set) | `malware-scan.ts`; fail-closed policy optional; ClamAV NOT configured here (NOT VERIFIED to scan) |
| OCR processing | **MOCK/STUB** | `/api/crm/ucc/ocr/process` "creates field stubs awaiting real OCR output" — awaits Google Vision/Textract; **no OCR engine is wired** |
| Employee review / approve / reject / replace | PARTIAL | `/api/application-documents/[id]/approve|reject|request-again` + audit; UI in student-360; UNVERIFIED live |
| Audit history | PARTIAL | DocumentAudit model + audit writes; `document-security` incidents model |
| WhatsApp document ingestion | PARTIAL | `/api/marketing/whatsapp-doc-upload` and `/api/whatsapp/document-upload` (student-linked, private) exist; ingestion → scan → queue path: code present, untested live; documents never attached to unverified records (enforced in message-upload route — verified by code read) |
| Access restrictions | Implemented (code) / UNVERIFIED (live) | `authorizeStaffDocumentRead`, `canReadDocumentsByRole`, private store outside webroot |

### PART 9 — Automatic form completion

| Check | Status | Evidence |
| --- | --- | --- |
| Retrieve verified student information | PARTIAL | `buildFormPrefill` in ucc ai-assistant reads conversation + student record |
| Identify missing fields / prepare draft / populate permitted fields | PARTIAL | `FormFillSuggestion` model; `/api/crm/ucc/form-fill/approve` (high-risk ADMIN approval, standard COUNSELOR+) — approval-gated by design |
| Conflict detection | PARTIAL | Suggestion rows carry confidence/reason; conflict UI not verified |
| Save draft / review / final approval recorded | PARTIAL | Approvals persist audit (`logAuditAction`) + suggestion status transitions |
| No submission of official forms without authorisation | **PASS (design)** | Nothing in the code submits to university/visa/financial rails; submission is explicitly out of scope of every form path |

### PART 10 — Real integration tests (A–F)

**All six tests are BLOCKED in this environment** — for identical reasons: no reachable database (P1001), no provider credentials (Meta/SMTP/Google/Facebook), no outbound route to the providers, and no authorized test accounts. What each needs:

* Test A Employee WhatsApp: Meta WABA + `phone_number_id` for the employee number; assigned counsellor session; Meta test recipient.
* Test B Student WhatsApp: same, plus an opt-in test student.
* Test C Employee Social: Facebook Page (OAuth currently unimplemented for Facebook) or Instagram professional account + `INSTAGRAM_APP_ID/SECRET` + a registered test Page.
* Test D Student Document: portal credentials + a sample PDF (no DB → cannot store/associate).
* Test E Automatic Email: SMTP_HOST/USER/PASSWORD/FROM + `EMAIL_SENDING_ENABLED=true` + a test recipient.
* Test F AI Escalation: provider key (e.g. `GEMINI_API_KEY`) or local model + Meta or email channel + a test recipient; the current AI path with no key answers `CONFIGURATION REQUIRED` (by design).

**Running any of these against production students/employees is forbidden** without written authorisation. Nothing in this pass sent a single message.

## 3. Part 11 — Setup guide (from the actual menus in this repository)

Paths verified against the tree on 2026-11-16. "Where" means the URL path in this app. Statuses match Parts 1–10; every CONFIGURATION REQUIRED step fails until the listed credentials exist.

### 3.0 What must be provided before anything can connect
| Provider | Keys (server-side, never in the browser) | Used by |
| --- | --- | --- |
| Meta / WhatsApp Cloud | `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | webhook, send API, `/api/whatsapp/numbers` verify |
| Meta / Facebook (UCC + marketing hub) | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_REDIRECT_URI`, `FACEBOOK_GRAPH_VERSION` (hub); **UCC refuses OAuth start with 501** | UCC integrations, marketing hub (FB not an OAuth provider there) |
| Instagram | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI` (or FACEBOOK_APP_* fallback) | marketing hub OAuth |
| Google / YouTube | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `YOUTUBE_REDIRECT_URI`, `GOOGLE_CONTACTS_CLIENT_ID/SECRET/REFRESH_TOKEN` (contacts import) | `/api/google/contacts/*`, YouTube OAuth |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`/`MAIL_FROM_ADDRESS`, `EMAIL_SENDING_ENABLED`, `EMAIL_UNSUBSCRIBE_SECRET`, `EMAIL_APP_BASE_URL`, `CRON_SECRET` | outbox worker `/api/cron/email-outbox` |
| AI providers | `GEMINI_API_KEY` / `OPENAI_API_KEY` / local model base URL (as referenced by the UCC ai-assistant config) | `/api/crm/ucc/ai-assistant` |
| Scanning | `CLAMAV_HOST`, `CLAMAV_PORT` (fail-closed policy optional) | `src/lib/documents/malware-scan.ts` |
| Cron | `vercel.json` (17 crons) or Hostinger cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://<app-host>/api/cron/email-outbox` every 5 min | email outbox, SLA monitor |

### 3.1 Super Admin
1. **Integration Center** — `/admin/integration-center` (component `SocialIntegrationCenterPage`) — one card per Google/Meta/WhatsApp/Email/SMS; Connect buttons post to `/api/crm/ucc/oauth/start` → **returns 501 `NOT_VERIFIED` today**; expected result until token exchange + live verification ship. Disconnect works (removes local row). *Common error:* `OAUTH_START_REFUSED`.
2. **Integration Wizard** — `/admin/integration-wizard` (`OAuthIntegrationWizard`) — same OAuth start; seven provider tiles (meta_business, whatsapp, instagram, google_analytics, youtube, smtp_email, sms_provider); status badges driven by `/api/crm/ucc/integrations` (stored labels, not live probes).
3. **Integration Health** — `/admin/integration-health` — browser calls `/api/google/contacts/status`, `/api/whatsapp/numbers`; shows `PASS/NOT_VERIFIED/NOT_CONFIGURED` + per-number counts; **this page never fabricates green**.
4. **Assign WhatsApp numbers** — `/admin/whatsapp-numbers` — buttons: Initialize seed (20 records 01805020100–01805020119), per-row **Assign / Verify / Suspend / Revoke / Transfer**; assignment writes `WhatsAppNumberAssignmentAudit`; Verify calls Meta and stays `NOT_VERIFIED` without credentials. **No employee currently has a verified number.**
5. **Google Contacts import** — `/admin/google-contacts` — Configure → Dry-run → Apply (dry-run required first); test = People API call must answer. Credentials live in env only.
6. **Email** — `/admin/marketing-automation` and `/api/cron/email-outbox` worker (must be scheduled with `CRON_SECRET`); sending is off until `EMAIL_SENDING_ENABLED=true`.
7. **Permissions** — `/admin/permission-matrix`, `/admin/role-permissions`, `/admin/access-control-center`, `/admin/permission-review-view`.
8. **Document security** — `/admin/document-security`; **SLA watch** `/admin/sla-monitor`; **social monitoring** `/admin/social-media-management`.

### 3.2 Employee (own identity — never shared credentials)
1. **Log in** at `/employee/login` with your own credentials. Never ask for an employee's password; accounts must be provisioned by the Super Admin (`/admin/employees`) or IT.
2. **My Accounts** — `/employee/my-accounts` — lists your own platforms (Facebook page, Instagram professional, LinkedIn, YouTube, TikTok, X, Telegram, Pinterest). "Connect OAuth" is **disabled by design**; only **Disconnect** is usable. To connect: ask the Super Admin to complete provider authorization, or the Integration Administrator (below) for the Facebook/Instagram Business flow.
3. **Communication settings** — `/employee/settings` (`/employee/ucc` for communication prefs); your record lives in `EmployeeCommunicationProfile` (officialEmail, officialPhone, whatsappNumberId, channelPermissions, workingHours).
4. **Social media** — `/employee/social-media`; reply to an inbox item via `/api/social/reply` — note it does **not** currently call Meta (defect, see Gaps #6).
5. **Reconnect flow** — re-run the same Connect action once OAuth is enabled; local disconnect never revokes provider-side tokens (revoke in Meta/Google/LinkedIn app dashboards manually).
6. **Common errors** — `501 OAUTH_START_REFUSED` (OAuth not enabled), `CONFIGURATION REQUIRED` (missing key), disconnect leaves provider token live (manual revoke needed).

### 3.3 Partner
1. **Apply** via public `/partner/apply` (routes exist under `src/app/partner/apply/`).
2. **Partner dashboard** `/partner/*` after portal approval; WhatsApp contact uses the **main** official number only — partners have no dedicated WABA.
3. **Official access** — requests go through the same request-official-access queue (currently disabled) or via the Super Admin assigning a partner engagement with audited notes.
4. **Notifications** — `PartnerApplication`-linked emails flow through the same email outbox (CONFIGURATION REQUIRED).

### 3.4 Student
1. **Register** at `/student-portal/self-login` or the student portal root; your Student ID (`STU-YYYYMM-NNNN`) is shown in `/student-portal` dashboard (`/api/student-portal/dashboard`).
2. **Documents** — `/student-portal/documents` → **Upload** → progress → status (Pending/Approved/Rejected); rejection reason shown; re-upload allowed while pending; private storage, no public URL.
3. **Chat / support** — student messages route through `/api/student-portal/messages`; escalations go to counsellors via the escalation system — there is **no ticket form** yet (Part 7).
4. **Portal login help** — contact the main WhatsApp number (01805020100) — the student's own account must never be recovered by asking for the password.

### 3.5 Integration Administrator (the person who owns keys)
Responsibilities, all from this repo: (a) provision every credential in the table of §3.0 in the server environment (Hostinger/Vercel env, **never** in git); (b) run `/admin/integration-health` after each change; (c) approve OAuth scopes requested by Marketing (`INSTAGRAM_*`, `LINKEDIN_*`, `YOUTUBE_*`) and by Google Contacts (`GOOGLE_CONTACTS_REFRESH_TOKEN`); (d) verify Meta webhook (`GET` with `hub.verify_token`) then send HMAC-signed test payload; (e) only then enable `EMAIL_SENDING_ENABLED=true` and schedule the outbox cron; (f) run one dry-run Google sync before Apply; (g) audit scheduled runs in `/admin/audit-logs` + `/admin/integration-health`; (h) revoke unused tokens in provider consoles quarterly.


## 4. Gaps register (defects and thin wires found by code audit — do not paper over)

| # | Severity | Finding (file) | Fix sketch |
| --- | --- | --- | --- |
| 1 | **CRITICAL** | No Ticket module exists; employee "support ticket" writes a `PortalAuditLog` row with `entityId = ticket-<timestamp>` and, on DB failure, returns a fabricated success object with random `TKT-…` id (`src/app/api/employee/support-ticket/route.ts`). | Introduce a real `Ticket` + `TicketEvent` model OR re-point the UI to the escalation system and delete the fake route. Until then, every ticket metric/SLA promise is fiction. |
| 2 | **CRITICAL** | `/api/social/reply` does not call any provider — it flips status and returns `'Reply sent (official API)'` (`src/app/api/social/reply/route.ts`). | Call the platform's real send endpoint or return honest `CONFIGURATION REQUIRED`/`FAILED`. |
| 3 | **HIGH** | Marketing SPA view files hard-coded MOCK arrays still ship: `ConversationAssignmentView`, `CampaignBuilderCalendarView`, `CrmSeoGrowthDashboard`, `CrmSeoContentWorkflow`, `CrmSeoPolicyWatcher`, `StudentCompare` (verify each before enabling). `MarketingDashboardView` fetches `/api/marketing/dashboard` (good). | Convert mock views to live APIs or hide/remove. |
| 4 | **HIGH** | Facebook OAuth: env keys documented, exchange never implemented for hub/UCC; `SOCIAL_OAUTH_PROVIDERS` excludes facebook entirely. | Implement + live-verify, or remove facebook keys from setup docs. |
| 5 | **HIGH** | OCR is a stub (`/api/crm/ucc/ocr/process` — "creates field stubs"). No engine wired. | Integrate Google Vision/Textract or mark NOT IMPLEMENTED in UI. |
| 6 | **HIGH** | Token expiry: no job scans `tokenExpiresAt`; no reconnect flow. | Add cron + reconnect button on account cards. |
| 7 | **MEDIUM** | Dual number-assignment sources: `WhatsAppOfficialNumber` vs `EmployeeCommunicationProfile.whatsappNumberId` — not transactionally linked, can disagree. | FK + migration or single source of truth. |
| 8 | **MEDIUM** | Alerting on SLA/document-scan failures: cron `sla-monitoring` runs every minute; delivery unverified (no provider configured here) — failures must page someone. | Verify recipients + runbooks in production. |
| 9 | **MEDIUM** | Email outbox has exactly two writers (marketing + manual) — registration/student-lifecycle emails are not wired; only SMTP path verified by tests with mocks. | Wire canonical student lifecycle events into queue (with suppression + consent). |
| 10 | **MEDIUM** | Two parallel email stacks (`email-service.ts` vs `email-marketing/*`) — unclear precedence; capabilities diverge (unsubscribe/suppression only in marketing stack). | Consolidate; single sender policy documented. |
| 11 | **MEDIUM** | Encryption key rotation/re-keying for stored provider tokens (`ENCRYPTION_KEY`) is undocumented in-code — losing the key orphans all stored tokens. | Document rotation + backup policy. |
| 12 | **LOW** | `nexabroad-dashboard.tsx` (mock) ships in `src/components` unreferenced. | Remove. |
| 13 | **LOW** | `.env.example` is 500+ lines of curated placeholders — operators can mis-paste secrets into committed files; documented risk only. | Keep example keys obviously fake (they are). |
| 14 | **LOW** | No health endpoint proves end-to-end connectivity; `/admin/integration-health` shows wiring, not green-light. | Add post-deploy smoke job that asserts SMTP 250, People API 200, Meta webhook verify round-trip. |
| 15 | **LOW** | 148 skipped tests (mostly DB-gated) — gate is honest but they are not executed anywhere in CI here. | Run against CI MySQL service when available. |

## 5. Escalation number — administrator decision (resolved 2026-11-16)

> **RESOLVED 2026-11-16** — the authorised administrator confirmed **01805020101** as the emergency escalation number (consistent with `.env.example` `ALO_COO_WHATSAPP_NUMBER`, urgent routing, the COO "24/7" number record and the public wa.me CTA used on country pages). `01805030101` remains unreferenced in the codebase.
>
> Still outstanding: (a) the name/role/department of the employee assigned to 01805020101, and (b) an executed, recorded test delivery with an authorized test recipient. Neither can be performed from the audit environment (no database, no provider connectivity); both belong to the production runbook in §10.

## 6. Part 12 — Final feature-by-feature status report

Statuses are evidence-based as of 2026-11-16 on this branch. "Configuration" = required production inputs missing. "Not verified" = code paths exist and look correct, untested live.

| # | Feature | Frontend | Backend | DB | External service | Configuration | Test result | Status | Remaining work |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | CRM leads & contacts | /crm/leads, /crm/contacts | /api/crm/leads, /api/crm/contacts* | MarketingLead, ContactPhone, WhatsAppContact | — | none | unit tests pass (mocked) | PARTIAL (unverified live) | run against production DB |
| 2 | Student management & counselor 360 | /counselor/students/[id], /crm/students | /api/counselor/students/*, student APIs | Student, StudentIdSequence | — | none | unit tests pass | PARTIAL | DB verification |
| 3 | Employee portal shell/auth | /employee/* (30+ pages), /employee/login | /api/employee/*, portal-auth | Employee, User | — | production DB + seed | not run live | CONFIGURATION REQUIRED | deploy + seed |
| 4 | Employee "official accounts" page | /employee/my-accounts | employee comm-profile | EmployeeCommunicationProfile, SocialAccountOwnership | Meta/Google/LinkedIn/etc. | Meta app + OAuth | page renders (code) | PARTIAL | enable OAuth end-to-end |
| 5 | Employee WhatsApp assignment & verify | /admin/whatsapp-numbers | /api/whatsapp/numbers | WhatsAppOfficialNumber, WhatsAppNumberAssignmentAudit | Meta WABA | WHATSAPP_* | unit tests pass | CONFIGURATION REQUIRED | Meta credentials + verify |
| 6 | WhatsApp inbound (webhook) | — /crm/whatsapp | /api/whatsapp/webhook | WhatsAppMessageArchive, WebhookEvent | Meta WABA | WHATSAPP_VERIFY_TOKEN, APP_SECRET | HMAC verified in tests | CONFIGURATION REQUIRED | live webhook round-trip |
| 7 | WhatsApp outbound | — | /api/whatsapp/send | WhatsAppMessageStatus | Meta WABA | WHATSAPP_ACCESS_TOKEN | unit tests pass | CONFIGURATION REQUIRED | live send + delivery receipt |
| 8 | WhatsApp follow-ups | /admin/whatsapp-followup | /api/whatsapp/followup/* | WhatsAppFollowUpSchedule/Template | Meta WABA | templates approved by Meta | unit tests pass | CONFIGURATION REQUIRED | template submission + live run |
| 9 | Central email outbox | /admin/marketing-automation | /api/cron/email-outbox, /api/email/* | OfficialEmail, EmailOutboxItem, EmailEvent, EmailSuppression | SMTP | SMTP_* + flag | tests with mocked transport | CONFIGURATION REQUIRED | live server + flag on |
| 10 | Email registration/application/partner/employee lifecycle mail | (missing wire) | — | EmailOutboxItem | SMTP | — | none | NOT IMPLEMENTED | wire canonical events |
| 11 | Email reply capture | — | — | EmailSync (no writer) | IMAP/POP3 | — | none | NOT IMPLEMENTED | build IMAP/POP3 ingester |
| 12 | SPF/DKIM/DMARC | docs only | — | — | DNS | zone access | not inspected | NOT VERIFIED | zone review + tools run |
| 13 | Google Contacts import | /admin/google-contacts, /admin/google-stack | /api/google/contacts/{status,sync} | WhatsAppContact(source), ImportBatch, ContactMatchReview | Google People API | GOOGLE_CONTACTS_* | unit tests + policy | CONFIGURATION REQUIRED | creds + dry-run + apply |
| 14 | Instagram OAuth + reply | /admin/integration-center, /employee/my-accounts | /api/social/instagram/* | SocialIntegration, SocialConnectedAccount | Meta/Instagram Graph | INSTAGRAM_APP_* | not run live | CONFIGURATION REQUIRED | app review + connect + send test |
| 15 | LinkedIn OAuth | same | /api/social/linkedin/* | same | LinkedIn Marketing API | LINKEDIN_CLIENT_* | not run live | CONFIGURATION REQUIRED | app + live test |
| 16 | YouTube OAuth | same | /api/social/youtube/* | same | YouTube Data API | YOUTUBE_* / GOOGLE_CLIENT_* | not run live | CONFIGURATION REQUIRED | consent screen approval |
| 17 | Facebook Page OAuth/Pages API | — | — | — | Meta | — | none | NOT IMPLEMENTED | implement + review (or document limitation) |
| 18 | Social inbox ingestion | /employee/social-media, /crm/communications | /api/social/inbox | SocialInbox, SocialInboxMessage | Meta/YT | webhook subscription | code present | CONFIGURATION REQUIRED | register page webhooks |
| 19 | Social replies | reply buttons | /api/social/reply | SocialInboxMessage | Meta | — | **defect found** | FAILED (as implemented) | defect #2 |
| 20 | Marketing dashboard (live) | MarketingDashboardView | /api/marketing/dashboard | campaigns | — | — | fetches live | PARTIAL | verify on prod |
| 21 | Marketing mock views | several VIEWs (see Gaps #3) | — | — | — | — | none | MOCK | defect #3 |
| 22 | AI assistant (UCC) | /crm/ai-command-center, ucc ai-assistant | /api/crm/ucc/ai-assistant | Ucc* | Gemini/OpenAI/local | provider key | policy tests | CONFIGURATION REQUIRED | key + live scenarios A–F |
| 23 | AI intent/sentiment/lead scoring | — | /api/whatsapp/ai-intent | AiIntentLog, AiReplyLog | (local) | none | unit tests pass | PASS (code) / UNVERIFIED (live) | live calibration |
| 24 | AI WhatsApp conversation engine | (embedded) | ai-whatsapp-engine + webhook handler | WhatsAppMessageArchive, UccConversation | Meta | WHATSAPP_* | tests with fakes | PARTIAL | live round-trip |
| 25 | OCR / document extraction | OCR tables auto-populated | /api/crm/ucc/ocr/process | AlemOcrJob? (see schema) | Google Vision/Textract | VISION keys | stub — field stubs only | MOCK | wire engine; FAIL-CLOSED docs |
| 26 | AI form prefill/approval | form-fill panels | /api/crm/ucc/form-fill/* | FormFillSuggestion | — | none | review-gated | PARTIAL | staffed UAT |
| 27 | Document upload/storage | student portal, auto-upload routes | 6 upload routes | StudentDocument, PortalStudentDocument | local private store | storage path | signature + size tests | PARTIAL | live ClamAV + UAT |
| 28 | Malware scanning | (status surfaces) | malware-scan lib + ClamAV | — | ClamAV optional | CLAMAV_HOST | builtin sigs tested | PARTIAL | configure clamd |
| 29 | Document review (approve/reject) | student-360, /application-documents | [id]/approve|reject|request-again | ApplicationDocument?/StudentDocument | — | DB roles | audited code, untested live | PARTIAL | staffed UAT |
| 30 | Document access control | — | authorizeStaffDocumentRead + private store | DocumentAudit | — | none | unit tests | PASS (code) / UNVERIFIED | prod review |
| 31 | Ticketing / SLA | none for tickets | /api/employee/support-ticket (fake), /api/communications/escalations (real events) | (EscalationEvent) | — | — | fake route found | NOT IMPLEMENTED (design: use escalations) | defect #1 |
| 32 | Escalation events + agents | /crm/escalations? (check), ucc | /api/communications/escalations | EscalationEvent, CommunicationEscalation | — | none | RBAC tested | PARTIAL | SLA + notification UAT |
| 33 | Emergency escalation number | docs/.env.example | routes reference 01805020101 | WhatsAppOfficialNumber COO row | Meta | number confirmed 2026-11-16 (01805020101); delivery untested | none | **CONFIGURATION REQUIRED (test delivery pending in production)** | production delivery test + assignee name |
| 34 | Student Portal auth + dashboard | /student/*, /student-portal | /api/student-portal/{dashboard,messages} | PortalStudentProfile | — | seed/DB | untested | CONFIGURATION REQUIRED | deploy + UAT |
| 35 | Student Portal documents workflow | /student/documents | /api/student-portal/documents/* | PortalStudentDocument | private store | storage path | untested | PARTIAL | UAT + scan |
| 36 | Automatic form processing (full loop) | (ucc) | prefill + approve chain | FormFillSuggestion | — | OCR key | partial | PARTIAL | UAT + no university submission (by design) |
| 37 | Automation schedules & crons (17) | /admin/agent-center | cron routes, `vercel.json` | AgentSchedule, AgentRun | — | CRON_SECRET + provider | policy check passed | CONFIGURATION REQUIRED | live cron + verify |
| 38 | Integration settings / health | /admin/integration-center, integration-health, integration-wizard | /api/crm/ucc/integrations, google status | SocialIntegration, WhatsAppOfficialNumber | all of the above | the §3.0 table | renders honestly | PARTIAL | credentials (see §3.1) |
| 39 | Permissions & RBAC | permission-matrix, role-permissions | withAuth/staffGuard, DataScope | UserPermissionOverride, Role tables | — | DB policies | enforced in code; DB routes untested live | PARTIAL | prod penetration review |
| 40 | Audit logging | /admin/audit-logs | logAuditAction everywhere | PortalAuditLog, AloAuditLog | — | — | present everywhere | PASS (code) / UNVERIFIED (retention) | prod audit |
| 41 | Secret handling / encryption at rest | — | token-encryption lib | SocialConnectedAccount.encryptedToken | — | ENCRYPTION_KEY | code reviewed | PARTIAL (rotation gap) | defect #11 |

**Bottom line.** The CRM's *code* is broad, cohesive and well-tested at unit level. Almost nothing has been proven against real databases or real providers in this environment — and several features (tickets, OCR, reply-sending, Facebook OAuth, reply-capture email, lifecycle emails) do not exist or are stubs. Nothing here meets a production go-live bar until the §3.0 credentials table is provisioned, the Part 10 tests A–F are executed with authorized accounts, and defects #1 and #2 are fixed.

## 7. Release sequence (mandatory)
1. **Fix defects #1 and #2** (fake tickets, fake reply-sent).
2. Provision credentials (§3.0) in a staging environment (never production first).
3. Apply the outstanding migrations — **approved by the administrator 2026-11-16** (`20261117000000_contact_phones_merge_history`); production execution requires a verified backup first (see §10).
4. Run end-to-end: Part 10 tests A–F + Google sync dry-run + SMTP live test + Meta webhook test + ClamAV sample scan + one AI scenario battery.
5. Escalation number **confirmed 2026-11-16 (01805020101)**; execute + document test delivery in production.
6. Re-run offline gates (tsc, vitest, build, secret scan) after any code change; run migration-backlog check; production release gate sign-off.
7. Go-live only after the above; then repeat the integration health check 24h later.

## 8. Audit scope limitations (full disclosure)
- No database was reachable (P1001); no provider endpoint was reachable; no credential was provisioned. Every live-test row above is therefore `CONFIGURATION REQUIRED`, `NOT CONNECTED`, `NOT VERIFIED` or `BLOCKED` rather than PASS.
- Sources: repository source tree, Prisma schema (633 models), 362 test files, docs/, `vercel.json`, prior contact-registry Phase-3 outputs on this branch. No external system was accessed. No data was sent anywhere. No student or employee was contacted.
- Files audited ≈ 1,120 API routes, 499 pages, 30 component directories; verification depth varied by module (deep on WhatsApp/documents/email/integrations; survey-level on marketing SEO views and partner flows).
- The 40 uncommitted Phase-3 files in the working tree are contact-registry implementation, not audit artifacts; they are unaffected by this report except that re-running the full offline gates is mandatory after any change.

## 9. Administrator decisions recorded 2026-11-16

| # | Item | Answer |
| --- | --- | --- |
| 1 | Escalation number (§5) | **01805020101 confirmed.** Assigned employee/department not yet provided; required before a production delivery test can be accepted as complete. |
| 2 | Migration `20261117000000_contact_phones_merge_history` | **Approved** (with the precondition of a verified production backup captured before applying). Not applied — no production database is reachable from this environment; see §10. |
| 3 | Outbound email (`EMAIL_SENDING_ENABLED=true` + scheduled outbox cron) | **Approved** for staged enablement — after DNS verification (SPF/DKIM/DMARC) and a single successful test send to an authorised inbox; may not be enabled before those gates pass; failures must revert the flag. **Not executed** — see §10. |
| 4 | Part 10 live tests A–F | **Production-first provisioning approved** — i.e., credentials are to be provisioned in the server/production environment by the operator, then the A–F tests executed there with authorized test assets. **Not executed from this environment** (no provider connectivity; no message was sent to anyone). |
| 5 | Production releases / deployments | **Not approved** — nothing on this branch has been pushed, merged or deployed; push/PR remains unauthorized per the standing rule. |

## 10. Production execution runbook (approved 2026-11-16 — execute with production access, not from this audit environment)

Prerequisites: written sign-off recorded (this section), maintenance window, named operator.
1. **Backup**: take a full dump of the production database (the repo backup script refuses to run without config and never prints credentials). Verify restoration on a scratch instance if at all possible. Record the backup id.
2. **Migration**: `npx prisma migrate deploy` (migration `20261117000000_contact_phones_merge_history`). Confirm zero non-additive operations (`prisma migrate status`); the migration is additive-only (ContactPhone, ContactMergeHistory). Verify row counts pre/post.
3. **Integration health**: open `/admin/integration-health` and `/admin/google-contacts`; record verdicts.
4. **Google Contacts**: dry-run sync first; inspect the dry-run diff; only then apply. Verify one People API call returns 200 (`verdict: PASS`) before any scheduled run.
5. **Email**: verify SPF/DKIM/DMARC for the sending domain (zone inspection or `dig TXT` from an environment with DNS access); set `EMAIL_SENDING_ENABLED=true` only afterwards; schedule `/api/cron/email-outbox` every 5 min with `CRON_SECRET` (see §3.0); send **one** test message to an authorised inbox; confirm delivery + `EmailEvent` row; verify unsubscribe link + suppression behaviour; keep the flag off if anything fails.
6. **WhatsApp**: configure env (§3.0); webhook `GET` verify-token round-trip; send HMAC-signed test payload; run `/admin/whatsapp-numbers` → verify_connection on **01805020100** and **01805020101**; record provider verdicts before claiming anything connected. Test sends go to test numbers only.
7. **Escalation test**: execute the delivery test on 01805020101 using an authorized test recipient; record timestamp, recipient, delivery verdict, and the name/role/department of the assignee; attach to the production release gate.
8. **Part 10 A–F**: execute in this order with authorized test assets only (A Employee WhatsApp → B Student WhatsApp → C Employee Social → D Student Document → E Central Email → F AI Escalation → ticket). None of these may use real students or employees without written authorization listing the accounts.
9. **Release gate**: all execution evidence filed with `/admin/audit-logs`; production release gate sign-off; rollback plan (flag off, migration rollback documented) before go-live.
10. **Post-release**: 24h + 7d integration-health re-checks.

> **From this audit environment, none of §10 steps 1–10 have been executed.** Anyone claiming otherwise is misrepresenting this report. Statuses in Part 12 remain CONFIGURATION REQUIRED until real production evidence exists and is attached here.

---
*End of report. Prepared 2026-11-16. This document intentionally contains no secret values, no private student data, and no credentials.*
