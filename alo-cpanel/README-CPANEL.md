# ALO Education CRM — cPanel PHP (WhatsApp AI Automation)

Production stack: cPanel shared (or VPS), PHP 8.1+, MySQL 8.0, `Asia/Dhaka` timezone. This folder is the deploy root (`public_html`).

## Deploy
1. Upload `alo-cpanel/` contents to `~/public_html/` (or `git pull` if using VPS deploy).
2. Copy `.env.example` → `config/config.php` (or `.env` if using env loader) and fill `CHANGE_ME`.
3. Import DB:
   ```bash
   mysql -u aloeduca_admin -p aloeduca_alo_crm < database/schema.sql
   mysql -u aloeduca_admin -p aloeduca_alo_crm < database/seed.sql
   mysql -u aloeduca_admin -p aloeduca_alo_crm < database/seed_alo_whatsapp_numbers.sql
   # On existing DB:
   mysql -u aloeduca_admin -p aloeduca_alo_crm < database/upgrade_whatsapp_columns.sql
   ```
4. Verify 20-row pool:
   ```sql
   SELECT phone_number, display_name, owner_type, is_default_sender, is_complaint_number, is_followup_sender, is_24_7_support_number FROM alo_whatsapp_numbers ORDER BY phone_number;
   -- expect 01805020100 flags 1/1/1, 01805020101 flag 24/7=1, 02-19 employee
   ```
5. Set webhook in Meta → WhatsApp Cloud API:
   - URL: `https://crm.aloeducation.com/api/whatsapp-webhook.php`
   - Verify token: value of `WHATSAPP_VERIFY_TOKEN`
   - Subscribe: `messages`
6. Test webhook GET:
   ```bash
   curl "https://crm.aloeducation.com/api/whatsapp-webhook.php?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=1234"
   # must return 1234
   ```
7. Add cron jobs (see `CRON.md`).
8. Check health:
   ```bash
   curl https://crm.aloeducation.com/api/whatsapp-analytics.php
   php cron/whatsapp_sla_monitor.php
   php cron/whatsapp_followup_sequence.php
   ```

## Env
See `.env.example` (also root `.env.example`). Required:
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, `APP_TIMEZONE=Asia/Dhaka`
- `DB_*` — cPanel MySQL (user `aloeduca_admin`, db `aloeduca_alo_crm`)
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free`
- `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_GRAPH_VERSION=v20.0`
- `ALO_MAIN_WHATSAPP_NUMBER=01805020100`, `ALO_COO_WHATSAPP_NUMBER=01805020101` etc.
- `SESSION_*`, `CSRF_SECRET`, `APP_KEY`

## Security
- `.htaccess` blocks `/.env`, `/config`, `/storage`, `/database`, `/cron`.
- `storage/private_uploads` is `0750` / `0640`, never web-accessible; serve via `api/whatsapp-document-download.php`.
- `whatsapp_messages` is immutable (`crm_locked=1`); delete requires `crm_delete_requests` approval; `hidden_from_ui` flag, never hard delete.

## Modules
- Webhook (§7): `api/whatsapp-webhook.php`
- Services (§8-9): `app/Services/{WhatsAppCloudService, AloWhatsAppNumberService, StudentAutoCreateService, ...}`
- Number pool UI: `app/Views/whatsapp/numbers.php` + API `api/whatsapp-numbers.php`
- SLA: `app/Services/WhatsAppSlaService.php` + `cron/whatsapp_sla_monitor.php`
- Followup: `app/Services/WhatsAppFollowupService.php` + `cron/whatsapp_followup_sequence.php`
- Documents: `app/Services/WhatsAppDocumentIngestionService.php` etc.

## Manual scenarios (§30) — test each before handover
1. New lead WhatsApp → student auto-created `AE-YYYYxxxx` + portal invite from 01805020100
2. AI replies in user language, handover on "talk to human"
3. Counselor outbound uses resolved sender or main 01805020100
4. Followups Day 3/7/14/21/25/30 from 01805020100 only, paused on reply
5. SLA 30/20/10 escalation → branch_manager → CEO → global alarm
6. 24/7 number 01805020101 only shared via `SupportEscalationService::share24x7Number`
7. Document image/pdf → `student_documents` private + AI extraction queue
8. Attempt to forward document via WhatsApp to external → blocked + incident
9. Delete message/note → `crm_delete_requests` required, `hidden_from_ui` not hard delete

## Rollback
See `docs/PRODUCTION-ROLLBACK.md` — keep `database/schema.sql` at commit `a97a2c7` backup; restore `storage/private_uploads` from `backups/`.

