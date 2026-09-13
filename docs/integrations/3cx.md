# 3CX Telephony Integration

## Architecture
3CX PBX → ALO Integration API → ALO CRM → Database → AI → Human Approval → CRM Workflow

## Setup
1. Set env vars: `THREECX_BASE_URL`, `THREECX_API_KEY`, `THREECX_WEBHOOK_SECRET`
2. Configure 3CX webhook URL: `https://aloeducation.com/api/integrations/3cx/webhooks`
3. Map extensions: `POST /api/integrations/3cx/extensions`
4. Test connection: `POST /api/integrations/3cx/test-connection`

## Endpoints
| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/integrations/3cx/health` | GET | Staff | Connection status |
| `/api/integrations/3cx/contact-lookup` | GET | Staff | Phone → CRM entity |
| `/api/integrations/3cx/contact-search` | GET | Staff | Search by phone/email/name |
| `/api/integrations/3cx/call/journal` | POST | Webhook | Idempotent call journaling |
| `/api/integrations/3cx/sms/journal` | POST | Webhook | SMS journaling |
| `/api/integrations/3cx/whatsapp/journal` | POST | Webhook | WhatsApp journaling |
| `/api/integrations/3cx/chat/journal` | POST | Webhook | Chat journaling |
| `/api/integrations/3cx/webhooks` | POST | Webhook | Generic webhook receiver |
| `/api/integrations/3cx/extensions` | GET/POST | Staff/Admin | Extension mapping |
| `/api/integrations/3cx/extensions/[id]` | DELETE | Admin | Unmap extension |
| `/api/integrations/3cx/click-to-call` | POST | Staff | Initiate call |
| `/api/integrations/3cx/dashboard` | GET | Admin | Real stats |
| `/api/integrations/3cx/test-connection` | POST | Admin | Real connectivity test |
| `/api/integrations/3cx/config` | GET/POST | Super Admin | Config management |

## Webhook Security
- HMAC SHA-256 signature verification (X-Hub-Signature-256 header)
- Idempotency via WebhookEvent + PhoneCallLog.providerEventId @unique

## RBAC
- Super Admin: full control
- Admin: operational management
- Counselor: own communications
