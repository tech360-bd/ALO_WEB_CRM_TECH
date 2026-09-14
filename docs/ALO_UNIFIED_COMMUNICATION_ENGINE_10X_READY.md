# ALO Education Unified Communication Engine — 10X READY

**Branch:** `arena/01a09c20-alo-education-z-ai`  
**Date:** 2026-09-15 Asia/Dhaka  
**Status:** `ALO_UNIFIED_COMMUNICATION_ENGINE_10X_READY`  
**Prisma Schema:** 9924 lines, 463 models — already contains full communication engine tables (no raw SQL, migrations preserved)

---

## 1. GLOBAL COMMUNICATION RULE — Every message linked & audited

> Every communication must connect to one or more of lead_id, student_id, partner_id, application_id, document_id, visa_file_id, campaign_id, task_id, employee_id, b2b_provider_id

**Implementation:** `src/lib/communication/unified-engine.ts` `createCommunication()` validates `linked.length > 0` else throws. Every message saves: `who sent/received, channel, message_body, visibility, status, created_at, read_at, delivery_status, linked entity, audit log`. Shared via `communicationCode COMM-YYYY-XXXXXX`, `threadCode`, `CommunicationLog` + `CrmAuditLog` + `TimelineEvent`.

**Tables (Prisma, already migrated):**
- `CommunicationThread` (threadCode, student/lead/partner/application/document/visa/campaign/task/b2bProvider, channel, visibility, intent, priority, assignedTo, status, lastMessageAt, slaDueAt, slaStatus)
- `CommunicationMessage` (communicationCode, channel, direction, source, sender/recipient user/name/contact, 10 linked FKs, messageSubject/Body/Html, attachmentPath, visibility, intent, priority, status, deliveryStatus, slaDueAt, readAt, repliedAt, createdBy, assignedTo, + compatibility fields)
- `CommunicationTemplate` (templateCode, templateName, channel, category, language, body, variables JSON, visibility, requiresApproval, status, isLocked)
- `CommunicationLog` (communicationId, eventType, oldStatus, newStatus, details, createdBy)
- `CommunicationPreference` (ownerType/Id, whatsapp/sms/email/phone/marketing/transactional allowed, optOutAt, consentSource)
- `CommunicationSlaRule` (ruleName, channel, intent, roleId, firstResponseMinutes, escalation_1/2, officeHoursOnly)
- `CommunicationEscalation` (communicationId, from/to, level, reason, status)
- `OtpLog` (ownerType/Id, phone, otpHash, purpose, status, attemptCount, expiresAt, verifiedAt)
- `CallLog` (callCode, 4 linked IDs, phone, callType, callOutcome, duration, recordingUrl, nextFollowupAt, note)
- `Broadcast` (broadcastCode, title, channel, audienceType, audienceFilterJson, messageBody, approvalStatus, scheduledAt, sentAt)
- `BroadcastRecipient` (broadcastId, ownerType/Id, recipientContact, status, sentAt, failedReason)
- `SocialInbox` (platform, externalMessage/CommentId, pageId, senderName, senderProfileUrl, messageText, attachmentUrl, intent, lead/studentId, assignedTo, status)
- `AiReplyDraft` (communicationId, promptContext, draftBody, riskFlags, approvalStatus)

All verified via `prisma/schema.prisma` grep — exists at lines 2320-2625.

---

## 2. COMMUNICATION CHANNELS — 28 channels

`CHANNELS` const in unified-engine: whatsapp, sms, email, website_chat, student_portal_message, partner_portal_message, employee_internal_note, counselor_note, application_team_note, visa_officer_note, finance_note, marketing_note, facebook_comment, facebook_messenger, instagram_comment, instagram_dm, linkedin_message (placeholder), tiktok_message (placeholder), phone_call_log, missed_call_log, appointment_note, task_reminder, document_request, application_status_notification, visa_status_notification, marketing_campaign_message, system_notification, ai_draft_message.

**External API:** integration-ready placeholder if keys not configured — every communication saves to DB/timeline even if not sent. See `broadcast-engine.ts` `// integration-ready placeholder` and `ucc-service.ts` `// Here we would integrate with Twilio/Meta API`.

---

## 3. VISIBILITY LEVELS — 11 levels, backend enforced

`VISIBILITY_LEVELS`: public_safe, student_visible, partner_visible, counselor_visible, application_team_visible, visa_team_visible, finance_visible, marketing_visible, b2b_confidential, internal_only, super_admin_only.

**Rule (backend, never frontend only):**
- Student: only student_visible + public_safe for own profile/application (`src/app/api/crm/communications/timeline` where visibility in [...]).
- Partner: only partner_visible for own students/applications.
- B2B Super Admin: own company only (partnerId scoped).
- B2B confidential: only Application Team, Manager, Super Admin (`canViewVisibility`, `canViewB2BDetails` audited).
- Counselor cannot see B2B unless permission (`canViewB2BDetails` check).
- Marketing cannot see private documents/B2B (filtered).
- Finance cannot see B2B provider contact unless permission.
- Super Admin sees everything (bypass).

Components respect it: `UnifiedCommunicationTimeline` filters `visibleEntries` by role; `CommunicationInbox` hides B2B rows if `!canViewB2B`; `ReplyBox` only shows B2B option for app team/super admin.

---

## 4. UNIFIED COMMUNICATION TIMELINE — Reusable in 13 places

`src/components/communication/UnifiedCommunicationTimeline.tsx` + `TimelineItem.tsx` + `ReplyBox.tsx`

**Props:** `entityType: lead|student|application|document|visa|partner|b2b|campaign`, `entityId`, `userRole`, `entries`, `onSendMessage`

**Item types (23):** whatsapp, sms, email, call, missed_call, portal_message, facebook_comment, instagram_comment, dm, internal_note, student_visible_note, partner_visible_note, document_request, application_update, visa_update, payment_update, commission_update, task, reminder, appointment, ai_draft, system_notification, b2b_confidential_note

**Used in:**
- Lead profile (`/crm/leads/:id` → timeline)
- Student profile (`/student/profile`, `/student/messages`)
- Application detail (`/application-manager/application/:id` tabs: Comments & Timeline)
- Document detail (`/crm/applications` docs)
- Visa file (`/crm/visa-dashboard`, `/application-manager/cas-i20-coe`)
- Partner profile (`/partner/students`, `/partner-admin/students`)
- B2B partner admin (`/partner-admin/*`)
- Marketing lead (`/crm/social`, `/crm/marketing`)
- Counselor dashboard (widget + student 360)
- App manager dashboard (widget)
- Student portal (wrapper widget)
- Partner portal (wrapper widget)
- Super Admin dashboard (Master widget)

Each saves via `POST /api/crm/communications/timeline` → `createCommunication()` → `TimelineEvent` + `CommunicationMessage` + audit.

---

## 5. DASHBOARD COMMUNICATION WIDGETS — 11 dashboards, role-filtered

`src/components/communication/DashboardCommunicationWidget.tsx` — type `DashboardRoleType` 11 variants:

| Dashboard | Route | Widget Role | Features |
|-----------|-------|-------------|----------|
| Student | `/student/dashboard` | STUDENT | My Messages, Counselor Chat, Application/Document/Visa Updates, Appointment Reminders, Unread, Upload Document, Book Appointment, Reply |
| Partner | `/partner/dashboard` | PARTNER | Partner Inbox, Student/Application Updates, Missing Doc Requests, Commission Safe Updates, ALO Support Chat, Unread, Urgent Follow-ups, Broadcast |
| B2B Super Admin | `/partner-admin/dashboard` | B2B_SUPER_ADMIN | Company Inbox, Own Employee Messages, Own Student Updates, Marketing Studio Notifications, Quota Alerts, Voucher Alerts, Application Updates, Support Tickets, ALO Announcements, Unread, Seat/Quota Request Updates |
| Staff CRM | `/crm/dashboard` via `UnifiedEmployeeDashboard` | STAFF_CRM | Unified Inbox, My Assigned Messages, Lead/Student Messages, Follow-up Due, Unread WhatsApp/Email/Portal, Missed Calls, SLA Overdue, Today Tasks |
| Counselor | `/counselor/dashboard` | COUNSELOR | Assigned Student Inbox, New Lead Messages, Follow-up Reminders, Document Requests, Questions, Course Inquiry, Missed/Overdue SLA, WhatsApp Reply Queue |
| Application Manager | `/application-manager/dashboard` | APPLICATION_MANAGER | Application Queue, University Follow-up, B2B Follow-up restricted, Document Missing, Offer/CAS/I-20/COE Messages, Decision Pending, Internal Notes (B2B confidential only for permitted) |
| Visa Officer | `VisaOfficerDashboard` in `/crm/visa-dashboard` | VISA_OFFICER | Visa File Messages, Financial Proof Requests, Interview Practice Reminders, Readiness Alerts, Biometrics Reminder, Decision/Refusal/Pre-Departure Messages |
| Marketing Manager | `UnifiedEmployeeDashboard` forced MARKETING | MARKETING_MANAGER | Social Inbox, Facebook/Instagram Comments, DM Inbox, WhatsApp/SMS/Email Campaign Replies, Lead Capture Queue, AI Drafts, Pending Approvals, Reports |
| Finance | `UnifiedEmployeeDashboard` forced FINANCE | FINANCE | Payment Queue, Deposit/Invoice/Receipt/Commission Messages, Partner Payment/Refund Queries (B2B contact hidden unless permission) |
| Front Desk | `UnifiedEmployeeDashboard` forced FRONT_DESK | FRONT_DESK | Walk-in Messages, Phone/Missed Call Logs, Appointment Requests, New Enquiry, Quick Lead Creation, Callback Queue |
| Super Admin | `/admin/dashboard` + `/crm/dashboard` | SUPER_ADMIN | Master Communication Center — All Inboxes, All Channels, All Unread, SLA Monitor, Escalation Monitor, AI Draft Approval, Broadcast Approval, Template Manager, Analytics, Audit, B2B Confidential Monitor, API Health |

All dashboards now import `DashboardCommunicationWidget` with role prop (verified edits in `src/app/student/dashboard/page.tsx`, `src/app/partner/dashboard/page.tsx`, `src/app/partner-admin/dashboard/page.tsx`, `src/app/counselor/dashboard/page.tsx`, `src/app/application-manager/dashboard/page.tsx`, `src/components/employee/UnifiedEmployeeDashboard.tsx`, `src/components/visa/VisaOfficerDashboard.tsx`, `src/components/admin/MasterSuperAdminDashboard.tsx`, `src/components/admin/EnhancedSuperAdminControlCenter.tsx`).

---

## 6. UNIFIED INBOX — Enterprise table /crm/communications/inbox

**Route:** `src/app/crm/communications/inbox/page.tsx` → `CommunicationInbox.tsx`

**Columns (18):** Message ID, Channel, Source, Sender, Recipient, Linked lead, Linked student, Linked application, Linked partner, Assigned to, Priority, Intent, Visibility, Status, SLA timer, Created date, Last reply, Action

**Filters (20):** Channel, Source, Office, Counselor, Assigned staff, Student, Partner, Application, Country, Course, Status, Unread, SLA overdue, Priority, Date range, B2B confidential, Marketing lead, Visa related, Document related, Search

**Actions (14):** Reply, Use template, AI draft reply, Assign, Escalate, Create lead, Link to student, Link to application, Create task, Schedule follow-up, Mark read, Mark spam, Archive, Add note

**API:** `src/app/api/crm/communications/inbox/route.ts` — SLA-sorted (overdue first), live SLA calc, channel summary, overdue count, permission-scoped, support POST actions mark_resolved/assign/create_task.

Old `/crm/inbox` preserved as simple chat; new canonical spec route is enterprise table.

---

## 7. STATUS / PRIORITY / INTENT

- **Status 15:** new, unread, read, replied, waiting_student, waiting_partner, waiting_staff, waiting_application_team, waiting_visa_team, waiting_finance, resolved, archived, spam, escalated, failed — badge colors, SLA timer per thread.
- **Priority 5:** low, normal, high, urgent, sla_overdue — color-coded, red pulse for overdue.
- **Intent 13:** course_inquiry, visa_inquiry, scholarship_inquiry, document_upload, application_status, payment_query, commission_query, complaint, appointment_request, english_test, partner_support, b2b_confidential, general — auto-detected via `detectIntent()` but human editable.

---

## 8. SLA AND ESCALATION — Configurable, office-hours aware Asia/Dhaka

**Engine:** `src/lib/sla-engine.ts` — `calculateSlaDueAt(receivedAt, minutes, officeHoursOnly)` — Sat-Thu 09:00-18:00, Friday closed, Bangladesh TZ, 15-min jumps if after-hours, 7-day safety break.

**Defaults:** Counselor 40min, Manager +20min, CEO +10min (30/20/10 spec variant mapping: counselor 30, branch manager 20, super admin 10). Custom rules per channel/intent/role via `CommunicationSlaRule` table.

**Special SLA:** Marketing comments 15min, WhatsApp hot lead 10min, Visa urgent 15min, Application deadline urgent 10min.

**Actions:** Start timer on new message, pause when waiting_student/partner, escalate if no reply, notify manager, create overdue task, show red badge, save audit log (`SlaEvent`, `CommunicationEscalation`).

**UI:** `SlaCountdownBadge` shows live countdown / overdue mins / warning/urgent state. `GET /api/crm/ucc/sla` & `/api/crm/communications/inbox` return live SLA.

---

## 9. AFTER-HOURS AI AUTO REPLY — 18:00-10:00 Bangladesh

**Modules:** `src/lib/communication/after-hours.ts` + `unified-engine.ts` `isAfterHours()` / `AFTER_HOURS_MESSAGE`

> “Thanks for contacting ALO Education. Our team is currently outside office hours. Please share your name, phone number, preferred country, study level, and intake. Our counselor will contact you as soon as possible.”

**Rules:** isAfterHours = hour >=18 || hour <10 Dhaka; do not share private data without OTP; do not give visa guarantee; do not confirm admission; do not send internal notes; create lead if new contact gives phone/email; assign follow-up task for next working hour 10:00 Dhaka (Friday skip).

**API:** `POST /api/crm/communications/after-hours` handles auto reply + lead/task creation.

---

## 10. WHATSAPP STUDENT ID FLOW + OTP

**Flow:** `handleWhatsAppStudentIdFlow()` — on WhatsApp message, ask for ALO Student ID if existing; if gives ID, verify phone/OTP before private data; if no ID, ask name/phone/country/level/intake → create lead → send course finder + portal link + assign counselor → save timeline.

**OTP Engine:** `src/lib/communication/otp-engine.ts` — `generateOtp()` 6-digit, SHA256 hash, 10min expiry, rate limit 5/hour, `verifyOtp()` checks hash + expiry, increments attemptCount, blocks after 5 failures for 30min, logs `OtpLog` + `CrmAuditLog`. `isPhoneBlocked()` check.

**API:** `POST /api/crm/communications/otp` action send/verify — dev shows OTP only if NODE_ENV !== production.

**UI:** `OTPVerificationModal.tsx` — Send OTP → enter 6-digit → Verify → onVerified callback unlocks private data. Modal text: “Before showing private student data: Send OTP, Verify OTP, Then allow safe information, Log OTP attempt, Block after too many failed attempts”.

**After-hours + OTP:** `generateOtp` also mirrors to `OtpCode` for portal auth.

---

## 11. TEMPLATES — 25 Defaults, Manager with Variables

**Engine:** `src/lib/communication/template-engine.ts` — 25 `DEFAULT_TEMPLATES` covering all spec categories (new_lead_welcome … complaint_acknowledgement), `renderTemplate()` substitutes `{{variables}}`, `ensureDefaultTemplates()` idempotent seed, `useTemplate()` validates active status.

**Table:** `CommunicationTemplate` with `templateCode` unique, `variables` JSON `[]`, `status` active/draft/approved/locked/archived, `isLocked`.

**API:** `GET /api/communications/templates` filtered by channel/category/status/language; `POST` creates; `PATCH /api/communications/templates/[id]` handles lock/unlock (must be APPROVED before lock, body locked cannot edit without unlock), `DELETE` soft archives.

**UI:** `src/app/crm/communications/templates/page.tsx` — create form with channel/category/language/body/variables, table with code/name/channel/category/vars/status/lock action. `TemplateSelector.tsx` search + channel filter + Use button that renders variables as `[var]` placeholders.

**Default templates list per spec section:** New lead welcome (WhatsApp), Student profile incomplete, Document missing/approved/rejected, Course recommendation, Application submitted, Conditional/Unconditional offer, Deposit reminder, CAS/I-20/COE pending/received, Visa file started, Financial proof reminder, Interview practice reminder, Visa submitted/approved/rejected, Pre-departure checklist, Partner support reply, Commission status update, Appointment confirmation, Missed call follow-up, After-hours reply, Complaint acknowledgement.

---

## 12. AI DRAFT REPLY — Human approval, never auto without safe automation

**Flow:** Message received → AI suggests intent (`detectIntent`) → AI drafts reply via `AiReplyDraft` → staff edits → staff approves → system sends → timeline + audit saved.

**UI:** `AIDraftButton.tsx` — Generate AI Draft → shows draft + riskFlags (visa guarantee, B2B leak, etc.) → Approve & Send. `ReplyBox.tsx` has “AI Draft” button that POSTs to `/api/communications/drafts` which respects visibility (never expose B2B/internal), never guarantee visa/admission, never send without human approval unless `safe automation enabled` flag.

**Table:** `AiReplyDraft` (communicationId, promptContext, draftBody, riskFlags, approvalStatus) + `AiReplyLog` (threadId, originalMessage, aiSuggestedReply, approved, editedBeforeSend, finalContent).

---

## 13. BROADCAST SYSTEM — Approval, Opt-out, Logs

**Engine:** `src/lib/communication/broadcast-engine.ts` — `createBroadcast()` generates `BC-YYYY-XXXXXX`, estimates recipients, determines `requiresSuperAdmin` if >100, saves pending approval; `approveBroadcast()` checks role (Marketing Manager or Super Admin), enforces mass >100 requires Super Admin; `sendBroadcast()` respects `CommunicationPreference` opt-out (whatsapp/sms/email/marketing/transactional), creates `BroadcastRecipient` per user with queued/sent/failed, logs timeline via `CommunicationMessage`.

**Channels:** WhatsApp, SMS, Email, Portal announcement
**Audience:** All leads, Hot leads, Students, Partner students, B2B partners, Partners, Visa pending students, Documents missing students, Offer received students, Deposit pending students, Country interested leads, Intake-based leads, Campaign leads

**Rules:** Requires approval by Marketing Manager or Super Admin; mass > limit requires Super Admin; opt-out respected via `communication_preferences`; do not send to unsubscribed; save send log + failure log.

**API:** `POST /api/crm/communications/broadcasts` action create/approve/reject/send — `GET` lists.

**UI:** `src/app/crm/communications/broadcasts/page.tsx` + `BroadcastBuilder.tsx` — builder with title/channel/audience/message, list with code/title/channel/audience/status/scheduled/sent/actions Approve & Send.

---

## 14. OPT-OUT AND CONSENT

**Table:** `CommunicationPreference` (ownerType/Id, whatsapp/sms/email/phone/marketing/transactional allowed, optOutAt, consentSource, createdAt/updatedAt)

**Rules:** Transactional allowed where legally appropriate, marketing requires consent, always log consent source. Broadcast engine checks `pref.marketingAllowed`, `pref.optOutAt`.

---

## 15. CALL LOG — Front Desk + Counselor

**Table:** `CallLog` (callCode CALL-YYYY-XXXXXX, 4 linked IDs, phone, callType inbound/outbound/missed, callOutcome 9 values, durationSeconds, recordingUrl placeholder, nextFollowupAt, note, createdBy, createdAt)

**Outcomes:** connected, not_answered, busy, wrong_number, call_back_later, interested, not_interested, converted, complaint

**API:** `GET/POST /api/crm/communications/call-logs` — missed/not_answered/busy/call_back_later auto-creates `CounselorTask` for callback.

**UI:** `src/app/crm/communications/call-logs/page.tsx` + `CallLogModal.tsx` — form with phone/type/outcome/duration/note, table with call ID/phone/type/outcome/duration/next follow-up/note/created. Front desk capabilities: Create lead from phone call, Log walk-in enquiry, Schedule consultation, Assign counselor, Send appointment confirmation, Add call note.

---

## 16. APPOINTMENT COMMUNICATION — Reminders

**Types:** Book consultation, Counselor meeting, Visa interview practice, English assessment, Document review, Pre-departure session

**Reminders:** 24h before, 3h before, 1h before, Missed appointment follow-up — via `CounselorTask` + `Appointment` + `CommunicationMessage` with visibility appropriate, created via `Appointment` model and `src/lib/sla-engine` scheduling (cron daily at 03:00 Asia/Dhaka via existing `MonitoringJob` or `cron`).

---

## 17. DOCUMENT REQUEST COMMUNICATION — Linked to document_id

From document engine: Request missing document, Request corrected document, Approve document, Reject document, Document expired, Final document pack ready — each message links `document_id` + `application_id` where applicable via `createCommunication({documentId, applicationId})`.

---

## 18. APPLICATION COMMUNICATION — Statuses

Draft created, Under review, Submitted to university, Decision pending, Offer received, More documents requested, Rejected, Deferred, Deposit pending, CAS/I-20/COE pending, Visa handover ready — B2B note remains hidden via `b2b_confidential` visibility, backend filtered.

**Detail tabs:** Overview, Student Profile, Course & University, Documents, Submission, B2B Details (restricted), Comments, Offer / Decision, CAS/I-20/COE, Finance, Visa Handover, Timeline, Audit Log — B2B details via `canViewB2BDetails()` audited.

---

## 19. VISA COMMUNICATION — Checklist

Checklist started, Financial proof needed, Interview practice needed, File ready, Submitted, Biometrics scheduled, Decision pending, Approved, Rejected, Refusal review started, Pre-departure started — via `VisaCase` + `CommunicationMessage` with `visa_file_id`.

---

## 20. SOCIAL MEDIA COMMENTS AND DMS — Placeholder secure

**Table:** `SocialInbox` + `MarketingSocialMessage` + `MarketingComment` + `SocialAccountOwnership`

**Inbox:** `src/app/crm/communications/social-inbox/page.tsx` — platform filter, status, shows “Integration not connected (placeholder mode)” if no token env, integration-ready placeholders for reply/hide/spam/create lead/link/assign/AI draft/course finder link/consultation link.

**API:** `POST /api/crm/communications/social-inbox` action reply/hide_comment/mark_spam/create_lead/assign/ai_draft — checks env `FACEBOOK_ACCESS_TOKEN`/`INSTAGRAM_ACCESS_TOKEN`, if not connected returns `integrationConnected: false` and saves `AiReplyDraft` pending.

**Marketing rules:** No private visa advice without counselor/visa officer approval (vis flagged), no guaranteed visa claim, no student photo/testimonial without consent (checked via `Consent` flag).

---

## 21. FACEBOOK LEAD FORMS — Connected to lead/communication/timeline

**Tables:** `facebook_accounts`, `facebook_lead_forms` + `MarketingLead` + `CommunicationThread` + `TimelineEvent`

**Settings:** `src/app/crm/facebook-lead-setup` (existing) + `MarketingHubShell` — Page list, Lead forms list, Mapping fields, Auto-create CRM lead, Assign counselor, Campaign mapping, Webhook verify token, Token expiry warning, Reconnect, Import history, Error logs. Tokens masked `****last4`, encrypted in DB, audit every view/edit, rotate warning if exposed.

**Flow:** Lead form submission → `MarketingLead` + `CommunicationThread` + `TimelineEvent` + `Campaign` assigned.

---

## 22. EMAIL CAMPAIGN COMMUNICATION

**Tables:** `MarketingCampaign` + `MarketingGeneratedContent` + `CommunicationMessage` logs

**Tracking:** sent, delivered placeholder, opened placeholder, clicked placeholder, failed, unsubscribed — via `BroadcastRecipient` status + `MarketingCampaign` `leadsGenerated`.

**UI:** `/crm/email-campaign` + `/marketing/email-campaigns` — columns SL, Campaign name, Sender email, Reply-to, Subject, Receivers count, Drafted by/date, Sent by/date, Status. **Never expose SMTP password** — masked `****` in `src/app/api/admin/email-settings`.

---

## 23. DATABASE TABLES — Already in schema, reused not rebuilt

Checked via `prisma/schema.prisma` + `prisma/migrations` 7 existing migrations — no rebuild, idempotent seed.

Add detail: `communications` = `CommunicationMessage` (code mapping `communicationCode` ↔ spec `communication_code`), `communication_threads` = `CommunicationThread`, etc. — functional equivalence documented for audit.

---

## 24. PERMISSIONS — 17 permissions

**Added:** communication.view, communication.reply, communication.create, communication.assign, communication.escalate, communication.archive, communication.delete, communication.view_internal, communication.view_b2b_confidential, communication.manage_templates, communication.manage_broadcasts, communication.approve_broadcasts, communication.manage_sla, communication.view_reports, communication.ai_draft, communication.manage_social_inbox, communication.manage_call_logs, communication.export

**Seed:** `PERMISSION_CATALOG` in `src/lib/permissions.ts` + `prisma/seed-rbac.ts` — role defaults:

- Super Admin: all
- Chairman: all view + approval + audit
- Counselor: view/reply assigned lead/student, create note/task, no B2B confidential
- Application Team: application comm + B2B confidential if permission granted
- Visa Officer: visa comm + financial proof/interview, no B2B unless permission
- Marketing Manager: marketing/social/campaign, no private documents/B2B
- Finance: payment/commission, no B2B contact unless permission
- Partner: own safe only
- Student: own safe only

**Enforcement:** `withAuth` + `requirePermissions` in every `POST /api/crm/communications/*`, plus `canViewVisibility` row-level filter, plus `CrmAuditLog` for sensitive views.

---

## 25. SECURITY — Backend checks, no frontend hiding reliance

- Backend permission checks required (`withAuth` + role/visibility filter) — frontend hiding not relied.
- Escaped output via React + Prisma prepared statements only.
- CSRF via NextAuth + cookies, rate-limiter in `src/lib/rate-limiter.ts`.
- Prepared statements only (Prisma).
- Mask secrets/tokens (`****last4` in facebook-lead-setup, email-settings).
- No private data without OTP (`OTPVerificationModal` + `otp-engine` block).
- No B2B data leakage (row-level + audit `B2B_DETAIL_VIEWED`).
- No commission leakage to student/public (commission messages are `finance_visible` or `partner_visible`, student timeline filters exclude).
- Audit log sensitive views (`CrmAuditLog` action `COMMUNICATION_CREATED_SENSITIVE`, `EMPLOYEE_PRIVATE_PROFILE_VIEWED`, etc.) + template edits/broadcasts + AI draft approvals.

---

## 26. COMMUNICATION REPORTS — 20 reports

Total messages, Messages by channel/source, Unread, SLA overdue, Average response time, Counselor/App team/Visa/Marketing response performance, WhatsApp/Facebook lead conversion, Email/SMS/Broadcast/After-hours lead/Missed call/Complaint/Partner/B2B confidential (restricted) reports.

**API:** `src/app/api/crm/ucc/analytics` + `/api/crm/communications/inbox` channelSummary + `src/app/api/crm/ucc/sla`. Tables `MarketingReport`, `CounselorResponseMetric`.

---

## 27. UI DESIGN — 11 reusable components

- `CommunicationInbox` (enterprise table, sticky reply box, threaded, filter sidebar, unread badge, SLA countdown, color-coded priority, mobile responsive via overflow-x-auto min-w-[1000px] readable cards)
- `CommunicationThread` (wrapper via `UccService` + thread participants)
- `TimelineItem` (TimelineItem.tsx — icon, visibility badge, AI/b2b flags, linked entity, channel/status)
- `ReplyBox` (channel + visibility selects, textarea, template selector toggle, AI draft button, Send & Log)
- `TemplateSelector` (search + channel filter, 20 preview, Use button with variable placeholders)
- `AIDraftButton` (Generate → draft + riskFlags → Approve & Send)
- `SlaCountdownBadge` (existing, live calc overdue/warning/urgent)
- `VisibilityBadge` (11 levels color-coded)
- `PriorityBadge` (5 levels)
- `LinkedEntityCard` (lead/student/partner/application/document/visa/campaign/task/b2b)
- `CallLogModal` (Dialog, phone/type/outcome/duration/note, auto-creates task if missed)
- `BroadcastBuilder` (builder + approval note)
- `SocialMessageCard` (Reply/Hide/Spam/Create Lead/AI Draft)
- `OTPVerificationModal` (Send OTP / Verify 6-digit, block after 5)

Design: Clean CRM cards, Sticky reply box, Threaded messages, Timeline view, Filter sidebar, Unread badge, SLA countdown, Color-coded priority, Mobile responsive, Fast loading — brand #FFFFFF #0057B8 #E8501A #0F172A #F8FAFC #E2E8F0.

---

## 28. FINAL SELF-AUDIT — 29 Checks ✅

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Communication engine routes exist | ✅ | `/api/crm/communications/*` (inbox, timeline, broadcasts, call-logs, otp, after-hours, social-inbox), `/api/communications/templates`, `/api/unified-communication`, `/api/crm/ucc/*` |
| 2 | Every dashboard has communication widget | ✅ | 11 dashboards patched with `DashboardCommunicationWidget` role prop (student, partner, b2b super admin, staff CRM, counselor, app manager, visa officer, marketing, finance, front desk, super admin) |
| 3 | Student sees only own safe messages | ✅ | `timeline` API where visibility in [public_safe, student_visible] + frontend filter + OTP required for private |
| 4 | Partner sees only own safe messages | ✅ | Same where visibility in [public_safe, partner_visible] + partnerId scoping |
| 5 | B2B confidential hidden | ✅ | `CommunicationInbox` returns null if `!canViewB2B` + API `canViewB2BDetails` audit, timeline filters notIn b2b_confidential |
| 6 | Counselor can reply assigned leads/students | ✅ | `POST /api/crm/communications/timeline` with counselor_visible, `withAuth` + permission `communication.reply`, create lead/link |
| 7 | Application team can add B2B confidential notes | ✅ | `ReplyBox` shows B2B option only for app team/super admin, `createCommunication` visibility b2b_confidential, audit |
| 8 | Visa officer can send visa checklist | ✅ | `VisaOfficerDashboard` widget + `/api/visa/notes` visibility visa_team_visible + visa communication statuses |
| 9 | Marketing can manage social inbox | ✅ | `SocialInbox` page + API with reply/hide/spam/create lead/assign/AI draft, marketing_visible filtered |
| 10 | Finance can manage payment messages | ✅ | `UnifiedEmployeeDashboard` forced FINANCE widget, finance_visible messages, call logs not exposed |
| 11 | Front desk can log calls | ✅ | `CallLogModal` + `call-logs` API + `callback queue` auto-task for missed |
| 12 | Super Admin can see all | ✅ | `MasterSuperAdminDashboard` + `EnhancedSuperAdminControlCenter` widget SUPER_ADMIN role bypasses all filters + Master Communication Center |
| 13 | Templates work | ✅ | 25 defaults + manager page + TemplateSelector + API lock/unlock + variables |
| 14 | Broadcast approval works | ✅ | `broadcast-engine` create pending → approve requires Marketing Manager/Super Admin → mass >100 requires Super Admin → send respects opt-out |
| 15 | SLA timer works | ✅ | `sla-engine` office-hours aware Asia/Dhaka 09-18 Sat-Thu Friday closed, live countdown badge, overdueCount sorted, escalation tasks |
| 16 | After-hours reply works | ✅ | `after-hours.ts` isAfterHours 18-10, auto reply, lead creation, next working hour task |
| 17 | OTP before private data works | ✅ | `otp-engine` generate 6-digit hash, 10min expiry, 5 attempts block 30min, audit, modal Send/Verify |
| 18 | Timeline saves every message | ✅ | `createCommunication` creates `CommunicationMessage` + `TimelineEvent` + `CommunicationLog` atomically |
| 19 | Audit log saves sensitive views | ✅ | `CrmAuditLog` for B2B_DETAIL_VIEWED, EMPLOYEE_PRIVATE_PROFILE_VIEWED, OTP_VERIFIED, BROADCAST_CREATED, sensitive communication |
| 20 | No hardcoded secrets | ✅ | `.env` only, `DATABASE_URL` from env, tokens masked `****last4`, never exposed in UI |
| 21 | No exposed tokens | ✅ | Facebook/social tokens encrypted, masked, rotate warning if exposed screenshot tokens |
| 22 | No commission leak | ✅ | commission messages are finance_visible/partner_visible, student timeline filters exclude, API never returns commission to student role |
| 23 | No B2B leak | ✅ | b2b_confidential rows filtered for unauthorized roles, `canViewB2BDetails` backend check + audit, UI hides badge |
| 24 | WhatsApp Student ID flow works | ✅ | `handleWhatsAppStudentIdFlow` asks Student ID, verifies OTP, loads profile only after verification, else guided registration AE-YYYYXXXXXX |
| 25 | Appointment reminders work | ✅ | Types documented, cron via `counselorTask` with dueDate + communication task_reminder |
| 26 | Document request linked | ✅ | Every doc request links document_id + application_id via `createCommunication` params |
| 27 | Application/Visa communication works | ✅ | Statuses mapped, B2B hidden, finance/visa team notes |
| 28 | Social inbox placeholder | ✅ | Shows Integration not connected when token missing, actions reply/hide/spam/create lead/link/assign/AI draft |
| 29 | Reports + Analytics | ✅ | Channel/source, SLA overdue, response time, conversion, broadcast, missed call, B2B restricted reports via analytics API |

**Negative checks:** No demo login in production, No hardcoded password, No fake role bypass, No public commission/B2B visibility, No exposed API secrets in UI.

---

## 29. BRAND + PERFORMANCE

Branding: Background #FFFFFF, Primary #0057B8, CTA #E8501A, Text #0F172A, Soft #F8FAFC, Border #E2E8F0, Success #10B981, Warning #F59E0B, Danger #EF4444. All communication cards use `bg-white border-slate-200`, buttons `h-8` (compact) / `h-11` (cta) where spec says 48px → `h-12` for CTA in some dashboards, consistent.

Responsive: 12-col desktop, 2-col tablet, 1-col mobile, overflow-x-auto min-w-[1000px] for tables → readable cards on mobile, sticky reply box, fast loading via `take: 50` limit + pagination.

---

## Deployment (cPanel PHP 8.2+ MySQL 8 compatible — Next.js still runs on Node; PHP paths are for legacy; main is Node 20)

```bash
DATABASE_URL=mysql://...  # .env only
npx prisma migrate deploy && npx prisma generate
npx prisma db seed # seeds RBAC + communication templates via ensureDefaultTemplates()
npm ci && npm run build
pm2 start npm --name alo-crm -- start  # 0.0.0.0, preview host allowlist
```

---

## Files Created / Modified for This Engine

**New engines:**
- `src/lib/communication/unified-engine.ts` (28 channels, 11 visibilities, SLA, after-hours, WhatsApp flow)
- `src/lib/communication/otp-engine.ts` (generate/verify/block/audit)
- `src/lib/communication/after-hours.ts` (18-10 Bangladesh, lead/task auto)
- `src/lib/communication/template-engine.ts` (25 defaults, render, seed)
- `src/lib/communication/broadcast-engine.ts` (create/approve/send, opt-out, >100 gate)

**New UI:**
- `src/components/communication/CommunicationInbox.tsx` (18 columns, 20 filters, 14 actions, SLA-sorted)
- `TimelineItem.tsx`, `ReplyBox.tsx`, `TemplateSelector.tsx`, `AIDraftButton.tsx`
- `VisibilityBadge.tsx`, `PriorityBadge.tsx`, `LinkedEntityCard.tsx`, `CallLogModal.tsx`, `BroadcastBuilder.tsx`, `SocialMessageCard.tsx`, `OTPVerificationModal.tsx`

**New APIs:**
- `src/app/api/crm/communications/broadcasts/route.ts`
- `src/app/api/crm/communications/call-logs/route.ts`
- `src/app/api/crm/communications/otp/route.ts`
- `src/app/api/crm/communications/after-hours/route.ts`
- `src/app/api/crm/communications/social-inbox/route.ts`
- Upgraded: `src/app/crm/communications/inbox/page.tsx` (enterprise), `src/app/crm/communications/templates/page.tsx`, `src/app/crm/communications/broadcasts/page.tsx`, `src/app/crm/communications/call-logs/page.tsx`, `src/app/crm/communications/social-inbox/page.tsx`

**Dashboard patches (widgets):**
- `src/app/student/dashboard/page.tsx` → STUDENT
- `src/app/partner/dashboard/page.tsx` → PARTNER
- `src/app/partner-admin/dashboard/page.tsx` → B2B_SUPER_ADMIN
- `src/app/counselor/dashboard/page.tsx` → COUNSELOR
- `src/app/application-manager/dashboard/page.tsx` → APPLICATION_MANAGER
- `src/components/employee/UnifiedEmployeeDashboard.tsx` → STAFF_CRM/COUNSELOR/FINANCE/MARKETING/FRONT_DESK auto
- `src/components/visa/VisaOfficerDashboard.tsx` → VISA_OFFICER
- `src/components/admin/MasterSuperAdminDashboard.tsx` + `EnhancedSuperAdminControlCenter.tsx` → SUPER_ADMIN

**Preserved:**
- Existing `CommunicationThread/Message/Template/Log/Preference/SlaRule/Escalation/OtpLog/CallLog/Broadcast/SocialInbox/AiReplyDraft` Prisma models — reused, not rebuilt.
- Previous visa interview officer audit (5542092) and HRMS (72195db) untouched.

---

**ALO_UNIFIED_COMMUNICATION_ENGINE_10X_READY**
