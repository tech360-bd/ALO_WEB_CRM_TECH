# WhatsApp Setup — ALO Education (Meta Cloud API)

**Official tokens only** — never commit, never store employee personal credentials. Use supported Graph API v18.

## Env (VPS `/root/alo-live/.env`, never GitHub)

```
WHATSAPP_TOKEN= # or WHATSAPP_ACCESS_TOKEN (long-lived)
WHATSAPP_PHONE_NUMBER_ID= # from Meta app → WhatsApp → API setup
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_APP_SECRET= # for webhook HMAC SHA256
WHATSAPP_VERIFY_TOKEN= # random ≥32, used for GET verification
WHATSAPP_BUSINESS_PHONE= # e.g. 8801805020100
WHATSAPP_GRAPH_VERSION=v18.0
ALO_MAIN_WHATSAPP_NUMBER=01805020100
ALO_COO_WHATSAPP_NUMBER=01805020101
ALO_EMPLOYEE_WHATSAPP_START=01805020102
ALO_EMPLOYEE_WHATSAPP_END=01805020119
```

Meta Dashboard: Developers → Create App → WhatsApp → API Setup → get phone ID, business ID, token. Add webhook `https://aloeducation.com/api/crm/ucc/webhooks/whatsapp` + `https://aloeducation.com/api/whatsapp/webhook` — verify `WHATSAPP_VERIFY_TOKEN`, subscribe `messages`. HMAC verify `X-Hub-Signature-256` with `WHATSAPP_APP_SECRET` — fail closed 403 if mismatch, 500 if secret not configured (no hardcoded fallback `alo_education_verify_token_2026`).

## Pool & Assignment

20 official numbers 01805020100-119 in `WhatsAppOfficialNumber` + `WhatsAppNumberAssignmentAudit`. `EmployeeCommunicationProfile.whatsappAccess` + `whatsappNumberId` + `assignedPages JSON` controls per-employee assignment. `UccRoutingRule` + `UccOfficeHours` routes. See `docs/EMPLOYEE-WHATSAPP-ASSIGNMENT.md`.

## Inbox & History

`UccConversation` channel `whatsapp`, `assignedToUserId`, `UccMessage`, `WhatsAppMessageArchive`, `WhatsAppMessageStatus` (sent/delivered/read), `WhatsAppRetryQueue`, `WhatsAppAnalyticsDaily`. Human approval for sensitive AI replies.

## Test

```
curl -X GET "https://aloeducation.com/api/crm/ucc/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=123"
# → 123 if ok else 403
curl -X POST https://aloeducation.com/api/whatsapp/send -H "Authorization: Bearer $SESSION" -d '{"to":"8801...","text":"test"}'
```

Never claim all messages accessible without provider permissions.
