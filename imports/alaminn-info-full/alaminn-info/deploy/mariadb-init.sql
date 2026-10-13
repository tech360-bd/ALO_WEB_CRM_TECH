-- ─────────────────────────────────────────────────────────────────
-- Alaminn.info — MariaDB 10.11 initialisation script
-- Target: Ubuntu 22.04 LTS + Nginx + MariaDB
-- ─────────────────────────────────────────────────────────────────
-- Run as the MariaDB root user (or a user with GRANT privileges):
--
--   sudo mariadb < deploy/mariadb-init.sql
--   (or)  sudo mysql -u root -p < deploy/mariadb-init.sql
--
-- This script is IDEMPOTENT: it uses IF NOT EXISTS so re-running
-- is safe. It creates:
--   • database  : alaminn_info  (utf8mb4 / utf8mb4_unicode_ci)
--   • user      : alaminn_app   (localhost + 127.0.0.1 only)
--   • grants    : ALL on alaminn_info.* (least privilege)
--
-- ─── CHANGE THE PASSWORD BELOW BEFORE RUNNING ───────────────────
-- Replace 'CHANGE_ME_STRONG_PASSWORD' with a 32+ char random string:
--   openssl rand -base64 32
-- ─────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `alaminn_info`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create the application user (localhost-only — the Node/Bun app
-- and MariaDB run on the same host, so no remote access is needed).
CREATE USER IF NOT EXISTS 'alaminn_app'@'127.0.0.1'
  IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

CREATE USER IF NOT EXISTS 'alaminn_app'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

-- Grant full access to the application database only.
GRANT ALL PRIVILEGES ON `alaminn_info`.*
  TO 'alaminn_app'@'127.0.0.1';

GRANT ALL PRIVILEGES ON `alaminn_info`.*
  TO 'alaminn_app'@'localhost';

-- The app needs to create/drop tables during `prisma db push` and
-- migrations. The ALL privilege above covers this. Do NOT grant
-- GLOBAL privileges (SUPER, FILE, etc.) — least privilege.

FLUSH PRIVILEGES;

-- ─────────────────────────────────────────────────────────────────
-- VERIFY (optional, run after):
--   mariadb -u alaminn_app -p alaminn_info -e "SELECT 1;"
--
-- Then set in /var/www/alaminn-info/.env:
--   DATABASE_URL="mysql://alaminn_app:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:3306/alaminn_info"
-- ─────────────────────────────────────────────────────────────────
