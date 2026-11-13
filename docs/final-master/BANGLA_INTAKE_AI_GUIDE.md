# Student Intake and AI Safety — Current Implementation Contract

**Reviewed:** 2026-10-19 (Asia/Dhaka)
**Status:** Implementation notes only; this is not a production-readiness certification. External credentials, production deployment, and provider delivery have not been verified.

## Public intake contract

- `POST /api/ai/student-intake` uses a server-signed, HTTP-only session cookie (`alo_intake_session`, 30-day lifetime). Client-supplied `senderId` is accepted only for backward compatibility and is ignored as an identity or memory key.
- A Student ID is **not authentication**. The public flow does not look up a student or reveal profile/application data. If an ID is typed, the response directs the visitor to the authenticated Student Portal; the ID is omitted from saved conversation memory.
- Public intake does not accept or review image, video, or document uploads. Voice is only accepted when a verified transcription is supplied; otherwise the visitor is asked to type the question.
- Public replies are deterministic, general guidance. This route has no verified, current university/visa knowledge corpus and does not claim current admission requirements. It does not make final visa/eligibility decisions, guarantee outcomes, or ask for passwords, OTPs, bank/card details, passports, or private documents.
- Conversation memory is bounded to 20 turns and redacts common student-ID, email, phone/account-number, and credential patterns before persistence. No profile identity is inferred from a public message.

## Relevant implementation

- `src/lib/ai-agents/student-intake-agent.ts` — public-only deterministic response policy, language detection, signed-session memory support, and ID redaction. It does not query a student record from a typed ID.
- `src/lib/ai-agents/intake-session.ts` — HMAC-signed session cookie. A server secret of at least 32 characters is required; the route fails closed if none is available.
- `src/app/api/ai/student-intake/route.ts` — public intake endpoint; signed session identity is derived server-side.
- `src/app/api/admin/ai/student-intake/route.ts` — authenticated admin health/governance endpoint. Its status reads the configured office schedule; prompt changes are not a substitute for the fixed privacy rules.
- `src/app/api/whatsapp/webhook/route.ts` and `src/app/api/facebook/webhook/route.ts` — signed Meta webhooks. Generated intake text is saved as a human-review draft. The only automatic reply path is the configured, pre-approved static after-hours acknowledgement; it requires the persisted after-hours setting and a durable follow-up task. Delivery is recorded only after a provider message ID is returned. No live provider call was made during this work.
- `src/lib/communication/after-hours.ts` and `src/lib/communication/business-hours-store.ts` — persisted UCC schedule and next-opening follow-up scheduling.

## Office-hours policy

The no-record fallback is **Asia/Dhaka, Saturday–Thursday 09:00–18:00; Friday closed**. Persisted `UccOfficeHours` rows remain authoritative. Existing stored schedules are not silently rewritten: if a legacy 10:00–19:00 schedule is present, an authorized administrator must review/save the intended schedule in CRM Settings. The office-hours UI now reads and writes the existing API and preserves per-day differences.

## AI provider billing policy

- `PAID_AI_API_ALLOWED=false` is the documented default in `.env.example` and `.env.production.example`.
- Native and catalogued cloud providers are blocked before inference unless an owner explicitly sets `PAID_AI_API_ALLOWED=true`. Key presence and an advertised free tier are not treated as proof that overage billing is impossible.
- The separate AI Workforce cloud runtime additionally requires `ALO_ENABLE_OPTIONAL_CLOUD_AI=true`. Confidential/private gateway requests remain local-only; local inference requires an operator-configured local endpoint.
- No provider credentials were requested or tested. A production owner must review provider/model/account billing controls before enabling cloud inference.

## Local verification

```bash
npx vitest run tests/unit/student-intake-public-safety.test.ts tests/unit/business-hours-policy.test.ts tests/unit/ai-provider-policy.test.ts tests/unit/ai-provider-catalog.test.ts
```

Do not use a real student record, contact, or live Meta destination in automated tests. Production activation also requires the normal backup/restore, migration review, Meta webhook signature/number configuration, private-storage review, and deployment/worker verification; this guide does not establish that those are complete.
