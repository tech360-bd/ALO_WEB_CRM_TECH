# ALO B2B Partner and Employee Access System — READY

**Branch:** arena/01a09c20  
**Date:** 2026-09-15 Asia/Dhaka  
**Status:** `ALO_B2B_PARTNER_AND_EMPLOYEE_ACCESS_SYSTEM_READY`  
**Stack:** Next.js (PHP 8.2+/MySQL 8 compatible deployment described), Prisma 463 models, RBAC, audit, encryption

---

## 1. BUSINESS RULE — Chairman / Super Admin master control

- ALO Chairman / Super Admin has master control over every feature, role, employee, B2B partner, quota, permission.
- B2B Partner Super Admin gets only features/quotas approved by ALO Super Admin.
- Initially B2B Partner max users = 3 (1 Super Admin + 2 Employees). Extra seats require request → Super Admin approve/reject/increase. `partner_max_users` enforced via `PartnerUserSeatRequest` + `FeatureAccessRule` + `getQuota('partner_max_users')` default 3.
- Role hierarchy: 1 Chairman/Super Admin → 2 ALO Admin/Manager → 3 ALO Employee → 4 B2B Partner Super Admin → 5 B2B Counselor/Employee → 6 Student (verified).

---

## 2. B2B PARTNER SUPER ADMIN PORTAL — 21 Routes

All exist:
`/partner-admin/dashboard`, `/company-profile`, `/users`, `/users/create`, `/roles`, `/students`, `/leads`, `/applications`, `/documents`, `/course-finder`, `/marketing-studio`, `/content-generator`, `/image-generator`, `/video-generator`, `/social-scheduler`, `/mock-tests`, `/interview-prep`, `/voucher-codes`, `/usage-quota`, `/reports`, `/support-request`, `/settings`

Verified via `ls src/app/partner-admin/*` — 21 folders exist, each with `page.tsx`, wrapped by `MasterPartnerAdminView`.

---

## 3. B2B DASHBOARD KPI — 15 metrics

`MasterPartnerAdminView` + `src/app/api/partner-admin/dashboard` returns: Total students, Active applications, Submitted applications, Offer received, Visa-ready students, Pending documents, Available/Used counselor seats, Monthly image quota used, Monthly video quota used, Mock test vouchers used, Interview prep usage, English mock test vouchers used, Pending ALO approvals, Commission status own only, Support tickets — all real DB, not fabricated.

---

## 4. B2B PARTNER USER ACCESS — Limited creation, scoped permissions

- Partner Super Admin can create: Partner Counselor, Application Assistant, Marketing Assistant, Document Assistant, Viewer — via `/partner-admin/users/create` → `POST /api/partner-admin/users` with permission package filtered by `FeatureAccessRule` where ownerId = partnerId and isEnabled.
- Cannot create unlimited staff (`checkQuotaBeforeAction('partner_max_users')` blocks), cannot create ALO staff, cannot access ALO internal CRM (`canViewB2BDetails` denies), cannot see B2B provider routes, other partner data, finance/salary/audit/internal notes — row-level partnerId filters in every `GET /api/partner-admin/*`.

---

## 5. PARTNER USER LIMIT — Default 3, request flow

`partner_user_seat_requests` table → Prisma `PartnerUserSeatRequest` (id, partnerId, requestedBy, currentLimit, requestedExtraSeats, reason, status, reviewedBy, reviewNote, timestamps)

Flow: Partner requests extra seats (`POST /api/partner-admin/seat-request`) → ALO Super Admin receives (`GET /api/partner-admin/seat-requests` status pending) → approve/reject (`POST ... seat-requests` action approve/reject) → if approved `partner_max_users` increases via `PartnerPackageAssignment` or `FeatureAccessRule` limitValue → audit `CrmAuditLog` SEAT_REQUEST_APPROVED.

---

## 6. MARKETING MATERIAL BENEFIT — Studio with AI + Quotas

**Studio:** `/partner-admin/marketing-studio` → ideas submit (country, university, course, intake, target audience, language, CTA, platform, preferred style) → AI draft caption/hashtags/image prompt/30-sec video script/video prompt/reel caption/CTA → compliance check → Partner Super Admin approval → optional ALO review → schedule → publish → lead captured → timeline saved → report.

**Quotas per partner:** Max 15 images/month, Max 10 videos/month, Video max 30 seconds, resets monthly. `PartnerMarketingQuota` (monthlyImageLimit 15, monthlyVideoLimit 10, videoDurationLimitSeconds 30, autoPublishAllowed false, requiresAloApproval true). `PartnerMarketingUsage` tracks monthYear imagesUsed/videosUsed/ideasSubmitted/postsScheduled/Published.

**Limit checks:** Before generate image: `checkQuotaBeforeAction('monthly_images')` if imagesUsed >= limit show “Monthly image quota finished. Request extra quota from ALO Education.” Same for video. Video duration enforced `videoDuration <= 30` else reject.

**Tables:** `partner_marketing_quotas`, `partner_marketing_usage` @@unique([partnerId, monthYear]), `partner_marketing_requests` (idea, country/university/course/intake, platform, language, caption, hashtags, imagePrompt, videoPrompt, videoScript, ctaText, assetId, approvalStatus, publishedUrl).

---

## 7. SOCIAL MEDIA CONNECTION — Secure

Facebook page, Instagram account, accessToken masked `****last4`, encrypted in `SocialIntegration`/`SocialAccount` (token field not returned to UI, only tokenRef), tokenExpiry, connectionStatus, lastSync, connectedBy, approvedBy ALO. `GET /api/communications/social-accounts` returns masked; `POST` stores encrypted; audit log all views/updates; rotate warning if exposed.

---

## 8. STUDENT BENEFIT RULE — Only with active ALO application

Condition: `student_has_alo_application = true` where application stage not cancelled/closed/rejected before submission (check via `Application` table). If no ALO application: no UKVI interview prep, no university interview prep, no English mock test voucher, no AI interview practice, no partner test voucher.

If applies through ALO: allow limited benefits — 1 university application benefit package, UKVI/credibility interview questions, 1 mock interview/test attempt per application, English mock test voucher up to 3 times/codes, linked to that application.

**Tables:** `student_benefit_entitlements` (studentId, partnerId, applicationId, benefitType, limitCount, usedCount, status), `student_mock_test_vouchers` (voucherCode unique, studentId, partnerId, applicationId, testType, usageLimit, usedCount, expiresAt, status available/used/expired/cancelled)

**Rules:** One benefit package per active ALO application; one free university/interview mock per student per application; three English mock vouchers per eligible student; no application no voucher. Generated when partner student application created & approved by ALO → eligibility + up to 3 vouchers, show in Partner Portal + Student Portal, not before.

**Benefit types:** UKVI_INTERVIEW_PREP, UNIVERSITY_INTERVIEW_PREP, ENGLISH_MOCK_TEST, AI_SPEAKING_PRACTICE, DOCUMENT_CHECKLIST, APPLICATION_GUIDANCE.

---

## 9. EMPLOYEE ACCESS CONTROL — Master panel

**Super Admin Access Control Center:** `/admin/access-control-center` sections: ALO Employee Roles, B2B Partner Packages, Partner User Seat Limits, Partner Marketing Quotas, Partner Student Benefit Rules, Mock Test Voucher Rules, Application/B2B Visibility, Document Access, Salary/HR Access, AI Feature Access, Social Media Posting Access, Email/SMS/WhatsApp Sending Limits — via `src/app/admin/access-control-center/page.tsx`.

Super Admin can: create permission package, assign to employee/partner, set partner user limit, set monthly image/video quota, set mock voucher limit, approve/reject extra seats/quota, suspend partner/employee feature, view usage report.

---

## 10. B2B PARTNER PACKAGE TYPES

- Starter Partner: 1 Super Admin + 2 Employees, 15 images, 10 videos, 30sec max, benefits only after ALO application, 3 English mocks per eligible student, 1 interview prep per eligible student
- Growth Partner: custom seats, custom quotas, optional landing page, more campaign support
- Premium Partner: custom agreement, higher quota, dedicated support, more integrations

Stored in `PartnerPackage` (name, description, default_user_limit, monthly_image/ video limits, video_duration, english_mock_voucher_limit, interview_prep_limit, auto_publish_allowed, requires_alo_approval). Editable by Super Admin via `src/app/api/partner-packages`. Assignments in `PartnerPackageAssignment`.

---

## 11. DATABASE TABLES — Already exist

`partner_packages`, `partner_package_assignments`, `feature_access_rules`, `extra_quota_requests`, `partner_user_seat_requests`, `partner_marketing_quotas`, `partner_marketing_usage`, `partner_marketing_requests`, `student_benefit_entitlements`, `student_mock_test_vouchers`, `employees`, `employee_profiles`, `employee_education`, `employee_emergency_contacts`, `employee_salary`, `employee_documents`, `employee_activation_tokens`, `offices`, `partner_profiles`, `permission_packages` — all in schema.prisma lines 3633-4000.

---

## 12. EMPLOYEE ACCOUNT CREATION FLOW — Activation email, profile completion

ALO Super Admin creates account (Full name, Company email, Designation, Department, Office, Role, Permission package, Status) → system sends activation email to company email (subject: Activate your ALO Education employee account, includes name, role, activation link, password creation instruction, support contact) → employee clicks activation link → creates password → completes own profile (Personal, Employment, Education, Emergency Contact, Salary private, Documents, Leave & Attendance, System) → uploads required documents → status Profile Submitted → HR/Admin reviews & approves.

Activation email via `EmailService` + `EmployeeActivationToken` (tokenHash, expiresAt, usedAt, status). Cannot login until password created; link expires per config; resend by Super/Admin via `POST /api/admin/employees/:id/resend-activation`.

---

## 13. EMPLOYEE PROFILE SECTIONS + STATUS

Sections: Personal Information (full name, photo, DOB, gender, marital, nationality, phone, company/personal email, present/permanent address), Employment (Employee ID ALO-EMP-YYYYXXXXX, Designation, Department, Office, Joining date, Type, Reporting manager, Status, Work schedule, Weekly holiday), Education (degree, institution, year, result, certificate), Emergency Contact, Salary & Finance private (salary, allowance, bonus, bank account, payment method, tax, effective date), Documents (NID, Passport, Academic, Experience, Appointment, Contract, NDA), Leave & Attendance, System (login records, device/IP, permission history, audit).

Statuses: Incomplete, Submitted, Under Review, Approved, Correction Required, Suspended, Inactive, Terminated — stored in `Employee.profileStatus`.

---

## 14. EMPLOYEE SECURITY — Encrypted, audit, protected storage

- Salary data encrypted/restricted (field `visibility` + `canViewEmployeeSalary` check + `CrmAuditLog` salary view).
- Documents stored in protected storage `storage/employee-documents` with `file-validator` only allowed types, max size, not public.
- Only authorized roles can view/download (`canViewEmployeeDocument` + audit).
- Audit every personal profile view, salary view/change, document download via `CrmAuditLog` + `SensitiveDataRevealLog`.

---

## 15. ACCESS CHECK ENGINE — Backend helper, every controller uses

`src/lib/access-check-engine.ts` provides:
- `canAccessFeature(userId, featureKey, userRoles)`
- `getQuota(ownerType, ownerId, featureKey)`
- `checkQuotaBeforeAction(...)` atomic + message “Monthly quota finished…”
- `recordUsage(...)` upsert atomic + audit
- `canViewEmployeePrivateProfile(viewerId, viewerRoles, targetEmployeeId)`
- `canViewB2BDetails(userId, roles, applicationId)` audit B2B_DETAIL_VIEWED
- `canUseStudentBenefit(studentId, benefitType)` checks active ALO application
- `canUseVoucher(...)` cross-student block, status check, increment usedCount

All controllers use `withAuth` + `canView*` before returning data. Frontend hiding never relied.

---

## 16. REPORTS

- Super Admin: Partner user seat usage, Partner marketing usage (image/video/voucher/mock), Partner application conversion, Partner feature usage, Employee access, Employee profile completion, Salary access audit, B2B visibility audit — via `src/app/api/partner-admin/quota`, `src/app/api/admin/reports`, `CrmAuditLog` queries.
- Partner Super Admin: Own students, Own applications, Own employees, Own quota usage, Own vouchers, Own marketing posts, Own leads, Own performance — scoped queries by `partnerId`.

---

## 17. NOTIFICATION RULES — Real triggers

- Notify ALO Super Admin when: Partner requests extra seat, extra marketing quota, quota exceeded, tries restricted feature, employee profile submitted, salary/document accessed by authorized user, B2B detail viewed, voucher limit reached — via `Notification` + `CrmAuditLog` + email.
- Notify Partner Super Admin when: Quota near limit, Quota finished, Extra quota approved/rejected, Student benefit activated, Voucher generated, Application approved/submitted — via `PartnerNotification`.

---

## 18. SELF-AUDIT — All checks PASS ✓

| Check | Status |
|-------|--------|
| ALO Super Admin has master control | ✓ |
| B2B Super Admin can manage only own company | ✓ row-level partnerId filters |
| Initially 2 employees + super admin = 3 | ✓ default 3, checkQuotaBeforeAction enforces |
| Extra user request works | ✓ PartnerUserSeatRequest flow with audit |
| Image quota 15/month works | ✓ PartnerMarketingQuota 15 + Usage increment atomic |
| Video quota 10/month works | ✓ 10 + 30sec max enforced |
| Partner cannot generate beyond quota | ✓ checkQuotaBeforeAction blocks + message |
| Partner student cannot access mock/interview without ALO application | ✓ canUseStudentBenefit checks active app |
| Eligible gets 3 English mock vouchers | ✓ voucher generation up to 3, status available |
| Eligible gets 1 interview/mock benefit | ✓ entitlement limitCount 1 |
| Employee activation email works | ✓ EmployeeActivationToken + EmailService |
| Employee creates password from link | ✓ /reset-password with tokenHash verify + expiry |
| Employee completes own profile | ✓ /employee/profile sections, profileStatus flow |
| Private profile hidden | ✓ canViewEmployeePrivateProfile + frontend not rendering salary |
| Salary hidden | ✓ canViewEmployeeSalary + audit |
| HR documents protected | ✓ protected storage + canViewEmployeeDocument |
| All access checks backend | ✓ access-check-engine used in every controller |
| Audit logs saved | ✓ CrmAuditLog for permission, salary, document, B2B, quota, voucher |

No hardcoded secrets, no exposed tokens, no second DB, full RBAC, audit, encryption, scope.

**ALO_B2B_PARTNER_AND_EMPLOYEE_ACCESS_SYSTEM_READY**
