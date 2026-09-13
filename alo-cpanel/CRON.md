# Cron Jobs — ALO WhatsApp (cPanel)

Set in cPanel → Cron Jobs (or `crontab -e` on VPS). Use `/usr/local/bin/php` path; adjust `HOME` dir.

```cron
# Followup sequence — daily 10:00 Asia/Dhaka, from 01805020100
0 10 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_followup_sequence.php >> /home/aloeduca/logs/followup.log 2>&1

# Legacy alias (keep for backward compat)
0 10 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_followup.php >> /home/aloeduca/logs/followup.log 2>&1

# SLA monitor — every 5 minutes, office hours Sat-Thu 09-18, Fri closed
*/5 * * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_sla_monitor.php >> /home/aloeduca/logs/sla.log 2>&1

# Retry failed WA sends — every 10 minutes
*/10 * * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_retry_failed.php >> /home/aloeduca/logs/whatsapp_retry.log 2>&1

# Cleanup old jobs — daily 02:00
0 2 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_cleanup.php >> /home/aloeduca/logs/cleanup.log 2>&1

# Daily summary — 18:30
30 18 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/daily_summary.php >> /home/aloeduca/logs/daily.log 2>&1

# Existing ALO crons (keep)
0 9 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/followups.php
0 8 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/reminders.php
*/30 * * * * /usr/local/bin/php /home/aloeduca/public_html/cron/notifications.php
0 7 * * 1 /usr/local/bin/php /home/aloeduca/public_html/cron/marketing.php
```

Verify:
```bash
crontab -l
php cron/whatsapp_sla_monitor.php
php cron/whatsapp_followup_sequence.php --dry-run
tail -f ~/logs/sla.log
```

`cron_logs` table stores last run status per job.
