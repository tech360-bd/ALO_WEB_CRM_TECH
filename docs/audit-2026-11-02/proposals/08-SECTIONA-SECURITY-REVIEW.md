# 08 — Section A security review

Conditional architecture approval of 2026-11-02, reviewed independently against the actual
repository on branch `arena/ececf40c-alo-web-crm-tech` at `7e4c3922`.

**Verdict: NOT READY TO APPLY.** Two field-mapping defects would have shipped a page that
renders nothing for "study mode" and an academic year that does not exist; two controls are
only partly satisfied. `9002` and `9003` remain **unapplied**, per instruction.

Every verdict below was produced by reading the real schema and source, not the proposal text.

---

## 1. Control-by-control verdict

| # | Required control | Implemented where | Verdict |
|---|---|---|---|
| A1 | Super Admin-only approval | `requireSuperAdmin(auth)` (rejects Acting-As) in the proposed route | **PASS** |
| A2 | Backend authorization on every protected endpoint | `POST` and `GET` both call `requireSuperAdmin` first; page resolves server-side | **PASS** |
| A3 | Course-specific hashed official-source evidence | `isCourseSpecificEvidence()` requires course slug **and** university slug, `VERIFIED`, `https`, 64-hex `contentHash` | **PASS** |
| A4 | Evidence snapshot bound to the approved course version | `evidenceSnapshotKeys` (sorted, deduped) + stale check | **PARTIAL — see SA-3** |
| A5 | Automatic invalidation when evidence changes | `APPROVAL_EVIDENCE_SNAPSHOT_STALE` blocks publication | **PASS** |
| A6 | Deny-by-default publication | no approval ⇒ `NO_APPROVAL_RECORD`; no evidence ⇒ `NO_COURSE_SPECIFIC_EVIDENCE` | **PASS** |
| A7 | Immutable approval audit history | `CrmAuditLog` row per transition (before/after) | **PARTIAL — see SA-4** |
| A8 | Hard-deny Monash + three Aston records | `LIMITED_PUBLICATION_DENY_LIST`, evaluated after approval and evidence | **PASS** |
| A9 | Separate approval for fees/deadlines/intakes/eligibility | `LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED = false` suppresses all nine fields | **PASS** |
| A10 | No exposure via API/metadata/JSON-LD/cache/search before authorization | `publicCourseWhere` unchanged; sitemap uses it; page is `force-dynamic`; limited JSON-LD is breadcrumb-only | **PASS** |
| A11 | `robots: noindex, follow` | set in `generateMetadata` when the limited branch resolves | **PASS** |
| A12 | Excluded from XML sitemaps | `src/app/sitemap.ts:35` queries `publicCourseWhere()` only — partial records are not in it | **PASS (no change needed)** |
| A13 | Field-level correctness | `studyMode`, `academicYear` do not exist on `CrmCourse` | **FAIL — SA-1, SA-2** |
| A14 | Eight recovered courses remain unpublished | no publication is performed anywhere in this package | **PASS** |

## 2. Findings

### SA-1 (blocking) — `CrmCourse` has no `studyMode` column

```
$ awk '/^model CrmCourse \{/,/^\}/' prisma/schema.prisma | grep -i studymode
(no output)

$ ... | grep -nE "deliveryMode|attendanceMode"
  deliveryMode             String   @default("")
  attendanceMode           String   @default("")
```

The rev-1 policy interface and the rev-1 page patch both read `course.studyMode`. Against the
real schema that is `undefined`, so `field('study_mode', …, undefined)` would have rendered
**"Not confirmed" for an evidenced field** — a correctness bug that fails in the safe
direction but still misreports a verified fact.

**Fix:** map the output field `study_mode` to `CrmCourse.deliveryMode`. Applied in
`files/limited-publication-policy.rev2.ts` and `patches/9003b-…rev2.patch`.

### SA-2 (blocking) — `CrmCourse` has no `academicYear` column

Academic year is not a property of the course row. It lives on `CourseIntake`
(`intakeMonth`, `intakeYear`) and on the coverage models. The rev-1 payload rendered
`academicYear` as a confirmed field whenever the evidence's `fieldScope` mentioned it.

**Fix:** remove `academic_year` from the allow-list entirely for this phase. It may return
only as a per-intake claim bound to a per-intake evidence row — a design that does not exist
yet. It must never be inferred from the course row or from "2027" appearing in a URL.

### SA-3 (high) — the snapshot binds evidence, not the course content

The approval snapshot records which evidence rows were approved. It does **not** record the
values of the course fields those evidence rows are used to justify. Consequence: after
approval, an operator can edit `courseTitle`, `campus` or `deliveryMode` and the page will
render the **new** values under the **old** approval — the evidence no longer supports what
is displayed, and no blocker fires.

**Required before apply:** extend the approval row with a content digest, e.g.
`courseSnapshotHash` = sha256 over the exact allow-listed field values at approval time, and
add a blocker `APPROVAL_COURSE_CONTENT_STALE` when it differs. The pure-policy change is
~15 lines and two tests; it is **not** included in rev 2 because it changes the table
(another migration) and therefore needs its own approval.

### SA-4 (medium) — approval history is mutable

`crmCourseLimitedPublication.upsert` overwrites the single row. The append-only record is the
`CrmAuditLog` row written in the same transaction, which carries `beforeData`/`afterData`.
`CrmAuditLog` has no immutability guarantee in code (no append-only enforcement, no
tamper-evident chain).

**Required before apply:** either (a) state explicitly that `CrmAuditLog` is the system of
record for approval history and add a test that no code path deletes from it, or (b) add an
append-only `CrmCourseLimitedPublicationEvent` table. Recommend (a) now, (b) if audit
tamper-evidence is in scope.

### SA-5 (medium) — concurrent approve/revoke is last-write-wins

Each request runs `evaluate` → `$transaction([upsert, audit])`. Two concurrent Super Admins
(one approving, one revoking) can interleave so that the audit rows and the final `state`
disagree. There is no optimistic-concurrency guard (`updatedAt` compare, or `state` in the
`where` clause).

**Required before apply:** add `where: { id, state: <expected> }` to the update path (Prisma
`updateMany` for a conditional write) and return `409 CONCURRENT_MODIFICATION` on a zero-row
result; add a test with a stubbed race.

### SA-6 (low) — cross-origin protection depends on `isSameOrigin`

`isSameOrigin` allows a request with **no** `Origin` header (server-to-server). For a
Super-Admin-only mutation reached only from our own UI that is acceptable, but it means a
leaked session cookie plus a non-browser client is not blocked by this check alone. No change
proposed; recorded so nobody reads "same-origin check" as CSRF-proof for non-browser clients.

## 3. Evidence that is only partially testable today

| Test the brief asks for | Status |
|---|---|
| direct URL access to a limited page | **NOT TESTED** — requires a live DB and the applied patch |
| unauthorized request to the approval API | **PASS** (unit-level, 6 tests) |
| cache behaviour | **NOT TESTED** — page is `force-dynamic`; no CDN in this sandbox. Reasoned, not measured |
| approval revocation hides the page | **PASS at policy level**, **NOT TESTED end-to-end** (needs DB) |
| concurrent changes | **NOT TESTED** — and by SA-5 the behaviour is undefined; fix first |
| evidence replacement invalidates approval | **PASS** (unit-level) |

## 4. What must change before the apply request

1. SA-3 content digest (new column ⇒ new migration record).
2. SA-4 audit-of-record decision (written statement or new table).
3. SA-5 conditional write + `409`.
4. Adopt rev 2 (`policy.rev2.ts`, `9003b-….rev2.patch`) — SA-1/SA-2.
5. Re-run the 20 policy tests against rev 2 (done: **20/20 pass**).

Rev 2 is the reviewable artifact; rev 1 is retained unchanged as the record of what was found
wanting. Nothing in this folder has been applied, migrated or published.
