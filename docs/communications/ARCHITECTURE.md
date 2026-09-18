# Unified Communication Center — Architecture

> Mandate §80. This document describes the canonical provider-adapter
> architecture in `src/lib/ucc/providers/` and how it reconciles with the
> existing UCC (`src/app/api/crm/ucc/`), omnichannel, and marketing modules.

## Design principle: one platform, not many dashboards

```
USER → EMPLOYEE → ROLE → DEPARTMENT → PERMISSIONS → ASSIGNED ACCOUNTS → WORK
```

The UCC is ONE system. Marketing, employee, department, and executive views are
projections of the same data through RBAC — never separate codebases (mandate §2,
§64, §69).

## The three independent axes (mandate §117)

```
SOFTWARE IMPLEMENTATION   ≠   PROVIDER CONFIGURATION   ≠   LIVE VERIFICATION
   (code exists)              (account/app configured)      (real provider data)
```

These are never collapsed into one status. The status engine
(`src/lib/ucc/providers/status.ts`) derives a single honest headline from a
linear gate chain and only returns `LIVE_TEST_VERIFIED` when live-message
evidence exists.

## Message flow (mandate §1)

```
Provider → OAuth → encrypted token → ConnectedAccount → Webhook
  → verify signature → dedupe (idempotency) → normalize
  → ContactIdentity match → CRM contact/lead → Conversation
  → assignment → employee dashboard → employee reply
  → provider adapter → official API → delivery status
  → audit log → analytics → SLA → escalation → AI assist → approval
```

## Module map

| Concern | Canonical module | Existing code reconciled |
|---|---|---|
| Provider contract | `src/lib/ucc/providers/types.ts` | — (new) |
| Capability registry | `src/lib/ucc/providers/registry.ts` | `PROVIDER_INTEGRATION_MATRIX.csv` |
| Honest status | `src/lib/ucc/providers/status.ts` | `/api/research/provider-status` |
| Webhook security | `src/lib/ucc/providers/webhook-security.ts` | `/api/crm/ucc/webhooks/[provider]` |
| Base adapter | `src/lib/ucc/providers/base-adapter.ts` | — (new) |
| Token encryption | `src/lib/token-encryption.ts` (AES-256-GCM) | reused, not duplicated |
| Conversations | `UccConversation` / `UccMessage` models | `/api/crm/ucc/conversations` |
| Connected accounts | `ConnectedAccount` / `SocialIntegration` | see RECONCILIATION below |
| SLA | `SlaPolicy` / `CommunicationSlaRule` | `/api/crm/ucc/sla` |
| Escalation | `EscalationEvent` / `CommunicationEscalation` | existing |
| Provider errors | `ProviderErrorLog` | existing |
| Webhook events | `WebhookEvent` / `UccWebhookEvent` | existing |
| RBAC | `src/lib/permissions.ts`, `src/lib/rbac/` | reused |

## RECONCILIATION: two connected-account models

The schema has BOTH `SocialIntegration`+`SocialAccount` (with **plaintext**
`accessToken`) AND `ConnectedAccount` (with `accessTokenEnc`/`refreshTokenEnc`).
This is a duplication + a §11 token-security concern.

**Decision (no destructive migration performed):**
- `ConnectedAccount` (encrypted columns) is the go-forward canonical model.
- `SocialIntegration.accessToken`/`refreshToken` plaintext columns are flagged
  for migration to encrypted storage — recorded as an OWNER ACTION, not executed
  (mandate §71/§101: never run destructive migrations automatically; needs
  backup + review + approval; `prisma generate` is blocked in this sandbox).
- New code MUST use `ConnectedAccount` + `src/lib/token-encryption.ts`.

## What is implemented vs planned (honest)

- **CODE_COMPLETE + unit-tested:** provider contract, capability registry,
  honest status engine, webhook signature verification (Meta/Telegram/X),
  idempotency keying, base adapter anti-fake guard, Telegram reference adapter.
- **PARTIAL (existing):** Meta/WhatsApp webhook receive + verification in
  `/api/crm/ucc/webhooks/[provider]`.
- **PLANNED:** concrete adapters for the other 10 providers, the connected-account
  management UI, the setup wizard, the unified inbox UI.
- **NOT VERIFIED anywhere:** live OAuth, live webhooks, live message delivery
  (no credentials; sandbox egress blocked).
