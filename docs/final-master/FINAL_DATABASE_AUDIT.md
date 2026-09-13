# FINAL_DATABASE_AUDIT — MySQL (Prisma) — ALO Education
**Date:** 2026-09-14 | **Engine:** `mysql` (`mysql2 ^3.24.4`, `DATABASE_URL` env) | **Schema:** `prisma/schema.prisma` (450 models, 719 indexes, 23 uniques, 9 migrations)  
**Production DB:** `aloeduca_alo_education` (from `.env.example`, not accessed in sandbox) — **all live checks BLOCKED**; results below are static schema analysis + `prisma validate` + local `prisma generate`.

## 1. Connection & migration history (static)
- `prisma validate` → **PASS** (6.19.3). `prisma generate` → **PASS** locally.
- Migrations present: `20260731000000_init_mysql`, `20260801000000_course_data_provenance`, `20260801024630_official_source_checks`, `20260913*` ×5 — order consistent; no `down` scripts, `migration_lock.toml` present.
- `DATABASE_URL` not set in this sandbox → `prisma db pull` / `prisma migrate deploy` against prod → **BLOCKED** (never run without `verified backup + rollback` — see readiness).

## 2. Required tables & FKs (sample critical — inspected)
| Table / Model | FK / Relation | Index/Unique | Issue |
|---|---|---|---|
| `User` → `roles/permissions` | `User.roles → Role → Permission` | indexed | ✅ |
| `Student.leadId` | FK `Lead` | `@@index([leadId])` + `Student.studentId unique` | ✅ (duplicate StudentId risk if dual generator — gap) |
| `AloApplication.studentId/universityId/courseId` | FK Student/University/Course | `@@index([studentId])` etc. | ✅ but orphan check needs DB run |
| `StudentDocument/FileMetadata` | `entityType/entityId/studentId/applicationId` | `@@index([entityType])` | ⚠️ `entityId` not FK → orphan possible via raw write |
| `MarketingLead` | `counselorId` nullable | phone/email not unique | ❌ dedup requires `@@unique([phoneNormalized])` + indexes on email/socialId |
| `FileMetadata.storagePool` | `STUDENT_PARTNER|OFFICIAL|OPERATIONAL` | indexed | ✅ |
| `CommunicationThread.slaDueAt/slaStatus` | `assignedToId` | indexed `status` | ✅ |
| `MarketingUserAccess.userId` | `@@unique([userId])` | ✅ but no cap limit 3 → app-level check |
| `N8nWorkflow.webhookUrl` | — | `@@index([isActive,triggerType])` | ✅ |

## 3. Integrity checks (should run on prod with credentials — recipes not executed)
```sql
-- Duplicate university names (case-insensitive)
SELECT LOWER(name), COUNT(*) FROM University GROUP BY LOWER(name) HAVING COUNT(*) > 1; -- BLOCKED
-- Orphan courses (no university)
SELECT c.id FROM Course c LEFT JOIN University u ON c.universityId = u.id WHERE u.id IS NULL; -- BLOCKED
-- Orphan intakes (no course)
SELECT i.id FROM CourseIntake i LEFT JOIN Course c ON i.courseId = c.id WHERE c.id IS NULL; -- BLOCKED
-- Duplicate StudentId
SELECT studentId, COUNT(*) FROM Student GROUP BY studentId HAVING COUNT(*) > 1; -- BLOCKED
-- Orphan FileMetadata
SELECT id FROM FileMetadata WHERE entityId IS NOT NULL AND entityType IN ('STUDENT','APPLICATION') AND entityId NOT IN (SELECT id FROM Student UNION SELECT id FROM AloApplication); -- BLOCKED
```
All above → **BLOCKED** in this environment (no `DATABASE_URL`). Do not run `TRUNCATE/RESET` to pass — use transaction + verified backup before remediation.

## 4. Constraints that pass statically
- `University.slug @@unique`, `Course.slug`, `LeadForm` uniqueness — present.
- `Student.studentId` unique — present (but dual generator gap risks duplicate before DB rejects).
- `Payroll @@unique([employeeId, monthYear])`, `BrandAsset @@index([assetType])` — present.
- `MarketingComment @@index([platform,status])` — good for queue.

## 5. Seed & admin
- Seed scripts: `prisma/seed-complete.ts`, `prisma/seed-marketing.ts` — `db:seed` not run in sandbox (BLOCKED). `SEED_SUPER_ADMIN_EMAIL/ PASSWORD` via env — not fabricated.

## 6. Pools, transactions, recovery
- `db.ts` uses Prisma connection pooling (MySQL2); explicit transaction used only in `whatsapp webhook` partially — need transaction for `Lead → Student → Timeline → Task` atomicity (gap).
- Backup/rollback for prod: PM2+Caddy `DEPLOY_DIR=/root/alo-live` — but no `mysqldump` artifact found — **Must add `pre-migrate dump + tested restore` before deploy** (see readiness).

## Verdict
- **Static schema:** PASS with gaps (dedup unique, OTP model, FileMetadata FK, SLA constants).
- **Live integrity (duplicates/orphans):** BLOCKED — requires prod `DATABASE_URL` + read-only SELECTs; do not declare PASS.
