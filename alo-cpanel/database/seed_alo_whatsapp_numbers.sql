-- ============================================================
-- Seed ALO Official WhatsApp Number Pool 01805020100-01805020119
-- Safe: INSERT IGNORE / ON DUPLICATE KEY UPDATE — do not delete existing
-- Run: mysql -u USER -p DB < database/seed_alo_whatsapp_numbers.sql
-- ============================================================

SET NAMES utf8mb4;

INSERT INTO alo_whatsapp_numbers (phone_number, normalized_phone, display_name, owner_type, is_default_sender, is_complaint_number, is_followup_sender, is_24_7_support_number, is_active) VALUES
('01805020100', '8801805020100', 'ALO Main WhatsApp / Complaint / Follow-up', 'main', 1, 1, 1, 0, 1),
('01805020101', '8801805020101', 'COO WhatsApp / 24/7 Support', 'coo', 0, 0, 0, 1, 1)
ON DUPLICATE KEY UPDATE
    normalized_phone = VALUES(normalized_phone),
    display_name = VALUES(display_name),
    owner_type = VALUES(owner_type),
    is_default_sender = VALUES(is_default_sender),
    is_complaint_number = VALUES(is_complaint_number),
    is_followup_sender = VALUES(is_followup_sender),
    is_24_7_support_number = VALUES(is_24_7_support_number),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO alo_whatsapp_numbers (phone_number, normalized_phone, display_name, owner_type, is_active) VALUES
('01805020102', '8801805020102', 'ALO Employee WhatsApp 02', 'employee', 1),
('01805020103', '8801805020103', 'ALO Employee WhatsApp 03', 'employee', 1),
('01805020104', '8801805020104', 'ALO Employee WhatsApp 04', 'employee', 1),
('01805020105', '8801805020105', 'ALO Employee WhatsApp 05', 'employee', 1),
('01805020106', '8801805020106', 'ALO Employee WhatsApp 06', 'employee', 1),
('01805020107', '8801805020107', 'ALO Employee WhatsApp 07', 'employee', 1),
('01805020108', '8801805020108', 'ALO Employee WhatsApp 08', 'employee', 1),
('01805020109', '8801805020109', 'ALO Employee WhatsApp 09', 'employee', 1),
('01805020110', '8801805020110', 'ALO Employee WhatsApp 10', 'employee', 1),
('01805020111', '8801805020111', 'ALO Employee WhatsApp 11', 'employee', 1),
('01805020112', '8801805020112', 'ALO Employee WhatsApp 12', 'employee', 1),
('01805020113', '8801805020113', 'ALO Employee WhatsApp 13', 'employee', 1),
('01805020114', '8801805020114', 'ALO Employee WhatsApp 14', 'employee', 1),
('01805020115', '8801805020115', 'ALO Employee WhatsApp 15', 'employee', 1),
('01805020116', '8801805020116', 'ALO Employee WhatsApp 16', 'employee', 1),
('01805020117', '8801805020117', 'ALO Employee WhatsApp 17', 'employee', 1),
('01805020118', '8801805020118', 'ALO Employee WhatsApp 18', 'employee', 1),
('01805020119', '8801805020119', 'ALO Employee WhatsApp 19', 'employee', 1)
ON DUPLICATE KEY UPDATE
    normalized_phone = VALUES(normalized_phone),
    display_name = VALUES(display_name),
    owner_type = VALUES(owner_type),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

-- Verify
-- SELECT phone_number, display_name, owner_type, is_default_sender, is_complaint_number, is_followup_sender, is_24_7_support_number, is_active FROM alo_whatsapp_numbers ORDER BY phone_number;
