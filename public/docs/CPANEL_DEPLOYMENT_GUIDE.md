# 🌐 ALO EDUCATION — CPANEL DEPLOYMENT GUIDE

## 1. CPANEL APPLICATION SETTINGS
- **cPanel Username**: `aloeduca`
- **Node.js Version**: `22`
- **Application Mode**: `Production`
- **Application Root**: `alo-web-crm` (`/home/aloeduca/alo-web-crm`)
- **Application URL**: `https://aloeducation.com`
- **Startup File**: `server.js`

---

## 2. DATABASE CONFIGURATION (MySQL 8.0.37)
- **Host**: `localhost` (Port: `3306`)
- **Database Name**: `aloeduca_alo_education`
- **Username**: `aloeduca_ALO_final_web_crm`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`

Execute character set configuration in cPanel phpMyAdmin / MySQL CLI:
```sql
ALTER DATABASE `aloeduca_alo_education`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

## 3. FILE SYSTEM & PRIVATE SHARED PATHS

| Category | Path | Access Permission |
|---|---|---|
| **Application Root** | `/home/aloeduca/alo-web-crm` | `755` (dirs) / `644` (files) |
| **Private Shared Dir** | `/home/aloeduca/alo-web-crm-shared` | `700` (Strict Private) |
| **Production Env File** | `/home/aloeduca/alo-web-crm-shared/.env` | `600` (Read/Write Owner) |
| **Database Backups** | `/home/aloeduca/alo-web-crm-shared/backups` | `700` (Strict Private) |
| **Student Uploads** | `/home/aloeduca/alo-web-crm-shared/uploads` | `700` (Gated Access) |
| **Private Documents** | `/home/aloeduca/alo-web-crm-shared/private-documents` | `700` (Gated Access) |
| **System Logs** | `/home/aloeduca/alo-web-crm-shared/logs` | `700` (System Only) |
| **Delivery Package Dir** | `/home/aloeduca/alo_private_delivery` | `700` (Strict Private) |
| **Public Web Root** | `/home/aloeduca/public_html` | `755` (Web Served) |
