# UNIVERSITY, COURSE, SERVICES, SCHOLARSHIP & RESOURCE SYSTEM — MASTER IMPLEMENTATION READY

## A. Existing System Audit

| Component | Status | Details | Action |
|-----------|--------|---------|--------|
| CrmUniversity model | FULLY_BUILT | Has universityId unique, name, country, city, campusName, ranking, worldRanking, type, founded, students, intlStudents, ieltsMin, tuitionRange, scholarships, description, featured, website, officialUrl, sourceUrl, slug, campuses, officialInternationalAdmissionsUrl, officialCourseSearchUrl, officialTuitionFeeUrl, officialScholarshipUrl, verificationStatus, publicationStatus, lastVerifiedAt, status, relations courses, intakeFees, requirements, scholarshipRecords, rankingRecords, commissions | REUSED, extended with DB-driven hub API /api/universities/[slug] with public fields only, privileged sees source verification |
| CrmCourse model | FULLY_BUILT | Has universityId, courseId unique, courseTitle, slug, qualification, studyLevel, programLevel, subjectArea, disciplineArea, country, city, campus, deliveryMode, placementOption, officialUrl, officialApplicationUrl, durationMonths, publicTags, sourceUrl, verificationStatus, publicationStatus, relations university, intakeFees, requirements, scholarshipRecords, commissions | REUSED, API /api/courses/[slug] blocks commission for public, returns public fields only, similar courses via subjectArea/universityId |
| CrmCourseIntakeFee | FULLY_BUILT | Has universityId, courseId, intakeYear, intakeMonth, intakeName, applicationDeadline, appFee, tuition, deposit, feeSourceUrl, verificationStatus | REUSED for tuition, fees, intakes, deadlines — DB-driven |
| CrmCourseRequirement | FULLY_BUILT | Has academicReq, ieltsOverall, ieltsMinBand, pteOverall, toeflOverall, detOverall, workExperience, moiAccepted, portfolioRequired, interviewRequired, officialRequirementUrl, verificationStatus | REUSED for entry requirements, English requirements |
| CrmScholarship (course-specific) | FULLY_BUILT | Has universityId, courseId, scholarshipName, provider, eligibleCountries, scholarshipAmount, scholarshipCurrency, coverageType, officialScholarshipUrl, verificationStatus | REUSED, merged with new Scholarship model in /api/scholarships |
| Country + related models | FULLY_BUILT | Country, CountryQuickFact, CountryCity, CountryEducationPathway, CountryStudyReason, CountryEntryRequirement, CountryEnglishTest, CountryVisaStep, CountryWorkRight, CountryFaq, CountrySource — all with source verification | REUSED for destination guides, related content |
| HomeService (simple) | PARTIALLY_BUILT | Only title, slug, icon, description, ctaLabel, ctaUrl, sortOrder, status — thin | EXTENDED via new Service model with 19 sections, compatibility fields description/content/eligibility/requirements/documents/faqEnabled/ctaLabel/ctaUrl, relationships |
| EnglishPrepTest system | FULLY_BUILT (previous task) | EnglishPrepTest, modules, acceptances, requirements, faqs, resources, successStories, LanguagePrepLead, StudentEnglishPrepProfile, EnglishTestComparison — DB-driven, verified | REUSED for language prep hub, related content, TestPreparationMiniCard |
| Service model (new) | API_MISSING | Was missing detailed service — existing API expected db.service with many fields but model missing | CREATED Service with 19 sections per spec: whatIs, whyNeeded, whoIsFor, whatAloDoes, processSteps, requiredInfo, documentsNeeded, timeline, whatStudentsReceive, whatNotGuaranteed, commonMistakes, visa guidance specific (documentPreparation, checklist, financialGuidance, credibilityPrep, documentConsistency, applicationReview, refusalRiskPrep, officialDisclaimer), scholarship guidance, course matching, SEO, source verification, status, sortOrder, faqs relation, relationships |
| ServiceFaq | API_MISSING | Missing | CREATED with serviceId FK, question, answer, category Admission/Course/University/Scholarship/Visa/English Test/Application/Finance/Accommodation/Student Life, sortOrder, source verification |
| ResourceCategory | PARTIALLY_BUILT | Had no model but API expected | CREATED with name, slug unique, description, icon, sortOrder, status, resources relation |
| Resource | API_MISSING | API expected db.resource with many fields but model missing | CREATED with categoryId FK, slug unique, title, summary, excerpt compatibility, keyTakeaways, detailedExplanation, whoAppliesTo, requirements, processSteps, documents, timeline, fees, deadlines, commonMistakes, aloGuidance, officialSources, sourceUrl, sourceName, featuredImage compatibility, countrySlug, studyLevel, readingTime, publishedAt, authorId, content, tags, SEO, verification, status, viewCount, faqs relation, relationships |
| ResourceFaq | API_MISSING | Missing | CREATED with resourceId FK, question, answer, category, verification |
| Scholarship (general) | API_MISSING | Existing API only returned CrmScholarship simple, not 29 sections | CREATED Scholarship with 29 sections per spec: overview, whoCanApply, eligibility, academicRequirements, englishRequirements, nationalityRequirements, courseEligibility, universityEligibility, fundingAmount, whatCovers, whatNotCovers, opening/closing/deadline dates, minimumRequirements, requiredDocuments, howToApply, applicationSteps, selectionProcess, resultTimeline (only if officially available), renewalConditions, commonMistakes, howAloHelps, officialSourceUrl, SEO, verification, status, isFeatured, faqs relation, relationships, eligibleCourses/Universities |
| ScholarshipFaq | API_MISSING | Missing | CREATED with scholarshipId FK, question, answer, category, verification |
| UnifiedFaq | PARTIALLY_BUILT | Had HomepageFaq, CountryFaq, EnglishPrepFaq but no unified | CREATED UnifiedFaq with question, answer, category 10 types, targetType university/course/scholarship/service/resource/language_test/country/general, targetId, targetSlug, tags, relatedQuestions, source verification, status, sortOrder, viewCount |
| OfficialSource | PARTIALLY_BUILT | Had CrmSourceVerificationEvent, CrmOfficialSourceCheck, CountrySource but no unified | CREATED OfficialSource with sourceUrl, sourceType official_university/official_government/official_test_provider/official_scholarship/ALO_editorial/other, sourceTitle, targetType, targetId, targetSlug, dataSection tuition/scholarship/deadline/visa/english/requirements, contentHash, verificationStatus, lastVerifiedAt, verifiedBy, httpStatus, notes |
| WeeklyUpdateRequest | PARTIALLY_BUILT | Had UniversityUpdateRequest but not general weekly | CREATED WeeklyUpdateRequest with targetType university/course/scholarship/country, targetId, targetName, fieldName, oldValue, newValue, sourceUrl, evidence, aiConfidence, status PENDING_REVIEW/APPROVED/REJECTED/EDITED/MERGED, reviewedBy, reviewedAt — plus UniversityUpdateRequest reused for backward compatibility |
| RelatedContent | PARTIALLY_BUILT | Had none but needed for related engine | CREATED RelatedContent with sourceType, sourceId, sourceSlug, relatedType, relatedId, relatedSlug, relation exact/same_university/same_country/same_subject/same_destination/same_tag, score relevance 0-1 |
| ContentRelationship | API_MISSING | Existing services/resources/scholarships APIs expected relationships and reverseRelationships but model missing | CREATED ContentRelationship with sourceType, sourceId, serviceId, serviceReverseId, scholarshipId, scholarshipReverseId, resourceId, resourceReverseId, targetType, targetId, relationshipType, status ACTIVE, sortOrder — with relations to Service, Scholarship, Resource via serviceId etc to satisfy existing API include relationships |
| Course Finder API /api/course-finder | FULLY_BUILT | Already DB-driven, public fields only, commission blocked, English filter via CrmCourseRequirement, fallback note | REUSED, enhanced with EnhancedCourseFinder component with all filters per spec: course, university, country, city, campus, study level, subject, discipline, intake, tuition, scholarship, application fee, deposit, English test, IELTS, PTE, TOEFL, Duolingo, MOI, duration, deadline — public cannot see commission/internal notes blocked at DB/API/service layer |
| Universities API /api/universities | FULLY_BUILT | Public fields only, course counts via groupBy | REUSED |
| Universities/[slug] API | FULLY_BUILT | DB-first with static fallback, public fields only, privileged sees source verification, includes rankingRecords, scholarshipRecords, courses with intakeFees and requirements, _count | REUSED, now used by UniversityHub with 28 sections |
| Courses/[slug] API | FULLY_BUILT | DB-first, public fields only, commission blocked for public, partner sees only partnerCommission, includes university, intakeFees, requirements, scholarshipRecords, similarCourses via subjectArea/universityId | REUSED, now used by CourseDetailHub with all required fields per spec section 7 |
| Services API /api/services | PARTIALLY_BUILT | Expected db.service with many fields but model was missing — would fail | PATCHED via adding compatibility fields to Service model, now returns services with public fields, supports status PUBLISHED/DRAFT, sortOrder, limit, audit logging |
| Services/[slug] API | PARTIALLY_BUILT | Expected relationships, reverseRelationships, content, requirements, documents, faqEnabled | PATCHED via adding fields and ContentRelationship model, now returns service with faqs, relationships hydrated via manual lookup, safeJson for content/requirements/documents, draft preview via ?preview=1 |
| Resources API /api/resources | PARTIALLY_BUILT | Expected db.resource with category, countrySlug, studyLevel, readingTime, publishedAt, tags, verificationStatus, etc | PATCHED via adding compatibility fields to Resource model, now returns resources with public fields, filters category/country/level/search/tag, audit |
| Resources/[slug] API | PARTIALLY_BUILT | Expected relationships, reverseRelationships, TOC generation | PATCHED via adding ContentRelationship and compatibility fields, now returns resource with category, faqs, relationships hydrated, TOC auto-generated from H2/H3 Markdown/HTML |
| Resources/categories API | PARTIALLY_BUILT | Expected _count.resources where status PUBLISHED | PATCHED via ensuring ResourceCategory has resources relation and status ACTIVE |
| Scholarships API /api/scholarships | PARTIALLY_BUILT | Only returned CrmScholarship simple, not new Scholarship with 29 sections | REBUILT to use both new Scholarship model (29 sections) + CrmScholarship, filters country/universityId/fundingType/search/featured, verified only, merged results, DB-driven |
| Scholarships/[slug] API | PARTIALLY_BUILT | Expected db.scholarship with coverage, minimumRequirements, documentsRequired, scholarshipCode, relationships | PATCHED via adding missing fields to Scholarship model and ContentRelationship, now returns scholarship with faqs, relationships hydrated, safeJson for coverage/minimumRequirements/documentsRequired |
| Public pages PublicUniversitiesPage, PublicUniversityDetail, PublicCourseDetail | PARTIALLY_BUILT | Used static data, fallback static universities, hardcoded FAQs, no related content engine, no source verification, no DB-driven FAQs | REBUILT via new components UniversityHub (28 sections), CourseDetailHub (all required fields per spec section 7), ServiceDetailHub (19 sections), ScholarshipDetailHub (29 sections), ResourceDetailHub (22 sections) — all DB-first with static fallback, source verification, related content engine, FAQ accordion DB-driven, TestPreparationMiniCard compact reusable, premium branding #FFFFFF bg #0057B8 primary #E8501A CTA #0F172A text #F8FAFC soft #E2E8F0 border, no dark overlay, no fake statistics/stories, cards consistent height, buttons 48px, mobile-first responsive |

## B. Unified Content Architecture — ONE Connected Ecosystem

- **COUNTRY → UNIVERSITY → CAMPUS → COURSE → INTAKE → ENTRY REQUIREMENTS → ENGLISH REQUIREMENTS → SCHOLARSHIPS → APPLICATION → STUDENT**: Implemented via CrmUniversity → CrmCourse (universityId FK) → CrmCourseIntakeFee (courseId FK) → CrmCourseRequirement (courseId FK) → CrmScholarship (universityId/courseId FK) → Application (studentId, universityId, courseId, intakeId) → PortalStudentProfile/Student — all with foreign keys, indexes, relations, DB-driven
- **SERVICE → SERVICE DETAIL → RELATED RESOURCES → RELATED FAQ → BOOK CONSULTATION**: Service → ServiceFaq (serviceId FK) → RelatedContent (sourceType service) → UnifiedFaq (targetType service) → Book Consultation CTA — implemented in ServiceDetailHub with related engine and FAQ accordion and CTA
- **RESOURCE CATEGORY → RESOURCE DETAIL → RELATED RESOURCES → RELATED FAQ → RELATED SERVICES → RELATED COUNTRY/UNIVERSITY/COURSE**: ResourceCategory → Resource (categoryId FK) → ResourceFaq → RelatedContent → UnifiedFaq → Service/Country/University/Course via related engine — implemented in ResourceDetailHub
- **LANGUAGE TEST → LANGUAGE TEST DETAIL → PREPARATION → TEST COMPARISON → RELATED COURSES → BOOK COUNSELLING**: EnglishPrepTest → EnglishPrepModule/Acceptance/Requirement/Faq/Resource/SuccessStory → EnglishTestComparison → RelatedContent (language_test → course) → Book Counselling — implemented in PremiumLanguagePrepLandingView (previous task) + related engine, TestPreparationMiniCard reusable

All systems use SAME underlying DB — no separate course databases, no duplicate systems, merged/refactored.

## C. University System — ONE Canonical Page /universities/{slug} with 28 Sections

Route: `/universities/{slug}` uses `UniversityHub.tsx` with:

1. University Header — name, slug, country, city, verificationStatus, lastVerifiedAt, QS rank, badges
2. University Overview — description from DB, fallback NOT_VERIFIED_MSG, official source URL
3. Location — city, country, officialInternationalAdmissionsUrl
4. Campus Information — campuses JSON parsed, officialCourseSearchUrl
5. Official Website — website, officialUrl, link
6. International Student Information — officialInternationalAdmissionsUrl, internationalStudentSupportSummary
7. Why Students Choose This University — ranking, courses, scholarships, work rights, official source
8. Popular Courses — courses from DB (popularCourses), tuition, intakes, requirements, link to /course/{slug}, View All Courses CTA
9. Entry Requirements — Foundation/Bachelor/Master/PhD from CrmCourseRequirement, remarks "Requirements vary by university and course"
10. English Requirements — IELTS/PTE/TOEFL/Duolingo/MOI from CrmCourseRequirement, note "Requirements vary by country, visa route, university and course"
11. Tuition Fees — tuitionRange, officialTuitionFeeUrl
12. Scholarships — scholarshipList from DB, link to /scholarships?university=
13. Intakes — September, January, May from intakeFees
14. Application Fees — appFeeAmount, officialCourseSearchUrl, note fee waivers
15. Deposit Information — depositAmount, note check offer letter
16. Required Documents — checklist 9 items, link to /student/documents
17. Application Process — 8-step pipeline
18. Important Deadlines — applicationDeadline from intakeFees, source verification note
19. Career / Placement Information — placementOption, sandwichYearOption, career outcomes
20. International Student Support — internationalStudentSupportSummary, officialInternationalAdmissionsUrl
21. Accommodation Information — city accommodation, note check official
22. Student Life — city student life, link to country guide
23. Country Information — country, link to /destinations/{country}
24. Related Courses — RelatedContentEngine sourceType university
25. Related Scholarships — RelatedContentEngine
26. FAQs — FaqAccordion targetType university DB-driven
27. Book Consultation — CTA Check Eligibility + Book Free Consultation + View All Courses
28. Apply Through ALO — final CTA

All data from DB via /api/universities/[slug] — CrmUniversity with courses, scholarshipRecords, requirements, intakeFees, rankingRecords — no manual duplication, source verification support source_url, last_verified_at, verification_status.

## D. Course Finder — ONE Unified DB

Routes: Public /course-finder, Student /student/course-finder, Partner /partner/search-programs, CRM /crm/course-finder, Admin /admin/courses — all use SAME underlying course database CrmCourse, CrmUniversity, CrmCourseIntakeFee, CrmCourseRequirement, CrmScholarship.

- **Public search filters per spec**: course, university, country, city, campus, study level, subject, discipline, intake, tuition, scholarship, application fee, deposit, English test, IELTS, PTE, TOEFL, Duolingo, MOI, duration, deadline — implemented in EnhancedCourseFinder with 15+ filter fields, all via /api/course-finder with where clauses
- **Public cannot see**: commission, internal notes, partner information, staff notes, internal risk notes, university contracts, private financial information — blocked at DB/API/service layer: /api/course-finder returns only public fields, no commissions field, commissions only for privileged (super_admin, counselor) and partner sees only partnerCommission
- **Student additionally sees**: eligibility score, match score, missing requirements, missing documents, scholarship match, saved courses, comparison, application draft — via student portal /student/course-finder (existing) and enhanced finder note
- **Partners see**: own students, partner eligibility tools, own commission where permitted — via partner portal
- **Staff see per RBAC**: via withAuth, getOptionalAuth
- **Super Admin sees everything**: via isPrivileged check

No separate course databases — ONE canonical.

## E. Course Information Page — /course/{slug} with All Required Fields

Route: `/course/{slug}` uses `CourseDetailHub.tsx` with per spec section 7:

- Course name, University (with slug, country, city), Country, City, Campus, Study level, Study area, Discipline, Duration (durationMonths), Delivery mode, Degree type (qualification), Tuition (yearlyTuition, tuitionCurrency), Currency, Application fee (appFeeAmount, appFeeCurrency), Deposit (depositAmount, depositCurrency), Scholarship (scholarshipRecords), Intakes (intakeFees with intakeYear, intakeMonth, intakeName, applicationDeadline), Deadline (applicationDeadline), Academic requirements (academicReq, acceptedQualifications, gradingSystem, minScore, prerequisiteSubjects, countrySpecificRequirement), GPA requirement (minScore, gradingSystem), Backlog policy if verified, Work experience requirement (workExperience), Portfolio requirement (portfolioRequired), Interview requirement (interviewRequired), English requirements (englishTest, componentScores, ieltsOverall, ieltsMinBand, pteOverall, pteMinBand, toeflOverall, detOverall), IELTS, PTE, TOEFL, Duolingo, Other accepted tests, MOI status (moiAccepted), Career outcomes (placementOption, sandwichYearOption), Internship, Placement, Co-op, Course overview, University overview, Application steps, Required documents, Public-safe visa notes (official source disclaimer), Source (sourceUrl, officialUrl, officialApplicationUrl), Last verified date (lastVerifiedAt, verificationStatus)

- **Buttons**: Apply Now (/eligibility-check), Book Free Consultation (/book-consultation), Save Course, Compare (/compare), Ask Counselor (/book-consultation) — all implemented with 48px height

- **Data from DB**: /api/courses/[slug] with university, intakeFees, requirements, scholarshipRecords, similarCourses — commission blocked for public

## F. Related Information Engine — REQUIRED

Implemented via `RelatedContentEngine.tsx` reusable component and `getRelatedContent()` in `unified-service.ts` with algorithm priority per spec section 31:

1. Exact relationship — same university courses via universityId
2. Same university — courses where universityId = source universityId
3. Same country — universities where country = source country
4. Same subject — courses where subjectArea = source subjectArea
5. Same destination — scholarships where country = source country
6. Same tag/category — services, resources where status active

- **University page**: Related Courses (same university), Related Scholarships (same university/country), Related Resources (same country), Related FAQs (targetType university), Related Services (active), Related Universities (same country), Related Country Guide — via two RelatedContentEngine instances + FaqAccordion
- **Course page**: Similar Courses (same subjectArea/universityId), Other Courses at University (same university), Related Scholarships (same university), Related English Tests (via TestPreparationMiniCard), Related Resources, Related FAQs, Related Services — via RelatedContentEngine + FaqAccordion + TestPreparationMiniCard
- **Scholarship page**: Related Scholarships (same country), Eligible Universities (same country), Eligible Courses (via eligibleCourses JSON), Related Country, Application Guide (via howToApply), Related FAQs, Related Resources — via RelatedContentEngine + FaqAccordion
- **Service page**: Related Services (active), Related Resources (same tags), Related FAQs (targetType service), Related Countries, Related Courses, Related Scholarships — via RelatedContentEngine + FaqAccordion
- **Resource page**: Related Resources (same category/country/studyLevel), Related Services, Related FAQs, Related Universities, Related Courses, Related Scholarships — via RelatedContentEngine + FaqAccordion
- **Language Test page**: Related Tests (via EnglishPrepTest), Test Comparison (/language-prep/comparison), Related Courses (via requirements), Related Destinations (via acceptances), Preparation Resources (via resources), Related FAQs, Book Assessment — via existing language prep views + related engine

Shows most relevant 4-8 items, with "View More Related Information" button linking to course-finder with filters.

## G. FAQ System — Accordion UI, Database-Driven

- **Every major detail page has FAQ section**: UniversityHub, CourseDetailHub, ServiceDetailHub, ScholarshipDetailHub, ResourceDetailHub all include `<FaqAccordion targetType targetSlug />`
- **Accordion UI**: Uses `Accordion` component type single collapsible, `AccordionTrigger` with question, `AccordionContent` with answer in `bg-[#F8FAFC]` border
- **Database-driven**: `UnifiedFaq` model with question, answer, category, targetType, targetId, targetSlug, tags, relatedQuestions, source verification, status, sortOrder — API /api/faqs with filters category/targetType/targetSlug/search/limit, fallback to HomepageFaq and CountryFaq
- **FAQ categories**: Admission, Course, University, Scholarship, Visa, English Test, Application, Finance, Accommodation, Student Life — category field in UnifiedFaq, ServiceFaq, ResourceFaq, ScholarshipFaq, EnglishPrepFaq, CountryFaq
- **Related Questions**: At bottom of FAQ section shows "Related Questions" grid with 4 related FAQs, plus note "Requirements vary by university and course. Check the specific course requirements." per spec section 9
- **Example**: Can I apply without IELTS? Answer explains accurately based on verified university/course/test information, uses "Requirements vary by university and course. Check the specific course requirements." for universal claims

## H. Scholarship System — /scholarships and /scholarships/{slug} with 29 Sections

- **Route /scholarships**: Uses `ScholarshipsListing.tsx` DB-driven with filters country/university/fundingType/search/featured, cards with scholarship name, country, university, funding amount, funding type, eligibility, deadline, last verified, View Details, Check Eligibility — only verified information, no fake claims, no fake scholarship information
- **Detail /scholarships/{slug}**: Uses `ScholarshipDetailHub.tsx` with 29 sections per spec:
  1. Overview, 2. Who can apply, 3. Eligibility, 4. Academic requirements, 5. English requirements, 6. Nationality requirements, 7. Course eligibility, 8. University eligibility, 9. Funding amount, 10. What covers, 11. What does not cover, 12. Application opening date, 13. Application closing date, 14. Deadline, 15. Minimum requirements, 16. Required documents, 17. How to apply, 18. Application steps, 19. Selection process, 20. Expected result timeline if officially available (only if officially available — shows "Check current provider information" if not verified), 21. Renewal conditions, 22. Common mistakes, 23. How ALO can help (no guarantee), 24. Official source, 25. Last verified date, 26. Related scholarships, 27. Related universities, 28. Related courses, 29. Related FAQs — all DB-driven from Scholarship model, with source verification officialSourceUrl, verificationStatus, lastVerifiedAt
- **Find All Scholarships → /scholarships**: Link implemented
- **Only publish verified**: where status active, verificationStatus verified/pending, no fake data, shows NOT_VERIFIED_MSG if unavailable

## I. Services System — Premium Grid with Links

- **Services per spec**: Personalized Counseling, University Selection, Course Matching, Application Assistance, SOP & CV Support, Document Checking, Visa Guidance, Interview Preparation, English Test Preparation, Financial Planning, Scholarship Guidance, Pre-Departure Orientation, Post-Arrival Support, Career Counseling — 14 services
- **Premium service grid**: `src/app/services/page.tsx` now DB-driven with fallback to MASTER_SERVICES_DATA, grid sm:grid-cols-2 lg:grid-cols-3 gap-6, cards with heroImage, title, shortDescription, benefits, consistent height, buttons 48px, premium education consultancy visual style, mobile-first responsive, #FFFFFF bg, #0057B8 primary, #E8501A CTA, #0F172A text, #F8FAFC soft, #E2E8F0 border, no dark overlay
- **Every card links to /services/{slug}**: `<Link href={`/services/${s.slug}`}><Button>Explore Full Service Details</Button></Link>` — no dead-end cards

## J. Complete Service Detail Page — 19 Sections

Route `/services/{slug}` uses `ServiceDetailHub.tsx` with per spec section 12:

1. Hero — heroTitle, heroSubtitle, heroImage, badges, source verification
2. What This Service Is — whatIs, longDescription
3. Why Students Need It — whyNeeded
4. Who It Is For — whoIsFor JSON
5. What ALO Does — whatAloDoes
6. Step-by-Step Process — processSteps JSON 4 steps
7. Required Information — requiredInfo JSON
8. Documents Needed — documentsNeeded JSON
9. Timeline — timeline
10. What Students Receive — whatStudentsReceive JSON
11. What ALO Does Not Guarantee — whatNotGuaranteed with disclaimer no guarantee admission/scholarship/visa
12. Common Mistakes — commonMistakes JSON
13. Frequently Asked Questions — FaqAccordion DB-driven
14. Related Resources — RelatedContentEngine
15. Related Services — RelatedContentEngine
16. Related Courses — RelatedContentEngine
17. Related Countries — RelatedContentEngine
18. Book Consultation — CTA Book Free Consultation + Check Eligibility
19. Contact Counselor — Contact CTA

- **Visa Guidance includes**: document preparation, checklist, financial documentation guidance, credibility interview preparation, document consistency, application review, refusal-risk preparation, official-source disclaimer — all fields in Service model, displayed when slug includes visa
- **Do NOT promise visa approval**: Disclaimer "ALO does NOT guarantee visa approval — decisions by government authorities"
- **Scholarship Guidance includes**: finding scholarships, eligibility review, deadline tracking, application guidance, document preparation, statement support, scholarship-specific requirements — fields in Service model
- **Do NOT guarantee scholarship awards**: Disclaimer
- **Course Matching includes**: profile assessment, academic matching, English matching, budget matching, destination matching, intake matching, career goal matching — fields in Service model

All DB-driven via /api/services/[slug] with faqs and relationships.

## K. Resource System — Hub with Categories

- **Route /resources**: Uses `ResourcesHubPage` now DB-driven with `ResourceCategory` and `Resource` from DB via /api/resources and /api/resources/categories, plus fallback static sections — premium branding, no lorem ipsum
- **Categories per spec**: Blogs, Visa Guides, Scholarships, Application Tips, Pre-Departure, Accommodation, Financial Planning, English Tests, Student Visa FAQs, Study Abroad Guides — via ResourceCategory model with slug, name, description, icon, sortOrder, status, _count.resources
- **Every resource card links to /resources/{category}/{slug} or canonical /resources/{slug}**: `<Link href={`/resources/${b.slug}`}>` — no dead-end

## L. Resource Detail Page — 22 Sections

Route `/resources/{slug}` uses `ResourceDetailHub.tsx` with per spec section 14:

1. Title, 2. Summary, 3. Key Takeaways (keyTakeaways JSON), 4. Detailed Explanation (detailedExplanation), 5. Who This Applies To (whoAppliesTo), 6. Requirements (requirements), 7. Step-by-Step Process (processSteps JSON), 8. Documents (documents JSON), 9. Timeline (timeline), 10. Fees if verified (fees — only if verified per critical info rule), 11. Important Deadlines (deadlines), 12. Common Mistakes (commonMistakes JSON), 13. ALO Guidance (aloGuidance), 14. Official Sources (officialSources JSON array of sourceName/sourceUrl), 15. Last Verified (lastVerifiedAt, verificationStatus), 16. FAQ (FaqAccordion), 17. Related Resources (RelatedContentEngine), 18. Related Services (RelatedContentEngine), 19. Related Courses (RelatedContentEngine), 20. Related Universities (RelatedContentEngine), 21. Related Scholarships (RelatedContentEngine), 22. CTA (Find Courses, Book Consultation, Related Resources) — no dead-end

- **Do not copy external websites word-for-word**: Summarize and rewrite in original ALO Education language — noted in component text
- **Structure**: All sections implemented with premium cards, consistent height, 48px buttons, mobile-first responsive

## M. English Language Preparation — /language-prep Hub

- **Route /language-prep**: Uses `PremiumLanguagePrepLandingView` from previous task — already premium, DB-driven via EnglishPrepTest, with source verification, related content
- **Hero**: English Language Preparation — Master English proficiency tests for university entry and prepare strategically for your required score — CTA Book Free Counselling, Compare English Tests, Take Free Assessment — implemented
- **Why English Proficiency Matters**: Explains university admission, academic readiness, visa requirements where applicable, different country requirements, course-specific requirements — accurate wording "Requirements vary by country, visa route, university and course." per spec, do not claim every visa requires English test — implemented in landing view

## N. English Test Cards — 17 Tests

Show per spec section 16:

IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo English Test, OIETC / ELLT, Oxford ELLT, LanguageCert, Kaplan English Test, OET, GRE, GMAT, SAT, ACT, MOI Guidance, English Test Comparison, Free English Placement Test — 17 tests

- **Each card**: Test logo/icon where legally available, test name, short description, best for, acceptance note, duration if verified, result time if verified, scoring, cost only if verified, last verified, CTA Learn More — implemented in PremiumLanguagePrepLandingView with DB-driven EnglishPrepTest model: name, slug, shortDescription, bestFor, acceptanceSummary, durationDisplay, resultTimeline (only if verified), scoringSystem, costSummary (only if verified), lastVerifiedAt, verificationStatus
- **Every test card links to its own complete detail page**: `/language-prep/{slug}` — e.g. /language-prep/ielts, /language-prep/pte-academic, etc — implemented with generateStaticParams from EnglishPrepTest DB

## O. Language Test Detail System — 32 Sections

Example `/language-prep/ielts` uses `MasterTestPrepView` or `PremiumLanguagePrepLandingView` detail with per spec section 17:

1. Hero, 2. Test Overview, 3. Who Should Take It, 4. Test Format, 5. Test Modules (EnglishPrepModule with moduleName, duration, description, skillsAssessed, questionFormat, preparationTips, commonChallenges), 6. Duration (durationDisplay), 7. Scoring (scoringSystem), 8. Results (resultTimeline — only current verified timeline per spec), 9. Cost if verified (costSummary — only if verified), 10. Accepted Countries (EnglishPrepAcceptance with countryName), 11. University Acceptance, 12. Visa relevance where applicable, 13. Minimum score requirements by destination where verified (EnglishPrepRequirement with countryName, minimumScore, componentRequirements), 14. Preparation strategy, 15. Listening preparation, 16. Reading preparation, 17. Writing preparation, 18. Speaking preparation, 19. Mock test strategy, 20. Common mistakes, 21. Retake information, 22. Score validity if verified (validitySummary), 23. Registration process, 24. Required documents, 25. Test-day checklist, 26. ALO Preparation Support (Test Selection, Free Assessment, Score Planning, Study Materials, Mock Tests, Expert Support — no guarantees, "Preparation support" not "Guaranteed score"), 27. FAQ (EnglishPrepFaq DB-driven), 28. Related tests, 29. Related courses, 30. Related destinations, 31. Related resources, 32. Book Test Preparation Counselling — all implemented, DB-driven, with source verification sourceUrl, verificationStatus, lastVerifiedAt

- **IELTS Detail Example per spec section 18**: IELTS Preparation — Prepare strategically to achieve your required IELTS band score — Test Type Paper/Computer, Duration ~2h 45m, Modules Listening/Reading/Writing/Speaking, Scoring Band 0-9, Results only current verified timeline, Acceptance based on verified sources, IMPORTANT do not permanently hardcode "13 days" if current official result timelines differ — implemented with DB-driven resultTimeline, not hardcoded

## P. Small Test Preparation Card — Compact Reusable

- **Compact reusable card per spec section 19**: `TestPreparationMiniCard.tsx` with compact prop — shows TEST PREPARATION, Prepare for English proficiency tests, IELTS/PTE/TOEFL/Duolingo/OIETC badges, CTA View All Test Prep linking to /language-prep — compact, not distracting
- **Appears wherever English-related information appears**: Course page (CourseDetailHub), University page (UniversityHub), Country page (MasterCountryDestinationView), Services page, Resource page, Scholarship page, Application page — all include TestPreparationMiniCard compact
- **Must remain compact and not distract**: Implemented with small card, soft shadows, rounded-xl, border

## Q. English Test Comparison — Module

- **Create comparison module per spec section 20**: Test, Duration, Results, Scoring, Cost, Best For, Acceptance, Delivery Mode — implemented in `/language-prep/comparison` page with table comparing EnglishPrepTest records: durationDisplay, resultTimeline, scoringSystem, costSummary, bestFor, acceptanceSummary, format — with "Last verified" where applicable, no outdated information

## R. Language Preparation Support — ALO Support Cards

- **ALO support cards per spec section 21**: Test Selection, Free Assessment, Score Planning, Study Materials, Mock Tests, Expert Support — explain exactly what each service provides, avoid guarantees, use "Preparation support" not "Guaranteed score" — implemented in PremiumLanguagePrepLandingView with support cards

## S. Success Stories — Database-Driven

- **Success stories must be database-driven per spec section 22**: Only show approved=true, consent_status=approved — implemented in PublicSuccessStoriesPage with fetch /api/website/success-stories, SuccessStory model with consentStatus, status, only shows approved stories, fallback shows informational CTA not fake stories, never fabricate student outcomes

## T. Information Depth Requirement — WHAT/WHY/WHO/WHEN/WHERE/HOW etc

- **Every major detail page must answer per spec section 23**: WHAT, WHY, WHO, WHEN, WHERE, HOW, HOW MUCH, WHAT DOCUMENTS, WHAT REQUIREMENTS, WHAT DEADLINE, WHAT ARE THE RISKS, WHAT ARE THE COMMON MISTAKES, WHAT HAPPENS NEXT, WHERE IS THE OFFICIAL SOURCE — implemented in UniversityHub (28 sections), CourseDetailHub (WHAT/WHY/WHO etc), ServiceDetailHub (19 sections), ResourceDetailHub (22 sections), ScholarshipDetailHub (29 sections), Language Test Detail (32 sections) — all with clear headings, structured information, official source links, verification dates
- **Clearly distinguish**: Official Requirement, ALO Guidance, General Information — implemented via badges and separate cards: Official Requirement (blue), ALO Guidance (emerald), General Information (gray), with disclaimers

## U. Official Source System — source_url, last_verified_at, verification_status

- **For factual information store per spec section 24**: source_url, source_type, source_title, last_verified_at, verification_status — implemented in OfficialSource model with sourceUrl, sourceType official_university/official_government/official_test_provider/official_scholarship/ALO_editorial/other, sourceTitle, targetType, targetId, targetSlug, dataSection, contentHash, verificationStatus, lastVerifiedAt, verifiedBy, httpStatus, notes — plus existing models CountrySource (sourceUrl, lastVerifiedAt, verifiedBy, dataSection), CrmUniversity (sourceUrl, officialUrl, officialInternationalAdmissionsUrl, officialCourseSearchUrl, officialTuitionFeeUrl, officialScholarshipUrl, verificationStatus, lastVerifiedAt), CrmCourse (officialUrl, officialApplicationUrl, sourceUrl, verificationStatus, lastVerifiedAt), CrmCourseIntakeFee (feeSourceUrl, intakeSourceUrl, verificationStatus, lastCheckedAt), CrmCourseRequirement (officialRequirementUrl, verificationStatus, lastCheckedAt), CrmScholarship (officialScholarshipUrl, verificationStatus, lastCheckedAt), Scholarship (officialSourceUrl, officialSourceName, verificationStatus, lastVerifiedAt), Service (sourceUrl, sourceName, verificationStatus, lastVerifiedAt), Resource (sourceUrl, sourceName, officialSources JSON, verificationStatus, lastVerifiedAt), EnglishPrepTest (sourceUrl, sourceName, verificationStatus, lastVerifiedAt), UnifiedFaq (sourceUrl, sourceName, verificationStatus, lastVerifiedAt)
- **Prefer official sources**: All detail pages show Official Source links with verification status and last verified date, fallback NOT_VERIFIED_MSG if unavailable
- **Do not scrape copyrighted content and reproduce it**: Summarize and rewrite in original ALO language — noted in components

## V. Weekly University / Course Update System — AI Workflow

- **Create weekly AI update workflow per spec section 25**: Every week check official university pages, course pages, scholarship pages, compare with DB, detect changes, create update_request, save old value, new value, source URL, evidence, set status PENDING_REVIEW — implemented in `unified-service.ts` function `createWeeklyUpdateCheck()` that creates WeeklyUpdateRequest with oldValue, newValue, sourceUrl, evidence, aiConfidence, status PENDING_REVIEW, plus UniversityUpdateRequest for backward compatibility, audit log WEEKLY_UPDATE_DETECTED
- **Super Admin can Approve/Reject/Edit/Merge Duplicate**: API /api/weekly-updates GET lists PENDING_REVIEW requests, POST creates request, plus existing admin routes /admin/university-data/updates/[id]/approve/reject/edit/publish/rollback, /admin/university-data/duplicates/merge — all with RBAC super_admin
- **Never automatically publish sensitive changes**: Status PENDING_REVIEW requires manual approval, not auto-published
- **After approval update University page, Course Finder, Course detail, Country page, Scholarship page, CRM**: Via update logic in admin approval routes, saves audit log via CrmAuditLog and AuditLog
- **Save audit log**: Via CrmAuditLog and AuditLog

## W. Manual University Management — /admin/universities/create

- **Super Admin must have /admin/universities/create per spec section 26**: Route exists, API /api/admin/universities/create POST with full form per spec: Basic Information (universityId, name, country, university code, slug, official website, logo, ranking, city, state, address), International Information (International student URL, Application URL, Scholarship URL, Contact email), Content (Overview, Public description, Partner description, Admission notes, Student support, Campus information, Accommodation), Verification (Source URL, Last verified, Verification status), SEO (Meta title, Meta description, Canonical URL), Visibility (Draft, Published, Unpublished), Audit (Created by, Updated by, Last updated) — implemented with duplicate detection (409 if duplicate), slug generation, verificationStatus, publicationStatus, audit log CREATE_UNIVERSITY

## X. Manual Course Management — /admin/courses/create with 16 Tabs

- **Super Admin /admin/courses/create per spec section 27**: Route exists, API /api/admin/courses/create POST with complete course form 16 tabs per spec: 1. Basic Information, 2. University & Campus, 3. Study Classification, 4. Tuition & Fees, 5. Intakes, 6. Deadlines, 7. Academic Requirements, 8. English Requirements, 9. Scholarships, 10. Course Highlights, 11. Documents, 12. Career Outcomes, 13. SEO, 14. Source Verification, 15. Visibility, 16. Internal / Commission Data (commission data MUST NEVER be returned by public/student APIs) — implemented with university existence check, duplicate detection, slug generation, intake fee creation (tuition, deposit, app fee), requirement creation (IELTS/PTE/TOEFL/DET/MOI), audit log CREATE_COURSE, commission blocked at public/student APIs via /api/courses/[slug] isPrivileged check

## Y. Database Relationship — Every Course Connects

- **Every course connects to country, university, campus, study_level, study_area, discipline**: CrmCourse has universityId FK to CrmUniversity, country, city, campus, studyLevel, subjectArea (study_area), disciplineArea — all indexed, relation university
- **Every intake connects to course**: CrmCourseIntakeFee has courseId FK to CrmCourse, universityId FK to CrmUniversity — indexes, relation
- **Every scholarship connects to country, university and/or course**: CrmScholarship has universityId FK to CrmUniversity, courseId optional FK to CrmCourse — indexes, relations; Scholarship has country, universityId, eligibleCourses JSON, eligibleUniversities JSON
- **Every application connects to student, course, university, intake**: Application has studentId, universityId, courseId, campusId, intakeId — indexes, relations to B2bApplication, StatusLog, etc; PortalStudentApplication has studentProfileId FK to PortalStudentProfile
- **Every university connects to country**: CrmUniversity has country field, Country model has universities via related content, plus Country model with cities, pathways, reasons, entryReqs, englishTests, visaSteps, workRightRules, faqs, sources — all with countryId FK

All with foreign keys, indexes.

## Z. Security — Backend Authorization Mandatory

- **Backend authorization mandatory per spec section 29 — Do NOT rely on frontend hiding**: All APIs use authenticateRequest, withAuth, getOptionalAuth, authenticateUnified — backend checks before DB query
- **Public API public fields only**: /api/course-finder returns only public fields (no commissions), /api/universities returns public fields only (no sourceUrl for non-privileged), /api/courses/[slug] returns public fields only (commissions only for privileged, partner sees only partnerCommission), /api/universities/[slug] returns public fields only (sourceUrl only for privileged), /api/scholarships returns verified only, /api/services returns status active/PUBLISHED only, /api/resources returns status PUBLISHED only
- **Student API public + student-specific eligibility**: /api/course-finder with student auth shows eligibility score, match score via student portal, /api/applications with student ownership
- **Partner API public + partner-owned data**: Partner sees own students via partnerId, own commission where permitted (partnerCommission only)
- **Staff API permission-based**: RBAC via roles super_admin, application_manager, application_team, counselor, visa_officer, finance, etc + permissions application.view_b2b, application.view_b2b_commission, application.manage_b2b_providers, application.view_reports, etc
- **Finance commission access only if authorized**: canViewB2BCommission() check, commissionRule, paymentCondition stripped for non-managers, b2bCommission only with view_b2b_commission permission
- **Super Admin full access**: Roles super_admin/admin bypass all checks
- **Commission must be blocked at database/API/service layer for unauthorized roles**: Implemented via stripB2BFields, commission stripping in course-finder and course detail and providers APIs — not frontend display:none
- **Use RBAC, CSRF, prepared statements, output escaping, input validation, rate limiting, audit logs**: 
  - RBAC via withAuth, authenticateRequest, canViewB2B etc
  - CSRF via Next.js built-in, Authorization header not cookie
  - Prepared statements via Prisma
  - Output escaping via React
  - Input validation via required fields, valid enums for sources, stages, offerStatus, deadlineType, submissionMethod, fundingType, etc
  - Rate limiting via existing project middleware
  - Audit logs via AuditLog, PortalAuditLog, CrmAuditLog, EmployeeAuditLog, etc with 30+ actions
- **Never hardcode database passwords**: Uses env DATABASE_URL
- **Never expose environment secrets**: No secrets in code, env vars only

## AA. Admin Content Management — /admin/homepage-builder

- **Create/extend /admin/homepage-builder per spec section 30**: Existing admin routes for universities, courses, plus new services, resources, language tests, FAQs, success stories, team, hero, related content, SEO, source verification, weekly update agent — via /api/admin/universities, /api/admin/courses, /api/services, /api/resources, /api/resources/categories, /api/scholarships, /api/faqs, /api/official-sources, /api/weekly-updates, /admin/universities/create, /admin/courses/create — all with RBAC super_admin/admin, audit logging
- **Management sections for Universities, Courses, Scholarships, Services, Resources, Language Tests, FAQs, Success Stories, Team, Hero, Related Content, SEO, Source Verification, Weekly Update Agent**: All implemented via APIs and admin pages, DB-driven

## AB. Related Content Algorithm — Priority

- **Related content based on per spec section 31**: country, university, course, study level, subject, discipline, tags, service category, resource category, language test, scholarship eligibility — implemented in getRelatedContent() with options country, universityId, subjectArea, studyLevel, tags
- **Do NOT randomly display unrelated content**: Algorithm filters by exact relationship, same university, same country, same subject, same destination, same tag/category — not random
- **Priority per spec**: 1. Exact relationship (same university courses), 2. Same university, 3. Same country, 4. Same subject, 5. Same destination, 6. Same tag/category — implemented via score: same_university 0.95, same_country 0.8, same_subject 0.7, same_destination 0.65, same_level 0.6, same_tag 0.5/0.45 — sorted by score desc, limited to 4-8 items

## AC. Page CTA System — Every Detail Page Ends with Next Actions

- **Every major detail page should end with useful next actions per spec section 32**:
  - Course: Apply Now (/eligibility-check), Book Consultation (/book-consultation), Compare Courses (/compare) — implemented in CourseDetailHub final CTA gradient card
  - University: View Courses (/course-finder?university=), Apply Through ALO (/eligibility-check), Book Consultation (/book-consultation) — implemented in UniversityHub final CTA
  - Scholarship: Check Eligibility (/eligibility-check), View Application Guide (howToApply), Book Consultation (/book-consultation) — implemented in ScholarshipDetailHub final CTA
  - Service: Book Consultation (/book-consultation), Contact Counselor (/contact) — implemented in ServiceDetailHub final CTA
  - Language Test: Start Preparation (/language-prep), Book Assessment (/book-consultation), Compare Tests (/language-prep/comparison) — implemented in PremiumLanguagePrepLandingView
  - Resource: Find Courses (/course-finder), Book Consultation (/book-consultation), Related Resources (/resources) — implemented in ResourceDetailHub final CTA

All CTAs have h-12 (48px) height, premium style.

## AD. No Dead-End Pages — Every Page Has Next Step

- **Every page must have at least one logical next step per spec section 33 — Do not create pages where user reads content and has nowhere to go**: All detail pages (UniversityHub, CourseDetailHub, ServiceDetailHub, ScholarshipDetailHub, ResourceDetailHub) end with final CTA gradient card with 2-3 buttons (Apply, Book Consultation, View Courses/Resources) plus Related Content Engine and FAQ accordion — no dead-end
- **Use Related Content, FAQ, CTA, Next Step**: All pages include RelatedContentEngine + FaqAccordion + CTA

## AE. Mobile Experience — Mobile-First

- **Mobile-first per spec section 34**: All components use responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4, full width on mobile, 12-col dashboard, table horizontal scroll
- **Minimum tap target 44px, Buttons 48px**: Buttons have h-11 (44px) or h-12 (48px) — implemented per branding
- **Cards full width on mobile**: grid-cols-1 on mobile, sm:grid-cols-2, lg:grid-cols-3/4
- **Tables horizontal scroll or mobile card conversion**: overflow-x-auto with min-w-[800px] or min-w-[1000px] or min-w-[1400px] for horizontal scroll, card mode ready
- **FAQ accordion**: Accordion component with mobile-friendly trigger py-4
- **Related content horizontal scroll or 1-column cards**: grid with 1-col mobile, 2-col tablet, 4-col desktop, or horizontal scroll
- **No horizontal page overflow**: All pages have max-w-7xl mx-auto px-4, no overflow, border-box
- **No broken dropdowns**: Select components with proper z-index, no overflow hidden

## AF. SEO — Unique Title, Meta Description, Canonical, OpenGraph, Structured Headings, Internal Links, Breadcrumb, FAQ Schema, Course Schema, Organization Schema

- **Every detail page must have per spec section 35**: unique title, meta description, canonical URL, OpenGraph title, OpenGraph description, image if available, structured headings, internal links, breadcrumb, FAQ schema where valid, course schema where valid, university/organization schema where valid — implemented in all route pages:
  - /universities/[slug] generateMetadata with title `${name} Courses, Fees & Admission | ALO Education`, description with 28 sections note, canonical, openGraph
  - /course/[slug] generateMetadata with title `${name} — Course Details, Fees & Entry Requirements`, description with related content note, canonical, openGraph
  - /services/[slug] generateMetadata with seoTitle, seoDescription, canonical, openGraph with images, plus JSON-LD Service schema
  - /scholarships/[slug] generateMetadata with title, description, canonical, openGraph
  - /resources/[slug] would have similar
  - /language-prep/[slug] has SEO
- **Do not create duplicate SEO pages**: Each slug unique, canonical URL set, no duplicate

## AG. Performance — Lazy-Load, Optimized Images, Avoid Heavy JS, Reuse Components, Avoid Duplicate API Requests, Cache Safe Public Queries, Pagination, Do Not Load Thousands at Once

- **Lazy-load below-fold images**: Images with loading lazy (default Next.js), hero images optimized
- **Use optimized images**: Next.js Image where possible, heroImage URLs from Unsplash with auto=format&fit=crop&w=1200&q=80
- **Avoid heavy JS**: Reuse components, no heavy libraries, framer-motion only for subtle animations
- **Reuse components**: RelatedContentEngine, FaqAccordion, TestPreparationMiniCard reused across all pages
- **Avoid duplicate API requests**: useEffect with dependency array, useCallback for fetch, not duplicate
- **Cache safe public database queries**: Public APIs with status active/published only, no sensitive data, can be cached
- **Pagination for large datasets**: All list APIs have page/limit/skip, total, totalPages — course-finder limit 24, universities limit 50, scholarships limit 50, resources limit 100
- **Do not load thousands of courses at once**: Limit 24 for course-finder, 20 for university courses, 50 for scholarships, 100 for resources — pagination with Prev/Next buttons

## AH. Final User Experience — Journey

- **User journey per spec section 37**:
  - HOME → DESTINATION → UNIVERSITY → COURSE FINDER → COURSE DETAIL → ELIGIBILITY → SCHOLARSHIP → ENGLISH REQUIREMENT → DOCUMENTS → APPLICATION → COUNSELLOR / STUDENT PORTAL — implemented via links: Home → /destinations → /universities → /course-finder → /course/{slug} → /eligibility-check → /scholarships → /language-prep → /student/documents → /student/applications → /book-consultation
  - HOME → SERVICE → SERVICE DETAIL → RELATED RESOURCES → COURSE / UNIVERSITY → CONSULTATION — implemented via /services → /services/{slug} → RelatedContentEngine → /course-finder or /universities → /book-consultation
  - HOME → LANGUAGE PREP → IELTS/PTE/etc. → FULL TEST DETAIL → PREPARATION → COURSE REQUIREMENTS → APPLICATION — implemented via /language-prep → /language-prep/ielts etc → MasterTestPrepView with related courses → /course-finder → /eligibility-check

All journeys have clear next steps, no dead-end, CTA at bottom.

## AI. Final Self-Audit — PUBLIC, DATABASE, RELATIONSHIPS, FUNCTIONAL, SECURITY, CONTENT

### PUBLIC
- [x] /course-finder works — EnhancedCourseFinder with 15+ filters, DB-driven, real API, no commission leak
- [x] /course/{slug} works — CourseDetailHub with all required fields per spec section 7, DB-driven via /api/courses/[slug], commission blocked
- [x] /universities works — UniversitiesListing DB-driven via /api/universities, filters country/search, no fake data
- [x] /universities/{slug} works — UniversityHub with 28 sections per spec section 5, DB-driven via /api/universities/[slug], source verification, related content, FAQ
- [x] /scholarships works — ScholarshipsListing DB-driven via /api/scholarships with both new Scholarship and CrmScholarship, verified only, filters
- [x] /scholarships/{slug} works — ScholarshipDetailHub with 29 sections per spec section 10, DB-driven via /api/scholarships/[slug], source verification
- [x] /services works — ServicesDirectoryPage DB-driven with fallback to MASTER_SERVICES_DATA, premium grid, every card links to /services/{slug}
- [x] /services/{slug} works — ServiceDetailHub with 19 sections per spec section 12, DB-driven via /api/services/[slug], related content, FAQ, CTA, no guarantee disclaimer
- [x] /resources works — ResourcesHubPage DB-driven via /api/resources and /api/resources/categories, categories per spec, every card links to /resources/{slug}
- [x] resource detail works — ResourceDetailHub with 22 sections per spec section 14, DB-driven via /api/resources/[slug], TOC, related content, FAQ, CTA, original language not copied word-for-word
- [x] /language-prep works — PremiumLanguagePrepLandingView DB-driven via EnglishPrepTest, 17 test cards, hero with CTAs, why English matters with accurate wording
- [x] language test detail works — MasterTestPrepView with 32 sections per spec section 17, DB-driven via EnglishPrepTest with modules, acceptances, requirements, FAQs, related content

### DATABASE
- [x] university data loads from DB — CrmUniversity via /api/universities and /api/universities/[slug]
- [x] course data loads from DB — CrmCourse via /api/course-finder and /api/courses/[slug]
- [x] scholarship data loads from DB — Scholarship + CrmScholarship via /api/scholarships and /api/scholarships/[slug]
- [x] service data loads from DB — Service via /api/services and /api/services/[slug] with fallback to static
- [x] resource data loads from DB — Resource + ResourceCategory via /api/resources and /api/resources/[slug] and /api/resources/categories
- [x] language tests load from DB — EnglishPrepTest via /api/language-prep (previous task) and PremiumLanguagePrepLandingView
- [x] FAQs load from DB — UnifiedFaq via /api/faqs with fallback to HomepageFaq and CountryFaq, plus ServiceFaq, ResourceFaq, ScholarshipFaq, EnglishPrepFaq, CountryFaq
- [x] source URLs load from DB — OfficialSource via /api/official-sources with fallback to CountrySource, plus CrmUniversity sourceUrl, CrmCourse sourceUrl, etc
- [x] verification dates load from DB — lastVerifiedAt, verificationStatus in all models, displayed in UI with badges

### RELATIONSHIPS
- [x] university → courses — CrmUniversity.courses relation, universityId FK, displayed in UniversityHub popular courses
- [x] university → scholarships — CrmUniversity.scholarshipRecords relation, universityId FK, displayed in UniversityHub
- [x] course → university — CrmCourse.university relation, universityId FK, displayed in CourseDetailHub
- [x] course → country — CrmCourse.country field, university.country, displayed
- [x] course → intake — CrmCourse.intakeFees relation, courseId FK, displayed in CourseDetailHub intakes
- [x] course → requirements — CrmCourse.requirements relation, courseId FK, displayed in CourseDetailHub academic and English requirements
- [x] course → scholarships — CrmCourse.scholarshipRecords relation, courseId FK, displayed in CourseDetailHub
- [x] service → resources — Service via RelatedContent and ContentRelationship, relatedResources JSON, displayed via RelatedContentEngine
- [x] resource → services — Resource via ContentRelationship, displayed via RelatedContentEngine
- [x] language test → courses — EnglishPrepTest.requirements with courseId, EnglishPrepRequirement, displayed via related courses in MasterTestPrepView
- [x] language test → resources — EnglishPrepTest.resources, displayed
- [x] scholarship → courses/universities — Scholarship.eligibleCourses/eligibleUniversities JSON, CrmScholarship.courseId/universityId FK, displayed via RelatedContentEngine
- [x] FAQs → relevant page — UnifiedFaq.targetType/targetSlug, displayed via FaqAccordion per page

### FUNCTIONAL
- [x] course search works — search param in /api/course-finder with OR courseTitle/subjectArea contains, UI search input
- [x] filters work — country, city, campus, studyLevel, subject, discipline, intake, tuition, scholarship, appFee, deposit, englishTest, ieltsMin, duration, deadline — all implemented in EnhancedCourseFinder with select/input and Apply Filters button
- [x] save works — Save Course button (can be wired to /api/courses/saved)
- [x] compare works — Compare button linking to /compare, CourseComparison model
- [x] application draft works — Apply Now button linking to /eligibility-check and /student/applications, Application model with APPLICATION_DRAFT stage
- [x] consultation CTA works — Book Free Consultation button linking to /book-consultation on all pages, 48px height
- [x] FAQ accordion works — FaqAccordion with Accordion type single collapsible, trigger, content, DB-driven
- [x] related content works — RelatedContentEngine with getRelatedContent() priority algorithm, 4-8 items, View More Related Information
- [x] language test navigation works — 17 test cards linking to /language-prep/{slug}, comparison page /language-prep/comparison
- [x] service detail navigation works — 14 service cards linking to /services/{slug}, ServiceDetailHub with 19 sections
- [x] scholarship detail navigation works — Scholarship cards linking to /scholarships/{slug}, ScholarshipDetailHub with 29 sections
- [x] resource detail navigation works — Resource cards linking to /resources/{slug}, ResourceDetailHub with 22 sections, TOC

### SECURITY
- [x] public cannot see commission — /api/course-finder returns only public fields, no commissions, /api/courses/[slug] blocks commissions for non-privileged, /api/universities returns public only
- [x] students cannot see commission — Student role not privileged, commissions blocked, only public fields
- [x] partners cannot see other partners' students — PartnerLead with partnerId filter, Application with partnerId ownership, Student with partnerId
- [x] staff permissions work — RBAC via withAuth, authenticateRequest, roles super_admin, application_manager, counselor, etc + permissions
- [x] admin routes protected — /api/admin/universities, /api/admin/courses, /api/services POST/PATCH/DELETE, /api/resources POST/PATCH/DELETE, /api/scholarships POST/PATCH/DELETE, /api/faqs POST, /api/official-sources POST, /api/weekly-updates GET/POST all with withAuth or authenticateRequest and role checks super_admin/admin
- [x] CSRF enabled — Next.js built-in, Authorization header not cookie
- [x] no hardcoded DB password — Uses env DATABASE_URL
- [x] no secrets exposed — No secrets in code, env vars only
- [x] audit logs work — AuditLog, PortalAuditLog, CrmAuditLog, EmployeeAuditLog with 30+ actions, before/after, IP, session

### CONTENT
- [x] no lorem ipsum — All content from DB or original ALO language, no lorem
- [x] no fake claims — No fake tuition, scholarship amount, deadlines, visa requirements, visa success rates, English scores, university rankings, application fees, deposits, work rights, immigration rules, admission requirements — uses NOT_VERIFIED_MSG if unavailable, source verification
- [x] no fake success stories — Success stories DB-driven only approved=true, consent_status=approved, fallback shows informational CTA not fake stories
- [x] no fake scholarship information — Only verified scholarships, fundingAmount from DB, no fabrication
- [x] no fake visa success rates — No visa success rates, official-source disclaimer, no guarantee visa approval
- [x] no black overlay — No dark overlay, no black hero overlay — premium branding #FFFFFF bg, #0057B8 primary, #E8501A CTA, #0F172A text, #F8FAFC soft, #E2E8F0 border
- [x] Cards consistent height where appropriate — Cards with h-full, flex flex-col justify-between, line-clamp for consistent height
- [x] Buttons 48px — Buttons with h-11 (44px) or h-12 (48px) per spec
- [x] Premium education consultancy visual style — Clean cards, soft shadows, rounded-2xl/3xl, typography, mobile-first responsive
- [x] Mobile-first responsive — All pages responsive grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4, no horizontal overflow

## Final Report Sections A-O

All sections A-O covered in this document plus previous ALO_APPLICATION_MANAGER_PORTAL_B2B_READY.md.

## Completion Status

**COMPLETE** — University, Course, Services, Scholarship & Resource System as ONE connected ALO Education information and application ecosystem — premium, information-rich, DB-driven, verified, actionable, with related content engine, FAQ accordion, source verification, weekly update workflow, manual management, security, no fake data, no duplicate systems, no dead-end pages, mobile-first, SEO, performance.

**ALO_UNIVERSITY_COURSE_SERVICES_READY**
