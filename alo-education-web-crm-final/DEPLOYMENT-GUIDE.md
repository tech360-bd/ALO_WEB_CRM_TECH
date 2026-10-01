> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# ALO Education ERP — Ubuntu Deployment Guide

This guide explains how to deploy the ALO Education ERP on a fresh Ubuntu 22.04 / 24.04 server.

## 1. System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU       | 1 vCPU  | 2 vCPU      |
| RAM       | 1 GB    | 2 GB        |
| Disk      | 10 GB   | 20 GB       |
| OS        | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Node.js   | 22.x    | 22.x (LTS)  |
| Database  | MySQL (dev) | MySQL 8.0.37 (prod) |

## 2. Pre-flight Checklist

- [ ] A registered domain name (e.g. `alo.example.com`) pointing to the server's IP
- [ ] Ports 80 and 443 open in the firewall
- [ ] Port 3000 **closed** to the public (only `127.0.0.1` should reach it)
- [ ] SSH access with a non-root sudo user
- [ ] Sufficient disk space for backups

## 3. Deployment Steps (Automated)

Copy the entire project to the server, then run:

```bash
cd /path/to/project
sudo bash deploy/ubuntu/deploy.sh
```

The script will:
1. Install Node.js 22 from NodeSource (if not present)
2. Create a system service user `alo` (no shell login)
3. Install Caddy (if not present)
4. Sync project files to `/opt/alo-education`
5. Run `npm ci` (production dependencies)
6. Run `npm run build` (Next.js standalone build)
7. Run `npx prisma migrate deploy` (apply migrations)
8. Run `npx prisma db seed` (initial data — idempotent)
9. Install the systemd unit at `/etc/systemd/system/alo-education.service`
10. Install the Caddyfile at `/etc/caddy/Caddyfile`
11. Start the service and run a smoke test

## 4. Post-deploy Configuration

### 4.1 Set the Domain

Edit `/etc/caddy/Caddyfile` and replace `alo.example.com` with your real domain:

```bash
sudo nano /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy will automatically provision a TLS certificate from Let's Encrypt.

### 4.2 Set Environment Variables

Edit `/opt/alo-education/.env` and update:

```bash
sudo -u alo nano /opt/alo-education/.env
sudo systemctl restart alo-education
```

Required variables to change for production:
- `DATABASE_URL` — switch to MySQL if needed
- `SESSION_SECRET` — generate with `openssl rand -hex 32`
- `AUTH_SECRET` — generate with `openssl rand -hex 32`
- `ENCRYPTION_KEY` — generate with `openssl rand -hex 32`
- `SEED_ADMIN_PASSWORD` — change immediately after first login
- `APP_URL` / `NEXT_PUBLIC_APP_URL` — set to your real HTTPS URL

### 4.3 Change Default Admin Password

The seed creates a default admin with password `SET_VIA_ENVIRONMENT_ONLY`. Change it immediately:

1. Visit `https://alo.example.com/?p=employee-login`
2. Login with `admin@aloeducation.com` / `SET_VIA_ENVIRONMENT_ONLY`
3. Open the profile menu → Change password
4. Log out and log back in with the new password

## 5. Service Management

```bash
# Status
sudo systemctl status alo-education

# Start / stop / restart
sudo systemctl start alo-education
sudo systemctl stop alo-education
sudo systemctl restart alo-education

# Live logs
sudo journalctl -u alo-education -f

# Application logs (file)
sudo tail -f /var/log/alo-education/app.log
sudo tail -f /var/log/alo-education/error.log
```

## 6. Backups

### Manual backup

```bash
sudo bash deploy/ubuntu/backup.sh
# → /var/backups/alo-education/YYYYMMDD-HHMMSS/
```

### Scheduled backup (cron)

```bash
# Daily at 02:00 AM, keep last 14
echo '0 2 * * * root /opt/alo-education/deploy/ubuntu/backup.sh >> /var/log/alo-education/backup.log 2>&1' \
  | sudo tee /etc/cron.d/alo-backup
```

### Restore

```bash
sudo bash deploy/ubuntu/restore.sh /var/backups/alo-education/<TIMESTAMP>/
```

### Rollback to previous backup

```bash
sudo bash deploy/ubuntu/rollback.sh
# Or specify a timestamp:
sudo bash deploy/ubuntu/rollback.sh 20260101-020000
```

## 7. Health Monitoring

### Manual health check

```bash
sudo bash deploy/ubuntu/health-check.sh
# Or against the public URL:
sudo bash deploy/ubuntu/health-check.sh https://alo.example.com/api/health
```

### Scheduled (cron — every minute)

```bash
echo '* * * * * root /opt/alo-education/deploy/ubuntu/health-check.sh >> /var/log/alo-education/health.log 2>&1' \
  | sudo tee /etc/cron.d/alo-health
```

The script exits `0` on healthy and `1` on failure — suitable for integration with monitoring tools (Uptime Kuma, Icinga, etc.).

## 8. Production Database Migration (MySQL → MySQL)

MySQL is acceptable for staging / single-user deployments. For multi-staff production with concurrent writes, migrate to MySQL:

1. **Provision MySQL**:
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   sudo -u postgres createuser -P alo_erp
   sudo -u postgres createdb -O alo_erp alo_erp
   ```

2. **Backup current MySQL data**:
   ```bash
   sudo bash deploy/ubuntu/backup.sh
   ```

3. **Update `.env`**:
   ```bash
   DATABASE_URL="postgresql://alo_erp:PASSWORD@localhost:5432/alo_erp?schema=public"
   ```

4. **Reset and re-apply migrations against MySQL**:
   ```bash
   cd /opt/alo-education
   sudo -u alo npx prisma migrate reset --force
   sudo -u alo npx prisma db seed
   ```

5. **(Optional) Migrate existing data** using `pgloader`:
   ```bash
   sudo apt install -y pgloader
   pgloader ./db/custom.db postgresql://alo_erp:PASSWORD@localhost/alo_erp
   ```

6. **Restart**:
   ```bash
   sudo systemctl restart alo-education
   ```

## 9. Updating the Application

To deploy a new version:

```bash
# 1. Pull latest code on the build host
git pull

# 2. Run the deploy script (idempotent)
sudo bash deploy/ubuntu/deploy.sh
```

If the new version is broken:

```bash
sudo bash deploy/ubuntu/rollback.sh
```

## 10. Security Hardening Checklist

- [ ] UFW firewall: allow 22, 80, 443 only
- [ ] Disable root SSH login
- [ ] Fail2ban installed
- [ ] Automatic security updates enabled (`unattended-upgrades`)
- [ ] Database backups encrypted at rest (or stored in private bucket)
- [ ] `.env` file permissions `600` and owned by `alo:alo`
- [ ] TLS certificate auto-renewal verified
- [ ] Default admin password changed
- [ ] All seeded test users disabled or deleted in production
- [ ] Caddy logs rotated
- [ ] System resources monitored (CPU, RAM, disk)

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| 502 Bad Gateway | Next.js not running | `sudo systemctl status alo-education` |
| 502 Bad Gateway | Wrong port | Check `.env` PORT=3000 |
| TLS not provisioning | DNS not resolving | Verify `dig alo.example.com` |
| Login fails | DB not seeded | `sudo -u alo npx prisma db seed` |
| Build fails | Out of memory | Add swap: `sudo fallocate -l 2G /swapfile` |
| Prisma errors | Schema drift | `sudo -u alo npx prisma generate && npx prisma migrate deploy` |

For deeper investigation:

```bash
sudo journalctl -u alo-education --since "10 min ago" --no-pager
sudo journalctl -u caddy --since "10 min ago" --no-pager
```
