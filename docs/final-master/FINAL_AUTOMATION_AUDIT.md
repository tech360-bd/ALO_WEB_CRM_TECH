# FINAL_AUTOMATION_AUDIT — ALO Education
**Date:** 2026-09-14

| Category | Workflow | Schedule | Idempotency / uniqueness | History/Audit | Duplicate-on-rerun test | Result |
|---|---|---|---|---|---|---|
| AI agents | ZAI/Groq routing, SOP/CV/interview/lead scoring | on demand | key: `messageId` / `documentId` | `MarketingAuditLog` | Not run (BLOCKED) | NOT_TESTED |
| Marketing | `MarketingCalendar` scheduled post | `scheduledAt String` (should DateTime) | no unique on (contentId,scheduledAt) | `MarketingApproval` | Would duplicate on double publish (FAIL) | FAIL |
| Follow-ups | `whatsapp-followup-engine` 3,7,14,21,25,30 | cron daily | `WhatsAppFollowUpSchedule` per student/day | audit | Not run | NOT_TESTED |
| WhatsApp SLA | `checkAndEscalateSla` 40→20→10 | `*/5 * * * *` expected but not registered | `CommunicationSlaEvent` per thread | `AuditLog` | Not run (cron missing) | FAIL |
| WhatsApp sync | inbound→Lead→Student→Timeline | per webhook `x-hub-signature` + `messageId` unique | `WHAT group` unique attempt | `WebhookEvent` | Not run (needs live) | NOT_TESTED |
| Email queues | `NotificationEngine` EMAIL/SMS | queue `sentAt/readAt` | `OfficialEmail.id` | `MarketingReport` | Retry would double-send (FAIL, no idempotency key) | FAIL |
| CRM sync | Timeline append | per inbound/outbound | `CrmTimeline` not single table | audit partial | — | FAIL |
| Interview reminders | reminders | before-start | — | — | — | NOT_TESTED |

**Double-run test (required §16):** execute each eligible workflow twice in controlled env, assert second run creates no unintended duplicates. **None executed in this audit (BLOCKED on DB+creds)** — use `transaction + @@unique + upsert` and add `idempotencyKey` (e.g., `messageId`, `contentId+scheduledAt`) before declaring PASS.

**Fixes before prod:** fix `CampaignPost.scheduledAt DateTime + @@unique`, add SLA cron `*/5` Asia/Dhaka, add email `idempotencyKey` (messageId+recipient), centralize Timeline `CrmTimeline` single append with audit.
