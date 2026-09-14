# FINAL_INTEGRATION_AUDIT — ALO Education
**Date:** 2026-09-14

| Integration | Channel | Credential (.env key) | Health check | Result | Evidence |
|---|---|---|---|---|---|
| **WhatsApp Cloud API** | official `01805020100` | `WHATSAPP_TOKEN/NUMBER_ID/APP_SECRET/VERIFY_TOKEN` | `GET /api/whatsapp/webhook` verify + HMAC `x-hub-signature-256` | PASS code, BLOCKED live | `api/whatsapp/webhook/route.ts` verifySignature → 401 on bad sig (unit) |
| **WhatsApp outbound + status** | delivery/read | same + `graph.facebook.com/v18.0/{id}/messages` | status table `WhatsAppMessageStatus` | NOT_TESTED live | status sync code present |
| **Facebook Graph / Instagram / Messenger** | comment/DM | `FACEBOOK_APP_ID/SECRET`, `META_API_KEY` | OAuth `api/facebook/auth+callback`, `communications/social-accounts` | FAIL | OAuth scaffolds, FB webhook verify missing, no auto-reply/DM Graph call |
| **Email SMTP** | `mail.aloeducation.com:465` | `MAIL_HOST/PORT/USER/PASS`, `OfficialEmail` | queue `NotificationEngine` channel EMAIL | BLOCKED | `email-service.ts` present, no live send |
| **Firebase Admin** | push/storage | `FIREBASE_PROJECT_ID/PRIVATE_KEY` | `lib/firebase-admin.ts` | BLOCKED | not exercised |
| **AI — ZAI / OpenRouter / Groq / Ollama** | `glm-4-flash/plus`, `groq` | `ZAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY` | `lib/ai.ts` routing + fallback `ai-safety.ts` | NOT_TESTED live | prompt calls exist (`generateText` with glm-4-flash), fallback not exercised without keys |
| **MySQL / Prisma** | `aloeduca_alo_education` | `DATABASE_URL` | `prisma validate/generate` + `db.ts` pool | PASS static, BLOCKED live | `validate PASS` |
| **Caddy + PM2** | reverse_proxy 3044 | — | `ecosystem.config.cjs` + `Caddyfile` | PASS config | files inspected (not live health) |
| **Storage pools** | STUDENT_PARTNER/OFFICIAL/OPERATIONAL | `STORAGE_POOL_C` | `FileMetadata + storage-service.ts` | NOT_TESTED | pool model + service exist |
| **n8n** | webhook manager | `N8nWorkflow.webhookUrl/Secret` | `lib/n8n.ts` trigger | FAIL | no manager UI, no trigger wiring |
| **Calendar/Meet** | Google/Zoom for interviews | `GOOGLE_CLIENT_ID`, Zoom token | `api/interviews` | BLOCKED | needs OAuth creds |
| **Payment (bKash/SSLCommerz etc.)** | payment gateway | — | `Payment` model | NOT_TESTED | model only |

**Partner restriction (critical):** `PARTNER_INBOUND` must hide student contact + route via partner + block `ALO→student` direct; `PARTNER_OUTBOUND` must verify tag+university+commission+ownership. Frontend-only hides are not sufficient — need API/export/job guards (current: FAIL, only frontend hides).

**Missing access to verify live:** Meta tokens, WhatsApp token, SMTP pass, Firebase key, Google/Zoom creds — each requires live smoke with real credential (documented BLOCKED).
