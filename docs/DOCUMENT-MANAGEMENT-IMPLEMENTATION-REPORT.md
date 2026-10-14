# Document Management, Permissions, Versioning & Student Profile — Implementation Report

**Status:** implementation complete and verified at the code level; **changes are LOCAL and UNCOMMITTED** (you asked for no commits/pushes until authorized).
**Verification level:** code-level + isolated logic verification. **Not** staging-verified, **not** production-verified.

---

## 1. Confirmed repository, branch and starting commit

| Item | Value |
| --- | --- |
| Repository | `tech360-bd/ALO_WEB_CRM_TECH` (origin `https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git`) — confirmed via `git remote -v` |
| Branch | `arena/57b0809e-alo-web-crm-tech` — this session is pinned to this branch; it is the isolated working branch |
| Starting commit | `7c26aad487b39a6ac40dbbfd3f3bfeecc798e053` (`docs: honest B2B partner/employee access status`) |
| Starting working tree | **clean** (`git status --porcelain` → 0 entries), 0 ahead / 0 behind origin |
| Branch protections | **NOT INSPECTED** — I did not read or modify repository settings, per your safety rules. No remote operation of any kind was performed. |

**BLOCKER — the Excel workbook is not available.** `Data for Student Profile_CRM (6).xlsx` is not present anywhere in the workspace (`find /home/user -iname "*.xlsx"` → no results). The Student Profile was therefore implemented from the field list in your prompt. **Please upload the workbook** and I will reconcile field names, ordering and any additional columns against it before this work is considered final.

---

## 2. Root causes established by code inspection

### RC-1 — IDOR: a missing assignment **grants** access instead of denying it (HIGH)

Two independent places used the same broken shape — `if (ownerField && ownerField !== me) → 403`:

```js
// src/app/api/counselor/documents/route.ts  (before)
const counselorId = (student as any)?.counselorId;
if (counselorId && counselorId !== auth.userId && !roles.includes('application_team') …) → 403
```

```js
// src/app/api/visa/documents/[id]/{approve,reject,needs-update,download}/route.ts  (before)
if (visaCase) { if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) → 403 }
```

When the owner field is empty — an **unassigned** student, a visa case with **no officer**, or an identifier matching **nothing** — the condition is falsy, no refusal is returned, and the query proceeds. Any authenticated account in the allowed role set could read or act on any student's document by supplying an id. The visa download variant additionally wrapped the whole check in `if (visaCase)`, so *no case at all* skipped it entirely.

### RC-2 — the document **review** endpoint had no role check at all (HIGH)

`PUT /api/crm/documents` validated the target status string but never checked the caller's role. `withAuth` alone was the only gate, and the proxy allow-list for `/api/crm` includes `COUNSELOR`, `FRONT_DESK`, `SUPPORT_STAFF`, `MARKETING` and `FINANCE` — so any of those accounts could approve or reject a student document, set a rejection reason, and stamp `reviewedBy`. This directly contradicts "Staff who are not authorized to review or manage documents must not obtain those privileges through an alternate endpoint."

### RC-3 — identity-domain mismatch on the student visa download branch (MEDIUM)

```js
if (isStudent && doc.studentId !== auth.userId) → 403
```

`doc.studentId` is a `Student` row id; `auth.userId` is a user/portal-account id. The comparison was meaningless: it denied the legitimate owner and would have permitted anyone whose user id collided. The same route (correctly) uses `auth.studentId` elsewhere, which is what exposed the inconsistency.

### RC-4 — two disconnected document systems; the portals could not see each other (MEDIUM)

| Portal | Endpoint | Table |
| --- | --- | --- |
| Student (app) | `/api/student/documents` | `StudentDocument` (keyed `studentId`) |
| Student portal | `/api/student-portal/documents` | `PortalStudentDocument` (keyed `studentProfileId`) |
| **Counselor** | `/api/counselor/documents` | **`StudentDocument`** |
| CRM | `/api/crm/documents` | `PortalStudentDocument` |
| Partner | `/api/partner/documents` | `PortalStudentDocument` |
| Visa | `/api/visa/documents` | `StudentDocument` |

A partner or portal upload writes `PortalStudentDocument`; the counselor view reads `StudentDocument`. **A student's partner-uploaded document was invisible to their counselor**, and vice versa. I did not merge the tables — the relationships are intentional and there is live data. RC-4 is fixed with a read-only normalisation layer.

### RC-5 — the Admin/Super-Admin delete capability did not exist

`grep` for `export async function DELETE` across `/api` returns exactly one document-related hit (`hrm/documents`, employee HR files). No student/partner/portal document deletion or archive path existed, so the capability the product spec grants to Admin and Super Admin was unimplementable.

### RC-6 — Student Profile repeatable sections were modelled but unwired (HIGH, functional)

`StudentEducationRecord`, `StudentWorkExpRecord` and `StudentVisaRefusal` are referenced by **zero** API routes; `StudentEnglishTestRecord` by two read-only ones. Educational background, work experience and visa-refusal history could not be created or edited through any endpoint.

### Verified as already correct (not defects)

- `/api/partner/documents/[id]/download` and `/api/student-portal/documents/[id]/download` are properly scoped (`studentProfile: { partnerId }`, own `studentProfileId`), verify the SHA-256 hash on read, audit, and send `Cache-Control: private, no-store` + `nosniff`.
- `PUT /api/partner/documents` returns an explicit 403 ("Partners cannot approve or reject uploaded documents.").
- `/api/student/documents` uses `withStudentAuth` and scopes every query by `auth.studentId`.
- `/api/crm/*` is role-gated at the proxy layer and no partner role is in that allow-list, so the CRM document list is not a cross-tenant leak.

---

## 3. Exact files modified / added

### Modified (6)

| File | Reason |
| --- | --- |
| `src/app/api/counselor/documents/route.ts` | RC-1: authorization moved to the shared policy (deny-by-default). RC-4: list is now merged across both tables. Error text no longer echoes `error.message`. |
| `src/app/api/crm/documents/route.ts` | RC-2: added the reviewer role guard and made a rejection reason mandatory on the review endpoint. |
| `src/app/api/visa/documents/[id]/approve/route.ts` | RC-1: a non-admin must be the assigned officer of an **existing** case; missing case or officer now denies. |
| `src/app/api/visa/documents/[id]/reject/route.ts` | Same as approve. |
| `src/app/api/visa/documents/[id]/needs-update/route.ts` | Same as approve. |
| `src/app/api/visa/documents/[id]/download/route.ts` | RC-1 (ownership) **and** RC-3 (student identity resolved via `Student.userId` / `PortalStudentProfile.userId` instead of comparing a Student id to a user id). |

### Added (6)

| File | Purpose |
| --- | --- |
| `src/lib/documents/document-access.ts` | Pure policy: reviewer/deletion role sets, the deny-by-default staff decision, cross-portal normalisation, version chaining, replacement-status rule, duplicate detection. No imports, so it is fully testable. |
| `src/lib/documents/document-access-resolver.ts` | DB-backed resolver: resolves a student from `Student.id` / `Student.studentId` / `PortalStudentProfile.studentId` (the routes accept all three), asserts the application relationship for partner students, returns ready-made guards, and `findDocumentOwnership` so review/delete cannot act on an unresolved row. |
| `src/app/api/documents/manage/route.ts` | RC-5: the Admin/Super-Admin-only archive / restore / hard-delete endpoint. Default action is **archive**, not delete. |
| `src/lib/student-profile/profile-sections.ts` | RC-6 validation and normalisation for personal info, education, work, English, visa refusal; `redactSensitivePersonal`; `missingProfileSections`. |
| `src/app/api/student-portal/profile/sections/route.ts` | RC-6 CRUD: GET all sections, POST (insert a new record), PATCH (update **one** record by id). Ownership always from the session. |
| `scripts/document-access-policy-check.ts` | 70 executable assertions covering every rule below. |

### Database / migration changes

**None.** No schema change, no migration, no seeder, no bulk update, no destructive operation. Every field the new code writes already existed. Two known limitations were left for a separate, authorized migration rather than smuggled in:

- `PortalStudentDocument` has no versioning columns (`StudentDocument` does). Portal uploads therefore normalise to `version: 1` and archive is expressed through the existing status vocabulary rather than a new column. My archive route records this limitation in its audit entry.
- `StudentWorkExpRecord` has no dedicated `responsibilities` column; the value is stored in the existing free-text `jobRole` column. Adding a column would require the additive migration you asked me to seek authorization for.

---

## 4. Document lifecycle (what now happens)

1. Upload → validated (size, extension, **magic-byte signature**, name sanitisation) then stored through the existing private-file store.
2. A row is created linking owner + section; **status is always `pending`** — `initialStatusForReplacement()` exists specifically so a replacement can never inherit `verified`.
3. Reviewer (application/visa/document team or admin) sets Verified or Rejected; a rejection **requires a reason**.
4. A rejected slot accepts a replacement; the version chain is `version = max(existing) + 1`, `previousVersionId = latest`.
5. **Three uploads are retained as v1/v2/v3, and there is no hard maximum** — a fourth correction is allowed. Nothing is overwritten or renumbered.
6. A new upload does not demote an existing verified version: the previous verified file stays downloadable until the replacement is itself verified, then becomes `superseded`. This is the answer to "do not automatically mark a replacement as Verified / prevent an unreviewed replacement being mistaken for approved."
7. Deletion: Admin/Super Admin only, reason required (≥10 chars), **archive by default**; hard delete additionally removes the private file and says so in the audit entry. Powers, students and ordinary staff receive 403.
8. Idempotency: an identical hash in the same slot that is not in a `rejected` state is detected as a duplicate — but **re-uploading the same bytes after a rejection is allowed**, so correction is never blocked.

**Reported interpretation of the upload-count requirement:** implemented as *"at least three versions retained in the same slot, non-destructive, no maximum"*. I did not impose a hard cap of three, since the prompt reserved that for explicit product-owner confirmation.

---

## 5. Permission behaviour (server-side)

| Actor | List/read | Upload | Review | Delete/archive |
| --- | --- | --- | --- | --- |
| Student | own identity only (`withStudentAuth` + `auth.studentId`) | own slots | ✗ | ✗ |
| Partner | own `partnerId` scope only | permitted sections | ✗ (explicit 403) | ✗ |
| Counselor | own assigned student only; **another's or unassigned → 403** | — | ✗ | ✗ |
| Application / visa / document team | any student they are entitled to | — | ✓ | ✗ |
| Visa officer (visa routes) | must be the case's assigned officer | — | ✓ | ✗ |
| Finance / viewer / marketing | no document reach | ✗ | ✗ | ✗ |
| Admin / Super Admin | oversight | ✓ | ✓ | ✓ |

Partner students with no submitted application are refused to internal staff (including the assigned-counselor exception), with admin oversight preserved — matching "staff must not gain document access merely because the profile exists in the CRM."

Every rule above is enforced in the route handler. UI hiding is not relied upon anywhere.

---

## 6. Tests actually executed and their exact results

All run locally just now; full output inspected, not summarised.

| Command | Result |
| --- | --- |
| `npx tsx scripts/document-access-policy-check.ts` | **70 passed, 0 failed** — exit 0 |
| `npx tsx scripts/b2b-access-policy-check.ts` (regression) | **94 passed, 0 failed** — exit 0 |
| `npx tsx scripts/communications-policy-check.ts` (regression) | **119 passed, 0 failed** — exit 0 |
| `npx eslint` on all 11 changed/added source paths | **0 errors, 0 warnings** (one informational "file ignored" notice for the script directory) |
| `npx tsc --noEmit` on a scoped project listing all 11 files | **exit 0**, clean |
| `node scripts/verify-prisma-client.mjs` | `Verified generated Prisma client: 532 models` |

**Total: 283 assertions, 0 failures.** Coverage includes: the IDOR decision matrix (unassigned / unknown / other-counselor / assigned / reviewer / admin / viewer / partner-without-application), review-role and delete-role sets, cross-portal normalisation, storage-path non-exposure, the three-version retention chain plus a fourth version, the "replacement is pending" rule, duplicate detection, and all six profile sections including the IELTS-vs-IELTS-UKVI distinction and the explicit refusal to assume an expiry window.

**No production data was used. No test database was required for the suites above.**

---

## 7. Tests blocked by missing services

These were **not** run, so nothing about them is claimed:

1. **Any database-backed behaviour.** No MySQL instance in this environment. Commands that would exercise it (`POST /api/student-portal/profile/sections`, `GET /api/counselor/documents`, the visa review routes, the new archive route) cannot execute. Prisma's engine CDN is also unreachable; client generation needs a dummy-engine binary.
2. **Route-level integration / IDOR requests.** Would require an authenticated session plus a seeded database.
3. **Existing repository test suites** that are DB-backed — not run, not claimed.
4. **Build check** (`next build`) — OOMs in this sandbox; not attempted as evidence.
5. **Excel-workbook reconciliation** — blocked on the missing file (§1).

---

## 8. Remaining risks and unverified behaviour

1. **`PortalStudentDocument` archive is a status change, not a column.** It is preserved and excluded from listings, but a formal `archivedAt` needs an additive migration.
2. **`StudentDocument.status` write vocabulary is inconsistent** in the pre-existing code (`approved` from the visa routes vs `verified` from the student path). I normalised the *read* path (`normaliseReviewState`) rather than changing existing writes, because other readers may compare against the literal strings. Committing to one vocabulary is a follow-up.
3. **The merged counselor list is additive only.** A document appears in the counselor view only when a `Student` row exists for the resolved student; portal-only students with no `Student` row still resolve by `studentProfileId`, but I could not exercise that path.
4. **CSRF/rate limits** on the new endpoints inherit whatever the existing route conventions provide; I did not add new protections, and I did not verify the global posture.
5. **Partner "offer letter" section** — I confirmed partners can upload to permitted sections and that review is blocked, but I did not verify that offer-letter documents land in the specific section the spec names.
6. **The new profile-sections route has no UI.** The API is wired; the portal screens still need to call it.
7. **No staging or production verification of any kind.**

---

## 9. Git state

```
Branch: arena/57b0809e-alo-web-crm-tech
HEAD:   7c26aad4  (unchanged — no commit made)

Modified (6):   counselor/documents, crm/documents, visa/{approve,reject,needs-update,download}
Untracked (6):  lib/documents/{document-access,document-access-resolver}.ts,
                lib/student-profile/,
                app/api/documents/manage/, app/api/student-portal/profile/sections/,
                scripts/document-access-policy-check.ts

Diff: 6 files changed, 129 insertions(+), 34 deletions(-)  (plus the 6 untracked files)
```

**Explicit confirmation: all changes remain LOCAL and UNCOMMITTED. Nothing was committed, pushed, merged, opened as a PR, deployed, or written to any remote branch. No repository setting, branch protection, secret, credential, DNS or hosting configuration was read or modified.**

Say the word and I will commit these to `arena/57b0809e-alo-web-crm-tech`; if you want them on a differently-named branch, note that this session is pinned to the branch above.
