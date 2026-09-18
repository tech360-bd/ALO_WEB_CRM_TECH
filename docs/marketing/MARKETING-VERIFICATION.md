# Marketing Command Center — Verification

> Mandate §56, §57, §67, §68. Distinguishes software implementation from
> provider configuration from live verification (mandate §117).

## Per-channel status card (mandate §56)
Each channel card shows: Code · Credentials · OAuth · Account · API · Webhook ·
Publishing · Analytics · Ads · Live Test. If any item has not been tested, it is
**not** shown as VERIFIED.

Example (honest current state):
```
Instagram
  Code:        CODE_COMPLETE
  Credentials: CONFIGURATION_REQUIRED
  OAuth:       OAUTH_REQUIRED
  Account:     NOT_CONNECTED
  Publishing:  LIVE_TEST_PENDING
  Analytics:   LIVE_TEST_PENDING
  Ads:         PROVIDER_APPROVAL_REQUIRED
```

## Provider Health (mandate §57)
API health · OAuth health · token expiry · webhook health · rate limit ·
publishing failures · analytics failures · last successful sync · last error ·
retry state. Colours follow §47 (GREEN only for genuinely verified).

## Live test rule (mandate §67, §91)
A channel is `LIVE_VERIFIED` only after real credentials + real authorization +
real webhook + real publish/analytics call + real response have succeeded. A
mock test is `MOCK TEST PASSED`, never `LIVE VERIFIED`.

## Current status — NONE live-verified
No marketing channel has completed live authorization, webhook verification, or
a live publish/analytics call in this environment (no credentials, sandbox egress
blocked). Every channel is at most `CODE_COMPLETE` / `CONFIGURATION_REQUIRED` /
`PROVIDER_APPROVAL_REQUIRED` / `LIVE_TEST_PENDING`.

## What IS verified
- Marketing RBAC permission catalogue + role map: `CODE_COMPLETE`
  (`src/lib/marketing/permissions.ts`).
- Channel/format matrices generated from source: `CODE_COMPLETE`.
- Shared provider architecture (status engine, webhook security): `CODE_COMPLETE`
  + unit-tested (46 tests).
