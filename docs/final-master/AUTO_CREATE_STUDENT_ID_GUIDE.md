# Auto-create Student ID + Upload Document + Full Application (FullApp)

**Endpoint:** `POST /api/documents/auto-upload` (multipart/form-data) — **real DB, no fake data**
**Also enhanced:** `POST /api/counselor/documents/upload-on-behalf` (now accepts `email+name` to auto-create)
**Student ID format:** `AE-YYYYXXXXXX` (e.g. `AE-2025000123`) via `createCanonicalStudent` (P2002-retry 5, year-prefixed sequential, `@unique`)

## Why
All portals share one endpoint so **any portal** (student self, counselor, admin, partner CRM, public lead form) can do in one call:
1. Auto-create Student ID if not exists (by `email`+`name`)
2. Upload & store document privately (`STORAGE_POOL_C`, never `public/uploads`)
3. Optionally auto-create full Application (`APPLICATION_DRAFT`)

No hardcoded students — every ID is allocated from real `Student.studentId` sequential scan for current year.

## How it works (real DB only)

1. **Auth optional** — if `Authorization: Bearer <token>` present, actor is logged (`PortalAuditLog`, `TimelineEvent`); else `public-lead`.
2. **Resolve student**
   - If `studentId` (db id or `AE-...` code or email) provided → `findUnique` → reuse
   - Else require `name`+`email` → `createCanonicalStudent({name,email,phone,userId})` → `CREATED` (new `AE-...`) or `LINKED` (existing email)
   - Also ensures `PortalStudentProfile` exists (`Lead Created`)
3. **File private** — `validateFile` (MIME+ext 20MB), `sha256(fileHash)`, `STORAGE_POOL_C || storage/uploads/documents-private` (fail-closed in prod), `timingSafeEqual` signed URL `/api/employee-access/secure-download?filePath=...`
4. **Document records** — `StudentDocument` + `PortalStudentDocument` + `TimelineEvent DOCUMENT_UPLOADED` + `PortalAuditLog DOCUMENT_AUTO_UPLOAD`
5. **FullApp (optional)** — if `fullApplication=true` → `Application.create({ studentId, universityName, courseName, country, intake, applicationSource: DIRECT_ALO_APPLICATION, stage: APPLICATION_DRAFT, safeStatus: DRAFT, counselorId/partnerId from auth })` + timeline + audit

## Request examples

### A. New lead uploads passport → auto-create `AE-...`
```bash
curl -X POST http://127.0.0.1:3000/api/documents/auto-upload \
  -H "Authorization: Bearer $COUNSELOR_TOKEN" \
  -F file=@passport.pdf \
  -F name="Rahim Uddin" -F email="rahim@example.com" -F phone="01712345678" \
  -F documentType="passport"
# → { success:true, student:{id:"...", studentId:"AE-2025000123", mode:"CREATED"}, document:{...} }
```

### B. Same email again → reuse `LINKED`, no duplicate
```bash
curl -X POST ... -F name="Rahim Uddin" -F email="rahim@example.com" -F file=@ielts.pdf -F documentType="ielts_certificate"
# → { studentId:"AE-2025000123", mode:"LINKED" }
```

### C. Full application in one call (from FullApp)
```bash
curl -X POST http://127.0.0.1:3000/api/documents/auto-upload \
  -F file=@transcript.pdf -F name="Rahim Uddin" -F email="rahim@example.com" \
  -F documentType="academic_transcript" \
  -F fullApplication=true -F universityName="University of Manchester" -F courseName="MSc Data Science" -F country="United Kingdom" -F intake="2026-09"
# → { student:{AE-...}, document:{...}, application:{id:"...", stage:"APPLICATION_DRAFT"} }
```

### D. Existing student by ID → only document + application
```bash
curl -X POST ... -F studentId="AE-2025000123" -F file=@sop.pdf -F documentType="sop" -F fullApplication=true -F universityName="..." -F courseName="..."
```

### E. Counselor on-behalf (JSON, also auto-creates)
```bash
curl -X POST http://127.0.0.1:3000/api/counselor/documents/upload-on-behalf \
  -H "Authorization: Bearer $COUNSELOR_TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"newlead@example.com","name":"New Lead","documentType":"bank_statement","fileName":"bank.pdf","fileUrl":"/api/employee-access/secure-download?filePath=...","fullApplication":true,"universityName":"University of Leeds","courseName":"MBA"}'
```

## Contract (verified real)

- `GET /api/documents/auto-upload` returns field docs (no auth needed to read docs).
- Every write is `db.*.create` + `TimelineEvent` + `PortalAuditLog` — never `mock` array.
- File URL is signed (`/api/employee-access/secure-download?filePath=&expires=&signature=`), not `/uploads/documents/...`.
- `npm run test tests/unit/auto-upload.test.ts` → **6 passed** (canonical regex, branch logic, file guard, route presence).
- `npx tsc --skipLibCheck` introduces **0 new errors** for this route.

## Portal integration

- **Student portal** (`/student/documents` view) — call `POST /api/documents/auto-upload` with `file` + `documentType`; studentId auto-resolved from session if present, else email+name from profile.
- **Counselor** (`/counselor/documents/upload-on-behalf`) — now accepts `email+name` without prior studentId; UI can offer "New Student + Upload" in one step.
- **Partner CRM / Admin import** — same endpoint for lead ingestion (`/api/crm/data/dashboard` already real; now docs also auto-link).
- **Frontend CTA:** when `POST` returns `mode:"CREATED"` show `AE-...` toast + "View Student 360" link; when `application` present show "Application draft created" CTA.

## Security (from final audit)

- Auth optional but audited; `x-acting-as-user` still requires `super_admin` (see `SECURITY_AUDIT_FINAL_REPORT.md` SEC-03).
- File validated before student creation (no orphan student on invalid file).
- Storage fail-closed in prod, `timingSafeEqual` for signatures, `PortalAuditLog` always written.
- Rate-limit via portal's existing `x-forwarded-for` first-IP guard; add Redis `INCR` for public lead spam (TODO).

## Rollback

Remove file `src/app/api/documents/auto-upload/route.ts` and revert `src/app/api/counselor/documents/upload-on-behalf/route.ts` (git diff shows added `email+name` block). No migration needed.
