# ALO EDUCATION WEB_CRM — MASTER SYSTEM DOCUMENTATION & OPERATING MANUAL

---

## 1. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
- **Product Name**: ALO Education Web_CRM + AI Platform
- **Scope**: Enterprise Student Management, Multi-Channel Unified Communication, Lead Pipeline, University/Course Matching, B2B Partner Portal, Student Portal, Visa Interview Officer Workspace, 90-Day SEO Growth System, Multi-Agent AI Network.
- **Target Audience**: Students, Counselors, Application Managers, Visa Officers, Finance Officers, Marketing Officers, HR Managers, B2B Partners, Branch Managers, Super Admin.
- **Key Functionalities**:
  1. Student Lead Capture & 11-Step Detailed Profile Completion.
  2. B2B Partner Portal with quota enforcement (15 images/mo, 10 videos/mo 30s max) & seat approval requests.
  3. Visa Interview Officer Dashboard featuring Pre-CAS Mock Studio, Credibility Interview Practice, Financial Risk Scoring.
  4. Passwordless Role Launcher Grid for Super Admin acting as 14 employee roles with mandatory audit logging.
  5. 90-Day SEO Growth Engine with Fact-Check Claims Registry (`UNVERIFIED` → `VERIFIED` → `HUMAN_REVIEW_APPROVED`).
  6. Multi-channel Unified Timeline (WhatsApp, SMS, Email, Site Chat, Portal Messages, Notes).

---

## 2. TECHNICAL DESIGN DOCUMENT (TDD)
- **Architecture**: Next.js 16 App Router (Turbopack in Dev / Webpack for Standalone Build) + TypeScript + React 19 + Tailwind CSS + Prisma ORM + MySQL 8.
- **Rendering Strategy**: Hybrid SSR/ISR and client-side SPA routing (`src/app/page.tsx` + App Router routes).
- **State Management**: Zustand global store (`portal-store.ts`) synchronized with Next.js router query parameters.
- **Database Abstraction**: Prisma ORM with connection pooling via `@prisma/client`.
- **Security Engine**: JWT / HTTP-Only Cookie session management, bcrypt password hashing, server-side RBAC middleware (`auth-middleware.ts`), Private Employee Profile privacy engine (`access-check-engine.ts`).

---

## 3. API DOCUMENTATION
### Authentication Endpoints
- `POST /api/portal-auth/login`: Authenticate user & issue session cookie.
- `POST /api/portal-auth/register`: Register new student or partner account.
- `POST /api/portal-auth/forgot-password`: Generate password reset token & send email.
- `POST /api/portal-auth/verify-otp`: Validate 6-digit OTP code.

### CRM & Management Endpoints
- `GET /api/crm/students`: Query student directory with pagination & filters.
- `POST /api/crm/leads`: Create lead from public forms / chat with duplicate detection.
- `GET /api/crm/communications/timeline`: Fetch multi-channel unified communication log for lead/student.
- `GET /api/visa/cases`: Retrieve visa readiness queue and mock interview scores.
- `POST /api/partner/marketing/generate`: Generate AI marketing assets with monthly quota check.
- `GET /api/super-admin/dashboard`: Super Admin master operating metrics & 2000 agent status.

---

## 4. DATABASE DESIGN DOCUMENT
- **Primary Database**: MySQL 8.0 / MariaDB with `utf8mb4_unicode_ci`.
- **Core Entities**:
  - `PortalUser`: Master user accounts (STUDENT, PARTNER, EMPLOYEE, ADMIN, SUPER_ADMIN).
  - `EmployeeProfile`: HR designation, salary, emergency contact, document privacy settings.
  - `PortalStudentProfile`: 11-step academic, passport, test, funding, and visa history background.
  - `CRMApplication`: University application stages from Draft to Enrolled.
  - `CommunicationLog`: Multi-channel timeline records.
  - `PartnerMarketingQuota`: Monthly quota tracking (15 images / 10 videos max 30s).
  - `PortalAuditLog`: System-wide audit log for privacy & acting-as actions.
  - `SEOPage` / `SEOSource` / `SEOClaim`: Fact-checked content registry.

---

## 5. DEPLOYMENT GUIDE (cPanel & Node.js Standalone)
1. **Prepare Environment**:
   - Node.js v22+ installed on cPanel.
   - MySQL 8 database created with user permissions.
2. **Build Standalone Bundle**:
   ```bash
   npm run build
   ```
3. **Upload Files**:
   - Upload `.next/standalone`, `.next/static`, and `public` to `/home/aloeduca/public_html/aloeducation.com/`.
4. **Configure Environment Variables**:
   - Create `.env` in application root with `DATABASE_URL`, `JWT_SECRET`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `CRON_SECRET`.
5. **Run Application**:
   ```bash
   HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js
   ```

---

## 6. OPERATIONS GUIDE
- **Health Monitoring**: Check endpoint `GET /api/health` returning database status and uptime.
- **Log Inspection**: Inspect logs in `storage/logs/` and server stdout.
- **Cron Tasks**: Configure cPanel Cron Job to trigger `GET /api/cron/weekly-ai-agent` every Sunday at midnight.
- **Locking Mechanism**: Ensure lock files under `storage/locks/` prevent concurrent cron runs.

---

## 7. USER MANUAL (Students & B2B Partners)
- **Students**:
  - Register at `/student/register` or login at `/student/login`.
  - Complete 11 profile steps under `/student/profile`.
  - Track application status, upload documents, practice AI mock visa interviews, and redeem 3 free English Mock Test Vouchers.
- **B2B Partners**:
  - Apply at `/partner/register` (Account requires Admin approval).
  - Track submitted leads, student applications, and commissions.
  - Use Partner Marketing Studio under quota limits (15 images / 10 videos per month). Request extra counselor seats via seat expansion form.

---

## 8. ADMINISTRATOR MANUAL (Super Admin & Managers)
- **Super Admin Operating Brain**:
  - Access `/super-admin/dashboard` or `/admin/dashboard`.
  - Toggle Emergency System Lockdown if security threat detected.
  - Use Passwordless Role Launcher Grid to inspect and test any of 14 employee roles in "Acting-As" mode.
  - Manage 17 Employee Designations and private profile access under `/admin/access-control-center`.
  - Review Old CRM Import Center (`/crm/import-center`) and University Data Updates (`/crm/university-updates`).

---

## 9. SECURITY DOCUMENTATION
- **Data Scoping**: Scoped multi-tenant data isolation for Students (`studentId`), Partners (`partnerId`), and Counselors (`counselorId`).
- **Private Profile Privacy Engine**: `canViewEmployeePrivateProfile()` enforces restricted access to salary, emergency contact, passport/NID, bank details, and HR docs.
- **Audit Logging**: All acting-as actions and credential changes formatted as `SUPER_ADMIN acting_as {ROLE}` in `PortalAuditLog`.
- **Form & API Protection**: Parameterized queries via Prisma (SQLi immune), React JSX output escaping (XSS immune), SameSite Lax HTTP-Only cookies (CSRF protected).

---

## 10. TESTING DOCUMENTATION
- **Test Runner**: Vitest (`v4.1.10`).
- **Test Command**: `npm test`
- **Coverage**:
  - Data scoping tests (`tests/unit/data-scope.test.ts`).
  - Permission tests (`tests/unit/permissions.test.ts`).
  - Password hashing tests (`tests/unit/password-hashing.test.ts`).
  - Consultation workflow integration tests (`tests/integration/consultation-workflow.test.ts`).
- **Execution Result**: 36 / 36 tests passing.

---

## 11. ENVIRONMENT VARIABLES GUIDE
| Variable | Description | Required in Production |
| :--- | :--- | :---: |
| `NODE_ENV` | Environment mode (`production`) | Yes |
| `NEXT_PUBLIC_APP_URL` | App public URL (`https://aloeducation.com`) | Yes |
| `DATABASE_URL` | MySQL connection string | Yes |
| `JWT_SECRET` | 64-byte hex secret for JWT signing | Yes |
| `AUTH_SECRET` | 64-byte hex secret for session auth | Yes |
| `NEXTAUTH_SECRET` | 64-byte hex secret for NextAuth | Yes |
| `CRON_SECRET` | Secret token for securing cron webhooks | Yes |
| `SMTP_HOST` | Outbound SMTP server hostname | For live email |
| `SMTP_USER` | SMTP authentication username | For live email |
| `SMTP_PASSWORD` | SMTP authentication password | For live email |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API access token | For live WhatsApp |

---

## 12. BACKUP & DISASTER RECOVERY GUIDE
- **Daily Database Backup**: Run `mysqldump -u [USER] -p[PASS] aloeduca_alo_crm > backup_$(date +%Y%m%d).sql` via cPanel cron.
- **Weekly File Backup**: Compress `/home/aloeduca/public_html/aloeducation.com/storage/private` to off-site backup.
- **Disaster Recovery Steps**:
  1. Restore database from latest `.sql` dump.
  2. Restore private uploaded documents directory.
  3. Deploy standalone build bundle and restart Node.js server app.
