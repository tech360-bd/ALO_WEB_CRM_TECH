# Super Admin owner chat — UnoRouter free-only integration

Status: PARTIALLY_BUILT. Live UnoRouter inference and production deployment require external configuration and have not been verified. This is a draft-only assistant, not an autonomous production operator or a claim that 2,000 agents are running.

## Existing integration points

- `/crm/dashboard`: existing `MasterSuperAdminDashboard`, AI Command tab, existing `AICommandingCenter`; its chat uses `OwnerAIChatPanel`.
- `GET /api/admin/ai-chat`: current owner’s recent conversations, encrypted history, configured local model, current public free-model catalog and safe configuration status. No API key is returned.
- `POST /api/admin/ai-chat`: exact current Super Admin authority through existing authentication and central database authorization. Student, partner, ordinary Admin, employee and Acting-As sessions are denied.
- Existing `aiGateway`, `generateText`, `routeModel`, AES-256-GCM encryption, `AwfRun`, `PortalAuditLog` and `CrmAuditLog` are reused. No duplicate chat database or synthetic agent is created.
- New migration `20261024120000_owner_ai_chat_indexes` adds only two indexes to existing `AwfRun`. No history is deleted.

## Configure on the server

1. Create an UnoRouter inference API key in its Tokens page. Restrict its allowed models to the same exact free IDs configured below. Never use an account access token, commit a key or paste it into the browser/chat.
2. Review the current catalog at `https://api.unorouter.com/api/pricing/catalog`. Choose an online text/chat OpenAI-compatible model with `:free`, `is_free: true` and zero input, output and fixed prices. Review provider retention/training and account consent requirements.
3. Set these existing deployment environment variables:

```dotenv
UNOROUTER_ENABLED=true
UNOROUTER_API_KEY=<server-secret-from-your-secret-manager>
UNOROUTER_ALLOWED_MODELS=<reviewed-exact-model-id:free>
UNOROUTER_MODEL=<same-reviewed-exact-model-id:free>
PAID_AI_API_ALLOWED=false
ENCRYPTION_KEY=<stable-64-hex-character-server-secret>
```

`UNOROUTER_ALLOWED_MODELS` can contain multiple comma-separated approved free IDs. No model is hardcoded as permanently available/free. Keep the encryption key stable; losing it makes saved history unreadable. For private local chat, configure the existing `LOCAL_AI_URL` and `LOCAL_AI_MODEL` instead. UnoRouter is an external cloud service, not a self-hosted private model.

4. Install the lockfile dependencies, run `npx prisma migrate deploy`, `npx prisma generate`, and the existing checks/build on Node 22; release through the existing approved deployment process.
5. Open the existing Super Admin main dashboard → AI Command → Owner AI chat. Select UnoRouter, choose an approved available model, confirm the non-confidential external conversation checkbox, then send. Verify a real reply, encrypted `AwfRun`, and request/completion audit events before marking live inference verified.

## Enforced controls

- Fixed official inference/catalog hosts; redirects and client endpoint overrides are rejected. API keys remain on the server.
- Fresh catalog pricing verification before each inference; missing prices, offline status, unapproved or paid IDs fail closed. Explicit provider/model selection; no paid fallback and no automatic use by other CRM AI calls.
- No CRM/HR/student records are attached automatically. Remote conversation context contains only the same owner’s prior remote turns, never local history. The owner must avoid manually entering confidential data.
- Local mode remains local. Private task hints cannot select UnoRouter. Chat has no shell, payment, permission, publishing, deployment or CRM mutation tools.
- Serializable DB reservation, globally one request/minute per free model for this chat, owner 20 requests/minute, idempotent retries, bounded prompt/output/timeouts, safe errors and Retry-After responses. Upstream limits may be stricter or shared with other apps using the same account.
- Audit must persist before inference and alongside completion/failure. Saved input/output are AES-256-GCM encrypted. Owner history is filtered server-side and HTTP responses are private/no-store.
- The chat no longer claims that tests succeeded, files were changed or agents are online merely because a command was typed. Explicit existing maintenance controls remain separate. Applying schema changes over HTTP remains disabled.

## Verification and limits

Unit tests cover paid/unapproved/unknown-price/offline rejection, fixed endpoints, response model mismatch, consent, rate limits, owner-only APIs, client authority injection, encryption, idempotency, history isolation, global pause and audit failure. Provider responses in tests are deliberately mocked; they are not evidence of live provider inference.

`tests/integration/owner-ai-chat-live-db.test.ts` requires the existing explicitly configured disposable test database. It tests real sessions, backend authorization, encrypted persistence, idempotency, owner isolation and audit with a mocked inference response. It skips without that database.

No real UnoRouter API key has been supplied to this implementation session. No live completion, production account consent, delivery SLA, production migration or deployment is claimed. Free availability and provider privacy policies remain external dependencies. Whole employee/CRM acceptance is NOT COMPLETE; see `docs/employee-access/2026-10-24-follow-up.md`.

## Rollback

Set `UNOROUTER_ENABLED=false` and redeploy the previous reviewed application revision. Retain `ENCRYPTION_KEY`, `AwfRun` history and audit records. The additive indexes can remain. Do not roll back by deleting history or resetting the database.

## Official references checked 2026-10-24

- https://unorouter.com/en/docs/platform/models-and-pricing — `:free` routing, no balance consumption, availability limits.
- https://unorouter.com/en/docs/platform/platform-api — public pricing catalog and inference API keys.
- https://unorouter.com/en/docs/platform/rate-limits — free-model request limits and Retry-After.
- https://unorouter.com/en/docs/platform/consents — provider retention/training and consent restrictions; consent is never automatically granted.
- https://unorouter.com/en/docs/quickstart — OpenAI-compatible API and authentication.
