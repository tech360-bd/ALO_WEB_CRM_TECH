# DATABASE_SETUP.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — MySQL 8 Database Setup Guide |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | How to create, migrate, seed, and verify the MySQL 8 production database for Alaminn.info. Includes the 55-model Prisma schema overview grouped by domain. |

---

## Production database target

| Item | Value |
|---|---|
| Database type | MySQL 8.0.37 |
| Host | `localhost` (cPanel same-server) |
| Port | `3306` |
| Database name | `aloeduca_alamin_crm` |
| Database user | `aloeduca_alamin_crm` |
| Character set | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Connection string | `mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm` |

---

## Step 1 — Create the database via cPanel MySQL Database Wizard

### Procedure

1. Log in to cPanel.
2. Navigate to **Databases → MySQL Database Wizard**.
3. **Step 1 of 3 — New Database**:
   - In the "New Database" field, type `alamin_crm`.
   - cPanel prefixes your username, producing `aloeduca_alamin_crm`.
   - Click **Next Step**.
4. **Step 2 of 3 — Create User**:
   - **Username**: `alamin_crm` (cPanel prefixes to `aloeduca_alamin_crm`).
   - **Password**: `ALO2026a` (or use the Password Generator for a stronger one — recommended).
   - **Password Generator**: tick "I have copied this password in a safe place" → click **Use Password**.
   - Click **Create User**.
5. **Step 3 of 3 — Privileges**:
   - Tick **ALL PRIVILEGES** (Prisma needs CREATE, ALTER, DROP, INDEX, INSERT, SELECT, UPDATE, DELETE, REFERENCES for `db push` and `migrate deploy`).
   - Click **Next Step**.
6. Wizard confirms: "User aloeduca_alamin_crm was added to database aloeduca_alamin_crm".

### Verify character set & collation

```bash
mysql -u aloeduca_alamin_crm -p'ALO2026a' -e "
  SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
  FROM information_schema.SCHEMATA
  WHERE SCHEMA_NAME='aloeduca_alamin_crm';
"
```

Expected output:
```
+--------------------------------+------------------------+
| DEFAULT_CHARACTER_SET_NAME     | DEFAULT_COLLATION_NAME |
+--------------------------------+------------------------+
| utf8mb4                        | utf8mb4_unicode_ci     |
+--------------------------------+------------------------+
```

If the collation is `utf8mb4_general_ci` (the MySQL 8 default), fix it:
```bash
mysql -u aloeduca_alamin_crm -p'ALO2026a' -e "
  ALTER DATABASE aloeduca_alamin_crm
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

### Why utf8mb4_unicode_ci?

- `utf8mb4` supports the full Unicode range (including 4-byte emoji and CJK characters). MySQL's older `utf8` (alias for `utf8mb3`) is broken for emoji.
- `utf8mb4_unicode_ci` is the Unicode-correct collation (sorts correctly across languages). `utf8mb4_general_ci` is faster but incorrect for some locales.
- The Prisma schema's text fields all assume utf8mb4. If the DB is utf8mb3, inserts of emoji or 4-byte CJK characters fail with `Incorrect string value: '\xF0\x9F\x98...'`.

---

## Step 2 — Swap Prisma schema provider to MySQL

The shipped `prisma/schema.prisma` is configured for SQLite (the dev database). For production, swap the provider:

### Option A: Use the setup script (preferred)
```bash
cd ~/alaminn.info
bash deploy/cpanel/setup-cpanel.sh
# The script handles the swap, generate, push, and seed in sequence.
```

### Option B: Manual swap
```bash
cd ~/alaminn.info

# Backup the SQLite schema
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak

# Swap the provider line
sed -i 's|provider = "sqlite"|provider = "mysql"|' prisma/schema.prisma

# Verify
grep "provider =" prisma/schema.prisma
# Expect: provider = "mysql"
```

### Why this is required

The Prisma client is generated against the active provider. If you skip the swap:
- `prisma generate` produces a SQLite-only client.
- Runtime queries attempt SQLite-only SQL (e.g. `PRAGMA foreign_keys=ON`), which MySQL rejects.
- Error: `P1010: User X was denied access to the database` or `Unknown database 'aloeduca_alamin_crm'`.

---

## Step 3 — Generate the Prisma client

```bash
cd ~/alaminn.info
npx prisma generate
```

Expected output:
```
✔ Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client in 2.41s
```

This produces the typed `PrismaClient` with MySQL-specific query builders for all 55 models.

---

## Step 4 — Apply migrations (`prisma migrate deploy`)

### If a migration history exists

```bash
cd ~/alaminn.info
npx prisma migrate deploy
```

This applies all pending migrations from `prisma/migrations/` in order. It is **safe for production** — never prompts, never resets data.

Expected output (fresh database):
```
Applying migration 000001_init
Applying migration 000002_higher_study_models
...
Applied N migrations.
```

### If NO migration history exists (this project uses `prisma db push`)

```bash
cd ~/alaminn.info
npx prisma db push
```

`db push` is the schema-sync alternative: it compares `prisma/schema.prisma` to the live database and applies the diff. Equivalent to a fresh migration on an empty database.

Expected output (fresh database):
```
🚀  Your database is now in sync with your Prisma schema. Done in 4.95s

✔ Generated Prisma Client (v6.x.x) to ./node_modules/@prisma/client in 2.41s
```

### Verify the table count

```bash
mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "SHOW TABLES;" | wc -l
```

Expected: **56** (55 model tables + 1 header row from `mysql -e`).

If you see `1` (only the header), the migrations didn't apply — check `npx prisma migrate status` or re-run `prisma db push` with `--accept-data-loss` flag (only on a fresh DB).

---

## Step 5 — Seed the database

```bash
cd ~/alaminn.info
npm run db:seed
```

This runs `prisma/seed.ts` (via `tsx`) and inserts:

| Domain | Records (approx) |
|---|---|
| Admin user (`User`) | 1 (created from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` env vars) |
| Higher Study countries | 8 (UK, USA, Canada, Australia, Germany, Netherlands, Sweden, Ireland) |
| Higher Study cities | 15 |
| Higher Study universities | 20 (Oxford, Cambridge, Imperial, UCL, Edinburgh, MIT, Stanford, ...) |
| Higher Study courses | 40 |
| Higher Study scholarships | 12 (Chevening, Commonwealth, Gates Cambridge, ...) |
| Higher Study research areas | 10 |
| Higher Study research projects | 15 |
| Higher Study supervisors | 15 |
| Higher Study subjects | 12 |
| Higher Study intakes | 6 (Fall 2026, Spring 2027, ...) |
| Higher Study resources | 20 |
| Higher Study student stories | 8 |
| Higher Study events | 5 |
| English Learning courses | 12 (IELTS Preparation, TOEFL, PTE, ...) |
| English Learning lessons | 60 |
| English Learning practice tests | 10 |
| English Learning questions | 100 |
| English Learning tutors | 8 |
| English Learning resources | 15 |
| Articles | 12 |
| Projects | 10 |
| Case studies | 6 |
| Resources | 10 |
| Impact records | 8 |
| Organizations | 6 |
| Partnerships | 5 |
| **Total** | ~274 records |

> Run `npm run db:seed` ONLY on a fresh database. Re-running is idempotent (upserts by slug/email), but unnecessary and may reset content edits.

Expected output:
```
🌱  Seeding database...
✓ Created admin user: admin@alaminn.info
✓ Inserted 8 HigherStudyCountry records
✓ Inserted 15 HigherStudyCity records
...
✓ Done. Inserted 274 records in 12.4s
```

---

## Step 6 — Verify the database

```bash
cd ~/alaminn.info
npm run db:verify
```

This runs `scripts/verify-db.ts` which performs:

1. **Connection check** — Prisma can connect to MySQL.
2. **Table count check** — Exactly 55 model tables exist (matches the schema).
3. **Row count check** — Each seed-populated table has > 0 rows (audit logs and analytics may be empty).
4. **Admin user check** — A user with `role='SUPER_ADMIN'` and `email=<ADMIN_EMAIL>` exists.
5. **ForeignKey check** — All FK constraints are valid (no orphaned rows).

Expected output:
```
✓ Database connection: OK
✓ Table count: 55/55
✓ Row count: 24/27 tables non-empty (audit/analytics expected empty)
✓ Admin user: admin@alaminn.info (SUPER_ADMIN)
✓ Foreign key constraints: VALID

Database verification PASSED.
```

If verification fails, the script prints the specific failure with remediation hints.

---

## Step 7 — Reset the database (only if needed)

If the database is in a broken state and you want a clean start:

```bash
cd ~/alaminn.info
npx prisma migrate reset
```

> ⚠️ `migrate reset` DROPS ALL DATA. Only run on a database you're willing to lose. On production, ALWAYS take a backup first (see `BACKUP_RESTORE_GUIDE.md`).

Alternative (without migrate):
```bash
# Drop and recreate the database
mysql -u aloeduca_alamin_crm -p'ALO2026a' -e "DROP DATABASE aloeduca_alamin_crm; CREATE DATABASE aloeduca_alamin_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Re-push schema
npx prisma db push

# Re-seed
npm run db:seed
```

---

## The 55 Prisma models — grouped by domain

The full schema is in `prisma/schema.prisma` (1,281 lines). Below is the high-level overview; see `DATABASE_SCHEMA_REPORT.md` for the detailed field-by-field breakdown.

### Identity & Auth (3 models)

| Model | Purpose |
|---|---|
| `User` | Admin/staff user with role (11 roles: SUPER_ADMIN, OWNER, EXECUTIVE_ASSISTANT, CRM_MANAGER, PARTNERSHIP_MANAGER, CONTENT_MANAGER, MARKETING_MANAGER, PROJECT_MANAGER, AI_REVIEWER, SECURITY_AUDITOR, VIEWER). Stores passwordHash (scrypt), lastLoginAt. |
| `Contact` | CRM contact (lead/customer). Email-unique. Has tags, status (active/nurturing/converted/archived), source (UTM), preferred channel. |
| `Organization` | Organization (university / education-business / company / media / partner). Has partnerships. |

### CRM (8 models)

| Model | Purpose |
|---|---|
| `Inquiry` | Inbound inquiry form submission. Reference, type (13 types), contactId, UTM fields, privacy/comms/marketing consents, status. |
| `Opportunity` | Sales opportunity. Value, currency, stage (13 stages), priority, closeDate. |
| `Partnership` | Partnership with an organization. Stage (10 stages), alAminnRole, status. |
| `StudentReferral` | CRM-side student referral (pre-ALO Education handoff). Stage (11 stages), consent, interestCountry, interestProgram. |
| `Task` | CRM task. Assignee, dueDate, priority, relatedType/relatedId. |
| `Note` | Free-text note on a contact, by an author. |
| `NewsletterSubscriber` | Email newsletter signup with double-opt-in. Status (pending/confirmed/unsubscribed), token. |
| `MeetingRequest` | Discovery/strategy/partnership/education meeting booking. Requested date/time, timezone, contact info. |

### Content (5 models)

| Model | Purpose |
|---|---|
| `Project` | Portfolio project (education/AI/software/CRM/automation/marketing/research/professional-brand/client-work). Slug, fullDescription, technologies, evidenceStatus, confidentiality. |
| `Article` | Long-form article (11 categories: executive-leadership, business-operations, etc.). Slug, body, tags, author, verificationStatus. |
| `Resource` | Downloadable resource (guide/template/checklist/report/video). Slug, type, fileUrl, readTime. |
| `ImpactRecord` | Quantified impact story. Category (8 types), challenge, role, action, outcome, evidenceStatus. |
| `CaseStudy` | Long-form case study. Category (education-operations / ai-crm / sales-growth), context, intervention, systemBuilt, outcome. |

### AI Workspace (2 models)

| Model | Purpose |
|---|---|
| `AiTask` | AI generation task (workflow, prompt, sensitivity, status, result, deadline). 16+ workflow types. |
| `AiApproval` | Approval/rejection decision on an AiTask by a reviewer. |

### Audit & Logs (2 models)

| Model | Purpose |
|---|---|
| `AuditLog` | Global audit log entry. Actor, action, resource, resourceId, meta (JSON), ipHash. |
| `SystemHealth` | Health check snapshot. Component, status (ok/degraded/down), message, checkedAt. |

### Meeting & Notifications (2 models)

| Model | Purpose |
|---|---|
| `MeetingRequest` | (Listed under CRM above; the spec groups it there.) |
| `Notification` | In-app notification for a user. Type (inquiry/meeting/ai-task/approval/system/contact/newsletter), read flag, link. |

### Analytics & Documents (2 models)

| Model | Purpose |
|---|---|
| `AnalyticsEvent` | Privacy-friendly first-party analytics event. No raw IP — only sha256 hash truncated to 16 hex chars. Anonymous sessionId (daily-rotating). UTM fields. Meta (JSON). |
| `Document` | Document file (contract/proposal/report/legal/financial/media). Filename, fileUrl, mimeType, size, category, uploadedBy. |

### Site Settings & Media (2 models)

| Model | Purpose |
|---|---|
| `Setting` | Generic key-value store for site-level config (SEO meta, maintenance flag, robots.txt overrides). |
| `MediaAsset` | Media library entry. Filename, url, altText, mimeType, dimensions, category (brand/portrait/project/article/case-study/general). |

### Higher Study Platform (17 models)

| Model | Purpose |
|---|---|
| `HigherStudyCountry` | Study destination country. Slug, educationSystem, tuitionFeeRange, visaOverview, workRights. |
| `HigherStudyCity` | City in a country. Living cost, transport, accommodation, studentLife. |
| `HigherStudyUniversity` | University. Slug, institutionType, studyLevels, IELTS/TOEFL/PTE requirements, rankings (JSON), featured. |
| `HigherStudySubject` | Subject (STEM/Business/Humanities/Arts/Social Sciences/Medicine/Law). |
| `HigherStudyIntake` | Application intake (Fall 2026, Spring 2027, ...). Application deadline, status. |
| `HigherStudyCourse` | Course offered by a university. StudyLevel (30+ levels), tuitionFee, eligibility, deadlines. |
| `HigherStudyScholarship` | Scholarship. Provider, fundingType, eligibility, deadline, application process. |
| `HigherStudyResearchArea` | Research area (AI, Biotech, Climate, ...). |
| `HigherStudyResearchProject` | PhD/research project. Supervisor, funding, stipend, duration, deadline. |
| `HigherStudySupervisor` | Academic supervisor. Accepting students flag, researchInterests, publications (JSON). |
| `HigherStudyResource` | Study resource (planning / country-guides / SOP / personal-statement / CV / visa / IELTS / ...). |
| `HigherStudyStudentStory` | Student success story. University, course, country, intake, story, advice. |
| `HigherStudyEvent` | Event / webinar. EventDate, location, registrationUrl, status. |
| `HigherStudySavedItem` | Anonymous (sessionId) or authenticated (userId) saved entity. EntityType (university/course/scholarship/research/supervisor/resource/comparison). |
| `HigherStudyComparison` | Comparison set (max 4 entities). EntityType, entitySlugs (comma-separated). |
| `HigherStudyReferral` | ALO Education referral audit row. ReferralCode, source, targetUrl, status (created/transferred/completed/failed/expired), expiresAt (24h TTL). |
| `HigherStudyAlert` | Deadline alert subscription. Email/whatsapp, entityType, deadlineDate, alertSent. |
| `HigherStudyAuditLog` | Higher-Study-specific audit log. Action, entityType, beforeData/afterData (JSON). |
| `HigherStudyImportJob` | Bulk import job (CSV → universities/courses/scholarships). Status, processedRows, errorRows. |

### English Learning Platform (10 models)

| Model | Purpose |
|---|---|
| `EnglishLearningCourse` | English course (IELTS/TOEFL/PTE/DET/GRE/GMAT, beginner–advanced). Duration, hours/week, price, syllabus (JSON). |
| `EnglishLearningLesson` | Lesson within a course. LessonType (video/reading/listening/speaking/writing/grammar/vocab/quiz), orderIndex. |
| `EnglishLearningPracticeTest` | Mock test. TestType, duration, totalQuestions, passingScore. |
| `EnglishLearningQuestion` | Question in a practice test. QuestionType (multiple-choice/true-false/fill-blank/short-answer/essay/matching), correctAnswer. |
| `EnglishLearningTutor` | English tutor. Specialties (JSON), hourlyRate, rating, isAvailable. |
| `EnglishLearningResource` | English learning resource (article/video/infographic/audio/pdf). |
| `EnglishLearningEnrollment` | Student enrollment in a course. Status, progressPercent, lastAccessedAt. |
| `EnglishLearningProgress` | Progress on a lesson or test. ScorePercent, timeSpent, attemptsCount. |
| `EnglishLearningReferral` | ALO Education English referral audit row. ReferralCode, sourceEntityId, targetUrl, status. |
| `EnglishLearningAuditLog` | English-Learning-specific audit log. |
| `EnglishLearningSetting` | English-Learning-specific key-value settings. |

### Total: 55 models

| Domain | Count |
|---|---|
| Identity & Auth | 3 |
| CRM | 8 |
| Content | 5 |
| AI Workspace | 2 |
| Audit & Logs | 2 |
| Notifications | 1 |
| Analytics & Documents | 2 |
| Site Settings & Media | 2 |
| Higher Study Platform | 19 |
| English Learning Platform | 11 |
| **Total** | **55** |

---

## Database connection troubleshooting

### `P1003: Database does not exist`

**Cause**: The MySQL database wasn't created in cPanel.
**Fix**: Run Step 1 above. Verify with `mysql -u aloeduca_alamin_crm -p -e "SHOW DATABASES;"`.

### `P1045: Access denied for user 'aloeduca_alamin_crm'@'localhost'`

**Cause**: Wrong password in `DATABASE_URL`, or the user wasn't granted privileges on the database.
**Fix**:
1. cPanel → MySQL Databases → Current Users → Change Password (set a known strong password).
2. cPanel → MySQL Databases → Current Databases → click the user icon next to `aloeduca_alamin_crm` → ensure ALL PRIVILEGES is checked.
3. Update `DATABASE_URL` in `.env` with the new password.
4. Restart the app from cPanel UI.

### `P1001: Can't reach database server at localhost:3306`

**Cause**: MySQL service is down, or the cPanel account has hit a connection limit.
**Fix**:
1. Check cPanel → Server Status → MySQL (should be "up").
2. If down, contact hosting support.
3. If up but unreachable, check `~/.my.cnf` for a wrong socket path.

### `ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol`

**Cause**: MySQL 8 uses `caching_sha2_password` by default; older MySQL clients (or Prisma < 5) don't support it.
**Fix**:
```bash
mysql -u aloeduca_alamin_crm -p -e "
  ALTER USER 'aloeduca_alamin_crm'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ALO2026a';
  FLUSH PRIVILEGES;
"
```
Or upgrade Prisma to v6+ (already in this project).

### `Unknown column 'X' in 'field list'`

**Cause**: Prisma schema and database are out of sync (a migration was skipped).
**Fix**:
```bash
cd ~/alaminn.info
npx prisma db push
# or
npx prisma migrate deploy
```

---

## Backup & restore

See `BACKUP_RESTORE_GUIDE.md` for the full procedure using `scripts/backup.sh`, `scripts/restore.sh`, and `scripts/verify-backup.sh`.

Quick reference:
```bash
# Backup
bash scripts/backup.sh

# Restore (interactive — requires confirmation)
bash scripts/restore.sh storage/backups/<file>.sql.gz

# Verify a backup file
bash scripts/verify-backup.sh storage/backups/<file>.sql.gz
```

---

## Reference

- **Schema location**: `prisma/schema.prisma` (1,281 lines, 55 models)
- **Schema provider**: SQLite in dev, MySQL in production (swapped by `deploy/cpanel/setup-cpanel.sh`)
- **Seed script**: `prisma/seed.ts` (run via `npm run db:seed`)
- **Verify script**: `scripts/verify-db.ts` (run via `npm run db:verify`)
- **Backup script**: `scripts/backup.sh` (run via `bash scripts/backup.sh` or cPanel cron)
- **Restore script**: `scripts/restore.sh` (interactive)
- **Verify-backup script**: `scripts/verify-backup.sh` (offline file inspection)
- **Total tables**: 55
- **Total seeded records**: ~274
- **Character set**: `utf8mb4` / `utf8mb4_unicode_ci`
- **Connection string**: `mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm`
