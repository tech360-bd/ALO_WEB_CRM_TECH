> Deployment notice (2026-10-01): the instructions below are historical. The only production target is managed cPanel Node.js. See the root `CPANEL-DEPLOYMENT-GUIDE.md`; hosting configuration and live verification remain BLOCKED.

# 🚀 ALO EDUCATION CRM — PRODUCTION DEPLOYMENT README

## 📌 ENVIRONMENT & SYSTEM SPECIFICATION
- **Domain Target**: `https://aloeducation.com`
- **Application Runtime**: Node.js 22 (Production Mode)
- **Framework**: Next.js 16.2.12 (Standalone Output Engine)
- **Database Engine**: MySQL Server 8.0.37 (utf8mb4 / utf8mb4_unicode_ci)
- **cPanel Username**: `aloeduca`
- **Application Root**: `/home/aloeduca/alo-web-crm`
- **Startup Entrypoint**: `server.js`

---

## 🛠️ QUICK INSTALLATION STEPS FOR CPANEL

### Step 1: Create Shared & Delivery Directories via SSH
```bash
ssh aloeduca@aloeducation.com
mkdir -p /home/aloeduca/alo-web-crm \
         /home/aloeduca/alo-web-crm-shared/backups \
         /home/aloeduca/alo-web-crm-shared/uploads \
         /home/aloeduca/alo-web-crm-shared/logs \
         /home/aloeduca/alo-web-crm-shared/private-documents \
         /home/aloeduca/alo_private_delivery

chmod 700 /home/aloeduca/alo-web-crm-shared /home/aloeduca/alo_private_delivery
```

### Step 2: Upload Delivery ZIP Package
Upload `ALO_EDUCATION_PRODUCTION_DEPLOYMENT.zip` into `/home/aloeduca/alo_private_delivery/`.

### Step 3: Unpack & Configure Environment
```bash
cd /home/aloeduca/alo-web-crm
unzip -o /home/aloeduca/alo_private_delivery/ALO_EDUCATION_PRODUCTION_DEPLOYMENT.zip

# Symlink private .env file
ln -sfn /home/aloeduca/alo-web-crm-shared/.env /home/aloeduca/alo-web-crm/.env
```

### Step 4: Deploy Database Migrations to MySQL 8
```bash
cd /home/aloeduca/alo-web-crm
npx prisma generate
npx prisma migrate deploy
```

### Step 5: Start Node.js Application in cPanel
1. Open cPanel > **Setup Node.js App**.
2. Select Node.js version **22**.
3. Set Application root to **`alo-web-crm`**.
4. Set Application URL to **`aloeducation.com`**.
5. Set Application startup file to **`server.js`**.
6. Click **Restart Application**.

---

## 🔐 SECURITY & PERMISSIONS
- `alo-web-crm-shared/`: Restricted mode `700` (Private).
- `.env`: Restricted permissions `600` (Owner read/write only).
- Never place source code or `.env` files in `public_html/`.
