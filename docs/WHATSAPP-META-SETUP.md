> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# WhatsApp Business Platform — Meta Cloud API Setup (ALO Education)

This guide explains how to obtain and verify the **official Meta WhatsApp Business Platform assets** required before any company number can be marked as **connected**. It does **not** invent phone_number_ids or credentials.

## Prerequisite

* A Meta Business Manager account verified for ALO Education.
* Access to [Meta for Developers](https://developers.facebook.com).
* A phone number that you legally own and can receive SMS/voice OTP (each of the 20 numbers 01805020100-01805020119 must be verified individually).

## 1. Create / verify Meta Business Manager

1. Go to https://business.facebook.com → Create Business.
2. Complete *Business Verification* (legal name, address, phone, website aloeducation.com). Meta may require trade license / NID / utility bill. Status must show **Verified**.
3. Add a second admin (COO) so lockout cannot happen.

## 2. Create a WhatsApp Business Account (WABA)

1. In Business Settings → *Accounts* → *WhatsApp Accounts* → *Add* → Create new WABA.
2. Set timezone `Asia/Dhaka`, currency `BDT`, business category `Education Management`.
3. Note the **WhatsApp Business Account ID (WABA ID)** — a numeric string like `102...`. You need it for every employee-mapping step.

## 3. Create a Meta App and add WhatsApp Cloud API

1. https://developers.facebook.com → *My Apps* → *Create App* → *Other* → *Business*.
2. Add product **WhatsApp** → Choose the WABA created above.
3. In app dashboard note **App ID** and **App Secret** (used as `WHATSAPP_APP_SECRET` for webhook signature `X-Hub-Signature-256`).

## 4. Add phone numbers to the WABA

For each of the intended numbers (01805020100, 01805020101, 01805020102 … 01805020119):

1. Business Settings → *WhatsApp Accounts* → your WABA → *Phone numbers* → *Add phone number*.
2. Enter the number in international format `+8801805020100`. Meta sends an OTP via SMS/voice.
3. Enter OTP. Meta now provisions a **`phone_number_id`** for that number — a numeric string like `123456789012345`. This is the **only** identifier the Cloud API uses. The display string `01805020100` is **not** sufficient.
4. Record: `phoneNumber = 01805020100`, `phone_number_id = 123...`, `WABA ID = 102...`, `display Name = ALO Education Main`, `quality rating`, `throughput`.

> The numbers listed in `src/lib/whatsapp-number-pool.ts` (`01805020100` main/default/complaint/follow-up, `01805020101` COO 24-h, `01805020102-01805020119` employee pool) remain **CONFIGURATION REQUIRED** until their `phone_number_id` and credentials are verified via the API.

## 5. Generate a long-lived access token

1. In the app → *WhatsApp* → *API Setup* → *Temporary token* (for testing only, expires in 24h).
2. For production, create a **System User** in Business Settings → *System users* → Add → *Admin* → Assign the WABA and the App with *Manage Phone Numbers* + *Send WhatsApp Messages*.
3. Generate a token for that system user → copy as `WHATSAPP_TOKEN` / `WHATSAPP_ACCESS_TOKEN`. Treat it like a password. Never commit it.

## 6. Configure the webhook on the VPS

The ALO app exposes:

* Verification: `GET /api/whatsapp/webhook` — must return `hub.challenge` when `hub.verify_token` matches `WHATSAPP_VERIFY_TOKEN`.
* Events: `POST /api/whatsapp/webhook` — validates `X-Hub-Signature-256` using `WHATSAPP_APP_SECRET`.

**Meta side:**

1. App Dashboard → *WhatsApp* → *Configuration* → *Webhook* → *Edit*.
2. Callback URL: `https://YOUR_VPS_HOST/api/whatsapp/webhook` (or `https://aloeducation.com/api/whatsapp/webhook`). Must be public HTTPS.
3. Verify Token: the value you set as `WHATSAPP_VERIFY_TOKEN` (a random 32-char string you generate).
4. Subscribe to fields: `messages`, `message_statuses` (sent/delivered/read/failed).

**VPS side (in `.env` on the production deploy directory, never in git):**

```ini
WHATSAPP_VERIFY_TOKEN=YOUR_RANDOM_VERIFY_TOKEN
WHATSAPP_APP_SECRET=YOUR_META_APP_SECRET
WHATSAPP_TOKEN=YOUR_LONG_LIVED_SYSTEM_USER_TOKEN
WHATSAPP_PHONE_NUMBER_ID=THE_phone_number_id_FOR_THE_DEFAULT_SENDER
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_WABA_ID
WHATSAPP_BUSINESS_PHONE=+8801805020100
```

Restart PM2: `pm2 restart alo-education --update-env` then test verification:

```bash
curl -i "https://YOUR_VPS_HOST/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_RANDOM_VERIFY_TOKEN&hub.challenge=12345"
# expect 200 and body 12345

# Signature validation: send a fake POST without valid X-Hub-Signature-256 → expect 401 when WHATSAPP_APP_SECRET is set
curl -X POST https://YOUR_VPS_HOST/api/whatsapp/webhook -H "Content-Type: application/json" -d '{}'
```

## 7. Verify connectivity without sending a real message

* In App Dashboard → *WhatsApp* → *API Setup* → *Send test message*: enter a test recipient (your own phone) and a template. **Only do this after your explicit approval** — this sends a real WhatsApp.
* In the ALO admin → *WhatsApp Analytics* dashboard, the **Connection and verification status** for the number should flip from `CONFIGURATION REQUIRED` / `disconnected` to `connected` when `metaPhoneNumberId` is saved and the last provider check succeeds. The column **Last successful provider check** timestamps this.

## 8. Assign verified `phone_number_id` to an employee

See `docs/EMPLOYEE-WHATSAPP-ASSIGNMENT.md`. Never assign a number until its `phone_number_id` is verified via the Graph API:

```bash
curl -s "https://graph.facebook.com/v18.0/PHONE_NUMBER_ID?fields=display_phone_number,verified_name,quality_rating" \
  -H "Authorization: Bearer YOUR_LONG_LIVED_SYSTEM_USER_TOKEN"
```

If this returns a `display_phone_number` matching the intended number, the ID is valid.

## 9. Hardening

* Tokens live only on the VPS `.env` and in GitHub Actions Secrets for deployment — never in browser, never in git, never in logs (the deployment workflow masks them).
* Rotate tokens quarterly: generate new system-user token, update `.env`, `pm2 restart`, revoke old token in Business Settings.
* Webhook signature failures are logged to `AloAuditLog` and `WebhookEvent` with `verified=false` for forensics.
* Idempotency: `WebhookEvent.provider+eventId` is unique — duplicate provider deliveries are ignored.

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `CONFIGURATION REQUIRED` badge on inbox send button | No `phone_number_id` for assigned number or token missing | Complete steps 4-5, save IDs in *Admin → WhatsApp Numbers*, re-test |
| Webhook verification fails `403 Invalid verify token` | `WHATSAPP_VERIFY_TOKEN` mismatch between Meta dashboard and `.env` | Use copy-paste, no trailing spaces |
| `X-Hub-Signature-256` invalid → 401 | `WHATSAPP_APP_SECRET` wrong | Re-copy from App Dashboard → App Secret |
| Message send returns `190 Invalid OAuth access token` | Token expired/ revoked | Generate new system-user token |
| ` (#100) Phone number not found` | `phone_number_id` does not belong to your WABA | Re-do step 4, ensure number is in your Business Manager |

**Do not send a real test message without explicit owner approval.** The numbers `01805020100-01805020119` are *intended routing* only until verified.
