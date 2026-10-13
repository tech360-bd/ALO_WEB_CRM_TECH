# DATABASE_SCHEMA_REPORT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Prisma Database Schema Report |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Document all 55 Prisma models grouped by domain. For each model: name, purpose, key fields, relations. Source of truth: `prisma/schema.prisma` (1,281 lines). |

---

## Overview

| Item | Value |
|---|---|
| **Schema file** | `prisma/schema.prisma` |
| **Schema lines** | 1,281 |
| **Provider (dev)** | `sqlite` (for local development) |
| **Provider (prod)** | `mysql` (MySQL 8.0.37 in cPanel production) |
| **Database name (prod)** | `aloeduca_alamin_crm` |
| **Character set / collation** | `utf8mb4` / `utf8mb4_unicode_ci` |
| **Total models** | 55 |
| **Generator** | `prisma-client-js` |

---

## Domain breakdown

| Domain | Models | Count |
|---|---|---|
| Identity & Auth | User, Contact, Organization | 3 |
| CRM (Inquiries & Pipeline) | Inquiry, Opportunity, Partnership, StudentReferral, Task, Note, NewsletterSubscriber, MeetingRequest | 8 |
| Content (Portfolio + Knowledge) | Project, Article, Resource, ImpactRecord, CaseStudy | 5 |
| AI Workspace | AiTask, AiApproval | 2 |
| Audit & Logs | AuditLog, SystemHealth | 2 |
| Notifications | Notification | 1 |
| Analytics & Documents | AnalyticsEvent, Document | 2 |
| Site Settings & Media | Setting, MediaAsset | 2 |
| Higher Study Platform | HigherStudyCountry, HigherStudyCity, HigherStudyUniversity, HigherStudySubject, HigherStudyIntake, HigherStudyCourse, HigherStudyScholarship, HigherStudyResearchArea, HigherStudyResearchProject, HigherStudySupervisor, HigherStudyResource, HigherStudyStudentStory, HigherStudyEvent, HigherStudySavedItem, HigherStudyComparison, HigherStudyReferral, HigherStudyAlert, HigherStudyAuditLog, HigherStudyImportJob | 19 |
| English Learning Platform | EnglishLearningCourse, EnglishLearningLesson, EnglishLearningPracticeTest, EnglishLearningQuestion, EnglishLearningTutor, EnglishLearningResource, EnglishLearningEnrollment, EnglishLearningProgress, EnglishLearningReferral, EnglishLearningAuditLog, EnglishLearningSetting | 11 |
| **Total** | | **55** |

---

## Domain 1: Identity & Auth (3 models)

### `User`

**Purpose**: Admin / staff user account with role-based access.

**Key fields**:
- `id` (String, cuid, PK)
- `email` (String, unique)
- `name` (String)
- `role` (String, default `VIEWER`) — one of 11 roles: SUPER_ADMIN, OWNER, EXECUTIVE_ASSISTANT, CRM_MANAGER, PARTNERSHIP_MANAGER, CONTENT_MANAGER, MARKETING_MANAGER, PROJECT_MANAGER, AI_REVIEWER, SECURITY_AUDITOR, VIEWER
- `status` (String, default `active`) — active | suspended | inactive
- `passwordHash` (String?) — scrypt hash format `scrypt$<salt>$<hash>`
- `lastLoginAt` (DateTime?)
- `createdAt`, `updatedAt`

**Relations**:
- `inquiries` (Inquiry[]) — inquiries created by this user
- `aiTasks` (AiTask[]) — AI tasks requested by this user
- `aiApprovals` (AiApproval[]) — AI approvals decided by this user
- `auditLogs` (AuditLog[]) — audit log entries by this user
- `tasks` (Task[]) — tasks assigned to this user
- `notes` (Note[]) — notes authored by this user
- `documents` (Document[]) — documents uploaded by this user

---

### `Contact`

**Purpose**: CRM contact record — a lead, customer, or relationship.

**Key fields**:
- `id` (String, cuid, PK)
- `fullName` (String)
- `email` (String, unique)
- `phone` (String?)
- `whatsapp` (String?)
- `organization` (String?)
- `role` (String?) — contact's job title
- `country`, `city` (String?)
- `preferredChannel` (String?) — email | phone | whatsapp
- `tags` (String?) — comma-separated
- `status` (String, default `active`) — active | nurturing | converted | archived
- `source` (String?) — UTM source / referral

**Relations**:
- `inquiries` (Inquiry[])
- `opportunities` (Opportunity[])
- `referrals` (StudentReferral[])
- `notes` (Note[])
- `tasks` (Task[])

---

### `Organization`

**Purpose**: Organization record (university / education-business / company / media / partner).

**Key fields**:
- `id` (String, cuid, PK)
- `name` (String)
- `type` (String?) — university | education-business | company | media | partner
- `country` (String?)
- `website` (String?)
- `status` (String, default `active`)

**Relations**:
- `partnerships` (Partnership[])

---

## Domain 2: CRM — Inquiries & Pipeline (8 models)

### `Inquiry`

**Purpose**: Inbound inquiry form submission (from `/contact`, `/higher-study/book-consultation`, etc.).

**Key fields**:
- `id` (String, cuid, PK)
- `reference` (String, unique) — human-readable reference code
- `type` (String) — 13 types: university-partnership, business-consultation, operations-review, sales-strategy, education-advisory, ai-automation, crm-digital, tech-collaboration, personal-branding, speaking, media, student-referral, other
- `contactId` (String, FK → Contact)
- `createdById` (String?, FK → User)
- `currentChallenge`, `desiredOutcome`, `timeline`, `scope`, `existingSystem`, `preferredTime`, `notes` (String?)
- `utmSource`, `utmMedium`, `utmCampaign` (String?) — marketing attribution
- `referralSource` (String?)
- `privacyConsent`, `commsConsent`, `marketingConsent`, `studentDataConsent` (Boolean)
- `status` (String, default `new`) — new | reviewing | qualified | responded | converted | archived
- `ipHash` (String?) — sha256 hash truncated to 16 hex chars

**Relations**:
- `contact` (Contact)
- `createdBy` (User?)
- `opportunity` (Opportunity?)
- `referral` (StudentReferral?)

---

### `Opportunity`

**Purpose**: Sales opportunity in the pipeline.

**Key fields**:
- `id`, `contactId` (FK → Contact), `inquiryId` (String?, unique, FK → Inquiry)
- `title` (String)
- `value` (Int?) — estimated value
- `currency` (String, default `USD`)
- `stage` (String, default `new`) — 13 stages: new, review-required, qualified, discovery-scheduled, discovery-completed, scope-required, proposal-drafting, proposal-sent, negotiation, approved, in-progress, won, lost, on-hold, archived
- `priority` (String, default `medium`) — low | medium | high | critical
- `closeDate` (DateTime?)

**Relations**: `contact`, `inquiry`

---

### `Partnership`

**Purpose**: Partnership with an organization.

**Key fields**:
- `id`, `organizationId` (FK → Organization)
- `name`, `type`, `alAminnRole`, `problemSolved` (String?)
- `stage` (String, default `new-institution`) — 10 stages: new-institution, initial-review, introductory-contact, meeting-planned, requirements-received, due-diligence, proposal-agreement, internal-approval, active-partnership, on-hold, closed
- `status` (String, default `planned`) — planned | in-testing | connected | active | on-hold

**Relations**: `organization`

---

### `StudentReferral`

**Purpose**: CRM-side student referral (pre-ALO Education handoff, for tracking).

**Key fields**:
- `id`, `contactId` (FK → Contact), `inquiryId` (String?, unique, FK → Inquiry)
- `studentName` (String)
- `interestCountry`, `interestProgram` (String?)
- `consent` (Boolean, default false)
- `stage` (String, default `new-referral`) — 11 stages: new-referral, consent-pending, consent-confirmed, sent-to-alo-education, accepted, counselor-assigned, in-progress, converted, closed, duplicate, consent-withdrawn

**Relations**: `contact`, `inquiry`

---

### `Task`

**Purpose**: CRM task (assignable, with relations to contacts and inquiries).

**Key fields**:
- `id`, `title`, `description` (String?)
- `dueDate` (DateTime?)
- `priority` (String, default `medium`) — low | medium | high | critical
- `status` (String, default `open`) — open | in-progress | done | overdue | cancelled
- `assigneeId` (String?, FK → User)
- `contactId` (String?, FK → Contact)
- `relatedType` (String?) — inquiry | opportunity | partnership | project | ai-task
- `relatedId` (String?)

**Relations**: `assignee` (User?), `contact` (Contact?)

---

### `Note`

**Purpose**: Free-text note on a contact.

**Key fields**: `id`, `body`, `contactId` (String?, FK → Contact), `authorId` (String?, FK → User), `createdAt`, `updatedAt`

**Relations**: `contact` (Contact?), `author` (User?)

---

### `NewsletterSubscriber`

**Purpose**: Email newsletter signup with double-opt-in.

**Key fields**:
- `id`, `email` (String, unique), `name` (String?)
- `interest` (String?) — executive | operations | education | technology | partnership | student | other
- `consent` (Boolean, default false)
- `status` (String, default `pending`) — pending | confirmed | unsubscribed
- `token` (String?, unique) — verification token

---

### `MeetingRequest`

**Purpose**: Discovery / strategy / partnership / education meeting booking.

**Key fields**:
- `id`, `reference` (String, unique)
- `meetingType` (String) — discovery | strategy | partnership | education
- `requestedDate` (DateTime), `requestedTime` (String) — HH:mm in Asia/Dhaka
- `timezone` (String, default `Asia/Dhaka`)
- `contactName`, `contactEmail`, `organization`, `topic` (String?)
- `status` (String, default `new`) — new | confirmed | rescheduled | cancelled | completed
- `ipHash`, `utmSource`, `utmMedium`, `utmCampaign`, `notes` (String?)

---

## Domain 3: Content — Portfolio + Knowledge (5 models)

### `Project`

**Purpose**: Portfolio project showcasing Al Aminn's work.

**Key fields**:
- `id`, `slug` (String, unique), `name`, `subtitle` (String?)
- `category` (String) — education | ai | software | crm | automation | marketing | research | professional-brand | client-work
- `shortDescription`, `fullDescription`, `businessProblem`, `approvedRole`, `responsibilities`, `solution`, `architecture`, `technologies`, `workflows`, `outputs`, `outcomes` (String?)
- `evidenceStatus` (String, default `unverified`) — unverified | evidence-uploaded | under-review | verified | expired | rejected | archived
- `confidentiality` (String, default `public`) — public | partially-anonymized | fully-anonymized | summary-only | private
- `status` (String, default `planned`)
- `featured` (Boolean, default false)
- `visibility` (String, default `public`)
- `startDate`, `endDate` (DateTime?)

---

### `Article`

**Purpose**: Long-form article (executive-leadership, business-operations, etc.).

**Key fields**:
- `id`, `slug` (String, unique), `title`, `summary`, `body` (String)
- `category` (String) — 11 categories: executive-leadership, business-operations, sales-growth, international-education, university-partnerships, bangladesh-market, ai-automation, crm-technology, digital-marketing, personal-branding, professional-development
- `tags`, `author` (String?, default `Al Aminn`)
- `readingMinutes` (Int, default 5)
- `verificationStatus` (String, default `verified`)
- `status` (String, default `published`) — draft | review | approved | scheduled | published | archived
- `featured` (Boolean, default false)
- `coverMedia` (String?)

---

### `Resource`

**Purpose**: Downloadable resource (guide / template / checklist / report / video).

**Key fields**:
- `id`, `slug` (String, unique), `title`, `description` (String)
- `category` (String) — 11 categories: operations, sales, education-business, university-partnerships, ai-readiness, crm-planning, digital-transformation, bangladesh-market, personal-branding, professional-growth, study-abroad
- `type` (String) — guide | template | checklist | report | video | download
- `fileUrl` (String?), `readTime` (Int, default 5), `status` (String, default `published`)

---

### `ImpactRecord`

**Purpose**: Quantified impact story with role/action/outcome.

**Key fields**:
- `id`, `category` (String) — 8 categories: operational-transformation, sales-workflow, student-journey, partnership-development, automation-systems, crm-implementation, team-accountability, platform-development
- `challenge`, `role`, `action`, `outcome` (String)
- `evidenceStatus` (String, default `verified`)
- `confidentiality` (String, default `summary-only`)
- `projectId` (String?), `date` (DateTime)

---

### `CaseStudy`

**Purpose**: Long-form case study.

**Key fields**:
- `id`, `slug` (String, unique), `title`
- `category` (String) — education-operations | ai-crm | sales-growth
- `context`, `challenge`, `role`, `intervention`, `systemBuilt`, `outcome` (String)
- `evidenceStatus` (String, default `verified`)
- `confidentiality` (String, default `summary-only`)
- `readTime` (Int, default 8), `featured` (Boolean, default false)

---

## Domain 4: AI Workspace (2 models)

### `AiTask`

**Purpose**: AI generation task (executive LinkedIn post, SEO article draft, newsletter draft, etc.).

**Key fields**:
- `id`, `requesterId` (FK → User)
- `workflow` (String) — 16+ types: executive-linkedin-post, seo-article-draft, newsletter-draft, case-study-draft, partnership-proposal, university-research-brief, operations-audit, sales-process-review, crm-requirements-draft, presentation-outline, speaking-notes, media-response, monthly-authority-report, competitor-research, resource-checklist, risk-review, brand-consistency-audit
- `project`, `objective`, `prompt` (String)
- `sensitivity` (String, default `internal`) — public | internal | confidential
- `outputFormat` (String, default `markdown`)
- `approvalRequired` (Boolean, default true)
- `reviewerId` (String?, FK → User)
- `deadline` (DateTime?)
- `status` (String, default `draft`) — 14 statuses: draft, validation, queued, accepted, researching, processing, quality-review, safety-review, awaiting-approval, revision-requested, approved, rejected, delivered, failed, cancelled
- `result` (String?), `completedAt` (DateTime?)

**Relations**: `requester` (User), `approvals` (AiApproval[])

---

### `AiApproval`

**Purpose**: Approval / rejection decision on an AiTask.

**Key fields**:
- `id`, `taskId` (FK → AiTask), `reviewerId` (String?, FK → User)
- `decision` (String?) — approved | rejected | revision
- `note` (String?), `createdAt` (DateTime)

**Relations**: `task` (AiTask), `reviewer` (User?)

---

## Domain 5: Audit & Logs (2 models)

### `AuditLog`

**Purpose**: Global audit log entry (every privileged action).

**Key fields**:
- `id`, `actorId` (String?, FK → User)
- `action` (String) — create | update | delete | publish | login | logout | cron.<name> | etc.
- `resource` (String?) — entity type
- `resourceId` (String?)
- `meta` (String?) — JSON string of additional data
- `ipHash` (String?) — sha256 hash truncated to 16 hex chars (NEVER raw IP)
- `createdAt` (DateTime)

**Relations**: `actor` (User?)

---

### `SystemHealth`

**Purpose**: Health check snapshot for monitoring.

**Key fields**:
- `id`, `component` (String) — e.g. `database`, `smtp`, `alo-education`
- `status` (String) — ok | degraded | down
- `message` (String?), `checkedAt` (DateTime)

---

## Domain 6: Notifications (1 model)

### `Notification`

**Purpose**: In-app notification for a user.

**Key fields**:
- `id`, `userId` (String?)
- `type` (String) — inquiry | meeting | ai-task | approval | system | contact | newsletter
- `title`, `message` (String)
- `read` (Boolean, default false)
- `link` (String?) — for click-through
- `createdAt` (DateTime)

**Indexes**: `@@index([userId])`, `@@index([read])`, `@@index([createdAt])`

---

## Domain 7: Analytics & Documents (2 models)

### `AnalyticsEvent`

**Purpose**: Privacy-friendly first-party analytics event.

> **Privacy design**: NO raw IP, NO user ID, NO email. `ipHash` is sha256 truncated to 16 hex chars. `sessionId` is a daily-rotating anonymous ID stored in localStorage (NOT cookies). UTM fields are marketing attribution.

**Key fields**:
- `id`, `createdAt`, `eventName` (String)
- `page`, `referrer` (String?)
- `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm` (String?)
- `sessionId` (String?) — anonymous, rotated daily
- `ipHash` (String?) — sha256 hash, never the raw IP
- `meta` (String?) — JSON string for event-specific data

**Indexes**: `@@index([eventName, createdAt])`, `@@index([createdAt])`

---

### `Document`

**Purpose**: Document file (contract / proposal / report / legal / financial / media).

**Key fields**:
- `id`, `title`, `fileName`, `fileUrl` (String)
- `mimeType` (String?), `size` (Int?)
- `category` (String?) — contract | proposal | report | legal | financial | media | other
- `description` (String?)
- `uploadedById` (String?, FK → User)

**Indexes**: `@@index([category])`, `@@index([createdAt])`

---

## Domain 8: Site Settings & Media (2 models)

### `Setting`

**Purpose**: Generic key-value store for site-level configuration (SEO meta, maintenance flag, robots.txt overrides).

**Key fields**: `id`, `key` (String, unique), `value` (String), `updatedAt` (DateTime)

---

### `MediaAsset`

**Purpose**: Media library entry (brand / portrait / project / article / case-study / general).

**Key fields**:
- `id`, `filename`, `url` (String)
- `altText`, `mimeType` (String?)
- `size`, `width`, `height` (Int?)
- `category` (String?) — brand | portrait | project | article | case-study | general
- `createdAt` (DateTime)

**Indexes**: `@@index([category])`, `@@index([createdAt])`

---

## Domain 9: Higher Study Platform (19 models)

### `HigherStudyCountry`

**Purpose**: Study destination country (UK, USA, Canada, etc.).

**Key fields**:
- `id`, `slug` (String, unique), `name`, `officialName` (String?)
- `region` (String?) — Europe | North America | Asia-Pacific | Middle East
- `overview`, `educationSystem`, `studyLevels`, `popularSubjects`, `tuitionFeeRange`, `livingCostRange`, `majorStudentCities`, `admissionRequirements`, `englishRequirements`, `availableIntakes`, `applicationDeadlines` (String?)
- `scholarshipsAvailable`, `researchOpportunities` (Boolean, default true)
- `studentVisaOverview`, `financialEvidence`, `workRights`, `postStudyOpportunities`, `accommodation`, `healthcare`, `transport`, `studentSafety`, `culturalInfo`, `applicationProcess`, `requiredDocuments` (String?)
- `faq`, `officialSources` (String?) — JSON strings
- `imageUrl`, `flagEmoji` (String?)
- `status` (String, default `published`) — draft | pending-review | approved | published | needs-update | archived
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy`, `officialSourceUrl` (String?)

**Relations**: `cities` (HigherStudyCity[]), `universities` (HigherStudyUniversity[]), `courses` (HigherStudyCourse[]), `scholarships` (HigherStudyScholarship[])

**Indexes**: `@@index([region])`, `@@index([status])`

---

### `HigherStudyCity`

**Purpose**: City in a country (London, Boston, Toronto, etc.).

**Key fields**:
- `id`, `slug` (String, unique), `name`
- `countryId` (String, FK → HigherStudyCountry, onDelete: Cascade)
- `overview`, `livingCost`, `transport`, `accommodation`, `studentLife` (String?)
- `status` (String, default `published`)

**Relations**: `country` (HigherStudyCountry), `universities` (HigherStudyUniversity[])

---

### `HigherStudyUniversity`

**Purpose**: University record (Oxford, Cambridge, MIT, etc.).

**Key fields** (60+ fields):
- `id`, `slug` (String, unique), `officialName`, `alternativeNames` (String?)
- `overview` (String?), `establishedYear` (Int?)
- `institutionType` (String?) — public | private | specialist | conservatoire | research-intensive | modern
- `countryId` (FK → HigherStudyCountry, onDelete: Cascade), `cityId` (String?, FK → HigherStudyCity)
- `campusLocations`, `officialWebsite`, `contactEmail`, `contactPhone`, `availableIntakes`, `studyLevels` (String?)
- `undergraduateCount`, `postgraduateCount` (Int?)
- `hasMBA`, `hasMRes`, `hasMPhil`, `hasPhD`, `hasProfessionalDoctorate` (Boolean, default false)
- `researchDepartments`, `researchStrengths`, `tuitionFeeRange`, `depositInfo` (String?)
- `academicEntryRequirements`, `countrySpecificRequirements` (String?)
- `ieltsRequirement`, `ieltsUkviRequirement`, `pteRequirement`, `toeflRequirement`, `duolingoRequirement`, `languageCertRequirement`, `oxfordElltRequirement`, `englishWaiverPolicy` (String?)
- `workExperienceRequired`, `portfolioRequired`, `interviewRequired` (Boolean, default false)
- `applicationDeadlines`, `accommodationOptions`, `estimatedLivingCosts`, `internationalStudentServices`, `disabilitySupport`, `careerSupport`, `graduateOutcomes`, `graduateRouteGuidance`, `applicationGuidance` (String?)
- `officialLinks`, `rankingsJson` (String?) — JSON strings
- `logoUrl` (String?), `featured` (Boolean, default false)
- `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy`, `officialSourceUrl` (String?)

**Relations**: `country`, `city`, `courses` (HigherStudyCourse[]), `scholarships` (HigherStudyScholarship[]), `researchProjects` (HigherStudyResearchProject[]), `supervisors` (HigherStudySupervisor[])

**Indexes**: `@@index([countryId])`, `@@index([cityId])`, `@@index([featured])`, `@@index([verificationStatus])`, `@@index([publicationStatus])`

---

### `HigherStudySubject`

**Purpose**: Subject (STEM, Business, Humanities, Arts, Social Sciences, Medicine, Law).

**Key fields**: `id`, `slug` (String, unique), `name`, `category` (String?), `description` (String?), `iconUrl` (String?)

**Relations**: `courses` (HigherStudyCourse[])

**Indexes**: `@@index([category])`

---

### `HigherStudyIntake`

**Purpose**: Application intake (Fall 2026, Spring 2027, etc.).

**Key fields**:
- `id`, `slug` (String, unique), `name` (String)
- `startDate`, `endDate`, `applicationDeadline` (DateTime?)
- `status` (String, default `open`) — open | closed | upcoming

**Relations**: `courses` (HigherStudyCourse[])

**Indexes**: `@@index([status])`, `@@index([applicationDeadline])`

---

### `HigherStudyCourse`

**Purpose**: Course offered by a university.

**Key fields** (40+ fields):
- `id`, `slug` (String, unique), `title`
- `universityId` (FK → HigherStudyUniversity, onDelete: Cascade)
- `countryId` (String?, FK → HigherStudyCountry)
- `subjectId` (String?, FK → HigherStudySubject)
- `studyLevel` (String) — 30+ levels: foundation, international-year-one, diploma, hnd, bachelors, bachelors-topup, graduate-certificate, graduate-diploma, pre-masters, masters, mba, executive-mba, msc, ma, llm, meng, march, mph, mpa, mres, mphil, phd, dba, edd, dprof, engineering-doctorate, postdoc, research-fellowship, online, distance, blended, executive-education, professional-cert
- `qualification`, `specialisation`, `overview`, `modules`, `duration`, `studyMode` (String?)
- `tuitionFee` (Int?), `tuitionCurrency` (String, default `USD`), `otherCosts` (String?)
- `scholarshipAvailable` (Boolean, default false)
- `academicEntryRequirements`, `countrySpecificRequirements`, `englishRequirements` (String?)
- `workExperienceRequired`, `portfolioRequired`, `interviewRequired` (Boolean, default false)
- `careerOutcomes`, `placementInfo`, `researchComponent`, `applicationDeadline`, `requiredDocuments` (String?)
- `intakeId` (String?, FK → HigherStudyIntake)
- `officialSourceUrl` (String?), `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy` (String?)
- `featured` (Boolean, default false)

**Relations**: `university`, `country`, `subject`, `intake`

**Indexes**: `@@index([universityId])`, `@@index([countryId])`, `@@index([subjectId])`, `@@index([studyLevel])`, `@@index([intakeId])`, `@@index([featured])`, `@@index([verificationStatus])`

---

### `HigherStudyScholarship`

**Purpose**: Scholarship (Chevening, Commonwealth, Gates Cambridge, etc.).

**Key fields** (30+ fields):
- `id`, `slug` (String, unique), `name`, `provider` (String?)
- `countryId` (String?, FK → HigherStudyCountry)
- `universityId` (String?, FK → HigherStudyUniversity)
- `eligibleStudyLevels`, `eligibleSubjects`, `eligibleNationalities` (String?)
- `fundingType` (String?) — 20+ types: fully-funded, partially-funded, government, university, department, research-council, merit, need, country-specific, subject-specific, women, leadership, sports, disability, phd-studentship, research-assistantship, teaching-assistantship, tuition-discount, fee-waiver, bursary, grant, fellowship, travel, living-cost
- `fundingAmount` (String?)
- `tuitionCoverage`, `livingCostCoverage`, `travelSupport`, `healthInsurance` (Boolean, default false)
- `otherBenefits`, `eligibilityCriteria`, `academicRequirement`, `englishRequirement` (String?)
- `workExperienceRequired` (Boolean, default false)
- `requiredDocuments`, `applicationProcess`, `selectionProcess`, `restrictions` (String?)
- `openingDate`, `deadline` (DateTime?)
- `officialSourceUrl` (String?), `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy` (String?)
- `featured` (Boolean, default false)

**Relations**: `country`, `university`

**Indexes**: `@@index([countryId])`, `@@index([universityId])`, `@@index([fundingType])`, `@@index([deadline])`, `@@index([featured])`, `@@index([verificationStatus])`

---

### `HigherStudyResearchArea`

**Purpose**: Research area (AI, Biotech, Climate, etc.).

**Key fields**: `id`, `slug` (String, unique), `name`, `description` (String?)

**Relations**: `researchProjects` (HigherStudyResearchProject[]), `supervisors` (HigherStudySupervisor[])

**Indexes**: `@@index([name])`

---

### `HigherStudyResearchProject`

**Purpose**: PhD / research project.

**Key fields** (25+ fields):
- `id`, `slug` (String, unique), `title`
- `universityId` (FK → HigherStudyUniversity, onDelete: Cascade)
- `department`, `researchGroupId` (String?)
- `researchAreaId` (String?, FK → HigherStudyResearchArea)
- `supervisorId` (String?, FK → HigherStudySupervisor)
- `coSupervisorId` (String?)
- `projectSummary`, `researchObjectives`, `methodologySummary`, `candidateProfile`, `academicRequirements`, `englishRequirements` (String?)
- `fundingStatus` (String?) — fully-funded | partially-funded | self-funded | studentship | unfunded
- `tuitionCoverage` (Boolean, default false)
- `stipend`, `additionalFunding`, `duration` (String?)
- `startDate`, `applicationDeadline` (DateTime?)
- `requiredDocuments`, `applicationProcess` (String?)
- `officialSourceUrl` (String?), `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy` (String?)
- `featured` (Boolean, default false)

**Relations**: `university`, `researchArea`, `supervisor`

**Indexes**: `@@index([universityId])`, `@@index([researchAreaId])`, `@@index([supervisorId])`, `@@index([fundingStatus])`, `@@index([applicationDeadline])`, `@@index([featured])`

---

### `HigherStudySupervisor`

**Purpose**: Academic supervisor.

**Key fields**:
- `id`, `slug` (String, unique), `name`, `academicTitle` (String?) — Professor, Dr, Lecturer
- `universityId` (FK → HigherStudyUniversity, onDelete: Cascade)
- `department`, `publicProfileUrl` (String?)
- `researchAreaId` (String?, FK → HigherStudyResearchArea)
- `researchInterests` (String?) — comma-separated
- `selectedPublications`, `currentProjects` (String?) — JSON strings
- `acceptingStudents` (Boolean, default false)
- `applicationGuidance` (String?)
- `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy`, `officialSourceUrl` (String?)

**Relations**: `university`, `researchArea`, `researchProjects` (HigherStudyResearchProject[])

**Indexes**: `@@index([universityId])`, `@@index([researchAreaId])`, `@@index([acceptingStudents])`, `@@index([verificationStatus])`

---

### `HigherStudyResource`

**Purpose**: Study resource (planning / country-guides / SOP / personal-statement / CV / visa / IELTS / etc.).

**Key fields** (20+ fields):
- `id`, `slug` (String, unique), `title`
- `category` (String?) — 30+ categories: planning, country-guides, university-guides, course-selection, scholarship-guides, phd-guides, research-guides, proposal-guides, supervisor-contact, sop, personal-statement, cv, recommendation-letter, portfolio, visa, financial, accommodation, pre-departure, student-life, checklists, interview, ielts, ielts-ukvi, pte, toefl, duolingo, languagecert, academic-writing, research-methods, publication, referencing, research-ethics, comparison, faq
- `summary`, `content` (String?) — markdown body
- `author`, `reviewer` (String?)
- `publishedAt`, `lastVerifiedAt` (DateTime?), `readingTimeMinutes` (Int?)
- `tableOfContents`, `relatedUniversitySlugs`, `relatedCourseSlugs`, `relatedScholarshipSlugs` (String?)
- `officialSourceUrl` (String?), `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `featured` (Boolean, default false)

**Indexes**: `@@index([category])`, `@@index([featured])`, `@@index([verificationStatus])`, `@@index([publishedAt])`

---

### `HigherStudyStudentStory`

**Purpose**: Student success story.

**Key fields**: `id`, `slug` (String, unique), `studentName`, `universityName`, `courseName`, `country`, `intake`, `story`, `advice` (String?), `imageUrl` (String?), `publishedAt` (DateTime?), `featured` (Boolean, default false)

**Indexes**: `@@index([featured])`, `@@index([publishedAt])`

---

### `HigherStudyEvent`

**Purpose**: Event / webinar.

**Key fields**: `id`, `slug` (String, unique), `title`, `description` (String?), `eventDate` (DateTime), `endDate` (DateTime?), `location` (String?) — online | city name, `organiser`, `registrationUrl`, `imageUrl` (String?), `status` (String, default `upcoming`) — upcoming | live | ended | cancelled

**Indexes**: `@@index([eventDate])`, `@@index([status])`

---

### `HigherStudySavedItem`

**Purpose**: Anonymous (sessionId) or authenticated (userId) saved entity.

**Key fields**:
- `id`, `userId` (String?), `sessionId` (String?)
- `entityType` (String) — university | course | scholarship | research | supervisor | resource | comparison
- `entitySlug`, `entityName` (String)
- `notes` (String?), `createdAt` (DateTime)

**Unique constraints**: `@@unique([userId, entityType, entitySlug])`, `@@unique([sessionId, entityType, entitySlug])`

**Indexes**: `@@index([userId, entityType])`, `@@index([sessionId, entityType])`

---

### `HigherStudyComparison`

**Purpose**: Comparison set (max 4 entities).

**Key fields**: `id`, `userId` (String?), `sessionId` (String?), `entityType` (String) — university | course | scholarship, `entitySlugs` (String) — comma-separated list (max 4), `name` (String?), `createdAt` (DateTime)

**Indexes**: `@@index([userId, entityType])`, `@@index([sessionId, entityType])`

---

### `HigherStudyReferral`

**Purpose**: ALO Education referral audit row (server-to-server handoff audit).

**Key fields**:
- `id`, `referralCode` (String, unique) — short-lived signed token
- `source` (String, default `ALAMINN_HIGHER_STUDY`)
- `referralType` (String) — 11 types: course-application, university-application, scholarship-application, phd-application, research-application, supervisor-enquiry, eligibility-check, consultation, resource-referral, deadline-alert, english-referral
- `targetUrl` (String) — ALO Education destination URL
- `countrySlug`, `universitySlug`, `courseSlug`, `scholarshipSlug`, `researchSlug`, `supervisorSlug`, `studyLevel`, `intake`, `campaignCode` (String?) — public context (NO PII)
- `consentGiven` (Boolean, default false), `consentVersion` (String?), `consentTimestamp` (DateTime?)
- `status` (String, default `created`) — created | transferred | completed | failed | expired
- `transferredAt`, `completedAt` (DateTime?)
- `failureReason` (String?)
- `expiresAt` (DateTime?) — 24h TTL
- `ipHash` (String?) — sha256 truncated to 16 hex chars (NEVER raw IP)
- `deviceCategory` (String?) — mobile | tablet | desktop

**Indexes**: `@@index([status])`, `@@index([createdAt])`, `@@index([referralType])`

---

### `HigherStudyAlert`

**Purpose**: Deadline alert subscription.

**Key fields**:
- `id`, `userId` (String?), `sessionId` (String?)
- `email`, `whatsapp` (String?) — whatsapp only with explicit consent
- `entityType` (String) — scholarship | research | course | event
- `entitySlug`, `entityName` (String)
- `deadlineDate` (DateTime)
- `alertChannel` (String, default `email`) — email | in-app | whatsapp
- `alertSent` (Boolean, default false), `alertSentAt` (DateTime?)
- `consentGiven` (Boolean, default false), `consentTimestamp` (DateTime?)
- `status` (String, default `active`) — active | fired | cancelled | expired

**Indexes**: `@@index([userId, status])`, `@@index([sessionId, status])`, `@@index([deadlineDate])`

---

### `HigherStudyAuditLog`

**Purpose**: Higher-Study-specific audit log (per-entity before/after diff).

**Key fields**:
- `id`, `actorUserId` (String?)
- `action` (String) — create | update | publish | archive | verify | import | delete
- `entityType`, `entityId` (String), `entitySlug` (String?)
- `beforeData`, `afterData` (String?) — JSON strings
- `ipHash`, `userAgent` (String?), `createdAt` (DateTime)

**Indexes**: `@@index([actorUserId])`, `@@index([entityType, entityId])`, `@@index([createdAt])`

---

### `HigherStudyImportJob`

**Purpose**: Bulk import job (CSV → universities / courses / scholarships / etc.).

**Key fields**:
- `id`, `fileName`, `fileType` (String, default `csv`)
- `entityType` (String) — university | course | scholarship | research | supervisor | resource
- `totalRows`, `processedRows`, `successRows`, `errorRows` (Int, default 0)
- `status` (String, default `pending`) — pending | preview | importing | completed | failed | cancelled
- `dryRun` (Boolean, default false)
- `errors` (String?) — JSON string of {row, error}[]
- `startedAt`, `completedAt` (DateTime?), `createdBy` (String?)

**Indexes**: `@@index([status])`, `@@index([entityType])`

---

## Domain 10: English Learning Platform (11 models)

### `EnglishLearningCourse`

**Purpose**: English course (IELTS / TOEFL / PTE / DET / GRE / GMAT, beginner–advanced).

**Key fields** (25+ fields):
- `id`, `slug` (String, unique), `title`, `summary` (String?), `description` (String?) — markdown
- `level` (String, default `intermediate`) — beginner | intermediate | advanced | ielts | toefl | pte | det | gre | gmat
- `durationWeeks`, `hoursPerWeek` (Int?), `priceUsd` (Int?), `currency` (String, default `USD`)
- `isFeatured`, `isPublished` (Boolean, default true / false respectively)
- `verificationStatus` (String, default `verified`), `publicationStatus` (String, default `published`)
- `lastVerifiedAt` (DateTime?), `lastVerifiedBy`, `officialSourceUrl` (String?)
- `createdByUserId` (String?)
- `metaTitle`, `metaDescription`, `keywords`, `tags`, `syllabus`, `prerequisites`, `targetAudience`, `learningOutcomes` (Json?)
- `certificationType` (String?), `passScore` (Int?), `enrollmentCount` (Int, default 0)
- `heroImageUrl`, `introVideoUrl` (String?)

**Relations**: `lessons` (EnglishLearningLesson[]), `enrollments` (EnglishLearningEnrollment[])

**Indexes**: `@@index([level])`, `@@index([isFeatured])`, `@@index([isPublished])`, `@@index([verificationStatus])`, `@@index([publicationStatus])`

---

### `EnglishLearningLesson`

**Purpose**: Lesson within a course.

**Key fields**:
- `id`, `courseId` (FK → EnglishLearningCourse, onDelete: Cascade)
- `slug` (String, unique), `title`, `summary` (String?), `content` (String?) — markdown
- `orderIndex` (Int, default 0), `durationMinutes` (Int?)
- `lessonType` (String, default `video`) — video | reading | listening | speaking | writing | grammar | vocab | quiz
- `videoUrl`, `transcript` (String?) — markdown
- `isFreePreview`, `isPublished` (Boolean, default false / true respectively)

**Relations**: `course`, `progress` (EnglishLearningProgress[])

**Indexes**: `@@index([courseId])`, `@@index([lessonType])`, `@@index([isFreePreview])`, `@@index([isPublished])`, `@@index([orderIndex])`

---

### `EnglishLearningPracticeTest`

**Purpose**: Mock test (IELTS reading/listening/writing/speaking, TOEFL, PTE, etc.).

**Key fields**:
- `id`, `slug` (String, unique), `title`, `description` (String?)
- `testType` (String, default `ielts-reading`) — ielts-reading | ielts-listening | ielts-writing | ielts-speaking | toefl-reading | toefl-listening | toefl-writing | toefl-speaking | pte | duolingo | gre-verbal | gmat-verbal
- `level` (String, default `intermediate`)
- `durationMinutes`, `totalQuestions` (Int?), `passingScore` (Int?)
- `isPublished` (Boolean, default true), `isFeatured` (Boolean, default false)

**Relations**: `questions` (EnglishLearningQuestion[]), `progress` (EnglishLearningProgress[])

**Indexes**: `@@index([testType])`, `@@index([level])`, `@@index([isPublished])`, `@@index([isFeatured])`

---

### `EnglishLearningQuestion`

**Purpose**: Question in a practice test.

**Key fields**:
- `id`, `testId` (FK → EnglishLearningPracticeTest, onDelete: Cascade)
- `questionType` (String, default `multiple-choice`) — multiple-choice | true-false | fill-blank | short-answer | essay | matching
- `questionText` (String)
- `options` (Json?), `correctAnswer` (String?), `explanation` (String?) — markdown
- `points` (Int, default 1), `orderIndex` (Int, default 0)
- `skillArea` (String, default `reading`) — reading | listening | speaking | writing | grammar | vocab

**Indexes**: `@@index([testId])`, `@@index([questionType])`, `@@index([skillArea])`, `@@index([orderIndex])`

---

### `EnglishLearningTutor`

**Purpose**: English tutor.

**Key fields**:
- `id`, `slug` (String, unique), `name`, `bio` (String?), `avatarUrl` (String?)
- `specialties`, `qualifications` (Json?)
- `yearsExperience`, `hourlyRateUsd` (Int?), `currency` (String, default `USD`)
- `rating` (Float, default 0), `reviewCount` (Int, default 0)
- `isAvailable`, `isPublished` (Boolean, default true)
- `verificationStatus` (String, default `verified`)
- `lastVerifiedAt` (DateTime?), `officialProfileUrl` (String?)

**Indexes**: `@@index([isAvailable])`, `@@index([isPublished])`, `@@index([verificationStatus])`, `@@index([rating])`

---

### `EnglishLearningResource`

**Purpose**: English learning resource (article / video / infographic / audio / pdf).

**Key fields**:
- `id`, `slug` (String, unique), `title`, `summary` (String?), `description` (String?) — markdown
- `resourceType` (String, default `article`) — article | video | infographic | audio | pdf
- `url` (String?), `durationMinutes`, `readingTimeMinutes` (Int?)
- `level` (String, default `intermediate`)
- `isPublished`, `isFeatured` (Boolean, default true / false respectively)
- `authorName`, `sourceName` (String?)

**Indexes**: `@@index([resourceType])`, `@@index([level])`, `@@index([isPublished])`, `@@index([isFeatured])`

---

### `EnglishLearningEnrollment`

**Purpose**: Student enrollment in a course.

**Key fields**:
- `id`, `userId` (String?), `sessionId` (String), `courseId` (FK → EnglishLearningCourse, onDelete: Cascade)
- `status` (String, default `enrolled`) — enrolled | started | completed | abandoned
- `progressPercent` (Int, default 0)
- `lastAccessedAt`, `completedAt` (DateTime?)

**Relations**: `course`, `progress` (EnglishLearningProgress[])

**Unique**: `@@unique([sessionId, courseId])`

**Indexes**: `@@index([userId])`, `@@index([sessionId])`, `@@index([courseId])`, `@@index([status])`

---

### `EnglishLearningProgress`

**Purpose**: Progress on a lesson or test.

**Key fields**:
- `id`, `enrollmentId` (FK → EnglishLearningEnrollment, onDelete: Cascade)
- `lessonId` (String?, FK → EnglishLearningLesson, onDelete: SetNull)
- `testId` (String?, FK → EnglishLearningPracticeTest, onDelete: SetNull)
- `status` (String, default `not-started`) — not-started | in-progress | completed
- `scorePercent`, `timeSpentMinutes` (Int?), `attemptsCount` (Int, default 0)
- `lastAttemptAt` (DateTime?)

**Relations**: `enrollment`, `lesson`, `test`

**Indexes**: `@@index([enrollmentId])`, `@@index([lessonId])`, `@@index([testId])`, `@@index([status])`

---

### `EnglishLearningReferral`

**Purpose**: English platform referral audit row.

**Key fields**:
- `id`, `referralCode` (String, unique)
- `referralType` (String, default `course-package`) — course-package | tutor-booking | mock-test-bundle
- `sourceEntityId`, `sourceEntityType` (String?) — e.g. course ID + `course`
- `targetUrl` (String)
- `status` (String, default `created`) — created | transferred | completed | failed | expired
- `createdAt`, `completedAt` (DateTime?)
- `ipHash`, `userAgent` (String?), `notes` (Json?)

**Indexes**: `@@index([status])`, `@@index([referralType])`, `@@index([createdAt])`

---

### `EnglishLearningAuditLog`

**Purpose**: English-Learning-specific audit log.

**Key fields**:
- `id`, `actorUserId` (String?), `action` (String)
- `entityType`, `entityId` (String)
- `beforeData`, `afterData` (Json?)
- `ipHash`, `userAgent` (String?), `createdAt` (DateTime)

**Indexes**: `@@index([actorUserId])`, `@@index([entityType, entityId])`, `@@index([createdAt])`, `@@index([action])`

---

### `EnglishLearningSetting`

**Purpose**: English-Learning-specific key-value settings.

**Key fields**: `id`, `key` (String, unique), `value` (String), `category` (String, default `general`), `updatedAt` (DateTime)

**Indexes**: `@@index([category])`

---

## Summary

| Domain | Models | Count |
|---|---|---|
| Identity & Auth | User, Contact, Organization | 3 |
| CRM | Inquiry, Opportunity, Partnership, StudentReferral, Task, Note, NewsletterSubscriber, MeetingRequest | 8 |
| Content | Project, Article, Resource, ImpactRecord, CaseStudy | 5 |
| AI Workspace | AiTask, AiApproval | 2 |
| Audit & Logs | AuditLog, SystemHealth | 2 |
| Notifications | Notification | 1 |
| Analytics & Documents | AnalyticsEvent, Document | 2 |
| Site Settings & Media | Setting, MediaAsset | 2 |
| Higher Study Platform | 19 models (see above) | 19 |
| English Learning Platform | 11 models (see above) | 11 |
| **Total** | | **55** |

---

## Index strategy

The schema declares `@@index` on every foreign key and every frequently-queried field (status, slug, featured, verificationStatus, deadlines, etc.). This ensures:

- O(log n) lookups on indexed columns (no full table scans)
- Efficient pagination on large tables (HigherStudyUniversity, HigherStudyCourse, HigherStudyScholarship, etc.)
- Fast filtering by status / verificationStatus / featured in admin views
- Fast deadline queries for the scholarship-deadlines and phd-deadlines cron jobs

---

## Reference

- **Schema file**: `prisma/schema.prisma` (1,281 lines)
- **Generator**: `prisma-client-js`
- **Dev provider**: `sqlite`
- **Prod provider**: `mysql`
- **Database (prod)**: `aloeduca_alamin_crm` (MySQL 8.0.37, utf8mb4_unicode_ci)
- **Total models**: 55
- **Domains**: 10 (Identity, CRM, Content, AI Workspace, Audit, Notifications, Analytics, Settings/Media, Higher Study, English Learning)
- **Migration strategy**: `prisma db push` (no migration history) OR `prisma migrate deploy` (if migrations are added)
- **Seed script**: `prisma/seed.ts` (~274 records)
- **Verify script**: `scripts/verify-db.ts`
