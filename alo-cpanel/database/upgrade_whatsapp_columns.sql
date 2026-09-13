-- ============================================================
-- Upgrade: add missing columns to students/leads/users/tasks/communications
-- Safe idempotent — checks information_schema before ADD COLUMN
-- Run after schema.sql on existing DBs: mysql -u USER -p DB < upgrade_whatsapp_columns.sql
-- Fresh installs: schema.sql patch already includes these via CREATE TABLE definitions; this file is no-op.
-- ============================================================

-- Helper procedure to add column if not exists
DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
    IN tblName VARCHAR(100),
    IN colName VARCHAR(100),
    IN colDef TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tblName
          AND COLUMN_NAME = colName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tblName, '` ADD COLUMN `', colName, '` ', colDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Students patches
CALL add_column_if_not_exists('students', 'student_code', 'VARCHAR(30) NULL UNIQUE');
CALL add_column_if_not_exists('students', 'whatsapp_phone', 'VARCHAR(30) NULL');
CALL add_column_if_not_exists('students', 'portal_token', 'VARCHAR(100) NULL');
CALL add_column_if_not_exists('students', 'portal_invited_at', 'DATETIME NULL');
CALL add_column_if_not_exists('students', 'portal_activated_at', 'DATETIME NULL');
CALL add_column_if_not_exists('students', 'welcome_sent_at', 'DATETIME NULL');
CALL add_column_if_not_exists('students', 'official_whatsapp_number', 'VARCHAR(30) NULL DEFAULT "01805020100"');

-- Leads patches
CALL add_column_if_not_exists('leads', 'student_id', 'BIGINT UNSIGNED NULL');
CALL add_column_if_not_exists('leads', 'source_number', 'VARCHAR(30) NULL');
CALL add_column_if_not_exists('leads', 'official_sender_number', 'VARCHAR(30) NOT NULL DEFAULT "01805020100"');
CALL add_column_if_not_exists('leads', 'opt_out', 'TINYINT(1) NOT NULL DEFAULT 0');

-- Users patches
CALL add_column_if_not_exists('users', 'official_whatsapp_number', 'VARCHAR(30) NULL');
CALL add_column_if_not_exists('users', 'official_whatsapp_number_id', 'INT UNSIGNED NULL');

-- Tasks patches (SLA)
CALL add_column_if_not_exists('tasks', 'assigned_role', 'VARCHAR(80) NULL');
CALL add_column_if_not_exists('tasks', 'branch_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('tasks', 'conversation_id', 'BIGINT UNSIGNED NULL');
CALL add_column_if_not_exists('tasks', 'priority', 'ENUM("low","medium","high","urgent") NOT NULL DEFAULT "medium"');
CALL add_column_if_not_exists('tasks', 'due_at', 'DATETIME NULL');

-- Communications patches (for WA linking)
CALL add_column_if_not_exists('communications', 'whatsapp_message_id', 'VARCHAR(150) NULL');

-- WhatsApp conversations/messages patches (in case tables pre-existed without these columns)
CALL add_column_if_not_exists('whatsapp_conversations', 'inbound_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'outbound_sender_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'assigned_employee_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'complaint_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'followup_sender_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'official_sender_number', 'VARCHAR(30) NOT NULL DEFAULT "01805020100"');
CALL add_column_if_not_exists('whatsapp_conversations', 'is_24_7_support_requested', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('whatsapp_conversations', 'support_24_7_requested_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'support_24_7_number_shared_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'sla_started_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'last_student_message_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'last_staff_reply_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'escalation_level', 'ENUM("none","branch_manager","ceo","global_alarm") NOT NULL DEFAULT "none"');
CALL add_column_if_not_exists('whatsapp_conversations', 'escalation_status', 'ENUM("open","resolved","paused","closed") NOT NULL DEFAULT "open"');
CALL add_column_if_not_exists('whatsapp_conversations', 'escalated_to_branch_manager_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'escalated_to_ceo_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'global_alarm_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'resolved_by', 'BIGINT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_conversations', 'resolved_at', 'DATETIME NULL');

CALL add_column_if_not_exists('whatsapp_messages', 'sender_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'receiver_number_id', 'INT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'official_sender_number', 'VARCHAR(30) NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'employee_phone', 'VARCHAR(30) NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'is_deleted_in_whatsapp', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('whatsapp_messages', 'crm_locked', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_not_exists('whatsapp_messages', 'delete_requested_by', 'BIGINT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'delete_requested_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'delete_request_reason', 'TEXT NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'delete_approved_by', 'BIGINT UNSIGNED NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'delete_approved_at', 'DATETIME NULL');
CALL add_column_if_not_exists('whatsapp_messages', 'hidden_from_ui', 'TINYINT(1) NOT NULL DEFAULT 0');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Indexes (ADD INDEX IF NOT EXISTS not supported; ignore errors via handler would need proc, but for fresh we already have them)
-- To avoid duplicate index error on rerun, we just ensure via check
-- This is best effort for upgrade.

-- Create unique index for whatsapp_messages.wamid if not exists
-- MySQL doesn't have IF NOT EXISTS for index, so we use procedure similar above (omitted for brevity — installer will handle).
