> Deployment notice (2026-10-01): the instructions below are historical. The only production target is managed cPanel Node.js. See the root `CPANEL-DEPLOYMENT-GUIDE.md`; hosting configuration and live verification remain BLOCKED.

# ALO Education — Local Project README

# ALO Education — Web CRM & Consultancy Platform Deployment Guide

Follow these exact steps to deploy ALO Education on your production server.

---

### Step 1: Server Requirements Checklist
- **Operating System:** Ubuntu 22.04 LTS (or Ubuntu 20.04+)
- **Node.js:** Node.js v22.x LTS (`node -v`)
- **Package Manager:** npm 10+ (`npm -v`)
- **Database:** MySQL 8.0+ service running (`sudo systemctl status mysql`)
- **Process Manager:** PM2 installed globally (`npm install -g pm2`)
- **Web Server / Reverse Proxy:** Caddy installed (`sudo systemctl status caddy`)
- **Firewall:** Ports 80 and 443 open (`sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`)

---

### Step 2: Upload ZIP and Extract to Server
Upload the deployment package ZIP to your server target directory (e.g. `/home/aloeduca/alo-education`) and extract:
```bash
mkdir -p /home/aloeduca/alo-education
cd /home/aloeduca/alo-education
unzip alo-education-web-crm.zip
```

---

### Step 3: Copy `.env.example` to `.env` and Fill All Values
Copy the environment template and configure your production credentials:
```bash
cp .env.example .env
nano .env
```
Ensure you update:
- `DATABASE_URL` with your MySQL username, password, host, port, and database name.
- `NEXTAUTH_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`.
- `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`.
- Mail and AI provider keys as needed.

---

### Step 4: Create MySQL Database and User with Full Permissions
Log into MySQL on your server and run:
```sql
CREATE DATABASE IF NOT EXISTS aloeduca_alo_education CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'aloeduca_ALO_final_web_crm'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON aloeduca_alo_education.* TO 'aloeduca_ALO_final_web_crm'@'localhost';
FLUSH PRIVILEGES;
```

---

### Step 5: Run `bash deploy.sh`
Execute the automated deployment script to install dependencies, push database schema, compile production assets, and start PM2:
```bash
bash deploy.sh
```

---

### Step 6: Edit Caddyfile with Your Real Domain
Open `Caddyfile` and replace `yourdomain.com` with your production domain name:
```bash
nano Caddyfile
```
Example:
```caddyfile
aloeducation.com {
    encode gzip zstd
    log {
        output file /var/log/caddy/alo_education_access.log
    }
    reverse_proxy 127.0.0.1:3000
}
```
Copy or link the `Caddyfile` to `/etc/caddy/Caddyfile`:
```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
```

---

### Step 7: Run `sudo systemctl reload caddy`
Reload Caddy to provision Let's Encrypt SSL certificates automatically and enable reverse proxying:
```bash
sudo systemctl reload caddy
```

---

### Step 8: Open Browser, Go to Your Domain, Verify It Works
Navigate to `https://yourdomain.com` in your browser. Verify:
- Homepage and public pages load cleanly with HTTP 200.
- Login works for Super Admin using credentials specified in `.env`.
- CRM, Student Portal, Employee Portal, Partner Portal, and Application Manager modules are fully functional.


---



# README from GitHub

# alo_education_z....ai