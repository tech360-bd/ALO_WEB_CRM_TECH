# WHATSAPP-AUTOMATION-REPORT — ALO Education

Snapshot: **2026-10-18**, branch `arena/ef31f574-alo-web-crm-tech`

> **No live WhatsApp call was made.** Outbound network in this environment is
> allow-listed to `github.com`, `npmjs.org` and `pypi.org`; `graph.facebook.com`
> is unreachable and no `WHATSAPP_TOKEN` was supplied. Everything below describes
> **code state**, verified by reading source and running tests.

---

## 1. Endpoints

| Method | Path | File | Purpose |
|---|---|---|---|
| `GET` | `/api/whatsapp/webhook` | `src/app/api/whatsapp/webhook/route.ts` | Meta subscription verification |
| `POST` | `/api/whatsapp/webhook` | same | Inbound messages and delivery statuses |
| `POST` | `/api/whatsapp/send` | `src/app/api/whatsapp/send/route.ts` | Outbound text |
| `GET/POST` | `/api/whatsapp/numbers` | `src/app/api/whatsapp/numbers/route.ts` | Number pool admin |
| `GET/POST` | `/api/whatsapp/routing` | `src/app/api/whatsapp/routing/route.ts` | Inbound routing rules |
| `GET` | `/api/whatsapp/analytics` | `src/app/api/whatsapp/analytics/route.ts` | Daily rollups |
| `GET/POST` | `/api/whatsapp/contacts` | `src/app/api/whatsapp/contacts/route.ts` | Contact records |
| `POST` | `/api/whatsapp/document-upload` | `src/app/api/whatsapp/document-upload/route.ts` | Attachment handling |
| `GET/POST` | `/api/whatsapp/ai-intent`, `/ai-reply` | `src/app/api/whatsapp/ai-*/route.ts` | AI intent + draft replies |
| `GET/POST` | `/api/whatsapp/followup/schedules`, `/templates` | `src/app/api/whatsapp/followup/**` | Follow-up engine |
| `POST` | `/api/whatsapp/portal-invitations` | `src/app/api/whatsapp/portal-invitations/route.ts` | Portal invite delivery |
| `GET` | `/api/whatsapp/status` | `src/app/api/whatsapp/status/route.ts` | Health |
| `POST` | `/api/crm/ucc/webhooks/whatsapp` | `src/app/api/crm/ucc/webhooks/whatsapp/route.ts` | CRM-side inbound (intent/priority) |
| `POST` | `/api/integrations/3cx/whatsapp/journal` | `src/app/api/integrations/3cx/whatsapp/journal/route.ts` | 3CX WhatsApp journal |

UI: `src/app/crm/whatsapp`, `src/app/counselor/whatsapp`,
`src/app/admin/whatsapp-analytics`, `src/app/admin/whatsapp-followup`,
`src/app/admin/whatsapp-numbers`, plus
`src/components/communication/WhatsAppCommandCenter.tsx` and
`src/components/alo/views/whatsapp-command-center.tsx`.

---

## 2. Webhook security

`verifySignature()` in `src/app/api/whatsapp/webhook/route.ts`:

```ts
const appSecret = process.env.WHATSAPP_APP_SECRET;
if (!appSecret) {
  if (process.env.NODE_ENV === 'production') { /* log + */ return false; }
  console.warn("... accepting unsigned requests only in non-production mode");
  return true;
}
const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
return safeEqual(expected, signature);
```

| Property | State |
|---|---|
| HMAC-SHA256 over the raw body | Yes |
| Constant-time comparison | Yes — `crypto.timingSafeEqual` via `safeEqual()` |
| **Unsigned requests rejected in production** | Yes — returns `false`, request refused |
| Unsigned tolerated in development | Yes, with a console warning |
| Replay protection | Yes — `WebhookEvent` has `@@unique([provider, eventId])`, driven by `deriveWebhookEventId()` in `src/lib/communications/webhook-idempotency.ts` |

`src/lib/whatsapp-webhook-handler.ts` additionally exports a strict variant,
`verifySignatureStrict()`, that returns a reason rather than a boolean
(`WHATSAPP_APP_SECRET is not configured — rejected`, `Signature missing`,
`Signature mismatch — rejected`) for callers that need to distinguish `403` from
`503`.

---

## 3. Inbound processing

`extractMessageContent()` handles **10** message types:

`text`, `image`, `document`, `audio`, `video`, `location`, `contacts`,
`interactive` (button_reply / list_reply), `button`, plus a default branch.

Then, in order:

1. **Phone normalisation** — `normalizeBdPhone()` from
   `src/lib/whatsapp-number-pool.ts` canonicalises Bangladeshi numbers to `880…`
   without a `+`. `normalizePhoneE164()` is retained for CRM callers expecting
   `+880…`.
2. **Sender number resolution** — `determineSenderNumber()` against
   `MAIN_NUMBER` / `COO_NUMBER` / `OFFICIAL_NUMBERS`.
3. **Language, intent, sentiment** — `detectLanguage()`, `detectIntent()`,
   `detectSentiment()` from `src/lib/ai-whatsapp-engine.ts`.
4. **CRM intent + priority** — `classifyIntent()` (8 regex intents:
   `DOCUMENT_REQUIREMENT`, `PAYMENT_QUESTION`, `VISA_QUESTION`,
   `APPLICATION_QUESTION`, `TEST_PREPARATION`, `URGENT`, `APPOINTMENT`,
   `GENERAL`) and `detectPriority()`.
5. **Lead score** — `calculateLeadScore()`.
6. **Identity resolution** — `resolveContactIdentity()` and
   `shouldAutoCreateLead()` from `src/lib/communications/contact-identity.ts`,
   then `createLeadWithReference()` from `src/lib/lead-reference.ts`.
7. **SLA** — `startSlaForThread()`, `calculateSlaDueAt()` from
   `src/lib/sla-engine.ts`.
8. **Student intake agent** — `handleIntakeMessage()` from
   `src/lib/ai-agents/student-intake-agent.ts`.
9. **Commands** — `handleStopStartCommand()` for STOP/START consent.

---

## 4. WhatsApp → Student ID

**This is the change made in this branch.** The webhook's own comment states the
prior contract:

> *"student IDs are generated only by the reviewed student-creation workflow."*

So the webhook creates **leads**, and Student IDs are minted when a lead is
confirmed. The minting path was broken. See `CURRENT-STATE-AUDIT.md` **F-01**.

### Before

```ts
// src/app/api/crm/leads/counselling/route.ts
const seq = (await tx.student.count({ where: { studentId: { startsWith: `AE-${year}` } } })) + 1;
const studentCode = `AE-${year}${String(seq).padStart(6, '0')}`;
```

`COUNT(*) + 1` inside a transaction gives every concurrent writer the same
number, and the 6-digit format matched no other writer.

### After

```ts
const lockKey = studentLockKey(email, phone);
const lockHeld = await acquireStudentCreateLock(tx, lockKey);
try {
  const existingStudent = await tx.student.findFirst({ where: { OR: [{ email }, { phone }] }, ... });
  if (!existingStudent) {
    const studentCode = await allocateIdentifier(tx, 'AE');   // AE-202600001
    ...
  }
} finally {
  if (lockHeld) await releaseStudentCreateLock(tx, lockKey);
}
```

Two independent guarantees:

**(a) Identifier uniqueness** — `allocateIdentifier()` in
`src/lib/identity/student-id.ts`:

```sql
INSERT INTO StudentIdSequence (id, scope, year, lastValue, updatedAt)
VALUES (?, ?, ?, 0, NOW(3)) ON DUPLICATE KEY UPDATE id = id;

UPDATE StudentIdSequence
SET lastValue = LAST_INSERT_ID(lastValue + 1), updatedAt = NOW(3)
WHERE id = ?;

SELECT LAST_INSERT_ID() AS value;
```

The row lock is held for the transaction, and `LAST_INSERT_ID(expr)` is
**per-connection**, so no two transactions can read the same number. Rollback
releases the number before it is ever visible; committed numbers are never
reused. Gaps are possible and acceptable — reuse is not.

Format: `<SCOPE>-<YEAR><5-digit>`, scopes `AE` (student), `AEP` (partner),
`EMP` (employee). Year is the **Asia/Dhaka** business year, not the server's
local zone. Overflow past `99999` fails closed.

**(b) Row uniqueness** — `Student.email` and `Student.phone` have **no unique
index** (both `String @default("")`, and an empty-string default is shared by
every student created without that field, so a unique index is impossible without
a data migration). `src/lib/identity/student-create-lock.ts` therefore serialises
the find-or-create on a MySQL `GET_LOCK()` advisory lock:

- lock name is `alo:student:create:<32 hex chars of SHA-256(email|phone)>` —
  **PII never appears** in `performance_schema` lock tables or the processlist
- `GET_LOCK` returns `1` = acquired, `0` = timed out, `NULL` = error; **NULL is
  not coerced to 0**, so a server-side failure is reported as an error rather
  than mislabelled as contention (this was a bug found and fixed during testing)
- the sqlite verification driver (`ALO_DB_DRIVER=sqlite`, offline-only) has no
  `GET_LOCK`, so the helper is a documented no-op there

A unique index remains the durable fix. It was **not** added: that is a
destructive migration against a table that may already contain duplicates, which
requires a verified backup and explicit approval.

---

## 5. Media ingestion

`src/lib/whatsapp-inbound-media.ts` (`downloadWhatsAppInboundMedia`) and
`src/lib/whatsapp-media-ingestion.ts` fetch media by `mediaId` using
`WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`, then hand the bytes to
`storePrivateFile()`.

Inbound attachments are now screened by `scanForMalware()` before storage — see
`DOCUMENT-STORAGE-ARCHITECTURE.md` §3. Classification is by filename
(`classifyWhatsAppDocument()`: `PASSPORT`, `TRANSCRIPT`, `ACADEMIC_CERT`,
`BANK_STATEMENT`, `ENGLISH_TEST`, `VISA_DOC`, `OFFER_LETTER`, `CAS_COE_I20`,
`PAYMENT_RECEIPT`, `CV`, `SOP`, `OTHER`).

> Filename-based classification is a convenience signal, **not** a security
> control. The MIME magic-byte check and the malware gate are.

---

## 6. Outbound, follow-ups, retries

| Capability | Implementation | Model |
|---|---|---|
| Template + follow-up sequences | `src/lib/whatsapp-followup-engine.ts`; cron `whatsapp-followups` (every 5 min, Asia/Dhaka) | `WhatsAppFollowUpSchedule`, `WhatsAppFollowUpTemplate` |
| Day 3/7/14/21/25/30 cadence | Honours STOP/opt-out, template approval and active applications | — |
| Failed-send retry | cron `failed-message-retry` (every 5 min), **max 3 attempts** then marked failed | `WhatsAppRetryQueue` |
| Delivery statuses | `mapProviderStatus()`, `shouldApplyStatus()` | `WhatsAppMessageStatus`, `WhatsAppMessageArchive` |
| Number-pool audit | — | `WhatsAppOfficialNumber`, `WhatsAppNumberAssignmentAudit` |
| SLA escalation | cron `sla-monitoring` (every minute) | `CommunicationSlaIncident`, `SlaIncidentCounter` |

---

## 7. Configuration variables (names only — no values)

| Variable | Role |
|---|---|
| `WHATSAPP_APP_SECRET` | Webhook HMAC signing. **Required in production** |
| `WHATSAPP_VERIFY_TOKEN` | Subscription challenge |
| `WHATSAPP_TOKEN` / `WHATSAPP_ACCESS_TOKEN` | Graph API bearer |
| `WHATSAPP_PHONE_NUMBER_ID` | Sending number |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA |
| `WHATSAPP_BUSINESS_PHONE` | Display number |
| `WHATSAPP_API_KEY` | Provider key |
| `WHATSAPP_GRAPH_VERSION` | Declared but **not used** by the call sites (see §9) |
| `ALO_MAIN_WHATSAPP_NUMBER`, `ALO_COO_WHATSAPP_NUMBER`, `ALO_FOLLOWUP_WHATSAPP_NUMBER`, `ALO_COMPLAINT_WHATSAPP_NUMBER`, `ALO_EMPLOYEE_WHATSAPP_START/END` | Number pool |
| `CLAMAV_HOST`, `CLAMAV_PORT` | Attachment malware scanning (new) |

---

## 8. Test results

`tests/unit/whatsapp-student-journey.test.ts` — **13 tests, all green.** It
exercises the real production modules end to end:

| Stage | Module exercised |
|---|---|
| Inbound parsing | `normalizeBdPhone`, `classifyIntent`, `detectPriority` |
| Student ID | `allocateIdentifier` |
| Malware gate | `scanForMalware` |
| Private storage | `storePrivateFile`, `readPrivateFile`, `removePrivateFile` |
| Counsellor review | `evaluateDocumentTransition`, `legacyStatusToState` |

Asserted, among others:

- `01712345678` → `8801712345678`
- `"submit your passport and bank statement"` → `DOCUMENT_REQUIREMENT` / `high`
- 25 concurrent allocations → **25 distinct IDs**, `AE-202600001`…`AE-202600025`,
  all matching `^AE-\d{4}\d{5}$`
- a rolled-back transaction releases its number (next allocation is `…00001`)
- an EICAR-bearing "PDF" is rejected and leaves **zero** files and **zero**
  `.tmp` residue in the pool
- a student cannot self-verify; a partner cannot verify; deletion is refused
- rejection without a `reasonCode` is refused
- full journey: inbound → Student ID → scanned private storage → counsellor
  verification, with bytes intact at the end

`tests/unit/student-id-allocation.test.ts` (pre-existing, 8 tests) covers format,
Dhaka business year, per-year reset, scope isolation, exhaustion and rollback.

`tests/integration/whatsapp-student-journey.test.ts` — **new, 3 tests, SKIPPED
locally.** It is the only place real row-lock concurrency is proved: 20
transactions racing on one `StudentIdSequence` row must yield 20 distinct,
contiguous numbers, and `GET_LOCK` must genuinely exclude a second holder. It
self-skips without `TEST_DATABASE_URL` and runs in CI against the `mysql:8.4`
service.

> **A harness bug was found and fixed while writing this test.** The first
> version modelled `LAST_INSERT_ID()` as a shared variable; 25 concurrent
> allocations then all read the final value and the uniqueness assertion failed
> with `expected 1 to be 25`. MySQL makes `LAST_INSERT_ID` **per-connection**, so
> the fake was wrong, not the allocator. The harness now keeps it on the
> transaction. Recording this because the failure looked like a production defect
> and was not.

---

## 9. Open items

| # | Item | Severity |
|---|---|---|
| W-1 | `src/app/api/whatsapp/webhook/route.ts` carries `// @ts-nocheck` (1,077 lines). The `tsc` pass does **not** cover it | **HIGH** |
| W-2 | Three Graph API versions in use: `v18.0` (webhook route), `v20.0` (consolidated handler), `v19.0` (`SocialIntegration.apiVersion` default). `WHATSAPP_GRAPH_VERSION` is declared but unused | MED |
| W-3 | Two webhook entry points (`/api/whatsapp/webhook` and `/api/crm/ucc/webhooks/whatsapp`) with overlapping responsibilities; consolidation was attempted on 2026-09-14 and both remain | MED |
| W-4 | Malware-scan verdict not persisted | MED |
| W-5 | No ClamAV daemon deployed | **HIGH** (blocks production) |
| W-6 | No live end-to-end verification against Meta's sandbox | Blocked — needs credentials |

---

## 10. Deployment status

**NOT DEPLOYED.** This branch has not been merged, and no deployment was
performed. `.github/workflows/deploy-production.yml` is a refusal notice, not a
deployment mechanism — GitHub Actions owns CI only and Hostinger owns production.

Before this branch can go to production:

1. Provision a ClamAV daemon and set `CLAMAV_HOST` / `CLAMAV_PORT`. **Without
   this, production rejects every document upload by design.**
2. Run `tests/integration/**` against a disposable MySQL (CI does this).
3. Verify a verified backup exists and rollback is rehearsed.
4. Register the webhook URL and set `WHATSAPP_APP_SECRET` in the production
   environment.
