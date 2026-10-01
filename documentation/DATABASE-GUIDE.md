> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education — Database Guide

## Overview
- **ORM**: Prisma 6.19.x
- **Development DB**: SQLite (`db/custom.db`)
- **Production DB**: PostgreSQL 16+ (recommended) or MySQL 8
- **Models**: 113
- **Seed Scripts**: 13

## Schema Management
```bash
bun run db:push      # Push schema changes to DB
bun run db:generate   # Regenerate Prisma Client
bun run db:migrate    # Create migration (development)
bun run db:seed       # Run all seed scripts
```

## Database Tables by Category

### Core CRM (15 tables)
User, Lead, Student, Document, Application, InterviewSession, MockTest, VisaCase, TimelineEvent, AuditLog, Campaign, Payment, AiAgent, CountryPage, UniversityPage, CoursePage, ExamPage

### Employee & HR (16 tables)
Employee, EmployeeProfile, EmployeeEducation, EmployeeEmergencyContact, EmployeeSalary, EmployeeDocument, EmployeeActivationToken, EmployeeHR, EmployeeAttendance, EmployeeCommission, EmployeeBonus, EmployeeIncrement, EmployeePerformance, Department, Office, LeaveRequest, Payroll, DeviceManagement, LoginSecurity, NoticeManagement, ExitManagement

### RBAC (3 tables)
Permission, RolePermission, MarketingUserAccess

### Communication (12 tables)
CommunicationMessage, SocialInboxMessage, KeywordTrigger, CampaignPost, N8nWorkflow, LeadOutreach, ConnectedAccount, PhoneCallLog, EmailSync, SmsLog, NotificationEngine, ConsentRecord

### Partner System (10 tables)
PartnerUser, PartnerUserSeatRequest, PartnerPackage, PartnerPackageAssignment, PartnerMarketingQuota, PartnerMarketingUsage, PartnerMarketingRequest, PartnerSocialAccount, StudentBenefitEntitlement, StudentMockTestVoucher

### Application Manager (8 tables)
B2bProvider, B2bApplication, ApplicationStatusLog, ApplicationComment, ApplicationDocument, ApplicationDeadline, ApplicationTask, ApplicationNotification

### Enterprise AI (7 tables)
EnterpriseDepartment, AiEmployee, AiSkill, PromptTemplate, ConstitutionalRule, AiSop, AiEngine

### Document & Content (8 tables)
DocumentVersion, DocumentReview, AiDocumentClassification, SopDraft, CvDraft, ContentCalendar, CreativeAsset, AiReplyLog

### Homepage & Marketing (9 tables)
HomeHeroSlide, HomeSection, Service, SuccessStory, TeamMember, HomepageFaq, LeadForm, SearchLog, BrandAsset

### Course Finder (5 tables)
CourseShortlist, CourseComparison, CourseView, Scholarship, Commission, ImportBatch, ImportError, FeatureAccessRule, FeatureUsageLog

## Backup
```bash
# SQLite
cp db/custom.db db/backup-$(date +%Y%m%d).db

# PostgreSQL
pg_dump --no-tablespaces -U alo_user alo_education > backup.sql

# MySQL
mysqldump --no-tablespaces -u alo_user -p alo_education > backup.sql
```

## Restore
```bash
# SQLite
cp db/backup-20250101.db db/custom.db

# PostgreSQL
psql -U alo_user alo_education < backup.sql
```
