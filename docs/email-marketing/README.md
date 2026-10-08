# Email marketing (Milestone 1)

Status: **build in progress, not production-ready.** Sending is OFF by default.
Read the verification table before enabling anything.

## What it does

- Drafts a campaign with a consent attestation. Nothing is sent when a draft is created.
- Queues a campaign only after the operator types the exact recipient count and subject.
- Sends from a database outbox through a cron-triggered worker, in batches, under configured caps.
- Honours unsubscribe (signed link, RFC 8058 one-click) and a suppression list, checked at enqueue **and** at send time.
- Pauses a campaign with a visible reason when a cap is reached, or when SMTP rejects our login. It never upgrades a plan or raises a cap by itself.
- Test mode: only the addresses in `EMAIL_TEST_RECIPIENTS` can receive mail.
- CRM broadcasts with channel `email` queue into the same outbox. WhatsApp and SMS broadcasts now **refuse** to send (`CHANNEL_NOT_CONNECTED`) instead of recording fake "sent" rows.

It is built on the existing Next.js 16 / Prisma / MySQL app. There is no new paid service and no new npm dependency (`smtp-mailer` is the nodemailer alias the repo already had).

## Safe defaults and switches

| Variable | Default | Meaning |
|---|---|---|
| `EMAIL_SENDING_ENABLED` | `false` | Master switch. The worker does nothing unless `true`. |
| `EMAIL_TEST_MODE` | `true` | Only `EMAIL_TEST_RECIPIENTS` can receive mail. |
| `EMAIL_TEST_RECIPIENTS` | empty | Comma-separated allowlist for test mode. |
| `EMAIL_HOURLY_CAP` | `50` | Configured ceiling on SMTP attempts per rolling hour. **Not a provider limit.** |
| `EMAIL_DAILY_CAP` | `300` | Configured ceiling on SMTP attempts per rolling 24 hours. **Not a provider limit.** |
| `EMAIL_BATCH_SIZE` | `20` | Items per worker run. |
| `EMAIL_MAX_ATTEMPTS` | `5` | Soft-failure attempts before an item is marked failed. |
| `EMAIL_UNSUBSCRIBE_SECRET` | unset | Required before anything can be queued. At least 32 characters. |
| `EMAIL_FROM_NAME` | `ALO Education` | Display name. The address is `SMTP_FROM`. |
| `APP_URL` (or `NEXT_PUBLIC_APP_URL`) | unset | Origin for unsubscribe links. Must be `https` in production. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | existing | SMTP transport. Port 587 uses STARTTLS; 465 uses implicit TLS. |

Generate the unsubscribe secret once and store it only in the host's environment settings:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Invalid values stop the worker with `EMAIL_CONFIG_INVALID` instead of guessing.

## Hostinger (Node.js 22) setup

1. Set the variables above in the Hostinger Node.js app environment. Keep `EMAIL_SENDING_ENABLED=false` and `EMAIL_TEST_MODE=true` for the first deploy.
2. Apply the migration: `prisma/migrations/20261008040000_email_marketing_core` (`prisma migrate deploy`). It is not yet verified against MySQL.
3. Create a cron job every 5 minutes. The worker authenticates with `CRON_SECRET` (or `ALO_CRON_SECRET`, which takes priority). It must be at least 16 characters.

   ```bash
   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://YOUR-APP-HOST/api/cron/email-outbox
   ```

   Replace `YOUR-APP-HOST` with the public app host. Replace `$CRON_SECRET` with the actual value, or with the variable if the cron runner exports it.

   A no-op response is `{"success":true,"skipped":"EMAIL_SENDING_DISABLED"}`.

## Rollout checklist

1. Deploy with sending OFF and test mode ON. Put your own inbox in `EMAIL_TEST_RECIPIENTS`.
2. Create a draft to the test inbox, queue it, then set `EMAIL_SENDING_ENABLED=true`.
3. Confirm in the inbox: the message arrives, it shows an unsubscribe link, the mail client offers one-click unsubscribe, and the confirm page works.
4. Unsubscribe via the link. Confirm the address is now in the suppression list and a new draft excludes it.
5. Only then set `EMAIL_TEST_MODE=false`. Start with small caps (for example `EMAIL_HOURLY_CAP=20`) and check your SMTP provider's own limits first.

## Consent rules (default-deny)

- **CRM audiences** (broadcast with channel `email`): a recipient is eligible only with a positive `CommunicationConsent` row for channel `email` (`consentGiven = true`, `optedOutAt` null). A missing row means no consent. A default-valued `CommunicationPreference` row does **not** count as consent. Opt-out preferences and the suppression list also block.
- **Manual lists** (`POST /api/email/campaigns`): the operator must attest (`consentConfirmed: true`) and describe the basis in at least 10 characters. The attestation, the operator id, and the time are stored on the campaign. Suppression and opt-outs are still enforced.
- **Gap:** this repo has no consent-capture flow for email yet. Until positive email consent records exist, a CRM email broadcast queues **zero** recipients. That is the intended default-deny result, not a bug.

## Failures, bounces, complaints

| Outcome | Rule | Result |
|---|---|---|
| Hard bounce (550/551/553, unless the reply carries a 5.7.x policy code) | Never retried | Item `failed`, address suppressed as `hard_bounce` |
| Policy rejection (550 5.7.x) | Treated as unknown | Retried, **never** suppressed |
| Soft failure (4xx, 552, connection error) | Exponential backoff: 5, 10, 20 min ... capped at 6 h | Retried until `EMAIL_MAX_ATTEMPTS`, then `failed` |
| Auth failure (535, EAUTH) | Stops the campaign | Campaign `paused` with `SMTP_AUTH_FAILED`. Nothing is retried until resumed |
| Cap reached | Stops the campaign | Campaign `paused` with `CAP_REACHED` |
| Unsubscribe (link or one-click) | Immediate | Suppressed as `unsubscribed` |
| Spam complaints | **Not implemented.** Needs a provider feedback loop | NOT VERIFIED |
| Opens and clicks | **Not implemented** | Not tracked. Do not report them |

Delivery is **at least once**. If the process dies after SMTP accepts a message but before the row is updated, a stale-lock release after 15 minutes can send it again.

## Costs (kept separate, not "free")

- **Software:** $0 added. No new paid service, plugin, or template. The SMTP library (`smtp-mailer`, which is nodemailer 10.0.13) declares the `MIT-0` licence in its package metadata.
- **Delivery:** depends on your SMTP provider. The Hostinger mailbox SMTP limits were **not verified** in this build. Check them before raising caps.
- **Hosting:** your existing Hostinger Node.js plan. Cost not changed here, and not verified.
- **Domain:** your existing domain. Inbox placement needs SPF, DKIM, and DMARC on that domain. This change does not configure them. NOT VERIFIED.

## API

All campaign routes need a logged-in session with `marketing.email.view` (read) or `marketing.email.manage` (write). Admin and super-admin bypass permission checks. `src/proxy.ts` also limits `/api/email/campaigns` to the admin and marketing roles.

| Method and path | Purpose |
|---|---|
| `GET /api/email/campaigns` | List campaigns and the non-secret config summary (booleans and caps only) |
| `POST /api/email/campaigns` | Create a draft. Body: `name`, `subject`, `html`, `text?`, `recipients[]`, `testMode?` (default true), `consentBasis`, `consentConfirmed: true` |
| `GET /api/email/campaigns/[id]` | Campaign detail with outbox and event counts |
| `POST /api/email/campaigns/[id]/queue` | Queue a draft. Body: `recipientCount` and `subject` must match exactly |
| `POST /api/email/campaigns/[id]/status` | Body `{"action":"pause" \| "resume" \| "cancel"}` |
| `GET /api/email/unsubscribe?t=...` | Confirmation page. Changes nothing (safe for link scanners) |
| `POST /api/email/unsubscribe?t=...` | Records the unsubscribe. Used by the confirm form and by one-click clients |
| `GET or POST /api/cron/email-outbox` | Runs one worker batch. Needs `CRON_SECRET` or an admin session |

Permission keys are in the catalog (`src/lib/marketing/permissions.ts`). They are **not** yet seeded into the database role table, so non-admin marketing users may receive 403 until that is done.

## Verification (honest status)

| Area | Status | Evidence |
|---|---|---|
| Pure logic: addresses, tokens, templating, failure classes, caps, config, draft validation, worker | PASS | `tests/unit/email-marketing/` (4 files, 101 tests) |
| Worker logic against an in-memory store (send, suppression, test mode, caps, retries, auth stop, stale locks) | PASS | `tests/unit/email-marketing/worker.test.ts` |
| Consent default-deny and channel refusal in `sendBroadcast` (mocked DB) | PASS | `tests/unit/email-marketing/broadcast-send.test.ts` |
| Proxy public allowlist for the new routes | PASS | `tests/unit/email-marketing/proxy-public-routes.test.ts` |
| Full unit suite on the integrated branch (includes the remote commits merged in before push) | PASS | 102 files, 1104 tests |
| Real SMTP conversation (STARTTLS, AUTH, 550 / 451 / 550 5.7.1 / wrong password / connection refused), real worker through the real transport | PASS (local sink, not a provider) | 19 checks against a local `aiosmtpd` sink, outside the repo |
| Prisma schema validates; client generated (531 models) | PASS | `prisma validate`, `npm run db:verify-client` |
| TypeScript (`npm run typecheck`, including `db:verify-client`), full `eslint .`, env audit (`audit:env -- --check`), `prisma validate` | PASS | Run on the integrated branch |
| Migration SQL | NOT VERIFIED | Hand-written. Columns and nullability checked against the schema. Not applied to a database. Sandbox has no working Prisma schema engine |
| Campaign and outbox database behaviour (conditional claims, transactions, groupBy) | NOT VERIFIED | Needs MySQL or CI. CI is blocked by billing |
| Admin console in a browser | NOT VERIFIED | Compiles and lints. Not rendered or clicked |
| Real provider delivery and inbox placement | NOT VERIFIED | Needs a real SMTP account and a seed inbox |
| Complaints, opens, clicks | NOT VERIFIED / not implemented | Out of scope for this milestone |

## Known gaps and findings

- **Existing cron routes are unreachable from an external scheduler.** `src/proxy.ts` only allowlists `/api/cron/email-outbox` among the cron routes. `/api/cron/sla-monitor`, `/api/cron/weekly-university-scan`, and the others return 401 to a Bearer-token caller before `requireCron` runs. This was confirmed by running `isPublicApiRequest`. It was **not** changed, because it widens access for about ten routes and needs an owner decision.
- **No consent capture for email** exists yet (see Consent rules).
- **No campaign-builder UI for large lists.** The console takes recipients as pasted lines, which suits small lists. CRM audiences go through the broadcast Send button.
- **The old `/api/email` dry-run route still exists** and is no longer used by the console.
- **`prisma format --check` already fails on `main`** (pre-existing), so the schema was not reformatted as a whole.
- **Stale lock threshold** is 15 minutes. A worker batch must finish well inside that.

## Files

- `src/lib/email-marketing/`: addresses, unsubscribe-token, templating, failures, policy, config, draft-input, worker, transport, store (Prisma), campaigns (service), broadcast-bridge
- `src/app/api/email/campaigns/**`, `src/app/api/email/unsubscribe/route.ts`, `src/app/api/cron/email-outbox/route.ts`
- `prisma/schema.prisma` (four models), `prisma/migrations/20261008040000_email_marketing_core/migration.sql`
- `src/lib/communication/broadcast-engine.ts` (`sendBroadcast` gate), `src/components/marketing/hub/EmailMarketingView.tsx` (console), `src/app/crm/communications/broadcasts/page.tsx` (shows the result)
- `src/proxy.ts` (public allowlist for the two routes, sensitive-route entry for campaigns), `src/lib/marketing/permissions.ts`, `.env.example`, `docs/environment-classification.json`
- `tests/unit/email-marketing/*`
