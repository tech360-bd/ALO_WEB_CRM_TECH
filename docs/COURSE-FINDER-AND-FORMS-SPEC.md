# Course Finder, Application Forms A/B/C and Portal Registration — implementation map

Last updated: 2026-10-13
Branch: `arena/57b0809e-alo-web-crm-tech`

This document maps every requirement in the Course Finder / forms / portal brief to the
code and API that implements it, and states honestly what is still open. The rule the
brief sets — **"Apply Now must NEVER show success unless Form B is fully completed"** — is
enforced on the server, not in the browser, and is the anchor for the whole flow.

---

## 1. Course Finder (public website)

| Requirement | Implementation |
| --- | --- |
| Two tabs `COURSES` | `UNIVERSITIES` | `src/components/course-finder/PublicCourseFinder.tsx` — `role="tablist"`, URL `?tab=universities`, one panel visible at a time (switching *replaces* the field set, it never stacks both). |
| Fields 1 always visible for COURSES | Same tab; the COURSES panel is the default and re-renders on tab switch. |
| Subject / Course = drop-down **+ text** | Text input bound to a `<datalist>` fed by `GET /api/course-finder/facets` (`subjects[]`, from published + source-verified courses). |
| Study Level drop-down (Foundation, UG, PG, MRes, PhD) | `STUDY_LEVELS` constant: Foundation, Undergraduate, Postgraduate, MRes, PhD. |
| Destination Country drop-down | Text input + `<datalist>` from `facets.countries[]`. |
| Intake optional, Jan–Dec, multi-select | 12 month chips pinned to a year select (**default 2027**, range 2027–2032), `aria-pressed` multi-select, sent as repeated `intakeMonth=1&intakeMonth=5&year=2027`; `+ All months` / `Clear` shortcuts. |
| Orange icon Search button | `bg-alo-cta` (ALO Orange `#F37021`) button with a `Search` icon; a separate reset icon button clears the form. |
| Fields 2 for UNIVERSITIES | Panel 2: "I'm looking for" (subject + datalist) and "I want to study in" (university name + datalist) — routed to `GET /api/course-finder/universities?subjectArea=&search=&country=`. |
| Result columns: Course Name, University Name, Tuition Fee, Interview Required, Intake, World Ranking, Apply Now | Exactly these seven columns. Course name → `/course/[slug]`, university name → `/universities/[slug]`, tuition from intake fee data with currency, interview `Yes`/`No`/`—` when no verified requirement row exists, intakes from `intakes[]` (up to 3, earliest first) with deadline sub-line, `#n` ranking or "Not ranked". |
| Apply Now requires login/register | Each row links to `/apply/[slug]` with the caption "Login / Register required"; the page itself shows the register/login gate for anonymous visitors. |

API contract:

```
GET /api/course-finder?subjectArea=&studyLevel=&country=&intakeMonth=1&intakeMonth=5&year=2027&university=&page=&limit=
  → { success, courses[], total, page, limit, pages, totalPages }
    course: { …, interviewRequired: boolean|null, portfolioRequired: boolean|null,
              ieltsRequirement: number|null,
              intakes: [{ intakeYear, intakeMonth, intakeName, applicationDeadline,
                          yearlyTuition, tuitionCurrency }] }

GET /api/course-finder/facets?year=2027
  → { success, year, subjects[], levels[], countries[],
      universities[{ id, slug, name, country, city, worldRanking, courseCount }],
      recordedIntakeMonths[] }            # 10-minute CDN cache (s-maxage)

GET /api/course-finder/universities?search=&subjectArea=&countries=&sort=&limit=
  → universities that currently publish at least one verified course (subject filter included)
```

Visibility rule for every row: `status=active`, `verificationStatus=VERIFIED`,
`publicationStatus in (published, PUBLISHED)`, plus `publicCourseWhere()` /
`publicUniversityWhere()` from `src/lib/public-catalog.ts`. A field with no verified
source renders as "Not recorded" — never as a guess.

## 2. Course detail page (`/course/[slug]`)

`src/components/website/CourseDetailHub.tsx` + `GET /api/courses/[slug]`.

Recorded on the page: university name (**linked to its university page**), official course
URL **and** official application URL, course overview, academic entry requirements
(requirement source URL + verification status + last checked), English requirements
(IELTS overall/minimum band and the alternative-test fields), tuition fee + deposits +
application fee, recorded intakes with per-intake deadline/tuition and source, scholarship
records with their official source, application guidance, and verification metadata.
`intakeFees` is ordered `intakeYear asc, intakeMonth asc` so **every recorded intake shows**
(e.g. JAN 2027, May 2027, Sep 2027) rather than a single sample.

Apply Now buttons (hero, closing block, sidebar) now point to **`/apply/[slug]`**, with the
"Login / Register required" caption on the primary button. They no longer point at
`/eligibility-check`.

## 3. Form A — public "Apply Now" (`/apply/[slug]`)

Purpose per brief: capture the lead **and** create the draft application, works for new
users, dedicated page, auto-creates a draft application, emails + team notification.

* `src/app/apply/[slug]/page.tsx` — server component. Resolves the course through the same
  public visibility rule as the course page; `robots: noindex`. Added to
  `PUBLIC_ROUTES` in `src/proxy.ts` so anonymous visitors and crawlers reach it.
* `src/components/apply/ApplyNowForm.tsx`:
  * **Anonymous** → Step 1 gate with `Register & continue` (`/register?next=/apply/…`) and
    `I already have an account` (`/login?callbackUrl=/apply/…`), plus a lead-capture
    fallback form (name, email, phone, destination, intended intake, course level, notes)
    posting to `/api/website/lead` with `leadType: application_intent`.
  * **Signed-in student** → Step 2 application form (intake picker from recorded intakes,
    course locked to the page, notes) that POSTs `/api/applications` with
    `applicationSource: STUDENT_SELF_APPLICATION`.
  * **Readiness checklist** from `GET /api/student/application-readiness`; missing Form B
    sections are listed as links back to the portal, and the submit button is disabled while
    the profile is incomplete.
  * Success is shown **only** for a `success: true` response from the server. A
    `422 FORM_B_INCOMPLETE` renders the missing sections instead.
* Server enforcement: `POST /api/applications` calls `getFormBReadiness()` for student
  self-applications and refuses with `422` + `code: FORM_B_INCOMPLETE` + `missingSections[]`
  until every required Form B section is complete. Staff/partner-created applications are
  unaffected (they use the counselor pre-apply workflow).

## 4. Form B readiness ("fully completed" definition)

`src/lib/application-readiness.ts` is the single definition, used by the API gate and by
`GET /api/student/application-readiness`.

Required sections: Personal, Contact, Education, Passport, English, Background & Visa,
Funding, Admission Preference. Optional: Lead Information, Work Experience, Reference/LOR.
A section counts as complete when the portal marked it complete (`StudentProfileSection`)
or the structured records already satisfy it (student name/email/phone, an education row
with level + institution + result/year, a passport row or a recorded "no passport yet",
a recorded English test or a recorded "planning" answer, an admission preference derived
from the portal section or an existing application row).

## 5. Portal registration and verification

* `POST /api/auth/register` (canonical student registration, `registerStudentAtomically`,
  bcrypt cost 12):
  * unique email — enforced;
  * **unique phone — newly enforced** (digits-only comparison against
    `+digits`, trailing 10 digits and the raw value, so spacing/prefix variants collide);
  * **terms acceptance — newly enforced** server-side (`termsAccepted`), switchable with
    `REGISTRATION_REQUIRE_TERMS=false`; both register UIs now send the checkbox state;
  * email verification code issued through `@/lib/auth/email-otp` (`issueEmailOtp`).
* `POST /api/auth/verify-otp` — consumes the code, flips `emailVerified`, activates the
  student row, and assigns the verified registration.
* Portal access gate: `POST /api/student/auth/login` requires the linked user to be
  `active` **and** `emailVerified`, so an unverified account cannot obtain a portal session.
* Phone verification is deliberately **not** enforced (brief: optional/recommended, SMS OTP
  later); `POST /api/student/auth/otp` already exists for code delivery.

## 6. Form B — student portal application

Existing sections in `src/components/student/StudentProfilePage.tsx`: Lead, Personal,
Funding, Contact, Education, Passport, English, Work, Reference, Background & Visa,
Admission Preference — with dynamic "add another" rows for education, work, English tests
and admission preferences.

**New this round — section E) Documents Upload & Verification**
(`src/components/student/FormBDocumentsSection.tsx`):

* documents grouped by the Form B section they belong to (Personal, Passport, Education,
  English, Background/Visa, Work, Reference, Funding, Admission);
* per-document upload (PDF/JPG/PNG/WEBP/GIF ≤ 20 MB) via `POST /api/student/documents`;
* status per document: **Not uploaded → Pending review (default) → Verified / Rejected**,
  mapped from the stored status (`pending_review`/`uploaded`/`under_review` → Pending,
  `verified`/`approved` → Verified, `rejected`/`needs_update` → Rejected);
* **counselor comment** read straight from `reviewerNote`/`rejectionReason`, with review
  date and reviewer;
* the student screen exposes **no** way to set or clear a status: review is
  staff-only (`PATCH /api/documents` requires portal staff auth, and the CRM command
  center writes `reviewerNote` + `reviewedBy` + `reviewedAt`);
* uploads are versioned (`v1, v2, …`) so a newer file never destroys an earlier submission.
* The section's completion feeds both the in-page progress counter and the same
  readiness model used by the Apply gate (no missing required document and nothing rejected).

## 6b. Form A — notifications on application create (new)

`POST /api/applications` now completes the Form A requirement "Email + team
notification" after the draft is written, all best-effort and isolated so a
missing SMTP configuration can never fail a creation:

* portal notification to the assigned counselor — or, when nobody is assigned,
  to every active counselor so the draft cannot sit invisible;
* `TimelineEvent` + `StudentEvent` so the draft appears in the student's history;
* confirmation email to the student (course, university, intake, reference, and
  the reminder that nothing is sent to the university until the counselor signs off);
* notification email to the team inbox (`APPLICATIONS_INBOX` → `COUNSELING_INBOX`
  → `LEADS_INBOX` → `SMTP_USER`).

## 6c. Form B — additions against the restated brief (new)

* **Highest Qualification** selector in Education History: choosing a level opens
  every level below it as an empty, editable row (SSC → HSC → Diploma → Bachelor →
  Master). Existing rows are never overwritten and "Add Education" stays unlimited.
* **Visa refusal evidence**: each refusal row now takes an upload (Country, Visa
  Type, Rejection Date, Reason + Evidence), stored through the same private
  document API as section E under category `REFUSAL_LETTER`.
* **Immigration history** is an always-visible free-text field, as specified,
  independent of the yes/no answer rows.

## 7. Form C — counselling booking (`/book-consultation`)

`src/components/website/public-pages/PublicConsultationPage.tsx` → `POST /api/website/lead`.

* Fields: Name, Email, Phone, **Intended Intake (new)**, **Course Level (new)**,
  Preferred Destination, Service, Preferred Date/Time, Message, plus a **"Contact me on
  WhatsApp" opt-in (new)** that also records the channel on the lead.
* Counsellor auto-assignment: round-robin over active counselors, falling back to the
  unassigned queue; the assigned counselor gets a portal notification and an internal
  timeline entry.
* **New — email on submit**: an automatic confirmation email to the student (recapping
  destination/intake/level/date and the WhatsApp preference) and a notification email to
  the counselling inbox (`COUNSELING_INBOX` → `LEADS_INBOX` → `SMTP_USER`). Delivery
  failures are logged and never roll the lead back; SMTP may be intentionally unconfigured.

## 8. Enquiry forms (spec 3.2) — course, university, scholarship

`src/components/website/EnquiryForm.tsx` is **one** form used in three contexts, as the
brief requires ("Type of Form with stitcher fixed for every where"):

| Context | Mounted on | `leadType` |
| --- | --- | --- |
| Course enquiry | `/course/[slug]` (`CourseDetailHub`) | `course_enquiry` |
| University enquiry | `/universities/[slug]` (`UniversityHub`) | `university_enquiry` |
| Scholarship enquiry | `/scholarships/[slug]` (`ScholarshipDetailHub`) | `scholarship_enquiry` |

Same fields, same validation, same submit path in all three (`POST /api/website/lead`), which
de-duplicates the contact, round-robins the lead to a counselor, notifies the CRM, and sends
the student confirmation + inbox notification. The only thing that changes between contexts is
the subject line ("Course: …", "University: …", "Scholarship: …").

## 9. The form stitcher + Form C manual lead add (new)

* `src/lib/forms/application-form-schema.ts` defines every Form B section and field with the
  input type, required flag, conditional visibility (`showWhen`) and its **CRM destination**
  ("Data for Student Profile_CRM - …"). This is the single stitcher: the portal and the CRM
  both read it, so a field cannot exist in one and be missing in the other.
* `docs/FORM-B-CRM-FIELD-MAPPING.md` is generated from that schema (12 sections, 106 fields)
  and is the written answer to the "Data for Student Profile_CRM" notes.
* **Manual lead add** — `/crm/leads/new` renders the same section set for a counselor, and
  `POST /api/crm/leads/counselling` (staff auth) creates the lead in the CRM lead table
  (re-using an existing record for the same email/phone), creates or attaches the `Student`
  row, writes each captured section to `StudentProfileSection` with status `complete`, assigns
  the counselor, notifies them, writes the timeline/audit trail and — when
  "Send welcome email to student?" is ticked — sends the welcome email. Because the sections
  are stored as real Form B sections, the Apply Now gate recognises them.
  The previously disabled "Add Lead" button on the counselor dashboard now opens this page.

## 10. Still open

1. **End-to-end pass in a seeded environment** — the flows are verified here by lint, scoped
   typecheck and route/HTML probes. This sandbox has no reachable MySQL and no Prisma query
   engine binary, and no headless browser, so database-backed assertions and the click-through
   must run in CI or on a seeded staging box.
2. **Phone verification (SMS OTP)** — intentionally deferred per the brief ("later").
3. **Document → Application checklist linkage** — documents are reviewed per Form B section;
   the per-application checklist rows are not yet derived from them.
4. **Repeatable rows in the CRM manual form** — the counselor can capture several rows per
   session ("Save row & add another") and they are stored alongside the section payload; a
   fully structured multi-row editor (one typed array per section) is the next refinement.
