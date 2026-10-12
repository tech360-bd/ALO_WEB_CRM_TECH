# Supplied-reference audit and implementation — 2026-10-10

## Completion status: partial, not production-complete

Every URL in the current supplied list is accounted for below. Two websites
were read beyond their homepages; 25 unique GitHub targets were inventoried,
22 accessible and three blocked by HTTP 403. `Ai-Markting-crm` occurs twice and
both occurrences share the same blocked result. This is **not an exhaustive
source review of all files**, and is not a claim of feature parity with 25
independent applications. The pinned evidence contains 128 distinct selected
source/document/license reads across the accessible repositories. Recursive
tree coverage is discovery, not implementation or operational verification.

Earlier, broader occurrence lists are preserved in
`link-completion-matrix-2026-09-27.md` and
`supplied-link-followup-2026-10-09.md`; they are not silently replaced by this
current-list report. Repeated links are not omitted from their original matrix.

## What changed in ALO

1. **Working visual campaign composer**, reachable from the main marketing
   hub's Brand Assets & Post Creator and `/admin/marketing-automation`.
   Four editable platform sizes, SVG/real canvas PNG/copy-brief downloads,
   safe HTTPS destinations, escaped SVG text, independent IDs and permanent
   draft watermark. No automatic approval/send/schedule/publish.
2. **Removed simulated brand-screen analytics/approvals and generated contact
   claims**. Main screen now loads the actual authenticated asset inventory.
   Shared brand-kit loader validates settings and leaves missing phone,
   WhatsApp, address, website and logo empty rather than inventing them.
3. **Diagram correctness**: corrected rounded connector bend geometry;
   unique per-instance arrow/title/description IDs; valid SVG height;
   largest-stage proportional funnel edge widths without fake minimums,
   zero/invalid/empty handling, signed growth/drop-off and accessible counts.
   Removed unverified free-consultation/free-retake claims from eligibility diagram.
4. **Kanban correctness**: registered empty-column drop targets, real pointer
   drag, accessible stage-select alternative, callback-success-only changes,
   failure feedback, blocked/unavailable editing, unknown-stage visibility,
   guarded local storage. Added reachable **read-only application board** and
   functional View dialog to CRM Application Tracking using its live API rows.
   No mutation callback is connected there: stage API authorization/transition
   semantics must be audited first. Saved views are browser-local, not shared.
5. **Real httpSMS/Domovina transport**: correct send endpoint/header/body,
   acknowledged IDs only, pre-send durable intent, OTP redaction, request
   timeout/redirect rejection, rejected vs unknown outcomes, no automatic paid
   retry. Provider correlation fields and additive MySQL migration supplied.
6. **Authenticated outbound lifecycle receipts**: HS256 Bearer JWT with
   mandatory audience/issuer/account/time validation, bounded body, matched
   account/sender/recipient/message ID, redacted metadata, transaction/event-ID
   dedupe and conditional lifecycle updates. Unsupported inbound/heartbeat/call
   events explicitly rejected. No body-HMAC claim or missing-auth demo bypass.
7. **Distinct cloud/local creative protocols**: separate RunningHub task/output
   adapter; configured ComfyUI graph/bindings and real descriptors; upload and
   HTTP/acknowledgment failures are not swallowed. Registered video generation
   remains unavailable until the real ALO output-storage worker exists.
8. **Native honesty**: no fake Linphone registration, call ID/ringing/LIME,
   Electron paid-SMS IPC or ipftrace network measurements. Explicit unavailable
   contracts and input validation replace simulation.
9. **Prerequisites and merge defects**: repaired malformed npm lockfile,
   restored existing AuditLog↔User relation, repaired broken university-listing
   merge fragments and duplicate redirect definitions, runtime-only Node
   SQLite loading and credential-safe Prisma logging. Downloaded reference
   trees are excluded from application ESLint, as well as from Git.

## Per-link source and implementation disposition

Pinned commits, exact paths, hashes and access errors:
[`supplied-reference-source-evidence-2026-10-10.json`](supplied-reference-source-evidence-2026-10-10.json).
Names below identify current-list entries, not imported dependencies.

| # | Supplied link | What was actually inspected | ALO mapping, implemented corrections and remaining limits |
|---|---|---|---|
| 1 | https://edufy.com.bd | Entire fetched homepage and `/features` (both chunks); institution tabs, modules, forms, fee/SMS/guardian flows | ALO has admissions, student/employee records, appointments/attendance/finance/RBAC screens. Original ALO button, process/journey/funnel/kit patterns retained and improved. School exams/GPA, Hifz/library/biometrics/payment claims are not verified ALO integrations; full module parity is **open**, not presumed from similarly named routes. |
| 2 | https://softifybd.com | Entire fetched homepage plus `/managerialcrm/` and `/talkify/`; process, subscription, renewal, IVR/communication sections | ALO process/control diagrams, marketing composer, CRM/invoice/support and communication boundaries mapped. Subscription/churn, provider IVR/recording, gateway logos and vendor uptime/security claims are not tested APIs. No Softify/Edufy source or trademark assets copied. |
| 3 | https://github.com/melgarafael/DeskcommCRM.git | README/architecture, lead types, actual KanbanBoard/Card source | Real Kanban droppable targets and pointer drag fixed in ALO, keyboard-safe stage selector and persistence-failure boundary. CRM application board made reachable. No WAHA/multi-tenant/event-worker parity claim. |
| 4 | https://github.com/Django-CRM/Django-CRM.git | Architecture, Lead model, lead list/conversion and Kanban views | Source shows scoped lists, transactional conversion/locks, irreversible stages and WIP controls. ALO board does **not** route conversion through a generic drag callback. Existing application API is not yet proven equivalently tenant-scoped; connected board stays read-only. WIP/conversion parity remains open. |
| 5 | https://github.com/Odoo-mobile/crm.git | CRMLeads, CRMOpportunities and conversion form XML | Mobile list/search/stage/bottom-sheet/conversion semantics inspected. ALO table/board/View actions use its own web components; no Android/Odoo bridge shipped. Published licensing not established (no root license detected), so no source copied. |
| 6 | https://github.com/thu-ml/CRM.git | README, inference, train, pipelines | **Convolutional Reconstruction Model**, not customer relationship management. CUDA/nvdiffrast mesh inference/export requires GPU tooling and model weights. Not represented as an ALO CRM module; optional 3D creative integration remains uninstalled. |
| 7 | https://github.com/dennisivy/crash-course-CRM.git | Django models/views and dashboard template | Customer/order cards, View/Create/Update/Cancel button pattern inspected. Original ALO button system reused; application View dialog works. Tutorial includes placeholder customer-create link, not a production integration contract. |
| 8 | https://github.com/oroinc/crm-application.git | README, composer.json and LICENSE | Distribution imports Oro core rather than containing full business UI. PHP/Symfony, OAuth2 and CRM packages identified; OSL-3.0 license verified from actual files (metadata said NOASSERTION). No wholesale incompatible runtime imported. |
| 9 | https://github.com/trycompai/crm.git | Contact facts/service, activity composer, README | Contacts use ownership, normalized email, evidence/fact decisions and agent events; activity composer uses pending/error states and task due dates. ALO draft-only review boundary and actionable feedback retained; AI enrichment/agent queues not presumed implemented. Full parity remains open. |
| 10 | https://github.com/frappe/crm.git | Contact API, Lead DocType, actual KanbanView and README | Board/funnel/UI contract improvements implemented independently. Lead status/source/owner/SLA and sales-hierarchy concepts mapped to ALO CRM. Shared/pinned server views, SLA/WIP guarantees and Frappe telephony parity remain unverified. AGPL code not embedded. |
| 11 | https://github.com/ChurchCRM/CRM.git | Volunteer editor/UI/model, README and actual marketing-visual pipeline document | Church family/giving/volunteer scope distinguished from ALO admissions. Applied visual-pipeline lesson: separate synthetic harness, real downloads, multi-viewport captures, inspect output rather than merely green tests. No church demographic/giving data imported. |
| 12 | https://github.com/crmeb/CRMEB.git | Store invoice UI and invoice service, customer middleware/UI, README | Ecommerce invoice issuance/state/filter patterns inspected. ALO finance/invoice screens are existing mappings, **not** evidence of Chinese invoice API/storefront/coupon/group-buy parity. No vendor-minified code imported or executed. |
| 13 | https://github.com/idurar/idurar-erp-crm.git | Invoice model/form, customer config, feature doc and README | Item/quantity/price/currency/payment/approval state patterns mapped to existing ALO invoice/accounting views. No source copied (AGPL); full money precision, receipts/mail/PDF parity requires separate finance verification. |
| 14 | https://github.com/oroinc/crm.git | Contact entity and bundles, LICENSE/README | Rich contact/address/organization/activity model examined. OSL-3.0 verified; original ALO contact/timeline/RBAC mapping remains canonical. No Oro package execution or operational parity claim. |
| 15 | https://github.com/fatfreecrm/fat_free_crm.git | Opportunity model/index view, helper source and MIT license | Owner/assignee/campaign, stages, weighted amount, tags, permissions and editable actions inspected. ALO board unknown-stage visibility and success/failure behavior corrected. Weighted forecasting and full Rails opportunity parity remain unverified. |
| 16 | https://github.com/engralaminn-collab/alo-education-uk-final.git | GitHub metadata request only | **BLOCKED HTTP 403 — contents not reviewed.** Requires GitHub App repository access or source archive. No comparison/feature-complete claim. |
| 17 | https://github.com/engralaminn-collab/ukvi-ai-markting_n8n.git | GitHub metadata request only | **BLOCKED HTTP 403 — contents not reviewed.** n8n provider boundary is not proof of this repository's workflows. |
| 18 | https://github.com/engralaminn-collab/Ai-Markting-crm.git | GitHub metadata request only | **BLOCKED HTTP 403 — contents not reviewed.** This is the first supplied occurrence. |
| 19 | https://github.com/engralaminn-collab/Ai-Markting-crm.git | Same inaccessible repository, second supplied occurrence retained | **BLOCKED HTTP 403**; duplicate URL shares access evidence, is not silently treated as reviewed. |
| 20 | https://github.com/domovinatv/sms.domovina.ai.git | Fork README, Bun webhook entry and Hono app | Correct httpSMS fork transport implemented; missing-auth/manual-curl and debug/default secret precedents **not** copied. Reverse OTP production worker/persistence and Android SIM gateway are not installed/tested in ALO. |
| 21 | https://github.com/NdoleStudio/httpsms.git | Send/webhook handlers, listener, pinned signing service, individual lifecycle event payload definitions | Correct authenticated send and JWT outbound-receipt implementation/tests. No inbound, heartbeat, missed-call or deleted-account lifecycle claim. Provider delivery, replay/transaction/migration on real MySQL remain untested. AGPL upstream was not embedded. |
| 22 | https://github.com/NdoleStudio/httpsms-node.git | Actual Message service/models and readme | Explicit ALO httpSMS facade uses `x-api-key`, E.164 `from/to`, `content`, nested message ID; no JWT-as-send-token assumption. SDK not installed merely to claim integration. |
| 23 | https://github.com/HM-RunningHub/ComfyUI_RH_APICall.git | Actual execute node, image/audio/video uploaders and README | Separate RunningHub create/output adapter with workflow/node mapping, actual task IDs/HTTPS outputs and queued/running responses. Local ComfyUI no longer conflated with cloud endpoints. Cloud upload/media binding, storage, credentials and real workflows remain required; license not established, source not copied. |
| 24 | https://github.com/BelledonneCommunications/linphone-iphone.git | README, ContactsManager/EditContactController and CallView | Native iOS SDK/CallKit/PushKit/permissions/runtime identified. Web helper now honestly unavailable and never declares LIME encryption from a boolean. Native app/bridge/interoperability/device tests remain open; GPL source not embedded. |
| 25 | https://github.com/0perationPrivacy/VoIP.git | Actual call controller/routes, contact model and README | Telnyx/Twilio account ownership, SIP credentials, histories and webhook-signature pathways examined. Existing ALO 3CX is separate; no false browser SIP encryption claim. These providers require their own verified adapters, credentials and webhooks. |
| 26 | https://github.com/YutaroHayakawa/ipftrace2.git | README, internals, JSON-output C and license | Linux BTF/BPF kernel-function packet tracer—not network-hop measurement. ALO helper validates IP/port and reports absent privileged collector; no shell from CRM input, fake hops or latency. Collector/privileged sidecar remains uninstalled. |
| 27 | https://github.com/developerspace-samples/VoIP-Call-Sample.git | Actual Android CallConnectionService, CallUtils/lists and README | CometChat/Android ConnectionService binding identified, not a native SIP browser implementation. No Android runtime or call permission/native push configuration installed. Explicit web unavailable boundary. |
| 28 | https://github.com/sibnerian/electron-promise-ipc.git | Actual renderer/mainProcess/index and README | Promise IPC API distinguished from native calling. ALO no longer installs unauthenticated direct paid-SMS handlers. Sender-frame/origin/session-validated main/preload bridge remains separate future work. |

## Tests and build evidence

Latest executed results (supersede older baseline counts):

- `npm ci --ignore-scripts --no-audit --no-fund`: **PASS**, repaired lockfile,
  1,232 packages at that run; jose subsequently added as direct dependency.
- Prisma `generate --no-engine` with dummy CLI engine paths: **PASS**, actual
  MySQL-schema client, **532 models**. Not a native MySQL runtime.
- Full `npm test`: **130 files passed / 5 skipped; 1,425 tests passed / 63 skipped**.
  Skipped suites require `TEST_DATABASE_URL`. Isolated mocks do not certify providers.
- Full `npm run lint`: **PASS**; latest minor test/harness follow-ups also checked
  through focused ESLint. Ignored reference sources are not ALO lint inputs.
- `npm run typecheck:references`: **PASS**, genuine generated Prisma types plus
  selected changed entrypoints and transitive imports. This is not full typecheck.
- Full typecheck: default and 3 GiB Node heaps **OOM (exit 134)**; a 4 GiB run
  exceeded the tool wait and saturated the 4 GiB sandbox, then was explicitly
  stopped. No clean full TypeScript claim.
- `npm run build`: **FAIL before Next compilation**, Prisma schema-engine HTTPS
  download to `binaries.prisma.sh` disconnected. No deployment/build pass claim.
- Browser component harness: **PASS**, actual SVG/PNG downloads, invalid URL
  disables export, callback-success/failure stage selector, pointer drag to empty
  registered column, 390/768/1440 widths without document overflow, unique IDs,
  no uncaught page errors. JSON: `supplied-reference-ui-verification-2026-10-10.json`.
  Mobile/desktop captures and exported PNG visually inspected. This is synthetic
  components, **not Next.js authenticated application E2E**.
- `git diff --check`: **PASS** at verification runs.

Tests added: `supplied-provider-contracts` (34), `httpsms-receipts` (9),
`campaign-creative` (11), `brand-kit-safety` (2); existing OTP tests now assert
sensitive-message flag. Browser harness/scripts committed; generated captures,
provider source copies and Chromium binaries remain ignored.

## Explicit remaining work — no “100% complete” claim

1. Review three inaccessible repositories after repository access is granted.
2. Exhaustive upstream source/feature comparison is not complete. Review
   remaining in-scope behavior for all platforms; existing route/model names
   do not establish runtime correctness. Earlier broad link lists also have
   their own not-verified/native/provider entries.
3. Apply/test MySQL migration and durable receipt/replay/status contracts on a
   real test database; execute all 63 skipped tests and authenticated Next.js E2E.
4. Resolve native Prisma engine availability and run clean full typecheck/build
   on a sufficiently provisioned Node 22 host. No deployment was performed.
5. Configure/test real httpSMS/Domovina phone/gateway/account/webhook; add
   polling/operator reconciliation for unknown/unpersisted IDs and exhausted
   webhook retries. Inbound/reverse-OTP/heartbeat/call events not implemented.
6. Configure/test approved RunningHub and local ComfyUI workflows, cloud uploads,
   authenticated ALO storage-transfer worker and provider-output lifecycle.
7. Build/test separate Linphone/mobile/Electron/privileged diagnostic bridges
   only with verified native permissions, sender/session guards and licenses.
8. Audit ALO application/lead mutation APIs for proper tenant ownership,
   compare-and-set transitions, irreversible conversion and atomic audit before
   enabling connected board stage edits. Some legacy edit/assign/convert actions
   remain disabled rather than silently succeeding.
9. Broader marketing hub still contains other demo-heavy screens (e.g. the
   legacy `LeadPipelineView`); replacing the brand screen does not certify all
   hub screens. Review/replace them with scoped real APIs in further work.
10. Shared/public views, WIP limits, forecasts, subscription/churn, finance money
    correctness, school-specific academic modules and the full vendor-platform
    feature set remain unverified/outside this implementation slice. Do not
    silently promote them to “implemented” from discovery matches.

Configuration and reproduction:
[`docs/SUPPLIED-REFERENCE-INTEGRATIONS.md`](../docs/SUPPLIED-REFERENCE-INTEGRATIONS.md).
