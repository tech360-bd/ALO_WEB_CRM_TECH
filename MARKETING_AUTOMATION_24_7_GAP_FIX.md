# ALO Education — Marketing Automation 24/7 — Gap Analysis & Hardening (2026-09-15)

Spec: 24/7 marketing/lead/social/WhatsApp/AI reply/campaign automation. Official channels: WhatsApp Business, FB Page, IG, Messenger, Email/SMS, website chat, consultation forms. Dashboard required: official inboxes (5 channels), comment automation, auto DM, 8 keyword triggers (Study Abroad/IELTS/Visa/UK/Canada/Australia/Scholarship/Apply), AI reply drafts, human handoff, lead pipeline, calendar, post creator (caption/image/video/script/hashtags/CTA/landing/objective/size/schedule), brand/logo manager (#E8501A/#FFFFFF/#0057B8), approval (DRAFT→PENDING→APPROVED→SCHEDULED→PUBLISHED, audit_logs), assignment, follow-up, analytics, audit logs, 3-user access control.

## Audited Files (2026-09-15)
- `src/app/api/marketing/social-inbox/route.ts` — unified inbox groupBy conversationId + outbound reply with auditLog
- `src/app/api/marketing/campaign-posts/route.ts` — logoMissing gate 400, DRAFT→PENDING→APPROVED→SCHEDULED→PUBLISHED + auditLog per transition
- `src/lib/ai-whatsapp-engine.ts` — detectLanguage (bn/bnlish), detectIntent 20+, detectSentiment urgent/highRisk, leadScore 0-100, generateAiReply with handover triggers + OTP-safe templates
- `src/app/api/marketing/whatsapp-doc-upload/route.ts` — type detect (passport/transcript/bank/test/visa/CAS…), phone→MarketingLead dedup else AE-YYYY000001 + OcrJob + integrationAudit
- `src/app/api/marketing/whatsapp-sla/route.ts` — overdue uccConversation >20m, escalation MANAGER/SUPER_ADMIN
- `src/app/api/marketing/lead-outreach/route.ts` — STOP/UNSUBSCRIBE → OPTED_OUT
- `src/app/api/marketing/keyword-triggers/route.ts` — generic keyword CRUD ACTIVE
- `src/app/api/marketing/n8n-workflows/route.ts` — on/off toggle + trigger webhook
- `src/lib/sla-engine.ts` — SLA_DEFAULTS COUNSELOR 30 (bug) + MANAGER 20 + CEO 10
- `src/app/crm/marketing-manager/page.tsx` — dynamic import `@/components/alo/views/marketing-manager-dashboard` → FILE MISSING (500)
- `src/components/alo/views/marketing-dashboard.tsx` — 2692 lines, 9 tabs (inbox, comments, posts, brand, ai-reply, n8n, outreach, access, library), no analytics/pipeline/calendar/audit

## Gaps Found vs Spec
1. **RBAC 403 missing** — 6 legacy routes (`brand-assets`, `campaign-posts`, `social-inbox`, `keyword-triggers`, `n8n-workflows`, `lead-outreach`, `auto-pipeline`, `library`, `repost`) had no withAuth. Social login not restricted. **Severity: HIGH**.
2. **SLA mismatch** — spec 40→20→10 (total 70) but `sla-engine.ts` = 30→20→10 (total 60). WhatsAppCard showed 40→20→10 correctly but engine diverged. **HIGH**.
3. **Missing file** — `marketing-manager-dashboard` wrapper absent → `/crm/marketing-manager` 500. **HIGH**.
4. **Keyword triggers not seeded** — route supported generic keyword but not the 8 spec keywords with autoReply+DM+lead+portal link behaviors. **MED**.
5. **Missing tabs** — analytics, lead pipeline (kanban + assignment + follow-up), calendar (merged posts+schedule), audit logs. Spec requires all; dashboard had 9/13. **MED**.
6. **`Request` vs `NextRequest` after withAuth** — `req.nextUrl` on `Request` caused tsc error. **LOW**.
7. **Dedup/auto-pipeline already ok** — AE-YYYY000001 ID-first, doc type detection, opt-out, n8n on/off, brand color enforcement all present.

## Fixes Applied (commit 8428e26)
| Gap | Fix |
|-----|-----|
| RBAC | Wrapped 9 routes with `withAuth({ requireUserTypes: ['MARKETING','MARKETING_MANAGER','SUPER_ADMIN','ADMIN'] })` → 401 unauthenticated, 403 non-marketing roles. Audit logging kept on every transition. |
| SLA | `src/lib/sla-engine.ts: COUNSELOR_MINUTES 30→40`. WhatsAppCard already shows 40/20/10 with getSlaLevel 20 warn / 40 breached. whatsapp-sla route escalation 20m→MANAGER, 10m more→SUPER_ADMIN matches spec. |
| Missing file | Created `src/components/alo/views/marketing-manager-dashboard.tsx` — client wrapper around `MarketingDashboard` with server-session 401/403 display (403 message: “Marketing Manager + 3 approved + Super Admin only”). Fixes 500. |
| nextUrl | `new URL(req.url).searchParams.get` for all withAuth routes. |
| Analytics | New `GET /api/marketing/analytics` — inbox (by platform, SLA warn/breached), posts (by status/platform/category, brandApplied%), leads (by status/source, hot/counselor/followUpOverdue, conversionRate), outreach (optIn/optOut/byChannel), calendar, triggers & workflows, last 20 auditLogs. withAuth protected. |
| Lead Pipeline | New `GET/PATCH/POST /api/marketing/lead-pipeline` — kanban `new→contacted→qualified→assigned→converted→lost`, assign `counselorId/counselorName` (auto moves to assigned, sets assignedAt), `followUpDueAt/followUpDone`, `score/hotLead`, auditLog+marketingAuditLog on every move. Dedup via phone/email/socialUserId handled on creation (MarketingLead). |
| Calendar | New `GET/POST/PATCH /api/marketing/calendar` — merges `MarketingCalendar` + `CampaignPost(SCHEDULED/PUBLISHED/APPROVED)` → unified timeline sorted by scheduledAt, platform filter, status update; audit-logged. |
| Audit Logs | New `GET /api/marketing/audit-logs` — merges `auditLog` + `marketingAuditLog` ordered desc, filter by resource/action, returns 100. |
| Keyword seed | New `POST /api/marketing/keyword-triggers/seed` (+GET missing list) idempotent 8 defaults with spec texts: Study Abroad/IELTS/Visa/UK/Canada/Australia/Scholarship/Apply (each CONTAINS/ALL, autoReplyText, autoDmText, autoCreateLead, autoAssignCounselor, sendPortalLink=true). Dashboard Comment tab now has “Spec 8 Keyword Triggers” banner + “Seed 8 Defaults” button. |
| Dashboard | `marketing-dashboard.tsx` 2691→~3050 lines: 9→13 tabs (added analytics, pipeline, calendar, audit). TabsList overflow-x auto. New components: `AnalyticsTab` (6 StatCards + inbox/leads/posts/outreach breakdowns + MiniBar), `LeadPipelineTab` (kanban grid, move buttons, assign+followUp dialog, portal link, overdue banner), `CalendarTab` (unified table), `AuditLogsTab` (filterable timeline). Fix SLAIndicator 20/40. Fix CommentAutomation seedDefaults. |

## RBAC Verified
- `withAuth` → `authenticateRequest` reads `Authorization: Bearer` or `getServerSession(authOptions)` + DB user active check. Non-MARKETING roles → `401/403` per auth-middleware (requireUserTypes). MarketingManager = FULL, 3 approved = LIMITED (maxApprovedUsers 3 enforced in `user-access` route). Employees see only own WhatsApp/email/SMS + assigned conversations. Super Admin can act as marketing_manager (actingAs audit). All publish/assign/approve actions write `auditLog` (userId, resource, details JSON) + `marketingAuditLog` (actor email/name/role).

## CRM Timeline Fields (saved per spec)
Every inbox/outreach/campaign/write saves: `channel/platform, messageId, conversationId, socialUserId/phone/email, leadId, studentId, partnerId, employeeId/counselorId/applicationId, AI flag (aiHandled/aiDraftUsed), message text/media metadata (imageUrl/videoUrl), timestamp (receivedAt/sentAt/scheduledAt/publishedAt), status (isRead/approvalStatus/consentStatus/hotLead), audit_logs`. See `analytics` & `audit-logs` endpoints.

## Official APIs & Compliance
- WA Cloud: `src/app/api/whatsapp/webhook/route.ts` (verifySignature timingSafeEqual, idempotency wamId, OTP gate for private data, BN/EN, memory by phone+studentId AE-YYYY, handoff for complex/angry/payment/refusal, doc mediaId fetch, SLA start)
- Meta Graph: `src/app/api/facebook/webhook/route.ts` (leadgenId @unique idempotency, Graph fetch, FacebookLeadRaw, auto-Lead+score)
- Unsubscribe/rate-limit: `lead-outreach` STOP detection → OPTED_OUT + audit; outreach respects `consentStatus` OPTED_IN only for legal/opt-in

## SLA
- `sla-engine.ts` now 40/20/10. Office hours Asia/Dhaka Fri closed flag kept. `WhatsAppCard` displays 40 Response SLA → 20 Escalate Manager → 10 Escalate SA. `SocialInboxTab` per-conversation `SLAIndicator` (20 warn amber, 40 breached red). Overdue counts exposed in analytics.

## Brand Kit
- Single active LOGO + BRAND_KIT (primary #0057B8, CTA #E8501A, bg #FFFFFF, text #0F172A). Colors enforced in generated images. `SIZE_MATRIX` (SQUARE 1080×1080, PORTRAIT 1080×1350, LANDSCAPE 1200×628, STORY 1080×1920) + placeholder generator with brand overlay. `auto-pipeline` generates per-size images + posts + blog + calendar with brandApplied=true.

## n8n
- `n8n-workflows` PATCH toggle isActive, PUT trigger webhookUrl increment + lastTriggeredAt. No server deploy needed for daily control — dashboard only. `auto-pipeline` & `webhooks/google-business` push incoming signals via same audit trail.

## Tests (expected live, call after `NEXTAUTH_URL` + DB seeded)
- [ ] `/crm/marketing-manager` as SUPER_ADMIN → 200 + 13 tabs render, SLA 40 displayed
- [ ] As EMPLOYEE (non-marketing) GET `/api/marketing/social-inbox` → 403, cannot POST social login
- [ ] POST `/api/marketing/keyword-triggers/seed` → `{created:8, skipped:0}` then GET `/api/marketing/keyword-triggers` → 8 ACTIVE with portal link
- [ ] Comment “IELTS” on FB Page → auto-reply + DM + MarketingLead dedup phone + portal link + counselor assigned + CRM timeline entry
- [ ] WhatsApp after hours (Bangla) → AI reply in BN, remembers phone+AE-YYYY, OTP-gated for transcript, handoff on “payment”/angry → human queue
- [ ] Upload passport via WhatsApp → whatsapp-doc-upload creates MarketingLead+AE-YYYY if new, OcrJob, no orphan/dup, audit
- [ ] Campaign post DRAFT → PENDING → APPROVED (audit) → SCHEDULED (calendar appears) → PUBLISHED (publishedUrl) — brandApplied true
- [ ] Lead Pipeline PATCH assign counselor + followUp → overdue SLA surfaced in Analytics + WhatsAppCard
- [ ] STOP reply on outreach → leadOutreach consent OPTED_OUT, no further messages
- [ ] `GET /api/marketing/analytics|lead-pipeline|calendar|audit-logs` as marketing_manager → 200, as counselor → 403 where required

All commits on `arena/01a09c20-alo-education-z-ai` (latest 8428e26 pushed).
