# Phase 0C · 08 — Revised Go-Live Blocker Report

**Generated:** 2026-11-02 · **Supersedes:** `../SAFE-GO-LIVE-READINESS-REPORT.md` §2 (three blockers)
**Status:** decision-ready. No code, data, schema or database was changed.

---

## 1. What changed since the Phase 0A report

| Phase 0A claim | Phase 0C finding | Verdict |
|---|---|---|
| "7 endpoints with **no auth at all**" | All 7 are non-public **and** in `SENSITIVE_API_ROUTES`; the Next 16 proxy gate returns 401/403 | **Claim withdrawn** — hardening gap, not an open door |
| "31 tests fail, pre-existing, CI is red" | Failures reproduce, but the cause is `Cannot find module '.prisma/client/default'`; `prisma generate` is blocked by network | **Unmeasured**, not failed |
| "8 verified courses" | 7 `VERIFIED` + 1 `PARTIALLY_VERIFIED` + 3 `NEEDS_REVIEW`; **0 of 8** meet the field-level `VERIFIED` rule | **Confirmed and sharpened** |
| "153 universities with contradictory labels" | 159 conflicts: 154 label disagreements, 3 alias bundles, 1 count disagreement, 1 course-level ambiguity | **Confirmed, root-caused** |
| (not previously reported) | `onNavigate("public-country")` is used by 8 files but **no view registry exists** in `src/` | **New blocker, P1** |

Two of the three original P0s do not survive verification as stated. That matters more than the count
of blockers: a release decision taken on the old report would have prioritised a closed door and ignored
an open window.

## 2. Revised blocker set

| ID | Severity | Blocker | Evidence |
|---|---|---|---|
| **B1** | **P0** | Catalogue cannot be published at field level: 0 of 8 courses meet the rule | report 02 §2, report 04 §2 |
| **B2** | **P1** | Navigation to country/detail views is wired to a view registry that does not exist in `src/` | report 05 §3.3, 07 §4 |
| **B3** | **P1** | Release gate unmeasured: Prisma client cannot be generated here, so test state is unknown | report 07 §6 |
| **B4** | **P2** | 7 handlers have no in-handler auth (single-layer dependency on the proxy) | report 07 §1 |
| **B5** | **P2** | Identity counts inflated by duplicates; NZ shows 9 universities instead of 8 | report 01 §5, 03 §4 |
| **B6** | **P2** | Four competing course-coverage models in `prisma/schema.prisma` | §3 below |
| **B7** | **BLOCKED** | Production/staging identity unconfirmed; no DB connection permitted | §4 below |

## 3. Schema compatibility — the catalogue is not where the CSV names suggest

`prisma/schema.prisma` holds **618 models**. The catalogue does not live in `University` / `Course`:

| Concept in the recovery CSV | Actual Prisma model | Note |
|---|---|---|
| Institution | `CrmUniversity` | `Crm` prefix; `UniversityPage`, `UniversityDigitalTwin`, `UniversityFaculty`, `PhdUniversity` are separate concepts |
| Course | `CrmCourse` | plus `CrmCourseRequirement`, `CrmCourseIntakeFee`, `CoursePage`, `CourseHistory` |
| Intake | `CourseIntake` | no prefix |
| Course-month coverage | **`CourseMonthCoverage`**, **`CourseMonthCoverageVersion`**, **`CrmCourseMonthlyCoverage`**, **`CrmCoverageRevision`** | **four models for one concept** |
| Evidence | `CrmOfficialEvidence` | has `universitySlug`, `courseSlug`, `verificationStatus` |

**Consequences:**

1. Every SQL query written against `University`/`Course` fails immediately. The staging queries in
   `staging-db/` use the real names (`CrmUniversity`, `CrmCourse`) and begin with an existence check.
2. `UserSession` and `StudentProfile` do not exist; the models are `User` and `PortalStudentProfile`.
3. **The four coverage models are a schema-level duplicate** and must be resolved before any import:
   importing 104 course-month rows into the wrong one produces data that no UI reads. No model was
   changed.
4. `CrmOfficialEvidence` keys evidence by `universitySlug`/`courseSlug` while the CSV inventory uses
   `institution_key`/`course_key` — a mapping step is required, and slug collisions would silently
   merge evidence.

## 4. Staging database safety — prepared, not connected

Phase 0C was authorised to use a disposable non-production MySQL in principle. **No connection was
opened.** Prepared artifacts:

| Artifact | Purpose |
|---|---|
| `staging-db/00-preflight-identity.sql` | proves non-production identity: host/db/user/schema, replication peers, table existence, row scale, real-customer markers, read-only grants |
| `staging-db/01-recovery-verification.sql` | compares DB counts against the canonical inventory: verification distribution, synthetic contamination, field-level coverage, orphaned evidence, duplicate institutions, all four coverage models |

Both files contain **only** `SELECT` statements. Neither was executed. No seeds, migrations, imports,
updates or deletes were prepared, because none are permitted in this phase.

**The gate that cannot be automated:** owner confirmation in writing that the target is non-production.
The preflight can prove many things; it cannot prove intent. Until that confirmation exists, the answer
is "not connected", not "probably fine".

## 5. B1 in detail — why the catalogue is the only true P0

The public visibility rule is correct and tested. The problem is that nothing satisfies it:

* 8,735 synthetic courses (99.9%) are correctly unpublishable;
* 8 real courses exist, and **none** has evidence for all 10 core field groups;
* the best are Manchester and TUM at 6/10 — both missing English requirement;
* **fee is evidenced for 3 of 8**, **English requirement for 2 of 8**, **academic year for 3 of 8**;
* Monash, the one Australian course, is 2/10 (code, year, mode, campus — no duration, fee or deadline);
* 79 institutions are identity-verified, which proves existence and nothing about their courses.

So the live Course Finder is empty *correctly*. Publishing requires either (a) `PARTIALLY_VERIFIED`
with unknown fields rendered as unknown, or (b) 10/10 evidence, which exists for zero courses.

**Cheapest real improvement, no new collection:** relink 3 orphaned evidence records → two Centennial
courses move 4/10 → 6/10 (report 02 §3).

## 6. B2 in detail — the navigation defect nobody reported

Eight components navigate with `onNavigate("public-country", slug)`. No file in `src/` maps that view
name to a component: `lib/view-registry/**` exists only inside `imports/alo-education-full/src`, and
`components/alo/views/public-country.tsx` is an orphan with no importer.

This is a **functional** blocker, not cosmetic: the country cards on the public home, search,
destinations, course and university pages point at a view that cannot resolve. It also explains why the
`/api/course-finder/eligibility` 401 has stayed latent — its only caller sits behind the same dead
navigation.

Fix order matters: restore the registry **and** fix the 401 in the same change, or repairing
navigation converts a dead link into a visible error.

## 7. B3 in detail — how to actually measure the gate

```bash
# on a machine with network access to binaries.prisma.sh
npx prisma generate
npx vitest run tests/unit --reporter=verbose
```

Until that runs, the correct statement is "the test gate is unmeasured in this environment", not "the
test gate is red" and not "CI is green". Any release decision that cites test results must cite a run
in which the Prisma client was generated.

## 8. What is safe to say publicly today

| Statement | Safe? |
|---|---|
| "8 courses across 6 destinations with official evidence" | Yes — that is exactly the verified set |
| "79 identity-verified universities" | **No** — 79 rows, 78 distinct, identity only |
| "UK: 140 universities" | **No** — a 140-row review sample, 2 identity-verified |
| "New Zealand: all 8 universities" | Yes — after merging the duplicate Auckland row |
| "Every course page is verified" | **No** — zero courses meet field-level `VERIFIED` |
| "The catalogue is coming soon" | Yes — and honest |

## 9. Recommended decision sequence

1. **Approve the label policy** (report 04): demote 7 courses to `PARTIALLY_VERIFIED`, hold Monash,
   keep Aston unpublished, mark institutions `IDENTITY_VERIFIED_COURSE_UNVERIFIED`.
2. **Approve the 3 evidence relinks** — no new collection, lifts 2 courses.
3. **Fix navigation + the eligibility 401 together** (B2), with a regression test.
4. **Re-measure the test gate** on a networked machine (B3).
5. **Dedupe NZ and split alias bundles** (B5) — pure data hygiene.
6. **Resolve the four coverage models** (B6) before any import is contemplated.
7. **Only then** consider a staging import, after owner confirmation of non-production identity.

## 10. Bottom line

The system's *protection* mechanisms are stronger than the Phase 0A report suggested: a fail-closed
proxy gate, role allow-lists for 659 routes, two correctly tombstoned endpoints, and a private-upload
defence that runs before the static bypass.

The system's *content* is weaker than any previous report suggested: zero field-complete courses,
identity-only institutions, and a navigation layer wired to a registry that lives only in an archive.
Publish the 8 courses honestly as partially verified, or publish nothing — but do not publish the
synthetic set, and do not describe identity verification as course verification.
