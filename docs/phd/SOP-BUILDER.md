# Statement of Purpose (SOP) Builder

_Last updated: 2026-10-26 · Status: implemented for the PhD module; verified against a real SQLite database_

## 1. Purpose and scope

The SOP builder produces a **ten-part statement of purpose** for each programme a
student applies to. It exists so a student never submits a statement that is

- a lightly edited template shared with other applicants,
- built on achievements, hardships, motivations or supervisor conversations that
  never happened, or
- written to defeat an AI detector.

The builder is deliberately **deterministic**: the same facts always produce the
same draft, so a reviewer can diff two versions and see only what the student
changed. It does not use an LLM to invent prose. (AI assistance elsewhere in the
PhD module is optional, labelled and never auto-applied.)

## 2. The ten sections

| # | Section key | What it contains | Source of truth |
|---|---|---|---|
| 1 | `programme_fit` | Why this programme and university | Programme record + student's own "why" answers |
| 2 | `research_interest` | Topic and main research question | Selected topic in the workspace |
| 3 | `academic_background` | Degrees, results, relevant modules | Academic profile |
| 4 | `research_experience` | Dissertation, research work, verified achievements | Profile + student's confirmed achievements |
| 5 | `methods` | Methods the student can use and the proposed design | Profile methods + topic methodology |
| 6 | `motivation` | Motivation and professional context | **Student's own words only** |
| 7 | `field_engagement` | Sources actually read | Literature workspace |
| 8 | `contribution` | Intended contribution | Selected topic + provisional gap |
| 9 | `career_plan` | Plans after the doctorate | **Student's own words only** |
| 10 | `ai_disclosure` | How drafting tools were used | Student's own words; required only where the institution asks |

A section with no supporting fact is returned **empty** with the exact input it
needs. The builder never fills gaps with generic prose; this is the mechanism that
prevents interchangeable statements.

## 3. What is never invented

- Achievements, awards, publications, metrics, leadership claims or hardship.
- Supervisor contact, interest or availability.
- Word limits or disclosure requirements the institution has not published — these
  stay `null` and the review report says so.
- Any detector or authorship score. See §6.

## 4. Workflow and status trail

```
DRAFT ──► STUDENT_REVIEWED ──► FINAL_APPROVED ──► REQUIREMENTS_VERIFIED ──► EXPORT_VERIFIED
  ▲             │                   │                     │
  └─────────────┴───────────────────┴─────────────────────┘  (edits return the statement to DRAFT)
```

- Only the **student who owns the project** may create, edit, regenerate or
  restore a statement.
- `FINAL_APPROVED` requires the **project adviser** (or an administrator) — never
  the author. A data verifier cannot open a statement, because the document is
  personal, so verification roles are not used for approval.
- Any content edit after review clears `studentReviewedAt`, `approvedAt`,
  `requirementsVerifiedAt` and `exportVerifiedAt`, and records a
  `CHANGES_REQUESTED` review row. An old approval can therefore never cover new
  text.
- `EXPORT_VERIFIED` is only set when the export endpoint generates a non-empty
  file from saved content with zero blocking checks.

Every transition writes a `PhdSopReview` row **and** an audit-log entry in the
same call; there is no code path that changes status without both.

## 5. Review checks

| Code | Severity | Meaning |
|---|---|---|
| `SECTION_MISSING` / `SECTION_EMPTY` | ERROR | A required part has no text |
| `SECTION_DUPLICATED` | ERROR | Two parts repeat the same text |
| `WRONG_UNIVERSITY` | ERROR | The text names a different register university |
| `WORD_LIMIT_EXCEEDED` | ERROR | Recorded official limit exceeded |
| `AI_DISCLOSURE_MISSING` | ERROR | Institution requires a disclosure and none is written |
| `UNIVERSITY_NOT_SET` | ERROR | No university attached |
| `GENERIC_LANGUAGE` | WARNING | Interchangeable phrase found (e.g. "passionate about") |
| `UNSUPPORTED_CLAIM` | WARNING | Quantitative / award / publication / leadership claim not traceable to the student's facts |
| `SECTION_TOO_SHORT` | WARNING | Under 15 words |
| `BELOW_TARGET` / `WORD_LIMIT_UNDERUSED` | WARNING | Well under the target or published limit |
| `PROGRAMME_NOT_NAMED` | WARNING | Programme name absent from the opening |
| `PROPOSAL_TOPIC_MISMATCH` | WARNING | Statement topic differs from the proposal topic |
| `LOW_PERSONALISATION` | WARNING | Fewer than 40 % of personal-input fields supplied |
| `AI_DISCLOSURE_REQUIREMENT_UNKNOWN` | WARNING | Requirement not recorded — do not assume |
| `WORD_LIMIT_UNKNOWN` | INFO | No published limit recorded |
| `AI_DETECTOR_NOT_MEASURED` | INFO | The detector statement below |

Blocking errors stop `STUDENT_REVIEWED`, `FINAL_APPROVED` and final export.

## 6. AI-detector policy (hard rule)

> No AI-detector score is measured, estimated, guaranteed or targeted by this
> platform. The review report checks content quality — evidence, specificity,
> accuracy and disclosure — and states plainly that detector results vary by tool
> and version and are not a reliable measure of authorship.

The platform **does not** rewrite text to evade detection, **does not** promise
"5 % or lower", and **does not** present detector output as plagiarism or
similarity evidence. The disclosure section exists so institutions that require
transparency receive an accurate statement.

## 7. Exports

| Endpoint | Filename | When available |
|---|---|---|
| `GET /api/phd/sops/{id}/export?format=docx` | `Student_SOP_Final.docx` | After `FINAL_APPROVED` |
| `GET /api/phd/sops/{id}/export?format=pdf` | `Student_SOP_Final.pdf` | After `FINAL_APPROVED` |
| `GET /api/phd/sops/{id}/export?format=report` | `Student_SOP_Review_Report.pdf` | Always |

Files are generated from saved content only (DOCX is a real OOXML package; PDF is
produced by the module's dependency-free writer). A statement that is not approved
can only export the review report, and a zero-byte export is refused rather than
served.

## 8. Access control

| Actor | Read | Create/edit | Approve | Verify requirements |
|---|---|---|---|---|
| Owning student | ✅ | ✅ | ❌ | ❌ |
| Project adviser | ✅ | ❌ | ✅ | ✅ |
| Administrator | ✅ | ✅ | ✅ | ✅ |
| Data verifier | ❌ | ❌ | ❌ | ❌ |
| Other students | ❌ (404) | ❌ (404) | ❌ | ❌ |

Denials return `404` for another student's statement so the API does not leak its
existence.

## 9. Data model

Four additive tables (migration `20261026120000_phd_sop_builder`):

- `PhdStatementOfPurpose` — one row per (project, university, programme); status,
  word settings, disclosure flags, personal facts (JSON text), version, approval
  timestamps.
- `PhdSopSection` — ten rows per statement, unique on `(sopId, sectionKey)`.
- `PhdSopVersion` — immutable snapshots, unique on `(sopId, version)`.
- `PhdSopReview` — immutable review/decision trail.

The migration is additive: no existing table is created, altered or dropped, and
no row is deleted.

## 10. Verification evidence

- `tests/unit/phd/sop-builder.test.ts` — 23 tests covering determinism, empty-input
  behaviour, cross-student difference, unverified-source labelling, every blocking
  check, the university-mismatch logic and the no-detector-score guarantee.
- `tests/integration/phd/services.test.ts` — 11 SOP tests against a real SQLite
  database: duplicate refusal, cross-student privacy, fact persistence, draft
  generation preserving hand-written text, approval by reviewer only, edit
  invalidation, DOCX/PDF/report export signatures and review-trail integrity.

Run the integration suite with:

```bash
node scripts/phd/setup-verification-db.mjs --fresh
ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.phd-tmp/phd-test.db" \
  npx vitest run tests/integration/phd
```

## 11. Known limitations (reported honestly)

- The builder does not judge whether a statement is *good*; it only checks the
  defects listed above. Human review remains mandatory before export.
- Quotes and research findings are not extracted from PDFs automatically in the
  SOP flow; sources are described as "read", not as supporting a specific claim.
- Word limits come from an official source; a statement created before that source
  is recorded shows `WORD_LIMIT_UNKNOWN` rather than a guessed limit.
