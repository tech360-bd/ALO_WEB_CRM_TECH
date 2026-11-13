# DOCUMENT-STORAGE-ARCHITECTURE — ALO Education

Snapshot: **2026-10-18**, branch `arena/ef31f574-alo-web-crm-tech`

Scope: how student documents are received, screened, stored, accessed, reviewed
and audited. Student documents are passports, transcripts and bank statements —
the highest-sensitivity data in this system.

---

## 1. Design rule

**No document is ever web-served.** `src/lib/storage/private-file-store.ts`
enforces this structurally rather than by convention:

1. `storageRoot()` reads `STORAGE_POOL_C`. In production it **must** be an
   absolute, persistent path or the call throws. Outside production it falls back
   to `os.tmpdir()/alo-education-private-documents`.
2. `validatedStorageRoot()` resolves symlinks with `realpath` and then **rejects
   any root that overlaps a web root** — it checks `public`, `public_html` and
   `.next`, in both the configured and the canonicalised form, in both
   containment directions.
3. The directory is created `mode 0o700`.
4. After creation it re-checks `realpath(root) !== root` to detect a substituted
   root between validation and use.
5. Stored names are generated UUIDs plus a sanitised extension —
   **never** the uploader's filename. `safeStoredName()` rejects anything that is
   not a bare basename, or that contains `..`, `/`, `\` or NUL.
6. Writes go to `.<name>.tmp` opened `wx` (exclusive) at `0o600`, are `fsync`'d,
   then atomically `rename`d into place. A failed write removes the temp file.
7. Reads open with `O_NOFOLLOW | O_NONBLOCK` and `stat()` the descriptor before
   reading, so a symlink swapped in after the path check cannot be followed and a
   FIFO cannot block the process.

The source comments are candid about the limit of this: *"The mount and its
ancestors must remain operator-owned: this is not protection against a privileged
concurrent mount replacement."*

---

## 2. Ingestion paths

| Endpoint | File | Caller |
|---|---|---|
| `POST /api/crm/ucc/documents/upload` | `src/app/api/crm/ucc/documents/upload/route.ts` | Counsellor / staff, UCC conversation scope |
| `POST /api/documents` | `src/app/api/documents/route.ts` | Staff on behalf of a student (students and partners are refused) |
| `POST /api/marketing/whatsapp-doc-upload` | re-export of the UCC route | Staff compatibility endpoint |
| `POST /api/counselor/documents/upload-on-behalf` | `src/app/api/counselor/documents/upload-on-behalf/route.ts` | Counsellor |
| WhatsApp media | `src/lib/whatsapp-inbound-media.ts` → `storePrivateFile` | Webhook |

### Pipeline, in order

```
1. Authenticate                      authenticateRequest / authenticateUnified
2. Authorize scope                   canUseUccDocuments, canAccessUccDocumentConversation,
                                     canViewUccB2B, verifyApplicationLink
3. Size gate                         MAX_FILE_BYTES = 20 MB (+128 KB content-length headroom)
4. Read bytes                        Buffer.from(await file.arrayBuffer())
5. Type gate                         detectMime() magic bytes must match the extension
                                     AND the declared Content-Type
6. MALWARE GATE   ← added this branch scanForMalware()  (see §3)
7. Hash                              SHA-256 over the bytes
8. Idempotency                       unsent-attachment lookup by fileHash
9. Store                             storePrivateFile() → private pool
10. Persist + audit                  $transaction: row + TimelineEvent + AuditLog
11. Rollback on failure              removePrivateFile() if the transaction throws
```

Steps 5–9 are the security core. The malware gate is deliberately placed **after**
type validation and **before** `storePrivateFile`, so rejected bytes never reach
disk and never reach a counsellor's download route.

### B2B confidentiality

If the student has any application with `isB2bConfidential: true`, the upload
requires `canViewUccB2B(auth)` **and** an explicit `applicationId`. This prevents
a confidential B2B case's documents from being attached to a general
conversation.

---

## 3. Malware scanning (new in this branch)

**File:** `src/lib/documents/malware-scan.ts`

Before this branch there was **no** antivirus capability anywhere in the
repository — a search for `clamav|virus|malware|EICAR` across `src/`, `scripts/`
and `.github/` matched only two files of legal prose
(`public-cookie.tsx`, `public-terms.tsx`).

### Two layers

**Layer 1 — built-in signatures (always runs, zero dependencies).** Decodes bytes
as `latin1` (1:1 byte→code point, so binary needles survive; `utf8` would corrupt
them) and scans the first 10 MB:

| Signature name | Detects |
|---|---|
| `EICAR-Test-File` | The EICAR Standard Anti-Virus Test File |
| `Executable.MZ-Header` | Windows PE (`MZ\x90\x00`) |
| `Executable.ELF-Header` | Linux ELF (`\x7fELF`) |
| `Script.PowerShell-EncodedCommand` | `powershell -enc` |
| `Script.PowerShell-DownloadString` | `Net.WebClient).DownloadString` |
| `Macro.AutoOpen-Downloader` | `AutoOpen` |

This list is deliberately short and high-confidence. Every entry is an executable
or script marker that cannot legitimately appear in a PDF or a scanned passport
image; false positives would block real applications. **Breadth is traded for
precision on purpose** — coverage is ClamAV's job.

**Layer 2 — ClamAV `clamd` INSTREAM (when `CLAMAV_HOST` is set).** Speaks the real
protocol: `zINSTREAM\0`, then 4-byte big-endian length-prefixed chunks of 64 KB,
then a zero-length terminator. Bytes are streamed, so they never touch the
scanner's filesystem. Reply parsing distinguishes three outcomes:

| clamd reply | Interpretation |
|---|---|
| `OK` | clean |
| `... FOUND` | infected; the signature name is returned |
| anything else (e.g. `INSTREAM size limit exceeded. ERROR`) | **infrastructure failure**, not a verdict |

That third case matters: treating a size-limit error as "clean" would silently
wave through large malicious files.

### Verdicts and policy

`scanForMalware()` returns `{ verdict, threat, engine, scanned, detail }` where
`verdict ∈ {clean, infected, unavailable}`. It **throws
`MalwareScanUnavailableError`** only when no engine could give an opinion *and*
the policy is fail-closed.

```
scanPolicy() → NODE_ENV === 'production' ? 'fail-closed' : 'fail-open'
```

| Situation | Production | Development |
|---|---|---|
| Signature hit | reject | reject |
| clamd says OK | store | store |
| clamd says FOUND | reject | reject |
| No clamd configured | **reject** | store, verdict `unavailable` |
| clamd unreachable / errors | **reject** | store, verdict `unavailable` |

Route mapping:

| Outcome | HTTP | Body |
|---|---|---|
| infected | `400` | `{ error, threat }` |
| not scanned | `503` | `{ error: "The file could not be scanned for malware and was not stored." }` |

Rationale for `503` rather than a silent pass: storing an unscanned student
document is worse than refusing the upload, and `503` tells the client to retry
rather than to give up.

### Configuration

| Variable | Default | Production | Notes |
|---|---|---|---|
| `CLAMAV_HOST` | unset | effectively required | Presence enables layer 2 |
| `CLAMAV_PORT` | `3310` | `3310` | clamd INSTREAM port |

Both are now declared in `.env.example` and `.env.production.example`, and are
recorded in `docs/environment-classification.json` as
`REFERENCED_WITH_FALLBACK`.

> **Deployment status: BLOCKED.** The scanner code is written, unit-tested and
> wired, but **no clamd daemon exists in any environment**, and none could be
> installed from this sandbox. Until `CLAMAV_HOST` points at a running clamd:
> production will **reject all document uploads** (fail-closed, by design), and
> non-production will store with verdict `unavailable`. **Deploying this branch to
> production without clamd is a self-inflicted outage.** Provision clamd first.

### Known gap

**The scan verdict is not persisted.** The upload routes already write `AuditLog`
and `TimelineEvent` rows, but the verdict, engine and threat name are not
recorded anywhere. After the fact, the database cannot answer *"was this file
scanned, by which engine, with what result?"* Closing this needs a schema change
(a verdict column on `Document` / `UccAttachment`, or an audit row), which is out
of bounds here without a verified backup and approval.

---

## 4. Data model

```
Document                 studentId, category, name, fileName, fileType, fileSize,
                         mimeType, fileHash, storagePath, status, rejectionReason,
                         reviewedById, reviewedAt, uploadedAt
  ├─ DocumentAudit       documentId, studentId, actorId, action, previousStatus, newStatus, note
  ├─ DocumentVersion     versioned copies
  ├─ DocumentChecklist   per-application requirements
  └─ DocumentSecurityIncident
                         attemptedById/Name/Role, recipient, recipientType, action,
                         severity, status, blocked, notifiedManager, notifiedCeo

UccAttachment            conversationId, messageId, fileName, mimeType, fileSize,
                         fileUrl, detectedDocType, studentId, applicationId,
                         ocrExtractedData
PortalStudentDocument    portal-side records
EmployeeDocument         HR documents, with EmployeeDocumentVersion
OfficialDocument         issued documents
AiDocumentClassification AI classification results
OcrJob                   OCR pipeline
```

`Document.storagePath` carries an explicit comment in the schema:

> `// Security: no public URL. Stored path only, accessed via private download route with permission check.`

`UccAttachment.fileUrl` is written as `''` — the real location lives inside
`ocrExtractedData` as `{ storagePath, fileHash, uploadedBy, originalName }`.

`Document.status` lifecycle: `PENDING → UPLOADED → UNDER_REVIEW → APPROVED | REJECTED`.

---

## 5. Access control

- `src/lib/documents/document-access.ts` (18 KB) and
  `document-access-resolver.ts` — who may see which document.
- `src/lib/documents/document-rejection.ts` — rejection reason codes.
- `src/lib/ucc/document-access.ts` — conversation-scoped UCC rules.
- `src/lib/communications/document-policy.ts` — the review state machine.

### Review state machine

`evaluateDocumentTransition({ actor, from, to, reasonCode, supersedeReason })`
returns `{ allowed, code, message }`. Enforced rules:

| Rule | Code |
|---|---|
| Students never review their own documents | `REVIEW_ROLE_REQUIRED` |
| Partners cannot verify or reject | `REVIEW_ROLE_REQUIRED` |
| Only `counselor`, `admin`, `system` may verify/reject | `canActorChangeDocumentState()` |
| Rejection requires a `reasonCode` from a fixed list | `REJECTION_REASON_CODES` |
| Only `student_submitted` / `under_review` may be rejected | `NOT_REJECTABLE` |
| A verified document cannot be rejected | `VERIFIED_DOCUMENT_IMMUTABLE` |
| Deletion is never a lifecycle transition | denied outright |

Rejection reasons are a closed set: `blurry`, `incomplete`, `wrong_document`,
`expired`, `wrong_student`, `wrong_format`, `missing_page`,
`inconsistent_information`, `university_requirement_not_met`, …

### Download

`GET /api/documents/[id]/download` and
`GET /api/student-portal/documents/[id]/download` authorise per request and write
a `TimelineEvent` (`document_downloaded`) plus an `AuditLog` (`DOC_DOWNLOAD`).
There is no signed public URL for student documents.

---

## 6. Retention

| Mechanism | Status |
|---|---|
| `temp-file-cleanup` cron job | Registered, disposition `job` |
| `document-expiry-alerts` cron job | Registered, disposition `job` |
| `audit-maintenance` cron job | Registered, disposition `job` |
| Per-category retention schedule | **Not found — GAP (G-8)** |
| Right-to-erasure | `src/app/api/delete-request` exists |

There is no evidence of a policy that says *"bank statements are purged after N
months, passports after M."* For a system holding passport and financial
documents across multiple jurisdictions this should be defined by compliance, not
inferred.

---

## 7. Test coverage

`tests/unit/malware-scan.test.ts` — **14 tests**, all green:

- EICAR detected standalone and embedded in a PDF
- clean PDF and clean PNG pass
- MZ and ELF executables renamed as documents are caught
- the word "open" does not trigger the `AutoOpen` macro signature
- empty buffer handled
- production fails closed with no scanner; development reports `unavailable`
- EICAR is still rejected in production **with no scanner reachable**
- clamd `OK` → clean; `FOUND` → infected with signature name surfaced
- clamd size-limit error → **throws**, not a clean verdict
- unreachable clamd in production → `MalwareScanUnavailableError`

The clamd tests run against a purpose-built fake daemon that speaks the real
INSTREAM protocol over a local socket. **No genuine clamd was available.**

`tests/unit/whatsapp-student-journey.test.ts` additionally proves that a rejected
upload leaves **no** file and **no** `.tmp` residue in the storage pool.

---

## 8. Summary

| Control | State |
|---|---|
| Private, non-web-served storage | Implemented, structurally enforced |
| Symlink / traversal / FIFO hardening | Implemented |
| Magic-byte type validation | Implemented |
| Malware screening | **Implemented (new), daemon BLOCKED** |
| Ownership + access control | Implemented |
| Review state machine | Implemented, tested |
| Audit trail (access, download, review) | Implemented |
| Scan-verdict audit | **Missing** |
| Retention schedule | **Partial / undefined** |
