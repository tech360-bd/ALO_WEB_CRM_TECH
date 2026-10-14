# Form B → Student Profile_CRM field mapping

Generated from `src/lib/forms/application-form-schema.ts` — that file is the single source of truth, so this table cannot drift from the forms. Regenerate after editing the schema.

Every field below appears in **Form B** (student portal) *and* in **Form C / manual lead add** (`/crm/leads/new`), because both screens render from the same definition set. The last column is the student-profile / CRM destination the value feeds.

## Lead Information  ·  section key `lead`  ·  optional

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Given name | text | required | Student Profile · first name |
| Family name | text | required | Student Profile · last name |
| Email | email | required | Student Profile · email (unique) |
| Country code | text |  | Student Profile · phone country code |
| Mobile / WhatsApp | phone | required | Student Profile · phone (unique) |
| Counselor | text |  | Lead · assigned counselor |
| Lead reference | text |  | Lead · source reference |
| Preferred destination | select |  | Student Profile · destination preference |
| Remarks | textarea |  | Lead · notes |

## Personal Information  ·  section key `personal`  ·  required before Apply Now

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Full name | text | required | Student Profile · full name |
| Date of birth | date | required | Student Profile · DOB |
| Gender | select |  | Student Profile · gender |
| Nationality | text | required | Student Profile · nationality |
| Marital status | select |  | Student Profile · marital status |
| Passport number | text |  | Student Profile · passport number |
| Passport expiry | date |  | Student Profile · passport expiry |
| Current address (country / city / zip + details) | textarea |  | Student Profile · present address |
| Permanent address | textarea |  | Student Profile · permanent address |
| Permanent address is the same as current | checkbox |  | Student Profile · address convenience flag |
| Emergency contact name | text |  | Student Profile · emergency contact |
| Emergency contact relation | text |  | Student Profile · emergency relation |
| Emergency contact phone | phone |  | Student Profile · emergency phone |
| Visa refusal history? | radio |  | Student Profile · visa refusal flag |
| Refusal country | text | conditional | Student Profile · refusal country |
| Refusal date | date | conditional | Student Profile · refusal date |
| Refusal reason | textarea | conditional | Student Profile · refusal reason (evidence uploads to Documents) |
| Immigration history (optional) | textarea |  | Student Profile · immigration notes |

## Contact Information  ·  section key `contact`  ·  required before Apply Now

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Primary email | email | required | Student Profile · email |
| Alternative email | email |  | Student Profile · alternate email |
| Mobile number | phone | required | Student Profile · phone |
| Alternative number | phone |  | Student Profile · alternate phone |
| City of birth | text |  | Student Profile · city of birth |
| Country of birth | text |  | Student Profile · country of birth |
| Office address (if any) | textarea |  | Student Profile · office address |

## Passport Details  ·  section key `passport`  ·  required before Apply Now

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Do you have a passport? | radio | required | Student Profile · passport flag |
| Passport number | text | required | Student Profile · passport number |
| Place of issue | text | conditional | Student Profile · place of issue |
| Issue date | date | conditional | Student Profile · passport issue date |
| Expiry date | date | conditional | Student Profile · passport expiry |
| Nationality | text | conditional | Student Profile · passport nationality |

## Education History  ·  section key `education`  ·  required before Apply Now, repeatable rows

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Highest qualification | select |  | Student Profile · highest qualification (opens the ladder below) |
| Level | select | required | Student Profile · education level |
| Institution name | text | required | Student Profile · institution |
| City / country of study | text |  | Student Profile · study location |
| Board / university | text |  | Student Profile · board or university |
| Subject / major | text |  | Student Profile · subject |
| Result (GPA / % and scale) | text |  | Student Profile · result |
| Passing year | text |  | Student Profile · passing year |
| Study duration (from – to) | text |  | Student Profile · duration |
| Primary language of instruction (MOI) | text |  | Student Profile · MOI (used for MOI waivers) |
| Study gap? | radio |  | Student Profile · study gap flag |
| Gap from | date | conditional | Student Profile · gap start |
| Gap to | date | conditional | Student Profile · gap end |

## English Proficiency  ·  section key `english`  ·  required before Apply Now, repeatable rows

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Do you have an English proficiency test? | radio — Yes, Yet to receive, Planning | required | Student Profile · test status |
| Test name | select | conditional | Student Profile · test type |
| Test date | date | conditional | Student Profile · test date |
| Expiration date | date | conditional | Student Profile · test expiry |
| TRT / certificate ID | text | conditional | Student Profile · certificate id |
| Overall score | text | conditional | Student Profile · overall score |
| Listening | text | conditional | Student Profile · component score |
| Reading | text | conditional | Student Profile · component score |
| Writing | text | conditional | Student Profile · component score |
| Speaking | text | conditional | Student Profile · component score |
| Other sub-scores (GRE / GMAT / SAT / DET) | textarea | conditional | Student Profile · test sub-scores |

## Work Experience  ·  section key `work`  ·  optional, repeatable rows

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Do you have work experience? | radio | required | Student Profile · work experience flag |
| Company / organisation | text | conditional | Student Profile · employer |
| Designation / job title | text | conditional | Student Profile · job title |
| Department | text | conditional | Student Profile · department |
| Job role / responsibilities | textarea | conditional | Student Profile · responsibilities |
| Start date | date | conditional | Student Profile · employment start |
| End date | date | conditional | Student Profile · employment end |
| Currently working here | checkbox | conditional | Student Profile · current employment flag |

## Reference / LOR  ·  section key `reference`  ·  optional, repeatable rows

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Do you have a reference? | radio | required | Student Profile · reference flag |
| Referee name | text | conditional | Student Profile · referee |
| Institution | text | conditional | Student Profile · referee institution |
| Email | email | conditional | Student Profile · referee email |
| Phone | phone | conditional | Student Profile · referee phone |
| Notes | textarea |  | Student Profile · reference notes |

## Background & Visa History  ·  section key `background`  ·  required before Apply Now

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Do you have any visa? | radio | required | Student Profile · visa flag |
| Applied country | text | conditional | Student Profile · visa country |
| Visa type | select — Student, Tourist, Dependent, Short term, Work, Other | conditional | Student Profile · visa type |
| Applicant status | select — Main applicant, Dependent | conditional | Student Profile · applicant status |
| Any visa refusal? | radio | required | Student Profile · refusal flag |
| Refusal country | text | conditional | Student Profile · refusal country |
| Refusal date | date | conditional | Student Profile · refusal date |
| Refusal reason | textarea | conditional | Student Profile · refusal reason |
| Applied for any program / immigration before? | radio |  | Student Profile · prior applications |
| Country | text | conditional | Student Profile · prior application country |
| Serious medical condition | textarea |  | Student Profile · medical declaration |
| Criminal offence | textarea |  | Student Profile · criminal declaration |

## Admission Preference  ·  section key `admission`  ·  required before Apply Now, repeatable rows

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Study destination | select | required | Student Profile · destination preference |
| Study level | select — Foundation, Undergraduate, Postgraduate, MRes, PhD | required | Student Profile · level of interest |
| Program / course title | text | required | Student Profile · course preference |
| Institute name | text | required | Student Profile · institution preference |
| Intake / commencement | text |  | Student Profile · intake |
| Choice priority | select — 1st choice, 2nd choice, 3rd choice |  | Student Profile · preference order |
| Application pathway | select |  | Student Profile · application pathway |
| Pathway provider (if B2B) | text | conditional | Student Profile · pathway provider |

## Dependent & Funding  ·  section key `funding`  ·  required before Apply Now

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Funding status | select | required | Student Profile · funding status |
| Sponsor | select |  | Student Profile · sponsor |
| Source of fund | textarea |  | Student Profile · source of fund |
| Travelling with dependents? | radio |  | Student Profile · dependents flag |
| Dependent details | textarea | conditional | Student Profile · dependent information |

## Notes & Summary  ·  section key `notes`  ·  optional

| Field | Input | Req. | Data for Student Profile_CRM |
| --- | --- | --- | --- |
| Notes / summary / remarks | textarea |  | Student case timeline (case_notes) |
| Notify student via email? | checkbox |  | Automation · n8n email trigger |
| Send welcome email to student? | checkbox |  | Automation · welcome email |

## Application status flow (Form B role-based tracking)

| Stage | Stored in | Who can move it |
| --- | --- | --- |
| Draft created (Form A / portal Apply Now) | `Application.stage = APPLICATION_DRAFT` + `ApplicationStatusLog` | Student creates, counselor advances |
| Form B completeness | `StudentProfileSection.status`, derived by `src/lib/application-readiness.ts` | Student completes, counselor reviews |
| Document review | `StudentDocument.status` + `reviewerNote` + `reviewedBy` + `reviewedAt` | Counselor only |
| Application review / offer / CAS-I20-COE / visa hand-over | `Application.reviewStatus`, `offerStatus`, `casI20CoeStatus`, `visaHandoverStatus` | Counselor, application team, visa officer |
| Partner involvement | `Application.isB2b` + `B2bApplication` | Partner (own tenant only), B2B team |

## Automation switches

| Switch | Field | Effect |
| --- | --- | --- |
| Send welcome email to student? | `notes.sendWelcomeEmail` | Welcome email on manual lead save / profile capture |
| Notify student via email? | `notes.notifyStudent` | Marks the case for the email/n8n notification and sends the student mail |
| Reply on WhatsApp (Form A/B/C) | `contactChannel` / `whatsappOptIn` | Recorded on the lead as `· whatsapp` in `sourceSection` |

## Where the numbers come from

* Apply Now readiness: `src/lib/application-readiness.ts` (server-enforced in `POST /api/applications`).
* Manual lead add: `POST /api/crm/leads/counselling` writes the sections to `StudentProfileSection` with status `complete`.
* Document status vocabulary: `Pending review` (default) → `Verified` / `Rejected`, mapped in `src/components/student/FormBDocumentsSection.tsx`.
* Course data shown beside these fields: `src/lib/public-catalog.ts` (published + source-verified only).
