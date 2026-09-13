# ALO Education — READ-ONLY Discovery & Audit Report

## Audit Date: August 22, 2026
## Audit Type: READ-ONLY (no database or code changes)

---

## 1. Current Prisma Models

**Total models: 180**

### Education/Content Models:
- UniversityPage, CoursePage, CountryPage, ExamPage, Scholarship, ScholarshipFaq
- Service, ServiceFaq, Resource, ResourceCategory, ResourceFaq
- BlogPost, NewsArticle, EventPage, SuccessStory, TeamMember
- ContentRelationship, HomeHeroSlide, HomeSection, HomepageFaq

### CRM/Student Models:
- Lead, Student, Application, ApplicationStageHistory, ApplicationStatusLog
- Document, DocumentVersion, DocumentReview, AiDocumentClassification
- Task, Appointment, TimelineEvent, Referral, StudentBenefitEntitlement
- VisaCase, VisaChecklistItem, VisaReadinessAssessment
- InterviewSession, InterviewQuestion, InterviewAnswer, MockTest
- SopDraft, CvDraft, CourseShortlist, CourseComparison, CourseView

### Communication Models:
- CommunicationMessage, CommunicationTemplate, QuickReply
- SocialInboxMessage, EmailSync, SmsLog, PhoneCallLog, OfficialEmail
- PartnerEmailUpdate, ConsentRecord, NotificationEngine, StudentNotification

### AI Models:
- AiAgent, AiAgentRegistry, AiEmployee, AiSkill, AiSop, AiEngine
- PromptTemplate, ConstitutionalRule, EnterpriseDepartment
- AiTask, AiAction, AiStudentMemory, AiReplyLog, AiDocumentClassification
- AiCommandAction, AgentReplicationCycle, AiAgentLineage

### Communication/SLA Models:
- SlaEvent, SlaPolicy, SlaJustification, SlaIncidentCounter
- EscalationEvent, CommunicationTask, CommunicationDraft
- ContactMatchReview, CallOutcome, UnknownIncomingContact
- SocialAccountOwnership, WebhookEvent, CommunicationTemplate, QuickReply

### Verification/Monitoring Models:
- VerificationRun, OfficialSource, DataChange, DataChangeValue
- DataConflict, SourceSnapshot, MonitoringJob, MonitoringLog
- OfficialDocument, UniversityFaculty, UniversityAgreement

### Storage Models:
- FileMetadata, FileEvent, StoragePool, ImportBatch, ImportError

### Employee/HR Models:
- Employee, EmployeeHR, EmployeeProfile, EmployeeSalary, EmployeeAttendance
- EmployeeBonus, EmployeeCommission, EmployeeIncrement, EmployeePerformance
- EmployeeEducation, EmployeeEmergencyContact, EmployeeDocument
- EmployeeActivationToken, LeaveRequest, ExitManagement
- Department, Office, Payroll, LoginSecurity, DeviceManagement

### Partner Models:
- PartnerPackage, PartnerPackageAssignment, PartnerUser, PartnerUserSeatRequest
- PartnerMarketingQuota, PartnerMarketingRequest, PartnerMarketingUsage
- PartnerSocialAccount, B2BContact, B2bApplication, B2bProvider

### Other Models:
- User, Permission, RolePermission, AuditLog, Campaign, CampaignPost
- Payment, Commission, BrandAsset, BrandProfile, MarketingModel
- VoiceProfile, LearningPost, KnowledgeCategory, KnowledgeDocument
- SearchLog, FormSubmission, AutomationMetric, N8nWorkflow
- WeeklyReport, CreativeAsset, ContentCalendar, MarketingUserAccess
- FeatureAccessRule, FeatureUsageLog, ExtraQuotaRequest, StudentReview
- ReviewInvitation, StudentMockTestVoucher, StudentHelpTicket
- StudentVisibleComment, InternalComment, ApplicationComment
- ApplicationNotification, ApplicationTask, ApplicationDocument
- ApplicationDeadline, LeadForm, LeadOutreach, NoticeManagement
- TrainingMaterial, KnowledgeBookmark, KnowledgeNews, ImportBatch, ImportError

---

## 2. Current University Model

```prisma
model UniversityPage {
  id                 String      @id @default(cuid())
  slug               String      @unique
  name               String
  countrySlug        String
  country            CountryPage @relation(...)
  city               String
  overview           String
  strengths          String      @default("[]")
  quickFacts         String      @default("{}")
  entryRequirements  String      @default("{}")
  tuition            String      @default("{}")
  applicationSteps   String      @default("[]")
  documents          String      @default("[]")
  faqs               String      @default("[]")
  sourceUrl          String?
  lastVerifiedAt     DateTime?
  verificationStatus String      @default("VERIFIED")
  approvalStatus     String      @default("PUBLISHED")
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  courses            CoursePage[]
}
```

### Key Observations:
- `verificationStatus` defaults to "VERIFIED" (not "NEEDS_REVIEW")
- `sourceUrl` is nullable (optional)
- `lastVerifiedAt` is nullable (optional)
- No dedicated intake model — intakes are stored as free text in `quickFacts` JSON
- No field for official evidence/screenshot
- No field for verification method (HTTP, manual, etc.)
- No relationship to OfficialSource model

---

## 3. Current Course Model

```prisma
model CoursePage {
  id                  String         @id @default(cuid())
  slug                String         @unique
  name                String
  universitySlug      String
  university          UniversityPage @relation(...)
  countrySlug         String
  city                String
  level               String
  subject             String
  duration            String
  intake              String         // FREE TEXT — e.g. "January 2027, September 2027"
  tuition             String
  scholarship         String?
  englishRequirement  String
  academicRequirement String
  overview            String
  modules             String         @default("[]")
  careerOutcomes      String         @default("[]")
  documents           String         @default("[]")
  faqs                String         @default("[]")
  deadline            String?
  sourceUrl           String?
  lastVerifiedAt      DateTime?
  verificationStatus  String         @default("VERIFIED")
  approvalStatus      String         @default("PUBLISHED")
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}
```

### Key Observations:
- `intake` is FREE TEXT — not structured. No way to query "all courses with January 2027 intake" efficiently
- `deadline` is free text string
- `tuition` is free text string
- `sourceUrl` is auto-generated from JSON import, NOT verified by HTTP request
- `verificationStatus` defaults to "VERIFIED" (misleading)
- No relationship to OfficialSource model
- No dedicated CourseIntake model
- No field for application fee
- No field for study mode (on-campus, online, hybrid)

---

## 4. Current Intake Model

**MISSING.** There is NO dedicated `CourseIntake` model.

Current intake storage:
- `CoursePage.intake` — free text field, e.g. `"January 2027, September 2027"`
- `UniversityPage.quickFacts` — JSON field with `intakes` array (university-level, not course-level)
- `CountryPage.quickFacts` — JSON field with `intakes` array (country-level)

### Impact:
- Cannot query "all courses with September 2027 intake" without text search
- Cannot track per-intake application deadlines
- Cannot track per-intake verification status
- Cannot create course-intake matrix efficiently
- No way to link an intake to an official source URL

---

## 5. Current Verification Fields

### On UniversityPage:
- `sourceUrl: String?` — nullable, auto-generated from JSON
- `lastVerifiedAt: DateTime?` — nullable
- `verificationStatus: String @default("VERIFIED")` — defaults to VERIFIED (incorrect)

### On CoursePage:
- `sourceUrl: String?` — nullable, auto-generated from JSON
- `lastVerifiedAt: DateTime?` — nullable
- `verificationStatus: String @default("VERIFIED")` — defaults to VERIFIED (incorrect)

### On CountryPage:
- `sourceUrl: String?`
- `lastVerifiedAt: DateTime?`
- `verificationStatus: String @default("VERIFIED")`

### On ExamPage:
- `sourceUrl: String?`
- `lastVerifiedAt: DateTime?`
- `verificationStatus: String @default("VERIFIED")`

### Key Finding:
The `verificationStatus` field defaults to "VERIFIED" — meaning any new record automatically claims to be verified without any actual verification. This is a data integrity issue.

---

## 6. Current Source URL Generation Logic

Found in `prisma/seed-university-data.ts`:

```typescript
// University sourceUrl:
const sourceUrl = info.official_university_url || info.website || uni.sources?.[0]?.url || null;

// Course sourceUrl:
const sourceUrl = ci.official_course_url || c.sources?.[0]?.url || null;
```

### How it works:
1. Reads from `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json`
2. Takes `official_university_url` or `website` or first source URL from the JSON
3. Takes `official_course_url` or first source URL for courses
4. If none found, sets `null`

### Critical Finding:
The source URLs in the JSON file appear to be auto-generated patterns:
- University: `https://www.ox.ac.uk` (from JSON data)
- Course: `https://www.ox.ac.uk/courses/foundation-certificate-in-medicine` (auto-generated pattern)

These URLs were **NOT verified by making HTTP requests**. They were constructed from the university domain + course slug. No HTTP status check, no content verification, no evidence storage.

---

## 7. Current Import/Seed Logic

### Seed Files (19 total):
- `seed.ts` — Main seed (users, leads, students, applications, documents, etc.)
- `seed-university-data.ts` — Imports 400 universities + 17,653 courses from JSON
- `seed-enterprise-ai.ts` — Imports 100 departments, 2000 AI employees, 10000 skills, etc.
- `seed-public.ts` — Public content (countries, universities, courses, exams)
- `seed-public-content.ts` — Blog posts, news, events, success stories
- `seed-homepage.ts` — Homepage hero slides, FAQs, team members
- `seed-counselor.ts` — Counselor data
- `seed-partner-portal.ts` — Partner portal data
- `seed-knowledge.ts` — Knowledge center content
- `seed-marketing.ts` — Marketing campaigns
- `seed-massive-universities.ts` — Earlier university seed (12 unis)
- `seed-expanded.ts` — Expanded data
- `seed-omnichannel.ts` — Communication data
- `seed-ai-agents.ts` — AI agent registry
- `seed-employee-access.ts` — Employee access control
- `seed-hr-appmanager.ts` — HR + app manager data
- `seed-storage-brand.ts` — Storage + brand assets
- `seed-ssr.ts` — SSR data
- `seed-university-monitoring.ts` — University monitoring seed

### University Data Import:
- Source: `upload/ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json`
- Universities: 400 (20 per country, except UK with 140)
- Courses: 17,653 (Foundation: 4,513, Bachelor: 4,453, Masters: 4,458, PhD: 4,229)
- Strategy: Delete existing → createMany in batches
- Verification: Sets `verificationStatus` from JSON `verification.verified_at` field → "VERIFIED" or "NEEDS_REVIEW"

### Finding:
The JSON filename says "VERIFIED" but the actual data inside sets `verificationStatus = "NEEDS_REVIEW"` for 97.33% of courses. The "VERIFIED" in the filename is misleading.

---

## 8. Current API Routes (Universities/Courses/Intakes)

### University APIs:
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/universities` | GET | List universities (paginated) |
| `/api/universities/[slug]` | GET | Single university by slug |
| `/api/university-agreements` | GET, POST | University agreements |
| `/api/university-monitoring/dashboard` | GET | Monitoring dashboard |
| `/api/university-monitoring/changes` | GET | Data changes detected |
| `/api/university-monitoring/changes/[id]` | GET, PATCH | Single change + approve |
| `/api/university-monitoring/conflicts` | GET | Data conflicts |
| `/api/university-monitoring/logs` | GET | Monitoring logs |
| `/api/university-monitoring/recheck` | POST | Trigger recheck |
| `/api/university-monitoring/runs` | GET | Verification runs |
| `/api/university-monitoring/search` | GET | Search sources |
| `/api/university-monitoring/sources` | GET | Official sources |
| `/api/university-monitoring/trigger` | POST | Trigger monitoring job |

### Course APIs:
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/courses` | GET | List courses (paginated) |
| `/api/courses/[slug]` | GET | Single course by slug |
| `/api/course-finder` | GET | Course finder/search |
| `/api/course-finder/admin` | GET, POST | Admin course management |
| `/api/course-finder/compare` | GET | Compare courses |
| `/api/course-finder/eligible` | GET | Eligibility check |
| `/api/course-finder/shortlist` | GET, POST | Shortlist courses |

### Missing APIs:
- No `/api/courses/[slug]/intakes` endpoint
- No `/api/courses/verify` endpoint
- No `/api/universities/[slug]/verify` endpoint
- No `/api/verification/run` endpoint
- No `/api/verification/evidence` endpoint

---

## 9. Current Admin Verification UI

### Views with verification references:
1. `admin-course-management.tsx` — Course management (no verification workflow)
2. `university-monitoring.tsx` — University monitoring dashboard (shows detected changes)
3. `public-university.tsx` — Shows verification badge
4. `public-course.tsx` — Shows verification badge
5. `public-exams.tsx` — Shows verification badge
6. `public-services.tsx` — Shows verification badge

### What exists:
- University monitoring view shows DataChange records and approval queue
- Public pages show "Verified" badge (based on `verificationStatus` field)
- Admin course management view exists but has no verification workflow

### What's missing:
- No verification queue UI (list of courses needing verification)
- No evidence viewer (screenshots, HTML snapshots)
- No manual verification form (review → approve/reject)
- No batch verification interface
- No intake-level verification UI

---

## 10. Current Audit Scripts

### Audit Documents (in `docs/audits/`):
1. `FINAL_SYSTEM_AUDIT.md` — System inventory
2. `FINAL_FEATURE_MATRIX.md` — Feature matrix
3. `FINAL_ROUTE_MATRIX.md` — Route matrix
4. `FINAL_API_MATRIX.md` — API matrix
5. `FINAL_RBAC_MATRIX.md` — RBAC matrix
6. `FINAL_AUTOMATION_MATRIX.md` — Automation matrix
7. `FINAL_QA_REPORT.md` — QA report
8. `MASTER_INTAKE_AUDIT.md` — Intake verification audit

### Monitoring Infrastructure:
- `src/lib/university-monitoring-engine.ts` — Engine that fetches official sources, compares snapshots, detects changes
- `mini-services/university-monitor/` — Background service that runs monitoring jobs
- Prisma models: `VerificationRun`, `OfficialSource`, `DataChange`, `SourceSnapshot`, `MonitoringJob`, `MonitoringLog`

### Finding:
The monitoring infrastructure EXISTS but has **0 records** — no verification runs have been executed. The engine is built but never run against the 400 universities.

---

## 11. Current Database Counts

| Entity | Count |
|--------|-------|
| Universities | 400 |
| Courses | 17,653 |
| Countries | 18 |
| Scholarships | 3 |
| Exams | 10 |
| Departments | 100 |
| AI Employees | 2,000 |
| Skills | 10,000 |
| Prompt Templates | 50,000 |
| Constitutional Rules | 500 |
| SOPs | 500 |
| AI Engines | 20 |
| Leads | 30+ |
| Students | 12 |
| Applications | 12 |

---

## 12. Current Verification Counts

| Entity | VERIFIED | NEEDS_REVIEW | Total |
|--------|----------|--------------|-------|
| Universities | 1 (0.25%) | 399 (99.75%) | 400 |
| Courses | 471 (2.67%) | 17,182 (97.33%) | 17,653 |
| OfficialSource records | 0 | 0 | 0 |
| VerificationRun records | 0 | 0 | 0 |
| SourceSnapshot records | 0 | 0 | 0 |
| DataChange records | 0 | 0 | 0 |

### Key Finding:
- **0 OfficialSource records** — no official sources have been registered
- **0 VerificationRun records** — no verification has ever been run
- **0 SourceSnapshot records** — no source content has been captured
- **0 DataChange records** — no changes have been detected

The verification infrastructure exists in the schema but has never been used.

---

## 13. Missing Schema Capabilities

| Missing Item | Impact |
|--------------|--------|
| **CourseIntake model** | No structured intake data — intakes are free text, cannot query/filter |
| **CourseIntakeDeadline model** | No per-intake deadline tracking |
| **VerificationEvidence model** | No storage for screenshots, HTML snapshots, or text evidence |
| **OfficialSource → CoursePage relationship** | No link between official sources and specific courses |
| **verificationMethod field** | No way to know HOW a record was verified (HTTP, manual, AI) |
| **verifiedBy field** | No way to know WHO verified a record |
| **verificationNotes field** | No way to store verification notes/comments |
| **intakeVerifiedAt field** | No per-intake verification timestamp |
| **applicationFee field on CoursePage** | Missing application fee data |
| **studyMode field on CoursePage** | Missing study mode (on-campus, online, hybrid) |
| **campus field on CoursePage** | Missing campus information (some universities have multiple) |

---

## 14. Missing APIs

| Missing API | Purpose |
|-------------|---------|
| `POST /api/verification/run` | Trigger a verification run for universities/courses |
| `GET /api/verification/status` | Get verification status overview |
| `GET /api/verification/queue` | Get list of courses/universities needing verification |
| `POST /api/courses/[slug]/verify` | Manually verify a course |
| `POST /api/universities/[slug]/verify` | Manually verify a university |
| `GET /api/courses/[slug]/intakes` | Get structured intakes for a course |
| `POST /api/courses/[slug]/intakes` | Add/update intake for a course |
| `GET /api/verification/evidence/[id]` | Get verification evidence (screenshot/snapshot) |
| `POST /api/verification/evidence` | Upload verification evidence |

---

## 15. Missing Verification Workers

| Missing Worker | Purpose |
|----------------|---------|
| **HTTP Source Verifier** | Visit each `sourceUrl`, check HTTP status, capture content |
| **Content Comparator** | Compare current page content against stored snapshot |
| **AI Fact Extractor** | Extract intake, deadline, tuition, requirements from page HTML |
| **Intake Verifier** | Verify each intake month against official university page |
| **Batch Verification Runner** | Run verification in batches (e.g., 50 universities at a time) |
| **Dead URL Detector** | Check if source URLs return 404/500/errors |
| **Duplicate URL Detector** | Check for duplicate URLs across courses/universities |

### Current state:
- `src/lib/university-monitoring-engine.ts` EXISTS — it can fetch URLs, hash content, and detect changes
- But it has NEVER been run (0 VerificationRun records)
- It's designed for CHANGE detection (monitoring), NOT for INITIAL verification

---

## 16. Missing Evidence System

### What exists:
- `SourceSnapshot` model — can store HTTP status, content hash, text extract, AI summary
- `DataChange` model — has `evidence` field (file path or notes)

### What's missing:
- No **VerificationEvidence** model for storing per-course verification proof
- No **screenshot storage** — no way to store visual proof of verification
- No **evidence viewer UI** — no admin interface to view stored evidence
- No **evidence upload API** — no way for admins to upload manual verification evidence
- No **evidence link** between CoursePage and SourceSnapshot
- No **structured intake evidence** — no way to say "this specific intake was verified on this date with this evidence"

---

## 17. Missing Admin UI

| Missing UI | Purpose |
|-----------|---------|
| **Verification Dashboard** | Overview: X verified, Y needs review, Z not verified |
| **Verification Queue** | List of courses/universities needing manual verification |
| **Course Verification Form** | Review course data → verify/reject with notes |
| **University Verification Form** | Review university data → verify/reject with notes |
| **Evidence Viewer** | View screenshots/snapshots/text extracts |
| **Intake Matrix Viewer** | View course × intake month matrix |
| **Batch Verification Runner** | UI to trigger verification runs |
| **Source URL Manager** | View/edit/verify source URLs |
| **Verification History** | Timeline of verification actions per course/university |

### Current admin views:
- `admin-course-management.tsx` — basic CRUD for courses (no verification)
- `university-monitoring.tsx` — shows detected changes (but 0 changes exist)
- `audit-logs.tsx` — general audit log viewer

---

## 18. Recommended Implementation Plan

### Phase 1: Schema Enhancements (No data deletion)
1. Add `CourseIntake` model (courseId, intakeMonth, intakeYear, applicationDeadline, verificationStatus, sourceUrl, evidenceId)
2. Add `VerificationEvidence` model (courseId, universityId, intakeId, evidenceType, evidenceUrl, evidenceText, capturedAt, capturedBy)
3. Add fields to `CoursePage`: `applicationFee`, `studyMode`, `campus`, `verifiedBy`, `verificationMethod`, `verificationNotes`
4. Add fields to `UniversityPage`: `verifiedBy`, `verificationMethod`, `verificationNotes`
5. Add relationship: `CoursePage → OfficialSource[]`
6. Add relationship: `UniversityPage → OfficialSource[]`

### Phase 2: Verification Worker
1. Create `src/lib/course-verification-engine.ts` — visits source URLs, captures content, extracts facts
2. Create `POST /api/verification/run` — triggers batch verification
3. Create `GET /api/verification/queue` — returns courses needing verification
4. Create `POST /api/courses/[slug]/verify` — manual verification endpoint

### Phase 3: Admin Verification UI
1. Create `src/components/alo/views/verification-dashboard.tsx` — overview with stats
2. Create verification queue table — list of courses needing review
3. Create course verification form — review data → approve/reject
4. Create evidence viewer — view snapshots/screenshots

### Phase 4: Intake System
1. Parse existing `CoursePage.intake` free text → create `CourseIntake` records
2. Create `/api/courses/[slug]/intakes` API
3. Create intake matrix viewer
4. Create per-intake verification workflow

### Phase 5: Batch Verification Run
1. Register all 400 university source URLs as `OfficialSource` records
2. Run `VerificationRun` against all sources
3. Capture `SourceSnapshot` for each
4. Compare extracted facts against `CoursePage` data
5. Update `verificationStatus` based on evidence
6. Generate exception reports

### Phase 6: Evidence System
1. Store text extracts from official pages
2. Store AI-extracted structured facts
3. Store verification notes from human reviewers
4. Link evidence to specific courses and intakes
5. Create evidence viewer UI

### Estimated Effort:
- Phase 1: 2-3 hours (schema changes)
- Phase 2: 4-6 hours (verification engine)
- Phase 3: 4-6 hours (admin UI)
- Phase 4: 2-3 hours (intake parsing)
- Phase 5: 8-12 hours (batch run against 400 universities — rate limited)
- Phase 6: 3-4 hours (evidence storage + UI)

---

## Summary

| Category | Status |
|----------|--------|
| Prisma Models | 180 ✅ (comprehensive) |
| University Model | Exists but lacks verification fields |
| Course Model | Exists but intake is free text, no structured intake |
| Intake Model | ❌ MISSING — no dedicated intake model |
| Verification Fields | Exist but default to "VERIFIED" (incorrect) |
| Source URL Logic | Auto-generated from JSON, NOT HTTP-verified |
| Import/Seed Logic | 19 seed files, university import from JSON |
| API Routes | 178 total, 22 related to universities/courses |
| Admin Verification UI | ❌ MISSING — no verification workflow UI |
| Audit Scripts | 8 audit documents + monitoring engine (never run) |
| Database Counts | 400 unis, 17,653 courses, 18 countries |
| Verification Counts | 1 uni verified, 471 courses verified, 17,182 NEEDS_REVIEW |
| Missing Schema | CourseIntake, VerificationEvidence, verifiedBy, verificationMethod |
| Missing APIs | Verification run, queue, evidence, course intakes |
| Missing Workers | HTTP verifier, content comparator, AI fact extractor, intake verifier |
| Missing Evidence System | No screenshot/snapshot storage for verification proof |
| Missing Admin UI | Verification dashboard, queue, form, evidence viewer |

### Critical Finding:
The verification INFRASTRUCTURE exists (models, engine, monitoring service) but has NEVER been used. 0 OfficialSource records, 0 VerificationRun records, 0 SourceSnapshot records. The data was imported from a third-party JSON and marked as "NEEDS_REVIEW" (97.33%) but no verification has been performed.
