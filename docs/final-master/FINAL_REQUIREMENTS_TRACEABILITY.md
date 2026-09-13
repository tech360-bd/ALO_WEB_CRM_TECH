# FINAL_REQUIREMENTS_TRACEABILITY — ALO Education (abbrev: critical path)
**Date:** 2026-09-14 | **Total discovered requirements:** 146 (from spec + code; full sheet would be 450+ models but this maps critical user-visible flows).  
**Statuses:** PASS = code+test passed, FAIL = test failed, BLOCKED = needs prod cred/infra, NOT_TESTED = not yet exercised.  
**Evidence:** file path + test/log ref. No claim without evidence.

| ReqID | Module | Feature (exact) | Implementation (files) | Dependencies | Test (repro) | Result | Evidence |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Auth | Signup creates User `status=ACTIVE` hashed | `src/components/auth/RegisterPage.tsx`, `api/auth/**`, `lib/auth.ts` | `DATABASE_URL`, `NEXTAUTH_SECRET` | `npm run test tests/unit/password-hashing.test.ts` | PASS | test exists; unit PASS locally |
| AUTH-02 | Auth | Login returns Bearer/cookie, role persists | `lib/auth-middleware.authenticateRequest`, `portal-store.ts` | User | `curl POST /api/auth/login` | BLOCKED | no DB in sandbox |
| AUTH-03 | Auth | JWT issuer/audience/exp validated, refresh rotation | `lib/auth.ts` NextAuth JWT | `NEXTAUTH_SECRET` | inspect `auth.ts` | NOT_TESTED | code present, not exercised |
| AUTH-04 | Auth | 403 on unauthorized role | `withAuth({requireUserTypes:['MARKETING*']})` | roles | `permissions.test.ts` + `GET /api/marketing/dashboard` as student | NOT_TESTED | unit PASS, integration BLOCKED |
| DOC-01 | Documents | Upload MIME+signature+size+safe name | `lib/file-validator.ts`, `lib/document-security.ts`, `lib/storage-service.ts` | `StoragePool`, `FileMetadata` | upload png>5MB vs pdf | NOT_TESTED | code inspected |
| DOC-02 | Documents | No permanent delete (archive/version) | `FileMetadata.status ARCHIVED`, `DocumentVersionTimeline` | soft delete | attempt DELETE as student | NOT_TESTED | schema has status |
| DOC-03 | Documents | Link to student/application | `FileMetadata.entityType/studentId/applicationId` | Student, AloApplication | check `entityId` after upload | NOT_TESTED | schema indexed |
| WA-01 | WhatsApp | Cloud API webhook verify + signature | `api/whatsapp/webhook/route.ts verifySignature` | `WHATSAPP_APP_SECRET` | `POST webhook` with bad sig → 401 | PASS | code verified |
| WA-02 | WhatsApp | Inbound creates Lead+Student AE-YYYY000001 | `webhook generateStudentId` | `Student`, `Lead` | send from new number | BLOCKED | needs live WA |
| WA-03 | WhatsApp | Document via WA → FileMetadata+OcrJob+Student | `whatsapp/document-upload`, `marketing/whatsapp-doc-upload` | `FileMetadata`, `OcrJob` | send doc | BLOCKED | needs live WA |
| WA-04 | WhatsApp | After-hours AI with memory (phone+id) | `ai-whatsapp-engine.detectLanguage/Intent/Sentiment`, `whatsapp-followup-engine` | `Student`, `AloApplication` | send Bangla+English after 18:00 | NOT_TESTED | language PASS, memory BLOCKED |
| WA-05 | WhatsApp | OTP before private app/doc/payment/visa | — | `StudentOtpVerification` | ask visa status without OTP → masked | FAIL | OTP model missing |
| WA-06 | WhatsApp | SLA 40→20→10 + audit + overdue UI | `sla-engine.ts` (currently 30/20/10) | `CommunicationThread.slaDueAt`, cron | wait 40m check escalation | FAIL | constants wrong, cron missing |
| MKT-01 | Marketing | Manager full, 3 limited, others blocked | `MarketingUserAccess`, `marketing/* withAuth` | roles | invite 3 vs 4th + try employee access Official | FAIL | cap not enforced, Official 403 incomplete |
| MKT-02 | Marketing | Comment auto-reply + DM (Meta) + keyword | `MarketingComment` | `Meta Graph` | post comment with `IELTS` | FAIL | no Graph reply/DM code |
| MKT-03 | Marketing | Brand logo gate + #E8501A → image | `brand-assets/route.ts`, `CampaignPost.brandAssetApplied` | `BrandAsset LOGO` | create post without logo → 400 | FAIL | non-blocking today |
| MKT-04 | Marketing | Post approvals gate | `MarketingApproval` | `CampaignPost.status` | publish without approve → 403 | FAIL | publish not gated |
| MKT-05 | Marketing | 7-platform post fields + sizes | `CampaignPost` | `sharp` maybe | create FB 1080x1080 | FAIL | sizes/String dates |
| MKT-06 | Marketing | n8n ON/OFF + auto sync | `N8nWorkflow`, `lib/n8n.ts` | n8n webhook | toggle OFF → no trigger | FAIL | no manager UI |
| INT-01 | Interview | Schedule + AI questions + Zoom | `api/interviews`, `api/interview-questions`, `knowledge-center` | Zoom/Meet creds | schedule + cancel | BLOCKED | needs creds |
| SEC-01 | Security | CSRF/XSS/SQLi/SSRF/headers | `lib/webhook-validator`, `token-encryption`, `file-validator` | Caddy HTTPS, headers | `npm audit`, zap | NOT_TESTED | see SECURITY_AUDIT |
| UI-01 | UI/UX | Brand #F37021/#0066CC/#FFB347, Montserrat/Open Sans, max-w-7xl, h-12/rounded-xl | `src/app/globals.css`, `components/ui/button.tsx` | Tailwind | visual diff | FAIL | actual orange #E8501A/#F37021 mismatch, heights inconsistent |
| PERF-01 | Performance | API <500ms, page <2s | `next build`, `recharts` lazy | prod data | `autocannon` | NOT_TESTED | needs prod load |
| AUTO-01 | Automation | No duplicate on double run | `upsert` + `@@unique`, idempotency keys | DB transactions | run `whatsapp webhook` twice same id | NOT_TESTED | See AUTOMATION_AUDIT |

**Totals:** 146 critical | **PASS:** 12 | **FAIL:** 27 | **BLOCKED:** 31 | **NOT_TESTED:** 76 — *critical FAIL/BLOCKED exist → not production-ready (see readiness).*

> Full per-route/per-API rows are horizonally listed in `FINAL_API_ROUTE_AUDIT.md` (748 rows) + `FINAL_FRONTEND_ROUTE_AUDIT.md` (336 rows) which reference these IDs.
