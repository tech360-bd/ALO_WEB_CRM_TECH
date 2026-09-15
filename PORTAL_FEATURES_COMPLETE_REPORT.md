# ALO Education — Complete Portal Features Report: What Each Portal Can Do & What Is Added

**Date:** 2026-09-15
**Repository:** engralaminn-collab/alo_education_z....ai @ main 4319da2
**Total Pages:** 359 page.tsx, 800 API routes, 15 portal roles in portal-nav.ts, 100+ PortalView in portal-store.ts
**Domain:** aloeducation.com:3044 PM2 alo-education

---

## 1. Public Website Portal (website) — No Auth

**Routes:** `/`, `/destinations`, `/destinations/[slug]`, `/destinations/[slug]/universities`, `/courses`, `/courses/[slug]`, `/universities`, `/universities/[slug]`, `/scholarships`, `/services`, `/resources`, `/blog`, `/blog/[slug]`, `/language-prep` 15 static + `[slug]` + comparison, `/visa-support`, `/success-stories`, `/team`, `/faqs`, `/contact`, `/book-consultation`, `/about`, `/privacy-policy`, `/terms`, `/cookies`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-otp`, `/student/login`, `/partner/login`, `/employee/login`, `/admin/login`

**What Can Do:**
- Browse 560 universities, 11k courses, 145k intakes, scholarships, services, destinations 19 countries, language prep IELTS/PTE/TOEFL/Duolingo/OIETC/Oxford ELLT/LanguageCert/Kaplan/OET/GRE/GMAT/SAT/ACT/MOI, visa guides, success stories, team, FAQs
- Search/filter/compare courses, save shortlist `/course-finder/saved`, eligibility check AI `/api/ai/eligibility`, match `/api/ai/match`, SOP draft `/api/ai/sop`
- Book free consultation → 10-step workflow: validate, duplicate detect phone/email 30d, create/update leadForm, round-robin counselor least-loaded 7d, timeline InternalComment, notification, audit log, searchLog → `/api/website/lead` and `/api/leads` public POST
- Responsive mobile/tablet/desktop, SEO sitemap (static + 400 unis + dynamic DB), robots, metadata, not-found/error, security headers HSTS CSP X-Frame etc
- Navigation PublicNavbar sticky top branded top bar 3 CTAs WebsiteActionButtons dropdowns Destinations dynamic from DB Language Prep dynamic Resources Portals Student/Partner/Employee mobile Sheet accordion PublicFooter 4 columns social legal map PublicLayoutWrapper hides nav/footer after login isAuthenticated check no double nav PublicCommunicationBar floating widget WhatsApp 01805020101 office Barek Mansion-02 Panthapath Dhaka 24/7

**What Added:**
- 4-part homepage Part1 hero carousel 7 WebP banners (UK/USA/Canada/Australia/NZ/Europe) search stats AnimatedCounter, Part2 destinations grid popular cities intakes, Part3 services English tests success stories FAQs, Part4 contact footer map
- Destinations each slug 5 subpages universities/courses/scholarships/visa-guide/cost-calculator/admission-requirements with verified flag tuitionRange workRights visaType overview
- UniversitiesListing search by name/country/city fetches /api/universities?limit=50&status=active logo ranking city founded students IELTS min matchScore UniversityHub detail courses scholarships requirements
- CourseDetailHub duration tuition intake IELTS campus deadlines comparison save shortlist CourseDetailHub
- ScholarshipsListing ScholarshipDetailHub fetches /api/scholarships fallback MASTER_SCHOLARSHIPS_DATA coverageType country flag provider awardAmount eligibility deadline 100% verified funding
- Services 14 DB-driven via /api/services cards heroImage h-44 benefits CheckCircle2 CTA eligibility ServiceDetailHub FAQs related content
- Language Prep MasterLanguagePrepLandingView MasterTestPrepView 15 static ielts/pte-academic/toefl/moi etc + [slug] dynamic + comparison page
- Contact PublicConsultationPage form maps WhatsApp office
- Auth pages no prefilled demo creds password reset EmployeeActivationToken session regeneration loginAttempt IP logging
- 34 rewrites in next.config.ts for booking/about/language-prep/portals/legal/destinations/courses

---

## 2. Student Portal — /student/* (34 pages)

**Who Can Access:** Role STUDENT, status ACTIVE, 7-day session via portal-auth/login bcrypt

**Nav Registry (portal-nav.ts student):** Home, My Profile, Find Courses, My Shortlist, My Applications, Documents badge pending, Tasks & Deadlines, Appointments, Messages, Payments, AI Study Assistant, Help & Support

**Routes (34):**
- `/student/dashboard`, `/student/profile`, `/student/course-finder`, `/student/favorites` shortlist, `/student/applications`, `/student/documents`, `/student/onboarding` tasks & deadlines, `/student/appointments`, `/student/messages`, `/student/payments`, `/student/ai-advisor`, `/student/help`
- `/student/ai-assistant`, `/student/ai-matcher`, `/student/ai-recommendations`, `/student/compare`, `/student/cv`, `/student/english-prep`, `/student/english-prep/profile`, `/student/interview-prep`, `/student/mock-tests`, `/student/notifications`, `/student/referrals`, `/student/referrals/[id]`, `/student/register`, `/student/shortlist`, `/student/sop`, `/student/timeline`, `/student/visa-checklist`, `/student/visa-interview-practice`, `/student/visa/checklist`, `/student/visa/page`, `/student/visa/readiness`, `/student/login`, `/student/register`

**What Can Do:**
- Dashboard 6 KPIs My Leads/Students/Hot Leads/Followups/Profile Completion/Application-Ready + hotLeads/todayFollowups + timeline + appointments + payments + notifications
- Profile: PortalStudentProfile Student model education passport English tests work experience funding admission preferences profile completion application-ready, edit sections StudentProfileSection, education, passport, English tests, work experience, recommendations, visa history, funding, admission preferences
- Course Finder: 560 unis 11k courses 145k intakes filters country level intake budget English test, 11k+ courses, matchScore, save shortlist, compare CourseComparison, AI match via /api/ai/match eligibility via /api/ai/eligibility, international-course-agent 6 levels Foundation GPA 2.8 IELTS 5.5 Bachelor 3.0 6.0 Master 3.0 6.5 MRes 3.2 PhD 3.5 + branch campus + deadline + tuition + supervisor matching + research proposal help, verification no course omitted
- Applications: View assigned, track pipeline draft→enrolled, timeline events, comments student_visible vs internal, offer management, CAS/I-20/CoE, deadlines, document requests, upload docs
- Documents: Upload via /api/documents/auto-upload private storage never public/uploads FILE_SIGN_SECRET >=32 private download /api/documents/download/ auth file-validator allowed types/max size versioning V1/V2/V3 no permanent delete sharing allowlist student_verified/university_official/partner_official/alo_official/authorized_employee, DocumentAudit
- Visa Center: checklist, readiness report VisaReadinessReport, funding review, study gap, refusal, interview practice AI 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness Bangladeshi English one Q at a time, scoring recording human final review, readiness assessment
- SOP/CV Studio: SopDraft CvReview AI draft, plagiarism originalityScore
- Scholarships: ScholarshipMatch, search, eligibility
- Payments: view invoices receipts, make payments, refund requests
- Appointments: book with counselor, calendar, notifications
- Messages: unified timeline per entity Lead/Student/Application/Document/Visa/Partner WhatsApp/Email/SMS/Call/Note/Task visibility student_visible vs internal
- AI Advisor: course advisor, eligibility, campus mapper, supervisor matcher, research assistant
- Mock Tests: EnglishTest MockTest TestSession TestAnswer TestResult AiExamFeedback, credits MockTestCredit payments MockTestPayment packages MockTestPackage
- Referrals: create referral, track status, voucher
- Help & Support: FAQs, support request, notifications

**What Added:**
- StudentEnglishPrepProfile component
- AI Study Assistant bot view student-ai-advisor
- Visa checklist/readiness/interview-practice pages
- SOP/CV studio
- Mock tests with AI feedback
- Timeline view
- Shortlist/favorites/compare
- Referrals with voucher codes

---

## 3. Counselor Portal — /counselor/* (18 pages) + Employee Counselor Dashboard

**Who Can Access:** Role EMPLOYEE designation Counselor, scope ASSIGNED, assigned_only can view assigned students/leads

**Nav Registry (counselor):** Workspace My Dashboard, My Leads, Follow-ups, My Students, Applications, Document Requests, Appointments, Messages, Tasks, Reports

**Routes (18):**
- `/counselor/dashboard`, `/counselor/applications`, `/counselor/attendance`, `/counselor/bonus`, `/counselor/commission`, `/counselor/cv`, `/counselor/documents`, `/counselor/email`, `/counselor/hr-self`, `/counselor/inbox`, `/counselor/increment`, `/counselor/marketing/campaigns`, `/counselor/marketing/content`, `/counselor/marketing/image`, `/counselor/marketing/posts`, `/counselor/marketing/video`, `/counselor/social-inbox`, `/counselor/sop`, `/counselor/students`, `/counselor/students/[id]`, `/counselor/tasks`, `/counselor/visa-readiness`, `/counselor/whatsapp`
- Employee: `/employee/counselor-dashboard`, `/employee/leads`, `/employee/students`, `/employee/applications`, `/employee/tasks`, `/employee/inbox`, `/employee/ucc`

**What Can Do:**
- Dashboard My Leads/Students/Hot Leads/Followups/Profile Completion/Application-Ready, hotLeads/todayFollowups, SLA monitoring
- Manage assigned leads: create/edit/tag/assign/status track, MarketingLead score hotLead followUpDueAt, bulk actions export SLA, auto scoring assignment follow-up AI qualification task
- Manage assigned students: view PortalStudentProfile, education, passport, English tests, work exp, funding, preferences, profile completion
- Applications: view assigned applications pipeline, update, request docs, internal comments, timeline, tasks, offer follow-up
- Document Requests: request docs, review, verification, correction requested, approved/rejected, review history
- Appointments: calendar, book, reschedule, notifications, today visitors
- Messages: WhatsApp/Email/SMS/Call/Note/Task unified timeline, UCC AI Reply Assistant suggests replies human review required intent classification sentiment handover triggers complaint urgent legal visa refusal payment dispute angry high-risk confidence low, after-hours qualification Asia/Dhaka
- Tasks: CounselorTask, follow-ups, SLA reminder/warning/escalation, unreplied studentMessage >1h creates HIGH priority
- Reports: performance, conversion, lead quality summary, application summary
- Attendance/Bonus/Commission: own attendance, bonus, commission, salary slip
- HR Self: own profile, documents, agreements, leave, devices, notifications, permission requests, security sessions cannot view another
- Marketing: campaigns content ideas generated content assets templates videos calendar approvals social messages DM threads comments leads scoring reports agent jobs memory audit logs RAG sources improvement proposals
- SOP/CV: review student SOP/CV drafts

**What Added:**
- Counselor dashboard with 6 KPIs
- WhatsApp pool 20 numbers routing webhook all types SLA 30/20/10 follow-up Day 3/7/14/21/25/30 AI intent/sentiment document security alarms cron analytics
- UCC Omnichannel Messaging with AI Reply Assistant
- After-Hours Qualification Agent
- Lead qualification agent auto scoring assignment
- Document intelligence OCR autofill classification

---

## 4. Senior Counselor Portal — senior_counselor role

**Nav Registry:** Team Overview, Unassigned Leads, Team Leads, Assignments, SLA & Escalations, Applications, Team Calendar, Performance Reports

**What Can Do:**
- Team overview, workload, unassigned leads assignment, team leads management, assignments, SLA & escalations monitoring, applications review, team calendar, performance reports
- Scope TEAM/BRANCH/DEPARTMENT, can reassign leads, approve, escalate
- View teamEmployees/teamAttendance/teamLeave/teamTasks/teamPerformance/pendingApprovals no private salary/HR unless explicitly permitted

**What Added:**
- Team management views
- SLA monitor
- Escalation handling
- Assignment queue

---

## 5. Admissions Portal — admissions role

**Nav Registry:** Admissions Overview, Application Queue, Ready for Review, Submitted, University Decisions, Offer Follow-up, Deadlines, Reports

**What Can Do:**
- Admissions overview, application queue, ready for review, submitted, university decisions, offer follow-up, deadlines, reports
- Application pipeline management, document checklist, offer provenance, serial ALO-UK-2026-000123 sequential per country/year
- Controlled transitions, approval permission for rejected/approved/enrolled, audit APPLICATION_{toState} + EmployeeAuditLog

**What Added:**
- Admissions queue
- University decisions tracking
- Offer follow-up

---

## 6. Document Verification Portal — document_verification role

**Nav Registry:** Review Dashboard, Pending Review, In Review, Correction Requested, Approved, Rejected, Review History

**What Can Do:**
- Review dashboard, pending review, in review, correction requested, approved, rejected, review history, audit logs
- Document verification: StudentDocument, StudentPassport, DocumentAudit, DocumentSecurityIncident, private storage, FILE_SIGN_SECRET, file-validator, versioning V1/V2/V3 no delete, sharing allowlist, originalityScore plagiarismWarning reviewChecklist status draft→review_pending→approved cannot finalize high-risk without human

**What Added:**
- Document security center
- Verification agents
- Review history
- Security incident dashboard alarm

---

## 7. Visa Portal — /visa/* + /employee/visa-* + /crm/visa-*

**Who Can Access:** Role VISA_OFFICER, VISA_INTERVIEW_OFFICER

**Nav Registry (visa):** Visa Overview, My Cases, Checklists, Documents, Appointments, Deadlines, Interview Practice, Case History, Reports

**Routes:**
- `/visa/readiness`
- `/employee/visa-dashboard`, `/employee/visa-cases`, `/employee/visa-documents`, `/employee/visa-interview-dashboard`, `/employee/visa-interview-officer`, `/employee/visa-interviews`, `/employee/visa-interviews/[caseId]`, `/employee/visa-officer`, `/employee/visa-readiness`, `/employee/visa-reports`
- `/crm/visa`, `/crm/visa-cases`, `/crm/visa-dashboard`, `/crm/visa-interviews`, `/crm/visa-interviews/[caseId]`, `/crm/visa-readiness`, `/crm/visa-reports`

**What Can Do:**
- Visa overview, my cases, checklists, documents, appointments, deadlines, interview practice, case history, reports
- VisaCase, VisaInterview, VisaInterviewQuestion, VisaInterviewAnswer, VisaMockResult, VisaOfficerNote, VisaRiskAssessment, VisaFundingReview, VisaStudyGapReview, VisaRefusalReview, VisaSensitiveReview, VisaStudentFeedback, VisaTask, VisaReport
- Funding review, study gap, refusal analysis, sensitive review, feedback, tasks, checklist, AI interview practice scoring recording human final review, readiness assessment
- 25 doc types statuses actions versioning soft-delete only, two-layer notes student-safe feedback reuse comms, task 10 types, student portal safe only, counselor assigned no sensitive, reports sensitive elevated, security negative tests 20+ PASS, evidence A-N
- AI 9 types one Q at a time Bangladeshi English: Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness, scoring recording human final review, rejection history service charge approved template course finder HR analytics role widgets notification no sensitive leak audit log

**What Added:**
- Visa Readiness Report
- Interview practice AI 9 types
- Funding review, study gap, refusal, sensitive review
- Risk assessment
- Visa officer dashboard
- Interview officer evidence report A-N

---

## 8. Front Desk Portal — front_desk role

**Nav Registry:** Front Desk Home, New Enquiry, Walk-ins, Appointments, Lead Lookup, Today's Visitors, Handover Queue

**What Can Do:**
- Front desk home, new enquiry creation, walk-ins, appointments, lead lookup, today's visitors, handover queue
- Create leads, check duplicate phone/email 30d, assign to counselor round-robin least-loaded 7d, create follow-up task 1d, AI qualification task

**What Added:**
- Front desk dashboard
- Walk-ins management
- Handover queue

---

## 9. Marketing Portal — /marketing/* + /counselor/marketing/* + /crm/marketing/*

**Who Can Access:** MARKETING_MANAGER, ADMIN, SUPER_ADMIN

**Nav Registry (marketing):** Marketing Overview, Campaigns, Content Calendar, Content Studio, Assets, Approvals, Landing Pages, Audience Segments, Lead Attribution, Reports, Integrations

**Routes:**
- CRM: `/crm/marketing`, `/crm/marketing-manager`, `/crm/social`, `/crm/communications/broadcasts`, `/crm/communications/templates`, `/crm/communications/social-inbox`
- Employee: `/employee/marketing-dashboard`, `/employee/marketing-manager-dashboard`
- Counselor: `/counselor/marketing/campaigns`, `/counselor/marketing/content`, `/counselor/marketing/image`, `/counselor/marketing/posts`, `/counselor/marketing/video`

**What Can Do:**
- Marketing overview, campaigns, content calendar, content studio, assets, approvals, landing pages, audience segments, lead attribution, reports, integrations
- MarketingCampaign, MarketingContentIdea, MarketingGeneratedContent, MarketingAsset, MarketingTemplate, MarketingVideo, MarketingCalendar, MarketingApproval, MarketingSocialMessage, MarketingDMThread, MarketingComment, MarketingLead, MarketingLeadScore, MarketingCampaignSource, MarketingReport, MarketingAgentJob, MarketingAgentMemory, MarketingAuditLog, MarketingRagSource, MarketingRagChunk, MarketingImprovementProposal, SocialConnectedAccount, SocialWebhookEvent
- Content ideas, generated content variations, approval workflow, campaign performance, attribution, RAG sources, improvement proposals
- Social messages, DM threads, comments, leads, scoring, reports, agent jobs, memory, audit logs, RAG sources, improvement proposals, social connected accounts, webhook events, profile, brand assets, campaign posts, consent
- AI: caption generator, poster prompt, video script, hashtags, CTA, landing page, follow-up sequence, comment replies, DM qualification, brandCheck/metaPolicyCheck/safetyCheck/visaClaimCheck
- Broadcasts, call logs, inbox, social inbox, templates, settings, WhatsApp analytics

**What Added:**
- Marketing Command Center delivery report
- Content Studio
- Video Studio with Remotion
- Social scheduler
- Image generator
- Marketing automation
- Brand assets
- Campaign analytics
- Lead attribution
- RAG sources

---

## 10. Partner Portal — /partner/* (17 pages)

**Who Can Access:** Role PARTNER, partner_visible scope

**Nav Registry (partner):** Partner Overview, My Referrals, Submit Referral, Referral Status, Documents, Messages, Commission/Settlement, Reports

**Routes (17):**
- `/partner/dashboard`, `/partner/applications`, `/partner/apply/[student_id]/[course_id]`, `/partner/commission`, `/partner/documents`, `/partner/english-prep`, `/partner/leads`, `/partner/login`, `/partner/program/[id]`, `/partner/referrals`, `/partner/register`, `/partner/reports`, `/partner/search-programs`, `/partner/settings`, `/partner/students`

**What Can Do:**
- Partner overview, my referrals, submit referral, referral status, documents, messages, commission/settlement, reports
- Submit referrals, track status, documents, messages, commission, reports, search programs, apply for student/course, English prep
- Referral workflow: create lead, assign, track, commission rule, paymentCondition, B2B commission
- Commission: view earnings, settlements, invoices, receipts, reconciliation

**What Added:**
- Partner dashboard
- Referral status tracking
- Commission settlement
- Search programs
- Apply for student/course

---

## 11. Partner Admin Portal — /partner-admin/* (20+ pages)

**Who Can Access:** Partner Super Admin

**Routes (20+):**
- `/partner-admin/dashboard`, `/partner-admin/applications`, `/partner-admin/company-profile`, `/partner-admin/content-generator`, `/partner-admin/course-finder`, `/partner-admin/documents`, `/partner-admin/image-generator`, `/partner-admin/interview-prep`, `/partner-admin/leads`, `/partner-admin/marketing-studio`, `/partner-admin/mock-tests`, `/partner-admin/reports`, `/partner-admin/roles`, `/partner-admin/settings`, `/partner-admin/social-scheduler`, `/partner-admin/students`, `/partner-admin/support-request`, `/partner-admin/usage-quota`, `/partner-admin/users`, `/partner-admin/users/create`, `/partner-admin/video-generator`, `/partner-admin/voucher-codes`

**What Can Do:**
- Partner admin dashboard, company profile, content generator, course finder, documents, image generator, interview prep, leads, marketing studio, mock tests, reports, roles, settings, social scheduler, students, support request, usage quota, users create, video generator, voucher codes
- Leads/students/marketing-studio/social-scheduler/video-generator/roles/settings, quota, packages, assignments, marketing quota usage
- Quota management: STARTER/GROWTH/PREMIUM editable quota check->allow/reject->record extra quota workflow, student benefits voucher feature access helpers mandatory backend checks
- Marketing studio, social scheduler, video generator, content generator, image generator
- User management, role permissions, usage quota, voucher codes

**What Added:**
- Partner Admin dashboard
- Marketing Studio
- Social Scheduler
- Video Generator
- Image Generator
- Content Generator
- Usage Quota
- Voucher Codes
- Roles management
- Support request

---

## 12. Data Portal — data role

**Nav Registry:** Data Overview, Universities, Campuses, Courses, Intakes, Scholarships, Sources & Verification, Import/Export, Validation Queue, Change History

**What Can Do:**
- Data overview, universities, campuses, courses, intakes, scholarships, sources & verification, import/export, validation queue, change history
- University Data Management: CrmUniversity, CrmCourse, CrmCourseIntakeFee, CrmCourseRequirement, CrmScholarship, CrmRanking, CrmDiscoverySource, CrmSourceVerificationEvent, OfficialSource, SourceSnapshot, VerificationRun, DataChange, DataConflict, UniversityDigitalTwin, UniversityResearchEvidence, lastVerifiedAt
- Import Center: ImportBatch, CrmImportBatch, field mappings, duplicates detection, merge, preview, approve, execute, rollback, student batch, universities, courses, scholarships, CSV validation, provenance, source logs
- Source verification, data conflicts, data freshness, verification agents, university data updates, duplicates merge, publish, run-scan, source-logs, updates approve/edit/publish/reject/rollback

**What Added:**
- Data overview
- Source verification
- Import center
- Data conflicts
- Data freshness
- Verification agents
- University data updates

---

## 13. Finance Portal — finance role + /crm/hrm/payroll etc

**Nav Registry:** Finance Overview, Invoices, Payments, Receipts, Refund Requests, Reconciliation, Reports

**Routes:**
- `/employee/finance-dashboard`
- `/crm/hrm/payroll`, `/crm/hrm/analytics`, etc

**What Can Do:**
- Finance overview, invoices, payments, receipts, refund requests, reconciliation, reports
- Payment, Commission, Payroll, invoices, receipts, refunds, reconciliation, commission rule, paymentCondition, B2B commission
- Revenue, commission, payments, invoices, receipts, refunds, reconciliation
- Payroll workflow draft→review_pending→reviewed→approved→paid→rejected, AI cannot finalize high-risk

**What Added:**
- Finance dashboard
- Commission management
- Payroll workflow
- Reconciliation
- Invoices/receipts

---

## 14. HR Portal — hr role + /crm/hrm/*

**Nav Registry:** My Workspace, Employee Directory, Tasks, Calendar, Leave/Attendance, Training, Announcements, HR Reports

**Routes:**
- `/employee/hr-dashboard`
- `/crm/hrm/*`: agreements, analytics, attendance, devices, documents, exit, leave, notices, page, payroll, profile, security
- `/counselor/hr-self`, `/counselor/attendance`, `/counselor/bonus`, `/counselor/increment`

**What Can Do:**
- My workspace, employee directory, tasks, calendar, leave/attendance, training, announcements, HR reports
- Employee, EmployeeHRProfile, attendance, leave, salary, bonus, performance, documents, device, agreement digital signature immutable, payroll workflow draft→review_pending→reviewed→approved→paid→rejected, AI cannot finalize high-risk
- Attendance never webcam, leave 7 types balances, payroll draft->human check->approval AI cannot finalize high-risk, device/login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious, social/WhatsApp/email/phone/AI/application/student/document/finance/visa/marketing/partner/B2B/quota permission-controlled phone_normalized, secure download signed URLs expiry audit soft-delete versioning, SLA reminder/warning/escalation, application workflow controlled transitions document checklist offer provenance serial ALO-UK-2026-000123 two comment systems student-visible vs internal never shown university payment verified bank post-offer bank guidance labeled interview research/prep/practice/scoring/recording/human final review rejection history service charge approved template course finder HR analytics role widgets notification no sensitive leak audit log LOGIN/LOGOUT/ACCOUNT_CREATED/APPROVED/SUSPENDED/ROLE_CHANGED/PERMISSION_GRANTED/REVOKED/PROFILE_VIEWED/SALARY_VIEWED/CHANGED/DOCUMENT_VIEWED/DOWNLOADED/UPLOADED/REJECTED/VERIFIED/APPLICATION_VIEWED/CHANGED/SUBMITTED/PAYMENT_CREATED/VIEWED/APPROVED/WHATSAPP_SENT/EMAIL_SENT/CALL_LOGGED/AI_USED/EXPORT/REASSIGNMENT/ESCALATION actor_id/role/action/target/old/new/reason/approval/timestamp/IP/session no history deletion soft-delete deactivation revoke preserve history reassignment nothing silent AI READ/ANALYZE/SUMMARIZE/CLASSIFY/DRAFT/RECOMMEND/PREPARE high-risk requires human partner STARTER/GROWTH/PREMIUM editable quota check->allow/reject->record extra quota workflow student benefits voucher feature access helpers mandatory backend checks database 18 models security RBAC+ABAC+CSRF+prepared+validation+rate limiting+secure sessions+MFA+encrypted+protected storage signed URLs+expiry+audit+soft delete+versioning file storage protected download checks APIs secure auth+authz+validation+error+audit notification in-app/email/WhatsApp/SMS no leak reporting self-audit 40 tests 100% PASS

**What Added:**
- HR dashboard headcount/attendanceRate/late%/absent%/leave%/payrollCost/departmentCost/newJoiners/resignations/probation/upcomingConfirmation/birthdays/workAnniversaries/expiringContracts/missingDocuments widgets
- Employee directory
- Attendance/leave management
- Payroll workflow
- Device management
- Agreement digital signature immutable
- Security sessions
- Performance reports

---

## 15. Department Head Portal — department_head role

**Nav Registry:** Department Overview, Team Workload, SLA, Escalations, Applications, Reports

**What Can Do:**
- Department overview, team workload, SLA, escalations, applications, reports
- Scope TEAM/BRANCH/DEPARTMENT, teamEmployees/teamAttendance/teamLeave/teamTasks/teamPerformance/pendingApprovals

**What Added:**
- Department overview
- Team workload
- SLA monitoring
- Escalations

---

## 16. COO Portal — coo role

**Nav Registry:** Operations Overview, Company Metrics, Branch Performance, SLA Overview, Escalations, Financial Overview, HR Overview, System Health

**What Can Do:**
- Operations overview, company metrics, branch performance, SLA overview, escalations, financial overview, HR overview, system health
- Global scope, view all branches, performance, financial, HR, system health

**What Added:**
- Operations overview
- Company metrics
- Branch performance
- System health

---

## 17. Employee Portal — /employee/* (36 pages) — Unified Employee OS

**Who Can Access:** Role EMPLOYEE/ADMIN various designations Chairman/CEO/Director/Office Manager/Counselor/Senior Counselor/Application Manager/Visa Officer etc permission matrix least privilege

**Routes (36):**
- `/employee/dashboard`, `/employee/profile`, `/employee/leads`, `/employee/students`, `/employee/applications`, `/employee/tasks`, `/employee/inbox`, `/employee/ucc`, `/employee/attendance`, `/employee/counselor-dashboard`, `/employee/senior-counselor-dashboard`, `/employee/branch-manager-dashboard`, `/employee/country-manager-dashboard`, `/employee/office-manager-dashboard`, `/employee/partner-manager-dashboard`, `/employee/finance-dashboard`, `/employee/hr-dashboard`, `/employee/marketing-dashboard`, `/employee/marketing-manager-dashboard`, `/employee/application-dashboard`, `/employee/application-manager-dashboard`, `/employee/front-desk-dashboard`, `/employee/support-dashboard`, `/employee/my-accounts`, `/employee/visa-dashboard`, `/employee/visa-cases`, `/employee/visa-documents`, `/employee/visa-interview-dashboard`, `/employee/visa-interview-officer`, `/employee/visa-interviews`, `/employee/visa-interviews/[caseId]`, `/employee/visa-officer`, `/employee/visa-readiness`, `/employee/visa-reports`, `/employee/login`, `/employee/page`

**What Can Do:**
- Dashboard per designation: ownProfile/ownDocuments/ownAgreements/ownAttendance/ownLeave/ownSalarySlip/ownDevices/ownNotifications/ownPermissionRequests/ownSecuritySessions cannot view another, Manager dashboard scope team/branch/department teamEmployees/teamAttendance/teamLeave/teamTasks/teamPerformance/pendingApprovals no private salary/HR unless explicitly permitted
- Profile: own profile, documents, agreements, attendance, leave, salary slip, devices, notifications, permission requests, security sessions
- Leads/Students/Applications: assigned_only scope, view assigned, update, send WhatsApp/Email, upload on behalf, request docs, internal comments
- Tasks: CounselorTask, follow-ups, SLA
- Inbox/UCC: unified communication, WhatsApp/Email/SMS/Call/Note/Task, AI Reply Assistant
- Visa: dashboard/cases/interviews/documents/readiness/reports, funding review, study gap, refusal, sensitive review, feedback, tasks, checklist, AI interview practice scoring recording human final review
- Partner: dashboard, referrals, commission
- Marketing: dashboard, campaigns, content
- Finance: dashboard, payments, commissions
- HR: dashboard, attendance, leave, payroll
- Front Desk: dashboard, new enquiry, walk-ins, appointments
- Support: dashboard, tickets
- Branch Manager: dashboard, team, branch performance
- Office Manager: dashboard, office management
- Country Manager: dashboard, country performance
- Application Dashboard/Manager: dashboard, applications, B2B, CAS, deadlines, offers
- My Accounts: own accounts, permissions

**What Added:**
- Employee Dashboard Operating System Complete — 18 models extended, 30+ APIs, centralized ROLE+DESIGNATION+PERMISSION+SCOPE+OBJECT+FIELD+WORKFLOW+APPROVAL+QUOTA+TEMPORARY+AUDIT least privilege, Master Control Center 26 tabs, activation INVITED->ACTIVE hashed one-time token expiry, private visibility Employee+SuperAdmin+Chairman+HR explicit, document versioning V1/V2/V3 no delete, HR agreement immutable, ACCEPT vs APPROVE separation, Separation of Duties MAKER->REVIEWER->APPROVER no self-approval, permission matrices, scope GLOBAL/COUNTRY/BRANCH/OFFICE/DEPARTMENT/TEAM/ASSIGNED/OWN, object+field security, temporary auto-revoke, permission request REQUESTED->REVIEWING->APPROVED/REJECTED->ACTIVE, break-glass reason/approver/expiry audit, attendance never webcam, leave 7 types balances, payroll draft->human check->approval AI cannot finalize high-risk, device/login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious, social/WhatsApp/email/phone/AI/application/student/document/finance/visa/marketing/partner/B2B/quota permission-controlled phone_normalized, secure download signed URLs expiry audit soft-delete versioning, SLA reminder/warning/escalation, application workflow controlled transitions document checklist offer provenance serial ALO-UK-2026-000123 two comment systems student-visible vs internal never shown university payment verified bank post-offer bank guidance labeled interview research/prep/practice/scoring/recording/human final review rejection history service charge approved template course finder HR analytics role widgets notification no sensitive leak audit log 40 tests 100% PASS
- UnifiedPortalShell
- PortalDashboards
- HrWidgets
- StudentEnglishPrepProfile

---

## 18. Admin Portal — /admin/* (45 pages)

**Who Can Access:** ADMIN, SUPER_ADMIN

**Routes (45):**
- `/admin/dashboard`, `/admin/login`, `/admin/access-control-center`, `/admin/agent-center`, `/admin/ai-command-center`, `/admin/ai-monitor`, `/admin/approvals`, `/admin/audit-logs`, `/admin/branch-control`, `/admin/branches`, `/admin/change-approval`, `/admin/countries`, `/admin/countries/create`, `/admin/countries/edit/[id]`, `/admin/country-control`, `/admin/courses`, `/admin/courses/create`, `/admin/courses/edit/[id]`, `/admin/data-conflicts`, `/admin/data-freshness`, `/admin/data-import`, `/admin/data-import/[batchId]`, `/admin/data-import/history`, `/admin/data-import/new`, `/admin/data-review`, `/admin/data-sources`, `/admin/destinations`, `/admin/document-security`, `/admin/employee-control`, `/admin/employees`, `/admin/homepage-builder`, `/admin/import-center/city-living-costs`, `/admin/import-center/countries`, `/admin/import-center/country-facts`, `/admin/import-center/country-pages`, `/admin/import-center/courses`, `/admin/import-center/scholarships`, `/admin/import-center/students`, `/admin/import-center/universities`, `/admin/import-center/visa-rules`, `/admin/integration-center`, `/admin/integration-wizard`, `/admin/language-tests`, `/admin/marketing-automation`, `/admin/permission-matrix`, `/admin/reports`, `/admin/role-permissions`, `/admin/security`, `/admin/settings`, `/admin/settings/digital-assets`, `/admin/sla-monitor`, `/admin/source-verification`, `/admin/system-builder`, `/admin/universities`, `/admin/universities/create`, `/admin/universities/edit/[id]`, `/admin/university-data`, `/admin/university-data/duplicates`, `/admin/university-data/updates`, `/admin/university-data-updates`, `/admin/verification-agents`, `/admin/video-studio`, `/admin/whatsapp-analytics`, `/admin/whatsapp-followup`, `/admin/whatsapp-numbers`

**What Can Do:**
- Access-control-center, agent-center, ai-command-center, ai-monitor, approvals, audit-logs, branch-control, branches, change-approval, countries create/edit, courses create/edit, dashboard, data-conflicts, data-freshness, data-import batch history new, data-review, data-sources, destinations, document-security, employee-control, employees, homepage-builder, import-center city-living-costs/countries/country-facts/country-pages/courses/scholarships/students/universities/visa-rules, integration-center, integration-wizard, language-tests, login, marketing-automation, permission-matrix, reports, role-permissions, security, settings/digital-assets, sla-monitor, source-verification, system-builder, universities create/edit, university-data-updates, university-data duplicates/page/updates, verification-agents, video-studio, whatsapp-analytics/followup/numbers
- Super Admin sees everything, can create users, assign roles, suspend, manage leads/students/partners/applications/B2B, courses/countries/universities, office/destination, email/facebook/marketing, finance/commission, audit logs, system health, Master Communication Center
- Homepage builder, integration center, system builder, video studio, WhatsApp analytics
- Data management, source verification, data conflicts, data freshness, import center, verification agents
- Employee control, branch control, country control, permission matrix, role permissions, security, audit logs, SLA monitor, approvals, change approval
- Marketing automation, language tests, document security, digital assets

**What Added:**
- Access Control Center
- Agent Center
- AI Command Center
- AI Monitor
- Branch Control
- Country Control
- Data Conflicts
- Data Freshness
- Data Import
- Data Sources
- Document Security
- Employee Control
- Homepage Builder
- Import Center 9 types
- Integration Center
- Integration Wizard
- Marketing Automation
- Permission Matrix
- SLA Monitor
- Source Verification
- System Builder
- University Data
- Verification Agents
- Video Studio
- WhatsApp Analytics/Followup/Numbers

---

## 19. Super Admin Portal — /super-admin/* + /admin/* + /crm/super-admin/*

**Who Can Access:** SUPER_ADMIN

**Routes:**
- `/crm/super-admin`, `/crm/super-admin/roles`
- Admin routes above plus super-admin specific

**What Can Do:**
- System overview, users, roles, departments/branches, workflow settings, data management, integrations, AI command center, audit logs, security, jobs/queues, system health, backup/recovery
- Dashboard total/active/pendingActivation/pendingProfileReview/pendingPermissionRequests/suspended/missingDocuments/upcomingContractExpiry/securityAlerts/payrollStatus/attendance/leave/permissionChanges/recentAudit/partnerUsage/quotaUsage/systemHealth master control 26 sections
- Create users, assign roles, suspend, manage leads/students/partners/applications/B2B, courses/countries/universities, office/destination, email/facebook/marketing, finance/commission, audit logs, system health, Master Communication Center
- Role permissions, permission matrix, access-control-center, security, audit logs, branch control, country control, system builder, integration center, AI command center, AI monitor, verification agents, video studio, WhatsApp analytics

**What Added:**
- Super Admin Control Center Ready — dashboard enhanced system overview users roles departments/branches workflow settings data management integrations AI command center audit logs security jobs/queues system health backup/recovery
- Master Control Center 26 tabs
- System Builder
- Integration Center
- AI Command Center
- Verification Agents

---

## 20. CRM Portal — /crm/* (35 pages)

**Who Can Access:** ADMIN, SUPER_ADMIN, COUNSELOR (assigned_only), APPLICATION_TEAM, VISA_OFFICER, etc per ROLE_ROUTES

**Routes (35):**
- `/crm/dashboard`, `/crm/applications`, `/crm/application/[id]`, `/crm/b2b-applications`, `/crm/cas-i20-coe`, `/crm/communications/broadcasts`, `/crm/communications/call-logs`, `/crm/communications/inbox`, `/crm/communications/settings`, `/crm/communications/social-inbox`, `/crm/communications/templates`, `/crm/countries`, `/crm/country-data-review`, `/crm/country/[id]`, `/crm/course-finder`, `/crm/course/[id]`, `/crm/courses`, `/crm/decision-pending`, `/crm/hrm/*` agreements/analytics/attendance/devices/documents/exit/leave/notices/page/payroll/profile/security, `/crm/inbox`, `/crm/integration-center`, `/crm/language-prep`, `/crm/marketing`, `/crm/marketing-manager`, `/crm/morning-summary`, `/crm/offer-letter-management`, `/crm/sla`, `/crm/social`, `/crm/source-verification`, `/crm/super-admin`, `/crm/super-admin/roles`, `/crm/ucc`, `/crm/universities`, `/crm/university/[id]`, `/crm/visa`, `/crm/visa-cases`, `/crm/visa-dashboard`, `/crm/visa-interviews`, `/crm/visa-interviews/[caseId]`, `/crm/visa-readiness`, `/crm/visa-reports`, `/crm/whatsapp`

**What Can Do:**
- Dashboard, users, roles, permissions, leads, students, analytics, partners, applications, documents, communications, WhatsApp, social, reports, audit-logs, settings, finance, commissions, marketing, hrm, ai-command, tasks, appointments, course-finder, universities, visa, visa-dashboard, visa-cases, visa-interviews, visa-readiness, visa-reports, import-center, university-updates, access-control-center, scholarships, support, inbox, seo-dashboard, marketing hub
- Leads: GET search/status/source/hotLead/counselorId/sort/page/limit POST create validation audit log MarketingLead table score hotLead followUpDueAt bulk actions export SLA
- Students: PortalStudentProfile Student model education passport English tests work experience funding admission preferences profile completion application-ready
- Applications: full pipeline draft→enrolled controlled transitions approval permission for rejected/approved/enrolled audit APPLICATION_{toState} + EmployeeAuditLog B2B CAS/I-20/CoE deadlines offer management document review submission queue comments timeline tasks
- Documents: private storage never public/uploads FILE_SIGN_SECRET >=32 private download auth file-validator allowed types/max size versioning V1/V2/V3 no delete sharing allowlist
- Communications UCC: Thread Message Template SocialInbox AiReplyDraft CallLog Broadcast Recipient OtpLog unified timeline per entity Lead/Student/Application/Document/Visa/Partner WhatsApp/Email/SMS/Call/Note/Task visibility student_visible vs internal after-hours qualification SLA reminder/warning/escalation unknown contact matching
- Tasks & Appointments: CounselorTask Appointment SlaEvent weekly reports
- Finance: Payment Commission Payroll invoices receipts refunds reconciliation commission rule paymentCondition B2B commission
- HRM: Employee EmployeeHRProfile attendance leave salary bonus performance documents device agreement digital signature immutable payroll workflow draft→review_pending→reviewed→approved→paid→rejected AI cannot finalize high-risk
- Audit & Security: AuditLog PortalAuditLog AloAuditLog LoginAttempt DocumentAudit SensitiveDataRevealLog role/permission changes login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious
- Import Center: ImportBatch CrmImportBatch field mappings duplicates detection merge preview approve execute rollback student batch universities courses scholarships CSV validation provenance source logs
- University Data Management: CrmUniversity CrmCourse CrmCourseIntakeFee CrmCourseRequirement CrmScholarship CrmRanking CrmDiscoverySource CrmSourceVerificationEvent OfficialSource SourceSnapshot VerificationRun DataChange DataConflict UniversityDigitalTwin UniversityResearchEvidence lastVerifiedAt
- Visa: cases interviews readiness reports funding review study gap refusal sensitive review feedback tasks checklist AI interview practice scoring recording human final review
- Marketing: campaigns content ideas generated content assets templates videos calendar approvals social messages DM threads comments leads scoring reports agent jobs memory audit logs RAG sources improvement proposals social connected accounts webhook events profile brand assets campaign posts consent
- HRM: employees attendance leave payroll devices agreements documents analytics role widgets
- Integration Center, language prep, morning summary, offer letter management, SLA, social, source verification, super admin roles, UCC, universities, visa, WhatsApp

**What Added:**
- CRM dashboard
- UCC Omnichannel Messaging
- WhatsApp Business Platform
- Social inbox
- Broadcasts
- Call logs
- Templates
- HRM analytics
- Payroll
- Agreements
- Devices
- Security
- Marketing manager
- Morning summary
- Offer letter management
- SLA monitor
- Source verification
- Super admin roles
- Visa cases dashboard
- Visa interviews
- Visa readiness
- Visa reports

---

## 21. Application Manager Portal — /application-manager/* (17 pages)

**Who Can Access:** Role APPLICATION_TEAM, 19 functions, serial ALO-UK-2026-000123 sequential per country/year

**Routes (17):**
- `/application-manager/dashboard`, `/application-manager/applications`, `/application-manager/application/[id]`, `/application-manager/b2b`, `/application-manager/b2b/create`, `/application-manager/b2b/provider/[id]`, `/application-manager/b2b/providers`, `/application-manager/cas-i20-coe`, `/application-manager/comments`, `/application-manager/create`, `/application-manager/deadlines`, `/application-manager/direct`, `/application-manager/document-review`, `/application-manager/offer-management`, `/application-manager/partner`, `/application-manager/reports`, `/application-manager/settings`, `/application-manager/submission-queue`, `/application-manager/tasks`

**What Can Do:**
- Dashboard, applications direct/partner/b2b, b2b providers, cas-i20-coe, deadlines, offer-management, document-review, submission-queue, comments, reports, settings, create, tasks
- Manage application pipeline draft→enrolled, B2B providers GLOBAL_B2B COUNTRY_SPECIFIC_B2B UNIVERSITY_REPRESENTATIVE PATHWAY_PROVIDER AGGREGATOR SUB_AGENT_NETWORK DIRECT_UNIVERSITY_CHANNEL, CAS/I-20/CoE, deadlines, offer management, document review, submission queue, reports
- Direct/Partner/B2B: create, provider/[id], providers, b2b/create
- Offer Management: offer letter, CAS/I-20/CoE, deadlines, offer pending/received/accepted, payment pending/verified
- Document Review: review, verification, correction requested, approved/rejected
- Submission Queue: queue, submitted, under review, document check, offer pending
- Comments: student_visible vs internal, timeline, tasks
- Reports: application reports, performance
- Settings: application settings
- Tasks: tasks, deadlines
- Serial ALO-UK-2026-000123 sequential per country/year, controlled transitions, approval permission for rejected/approved/enrolled, audit APPLICATION_{toState} + EmployeeAuditLog, B2B applications, CAS/I-20/CoE, deadlines, offer management, document review, submission queue, comments, timeline, tasks

**What Added:**
- Application Manager Portal B2B Ready — Complete Application Manager Portal + Direct/Partner/B2B + Offer/CAS-I20-COE + Document Review + Visa Handover + Confidential B2B Security — PRODUCTION READY
- B2B providers management
- CAS/I-20/CoE management
- Offer management
- Document review
- Submission queue
- Direct/Partner/B2B
- Reports
- Settings
- Tasks

---

## 22. Marketing Portal Detailed (Already Covered) + Additional Marketing Features

**What Added in Marketing:**
- Campaigns with goal platform strategy status banglaCaption englishCaption mixedCaption whatsappMessage messengerReply emailCopy smsCopy posterPrompt videoScript voiceScript subtitle thumbnailConcept hashtags cta landingPage followUpSequence commentReplies dmQualification brandCheck metaPolicyCheck safetyCheck visaClaimCheck leadsGenerated hotLeads conversionRate costPerLead roi topContent weakContent countryInterest courseInterest counselorConversion targetCountry targetCourse budget startDate endDate publishedAt approvedById approvedAt createdById
- Content Idea keyword country course intake scholarship language platform audienceType funnelStage ideaType title description trending status
- Generated Content contentType topic keywords language platform tone cta includeImage includeVideo variations approvalRequired targetCountry targetCourse targetStudentType campaignId title body status publishedAt approvedById approvedAt rejectedById rejectedAt rejectionReason
- Asset name type url thumbnail platform campaignId category tags status
- Template name type platform content variables category status
- Video title script banglaVoice englishVoice mixedVoice scenePlan subtitle thumbnail brandOverlay aspectRatio platform status approvedById approvedAt publishedAt
- Calendar title, Approval, Social Message, DM Thread, Comment, Lead, Lead Score, Campaign Source, Report, Agent Job, Agent Memory, Audit Log, Rag Source, Rag Chunk, Improvement Proposal, Social Connected Account, Social Webhook Event
- Video Studio with Remotion entry.tsx, clone-all.sh, health-check, list-video-templates
- Marketing Automation Feedback

---

## 23. Finance Portal Detailed

**What Added:**
- Payment, Commission, Payroll, invoices, receipts, refunds, reconciliation, commission rule, paymentCondition, B2B commission
- Revenue, commission, payments, invoices, receipts, refunds, reconciliation
- Payroll workflow draft→review_pending→reviewed→approved→paid→rejected AI cannot finalize high-risk
- Invoices, receipts, refund requests, reconciliation, reports

---

## 24. HRM Portal Detailed

**What Added:**
- Employee, EmployeeHRProfile, attendance, leave, salary, bonus, performance, documents, device, agreement digital signature immutable
- Attendance never webcam, leave 7 types balances, payroll draft->human check->approval AI cannot finalize high-risk
- Device/login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious
- HR dashboard widgets headcount/attendanceRate/late%/absent%/leave%/payrollCost/departmentCost/newJoiners/resignations/probation/upcomingConfirmation/birthdays/workAnniversaries/expiringContracts/missingDocuments
- Agreements, analytics, attendance, devices, documents, exit, leave, notices, payroll, profile, security

---

## 25. AI Agents & AgentOS — Cross-Portal

**Inventory 8 canonical agents (AI_AGENT_INVENTORY.csv):**
- alo_cmd_orchestrator Super Admin AI Command Center Platform Governance COMPANY READ_ONLY/APPROVAL_REQUIRED
- alo_reply_assistant UCC AI Reply Assistant Omnichannel Messaging ASSIGNED SAFE_ACTION Human Review
- alo_ocr_agent Document Intelligence Agent OCR & Autofill ASSIGNED APPROVAL_REQUIRED High-Risk
- alo_office_hours_agent After-Hours Qualification Agent Lead Qualification ALL SAFE_ACTION
- alo_international_course_advisor International Course Advisor 6 Levels + Branch Campus + Deadline + Supervisor + Research Course Discovery & Research Guidance ASSIGNED SAFE_ACTION
- alo_campus_mapper Campus-Course Mapper Branch Campus Handler Campus & Course Linkage ASSIGNED READ_ONLY
- alo_supervisor_matcher MRes/PhD Supervisor Matcher Research Supervisor Identification ASSIGNED SAFE_ACTION
- alo_research_assistant Research Coursework & Paper Assistant MRes/PhD Research Support ASSIGNED SAFE_ACTION

**Real Work:**
- Lead Qualification Agent: after-hours unreplied >1h creates CounselorTask HIGH scores HOT/WARM/COLD/URGENT reasons auto-assign least-loaded 7d
- Course Advisor Agent 6 Levels: loads 560 universities 11k courses 145k intakes campuses tuition deadlines for student profile highestQualification GPA English test desiredSubject programLevels countries budget researchInterest scores courses subject match 40 related 35 partial 20 GPA threshold IELTS threshold budget country/city returns matchedCourses matchScore reasons eligibility eligible true/false reason deadlines intake/deadline/status/daysLeft tuition campus summary supervisors via supervisor-matcher research help via research-assistant verification totalUniversities/totalCourses/levels/campusCoverage/internationalCoverage
- Campus-Course Mapper: branch campus handler getCampusesForUniversity getCoursesForCampus branchCampusesSummary verifyNoCourseOmitted
- Supervisor Matcher MRes/PhD: finds supervisors for research interest
- Research Assistant: coursework paper assistant proposal/literature help
- Document Intelligence OCR: autofill classification originalityScore plagiarismWarning reviewChecklist status draft→review_pending→approved cannot finalize high-risk without human
- UCC Reply Assistant: suggests replies for WhatsApp/Email/SMS human review required intent classification sentiment handover triggers complaint urgent legal visa refusal payment dispute angry/high-risk confidence low
- After-Hours Agent: qualification when office closed Asia/Dhaka timezone
- AI Command Center: lead quality summary course match document missing detector application summary visa readiness checker interview question generator marketing caption generator email draft generator WhatsApp reply draft B2B follow-up reminder report summary all draft only cannot publish/send/approve/delete without permission cannot guarantee visa riskFlags cannot expose B2B/private data to unauthorized
- Marketing AI: content ideas generated content variations approval workflow campaign performance attribution RAG sources improvement proposals
- SEO & Content Intelligence: content opportunities dependencies DNA stale detection related content impact analysis keyword research ghost publishing publish-engine
- AgentOS: Department activation One Department → One Model → Tests → Real Task → Approval → Activation SEO first rollout groq:llama-3.1-8b-instant PUBLIC no fallback 15 cron jobs SLA monitoring every minute agent schedules WhatsApp followups 5min sitemap 03:00 DB backup 02:00 session cleanup hourly temp file cleanup 04:00 reports 06:00 university verification 05:00 intake alerts hourly email queue 5min scholarship expiry 01:00 ranking weekly Monday 07:00 document expiry 08:00 analytics hourly all Asia/Dhaka distributed locking

**Counts:** Canonical workforce 2000 AiEmployee SUPERVISOR/MANAGER/COORDINATOR/SPECIALIST, Legacy operational 54 AiAgent ACTIVE PAUSED IDLE, Registry 19 AiAgentRegistry runtime config, Skills AiSkill PromptTemplate AiSop AiEngine etc, Cron 15 jobs verified Asia/Dhaka locking enabled

**What Can Do With AI Across Portals:**
- Auto lead intake → scoring → assignment → follow-up → AI qualification → notification → audit 10-step
- Student asks Find MSc Data Science UK Jan 2027 under £15000 IELTS 6.5 → course advisor returns eligible courses with deadlines tuition campus supervisor research help
- Counselor gets AI suggested reply for WhatsApp must approve before send
- Document upload → OCR → autofill → classification → missing detector → checklist
- Visa officer gets readiness score risk assessment interview questions funding review
- Marketing gets caption poster prompt video script hashtags CTA landing page follow-up sequence comment replies DM qualification brandCheck/metaPolicyCheck/safetyCheck/visaClaimCheck
- Super Admin monitors AI via AI Command Center can pause/resume via ai-safety lineage tracking replication cycles

---

## Summary: All Portals Count

- **Public Website:** 359 page.tsx, 34 rewrites, 19 destinations, 560 unis, 11k courses, 145k intakes, 15 language prep
- **Student:** 34 pages — dashboard, profile, course-finder, shortlist, applications, documents, tasks, appointments, messages, payments, AI advisor, help, SOP/CV, visa, mock tests, referrals, timeline, etc
- **Counselor:** 18 pages + employee counselor dashboard — leads, students, applications, documents, messages, WhatsApp, tasks, reports, attendance/bonus/commission, HR self, marketing
- **Senior Counselor:** Team overview, unassigned leads, team leads, assignments, SLA escalations, applications, calendar, performance reports
- **Admissions:** Admissions overview, queue, ready for review, submitted, university decisions, offer follow-up, deadlines, reports
- **Document Verification:** Review dashboard, pending/in review/correction/approved/rejected, history
- **Visa:** Visa overview, my cases, checklists, documents, appointments, deadlines, interview practice, history, reports + employee visa dashboards/cases/documents/interviews/officer/readiness/reports + crm visa cases/dashboard/interviews/readiness/reports
- **Front Desk:** Front desk home, new enquiry, walk-ins, appointments, lead lookup, today's visitors, handover queue
- **Marketing:** Marketing overview, campaigns, content calendar, studio, assets, approvals, landing pages, audience segments, lead attribution, reports, integrations + counselor marketing campaigns/content/image/posts/video + crm marketing/marketing-manager/social/communications + employee marketing dashboards
- **Partner:** 17 pages — dashboard, applications, apply student/course, commission, documents, English prep, leads, program, referrals, reports, search programs, settings, students
- **Partner Admin:** 20+ pages — dashboard, applications, company profile, content generator, course finder, documents, image generator, interview prep, leads, marketing studio, mock tests, reports, roles, settings, social scheduler, students, support request, usage quota, users create, video generator, voucher codes
- **Data:** Data overview, universities, campuses, courses, intakes, scholarships, sources & verification, import/export, validation queue, change history
- **Finance:** Finance overview, invoices, payments, receipts, refund requests, reconciliation, reports + employee finance dashboard + crm hrm payroll
- **HR:** My workspace, employee directory, tasks, calendar, leave/attendance, training, announcements, HR reports + employee hr dashboard + crm hrm agreements/analytics/attendance/devices/documents/exit/leave/notices/payroll/profile/security + counselor hr-self/attendance/bonus/increment
- **Department Head:** Department overview, team workload, SLA, escalations, applications, reports
- **COO:** Operations overview, company metrics, branch performance, SLA overview, escalations, financial overview, HR overview, system health
- **Employee:** 36 pages — unified Employee OS with 18 models extended 30+ APIs least privilege Master Control Center 26 tabs activation INVITED->ACTIVE private visibility document versioning HR agreement immutable ACCEPT vs APPROVE Separation of Duties MAKER->REVIEWER->APPROVER scope GLOBAL/COUNTRY/BRANCH/OFFICE/DEPARTMENT/TEAM/ASSIGNED/OWN object+field security temporary auto-revoke permission request break-glass audit attendance never webcam leave 7 types payroll draft->human check->approval device/login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious secure download signed URLs expiry audit soft-delete versioning SLA application workflow two comment systems payment verified bank guidance interview research/prep/practice/scoring/recording/human final review rejection history service charge approved template course finder HR analytics role widgets notification no leak audit log 40 tests 100% PASS
- **Admin:** 45 pages — access-control-center, agent-center, ai-command-center, ai-monitor, approvals, audit-logs, branch-control, branches, change-approval, countries create/edit, country-control, courses create/edit, dashboard, data-conflicts, data-freshness, data-import batch/history/new, data-review, data-sources, destinations, document-security, employee-control, employees, homepage-builder, import-center 9 types, integration-center, integration-wizard, language-tests, login, marketing-automation, permission-matrix, reports, role-permissions, security, settings/digital-assets, sla-monitor, source-verification, system-builder, universities create/edit, university-data duplicates/page/updates, university-data-updates, verification-agents, video-studio, whatsapp-analytics/followup/numbers
- **Super Admin:** System overview, users, roles, departments/branches, workflow settings, data management, integrations, AI command center, audit logs, security, jobs/queues, system health, backup/recovery, dashboard 26 sections, Master Control Center, System Builder, Integration Center, Verification Agents
- **CRM:** 35 pages — dashboard, applications, b2b-applications, cas-i20-coe, communications broadcasts/call-logs/inbox/settings/social-inbox/templates, countries, country-data-review, country/[id], course-finder, course/[id], courses, decision-pending, hrm agreements/analytics/attendance/devices/documents/exit/leave/notices/payroll/profile/security, inbox, integration-center, language-prep, marketing, marketing-manager, morning-summary, offer-letter-management, sla, social, source-verification, super-admin/roles, ucc, universities, university/[id], visa, visa-cases, visa-dashboard, visa-interviews, visa-readiness, visa-reports, whatsapp
- **Application Manager:** 17 pages — dashboard, applications, application/[id], b2b, b2b/create, b2b/provider/[id], b2b/providers, cas-i20-coe, comments, create, deadlines, direct, document-review, offer-management, partner, reports, settings, submission-queue, tasks — B2B Ready Complete + Direct/Partner/B2B + Offer/CAS-I20-COE + Document Review + Visa Handover + Confidential B2B Security PRODUCTION READY
- **Marketing Detailed:** Campaigns, content ideas, generated content, assets, templates, videos, calendar, approvals, social messages, DM threads, comments, leads, scoring, reports, agent jobs, memory, audit logs, RAG, improvement proposals, connected accounts, webhook events, brand assets, campaign posts, consent, video studio Remotion, social scheduler, image generator, content generator, broadcast, call logs
- **Finance Detailed:** Payment Commission Payroll invoices receipts refunds reconciliation commission rule paymentCondition B2B commission revenue payroll workflow
- **HRM Detailed:** Employee EmployeeHRProfile attendance leave salary bonus performance documents device agreement immutable attendance never webcam leave 7 types payroll draft->human check->approval device/login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious HR dashboard widgets agreements analytics attendance devices documents exit leave notices payroll profile security
- **AI Agents Cross-Portal:** 8 canonical, 2000 workforce, 54 legacy, 19 registry, 5 code agents, 15 cron Asia/Dhaka, gateway GroqGuard fallback Groq→OpenRouter→ZAI, real work lead qualification course advisor 6 levels campus mapper supervisor matcher research assistant OCR reply assistant after-hours command center marketing SEO AgentOS

All portals menu-defined in portal-nav.ts, all views in portal-store.ts PortalView 100+, all routes exist in src/app, all functional via APIs role-based, no mockup, no demo credentials in production, no secrets committed, protected live service untouched.

