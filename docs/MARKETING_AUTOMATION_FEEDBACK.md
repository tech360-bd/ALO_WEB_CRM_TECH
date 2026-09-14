# ALO Education — Marketing Automation System — Audit Feedback
**Date:** 2026-09-14 (Asia/Dhaka) | Branch: `arena/01a09c20-alo-education-z-ai` | Scope: Web + CRM existing, do-not-rebuild
** Auditor: Arena AI Agent (read-only inventory + code + schema + routes)**

> This is **feedback after completed dashboard-format work**. No new rebuild was done yet for this spec. The check below is `spec line → evidence file → gap/fix`.

---

## 1) Executive verdict

| Aspect | Verdict |
|---|---|
| **DB schema** | ✅ Rich. `MarketingCampaign/Content/Video/Calendar/Approval/SocialMessage/DMThread/Comment/Lead, BrandAsset, N8nWorkflow, MarketingUserAccess, SocialConnectedAccount, FileMetadata, StoragePool, AuditLog, SlaPolicy/SlaEvent, CommunicationThread/UCC*` all modeled. **BUT IDs inconsistent** (`MarketingLead` vs `Lead` vs `Student` parallel) + orphan/duplicate guards exist only in some routes, not enforced DB-wide. |
| **Marketing Manager dashboard** | ⚠️ Exists as `src/components/alo/views/marketing-dashboard.tsx` + admin `src/app/admin/marketing-automation/page.tsx` with tabs, but **has demo placeholders, missing 8/20 required sections** (official WhatsApp/FB/IG/Messenger inboxes are separate components not wired into single Marketing Manager view; brand asset check not blocking post create). |
| **Social comment→lead** | ⚠️ `MarketingComment` + `MarketingSocialMessage` + `/api/marketing/comments/convert-lead` exists, but **no Meta webhook auto-reply/auto-DM, no keyword engine, no deduplication on phone/email/socialId/phone as per spec**, no `AE-YYYY000001` from same counter as Student. |
| **WhatsApp 24/7** | ⚠️ `src/app/api/whatsapp/webhook` + `ai-whatsapp-engine` + `whatsapp-followup-engine` exist. Office-hours (`Sat-Thu 09:00-18:00, Fri closed`) + `calculateSlaDueAt` exist, but **AI after-hours vs employee office-hours routing is not enforced in one webhook; OTP gate exists conceptually but not wired to masking of application/document/payment/visa before OTP; Bangla/English yes**. |
| **SLA 40 → 20 → 10** | ⚠️ `sla-engine.ts` defines `30/20/10` (spec wants 40/20/10) and escalation logic exists, **but timer uses `isWorkingDay` local time only and is not triggered by cron/worker; dashboard overdue filter not consistently visible**. |
| **Doc upload via WhatsApp** | ⚠️ `/api/marketing/whatsapp-doc-upload` + `/api/whatsapp/document-upload` create `OcrJob/FileMetadata` and attach to Lead, **but detection is param-based (`detectedDocType` from caller) not AI classifier; orphan check exists but StoragePool path + Firestore metadata dual-write is inconsistent; no “ask user to confirm if unclear”**. |
| **AI reply** | ⚠️ `ai-whatsapp-engine` + `/api/whatsapp/ai-reply`, `generateText` with `glm-4-flash`, rule-based Hi/Hello dedup, **but token-cost guard not measured; On/Off per conversation + block/unblock exists in DB (`MarketingUserAccess`, `WhatsAppContact.isOptedOut`) but not exposed as Marketing Manager toggle; voice/image analysis stubs**. |
| **Brand assets** | ⚠️ `BrandAsset` + `brand-assets/route.ts` + `CampaignPost.brandAssetApplied` exist, **but logo “required before post create” is warning only; `#E8501A + white + blue` not enforced in image generation (generation is text-only, no canvas with logo overlay).** |
| **AI post generation** | ⚠️ `CampaignPost` + `marketing-ai.tsx` + `/api/campaigns` + `/api/content-engine` can create `caption/hashtags/cta`, **but no per-platform sizing (FB 1080x1080 / IG 1080x1350 / TikTok 1080x1920 etc.), no video/reel/script generation, no landing link/campaign objective stored on post, schedule is `String` not cron**. |
| **Approval** | ✅ `MarketingApproval` + `/api/marketing/approvals` approve/reject + `createAuditLog` exists. **But 3-limited-user enforcement is `MarketingUserAccess(accessLevel=LIMITED)` — not yet checked on post-create/publish (any marketing can approve). Nothing posting without approval is policy-only, not code gate on publish endpoint.** |
| **n8n** | ⚠️ `N8nWorkflow` model + webhookUrl/secret/triggerType exists, **no webhook manager UI, no ON/OFF per workflow in dashboard, no auto sync stubs actually calling n8n**. |
| **Lead outreach compliance** | ❌ `LeadOutreach` model exists but **no source/consent/opt-in/stop/unsubscribe storage on `MarketingLead` flow, no rate-limit, no Google Maps compliant flag**. |
| **CRM saving rules** | ⚠️ 13-field spec listed; **current `MarketingSocialMessage/Comment/DMThread/WhatsApp` each save subset (channel, messageId, leadId, timeline) but not uniformly `conversationId/socialUserId/partnerId/employeeId/assignedCounselorId/applicationId/AIorHuman/timestamp/status + audit_logs` on every event.** `AuditLog` + `MarketingAuditLog` exist but not written for every message. |
| **RBAC** | ⚠️ `MarketingUserAccess` + `withAuth({requireUserTypes:['MARKETING','MARKETING_MANAGER','SUPER_ADMIN']})` exists on marketing routes, **but other employees bypass via `/api/counselor/whatsapp`, `/api/communications/social-accounts` without checking “only own WhatsApp/assigned conversations”; counselor assigned-only isolation missing on marketing queries.** |
| **Compliance APIs** | ⚠️ WhatsApp Cloud + Graph Facebook installed, but **email/SMS gateway abstracted, webhook verification exists for WhatsApp, not for FB/IG; `SUBSCRIBE` challenge only partially handled; STOP/START studied but unsub not on all channels.** |
| **No duplicate / No orphan** | ⚠️ Dedup by `phone` only in some places, **not by email+socialId+WhatsApp together; `FileMetadata.entityType/entityId` prevents orphan docs, but WhatsApp doc path can still create new Lead per upload without phone-normalization consistency (`normalizeBdPhone` used in webhook, not in doc-upload).** |

**Overall:** *Not live-test ready.* Schema covers ~75% of spec, API/dashboard cover ~55%, enforcement (RBAC/approval/orchestration/SLA cron) covers ~35%. Saying “done” now would fail the 17 final live tests.

---

## 2) Access rules — line-by-line

- **Marketing Manager full company social** — ✅ route guard `MARKETING_MANAGER` exists; **FIX: add explicit `accessLevel=FULL` check + owner check on `SocialConnectedAccount(accountType=OFFICIAL)`; today `SUPER_ADMIN` also full but `ADMIN` too loosely included.**
- **3 approved limited** — ✅ `MarketingUserAccess(status=ACTIVE, accessLevel=LIMITED)` table; **FIX: enforce `permissions JSON` whitelist per request and limit to 3 active (no DB unique on count, can have 10). Add `SELECT COUNT WHERE accessLevel=LIMITED AND status=ACTIVE` guard in `/api/marketing/user-access`. UI to list/revoke exists but not tested.**
- **Super Admin full** — ✅ `withAuth` includes `SUPER_ADMIN` everywhere.
- **Other employees blocked from official FB/IG** — ⚠️ **FAIL today:** `requireUserTypes` blocks, but `employee` can still read `/api/communications/social-accounts` / `/api/crm/social` if they obtain token; need `accountType=OFFICIAL` explicit 403, not just role list.
- **Own WhatsApp/email/SMS + assigned only** — ❌ **FAIL:** `/api/whatsapp/*` verifies phone but not `assignedToId==auth.userId`; must add `where: {assignedToId: auth.userId}` for non-manager.

---

## 3) Marketing Manager dashboard — 20 sections

| Section | Evidence | Gap |
|---|---|---|
| WhatsApp official inbox | `components/communication/WhatsAppCommandCenter.tsx`, `api/whatsapp/webhook` | Not embedded in Manager dashboard tab |
| Facebook inbox | `MarketingSocialMessage(platform=facebook)`, `components/crm/CrmEnglish...` | Exists but not filtered to manager |
| Instagram | same as FB | same |
| Messenger | `DMThread` | same |
| Email/SMS inbox | `OfficialEmail`, `NotificationEngine` | No inbox view, only send |
| Comment automation manager | `MarketingComment` table | No UI manager for auto-reply/DM rule |
| Auto DM manager | `DMThread` | No manager |
| Keyword trigger manager | `src/components/alo/views/marketing-dashboard.tsx` partially | No `Study Abroad / IELTS / Visa / UK / Canada / Australia / Scholarship / Apply` keyword table; `KeywordTrigger` type only in frontend not DB |
| AI reply draft manager | `/api/marketing/social?action=reply-suggest` | Exists, needs queue view |
| Human handoff queue | `needsHumanTakeover` flag + `counselorTask(type=handoff)` | Queue UI missing |
| Lead pipeline | `MarketingLead` | Exists in `crm/leads` but not in manager dashboard pipeline kanban |
| Campaign calendar | `MarketingCalendar` + `campaigns` | Calendar exists but date type string, no drag schedule |
| Post creator | `CampaignPost` | Missing platform sizing + video |
| Image/video/reel creator | `marketing-ai.tsx` | Text only, no canvas/video |
| Brand asset manager | `brand-assets/route.ts` | Yes, but not required-gate |
| Logo upload manager | `BrandAsset(assetType=LOGO)` | Yes, dedup deactivate old |
| Campaign approval | `MarketingApproval` | Yes, approve required |
| Conversation assignment | `CommunicationThread.assignedToId` | Exists, assignment UI in UCC not manager |
| Follow-up automation | `whatsapp-followup-engine` | Schedule exists, OFF/ON not in manager |
| Analytics & reports | `/api/brains/marketing/*` | KPI exists but not manager-specific filter |
| Audit logs | `MarketingAuditLog` | Exists |
| Access control (3 users) | `MarketingUserAccess` | Exists, limit 3 not enforced |

---

## 4) Comment → Lead automation (spec)

Must: **comment auto-reply → instant DM where allowed → keyword trigger → auto collect → timeline → Lead → dedup phone/email/socialId/WhatsApp → Student Profile + `AE-YYYY000001` → assign counselor → task → portal link.**

- Auto-reply: ❌ No Meta `POST /{comment-id}/replies` call in codebase (only local `suggestedReply`).
- DM where allowed: ❌ No `POST /me/messages` for comment author; must respect 24h window — not checked.
- Keywords: ❌ No `KeywordTrigger` DB model (only UI type); triggers like Study Abroad etc. not persisted.
- Dedup: ⚠️ Only `phone contains`, no `email/socialId/WhatsApp` combined unique index; need `MarketingLead @@unique([phone]) + @@index([email]) + @@index([senderId])` and pre-check with `normalizeBdPhone`.
- Student ID: ⚠️ Two generators exist (`webhook/generateStudentId` `AE-YYYY0001` 4-digit + `whatsapp-doc-upload` 6-digit) — **must unify to `AE-YYYY000001` (6-digit) and counter by year via transaction.**
- Counselor assign: ⚠️ `counselorId` nullable — need round-robin by branch + capacity.
- Portal link: ⚠️ `sendPortalLink` Boolean but no `/student/register?leadId=&token=` generation.

**Fix:** promote typed `KeywordTrigger` to DB + add webhook handler for `feed` (comment) + `messages` (DM) that: `normalize → intent → dedup → upsert Lead → Student → Timeline → task → reply/DM (within window) → audit`.

---

## 5) WhatsApp automation (spec)

| Spec | Evidence | Gap |
|---|---|---|
| 24/7 AI, office employee / after-hours AI | `ai-whatsapp-engine`, `OFFICE_HOURS Sat-Thu 09-18 Fri closed` | Routing not branching: should be `if withinOfficeHours && humanAvailable → queue human else AI first response`. |
| Memory by phone+studentId | `whatsapp-followup-engine` uses `normalizedPhone` lookup | ✅ good, but cross-table (Student vs WhatsAppContact) not unified. |
| Existing loads profile/app/docs/visa/counselor/tasks/timeline | `Student` includes profile but webhook does not SELECT application/documents/tasks | ❌ `generateAiReply` receives only `studentName/language/intent` not full context. Must join `AloApplication+StudentDocument+StudentVisaHistory+CounselorTask+Timeline`. |
| New number → Lead+Student+ID+timeline+task | webhook does this inline | ⚠️ Works but creates separate `Student` per message race — needs `upsert` + transaction. |
| OTP before private data | No OTP column | ❌ Need `StudentOtpVerification` + check `message intent ∈ {application,document,payment,visa} → require otpVerifiedAt < 10m` |
| Bangla/English | `detectLanguage` yes | ✅ |
| Human handoff on complex/angry/payment/refusal/complaint/emergency | `detectSentiment isHighRisk/isUrgent` yes | ⚠️ Not wired to `needsHumanTakeover=true + escalate task`. |

---

## 6) SLA

Spec: **40 min counselor → 20 min → Marketing/Branch Manager → 10 min → Super Admin/CEO, all in `audit_logs`, overdue visible.**

- Code: `sla-engine.ts` defaults `COUNSELOR_MINUTES=30` (should 40), `startSlaForThread` + `checkAndEscalateSla` exists, escalation creates `counselorTask(type=sla_escalation)` + toggles `communicationThread.slaStatus`.
- **Gaps:** cron missing (`/api/cron/*` exists but not calling `checkAndEscalateSla`); `AuditLog` write missing on each escalation; frontend overdue badge exists only in `SlaCountdownBadge`, not in Manager dashboard filter `?overdue=true`; timezone uses local server time not Asia/Dhaka fixed.

---

## 7) WhatsApp auto document upload

Spec: detect **14 doc types**, match by **phone → studentId/partnerId/leadId/applicationId**, create Lead+Student if none, secure storage `FileMetadata` + Firestore, **no orphan, no duplicate**, ask confirm if unclear, audit.

- Detect: ❌ `detectedDocType` is input param, no classifier. Need: `mime + filename + ocr rawText → heuristic map passport/certificate/transcript/bank_statement/english_test/visa_file/offer_letter/CAS/COE/I20/payment_receipt/partner_agreement/invoice`.
- Match: ⚠️ `MarketingLead.findFirst(phone contains)` not `normalizedPhone ==`; no `partnerId/applicationId` resolution.
- Storage: ⚠️ Creates `OcrJob` + `OcrFieldExtraction` but not `FileMetadata(storagePool=STUDENT_PARTNER, visibility=INTERNAL_ONLY)`; dual save to Firestore not done (only MySQL).
- Ask confirm: ❌ No outbound `“Which document?”` button reply.

---

## 8) AI reply system

Spec: text, broken/multi-message, Hi/Hello/Salam rule (no token), On/Off per user/conversation, block/unblock, human transfer, voice/image, image send, typing/seen, follow-up, summary, scoring, counselor recommendation.

- Text: ✅
- Broken/multi: ⚠️ Single `message` param, no `conversationId` window (needs 2-min buffer).
- Hi/Hello/Salam rule: ✅ partially (rule-based keywords in engine) but not counted vs billable.
- On/Off + block: ⚠️ `WhatsAppContact.isBlocked/isOptedOut` exists, not exposed in Manager dashboard toggle.
- Voice/image analysis: ❌ stub (`mediaId` extracted but not sent to vision/whisper).
- Typing/seen: ✅ `whatsappMessageStatus/readStatus` but outbound `sendTypingIndicator` not called.
- Follow-up/summary/scoring/counselor Rec: ✅ `calculateLeadScore` + `counselorRecommendation` maybe in `brains`.

---

## 9) Brand asset system

Spec: logo once, ask again if missing/deleted before post, colors `#E8501A + white + blue accent`, every image/video uses logo/colors/layout.

- Logo once + deactivate old: ✅ `brand-assets/route.ts` does `updateMany isActive=false` then create.
- Ask if missing: ❌ Check exists in `CampaignPost` create (`logoExists`) but does not block creation — should `return 400 "Upload ALO logo first"`.
- Colors: ❌ No `BrandAsset(assetType=COLORS)` enforcement; need seed `{primary:#E8501A, accent:#0EA5E9, background:#FFFFFF}`.
- Logo on image/video: ❌ Generation is text-only; needs canvas (sharp + compositing) or at least prompt `brandOverlay:true` not rendered.

---

## 10) AI post system — 7 platforms × 9 fields × 10 categories

- Platforms: ⚠️ `platform` column free string, but publish adapters only for FB/IG (`graph.facebook.com`) not LinkedIn/TikTok/YouTube Shorts/WhatsApp Status/Blog.
- Fields: `caption/hashtags/cta` exist; **missing `platformSize` (1080x1080 etc.), `schedule time` (String vs DateTime), `landingLink`, `campaignObjective` in `CampaignPost` (partial); script in `MarketingVideo` not linked to post.**
- Categories: `category` column exists; 10 categories not validated against enum.

---

## 11) Approval system

- AI draft → 3 limited can draft → Manager/Super Admin approve → nothing posts without approval → auto-post → `audit_logs`.
- ✅ Draft + approval + audit exists.
- ⚠️ **Post still publishable via `/api/campaigns?action=publish` without `MarketingApproval(status=approved)` check** — must add gate. Auto-post after approval not triggered (needs queue worker).

---

## 12) n8n automation

- `N8nWorkflow` model exists.
- ❌ No **webhook manager UI** in Manager dashboard; no **Lead→n8n → follow-up/email/SMS** sequence actually calling `webhookUrl`; ON/OFF per workflow not wired to dashboard `PATCH /api/n8n/:id {isActive}`.
- Fix: add `src/app/api/n8n/*` + manager tab `Automation → Workflows` with toggle + secret rotate + `triggerN8n(type, payload)` helper invoked on `Lead created / followUp due / WhatsApp reply / campaign report`.

---

## 13) Lead outreach compliance

- Need `source, consentStatus, channel, outreachHistory` + respect opt-in/unsubscribe/stop/rate-limit/legal source only.
- ❌ `MarketingLead.consent Boolean` only, no `consentStatus: OPT_IN/OPT_OUT/PENDING`, no `source: WEBSITE_FORM|FACEBOOK|INSTAGRAM|GOOGLE_MAPS_COMPLIANT|REFERRAL`, no `LeadOutreach` history write per send.

---

## 14) CRM saving rules — 13 fields

Spec requires on **every** message: `channel,messageId,conversationId,socialUserId/phone/email,leadId,studentId,partnerId,employeeId,assignedCounselorId,applicationId,AI/human,message/media,timestamp,status,audit`.

- Today: `MarketingSocialMessage/MarketingComment/MarketingDMThread/WhatsApp*` each persist 6-8 fields; `partnerId/employeeId/assignedCounselorId/applicationId` often null; `audit_logs` only on approve/convert, not on each inbound/outbound.
- **Fix:** add `CrmTimeline` single append with all 13 + `AuditLog(action=TIMELINE_APPEND)` transaction on every inbound/outbound.

---

## 15) RBAC — summary

- `MarketingUserAccess` + `withAuth(MARKETING_MANAGER)` is correct direction.
- **Must close:** counselor can query `marketingLead.findMany` without `counselorId==self`; other employees can `POST /api/communications/social-accounts` to steal Official account. Add `accountType==OFFICIAL → require FULL or SUPER_ADMIN` middleware.

---

## 16) Compliance

- Official APIs: WhatsApp Cloud ✅, Graph FB/IG ⚠️ (token/webhook), Email/SMS via provider ❌ abstract.
- Unsub/stop/block: ✅ `WhatsAppContact.isOptedOut` + `handleStopStartCommand` but not for email/SMS/FB.
- Rate limits: ❌ No `rateLimiter` (needs per-channel `leaky bucket`).
- Cost: ⚠️ `generateText` always calls LLM; Hi/Hello rule exists but not enforced before LLM call.

---

## 17) Final live tests — predicted result today

| Test | Result now |
|---|---|
| Manager login | ✅ (via `MARKETING_MANAGER`) |
| 3 limited users access limited tools | ⚠️ Count not capped, permissions not whitelisted |
| Other employees blocked on official social | ❌ would still `200` on some routes |
| FB/IG comment auto reply + DM | ❌ no Meta reply |
| DM → CRM lead | ⚠️ manual convert only |
| WhatsApp new number → Lead+Student ID | ✅ one path works, race exists |
| Existing number append timeline | ✅ webhook does, but dedup partial |
| Doc upload correct ID | ⚠️ by phone only |
| AI after-hours + memory | ⚠️ memory partial |
| OTP before private | ❌ |
| Human handoff task | ⚠️ flag not task |
| SLA 40→20→10 | ❌ timings wrong, no cron |
| Logo + colors on posts | ⚠️ text only |
| Missing logo asks upload | ⚠️ non-blocking |
| AI caption/image/video drafts | ⚠️ text only |
| Approval before posting | ❌ gate missing |
| Approved post publishes | ❌ auto-post missing |
| Unified timeline | ⚠️ multiple tables |
| No duplicate / orphan | ❌ phone-only dedup, doc orphan possible |
| No unauthorized | ❌ see RBAC |
| No console/API errors | ⚠️ some routes swallow error with 200 |

---

## 18) What NOT to do

- Do not create second marketing DB, second WhatsApp service, or second UCC inbox. Reuse `Marketing*` models, `WhatsApp*`, `FileMetadata/StoragePool`, `CommunicationThread`, `MarketingAuditLog`.
- Do not claim API is free. Respect Meta 24h window + WhatsApp template pricing.

---

## 19) Production fix plan (no new infra) — 6 increments

**P0 — RBAC + dedup + Student ID unification (1 day, unblocks everything)**
- Enforce `MarketingUserAccess` limit 3 + permission whitelist on every `/api/marketing/*`; block Official account fetch for non-FULL.
- Unify `normalizeBdPhone` + single `generateStudentId AE-YYYY000001 (6-digit)` transaction + unique index on `Lead(normalizedPhone)`.
- Fix SLA constants `40/20/10` + add `asia-dhaka` cron `*/5` to call `checkAndEscalateSla` + write `MarketingAuditLog`.

**P1 — Comment automation → lead (1.5 days)**
- Promote `KeywordTrigger` type to DB table, add admin tab to manager.
- Implement Meta `feed` webhook → `keyword hit → auto-reply (Graph)` + DM (if 24h allowed) → `MarketingLead` → `Student + AE-ID` → `Timeline + Audit` → assign counselor (round-robin) → task → portal link.

**P2 — WhatsApp hardening (1.5 days)**
- Route office vs after-hours in webhook (`isWithinOfficeHours`): human queue vs `generateAiReply` with full context `Student + AloApplication + docs + tasks + timeline` + `otpRequired` mask.
- Wire `needsHumanTakeover` + `counselorTask(type=handoff)` on sentiment/complexity.
- Document classifier (mime+filename+OCR) → `FileMetadata` + `OcrJob` + ask-confirm, fix phone normalization + no-orphan guarantee.

**P3 — Brand + post + approval gate (1 day)**
- Seed brand colors, make logo absence `400` before `CampaignPost` create; render logo/colors via `sharp` composite for image (or prompt `brandOverlay:true` until canvas).
- Add platform sizes + `scheduledAt DateTime` + `campaignObjective/landingLink` to `CampaignPost`; enforce `MarketingApproval(status=approved)` gate on publish + auto-publish worker + audit.

**P4 — n8n + outreach + CRM saving (1 day)**
- Build `Automation → n8n Workflows` manager tab (list/toggle/secret/triggerType) + `triggerN8n` on lead/followup/whatsapp/report.
- Harden `MarketingLead` with `source/consentStatus/channel/outreachHistory` + `LeadOutreach` write per send + STOP/START + rate limiter.

**P5 — Live tests + evidence (0.5 day)**
- Add `tests/e2e/marketing-automation.spec.ts` covering 17 tests above; run locally (`MOCK_WHATSAPP=1, MOCK_META=1`) + production smoke with real tokens sandboxed; record evidence in `docs/INTEGRATION-EVIDENCE-*.md`.

**If anything is missing/broken/demo after P5, fix in same branch before marking live.**

---

## 20) Sign-off gate

Do not mark done until: **RBAC 403 proven, 3-user cap proven, comment→DM→Lead→AE-ID→timeline→task→portal link proven, WhatsApp OTP proven, SLA 40→20→10 cron proves, doc no-orphan proven, logo-gate proven, approval gate proven, n8n ON/OFF proven, no console/API errors, audit entry for every message.**

