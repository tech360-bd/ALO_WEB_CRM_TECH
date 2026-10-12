# Document Security — ALO Education (Phase 6)

**Private storage, never `public/uploads`, never GitHub.**

## Storage

`STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` (outside `public/`, outside `build/`). Randomized object names (uuid + ext), metadata in DB: `StudentDocument` (studentId, caseId, category, fileName, fileUrl, status, version, reviewerNote), `Document` + `DocumentVersion` + `DocumentAudit` + `DocumentSecurityIncident`. Categories: passport, bank_statement, academic_certificate, visa_document, etc. Max 10M via `nginx.conf` `client_max_body_size 10M`, type validation `file-validator.ts` (allowlist pdf/jpg/png), size check server-side.

## Upload

`POST /api/visa/documents` + `POST /api/whatsapp/document-upload` — auth `authenticateRequest`, check `StudentDocument` association, validate size/type, write to `STORAGE_POOL_C/<studentId>/<uuid>.<ext>`, create `DocumentAudit` + `aloAuditLog`. Keep actual bytes out of GitHub (`.gitignore` `*.pdf` etc not needed — storage is outside repo).

## Download — Signed URLs + Access Control

`GET /api/employee-access/secure-download?filePath=&documentId=&signature=&expires=` — SEC-02:

- `FILE_SIGN_SECRET` ≥32 chars (`openssl rand -base64 48`), fail-closed `throw` in prod if missing/short.
- `verifySignedUrl` uses `crypto.timingSafeEqual` + `NaN` guard + expiry capped 60m.
- `POST /api/employee-access/secure-download` generates `signedUrl` with HMAC `filePath:expires`.
- Permission: `employeeDocumentId` → self or `hr_manager|super_admin`; `documentId` → `counselor|senior_counselor|application_team|super_admin`; else 403.
- Audit: `logDocumentAccess` + `aloAuditLog` + `EmployeeAuditLog`.

## Sharing

`src/lib/document-security.ts` `checkDocumentSharingAllowed` — allowed `student_verified|university_official|partner_official|alo_official|authorized_employee|application_recipient`; block `external` critical, `PARTNER_ONLY_MODE` restricts counselor bypass, create `DocumentSecurityIncident` + `DashboardAlarm` + `PortalNotification` for high/critical.

## Backup & Recovery

- Storage: `rsync -a /home/aloeduca/alo-education/storage/ /root/backups/storage-$(date +%F)/` daily via cron `0 2 * * *` (see `cron-definitions` backupDatabase).
- DB: `mysqldump ... | gzip > /root/backups/alo-$(date +%F).sql.gz` rotate 7 days, verify SHA256.
- Restore: decrypt if encrypted, `mysql < dump`, `rsync` back, re-generate signed URLs (old expire).

## Malware Scan

Hook `ClamAV` via `clamdscan --fdpass $file` in upload handler (optional, if `clamd` available on VPS). Log incident if infected, block 422.

## Audit

- `FILE_SIGN_SECRET` never committed (`.env.example` placeholder), rotation requires re-issue signed URLs (old expire, no re-encrypt).
- `ENCRYPTION_KEY` rotation requires re-encrypt tokens.
- Check: `GET /api/employee-access/secure-download?filePath=...` without signature → permission check, with bad signature → 403, expired → 403, valid → 200 + audit.

See `PHASE1_FULL_AUDIT_20260915.md` SEC-02 and `tests/unit/security-hardening.test.ts` FILE_SIGN_SECRET hardening.
