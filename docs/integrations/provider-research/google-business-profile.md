# Google Business Profile — Provider Research

> **Status: CODE_COMPLETE (planned) / PROVIDER_APPROVAL_REQUIRED / LIVE_TEST_PENDING.**
> No consumer-messaging API — reviews are the inbound channel.

## Official sources
- Overview: https://developers.google.com/my-business
- Account Management: `mybusinessaccountmanagement.googleapis.com/v1`
- Business Information: `mybusinessbusinessinformation.googleapis.com/v1`
- Reviews + Local Posts: `mybusiness.googleapis.com/v4` (still v4 — verified)
- Performance: `businessprofileperformance.googleapis.com/v1`

## OAuth
- OAuth 2.0 only — **API keys are rejected with 401** (data is user-owned).
- Scope: `https://www.googleapis.com/auth/business.manage` (one scope covers all hosts).
- Access token ~1h + refresh token.

## Webhook
- Notifications API (Pub/Sub) for review updates where enabled.
- Pub/Sub push uses an OIDC JWT — validate via Google JWKS.

## Capabilities
- Receive messages: **NOT SUPPORTED** (no consumer messaging API). Reviews are inbound.
- Send messages: **NOT SUPPORTED** (no consumer messaging API). Reply to reviews instead.
- Comments: YES — Reviews: list/read/reply/delete-reply (`mybusiness.googleapis.com/v4`).
- Publishing: YES — Local Posts (standard/event/offer) via v4.
- Attachments: PARTIAL — photos via Business Information API; review media read-only.
- Account management: YES — Account Management + Business Information APIs.
- Analytics: YES — Business Profile Performance API v1 (`fetchMultiDailyMetricsTimeSeries`).
- Revocation: YES.

## Approval / production
- **Per-GCP-project** access request + approval; quota starts at zero until approved.
- Approval does not carry over between projects.
- Q&A API was shut down 2025-11-03.

## Rate limits
- Per-project quota; returns HTTP 429 RESOURCE_EXHAUSTED when unapproved/exceeded.

## Known limitations
- No consumer messaging. Reviews/posts still on legacy v4 host.
- Approval gate is per-project and not automatic.
