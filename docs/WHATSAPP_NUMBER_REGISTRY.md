# ALO official WhatsApp number registry — configuration, not verification

Date: 2026-11-03 · Branch: `arena/300b1e7d-alo-web-crm-tech`

## 1. What was added

`database/seed_alo_whatsapp_numbers.sql` inserts the 20 number records requested
for ALO into the **existing** `WhatsAppOfficialNumber` table (the same table used
by `src/app/api/whatsapp/numbers/route.ts` and the Super Admin registry page
`/admin/whatsapp-numbers`). No parallel table was created.

| Numbers | `ownerType` | Flags | Requested role |
| --- | --- | --- | --- |
| `01805020100` | `ALO_MAIN` | default, complaint, follow-up | Main/complaint/default automation and follow-up sender |
| `01805020101` | `COO` | `isSupport247` | COO contact / requested 24/7 urgent support |
| `01805020102`–`01805020119` | `EMPLOYEE` | none | 18 unassigned employee-pool slots |

Normalized form: `880` + digits after the leading `0`, e.g. `8801805020100`.

**Every row is inserted as `connectionStatus = 'disconnected'` with blank
`metaPhoneNumberId` and `metaBusinessAccountId`.** These records are ALO's
requested configuration. They do **not** prove number ownership, Meta WhatsApp
Business Platform registration, approved templates, or Cloud API connectivity.
No access token is stored in SQL, source, or the browser; the Super Admin UI
masks `phone_number_id`.

## 2. Idempotency and preservation of configured values

The seed uses `INSERT … ON DUPLICATE KEY UPDATE` on the unique `phoneNumber` /
`normalizedPhone` keys. On a repeated deployment the update clause only fills
an **empty** `displayName` or `purpose`; it deliberately does not assign any
value to `metaPhoneNumberId`, `metaBusinessAccountId`, `connectionStatus`,
`employeeOwnerId`, `employeeOwnerName`, `branch`, `department`, `activeStatus`
or any sender flag. A valid Meta identifier or an employee assignment already
configured by an administrator is therefore never overwritten with a blank
default. There are no `DROP`, `TRUNCATE` or `DELETE` statements.

Run locally / on staging **after a database backup**:

```bash
node scripts/seed-alo-whatsapp-numbers.mjs --check   # validates SQL, no DB connection
node scripts/seed-alo-whatsapp-numbers.mjs           # applies the idempotent upsert
```

The runner reads `DATABASE_URL` from the protected environment, wraps the write
in a transaction, rolls back on error, and prints only counts — never the URL,
password, or any token. Verification coverage:
`tests/unit/alo-whatsapp-number-seed.test.ts` (7 tests) and the `--check` mode.

## 3. Runtime configuration (separate from the registry)

The following belong in the protected deployment environment (`.env.example`
contains placeholders only). They control what the application is **allowed**
to use; they are not proof of ownership either:

- `ALO_MAIN_WHATSAPP_NUMBER`
- `ALO_COO_WHATSAPP_NUMBER`
- `ALO_EMPLOYEE_WHATSAPP_NUMBERS` (comma-separated, optional)
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_APP_SECRET`,
  `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_GRAPH_VERSION` (`v23.0` in `.env.example`)

Sending is permitted only for a registered number with a configured and
verified Meta `phone_number_id` and credentials. The default / complaint /
follow-up sender is `01805020100`; urgent support shares `01805020101` when
appropriate. An employee-specific sender is used only when that number is
connected and authorized; otherwise the application falls back to an
authorized main sender and records both the business sender and the initiating
employee in the CRM audit trail. WhatsApp Web automation and sender spoofing
are not used.

## 4. Meta webhook and Cloud API configuration (still required)

- **Webhook URL (production):** `https://<production-host>/api/whatsapp/webhook`
  - `GET` verifies `hub.mode`, `hub.verify_token` and returns `hub.challenge`.
  - `POST` verifies the Meta signature, parses message/status events, deduplicates
    provider/event IDs and returns 200 promptly.
  - Compatibility alias for older deployments:
    `/api/crm/ucc/webhooks/whatsapp` (delegates to the canonical handler; it does
    **not** bypass signature verification).
- Configure the same `WHATSAPP_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET` in Meta
  and in the protected environment. Register each number's `phone_number_id`
  under the correct WABA, submit and get templates approved, then mark the row
  `connected` only after a real connection check succeeds.
- The Graph API version is configurable via `WHATSAPP_GRAPH_VERSION`; the
  existing `src/lib/whatsapp-cloud-api.ts` and
  `src/lib/whatsapp-config.ts` resolve the version and credentials server-side.

## 5. Scheduled workers (inspected, not assumed)

The real scheduler is `src/app/api/cron/[job]/route.ts` →
`requireCron()` (`ALO_CRON_SECRET` / `CRON_SECRET`, ≥16 chars, or an authorized
admin session) → `handleAuthorizedCronRequest()` →
`src/lib/cron/job-registry.ts`. `vercel.json` declares the production schedules;
legacy static paths such as `/api/cron/followup`, `/api/cron/sla-monitor` and
`/api/cron/retry` delegate to the same lease-protected runner and write
`CronJobLog` rows.

Relevant registry keys: `whatsapp-followups` (default days 3/7/14/21/25/30),
`failed-message-retry`, `sla-monitoring`, `email-queue`, `webhook-dispatch`,
`ai-document-processing`, `expired-portal-invitation-cleanup`.

**Do not** assume an old cPanel cron path; use the URLs above and the deployment
platform's scheduler. On cPanel, point the cron command at the same HTTPS
endpoint with the `Authorization: Bearer $ALO_CRON_SECRET` header.

## 6. Route mapping (no duplicate UI)

Spec-named WhatsApp URLs are aliases in `next.config.ts` to existing real pages:

| Requested URL | Existing implementation |
| --- | --- |
| `/crm/whatsapp` | existing WhatsApp command center (canonical) |
| `/crm/whatsapp/inbox` | `/crm/whatsapp` |
| `/crm/whatsapp/conversations/[id]` | `/crm/ucc?conversation=<id>` (see limitation below) |
| `/crm/whatsapp/numbers` | `/admin/whatsapp-numbers` |
| `/crm/whatsapp/templates` | `/crm/communications/templates` |
| `/crm/whatsapp/routing` | `/crm/whatsapp` (no standalone routing UI exists; the routing API is `/api/whatsapp/routing`) |
| `/crm/whatsapp/sla` | `/crm/sla` |
| `/crm/whatsapp/analytics` | `/admin/whatsapp-analytics` |
| `/crm/whatsapp/settings` | `/crm/communications/settings` |

**Limitations (not implemented, not claimed):** the existing UCC inbox does not
consume the `conversation` query parameter, so `/crm/whatsapp/conversations/[id]`
opens the shared inbox rather than deep-linking one thread. There is no
standalone routing-rule configuration page; routing rules exist as an API only.
Neither alias is a new feature — both are documented compatibility mappings.

## 7. Verification state

- Seed SQL validated by `--check` and unit tests: **PASS**.
- Seed applied to a live database: **NOT TESTED** (no `DATABASE_URL` in this
  workspace; migration/seed must be run on staging after a backup).
- Number ownership, Meta registration, template approval, Cloud API delivery,
  live webhook receipt: **BLOCKED** — missing credentials and external provider
  setup. No live integration was tested or claimed connected.
