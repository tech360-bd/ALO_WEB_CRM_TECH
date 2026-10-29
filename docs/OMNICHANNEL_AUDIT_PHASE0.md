# Phase 0 — Existing Repository Audit (Omnichannel / Student Identity / Documents / AI)

**Date:** 2026-10-29 · **Branch:** `arena/629c03a0-alo-web-crm-tech` · **HEAD at audit:** `fb8613d4`
**Scope:** the 25 components named in the implementation brief, assessed against the working tree.
**Rule applied:** a component is only marked PASS when there is code **and** a caller **and** a test/verification path. Everything else is PARTIAL, MISSING, DUPLICATED or NOT VERIFIABLE.

This audit exists because the brief requires inspection before implementation. It is
deliberately blunt: several subsystems are far more complete than expected, and a few
requirements are actively contradicted by the current code.

---

## 1. Headline findings

| # | Finding | Impact on the brief |
| --- | --- | --- |
| A | **A Student is never created from an inbound channel.** `shouldAutoCreateStudent()` in `src/lib/communications/contact-identity.ts:208` returns a hard-coded `false`, commented *"Spec §125: never auto-create a Student from a WhatsApp number alone."* First contact produces a **Lead** only. | Directly contradicts §4.1/§4.2 ("no registration form required… create a new Student ID for a clearly new contact"). This is the single largest gap. |
| B | **Two identity policies exist; the good one is dead code.** `src/lib/identity/match-policy.ts` implements the required tiering (exact ID → verified email → verified phone → linked channel, ambiguity → review) and the brief's exact semantics — but has **zero callers**. The live webhook uses the older `contact-identity.ts`. | §4.3 is implemented twice, inconsistently. Any fix must consolidate, not add a third. |
| C | **No durable channel-identity binding table.** Channel↔person links are loose `studentId String @default("")` columns on `WhatsAppContact` (and equivalents). Nothing prevents the same Meta sender from being bound to two students, and unlink is not modelled. | §4.3 "link/unlink authorised channel identities, maintain merge history" is MISSING. |
| D | **No ALO Hosting AI integration exists.** `grep` for `alolabs`, `ALO_HOSTING`, `hosting.alolabs` across `src/` returns **zero** matches (the only repo mention is prose in `FINAL_IMPLEMENTATION_REPORT.md`). Documents are stored via local `storagePath`/`fileUrl` fields. | §11 is BLOCKED at the integration boundary; the storage *abstraction* is also absent. |
| E | **Two student identity tables** (`Student`, `PortalStudentProfile`), both with `studentId @unique`, both holding the same people. | Auto-provisioning (§4.2) would make this worse unless the write path is explicit about which table it targets. Already flagged as unresolved in `docs/STUDENT_IDENTITY_AUDIT.md`. |
| F | **The `exact_student_id` tier could never match a real Student ID.** `match-policy.ts:40` required a five-digit tail (`/^AE-\d{4}\d{5}$/`), but `formatIdentifier()` pads AE identifiers to **four** digits (`student-id.ts:50`), so the live allocator emits `AE-20260001`. Its 12 tests passed only because they used `AE-202600001`, a format the allocator never produces. | A "green tests, dead feature" defect of exactly the kind this brief warns about. **FIXED** in this phase (see §6). |

## 2. Component status matrix

| # | Component | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Student models & Student ID generation | **PASS** (with caveat A) | `src/lib/identity/student-id.ts` — atomic `LAST_INSERT_ID` sequence, Dhaka business year, per-year restart, fail-closed on overflow, skip-existing loop. Migration `20261010120000_student_id_sequence`. Tests: `tests/unit/student-id-allocation.test.ts` (8). Caveat: `generateStudentId()` in `whatsapp-webhook-handler.ts:117` has **no callers**; allocator is used by portal register + counselling form. |
| 2 | Lead / inquiry models | **PASS** | `Lead`, `MarketingLead`, `LeadForm`, `PartnerLead`; webhook creates leads under a `__pending__` claim + CAS (`route.ts:547-597`). |
| 3 | Contact models | **PASS** | `WhatsAppContact` (normalized phone + email unique, opt-out fields), `ContactMatchReview`, `CommunicationConsent`. |
| 4 | WhatsApp integration | **PARTIAL** | `src/app/api/whatsapp/webhook/route.ts` (1288 lines): HMAC-SHA256 signature verify (`:36-48`, rejects unsigned at `:126`), status-event dedupe by derived event id (`:153`), delivery-status persistence, media/document ingest. Sending via `whatsapp-cloud-api.ts`. **Gap:** no 24-hour-window enforcement helper found on the outbound path. |
| 5 | Facebook / Instagram | **PARTIAL** | `src/app/api/facebook/webhook/route.ts` (382 lines) with signature checks; `SocialWebhookEvent` stores payload+status. Instagram is handled through the same Meta surface. **Gap:** no `Messenger` conversation model distinct from generic messaging; no per-Page registry. |
| 6 | SMS | **PARTIAL** | `src/app/api/integrations/httpsms/webhook/route.ts` + `src/app/api/integrations/3cx/webhooks/route.ts`. Provider coverage is single-vendor (HTTP SMS). |
| 7 | Webhook handlers (all) | **PASS** | 8 route groups: whatsapp, facebook, httpsms, 3cx, marketing, communications, crm/ucc, webhooks(+deliveries/replay). Replay endpoint exists: `src/app/api/webhooks/deliveries/[id]/replay/route.ts`. |
| 8 | Message & conversation models | **PASS** | `CommunicationMessage` (channel/direction/provider ids/status), `InboundMessage`, `UccConversation`, `UccMessage`, `WhatsAppMessageArchive`, `AloMessage`. |
| 9 | Counselor assignment | **PARTIAL** | Assignment exists inline in the webhook/lead flows (`counselorId`, `assignedToId`) plus `src/lib/crm/verified-registration-assignment.ts` with audit rows. **Gap:** no rule engine (workload/shift/language/priority) and no dedicated assignment-history table beyond audit logs. |
| 10 | Employee roles & permissions | **PASS** | `auth-middleware`, `access-control`, `data-scope`, DB-resolved role checks (the verified-catalogue publish path re-resolves the actor from the DB rather than trusting the token). |
| 11 | Marketing automation | **PARTIAL** | `MarketingCampaign`, `CommunicationConsent`, `consent-management.ts`, `broadcast-engine.ts`, `template-engine.ts`. **Gap:** no frequency-cap/quiet-hours enforcement found in one place; campaign idempotency not proven. |
| 12 | AI agents & routing | **PASS** | `src/lib/ai-gateway.ts`: local-first routing, **blocks external providers for private data** (`:50`), allowlisted provider/model fallback (`:57-61`), schema validation before prompt disclosure. `ai-safety.ts`, `agent-orchestrator.ts`, `communication/ai-safety.ts`. |
| 13 | Document storage | **PARTIAL** | `StudentDocument` (hash, version, `previousVersionId`, reviewer fields), `EmployeeDocumentVersion`, `AiGeneratedDocument`. **Gap:** storage is local paths; no storage adapter, no quota, no signed-URL abstraction (blocks §11). |
| 14 | Document verification | **PASS** | Status machine + `DocumentAudit`, `DocumentSecurityIncident`, `document-rejection.ts`, `document-access.ts`, `ucc/document-access.ts`. AI is not permitted to set verified status. |
| 15 | Student dashboard | **PASS (untouched)** | Existing portals preserved; no changes proposed in this phase. |
| 16 | Partner dashboard | **PASS (untouched)** | As above. |
| 17 | Admin dashboard | **PARTIAL** | Many module routes exist (`src/app/api/crm/communications/inbox`, `/crm/inbox`, `/counselor/inbox`, `/marketing/social-inbox`). **Gap:** several overlapping inbox endpoints — duplication risk (§19: no duplicate navigation). |
| 18 | Notifications | **PASS** | `Notification`, `PortalNotification`, `StudentNotification`. |
| 19 | Audit logs | **PASS** | `AloAuditLog`, `CrmAuditLog`, `MarketingAuditLog`, `PortalAuditLog`, `EmployeeAuditLog`, `IntegrationAuditLog`, `DocumentAudit`, `WhatsAppNumberAssignmentAudit`. |
| 20 | Background workers | **PASS** | `src/app/api/cron/*` incl. `webhook-dispatch`, durable `MonitoringJob` with CAS lock, `WhatsAppRetryQueue`. |
| 21 | Migrations | **PASS** | 46 additive migrations; `mysql-migration-compat` guard test (7) enforces TEXT defaults and rejects destructive statements. |
| 22 | CI | **PASS** | `.github/workflows/{ci,codeql,deploy-production,deploy-recovery,health-monitor}.yml`. Not verified green from this sandbox (no Actions API run inspected). |
| 23 | Deployment | **NOT VERIFIABLE** | `deploy-production.yml` exists; no environment access, no live deployment evidence. `FINAL_IMPLEMENTATION_REPORT.md` records `hosting.alolabs.net` / `panel.alolabs.net` as **unreachable** from prior sessions. |
| 24 | ALO Hosting AI | **MISSING** | Finding D. No code, no client, no credentials, no API contract. |
| 25 | ALO Labs AI | **PARTIAL** | Gateway/allowlist/local-first is real (see 12). Integration with a distinct "ALO Labs AI" control plane is **not verified**; `ai-providers/unorouter` is the external path. |

**Duplicate implementations found (must be consolidated, not extended):**

- Identity: `identity/match-policy.ts` vs `communications/contact-identity.ts`.
- Inbox: `api/crm/communications/inbox`, `api/crm/inbox`, `api/counselor/inbox`, `api/inbox`, `api/social/inbox`, `api/counselor/social-inbox`, `api/marketing/social-inbox`, `api/crm/communications/social-inbox`.
- Webhook event storage: `SocialWebhookEvent`, `UccWebhookEvent`, `WebhookEvent`, plus `webhook-event-claim.ts`.

## 3. What this phase changes

Nothing. This phase is inspection only, as the brief requires ("START BY INSPECTING").

## 4. Recommended sequence (small, reviewable slices)

1. **Identity consolidation + auto-provisioning** (§4) — highest value, lowest blast radius.
   Compose the dead `match-policy.ts` into a single decision function, add a durable
   `StudentChannelIdentity` binding (unique on `(channel, channelAccountId, externalUserId)`),
   and add an explicit, auditable provisioning policy. Ship the engine + tests; wiring it into
   the WhatsApp webhook is a separate commit because it changes production behaviour for every
   inbound message.
2. **Storage adapter + Hosting AI client** (§10/§11) — define the interface now with a local
   adapter that satisfies it, so the Hosting AI implementation is a drop-in. Blocked on
   credentials/endpoint for anything beyond that.
3. **Outbound WhatsApp window enforcement** (§5.2) and **campaign idempotency** (§13).
4. **Inbox consolidation** (§7/§19) — pick one endpoint, deprecate the rest behind redirects.
5. **Dual student tables** (finding E) — needs a product decision + migration; do not touch
   during the identity slice.

## 5. Explicit blockers

| Blocker | Consequence |
| --- | --- |
| `hosting.alolabs.net` not reachable, no API contract or service credentials | §11 cannot be implemented against the real control plane. A storage adapter can be built and tested, but "integration functional" cannot be claimed. |
| No production MySQL / Meta app credentials / SMS provider keys in this environment | Live webhook delivery, template sends and provider round-trips cannot be verified. Code paths are testable; integration status is not claimable. |
| `Student` vs `PortalStudentProfile` split unresolved | Auto-provisioning must target `Student` explicitly and must not attempt a merge. |

## 6. Phase 0 → Phase 1 slice implemented

Delivered in this phase (all additive; no existing route, model or behaviour changed):

| Artefact | Purpose |
| --- | --- |
| `src/lib/identity/inbound-provisioning.ts` | The single decision point for inbound identity. **Composes** the previously dead `match-policy.ts` instead of adding a third policy, and adds the missing piece: an explicit, auditable decision about whether a first contact may receive a Student ID. Pure — no Prisma, no clock, no network. |
| `StudentChannelIdentity` model + migration `20261029160000_student_channel_identity` | Durable channel↔student binding, unique on `(channel, channelAccountId, externalUserId)`, with `active`/`unlinkedBy`/`unlinkReason` so unlink and merge history survive. Additive-only: 1 `CREATE TABLE`, 0 `ALTER`, 0 `DROP` (verified by the repo guard, 7/7). |
| `tests/unit/inbound-identity-provisioning.test.ts` | 21 tests over the full decision table: binding precedence, replay determinism, account/sender scoping, verified-email and verified-phone matching, BD local-number normalisation, unverified evidence rejected, name never used, same-tier ambiguity → review, conflicting bindings, unlinked-binding refusal, supplied-unknown-ID stop, auto-create on/off, no-sender-identity refusal. |
| `match-policy.ts` fix + 5 regression tests | Accepts 4-, 5- and 6-digit tails; an unknown-width legacy ID is treated as absent rather than mis-matched. |

### Decision table (enforced in code and tests)

| Order | Condition | Outcome |
| --- | --- | --- |
| 1 | Exactly one **active** channel binding | `LINK_EXISTING` — survives webhook replays, so a duplicate event cannot mint a second student |
| 1b | Two or more active bindings for the same identity | `REVIEW / CONFLICTING_BINDING` |
| 2 | Exact Student ID → verified email → verified phone | `LINK_EXISTING` |
| 2b | More than one candidate at the same tier | `REVIEW / AMBIGUOUS_MATCH` — never auto-resolved, even with provisioning on |
| 3 | Supplied Student ID matching nothing | `REVIEW / SUPPLIED_ID_UNKNOWN` — does **not** fall through to weaker tiers |
| 4a | Identity previously unlinked | `REVIEW / CONFLICTING_BINDING` — prevents silent re-creation of an existing person |
| 4b | No match, `autoCreateStudent` off (default) | `CREATE_LEAD` |
| 4c | No match, `autoCreateStudent` on | `CREATE_STUDENT` |
| 4d | No usable sender identity | `REVIEW` |

### Why the engine is not yet wired into the live webhook

Flipping `shouldAutoCreateStudent()` from a hard-coded `false` changes production
behaviour for **every** inbound WhatsApp/Messenger message and would begin minting
`Student` rows at webhook volume — across two un-unified student tables (finding E),
without a merge path (finding C, now solved) and without the Hosting AI storage
layer. The engine, schema and tests are complete and safe to ship on their own; the
one-line wiring belongs in its own reviewable commit with an explicit product
sign-off on the `autoCreateStudent` default. The exact integration point is
`src/app/api/whatsapp/webhook/route.ts` immediately after `resolveContactIdentity`
(`:444`) and before the lead-creation branch (`:517`).

### Still blocked

Unchanged from §5. Nothing in §11 (Hosting AI) can be claimed until the control
plane is reachable and a service credential exists.
