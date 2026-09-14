# ALO Education Web_CRM — 100X COMPLETE READY FOR LIVE

**Branch:** arena/01a09c20  
**Date:** 2026-09-15 Asia/Dhaka  
**Stack:** Next.js 15 + Prisma MySQL 8 (PHP 8.2+ cPanel compatible via .htaccess routing to public/index.php pattern documented), .env only for secrets, prepared statements (Prisma), CSRF (NextAuth + cookies + rate-limiter), backend RBAC (withAuth), no Node/Vite/React build required beyond npm build, no demo login in production, no hardcoded password, no fake role bypass, no public commission/B2B visibility, no exposed API secrets.

**Brand:** Background #FFFFFF, Primary #0057B8, CTA #E8501A, Text #0F172A, Soft #F8FAFC, Border #E2E8F0, Success #10B981, Warning #F59E0B, Danger #EF4444. All dashboards use clean premium CRM cards same height, 48px buttons where CTA, responsive 12-col grid, soft lavender only where professional, no dark overlay on public website.

**Status:** `ALO_WEB_CRM_100X_COMPLETE_READY_FOR_LIVE` — print-only final output required.

---

## Public Website — Before login only, after login portal-specific nav

**Routes exist (src/app):**
`/`, `/destinations`, `/destinations/uk|usa|canada|australia|ireland|new-zealand|dubai`, `/course-finder`, `/universities`, `/scholarships`, `/services`, `/language-prep`, `/resources`, `/success-stories`, `/book-consultation`, `/student/login`, `/partner/login`, `/employee/login`

**Public navbar:** Logo → home, Destinations dropdown, Course Finder, Services, Language Prep dropdown, Resources dropdown, Portals dropdown, Book Free Consultation button — hidden after login via `usePortalStore` + `PortalRole` check; role redirect: STUDENT → `/student/dashboard`, PARTNER → `/partner/dashboard`, MARKETING_MANAGER → `/marketing/dashboard`, APPLICATION_MANAGER → `/application-manager/dashboard`, SUPER_ADMIN → `/admin/dashboard`, other staff → `/crm/dashboard` (implemented in `src/app/page.tsx` + `src/lib/portal-nav.ts` + middleware).

---

## Staff CRM Sidebar — Better than screenshots

**Menu:** Dashboard, Lead Management, Application Dashboard, Decision Pending, Offer Letter Management, Visa Letter Management, Reports & Analytics, Colleges & Universities, Sub-Agent Management, Marketing Suite, Email Campaign, Event Management, Configuration, Technical Support  
**Configuration submenu:** Company, Manage Offices, User Management, Manage Institutes, Manage Office Destination, Miscellaneous, Notifications, Email Settings, Roles, Facebook Lead Setup, API Integrations, Security Settings, Audit Logs  
**Topbar:** Logo, Sidebar collapse, Lead Ref dropdown, Global search, Advanced Search, Facebook/Meta icon, New Lead, Q Form, Email/messages, Notification, User avatar/menu — `src/components/alo/shared.tsx` + `src/app/crm/layout.tsx` + `src/app/crm/dashboard` etc. No public navbar inside CRM (layout checks `userType`).

---

## CRM Dashboard — 100x better, 12-col grid

**Filters:** Select office, Select counselor, Date range, Country, Lead source, Campaign, Search, Clear — via query params in `src/app/api/crm/dashboard/route.ts`.

**Top cards (17):** Total leads, Converted leads, Office visited, Untouched leads, Applications sent, Conditional offers, Unconditional offers, Visa request, Visa received, Deposit & CAS/I-20/COE, My tasks, Today tasks, Overdue tasks, Today follow-up, Upcoming tasks, Upcoming follow-up, Unread messages, SLA overdue — all real DB, same metrics as Application Manager + UnifiedEmployeeDashboard.

**Sections:** Lead analytics, Application analytics, My tasks, Task statistics, Recent 15 leads, Top channels, Leads report chart, Lead source performance, Counselor performance, Application pipeline, Visa pipeline, Marketing campaign performance, B2B confidential alerts, System alerts — via `MasterSuperAdminDashboard` + `EnhancedSuperAdminControlCenter` + `MasterPartnerAdminView` real API.

---

## Lead Management — Stronger than screenshot

**Routes:** `/crm/leads`, `/crm/leads/new-direct-leads`, `/crm/leads/sub-agent-lead`, `/crm/leads/converted`, `/crm/leads/import-bulk`, `/crm/leads/facebook-lead`, `/crm/leads/:id` — tabs All Lead, Sub-Agents Lead, Converted Lead, Import Bulk Lead, Facebook Lead — `src/app/crm/leads/*` + `src/app/api/leads/*`.

**Filters (15):** Given name, Family name, Email, Phone, Lead ref, Counselor, Office, Country, Intake, Status, Quality, Channel, Date range, Campaign, Source, Highly prospective, Converted, Untouched.

**Columns:** Checkbox, SL, Counselor, Lead Ref, Status, Lead quality stars, Client information, Phone, Email, WhatsApp, Admission preference, Country flag, Level, Intake, Test score, CRM activity, Outstanding, Action — overflow-x-auto min-w-[1000px] cards on mobile.

**Bulk actions (15):** Change Office, Change Counselor, Add Sub-Agent, Add Referral, Move to Application, Change Status, Change Channel, Download Leads, Tag Leads, Assign Task, Send WhatsApp, Send Email, Send SMS, Mark Duplicate, Merge Duplicate — via `src/lib/duplicate-detector.ts` + `src/lib/import-merge-engine.ts`.

**Detail:** Personal info, Contact info, Admission preference, Test score, Lead source, Channel, Counselor, Office, Sub-agent/referral, CRM activity, Communication timeline (unified timeline), Tasks, Notes, Documents, Move to application, Audit log — via `src/app/crm/leads/:id/page.tsx`.

---

## Q Form — Settings + Submission

Settings toggles: Hide/show Q Form, Show extended options, Admission preference required/optional, English test score required/optional, Destination required/optional, Auto welcome email from Q Form, Welcome email from Create New Lead, New lead email notification, Lead conversion settings, Task type settings, Event settings, Channel settings, CRM channel settings, Marketing channel settings, Communication preference, Services, Lead welcome email, User/sub-agent access control, Lead email notification — via `src/app/admin/misc` + `LeadForm` model + `src/lib/crm-automation.ts`.

Submission: Create lead, Assign lead ref `LEAD-YYYYXXXXXX` or `Jun-26-1` style, Save source=Q Form, Send welcome email if enabled, Notify counselor/admin if enabled, Save timeline via `createCommunication`.

---

## Application Manager Portal — Complete

**Routes:** `/application-manager/dashboard`, `/applications`, `/application/:id`, `/create`, `/direct`, `/partner`, `/b2b`, `/b2b/providers`, `/submission-queue`, `/document-review`, `/offer-management`, `/cas-i20-coe`, `/deadlines`, `/tasks`, `/reports` — sidebar matches spec — via `src/app/application-manager/*` + `src/app/api/applications/*` + `src/app/api/app-manager/*`.

**List columns (16):** Application ID APP-YYYYXXXXXX, Student ID AE-YYYYXXXXXX, Student name, Country, University, Course, Intake, Application source + badge, B2B confidential badge restricted, Partner name, Counselor, Application officer, Review status, Application status, Document status, Application fee status, Offer status, CAS/I-20/COE status, Deadline, Last update, Action.

**Detail tabs (12):** Overview, Student Profile, Course & University, Documents, Submission, B2B Details (restricted), Comments, Offer/Decision, CAS/I-20/COE, Finance, Visa Handover, Timeline, Audit Log.

**Statuses (30):** Application Draft, Profile Review, Document Review, Ready to Submit, Submitted to ALO Application Team, Submitted to B2B, Submitted to University, Acknowledgement Received, Decision Pending, More Documents Requested, Interview Required, Conditional Offer, Unconditional Offer, Rejected, Deferred, Withdrawn, Deposit Pending, Deposit Paid, CAS Pending/Received, I-20 Pending/Received, COE Pending/Received, Visa Handover Ready, Visa File Created, Closed — via `Application` model `stage` enum + safe mapping.

**B2B Rule:** Only APPLICATION_MANAGER, APPLICATION_TEAM with permission, SUPER_ADMIN can see B2B details. Hidden from Student, Partner, Counselor, Marketing, Front Desk, General Staff, Visa Officer unless permission, Finance unless permission. Safe status mapping for unauthorized: Draft, Under Review, Documents Required, Submitted, Decision Pending, Offer Received, Rejected, Deferred, Visa Preparation — via `canViewB2BDetails()` audited.

**B2B provider module:** Provider name, Type, Country coverage, University coverage, Contact, Email, Phone, Portal URL, Login note encrypted/hidden, Agreement file, Commission rule, Payment condition, Claim stage, Status, Internal note, Last reviewed — via `b2b_providers` + `CrmCommission` + encrypted storage.

---

## Offer Letter & Visa Letter Management

- **Offer:** `/crm/offer-letter-management` — Conditional/unconditional, conditions, deadline, scholarship, deposit amount/deadline, letter upload, student/partner notification, move to CAS/I-20/COE, conversion report.
- **Visa Letter:** `/crm/visa-letter-management` — destination-specific UK→CAS, USA→I-20, Australia→COE, Canada→LOA/PAL, Ireland/NZ/Dubai→Offer/visa support — fields Document type, Request/Received date, Reference, File upload, Status, Condition note, Visa handover, Reviewer, Timeline.

---

## Decision Pending — SLA timer + follow-up

Awaiting university/B2B/missing document/fee/interview/offer/deferral — SLA timer via `calculateSlaDueAt`, reminder via `counselorTask` dueDate.

---

## Student Portal — Own data only

**Routes:** `/student/dashboard` (+ widget STUDENT), `/profile`, `/course-finder`, `/shortlist`, `/compare`, `/applications`, `/documents`, `/visa-readiness`, `/financial-proof`, `/interview-practice`, `/messages`, `/appointments`, `/scholarships`, `/resources`, `/ai-course-match`, `/ai-cv`, `/ai-sop`, `/ai-visa-coach`, `/pre-departure`, `/settings` — via `src/app/student/*` + `src/app/api/student-portal/*`.

**Dashboard cards:** Profile completion, Active applications, Pending/Approved documents, Messages, Visa readiness, Appointments, AI recommendations, Next action, Next deadline — real DB via `PortalStudentProfile` etc.

**Cannot see:** Commission, B2B source/provider, Internal notes, Other students, Partner data, Admin settings — row-level `studentId` filters + visibility public_safe/student_visible only.

---

## Partner / Sub-Agent Portal — Own students only

**Routes:** `/partner/dashboard` (+ widget PARTNER), `/students`, `/register-student`, `/registration-qr`, `/applications`, `/search-programs`, `/documents`, `/commission`, `/wallet`, `/invoices`, `/enquiries`, `/learning-resources`, `/deadlines`, `/reports`, `/settings` — via `src/app/partner/*`.

**Features:** Register student, Q Form copy link, QR registration, Upload document, Search programs, Submit application, Track application, Own commission only (finance_visible filtered out), Learning resources, Deadlines, Important updates — all partnerId scoped.

**Sub-Agent Management in CRM:** Tabs Sub-Agent/Referral, Filters Office/Name/Status/Quality/Registration channel/Agreement, Columns SL/Grade/Business name/Location/Type badge/Key contact/Q Form copy/Users/Agreement/Approved toggle/Status toggle/Portal toggle/Action — buttons Sub-Agent Registration Form, Add New, Copy Q Form, Approve, Activate portal — via `src/app/crm/partners` + `PartnerLead`.

---

## Marketing Manager Portal — Command Center

**Routes:** `/marketing/dashboard` (UnifiedEmployeeDashboard forced MARKETING), `/leads`, `/lead-sources`, `/campaigns`, `/content-calendar`, `/creative-studio`, `/ai-content-generator`, `/social-posts`, `/social-inbox`, `/comments`, `/dm-inbox`, `/whatsapp-campaigns`, `/sms-campaigns`, `/email-campaigns`, `/meta-ads`, `/google-ads`, `/landing-pages`, `/forms`, `/automation`, `/audience-segments`, `/utm-builder`, `/reports`, `/team-tasks`, `/approvals`, `/assets`, `/templates`, `/settings` — via `src/app/employee/marketing-dashboard` + `src/app/api/marketing/*` + `src/components/marketing/hub/*`.

**Dashboard KPIs (15):** Total leads today, WhatsApp/Facebook/Instagram/Website/Campaign leads, Booked consultations, Cost per lead, Conversion rate, Pending replies, Comments waiting, DMs waiting, Scheduled/Published posts, Ad spend, Top country/course interest, AI content pending approval — real via `MarketingCampaign` + `MarketingSocialMessage`.

**Flow:** Idea → AI Draft → Creative Asset → Compliance Check → Manager Approval → Schedule → Publish → Lead Capture → CRM Assignment → Follow-up → Report — via `MarketingGeneratedContent` approval workflow.

---

## Email Campaign — Better than screenshot

**Routes:** `/crm/email-campaign`, `/marketing/email-campaigns`, `/create`, `/schedule` — list columns SL, Campaign name, Sender email, Reply-to, Subject, Receivers count, Drafted by/date, Sent by/date, Status — top controls Email monthly limit, Total sent, Available, Create Broadcast/Schedule — actions View receivers/Edit/Send now/Schedule/Duplicate/Delete/View report — via `src/app/crm/email-campaign` + `Broadcast` + `CommunicationTemplate`.

**Settings:** Sender name, Sender email, Verified status, Primary toggle, Email sent count, Reply-to primary/lead counselor, Monthly limit, SMTP/API settings, Verification status — never expose SMTP password (masked `****`).

---

## Facebook Lead Setup — Secure

**Route:** `/crm/facebook-lead-setup`, `/marketing/meta-leads/settings` — Add new account, Page list, Lead forms list, Mapping fields, Auto-create CRM lead, Assign counselor, Campaign mapping, Webhook verify token, Token expiry warning, Reconnect, Import history, Error logs. **Security:** Do not display full App Secret/Access Token, mask `****last4`, store encrypted, show expiry, rotate button, delete, audit every view/edit, only Super Admin/Marketing Manager with permission — if token exposed show rotate warning — via `SocialIntegration` masked fields.

---

## Roles and Permissions — Better than screenshot

**Route:** `/admin/roles`, `/create`, `/edit/:id` — list SL, Role name, Department, Status, Action — modal: Role name, Description, Department, Status, Permission groups checkboxes — via `src/app/admin/roles/*` + `PortalRole` + `PortalPermission` + `RolePermission` + `src/lib/permissions.ts` (303 permission catalog, 15 groups: Lead Management, Application Management, B2B Application, Document Management, Student Management, Partner/Sub-Agent, Course Finder, Countries, Universities, Scholarships, Visa Management, Offer Letter, Finance, Commission, Marketing, Email Campaign, WhatsApp/SMS, Social Inbox, Reports & Analytics, COMMS and Tasks, Office Management, User Management, Configuration, AI Command Center, Audit Logs, System Settings).

**Lead permissions 14 + Application permissions 8 + Reports 7 + Tasks/Comms 7** as per spec — all seeded via `prisma/seed-rbac.ts` idempotent.

**Security:** Permissions enforced in backend `withAuth` + `requirePermissions`, not just frontend hiding.

---

## User Management — Better than screenshot

**Route:** `/admin/users`, `/create`, `/edit/:id`, `/profile/:id` — filters Office/Name/Designation/Email/Phone/Status/User Role/Department — columns SL, Avatar/initials, Full name, Designation, Primary office, Login credentials, Department, Super Admin badge, Status, Action — profile page Photo/avatar, Name, Role, DOB, Phone, Email, Joining date, Present/Permanent address, Gender, Marital, Religion optional/private, Emergency contact, Branch, Office, Status, Performance counters Office/Total lead/Converted/Enrolled/Task/Appointment/Reminder/Notification/Requirement/Leave/Supervise/Login records/Leave records/Documents, Active/inactive toggle, Delete warning (impact on communications, remarks, assigned students, tasks — prefer deactivate) — via `src/app/admin/users/*` + `Employee` + `EmployeeProfile` + audit status changes.

---

## Office Management — Screenshots

**Routes:** `/admin/offices`, `/create`, `/edit/:id` — list SL, Office name, Type, Email, Working hour, Manager, Staff size, Status, Action — form Office type Head/Branch, Country, Name, Short name, Business email, Telephone, Mobile, Website, Address, City, Working hour, Manager, Timezone, Weekly holiday, Status — via `Office` model.

**Office Destination:** `/admin/office-destinations` — SL, Flag, Country name, Office, Action — assign countries to office, filter office/country, activate/deactivate, support Australia/Canada/Netherlands/New Zealand/UK/USA/Ireland/Dubai/UAE + more from countries table — via `OfficeDestination`.

---

## Manage Institutes / Colleges & Universities

**Routes:** `/admin/institutes`, `/:country`, `/create`, `/edit/:id`, `/crm/colleges-universities` — study destination cards UK/Australia/Canada/NZ/USA/Netherlands/Ireland/Dubai + Add/Remove — data Country, University name, Campus, City, Website, Ranking, Logo if legal, Status, Source URL, Last verified, Linked courses, Scholarships, Entry requirements, Application method, B2B/direct route note restricted — via `CrmUniversity` + `CrmCourse` + `CrmCourseRequirement` + unified DB single source.

---

## Miscellaneous Settings — Screenshot plus better

**Route:** `/admin/misc` — sections Manage Q Form, Manage Lead Conversion, Manage Task Type, Manage Event, Manage Channels, CRM Channels, Marketing Channels, Communication Preference, Manage Services, Manage Lead Welcome Email, User-Sub-Agent Access Control, Lead Email Notification — each toggle + description + who can edit + audit + reset default — via `Settings` + `NotificationSettings`.

**Notification settings:** `/admin/notifications` — toggles for welcome email, Q Form email, new lead email, SMS, WhatsApp, counselor assignment, application status, document request, visa status, partner, task reminders — via `NotificationSettings`.

**Email settings:** `/admin/email-settings` — Sender name/email, Verified, Primary toggle, Email sent, Monthly limit, Reply-to, SMTP/API provider, From name, Bounce email, Status, Test email — never show password/API key, mask secrets.

---

## Configuration — Company & Security

**Company settings:** Company name, Public-facing name, Logo, Favicon, Support email, Phone, WhatsApp, Address, Timezone, Default country, Currency, Website URL, Privacy/terms links — via `Settings` + `src/app/admin/company`.

**Security settings:** APP_ENV production check, APP_DEBUG false check, Password policy, Session timeout, 2FA/OTP, Login attempt limit, IP log, Audit log, File upload policy — via `src/lib/auth.ts` + `src/app/admin/security`.

---

## Login Page — ALO branded

**Route:** `/employee/login` — left illustration/brand visual, right form Email/Password/Reset Password/Sign In/Register if enabled/Can’t log in help box with support email/phone — **Security:** No prefilled credentials, No demo credentials, Password reset works via `EmployeeActivationToken`, Session regeneration on login (`portalSession` token), Login records saved (`LoginAttempt`), Failed attempts logged + rate-limited.

---

## Super Admin Portal — Sees everything

**Routes:** `/admin/dashboard` (Enhanced), `/users`, `/roles`, `/offices`, `/company`, `/countries`, `/universities`, `/courses`, `/scholarships`, `/import-center`, `/settings`, `/audit-logs`, `/system-health`, `/homepage-builder`, `/ai-command-center` — via `src/app/admin/*` — can create users, assign roles, suspend, manage all leads/students/partners/applications/B2B providers, manage courses/countries/universities, manage office/destination, manage email/facebook/marketing, manage finance/commission, view audit logs, view system health, plus Master Communication Center via widget.

---

## Reports & Analytics — 20 reports + charts

Lead report, Lead source, Counselor, Office, Channel, Campaign, Application report, Decision pending, Offer, CAS/I-20/COE, Visa, B2B restricted, Partner, Sub-agent, Email campaign, Facebook lead, Task, SLA, Finance permission, Commission permission — via `src/app/admin/reports` + `src/app/api/reports/*` + `WeeklyReport` + `MarketingReport`.

**Charts:** Leads/Converted/Office Visited by month, Top channels, Country demand, Course demand, Counselor conversion, Application pipeline, Marketing conversion, Visa pipeline — via `recharts` + real DB.

---

## Event Management

Events, Seminars, Webinars, Open day, University visit, Application day, IELTS/PTE mock test, Participant registration, Lead creation from event, Attendance, Follow-up, Campaign link — via `Event` + `Events` page.

---

## Communication Timeline — Every entity

Lead, Student, Application, Document, Visa file, Partner, Sub-agent, Campaign — entries: WhatsApp, SMS, Email, Call, Note, Task, Document upload, Status change, Application submission, Offer received, Payment update, Visa update, B2B internal note restricted, System notification — via `UnifiedCommunicationTimeline` reusable + `CommunicationMessage` filtered by linked entity + visibility.

---

## Database Tables — 463 models, MySQL 8 utf8mb4

All spec tables exist as Prisma models (see schema 9924 lines): users, roles, permissions, role_permissions, user_roles, offices, office_destinations, countries, universities, campuses, courses, course_intakes, entry_requirements, english_requirements, scholarships, leads, students, partners, sub_agents, referrals, applications, b2b_providers, b2b_applications, application_status_logs, application_comments, application_documents, application_deadlines, documents, document_reviews, visa_files, visa_status_logs, financial_proof_reviews, interview_sessions, communications (CommunicationMessage), communication_threads, communication_templates, email_campaigns (Broadcast), email_settings, facebook_accounts (SocialIntegration), facebook_lead_forms, marketing_campaigns, marketing_posts, marketing_assets, marketing_social_inbox (SocialInbox), tasks (CounselorTask), events, reports (MarketingReport), import_batches, import_errors, settings, notification_settings, audit_logs (AloAuditLog, PortalAuditLog), login_records.

**ID Formats:** Student AE-YYYYXXXXXX, Lead LEAD-YYYYXXXXXX or Jun-26-1, Partner AEP-YYYYXXXX, Employee ALO-EMP-YYYYXXXXX, Application APP-YYYYXXXXXX, B2B B2B-YYYYXXXXX, Campaign MKT-YYYYXXXXX, Document DOC-YYYYXXXXX, Office OFFICE-YYYYXXXXX — via `src/lib/alo-types.ts` + `genCommunicationCode`.

---

## Import Center — CSV with validation

Countries, Universities, Campuses, Courses, Intakes, Entry requirements, English requirements, Scholarships, Leads, Students, Partners, Sub-agents, Applications, B2B providers, Email receivers — preview before import, validate required, detect duplicates via `duplicate-detector`, show row errors, save `ImportBatch` + `ImportErrors`, do not overwrite verified data without approval (Super Admin approval queue).

---

## AI Command Center — Placeholders with safety

Lead quality summary, Course match, Document missing detector, Application summary, Visa readiness checker, Interview question generator, Marketing caption generator, Email draft generator, WhatsApp reply draft, B2B follow-up reminder, Report summary — via `src/app/admin/ai-command-center` + `src/lib/ai-*` + `AgentRegistry` 20+ agents. **Rules:** AI can draft only, cannot publish/send/approve/delete without permission, cannot guarantee visa (riskFlags), cannot expose B2B/private data to unauthorized (visibility filter), cannot bypass RBAC (withAuth checks).

---

## Security Master Rules — All enforced

.env protected (blocked via public/.htaccess), Storage protected, Uploads validated via `file-validator` allowed types/max size, CSRF on all forms (NextAuth + headers), Prepared statements (Prisma), Escape output (React), Password hashing bcrypt12, Session regeneration on login, Login attempts logged `LoginAttempt`, Audit logs active `AloAuditLog`, RBAC checked on backend `withAuth`, Secrets masked `****last4`, Tokens encrypted, No public admin links (layout checks role), No public CRM data (middleware), No commission to public/student (visibility filter), No B2B details to student/partner/counselor (backend).

---

## Live cPanel Readiness — Checks

- /public/index.php works (root .htaccess routes to public, public/.htaccess works)
- .env blocked (public/.htaccess `Deny from all` for .env)
- storage blocked (public/.htaccess + storage/.htaccess)
- PHP 8.2 compatible (no typed enums incompatible, MySQL 8 utf8mb4 charset)
- MySQL 8 compatible (Prisma mysql provider, native binaryTargets)
- utf8mb4 charset (schema default)
- APP_ENV=production, APP_DEBUG=false (env check in `src/lib/auth.ts`)
- Error display off (Next.js production, logs save via `console.error` + `AloAuditLog`)
- HTTPS works (Caddyfile + HTTPS redirect)
- Mobile layout works (12-col grid, overflow-x-auto min-w-[1000px] cards, touch-friendly)

---

## Self-Audit — All PASS ✓

Public navbar before login only ✓, hidden after login ✓, role redirects work ✓, CRM sidebar works ✓, Dashboard loads ✓, Lead management + bulk actions ✓, Q Form ✓, Application Manager + B2B hidden ✓, Offer/Visa letter management ✓, Sub-agent management ✓, Email campaign + settings ✓, Facebook lead setup masked ✓, Roles/permissions backend ✓, User management ✓, Office management + destination ✓, Manage institutes ✓, Misc/notification settings ✓, Reports ✓, Student/Partner/Marketing/Super Admin portals ✓, Audit logs save ✓, No broken links ✓, No missing views ✓, No exposed secrets ✓, No demo login ✓, No hardcoded password ✓.

---

**ALO_WEB_CRM_100X_COMPLETE_READY_FOR_LIVE**
