# Unified Communication & Social Command Center — Build Status

**Spec:** §122–§177 of the ALO master build specification (Unified Communication & Social Command Center, mandatory module).
**Branch:** `arena/57b0809e-alo-web-crm-tech`
**Status token:** `ALO_COMMUNICATION_COMMAND_CENTER_INCOMPLETE`

This document is the honest self-audit for the module. A section is only marked
**DELIVERED** when the code exists *and* something measurable was executed against
it in this environment. Logic-level guarantees are verified by
`scripts/communications-policy-check.ts` (119 assertions, 0 failures,
`npx tsx scripts/communications-policy-check.ts`). Anything that needs MySQL, a
seeded database, provider credentials or a logged-in browser session is marked
**UNVERIFIED** or **NOT DELIVERED** — never inferred from the fact that the code
compiles.

---

## 1. Environment limits (why several items cannot be closed here)

| Limit | Consequence |
| --- | --- |
| No MySQL server / no seeded database in the sandbox | Every DB-backed endpoint (inbox, timeline, call logs, escalations, provider status) returns 500/401 and cannot be exercised end-to-end. |
| No Prisma query engine for the target platform at build time | The app boots and routes compile, but no query can execute. |
| No provider credentials (Meta, SMTP, httpSMS, 3CX, Chatwoot, LinkedIn) | Live send/receive/webhook round-trips are impossible; the channel registry deliberately reports these channels as `CONFIGURATION REQUIRED`. |
| No authenticated session (login needs the database) | CRM/partner/student screens redirect to `/login`; UI rendering is typechecked and lint-clean but not visually verified. |
| No headless browser | No screenshot/interaction evidence. |

Probes that *did* run against the dev server: `/crm/communications/inbox` → 307
(auth redirect), `/api/crm/communications/inbox` → 401, `/api/crm/communications/providers`
→ 401, `/crm/communications/settings` → 307. These prove the module graph resolves
and the routes are wired; they do not prove behaviour.

## 2. What this session delivered

| Commit | Scope |
| --- | --- |
| `cecee580` | Policy cores (SLA, contact identity, webhook idempotency, document lifecycle, AI safety, channel registry) + real fixes in the WhatsApp webhook and `/api/documents` PATCH. |
| `d6f7743b` | Canonical SLA policy wired into the live inbox (§145 columns, §148 states, §158 critical-resolution guard, N+1 removal) + the reusable acceptance script. |
| `f927b445` | `LEAD-2026-XXXXX` references, §126 dedup gate in the webhook, §159 provider-status API + settings screen. |
| `cdf80489` | §131–§133 document classification / application matching / outbound metadata policy. |
| `a501273c` | §174 locked official templates (payment instruction, success, review request + lock guard). |

### Real defects found in existing code and fixed

1. **Non-idempotent webhooks (§171).** `src/app/api/whatsapp/webhook/route.ts` built
   event ids from `Date.now()` in three places, so every Meta retry created a new
   row. Now derived from provider message/event ids, with a deterministic
   payload-hash fallback, plus duplicate and out-of-order guards.
2. **"Accepted" treated as delivery (§173).** Status callbacks were recorded
   verbatim, including values that are not delivery states (Meta `warning`).
   Now mapped through a status vocabulary where `accepted ≠ delivered`, `read`
   never regresses to `sent`, and `failed` always wins.
3. **A verified document could still be rejected (§137).** `/api/documents` PATCH
   required a reason but ignored the lifecycle: an APPROVED document could be
   rejected. Now the transition policy runs before the write (409 with a code).
4. **Racy, spec-violating lead references (§125).** Four count-based generators
   (`ALO-L-10001`) raced under concurrency and did not match the mandated
   `LEAD-2026-XXXXX`; migrated the WhatsApp webhook, public inquiry form, homepage
   lead form and Facebook webhook onto one collision-safe allocator.
5. **Duplicated SLA maths (§147–§149).** The inbox carried its own 0.67/0.93
   thresholds and a state vocabulary that did not match the spec. It now resolves
   every clock through the same policy table, and the badge no longer keeps a
   second copy.
6. **A false-pass risk in my own verification.** The acceptance script briefly
   printed its summary before the async allocator checks settled, reporting a pass
   count that excluded them. Fixed — the summary now runs after they settle.

## 3. Section-by-section status

Legend: **DELIVERED** (built + logic-verified) · **PARTIAL** (built, key part unverified) · **NOT DELIVERED** · **BLOCKED** (needs the environment).

| § | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 122 | Employee Social & Communication Hub, channel set by role/permission/account | PARTIAL | `EmployeeOmnichannelInbox`, `DashboardCommunicationWidget` exist; `channelsForRole` + `/api/crm/communications/providers` now compute the role-scoped channel list. Not rendered for a logged-in employee (no session). |
| 123 | Partner workspace limited to assigned students; never sees internal notes/AI risk/ALO-only data | PARTIAL | `authorizeConversationAccess` (tested: cross-partner denied), `communicationScope` used by every comms route. Needs a two-partner live test. |
| 124 | WhatsApp first-class | PARTIAL | 13 `/api/whatsapp/*` routes, signature verification, media ingestion, assignment, SLA, templates, AI draft all present and now idempotent. No live Meta round-trip possible. |
| 125 | Normalize → search → open existing; else `LEAD-2026-XXXXX`, never a Student | DELIVERED (logic) | `contact-identity.ts` + `lead-reference.ts`; webhook keeps `isNewStudent = false`. DB path unverified. |
| 126 | Dedup before creating; POSSIBLE EXISTING CONTACT → Open Existing / Merge Request / Create New (authorized role only); never silently merge | PARTIAL | Lookup + `resolveContactIdentity` + notice + `requiresAuthorizedRole` delivered and wired into the WhatsApp path. **Merge Request for two student records has no endpoint** (see §4). |
| 127 | Conversation memory panel (name, ID, phone, counselor, applications, stage, missing docs, latest offer, payment, interview, last communication, SLA, next best action) | **NOT DELIVERED** | No assembled payload or panel exists. The pieces are queryable but nothing builds the view. |
| 128 | Message → CRM event + AI intent classification + next best action | PARTIAL | `ai-intent` route, `TimelineEvent`, `CommunicationThread.intent`; `proposeNextAction` added. Classifier quality untested. |
| 129 | AI grounded in verified data; never invents; high-risk cites a source or escalates | DELIVERED (logic) | `assessMessageRisk` + `findForbiddenClaims` (tested: payment/visa/legal/financial-evidence/guarantee detection). Grounding corpus itself not re-verified. |
| 130 | Four automation modes; high-risk = draft → human → send; "AI GENERATED DRAFT" label | DELIVERED (logic) | `decideDraftMode` (tested: high-risk forces human review even under automation; forbidden claim blocks auto-send; automation without an approved template falls back). Per-thread mode storage not built. |
| 131 | Outbound file metadata recorded | PARTIAL | `validateOutboundFileMetadata` enforces the 11 spec fields; `whatsapp-cloud-api.ts` sends documents. Send path not updated to enforce it yet. |
| 132 | Received-document pipeline | PARTIAL | Ingestion libs + `classifyDocument` exist. Checklist update / counselor notification ordering not re-verified end-to-end. |
| 133 | Attach to the right Application → Requirement; else DOCUMENT MATCH REVIEW REQUIRED | DELIVERED (logic) | `decideDocumentMatch` (tested: multiple active applications, weak identity, unmatched sender and inactive application all refuse to guess). Not yet called from the ingestion route. |
| 134 | No physical deletion of official documents | DELIVERED | No DELETE endpoints exist anywhere (verified by grep, re-confirmed); `canDeleteDocument()` denies every actor including admin; `docs` route stores states only. |
| 135 | REJECT ≠ DELETE; rejected stays in history; student can re-upload | DELIVERED | `evaluateDocumentTransition` (tested) + version models (`StudentDocument.version`, `DocumentVersion`). |
| 136 | One requirement = one slot with versions | DELIVERED (logic) | `buildDocumentSlot` (tested: v1 rejected, v2 rejected, v3 verified all preserved, active = v3). |
| 137 | Reject only from STUDENT_SUBMITTED/UNDER_REVIEW; VERIFIED needs supersede + reason | DELIVERED | Enforced in policy **and** in `/api/documents` PATCH (409 + code). Supersede UI not built. |
| 138 | Rejection always has a reason (predefined + optional comment) | DELIVERED | 9 reason codes; comment stored with the code; student-visible notice via `rejectionNotice`. |
| 139 | Rejection delivered to the student through approved channels | PARTIAL | `TPL-DOC-REJECTED` exists; not verified that the rejection write triggers the send. |
| 140–144 | Call center: initiate, identify, link, timestamps, outcome; recording only where legal | PARTIAL | `call-logs` API, `CallLogModal`, `threecx-integration`, `calls/outcomes`; `resolveInboundCaller` (tested: unknown caller is never auto-assigned as a Student). Recording consent/retention not verified. |
| 145 | Unified inbox with the 12 named columns | DELIVERED | Inbox table now shows Priority, SLA, Channel, Student, Application, Sender/Message, Assigned Counselor, Intent, Status, Last Response, Deadline + actions. Rendering unverified without a session. |
| 146 | One timeline across channels, original channel retained | PARTIAL | `CommunicationMessage.channel` is per message and the timeline merges by `createdAt`. The §146 claim is plausible but not exercised. |
| 147 | SLA configurable by channel/priority/student type/stage/intent/hours/holidays | DELIVERED (logic) | `resolveSlaPolicy` with overrides; intent/stage floors can only raise priority (tested). No admin UI to edit the table. |
| 148 | RESPONSE DUE IN / OVERDUE BY with NORMAL/WARNING/OVERDUE/CRITICAL, not colour alone | DELIVERED | `evaluateSlaClock` + badge (tested: exact strings, four states, four distinct icons, aria label). |
| 149 | Configurable warning ladder | DELIVERED (logic) | `slaWarningLadder` (tested: 4 rungs in order); thresholds live in the policy object. No UI. |
| 150–153 | Response tracking + FRT + compliance + overdue/escalation counts | PARTIAL | Inbox returns first-response time, FRT, breach and exclusion flags; `sla/dashboard` route exists. Aggregates not exercised. |
| 154 | Five-incident warning with justification required; no blank justifications | DELIVERED (logic) | `validateJustification` (tested: empty, one-word, bad category all rejected) + pre-existing `sla-incidents.ts`. |
| 155–157 | Missed-response detection, repeated-failure counter with valid exclusions, manager review audited | PARTIAL | `sla-engine`, `sla-incidents`, escalations API present; exclusions now flow into `countsAsBreach`. Not exercised. |
| 158 | AI must not silently resolve critical cases; routing to finance/visa officer | DELIVERED (logic) | `assessMessageRisk` routing (tested) + inbox refuses to resolve an SLA-breached thread without a recorded note. |
| 159 | Social account ownership registry + backend-only token storage | PARTIAL | `/api/crm/communications/providers` returns status per channel with **names** of missing variables only; `social-platforms-registry.ts` holds the registry. Ownership records per account not modelled. |
| 160–161 | Per-employee permission scoping; official vs personal separation; audit of outgoing official comms | PARTIAL | Channel scoping by role enforced; official-only policy stated and returns in the API; per-employee social permissions and the outgoing audit trail need verification. |
| 162–163 | `/crm/social` per-channel dashboard (Unread/Assigned/Pending/SLA/Resolved/Escalated) | PARTIAL | `/crm/social` renders `SocialMediaManagementHub`; social dashboard shows CONFIGURATION REQUIRED banners. Counts not verified. |
| 164–165 | Communication search, AI conversation summary | PARTIAL | Inbox search + `ai-command` exist; not verified. |
| 166 | Backend permission enforced BEFORE retrieval; AI context protection | PARTIAL | `authorizeConversationAccess` exists and is tested, but **is not yet called from the AI retrieval path** — see §4. |
| 167–169 | Escalation events in timeline; tasks with full field set; resolution states incl. Follow-up Required | PARTIAL | `communicationTask` model, `create_task` inbox action, `communications/escalations` routes exist. Reminder-on-follow-up not verified. |
| 170 | No message loss: RECEIVED before AI processing | PARTIAL | Webhook archives the message before AI generation (code order confirmed by reading). Not exercised. |
| 171–172 | Idempotent webhook/message processing via provider ids; webhook security validation | DELIVERED | Deterministic ids + batch dedupe + signature verify (`x-hub-signature-256` with `safeEqual`). 10 assertions. |
| 173 | SENT/DELIVERED/READ/FAILED tracking; API accepted ≠ delivered | DELIVERED | `mapProviderStatus` / `shouldApplyStatus` (tested) wired into the webhook. |
| 174 | Locked official template engine (8 named templates) | DELIVERED (logic) | `OFFICIAL_TEMPLATE_MAP`, three missing templates added, `validateTemplateEdit` (tested). Seeded `isLocked` flag now set; DB seed not executed. |
| 175 | AI safety: never auto-send fabricated university/payment/visa content or promises | DELIVERED (logic) | `findForbiddenClaims` (tested: guaranteed visa/admission/interview, invented fee, invented deadline). |
| 176 | 27-step final acceptance test | **NOT DELIVERED** | 119 DB-free assertions ran; the 27-step live test needs the environment (§1). |
| 177 | Every communication attaches to Student/Application/Counselor/Timeline/Task/SLA/Audit | PARTIAL | Fields exist on `CommunicationMessage`/`CommunicationThread`; full attachment not verified. |

## 4. Failed / open items (the deliverable list)

1. **§127 conversation memory panel — not delivered.** No payload or UI assembles name/ID/phone/counselor/applications/stage/missing documents/latest offer/payment/interview/last communication/SLA/next best action.
2. **§126 merge request for duplicate students — no endpoint.** Only university-data duplicates have a merge route (`/api/admin/university-data/duplicates/merge`). Duplicate *student* merge requests have nowhere to go.
3. **§166 permission check not wired into AI retrieval.** `authorizeConversationAccess` is implemented and tested but the AI context path does not yet call it, so "permission enforced BEFORE retrieval" is unproven at the call site.
4. **§133 classification/match not called from the ingestion route.** The decision functions exist and are tested; `whatsapp-media-ingestion` still attaches without consulting them.
5. **§131 outbound metadata not enforced on the send path.** The validator exists; `whatsapp-cloud-api` does not call it.
6. **§147/§149 policy has no admin UI.** The override table is a code-level parameter, not a settings screen — "configurable" is only half true for an operator.
7. **§159 account ownership registry incomplete.** Channel status is real; per-account ownership records (which ALO account, which owner, connected since) are not modelled.
8. **Legacy lead references remain** in `src/app/api/leads/route.ts`, `src/lib/crm/registration-lead.ts`, `src/lib/facebook-lead-sync.ts`, `src/lib/referral-engine.ts` (`ALO-L-<uuid|digits>`). They do not match `LEAD-2026-XXXXX`; they were left because those flows are not the inbound-contact path the spec names, and changing them touches unrelated consumers.
9. **All DB-backed behaviour is UNVERIFIED** — inbox queries, lead creation, document PATCH, webhook persistence, timeline assembly, dashboard aggregates, escalation counters. No MySQL in the sandbox.
10. **No live provider round-trip** for WhatsApp/Meta/SMS/email/3CX — impossible without credentials; the honest state is `CONFIGURATION REQUIRED`.
11. **UI not visually verified** — no authenticated session, no headless browser. Typechecked (`tsc`) and lint-clean only.
12. **§176's 27-step acceptance test has not been executed**; the module cannot be declared READY on this evidence.

## 5. What would close the module

1. Run the app against a seeded MySQL and execute §176's 27 steps, recording each result.
2. Build §127's memory payload + panel and the §126 student merge-request workflow.
3. Call `authorizeConversationAccess` from the AI retrieval path and `decideDocumentMatch` from the ingestion route; enforce `validateOutboundFileMetadata` on send.
4. Add the SLA settings screen for the override table.
5. Connect real provider credentials (or accept `CONFIGURATION REQUIRED` as the permanent displayed state) and re-run the webhook idempotency test against live Meta retries.
