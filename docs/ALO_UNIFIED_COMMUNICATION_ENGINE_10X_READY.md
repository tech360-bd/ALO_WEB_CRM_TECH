# ALO Unified Communications — Current Implementation Status

**Reviewed:** 2026-10-19 (Asia/Dhaka)
**Status:** Work in progress. The historical “10X READY” title and the older branch/date/status claims were not evidence of production readiness and are superseded by this note.

## What is established in this checkout

- The repository has existing communication, UCC, WhatsApp, Facebook, CRM, portal, SLA, and audit models/routes. This does **not** mean all listed channels, dashboards, partner scopes, or provider integrations are complete or production-verified.
- Meta webhook paths retain signature validation and provider-event deduplication. Inbound WhatsApp messages are recorded in the existing archive/UCC/social inbox paths; Messenger events are recorded in `SocialInboxMessage`.
- Generated WhatsApp/Messenger intake text is stored as an unapproved draft. It is not an automatic reply. The only implemented social auto-reply candidate is the fixed `AFTER_HOURS_MESSAGE` template.
- The static after-hours reply is eligible only when a readable, explicitly persisted UCC schedule enables that day's setting and an idempotent linked follow-up task already exists or is durably created. Empty/default schedules, schedule-read failures, unlinked contacts, task failures, urgent/complaint handovers, and opt-outs do not produce a sendable acknowledgement. An outbound record is created before a provider call; success is recorded only after a provider message ID is returned.
- Public student intake is deterministic general guidance, not a current university/visa knowledge base. A typed Student ID or phone is not authentication. Public document/image/video uploads are not reviewed by the public intake handler. Intake memory pseudonymizes its database key, redacts common identifiers/credentials, and does not retain the raw sender identity in the memory value.
- AI application changes remain note-only. Supported AI command execution uses a guarded approval/idempotency path; unknown or higher-risk actions are not auto-approved.
- UCC business-time defaults are Asia/Dhaka, Saturday–Thursday 09:00–18:00, Friday closed. Persisted rows remain authoritative. The office-hours screen flags the former 10:00–19:00 default for administrator review without changing existing records.

## Billing and privacy gates

- `PAID_AI_API_ALLOWED` defaults to false in the example environment files. External cloud inference is blocked unless an owner explicitly enables it after reviewing provider/account billing. Advertised free tiers are not treated as verified billing guarantees.
- Private `/api/chat` inference is local-only. Public intake does not call a model to answer factual requirements. Staff-generated drafts require human review.
- Sensitive documents must continue to be served only from private storage through authenticated, authorized download routes; no public filesystem path or arbitrary document URL should be introduced.
- A WhatsApp number is not considered connected merely because a number appears in configuration or UI. Meta phone-number IDs, app secrets, access tokens, webhook verification, delivery callbacks, and account ownership must be verified in the real Meta account. No real customer message was sent in this work.

## Key implementation files

- `src/lib/communication/unified-engine.ts` — existing communication records/timeline creation and office-hours task behavior.
- `src/lib/communication/business-hours.ts` and `business-hours-store.ts` — Dhaka schedule calculations and persisted-policy status.
- `src/lib/communication/after-hours.ts` — idempotent callback task and gated static acknowledgement.
- `src/app/api/whatsapp/webhook/route.ts` and `src/app/api/facebook/webhook/route.ts` — provider webhook processing, draft persistence, and conditional static acknowledgement delivery.
- `src/lib/ai-agents/student-intake-agent.ts` and `src/app/api/ai/student-intake/route.ts` — public intake response and signed-session handling.
- `src/app/api/whatsapp/ai-intent/route.ts` and `src/lib/ai-whatsapp-engine.ts` — authorized, scope-checked, deterministic staff draft handling.
- `src/app/api/crm/ucc/office-hours/route.ts` and `src/components/alo/views/crm-settings.tsx` — existing persisted schedule management.

## Verification and release blockers

The current implementation must not be called “complete” or “ready for live.” Focused unit tests and a targeted TypeScript check are still being run; the full repository typecheck previously exceeded the sandbox memory limit. Production database state, backup/restore, migration review on representative data, deployment commit, worker/cron operation, private document storage, Meta credentials, actual phone-number pool configuration, provider delivery, broadcasts, consent/OTP flows, B2B isolation, and complete role-specific timeline/inbox coverage have not been verified here.

Before a live rollout:

1. Run the checked-in tests and CI checks; review any failures without weakening safety assertions.
2. Take an integrity-checked backup and restore it to an isolated database; review migration impact on representative data. Do not narrow `OpportunityGraphEdge` without its own compatibility review.
3. Have an authorized operator review and save the intended persisted Dhaka schedule. Do not bulk-rewrite legacy rows.
4. Verify Meta app/page/phone configuration and webhook callbacks in a non-customer test environment; confirm the configured number identities and consent policy.
5. Review every route and UI for server-side role/tenant scope, private document access auditing, consent, and no unapproved sends.
6. Verify deployment identity, production health, worker/cron state, observability and rollback with the actual hosting account.

## Local focused tests

```bash
npx vitest run tests/unit/business-hours-policy.test.ts tests/unit/after-hours-automation-policy.test.ts tests/unit/ucc-office-hours-route.test.ts tests/unit/student-intake-public-safety.test.ts tests/unit/student-intake-public-route.test.ts tests/unit/whatsapp-ai-safety.test.ts tests/unit/whatsapp-ai-intent-auth.test.ts
```
