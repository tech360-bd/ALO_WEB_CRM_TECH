# ALO Education — Integration Guide

## Provider Integration Status

| Provider | Code Status | OAuth | Webhook | Live Test |
|----------|-------------|-------|---------|-----------|
| WhatsApp Business Cloud API | ✅ Complete | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| Facebook Pages / Meta Graph | ✅ Complete | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| Facebook Messenger | ✅ Complete | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| Instagram Business | ✅ Complete | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| Telegram Bot | ✅ Complete | ⏳ Config | ✅ Ready | ⏳ Pending |
| LinkedIn Company | ✅ Complete | ⏳ Pending | N/A | ⏳ Pending |
| Google Business Profile | ✅ Placeholder | ⏳ Pending | N/A | ⏳ Pending |
| Gmail / Google Workspace | ✅ Complete | ⏳ Pending | N/A | ⏳ Pending |
| Outlook / Microsoft 365 | ✅ Placeholder | ⏳ Pending | N/A | ⏳ Pending |
| SMS Gateway | ✅ Complete | ⏳ Config | N/A | ⏳ Pending |
| SMTP Email | ✅ Complete | ⏳ Config | N/A | ⏳ Pending |
| n8n Workflow Engine | ✅ Complete | ⏳ Config | ✅ Ready | ⏳ Pending |
| z-ai-web-dev-sdk (AI) | ✅ Active | ✅ Connected | N/A | ✅ Working |

## Setup Instructions

### WhatsApp Business Cloud API
1. Register at https://business.whatsapp.com/
2. Get Business token and Phone Number ID
3. Set in `.env`: `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
4. Configure webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
5. Set verify token: `WHATSAPP_VERIFY_TOKEN`

### Facebook/Meta Graph API
1. Create app at https://developers.facebook.com/
2. Get Page Access Token
3. Set in `.env`: `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_APP_SECRET`
4. Configure webhook for Pages

### Instagram Business
1. Connect Instagram Business account to Facebook Page
2. Use Meta Graph API with Instagram permissions
3. Set `INSTAGRAM_ACCESS_TOKEN` in `.env`

### SMTP Email
1. Configure SMTP server (Gmail, SendGrid, AWS SES)
2. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in `.env`
3. Set `EMAIL_FROM` for outgoing emails

### SMS Gateway
1. Sign up with SMS provider (e.g., Twilio, Vonage)
2. Set `SMS_GATEWAY_API_KEY` and `SMS_SENDER_ID` in `.env`

### n8n Workflow
1. Deploy n8n on your server
2. Create workflows with webhook triggers
3. Add webhook URLs in Marketing Dashboard → n8n Automation tab
