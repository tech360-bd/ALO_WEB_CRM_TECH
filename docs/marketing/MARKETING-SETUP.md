# Marketing Command Center — Setup

> Mandate §68. Configuration for the marketing channels. Shares the UCC provider
> credentials and OAuth/webhook infrastructure — never a separate secret store.

## Channel configuration
Each channel in `docs/marketing/MARKETING-CHANNEL-MATRIX.md` is configured via
the same provider setup wizard as the UCC (`docs/communications/SETUP.md`).
Marketing-specific additions:

```
# Campaign / attribution
ALO_DEFAULT_CAMPAIGN_TIMEZONE=Asia/Dhaka
# Google Analytics / Search Console (website channel)
GA4_PROPERTY_ID / GSC_SITE_URL
# Google Ads (advertising)
GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CUSTOMER_ID
```

All secret values are `CONFIGURE_IN_SERVER_SECRET_STORE` placeholders in
`.env.example`. Real values are never committed.

## Bangladesh scheduling (mandate §38)
Initial planning windows (Asia/Dhaka) are seeded as `INITIAL_RECOMMENDATION`
(see `CONTENT-FORMAT-MATRIX.md`). They are configurable per channel/audience/
country/timezone and are NOT guaranteed optimal times.

## Approval workflow (mandate §34)
`IDEA → DRAFT → DESIGN → REVIEW → CORRECTION → APPROVAL → SCHEDULED → PUBLISHED`.
Content employee creates/edits; marketing manager reviews; authorized approver
approves; publisher publishes; admin overrides where authorized. Every approval
is audited.

## Verification status
Configuration schema and workflow are `CODE_COMPLETE`. No channel is connected
or live-verified: `CONFIGURATION_REQUIRED` / `OAUTH_REQUIRED` /
`PROVIDER_APPROVAL_REQUIRED` / `LIVE_TEST_PENDING` as computed.
