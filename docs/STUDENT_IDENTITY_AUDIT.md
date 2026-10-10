# Student Identity Audit and Foundation (Phase 0 + Phase 1 identity slice)

Status legend: PASS, PARTIAL, FAIL, BLOCKED, NOT VERIFIED.

## Phase 0 findings (repository baseline at 76f3e1d)

| Area | Finding | Status |
|---|---|---|
| Student ID generation | Four unrelated generators: `permissions.ts` (`Math.random`), `portal-auth/register` (`ALO-S-YY####`, `Math.random` with retry), `whatsapp-webhook-handler` (count/max based, race-prone), `admin/import-center` (count based, computed outside the transaction) | FAIL → FIXED in this slice |
| Format | Existing formats: `AE-YYYY####` (4 digits), `AE-YYYY######` (6 digits), `ALO-S-YY####`. Required: `AE-YYYYNNNNN` (5 digits) | Changed for new IDs; legacy IDs are NOT rewritten |
| Intake-agent ID regex | Accepted only 4+6 and 8-digit forms | FIXED (now also accepts 4+5) |
| Two identity tables | `Student` (CRM, `studentId` unique) and `PortalStudentProfile` (portal, `studentId` unique) both hold student IDs for the same person | FAIL — NOT FIXED. Requires a design decision and data migration; not attempted here |
| Partner IDs | `portal-auth/register` used `ALO-P-YY####` with `Math.random` | FIXED — now `AEP-YYYYNNNNN` via allocator |
| Matching | No policy existed; name-based or ad-hoc lookups in several routes | Policy implemented as a pure library (`src/lib/identity/match-policy.ts`); NOT yet wired into every intake route |
| Audit of `Math.random` in IDs | Other codes still use `Math.random` (application codes, visa case codes, B2B provider codes, asset tags, referral codes) | FAIL — NOT FIXED in this slice; listed for follow-up |

## Implemented in this slice

1. **Sequence table** `StudentIdSequence` (`prisma/schema.prisma`, migration `20261010120000_student_id_sequence`). Additive only; no existing rows touched.
2. **Allocator** `src/lib/identity/student-id.ts`:
   - Sequence advanced by one atomic `UPDATE … SET lastValue = LAST_INSERT_ID(lastValue + 1)` inside the caller's transaction, then `SELECT LAST_INSERT_ID()`.
   - Business year uses `Asia/Dhaka`, not server local time.
   - Each year restarts at `00001`; exhaustion above `99999` fails closed.
   - Scopes: `AE` (student), `AEP` (partner), `EMP` (employee — allocator ready, no employee-creation route migrated yet).
3. **Matching policy** `src/lib/identity/match-policy.ts`: exact Student ID → verified email → verified phone → linked channel identity. Ambiguous matches go to review. Names are never accepted. A supplied ID that matches nothing returns `none` and does not fall through to weaker tiers.

## Identifier lifecycle policy

- **Years:** the calendar year is taken in `Asia/Dhaka` at allocation time. A record created at 00:30 on 1 January Dhaka time receives the new year.
- **Reuse:** a committed number is never reissued. A number allocated inside a transaction that later rolls back is released before any commit, so it was never visible and no reuse happens.
- **Gaps:** possible when an allocation is committed in its own transaction (e.g. `allocateIdentifierCommitted` in the portal register route) and the subsequent profile write fails. Gaps are accepted; reuse is not.
- **Imports:** the import center allocates inside its approval transaction, so a failed batch releases all its numbers.
- **Deleted or merged records:** the sequence is never decremented. A merged-away ID must remain resolvable as an alias (alias table not yet implemented — see remaining work).
- **Legacy IDs:** existing `AE-YYYY####`, `AE-YYYY######`, `ALO-S-…` identifiers are preserved as-is. The new 9-digit tail cannot collide textually with the 4- or 6-digit legacy tails, and the unique index on `Student.studentId` and `PortalStudentProfile.studentId` still enforces uniqueness.

## Tests

| Test file | Coverage | Result |
|---|---|---|
| `tests/unit/student-id-allocation.test.ts` | Format, scopes, overflow, Dhaka-year boundary, sequential uniqueness (200 issues), per-year restart, rollback releases numbers, unknown scope | 8 tests |
| `tests/unit/identity-match-policy.test.ts` | Normalisation, exact ID, unknown ID stops, verified email (case-insensitive), unverified email rejected, verified phone across formats, linked channel, ambiguity, precedence, no name matching | 12 tests |
| `tests/unit/whatsapp-webhook-handler.test.ts` | Updated: delegates to allocator, output `AE-YYYYNNNNN` | 8 tests |

**NOT VERIFIED:** real concurrency. The allocation test uses an in-memory fake that models MySQL single-connection semantics. Concurrent correctness depends on InnoDB row locking, and must be verified against a disposable MySQL instance (`TEST_DATABASE_URL`). No migration has been applied to any database.

## Not implemented in this slice (remaining work)

- Unify `Student` and `PortalStudentProfile` into one canonical record (design + migration decision required).
- Student ID alias table for merges.
- Wire the matching policy into website, WhatsApp, email and social intake routes, with ambiguous matches written to a review queue.
- Migrate remaining `Math.random` identifier generators (application, visa case, B2B, asset, referral codes).
- Unified communication timeline, WhatsApp official integration, OTP via WhatsApp templates, application pipeline transitions, document versioning, partner/employee portal permissions, AI self-service tools, command center.
