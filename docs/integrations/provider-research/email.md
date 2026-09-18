# Email (SMTP / IMAP) — Provider Research

> **Status: CODE_COMPLETE (planned) / CONFIGURATION_REQUIRED / LIVE_TEST_PENDING.**

## Official sources
- SMTP: RFC 5321 — https://datatracker.ietf.org/doc/html/rfc5321
- IMAP: RFC 3501 — https://datatracker.ietf.org/doc/html/rfc3501
- DKIM/SPF/DMARC: RFC 6376 / 7208 / 7489
- For OAuth2 transports: Google Workspace / Microsoft Graph.

## Auth
- Two official patterns — choose ONE transport:
  1. **SMTP relay with app-password** (e.g. a transactional provider): server-side credentials, no OAuth.
  2. **OAuth2** (Google Workspace via `https://mail.google.com/`, Microsoft via Graph `Mail.Read`/`Mail.Send`): access + refresh tokens.
- Never store the mailbox password in plaintext; use the encrypted ConnectedAccount columns or the provider's OAuth tokens.

## Inbound
- IMAP polling, or a provider inbound-parse webhook (e.g. SendGrid Inbound Parse, Mailgun Routes).
- Threading via `Message-ID` / `In-Reply-To` / `References` headers.

## Capabilities
- Receive messages: YES (IMAP or inbound-parse).
- Send messages: YES (SMTP relay or provider send API).
- Attachments: YES (MIME parts).
- Conversation: YES (header-based threading).
- Account management: YES.
- Analytics: PARTIAL (delivery/bounce via provider webhooks where available).
- Webhook: NO universal webhook — provider-specific.
- Revocation: PARTIAL (revoke app-password / OAuth grant at the provider).

## Approval / production
- No app review for SMTP/IMAP. For Google/Microsoft OAuth, configure the consent screen.
- Set SPF/DKIM/DMARC for deliverability and spoofing protection.

## Rate limits
- Provider-specific sending quotas and reputation limits.

## Known limitations
- No universal webhook; inbound is polling or provider-specific.
- Deliverability depends on DNS authentication (SPF/DKIM/DMARC).
