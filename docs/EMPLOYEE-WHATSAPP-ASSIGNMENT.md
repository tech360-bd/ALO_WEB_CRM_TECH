# ALO Employee ↔ WhatsApp Number Assignment

## Pool
- **01805020100** — Main / Complaint / Follow-up (default sender, `is_default_sender=1`, `is_complaint_number=1`, `is_followup_sender=1`)
- **01805020101** — COO / 24/7 Support (`is_24_7_support_number=1`, `owner_type='coo'`)
- **01805020102-01805020119** — Employee pool (18 numbers, `owner_type='employee'`)

All stored in `alo_whatsapp_numbers` as both `phone_number` (018...) and `normalized_phone` (880...).

## Assignment model
- `alo_whatsapp_numbers.owner_user_id` — current owner (nullable for pool numbers)
- `whatsapp_number_assignments` — history: `(whatsapp_number_id, user_id, assignment_type)` where `assignment_type` in `owner,sender,receiver,fallback,manager,complaint,support_24_7`
- `whatsapp_number_audit_logs` — every change with `old_values/new_values` + IP.

## Who can assign
- `super_admin` / `admin` only. UI at `/app/Views/whatsapp/numbers.php` + API `POST /api/whatsapp-numbers.php`.

## Routing
- `whatsapp_routing_rules` — `source_type` (`new_lead,complaint,followup,branch,employee,partner,student,urgent,support_24_7,default`) → `sender_number_id` + optional `branch_id` / `receiver_user_id` / `priority`.
- Resolution order (in `AloWhatsAppNumberService::resolveSender`):
  1. `followup` → 01805020100 always
  2. `complaint` → 01805020100
  3. `support_24_7`/`urgent` → 01805020101
  4. `routing_rules` match (lowest `priority` wins)
  5. Employee's own assigned number (if source allows)
  6. Fallback 01805020100

## Verification
```sql
SELECT phone_number, owner_type, is_default_sender, is_complaint_number, is_followup_sender, is_24_7_support_number, is_active
FROM alo_whatsapp_numbers ORDER BY phone_number;
-- must return 20 rows, 01805020100 flags 1/1/1, 01805020101 flag 24/7=1
SHOW TABLES LIKE 'alo_whatsapp_numbers';
SHOW TABLES LIKE 'whatsapp_number_assignments';
```

Seed idempotent:
```bash
mysql -u aloeduca_admin -p aloeduca_alo_crm < database/seed_alo_whatsapp_numbers.sql
```
