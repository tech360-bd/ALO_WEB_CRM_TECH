#!/usr/bin/env bash
set -e
echo "=== ALO cPanel WhatsApp Verification ==="

DB_USER="${DB_USER:-aloeduca_admin}"
DB_NAME="${DB_NAME:-aloeduca_alo_crm}"
DB_HOST="${DB_HOST:-localhost}"

echo "1. php -l Services (if php available)"
if command -v php >/dev/null 2>&1; then
  for f in alo-cpanel/app/Services/*.php alo-cpanel/api/*.php alo-cpanel/cron/*.php; do
    echo "  checking $f"
    php -l "$f"
  done
else
  echo "  php not found in sandbox — skip syntax check (CI will run)"
fi

echo "2. schema.sql exists & contains whatsapp tables"
grep -q "CREATE TABLE IF NOT EXISTS alo_whatsapp_numbers" alo-cpanel/database/schema.sql && echo "  ✓ alo_whatsapp_numbers found" || (echo "  ✗ missing alo_whatsapp_numbers" && exit 1)
grep -q "whatsapp_conversations" alo-cpanel/database/schema.sql && echo "  ✓ whatsapp_conversations found"
grep -q "student_documents" alo-cpanel/database/schema.sql && echo "  ✓ student_documents found"

echo "3. seed_alo_whatsapp_numbers.sql exists"
test -f alo-cpanel/database/seed_alo_whatsapp_numbers.sql && echo "  ✓ seed file exists" || exit 1
grep -q "01805020100" alo-cpanel/database/seed_alo_whatsapp_numbers.sql && echo "  ✓ 01805020100 in seed"
wc -l alo-cpanel/database/seed_alo_whatsapp_numbers.sql

echo "4. .env.example checks"
test -f alo-cpanel/.env.example && echo "  ✓ alo-cpanel/.env.example exists"
grep -q "WHATSAPP_GRAPH_VERSION=v20.0" alo-cpanel/.env.example && echo "  ✓ GRAPH v20.0"
grep -q "ALO_MAIN_WHATSAPP_NUMBER=01805020100" alo-cpanel/.env.example && echo "  ✓ ALO_MAIN 01805020100"
grep -q "ALO_COO_WHATSAPP_NUMBER=01805020101" alo-cpanel/.env.example && echo "  ✓ ALO_COO 01805020101"

echo "5. Webhook exists"
test -f alo-cpanel/api/whatsapp-webhook.php && echo "  ✓ webhook api exists"
test -f alo-cpanel/public/api/whatsapp-webhook.php && echo "  ✓ webhook public exists"
grep -q "hub_challenge" alo-cpanel/api/whatsapp-webhook.php && echo "  ✓ GET verification"
grep -q "whatsapp_message_id" alo-cpanel/api/whatsapp-webhook.php && echo "  ✓ idempotency"

echo "6. Services exist"
for s in AloWhatsAppNumberService WhatsAppCloudService StudentAutoCreateService WhatsAppFollowupService SupportEscalationService WhatsAppSlaService WhatsAppDocumentIngestionService DocumentAIExtractionService DocumentSecurityService MessageRouterService; do
  test -f "alo-cpanel/app/Services/${s}.php" && echo "  ✓ $s" || echo "  ✗ missing $s"
done

echo "7. Cron files"
for c in whatsapp_followup_sequence whatsapp_sla_monitor whatsapp_retry_failed whatsapp_cleanup daily_summary; do
  test -f "alo-cpanel/cron/${c}.php" && echo "  ✓ $c.php" || echo "  ✗ $c missing"
done

echo "8. Number pool 20-row check (if DB available)"
if command -v mysql >/dev/null 2>&1 && mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -e "SELECT 1" "$DB_NAME" >/dev/null 2>&1; then
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" -e "SELECT phone_number, owner_type, is_default_sender, is_complaint_number, is_followup_sender, is_24_7_support_number FROM alo_whatsapp_numbers ORDER BY phone_number;"
  COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" -N -e "SELECT COUNT(*) FROM alo_whatsapp_numbers;")
  echo "  Count: $COUNT (expect 20)"
  test "$COUNT" = "20" && echo "  ✓ 20 rows" || echo "  ✗ not 20"
else
  echo "  DB not reachable in sandbox — skip live check"
fi

echo "9. Manual scenarios checklist"
cat <<'SCENARIOS'
  [ ] 1. New lead WA → AE-YYYYxxxx + portal invite from 01805020100
  [ ] 2. AI replies in user language, handover on "human"
  [ ] 3. Counselor outbound → resolved sender or main 01805020100
  [ ] 4. Followups Day 3/7/14/21/25/30 from 01805020100, paused on reply
  [ ] 5. SLA 30/20/10 → branch_manager → CEO → global alarm + sound
  [ ] 6. 24/7 01805020101 only via SupportEscalationService::share24x7Number
  [ ] 7. Document image/pdf → private storage + AI extraction
  [ ] 8. Forward document via WA to external → blocked + incident
  [ ] 9. Delete message/note → crm_delete_requests approval
SCENARIOS

echo "=== Done ==="
