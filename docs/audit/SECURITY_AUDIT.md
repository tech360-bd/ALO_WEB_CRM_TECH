# Security audit — ALO AgentOS / Web CRM

Read-only, 2026-10-27, commit `e74d145e`. Complements (does not replace) `SECURITY.md`, `SECURITY-AUDIT.md` and `docs/security/FINAL-SECURITY-AUDIT.md`.

---

## 1. Authentication

| Mechanism | Where | Assessment |
| --- | --- | --- |
| NextAuth v4 (`next-auth@4.24.11`) + Prisma adapter | `src/proxy.ts`, `src/lib/session-roles.ts` | Session JWT read in the edge proxy; `resolveSessionRole` centralises role resolution |
| Parallel portal sessions (`alo_portal_session` cookie) | `src/lib/auth/canonical-jwt.ts`, `src/app/api/portal-auth/*` | Separate token namespace; DB-backed `PortalSession` |
| Email OTP | `src/lib/auth/email-otp.ts` | Present |
| Password hashing | `bcryptjs@3` | Present (`User.passwordHash` defaults to `""` — an empty hash must be treated as "cannot log in"; verify that assumption in Phase 2) |
| Acting-as (super admin impersonation) | `actingAsRole`/`actingAsUserId`, `/api/super-admin/acting-as/action-log` | Audited action log exists — good |

**Positive:** the proxy fails closed for non-public routes and has an explicit, commented `PUBLIC_ROUTES` list (673 lines), so public exposure is a reviewable decision rather than an accident.

**Risk:** `src/proxy.ts` is a *route classifier*, not an authorization engine. 1,088 API handlers each need their own gate. A single handler that forgets `withAuth` is a data leak with no structural defence.

**Recommendation (Phase 2):** generate an inventory test that fails when a `route.ts` exports a mutating handler without an auth wrapper or an explicit `PUBLIC` marker — mechanically provable, cheap, and it protects every future phase.

---

## 2. Authorization

* Central engine: `src/lib/access-control/central-security-engine.ts` (`validateRequestAccess`), with `object-scope.ts` for record-level scoping.
* RBAC: `src/lib/rbac/{permission-service,role-service}.ts`; permission packages and per-user overrides were added today (`user_permission_overrides`).
* Tests exist for the engine and for several route families (`tests/unit/central-security-authority.test.ts`, `tests/unit/api-authz-regression.test.ts`, partner/webhook/visa security suites).

**Finding (High, structural):** authorization is enforced per handler, and there is no tenant column in the database (§5 of `DATABASE_AUDIT.md`). Isolation depends on every query including the right filter. For the memory/knowledge retrieval added in Phase 5 this becomes a *correctness* risk (semantic retrieval leaking another customer's facts), so retrieval must take an explicit scope object and refuse to run without it.

---

## 3. Secrets handling

| Control | State |
| --- | --- |
| `.env` in repo | absent (correct) |
| Templates | `.env.example` (242 vars), `.env.production.example` (188), `.env.ai-gateway.example` |
| CI secret scan | `git grep` over tracked files for private-key blocks, credential DSNs, GitHub/Slack/OpenAI/Google token shapes; placeholder filters; **excludes** `.github`, `*.example`, and `imports/alo-education-full/node_modules` |
| Runtime key exposure | `resolve.ts` `maskKey()` — only the first 6 and last 4 characters are ever displayed |
| Backup of `.env` | `deploy/ubuntu/backup.sh` copies `.env` with mode 0600 into the backup directory; **not encrypted** |
| Gateway | app tokens stored as SHA-256 hashes (`tokenSha256`), compared with `timingSafeEqual` |

**Finding (Medium):** the CI scan's exclusion of the 58,758 vendored files is documented as accepted residual risk. A real credential committed inside `imports/alo-education-full/node_modules` would not be detected. Fix belongs to the repository-hygiene decision, not this programme.

---

## 4. AI-specific security (strongest area of the codebase)

| Control | Implementation | Verified |
| --- | --- | --- |
| Cloud inference denied by default | `assertCloudInferenceAllowed` requires `PAID_AI_API_ALLOWED === 'true'` | `tests/unit/ai-provider-policy.test.ts` (passes) |
| Private data cannot leave | `routeModel` returns `local` for `privateData`/PII/KYC/HR tasks, or throws if `LOCAL_AI_URL` is unset | `src/lib/model-router.ts:36-39` |
| No implicit paid fallback | provider resolution throws a typed `ProviderConfigurationError` instead of switching provider | `resolve.ts` |
| Gateway `local_only` cannot escalate | 403 `LOCAL_ONLY_UNAVAILABLE`; no cross-route fallback | `services/ai-gateway/gateway.mjs:345-359`; `tests/unit/ai-gateway/` |
| Data classification per app | `PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED`; external egress refused for CONFIDENTIAL/RESTRICTED | gateway config validation |
| Prompt/completion logging | explicitly disabled; metrics use bounded labels | gateway header comment |
| Audit of AI actions | `AwfAuditLog`, `AgentAuditLog`, `ApprovalQueueItem`, approval-gated execution | `src/lib/ai-workforce/{audit,approvals}.ts` |
| Memory access policy | per-agent `maxConfidentiality`, `writeScopes`; long-term/company writes require approval | `src/lib/ai-workforce/memory.ts` |

**Gap for the call-center goal:** the gateway has no notion of *audio* or *caller identity*. Prompt-injection defences exist for tool use but there is no defence yet for injected instructions arriving through a **call transcript** or an **uploaded PDF**. Both must be treated as untrusted data with explicit delimiting; retrieved documents must never be promoted to system instructions.

---

## 5. Data-protection posture for the new surfaces

| Requirement | Current state | Needed before Phase 6 |
| --- | --- | --- |
| Recording consent | `validateRecordingConsent` requires `recordingConsent === true` **and** non-blank `consentText`, emits an audit marker with retention days | Extend to a consent record per call with `ConsentRecord` |
| Retention | `RECORDING_RETENTION_DAYS_DEFAULT` in `src/lib/communication/call-consent.ts`; no enforcement job | Retention policy table + deletion job + evidence |
| Deletion requests | Not implemented for conversations/recordings | Erasure workflow with audit |
| AI disclosure | Not implemented | Spoken disclosure before AI speaks; stored per call |
| Transcript redaction | Not implemented | Redaction of card numbers, OTPs, passwords before persistence (never store them at all) |
| Log hygiene | Health endpoint omits DB errors (good) | Redaction filters for phone numbers/transcripts; structured logger |
| Encryption in transit | TLS terminated at nginx/Caddy; internal service traffic is plain HTTP | mTLS or loopback-only binding for model/ASR/TTS |
| Encryption at rest | Host/filesystem only | Decide: encrypted volume for recordings + backups |

---

## 6. Input validation, uploads and abuse

* Zod (`zod@4`) is used widely; `ajv` available for JSON-schema validation.
* Upload path: `src/lib/documents/*`, `src/lib/storage/*`, `StudentDocument` with `mimeType`, `fileHash`, `fileSize`. `tests/unit/auto-upload.test.ts` and `tests/unit/document-*` cover parts of it.
* **Unknown:** actual malware scanning, magic-byte validation vs extension, and maximum size enforcement end-to-end. Must be verified in Phase 5 before knowledge ingestion accepts PDFs.
* Rate limiting: `src/lib/rate-limiter.ts` exists; coverage per route is not proven. The AI gateway has per-app `requestsPerMinute`.

---

## 7. Dependency position

`npm audit --omit=dev` (2026-10-27): **4 moderate, 0 high, 0 critical**.

| Package | Advisory | Fix | Note |
| --- | --- | --- | --- |
| `fast-uri` | GHSA-333x-w4r6-6crp (scheme injection) | `npm audit fix` | transitive |
| `nodemailer@10.0.13` (aliased `smtp-mailer`) | GHSA-8c8m-p3m8-cjg8, GHSA-m943-m63m-w62w, GHSA-85x2-q946-cp5h (address-parser) | requires 10.2.1, outside the pinned alias range | used for outbound mail; parser bugs can mis-deliver |
| `uuid < 11.1.1` via `exceljs` | GHSA-w5hq-g745-h8pq (buffer bounds) | `--force` breaks `exceljs` | only with caller-supplied buffers |

CI blocks high/critical (`scripts/ci/npm-security-audit.mjs`), so all four pass the gate. Recommend a scheduled `npm audit --omit=dev` review and a pinned bump of the mailer, which is the only one with a plausible production impact.

---

## 8. Security findings register

| # | Severity | Finding | Location | Recommendation |
| --- | --- | --- | --- | --- |
| S1 | High | A function that claims to transcribe audio returns a fabricated string. If wired to a UI or API it would present invented speech as real. | `src/lib/video-engine/captioning/videocaptioner.ts:236-249` | Delete or replace with a real local ASR call that fails closed; add a test asserting the absence of "Mock" text |
| S2 | High | Demo identifiers in a call-center UI (`"counselor-demo"`) and a "simulated incoming call" banner. | `src/components/alo/views/phone-call-center.tsx:299,1035,1235,1251,443` | Gate behind an explicit demo flag, label as demo in the UI, or remove |
| S3 | Medium | Route authorization enforced per handler; no structural guarantee. | `src/app/api/**` (1,088 handlers) | Generated inventory test (§2) |
| S4 | Medium | No DB-level tenant boundary; retrieval-leak risk for Phase 5 memory. | schema-wide | Explicit scope object + per-scope negative tests |
| S5 | Medium | Backups contain `.env` unencrypted; no restore verification. | `deploy/ubuntu/backup.sh` | Encrypt with age/GPG; documented restore drill |
| S6 | Medium | Upload validation/AV scanning unproven. | `src/lib/documents/*` | Verify magic bytes, size caps, AV hook before knowledge ingestion |
| S7 | Low | CI secret scan excludes 58,758 vendored files. | `.github/workflows/ci.yml` | Repository-hygiene decision |
| S8 | Low | 4 moderate advisories (mailer parser among them). | `package-lock.json` | Scheduled review; bump mailer |
| S9 | Informational | `deploy/ubuntu/restore.sh` refuses (correct) but contains a complete historical restore implementation below the guard. | same file | Keep; add a test asserting the guard exits non-zero |

---

## 9. Required before the pilot (Phase 8 gate)

1. Consent + AI-disclosure record per call, stored and auditable.
2. Retention job with evidence, plus a tested erasure path.
3. Transcript/phone-number redaction in logs and in persisted events.
4. Prompt-injection tests for transcript- and document-sourced text.
5. Per-route authorization inventory test green.
6. Restore drill passed (see `docs/operations/BACKUP_AND_RESTORE.md`).
7. SIP/TLS configuration reviewed; telephony management ports not internet-facing.
8. Model/ASR/TTS services bound to loopback or a private bridge.
