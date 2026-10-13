-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'active',
    "passwordHash" TEXT,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "organization" TEXT,
    "role" TEXT,
    "country" TEXT,
    "city" TEXT,
    "preferredChannel" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "country" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdById" TEXT,
    "currentChallenge" TEXT,
    "desiredOutcome" TEXT,
    "timeline" TEXT,
    "scope" TEXT,
    "existingSystem" TEXT,
    "preferredTime" TEXT,
    "notes" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referralSource" TEXT,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "commsConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "studentDataConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ipHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "title" TEXT NOT NULL,
    "value" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stage" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "closeDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new-institution',
    "alAminnRole" TEXT,
    "problemSolved" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Partnership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "studentName" TEXT NOT NULL,
    "interestCountry" TEXT,
    "interestProgram" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "stage" TEXT NOT NULL DEFAULT 'new-referral',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentReferral_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentReferral_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigneeId" TEXT,
    "contactId" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "contactId" TEXT,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "interest" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "token" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "businessProblem" TEXT,
    "approvedRole" TEXT,
    "responsibilities" TEXT,
    "solution" TEXT,
    "architecture" TEXT,
    "technologies" TEXT,
    "workflows" TEXT,
    "outputs" TEXT,
    "outcomes" TEXT,
    "evidenceStatus" TEXT NOT NULL DEFAULT 'unverified',
    "confidentiality" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "approvedUrl" TEXT,
    "logo" TEXT,
    "coverMedia" TEXT,
    "gallery" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Al Aminn',
    "readingMinutes" INTEGER NOT NULL DEFAULT 5,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "coverMedia" TEXT
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "readTime" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImpactRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "evidenceStatus" TEXT NOT NULL DEFAULT 'verified',
    "confidentiality" TEXT NOT NULL DEFAULT 'summary-only',
    "projectId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "intervention" TEXT NOT NULL,
    "systemBuilt" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "evidenceStatus" TEXT NOT NULL DEFAULT 'verified',
    "confidentiality" TEXT NOT NULL DEFAULT 'summary-only',
    "readTime" INTEGER NOT NULL DEFAULT 8,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "project" TEXT,
    "objective" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL DEFAULT 'internal',
    "outputFormat" TEXT NOT NULL DEFAULT 'markdown',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "reviewerId" TEXT,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "AiTask_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "decision" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiApproval_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AiApproval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "meta" TEXT,
    "ipHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "component" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MeetingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL,
    "requestedDate" DATETIME NOT NULL,
    "requestedTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "organization" TEXT,
    "topic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ipHash" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventName" TEXT NOT NULL,
    "page" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "sessionId" TEXT,
    "ipHash" TEXT,
    "meta" TEXT
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "category" TEXT,
    "description" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyCountry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "region" TEXT,
    "overview" TEXT,
    "educationSystem" TEXT,
    "studyLevels" TEXT,
    "popularSubjects" TEXT,
    "tuitionFeeRange" TEXT,
    "livingCostRange" TEXT,
    "majorStudentCities" TEXT,
    "admissionRequirements" TEXT,
    "englishRequirements" TEXT,
    "availableIntakes" TEXT,
    "applicationDeadlines" TEXT,
    "scholarshipsAvailable" BOOLEAN NOT NULL DEFAULT true,
    "researchOpportunities" BOOLEAN NOT NULL DEFAULT true,
    "studentVisaOverview" TEXT,
    "financialEvidence" TEXT,
    "workRights" TEXT,
    "postStudyOpportunities" TEXT,
    "accommodation" TEXT,
    "healthcare" TEXT,
    "transport" TEXT,
    "studentSafety" TEXT,
    "culturalInfo" TEXT,
    "applicationProcess" TEXT,
    "requiredDocuments" TEXT,
    "faq" TEXT,
    "officialSources" TEXT,
    "imageUrl" TEXT,
    "flagEmoji" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "officialSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HigherStudyCity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "overview" TEXT,
    "livingCost" TEXT,
    "transport" TEXT,
    "accommodation" TEXT,
    "studentLife" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HigherStudyCity_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "HigherStudyCountry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HigherStudyUniversity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "officialName" TEXT NOT NULL,
    "alternativeNames" TEXT,
    "overview" TEXT,
    "establishedYear" INTEGER,
    "institutionType" TEXT,
    "countryId" TEXT NOT NULL,
    "cityId" TEXT,
    "campusLocations" TEXT,
    "officialWebsite" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "availableIntakes" TEXT,
    "studyLevels" TEXT,
    "undergraduateCount" INTEGER,
    "postgraduateCount" INTEGER,
    "hasMBA" BOOLEAN NOT NULL DEFAULT false,
    "hasMRes" BOOLEAN NOT NULL DEFAULT false,
    "hasMPhil" BOOLEAN NOT NULL DEFAULT false,
    "hasPhD" BOOLEAN NOT NULL DEFAULT false,
    "hasProfessionalDoctorate" BOOLEAN NOT NULL DEFAULT false,
    "researchDepartments" TEXT,
    "researchStrengths" TEXT,
    "tuitionFeeRange" TEXT,
    "depositInfo" TEXT,
    "academicEntryRequirements" TEXT,
    "countrySpecificRequirements" TEXT,
    "ieltsRequirement" TEXT,
    "ieltsUkviRequirement" TEXT,
    "pteRequirement" TEXT,
    "toeflRequirement" TEXT,
    "duolingoRequirement" TEXT,
    "languageCertRequirement" TEXT,
    "oxfordElltRequirement" TEXT,
    "englishWaiverPolicy" TEXT,
    "workExperienceRequired" BOOLEAN NOT NULL DEFAULT false,
    "portfolioRequired" BOOLEAN NOT NULL DEFAULT false,
    "interviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "applicationDeadlines" TEXT,
    "accommodationOptions" TEXT,
    "estimatedLivingCosts" TEXT,
    "internationalStudentServices" TEXT,
    "disabilitySupport" TEXT,
    "careerSupport" TEXT,
    "graduateOutcomes" TEXT,
    "graduateRouteGuidance" TEXT,
    "applicationGuidance" TEXT,
    "officialLinks" TEXT,
    "rankingsJson" TEXT,
    "logoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "officialSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HigherStudyUniversity_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "HigherStudyCountry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyUniversity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "HigherStudyCity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HigherStudySubject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "iconUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HigherStudyIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "applicationDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HigherStudyCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "countryId" TEXT,
    "subjectId" TEXT,
    "studyLevel" TEXT NOT NULL,
    "qualification" TEXT,
    "specialisation" TEXT,
    "overview" TEXT,
    "modules" TEXT,
    "duration" TEXT,
    "studyMode" TEXT,
    "tuitionFee" INTEGER,
    "tuitionCurrency" TEXT NOT NULL DEFAULT 'USD',
    "otherCosts" TEXT,
    "scholarshipAvailable" BOOLEAN NOT NULL DEFAULT false,
    "academicEntryRequirements" TEXT,
    "countrySpecificRequirements" TEXT,
    "englishRequirements" TEXT,
    "workExperienceRequired" BOOLEAN NOT NULL DEFAULT false,
    "portfolioRequired" BOOLEAN NOT NULL DEFAULT false,
    "interviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "careerOutcomes" TEXT,
    "placementInfo" TEXT,
    "researchComponent" TEXT,
    "applicationDeadline" TEXT,
    "requiredDocuments" TEXT,
    "intakeId" TEXT,
    "officialSourceUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HigherStudyCourse_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "HigherStudyUniversity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyCourse_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "HigherStudyCountry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyCourse_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "HigherStudySubject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyCourse_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "HigherStudyIntake" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HigherStudyScholarship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "countryId" TEXT,
    "universityId" TEXT,
    "eligibleStudyLevels" TEXT,
    "eligibleSubjects" TEXT,
    "eligibleNationalities" TEXT,
    "fundingType" TEXT,
    "fundingAmount" TEXT,
    "tuitionCoverage" BOOLEAN NOT NULL DEFAULT false,
    "livingCostCoverage" BOOLEAN NOT NULL DEFAULT false,
    "travelSupport" BOOLEAN NOT NULL DEFAULT false,
    "healthInsurance" BOOLEAN NOT NULL DEFAULT false,
    "otherBenefits" TEXT,
    "eligibilityCriteria" TEXT,
    "academicRequirement" TEXT,
    "englishRequirement" TEXT,
    "workExperienceRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocuments" TEXT,
    "openingDate" DATETIME,
    "deadline" DATETIME,
    "applicationProcess" TEXT,
    "selectionProcess" TEXT,
    "restrictions" TEXT,
    "officialSourceUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HigherStudyScholarship_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "HigherStudyCountry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyScholarship_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "HigherStudyUniversity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HigherStudyResearchArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HigherStudyResearchProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "department" TEXT,
    "researchGroupId" TEXT,
    "researchAreaId" TEXT,
    "supervisorId" TEXT,
    "coSupervisorId" TEXT,
    "projectSummary" TEXT,
    "researchObjectives" TEXT,
    "methodologySummary" TEXT,
    "candidateProfile" TEXT,
    "academicRequirements" TEXT,
    "englishRequirements" TEXT,
    "fundingStatus" TEXT,
    "tuitionCoverage" BOOLEAN NOT NULL DEFAULT false,
    "stipend" TEXT,
    "additionalFunding" TEXT,
    "duration" TEXT,
    "startDate" DATETIME,
    "applicationDeadline" DATETIME,
    "requiredDocuments" TEXT,
    "applicationProcess" TEXT,
    "officialSourceUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HigherStudyResearchProject_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "HigherStudyUniversity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyResearchProject_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "HigherStudyResearchArea" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HigherStudyResearchProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "HigherStudySupervisor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HigherStudySupervisor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicTitle" TEXT,
    "universityId" TEXT NOT NULL,
    "department" TEXT,
    "publicProfileUrl" TEXT,
    "researchAreaId" TEXT,
    "researchInterests" TEXT,
    "selectedPublications" TEXT,
    "currentProjects" TEXT,
    "acceptingStudents" BOOLEAN NOT NULL DEFAULT false,
    "applicationGuidance" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "officialSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HigherStudySupervisor_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "HigherStudyUniversity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HigherStudySupervisor_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "HigherStudyResearchArea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HigherStudyResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "author" TEXT,
    "reviewer" TEXT,
    "publishedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "lastVerifiedAt" DATETIME,
    "readingTimeMinutes" INTEGER,
    "tableOfContents" TEXT,
    "relatedUniversitySlugs" TEXT,
    "relatedCourseSlugs" TEXT,
    "relatedScholarshipSlugs" TEXT,
    "officialSourceUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyStudentStory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "universityName" TEXT,
    "courseName" TEXT,
    "country" TEXT,
    "intake" TEXT,
    "story" TEXT,
    "advice" TEXT,
    "imageUrl" TEXT,
    "publishedAt" DATETIME,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "location" TEXT,
    "organiser" TEXT,
    "registrationUrl" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudySavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "entityType" TEXT NOT NULL,
    "entitySlug" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyComparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "entityType" TEXT NOT NULL,
    "entitySlugs" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referralCode" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ALAMINN_HIGHER_STUDY',
    "referralType" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "countrySlug" TEXT,
    "universitySlug" TEXT,
    "courseSlug" TEXT,
    "scholarshipSlug" TEXT,
    "researchSlug" TEXT,
    "supervisorSlug" TEXT,
    "studyLevel" TEXT,
    "intake" TEXT,
    "campaignCode" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentVersion" TEXT,
    "consentTimestamp" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'created',
    "transferredAt" DATETIME,
    "completedAt" DATETIME,
    "failureReason" TEXT,
    "expiresAt" DATETIME,
    "ipHash" TEXT,
    "deviceCategory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "entityType" TEXT NOT NULL,
    "entitySlug" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "deadlineDate" DATETIME NOT NULL,
    "alertChannel" TEXT NOT NULL DEFAULT 'email',
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" DATETIME,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entitySlug" TEXT,
    "beforeData" TEXT,
    "afterData" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HigherStudyImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'csv',
    "entityType" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "errors" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EnglishLearningCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "durationWeeks" INTEGER,
    "hoursPerWeek" INTEGER,
    "priceUsd" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "publicationStatus" TEXT NOT NULL DEFAULT 'published',
    "lastVerifiedAt" DATETIME,
    "lastVerifiedBy" TEXT,
    "officialSourceUrl" TEXT,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" JSONB,
    "tags" JSONB,
    "heroImageUrl" TEXT,
    "introVideoUrl" TEXT,
    "syllabus" JSONB,
    "prerequisites" JSONB,
    "targetAudience" JSONB,
    "learningOutcomes" JSONB,
    "certificationType" TEXT,
    "passScore" INTEGER,
    "enrollmentCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "EnglishLearningLesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER,
    "lessonType" TEXT NOT NULL DEFAULT 'video',
    "videoUrl" TEXT,
    "transcript" TEXT,
    "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnglishLearningLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "EnglishLearningCourse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnglishLearningPracticeTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "testType" TEXT NOT NULL DEFAULT 'ielts-reading',
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "durationMinutes" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "passingScore" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EnglishLearningQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'multiple-choice',
    "questionText" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "skillArea" TEXT NOT NULL DEFAULT 'reading',
    CONSTRAINT "EnglishLearningQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "EnglishLearningPracticeTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnglishLearningTutor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "specialties" JSONB,
    "qualifications" JSONB,
    "yearsExperience" INTEGER,
    "hourlyRateUsd" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" TEXT NOT NULL DEFAULT 'verified',
    "lastVerifiedAt" DATETIME,
    "officialProfileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EnglishLearningResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'article',
    "url" TEXT,
    "durationMinutes" INTEGER,
    "readingTimeMinutes" INTEGER,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorName" TEXT,
    "sourceName" TEXT
);

-- CreateTable
CREATE TABLE "EnglishLearningEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnglishLearningEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "EnglishLearningCourse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnglishLearningProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT,
    "testId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "scorePercent" INTEGER,
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnglishLearningProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "EnglishLearningEnrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EnglishLearningProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "EnglishLearningLesson" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EnglishLearningProgress_testId_fkey" FOREIGN KEY ("testId") REFERENCES "EnglishLearningPracticeTest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnglishLearningReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referralCode" TEXT NOT NULL,
    "referralType" TEXT NOT NULL DEFAULT 'course-package',
    "sourceEntityId" TEXT,
    "sourceEntityType" TEXT,
    "targetUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "notes" JSONB
);

-- CreateTable
CREATE TABLE "EnglishLearningAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EnglishLearningSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_reference_key" ON "Inquiry"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_inquiryId_key" ON "Opportunity"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentReferral_inquiryId_key" ON "StudentReferral"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_token_key" ON "NewsletterSubscriber"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CaseStudy_slug_key" ON "CaseStudy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingRequest_reference_key" ON "MeetingRequest"("reference");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_createdAt_idx" ON "AnalyticsEvent"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "MediaAsset_category_idx" ON "MediaAsset"("category");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyCountry_slug_key" ON "HigherStudyCountry"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyCountry_region_idx" ON "HigherStudyCountry"("region");

-- CreateIndex
CREATE INDEX "HigherStudyCountry_status_idx" ON "HigherStudyCountry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyCity_slug_key" ON "HigherStudyCity"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyCity_countryId_idx" ON "HigherStudyCity"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyUniversity_slug_key" ON "HigherStudyUniversity"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyUniversity_countryId_idx" ON "HigherStudyUniversity"("countryId");

-- CreateIndex
CREATE INDEX "HigherStudyUniversity_cityId_idx" ON "HigherStudyUniversity"("cityId");

-- CreateIndex
CREATE INDEX "HigherStudyUniversity_featured_idx" ON "HigherStudyUniversity"("featured");

-- CreateIndex
CREATE INDEX "HigherStudyUniversity_verificationStatus_idx" ON "HigherStudyUniversity"("verificationStatus");

-- CreateIndex
CREATE INDEX "HigherStudyUniversity_publicationStatus_idx" ON "HigherStudyUniversity"("publicationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudySubject_slug_key" ON "HigherStudySubject"("slug");

-- CreateIndex
CREATE INDEX "HigherStudySubject_category_idx" ON "HigherStudySubject"("category");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyIntake_slug_key" ON "HigherStudyIntake"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyIntake_status_idx" ON "HigherStudyIntake"("status");

-- CreateIndex
CREATE INDEX "HigherStudyIntake_applicationDeadline_idx" ON "HigherStudyIntake"("applicationDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyCourse_slug_key" ON "HigherStudyCourse"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_universityId_idx" ON "HigherStudyCourse"("universityId");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_countryId_idx" ON "HigherStudyCourse"("countryId");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_subjectId_idx" ON "HigherStudyCourse"("subjectId");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_studyLevel_idx" ON "HigherStudyCourse"("studyLevel");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_intakeId_idx" ON "HigherStudyCourse"("intakeId");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_featured_idx" ON "HigherStudyCourse"("featured");

-- CreateIndex
CREATE INDEX "HigherStudyCourse_verificationStatus_idx" ON "HigherStudyCourse"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyScholarship_slug_key" ON "HigherStudyScholarship"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyScholarship_countryId_idx" ON "HigherStudyScholarship"("countryId");

-- CreateIndex
CREATE INDEX "HigherStudyScholarship_universityId_idx" ON "HigherStudyScholarship"("universityId");

-- CreateIndex
CREATE INDEX "HigherStudyScholarship_fundingType_idx" ON "HigherStudyScholarship"("fundingType");

-- CreateIndex
CREATE INDEX "HigherStudyScholarship_deadline_idx" ON "HigherStudyScholarship"("deadline");

-- CreateIndex
CREATE INDEX "HigherStudyScholarship_featured_idx" ON "HigherStudyScholarship"("featured");

-- CreateIndex
CREATE INDEX "HigherStudyScholarship_verificationStatus_idx" ON "HigherStudyScholarship"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyResearchArea_slug_key" ON "HigherStudyResearchArea"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyResearchArea_name_idx" ON "HigherStudyResearchArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyResearchProject_slug_key" ON "HigherStudyResearchProject"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyResearchProject_universityId_idx" ON "HigherStudyResearchProject"("universityId");

-- CreateIndex
CREATE INDEX "HigherStudyResearchProject_researchAreaId_idx" ON "HigherStudyResearchProject"("researchAreaId");

-- CreateIndex
CREATE INDEX "HigherStudyResearchProject_supervisorId_idx" ON "HigherStudyResearchProject"("supervisorId");

-- CreateIndex
CREATE INDEX "HigherStudyResearchProject_fundingStatus_idx" ON "HigherStudyResearchProject"("fundingStatus");

-- CreateIndex
CREATE INDEX "HigherStudyResearchProject_applicationDeadline_idx" ON "HigherStudyResearchProject"("applicationDeadline");

-- CreateIndex
CREATE INDEX "HigherStudyResearchProject_featured_idx" ON "HigherStudyResearchProject"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudySupervisor_slug_key" ON "HigherStudySupervisor"("slug");

-- CreateIndex
CREATE INDEX "HigherStudySupervisor_universityId_idx" ON "HigherStudySupervisor"("universityId");

-- CreateIndex
CREATE INDEX "HigherStudySupervisor_researchAreaId_idx" ON "HigherStudySupervisor"("researchAreaId");

-- CreateIndex
CREATE INDEX "HigherStudySupervisor_acceptingStudents_idx" ON "HigherStudySupervisor"("acceptingStudents");

-- CreateIndex
CREATE INDEX "HigherStudySupervisor_verificationStatus_idx" ON "HigherStudySupervisor"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyResource_slug_key" ON "HigherStudyResource"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyResource_category_idx" ON "HigherStudyResource"("category");

-- CreateIndex
CREATE INDEX "HigherStudyResource_featured_idx" ON "HigherStudyResource"("featured");

-- CreateIndex
CREATE INDEX "HigherStudyResource_verificationStatus_idx" ON "HigherStudyResource"("verificationStatus");

-- CreateIndex
CREATE INDEX "HigherStudyResource_publishedAt_idx" ON "HigherStudyResource"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyStudentStory_slug_key" ON "HigherStudyStudentStory"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyStudentStory_featured_idx" ON "HigherStudyStudentStory"("featured");

-- CreateIndex
CREATE INDEX "HigherStudyStudentStory_publishedAt_idx" ON "HigherStudyStudentStory"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyEvent_slug_key" ON "HigherStudyEvent"("slug");

-- CreateIndex
CREATE INDEX "HigherStudyEvent_eventDate_idx" ON "HigherStudyEvent"("eventDate");

-- CreateIndex
CREATE INDEX "HigherStudyEvent_status_idx" ON "HigherStudyEvent"("status");

-- CreateIndex
CREATE INDEX "HigherStudySavedItem_userId_entityType_idx" ON "HigherStudySavedItem"("userId", "entityType");

-- CreateIndex
CREATE INDEX "HigherStudySavedItem_sessionId_entityType_idx" ON "HigherStudySavedItem"("sessionId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudySavedItem_userId_entityType_entitySlug_key" ON "HigherStudySavedItem"("userId", "entityType", "entitySlug");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudySavedItem_sessionId_entityType_entitySlug_key" ON "HigherStudySavedItem"("sessionId", "entityType", "entitySlug");

-- CreateIndex
CREATE INDEX "HigherStudyComparison_userId_entityType_idx" ON "HigherStudyComparison"("userId", "entityType");

-- CreateIndex
CREATE INDEX "HigherStudyComparison_sessionId_entityType_idx" ON "HigherStudyComparison"("sessionId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "HigherStudyReferral_referralCode_key" ON "HigherStudyReferral"("referralCode");

-- CreateIndex
CREATE INDEX "HigherStudyReferral_status_idx" ON "HigherStudyReferral"("status");

-- CreateIndex
CREATE INDEX "HigherStudyReferral_createdAt_idx" ON "HigherStudyReferral"("createdAt");

-- CreateIndex
CREATE INDEX "HigherStudyReferral_referralType_idx" ON "HigherStudyReferral"("referralType");

-- CreateIndex
CREATE INDEX "HigherStudyAlert_userId_status_idx" ON "HigherStudyAlert"("userId", "status");

-- CreateIndex
CREATE INDEX "HigherStudyAlert_sessionId_status_idx" ON "HigherStudyAlert"("sessionId", "status");

-- CreateIndex
CREATE INDEX "HigherStudyAlert_deadlineDate_idx" ON "HigherStudyAlert"("deadlineDate");

-- CreateIndex
CREATE INDEX "HigherStudyAuditLog_actorUserId_idx" ON "HigherStudyAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "HigherStudyAuditLog_entityType_entityId_idx" ON "HigherStudyAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "HigherStudyAuditLog_createdAt_idx" ON "HigherStudyAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "HigherStudyImportJob_status_idx" ON "HigherStudyImportJob"("status");

-- CreateIndex
CREATE INDEX "HigherStudyImportJob_entityType_idx" ON "HigherStudyImportJob"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningCourse_slug_key" ON "EnglishLearningCourse"("slug");

-- CreateIndex
CREATE INDEX "EnglishLearningCourse_level_idx" ON "EnglishLearningCourse"("level");

-- CreateIndex
CREATE INDEX "EnglishLearningCourse_isFeatured_idx" ON "EnglishLearningCourse"("isFeatured");

-- CreateIndex
CREATE INDEX "EnglishLearningCourse_isPublished_idx" ON "EnglishLearningCourse"("isPublished");

-- CreateIndex
CREATE INDEX "EnglishLearningCourse_verificationStatus_idx" ON "EnglishLearningCourse"("verificationStatus");

-- CreateIndex
CREATE INDEX "EnglishLearningCourse_publicationStatus_idx" ON "EnglishLearningCourse"("publicationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningLesson_slug_key" ON "EnglishLearningLesson"("slug");

-- CreateIndex
CREATE INDEX "EnglishLearningLesson_courseId_idx" ON "EnglishLearningLesson"("courseId");

-- CreateIndex
CREATE INDEX "EnglishLearningLesson_lessonType_idx" ON "EnglishLearningLesson"("lessonType");

-- CreateIndex
CREATE INDEX "EnglishLearningLesson_isFreePreview_idx" ON "EnglishLearningLesson"("isFreePreview");

-- CreateIndex
CREATE INDEX "EnglishLearningLesson_isPublished_idx" ON "EnglishLearningLesson"("isPublished");

-- CreateIndex
CREATE INDEX "EnglishLearningLesson_orderIndex_idx" ON "EnglishLearningLesson"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningPracticeTest_slug_key" ON "EnglishLearningPracticeTest"("slug");

-- CreateIndex
CREATE INDEX "EnglishLearningPracticeTest_testType_idx" ON "EnglishLearningPracticeTest"("testType");

-- CreateIndex
CREATE INDEX "EnglishLearningPracticeTest_level_idx" ON "EnglishLearningPracticeTest"("level");

-- CreateIndex
CREATE INDEX "EnglishLearningPracticeTest_isPublished_idx" ON "EnglishLearningPracticeTest"("isPublished");

-- CreateIndex
CREATE INDEX "EnglishLearningPracticeTest_isFeatured_idx" ON "EnglishLearningPracticeTest"("isFeatured");

-- CreateIndex
CREATE INDEX "EnglishLearningQuestion_testId_idx" ON "EnglishLearningQuestion"("testId");

-- CreateIndex
CREATE INDEX "EnglishLearningQuestion_questionType_idx" ON "EnglishLearningQuestion"("questionType");

-- CreateIndex
CREATE INDEX "EnglishLearningQuestion_skillArea_idx" ON "EnglishLearningQuestion"("skillArea");

-- CreateIndex
CREATE INDEX "EnglishLearningQuestion_orderIndex_idx" ON "EnglishLearningQuestion"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningTutor_slug_key" ON "EnglishLearningTutor"("slug");

-- CreateIndex
CREATE INDEX "EnglishLearningTutor_isAvailable_idx" ON "EnglishLearningTutor"("isAvailable");

-- CreateIndex
CREATE INDEX "EnglishLearningTutor_isPublished_idx" ON "EnglishLearningTutor"("isPublished");

-- CreateIndex
CREATE INDEX "EnglishLearningTutor_verificationStatus_idx" ON "EnglishLearningTutor"("verificationStatus");

-- CreateIndex
CREATE INDEX "EnglishLearningTutor_rating_idx" ON "EnglishLearningTutor"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningResource_slug_key" ON "EnglishLearningResource"("slug");

-- CreateIndex
CREATE INDEX "EnglishLearningResource_resourceType_idx" ON "EnglishLearningResource"("resourceType");

-- CreateIndex
CREATE INDEX "EnglishLearningResource_level_idx" ON "EnglishLearningResource"("level");

-- CreateIndex
CREATE INDEX "EnglishLearningResource_isPublished_idx" ON "EnglishLearningResource"("isPublished");

-- CreateIndex
CREATE INDEX "EnglishLearningResource_isFeatured_idx" ON "EnglishLearningResource"("isFeatured");

-- CreateIndex
CREATE INDEX "EnglishLearningEnrollment_userId_idx" ON "EnglishLearningEnrollment"("userId");

-- CreateIndex
CREATE INDEX "EnglishLearningEnrollment_sessionId_idx" ON "EnglishLearningEnrollment"("sessionId");

-- CreateIndex
CREATE INDEX "EnglishLearningEnrollment_courseId_idx" ON "EnglishLearningEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "EnglishLearningEnrollment_status_idx" ON "EnglishLearningEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningEnrollment_sessionId_courseId_key" ON "EnglishLearningEnrollment"("sessionId", "courseId");

-- CreateIndex
CREATE INDEX "EnglishLearningProgress_enrollmentId_idx" ON "EnglishLearningProgress"("enrollmentId");

-- CreateIndex
CREATE INDEX "EnglishLearningProgress_lessonId_idx" ON "EnglishLearningProgress"("lessonId");

-- CreateIndex
CREATE INDEX "EnglishLearningProgress_testId_idx" ON "EnglishLearningProgress"("testId");

-- CreateIndex
CREATE INDEX "EnglishLearningProgress_status_idx" ON "EnglishLearningProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningReferral_referralCode_key" ON "EnglishLearningReferral"("referralCode");

-- CreateIndex
CREATE INDEX "EnglishLearningReferral_status_idx" ON "EnglishLearningReferral"("status");

-- CreateIndex
CREATE INDEX "EnglishLearningReferral_referralType_idx" ON "EnglishLearningReferral"("referralType");

-- CreateIndex
CREATE INDEX "EnglishLearningReferral_createdAt_idx" ON "EnglishLearningReferral"("createdAt");

-- CreateIndex
CREATE INDEX "EnglishLearningAuditLog_actorUserId_idx" ON "EnglishLearningAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "EnglishLearningAuditLog_entityType_entityId_idx" ON "EnglishLearningAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EnglishLearningAuditLog_createdAt_idx" ON "EnglishLearningAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "EnglishLearningAuditLog_action_idx" ON "EnglishLearningAuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishLearningSetting_key_key" ON "EnglishLearningSetting"("key");

-- CreateIndex
CREATE INDEX "EnglishLearningSetting_category_idx" ON "EnglishLearningSetting"("category");

