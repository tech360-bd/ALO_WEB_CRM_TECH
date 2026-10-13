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

## 8. Open items (not yet done)

1. **Manual lead add from the CRM using the Form B section set** (brief: Form C must be
   usable by a counselor to complete counselling manually). The CRM counselor dashboard has
   an add-lead surface; it has not been re-pointed at the shared Form B structure.
2. **Dedicated enquiry forms for course / university / scholarship** — enquiries today
   funnel through the shared `/api/website/lead` (course and university pages post there);
   no separate scholarship enquiry form exists yet.
3. **Form B field-level parity with the pasted numbered list (1.1–11)** — most fields exist;
   "Immigration history", "Send welcome email?" and "Notify student via email?" are present
   as form state but need an end-to-end pass (welcome e-mail send + n8n notification).
4. **"Data for Student Profile_CRM" mapping document** — field-by-field mapping from Form B
   to the CRM student profile is not written down yet.
5. Verification limits in this environment: no MySQL and no headless browser in the sandbox,
   so the flows are verified by lint + typecheck + route/HTML probes; database-backed
   assertions must run in CI or a seeded environment.
