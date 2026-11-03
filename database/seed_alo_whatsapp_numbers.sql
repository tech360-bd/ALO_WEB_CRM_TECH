-- =============================================================================
-- ALO Education — requested official WhatsApp number registry (20 records)
-- =============================================================================
-- These are CONFIGURATION RECORDS ONLY. They are the numbers requested by ALO
-- for the registry; inserting them does NOT prove number ownership, Meta
-- WhatsApp Business Platform registration, or Cloud API connectivity.
--
--   * Every row is inserted as `connectionStatus = 'disconnected'` with blank
--     Meta identifiers. No row can send through the Cloud API until an
--     authorized administrator configures a verified `phone_number_id` /
--     WABA id and a provider connection check succeeds.
--   * Access tokens are NEVER stored in this file or in the database.
--   * `ON DUPLICATE KEY UPDATE` is deliberately a mostly no-op: it fills only
--     an empty display name / purpose. It must NOT overwrite a configured Meta
--     identifier, a connection status, an employee assignment, a branch, a
--     department or any sender flag with a blank/default value.
--   * Safe to run repeatedly. `phoneNumber` and `normalizedPhone` are unique.
--
-- Runtime sender configuration is separate: `ALO_MAIN_WHATSAPP_NUMBER`,
-- `ALO_COO_WHATSAPP_NUMBER` and `ALO_EMPLOYEE_WHATSAPP_NUMBERS` in the
-- protected deployment environment control what the application is allowed to
-- use. See docs/WHATSAPP_NUMBER_REGISTRY.md.
-- =============================================================================

INSERT INTO `WhatsAppOfficialNumber`
  (`id`, `phoneNumber`, `normalizedPhone`, `displayName`, `ownerType`, `employeeOwnerId`, `employeeOwnerName`,
   `branch`, `department`, `metaPhoneNumberId`, `metaBusinessAccountId`, `connectionStatus`,
   `activeStatus`, `isDefaultSender`, `isComplaintSender`, `isFollowUpSender`, `isSupport247`,
   `purpose`, `createdAt`, `updatedAt`)
VALUES
  ('alo-wa-01805020100', '01805020100', '8801805020100', 'ALO Main WhatsApp', 'ALO_MAIN', '', '', '', '', '', '', 'disconnected', 'active', 1, 1, 1, 0, 'Main ALO WhatsApp; complaint; default automation and follow-up sender (unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020101', '01805020101', '8801805020101', 'COO urgent support', 'COO', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 1, 'COO WhatsApp contact; requested 24/7 urgent-support contact (unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020102', '01805020102', '8801805020102', 'Employee pool 02', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 02 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020103', '01805020103', '8801805020103', 'Employee pool 03', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 03 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020104', '01805020104', '8801805020104', 'Employee pool 04', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 04 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020105', '01805020105', '8801805020105', 'Employee pool 05', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 05 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020106', '01805020106', '8801805020106', 'Employee pool 06', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 06 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020107', '01805020107', '8801805020107', 'Employee pool 07', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 07 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020108', '01805020108', '8801805020108', 'Employee pool 08', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 08 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020109', '01805020109', '8801805020109', 'Employee pool 09', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 09 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020110', '01805020110', '8801805020110', 'Employee pool 10', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 10 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020111', '01805020111', '8801805020111', 'Employee pool 11', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 11 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020112', '01805020112', '8801805020112', 'Employee pool 12', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 12 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020113', '01805020113', '8801805020113', 'Employee pool 13', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 13 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020114', '01805020114', '8801805020114', 'Employee pool 14', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 14 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020115', '01805020115', '8801805020115', 'Employee pool 15', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 15 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020116', '01805020116', '8801805020116', 'Employee pool 16', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 16 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020117', '01805020117', '8801805020117', 'Employee pool 17', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 17 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020118', '01805020118', '8801805020118', 'Employee pool 18', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 18 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('alo-wa-01805020119', '01805020119', '8801805020119', 'Employee pool 19', 'EMPLOYEE', '', '', '', '', '', '', 'disconnected', 'active', 0, 0, 0, 0, 'Employee-assigned number pool slot 19 (unassigned, unverified)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `displayName` = IF(`displayName` = '', VALUES(`displayName`), `displayName`),
  `purpose`     = IF(`purpose` = '', VALUES(`purpose`), `purpose`),
  `id`          = `id`;
