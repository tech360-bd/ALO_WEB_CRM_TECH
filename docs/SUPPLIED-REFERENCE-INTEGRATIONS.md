# Supplied-reference integration contracts

Updated 2026-10-10. Production remains Node 22 / MySQL on Hostinger/cPanel.
No external source is imported, executed or embedded by the reference audit.
Read `AUDIT/supplied-reference-implementation-2026-10-10.md` for per-link coverage and open work.

## Draft marketing assets

The main marketing hub's **Brand Assets & Post Creator**, and
`/admin/marketing-automation`, expose `MarketingKitPanel` and the visual composer.
Each campaign can be edited and exported in four formats: square 1080×1080,
portrait 1080×1350, story 1080×1920 and landscape 1200×628. SVG, browser-canvas
PNG, and Markdown copy-brief downloads work locally. Exports retain a draft
watermark; they do not persist an approval, schedule or publish anything.

Inventory comes from authenticated `/api/marketing/brand-assets`. It is not a
claim of approved posts or live analytics. The composer uses original ALO text
and color layouts, not an unverified logo/contact fallback. Stored logos are
not silently imprinted into local exports. Add and independently verify the
correct destination and current claims before publishing. Draft edits reset
when switching kits/unmounting; downloaded assets are not stored server-side.

## SMS transport and receipts

Before deployment, apply the additive migration
`20261010130000_sms_provider_correlation`. `SmsLog` now persists provider and
acknowledged message ID. The restored AuditLog↔User Prisma relation describes
the existing `0_init` foreign key; it requires no new DDL.

- `SMS_PROVIDER=httpsms`: `HTTPSMS_API_KEY`, `HTTPSMS_FROM` (E.164 number),
  optional `HTTPSMS_BASE_URL` (default https://api.httpsms.com).
- `SMS_PROVIDER=domovina`: same API key/sender plus `DOMOVINA_SMS_URL`.
  Both POST `/v1/messages/send` with `x-api-key` and `{from,to,content}`;
  acknowledgment must contain `data.id` and a recognized state.
- `SMS_PROVIDER=generic`: `SMS_PROVIDER_URL`, `SMS_PROVIDER_API_KEY`, optional
  `SMS_SENDER_ID`. This explicitly configured custom contract sends
  `{to,text,from}` with Bearer authentication and expects a string `id`.
  It is not asserted compatible with an arbitrary bulk-SMS vendor.
- Legacy `HTTPSMS_TOKEN` means API key; `HTTPSMS_PHONE_ID` means sender number.
  Neither is a webhook signing key.
- 3CX outbound SMS is not implemented; its existing campaign route is dry-run
  only. A journal entry is never treated as a paid send.

Provider URLs are operator-controlled HTTPS configuration. Server transports
must not be exposed directly to untrusted callers. Callers enforce session,
permissions, consent and rate limits. The OTP engine uses `sensitive:true`,
persisting a redacted SMS intent before sending. Query-parameter logging in
the shared Prisma client is disabled to avoid credential leakage.

Acceptance is not handset delivery. Network failures/5xx/unrecognized
acknowledgments produce **UNKNOWN**, not automatic retries. Do not resubmit a
paid message blindly. If the post-acceptance status write fails,
`auditPersisted:false` is returned without throwing a duplicate-send-inducing
error. An operator must reconcile that intent with the provider. OTP challenges
with uncertain sends are retired and remain subject to cooldown/rate limits.

### Outbound receipt route

Register `/api/integrations/httpsms/webhook` with the provider using:

```
HTTPSMS_WEBHOOK_SIGNING_KEY=<strong signing key, at least 32 characters>
HTTPSMS_WEBHOOK_URL=<exact registered HTTPS webhook URL>
HTTPSMS_WEBHOOK_SUBJECT=<provider account user ID>
HTTPSMS_WEBHOOK_PROVIDER=httpsms
```

Use `domovina` for a fork account. The route requires a verified HS256 Bearer
JWT with issuer `api.httpsms.com`, exact audience/subject and required time
claims. **This authenticates the bearer; it is not a body-HMAC signature.**
TLS and secret protection remain essential. Missing auth/configuration fails
closed. Payloads are bounded to 32 KiB.

Supported CloudEvents: `message.phone.sent`, `message.phone.delivered`,
`message.send.failed`, final `message.send.expired`. Account and sender/recipient
must match the persisted outbound provider message. Event-ID deduplication,
redacted event metadata and conditional lifecycle update commit atomically.
Late failures cannot roll back SENT/DELIVERED. Duplicate replays are acknowledged.
Nonfinal expiry records the event without terminating the intent. Inbound,
heartbeat, call and other events return 422 rather than silently ingesting them.
Subscribe only to supported outbound events.

A receipt arriving before message-ID persistence returns 409; retry/reconcile
that **event**, not the SMS send. Missing correlation is never guessed from a
phone number or time. There is no installed polling/reconciliation worker yet;
unknown intents and exhausted provider webhook retries need operator follow-up.
Live provider receipt and MySQL transaction/migration testing are still required.

## RunningHub versus ComfyUI

`runninghub-client.ts` is the separate cloud OpenAPI adapter:
`RUNNINGHUB_API_URL`, `RUNNINGHUB_API_KEY`, approved workflow ID/node mappings.
Create `/task/openapi/create`; poll `/task/openapi/outputs`. Never retry uncertain
creation automatically. Only provider-acknowledged task IDs and actual safe
HTTPS outputs are returned. Empty output is empty, not a fabricated asset.
There is no cloud scheduling/storage integration or live cloud test yet.

`comfyui-client.ts` uses local `/prompt`, `/history`, `/upload/image`, `/view`.
Set `COMFYUI_API_URL` and optional `COMFYUI_API_KEY`. Provide an installed,
operator-verified exported API graph with explicit input bindings; do not pass
user-supplied arbitrary node graphs through a public API. Audio/video uploads
require verified custom-node adapters and are not silently ignored. Image
upload failure is not swallowed. History errors take precedence over completion;
outputs are validated descriptors, not browser-facing localhost URLs.

The registered ComfyUI video provider remains **not_configured** until an ALO
output-transfer worker exists. It starts no generic video tasks, invents no
CLIP/SaveVideo graph, and claims no unverified resolution/duration capabilities.
Low-level graph helpers are internal operator APIs, not complete UI integration.

## Native platforms

Linphone iOS, Android ConnectionService, Electron promise IPC and Linux
ipftrace2 require separate runtimes. No audited native bridge/collector is
installed. The web boundary reports `not_configured`, no simulated registration,
call IDs, ringing or encryption. ipftrace2 observes Linux kernel functions/BPF
packet paths, not ping/traceroute measurements. Native permissions, distribution,
provider interoperability, encrypted media and device tests remain open work.

## Verification

A real MySQL-schema type client can be generated offline for static/unit checks:

```
touch /tmp/alo-dummy-engine
PRISMA_QUERY_ENGINE_LIBRARY=/tmp/alo-dummy-engine \
PRISMA_SCHEMA_ENGINE_BINARY=/tmp/alo-dummy-engine npx prisma generate --no-engine
NODE_OPTIONS='--max-old-space-size=2400' npm run typecheck:references
npm test
npm run lint
```

The no-engine client is **not a production MySQL query runtime** and is not a
substitute for `npm run build` / clean native client generation on deployment.
Repository-wide TypeScript runs exceed this sandbox's 4 GiB memory; the focused
reference config checks changed entrypoints and their real imported types only.
It does not replace the full typecheck gate.

### Reproduce isolated browser component checks

```
node scripts/build-reference-components.mjs
python3 -m http.server 4173 --bind 0.0.0.0 --directory _reference_repos/ui-verification
# In a second terminal, with a working Playwright Chromium installed:
CHROMIUM_PATH=/path/to/chromium node scripts/verify-reference-components.mjs
```

Use the process tool, not a one-shot bash call, for the long-running server in
Arena. `REFERENCE_COMPONENT_URL` and `REFERENCE_ARTIFACT_DIR` override defaults.
The harness is deliberately not an application route or authentication bypass.
It uses only synthetic callbacks/records. Screenshots and binaries stay ignored;
the small audit JSON records checks, not production readiness. Inspect generated
mobile/tablet/desktop screenshots and PNG assets, not just the green test result.
