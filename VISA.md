# ALO EDUCATION — VISA SUBSYSTEM

Spec s28–s30, s27, s59, s60, s16, s93, s106, s116.

---

## 1. Scope

A full visa CRM, not a checklist page. **38 API routes** under `src/app/api/visa/`, **17 `Visa*`
models**, plus the readiness engine, deadline monitoring and interview preparation.

**The canonical model is `VisaCase` (schema line 1126). There is no `VisaApplication` model** — code
that queries one silently matches nothing.

`VisaCase` fields: `caseCode`, `studentId`, `destinationCountry`, `currentStage`, `readinessScore`,
`riskLevel`, `isUrgent`, `deadline DateTime?`, `counselorId`, `visaOfficerId`.

---

## 2. Models

| Model | Line | Purpose |
|---|---|---|
| `VisaChecklistItem` | 1006 | Per-case document checklist |
| `VisaReadinessReport` | 1033 | Generated readiness report |
| **`VisaCase`** | 1126 | The case itself |
| `VisaInterview` | 1165 | Interview record |
| `VisaInterviewQuestion` / `Answer` | 1199 / 1220 | Interview content |
| `VisaMockResult` | 1239 | Mock interview scoring |
| `VisaOfficerNote` | 1253 | Officer notes |
| `VisaRiskAssessment` | 1271 | Risk grading |
| `VisaFundingReview` | 1285 | Financial evidence review |
| `VisaStudyGapReview` | 1309 | Study gap review |
| `VisaRefusalReview` | 1333 | Refusal analysis and reapply/appeal |
| `VisaSensitiveReview` | 1355 | Sensitive case review |
| `VisaStudentFeedback` | 1374 | Student feedback |
| `VisaTask` | 1388 | Visa workflow tasks |
| `VisaReport` | 1411 | Reporting |
| `VisaReadinessAssessment` | 9655 | Scored readiness snapshot |
| `StudentVisaRefusal` | 3279 | Refusal history |
| `StudentVisaHistory` | 581 | Visa history feeding eligibility |

---

## 3. Statuses (s28)

`Not Started → Preparation → Documents Missing → Ready → Submitted → Biometrics → Interview →
Under Review → Additional Documents Requested → Granted / Refused / Withdrawn`

Stored as a free-text `String` (`currentStage`). As with the rest of the schema there is **no database
enum**, so validity is enforced in application code and a direct write can bypass it — see
`DATA-MODEL.md` §6.

---

## 4. Readiness engine (s29)

`VisaReadinessAssessment` scores 0–100 across seven components:

`documentsScore`, `financialScore`, `academicScore`, `courseKnowledgeScore`,
`universityKnowledgeScore`, `studyPlanScore`, `interviewReadinessScore` → `overallScore`.

`riskLevel` ∈ `READY`, `NEEDS_DOCUMENT_UPDATE`, `NEEDS_INTERVIEW_PRACTICE`, `HIGH_RISK`,
`HUMAN_REVIEW_REQUIRED` (default `UNKNOWN`), with `riskFlags` as a JSON array.

Output is `Ready / Needs Attention / Not Ready`. **The engine never claims guaranteed visa approval**
(s29, s93). The `HUMAN_REVIEW_REQUIRED` level is how s93's "human review required" outcome is
represented in data.

The graph layer consumes the **latest** assessment only — a test pins that an older low score does not
override a newer high one.

---

## 5. Deadline engine (s30)

Monitors application deadline, CAS deadline, visa deadline, biometric deadline, medical expiry,
passport expiry, financial document age and course start date. Generates student, counselor, visa
officer and manager alerts across SMS, email, WhatsApp and tasks.

Implemented by the `document-expiry-alerts` and `intake-deadline-alerts` cron jobs plus the SLA engine.

**A real constraint:** documents have **no expiry-date columns**. `ApplicationDocument.status` includes
an `EXPIRED` value, and `PortalStudentProfile.passportExpiry` is **free text**. Expiry logic must
therefore parse strings defensively. The attention engine treats an unparseable expiry as *unknown* and
excludes it from the urgent sample, rather than treating it as expired or as valid.

Visa deadlines within the next seven days are surfaced at `URGENT` severity, excluding cases already
`granted`.

---

## 6. CAS / COE / I-20 (s27)

Country-specific document workflows: UK (offer → deposit → financial evidence → CAS readiness → CAS
request → CAS issued), Australia (offer → deposit → CoE → visa), USA (offer → deposit → I-20 →
SEVIS-related workflow → visa), Canada (offer → deposit → provincial/institution documents → study
permit → visa). Other destinations use configurable workflows.

`Application.casI20CoeStatus` carries the state. **Rules must not be hard-coded per country** (s27,
s118) — this is what the regulatory rule versioning layer (s106) exists to support, with
`ruleKeyFor({countryId, ruleType:'VISA_REQUIREMENT', scope})` producing keys like
`country:GBR:VISA_REQUIREMENT:MASTERS`.

---

## 7. Visa rule versioning (s106) — built in this work

Visa requirements change, and before this the `Country*` rule tables carried only `lastVerifiedAt` and
`status`, so editing `CountryEntryRequirement` silently overwrote the requirement a past application had
been assessed against.

`RegulatoryRuleVersion` now provides append-only, dated, provenanced versions. This makes it possible to
answer **"what did ALO believe on the day it advised this student?"** via
`GET /api/rules/active?ruleKey=…&at=2026-03-01`.

Guarantees, all unit tested:
- one active version per rule key, half-open windows so no gap and no overlap;
- superseded versions are **retained**, never deleted or renumbered;
- a visa rule change **requires a named human approver** (s116) — an empty actor is refused, so neither
  a cron job nor an AI agent can self-activate one;
- superseded, rejected and expired versions cannot be resurrected;
- unverified sources are labelled and down-weighted, never presented as authoritative (s105).

Policy changes detected on monitored sources raise a `PolicyChangeAlert` with an explicit blast radius
(affected students, applications, countries) and never auto-apply (s64).

---

## 8. AI visa agent (s59)

Analyses the actual student file for missing documents, financial gaps, inconsistent information,
deadline risks, interview preparation needs and issues requiring human review.

**Never guarantees visa approval.** Gated by the `AI_VISA_AGENT` feature flag, which bootstraps
**disabled at 0% rollout**. High-risk actions (`FINALIZE`, `APPROVE`, `SEND`) require a human via
`validateAiAction`; visa submission is one of the five s116 human-in-the-loop actions.

---

## 9. Interview preparation

`VisaInterview`, `VisaInterviewQuestion`, `VisaInterviewAnswer`, `VisaMockResult` support research,
preparation, practice, scoring and recording, with **human final review**. Student-facing surfaces
include `/student/visa-interview-practice`, `/student/credibility-interview` and
`/student/visa/readiness`.

AI must not copy official exam questions (IELTS, PTE, TOEFL, Duolingo) or invent visa rules — final
authority is the visa officer.

---

## 10. Verification status

| Item | Status |
|---|---|
| Readiness scoring and graph consumption | **PASS** — unit tested (risk 27 + 18, opportunity graph 40) |
| Rule versioning | **PASS** — 92 unit tests |
| Deadline monitoring logic | **PARTIAL** — implemented and statically reviewed; job execution not observed |
| Visa case workflow end-to-end | **NOT VERIFIED** — requires a database |
| Real visa status from an external authority | **NOT CONFIGURED** — no government API integration |
| Journey A visa stages (s126) | **NOT VERIFIED** |

No visa decision, submission or readiness score was computed against real student data in this
environment.
