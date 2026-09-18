# ALO Education CRM — cPanel Deployment Guide

This guide walks you through deploying the ALO Education CRM on any cPanel
hosting account in **14 simple steps**. The whole process takes about 20–30
minutes, including database creation.

> **Requirements**
> - PHP **8.2** or newer (8.3+ recommended)
> - MySQL **8.0** or newer (MariaDB 10.6+ also works)
> - PDO extension with the `mysql` driver
> - `mbstring`, `curl`, `gd` (or `imagick`) PHP extensions
> - At least 100 MB of free disk space
> - A valid SSL certificate (Let's Encrypt is fine)

---

## STEP 1 — Upload the ZIP to `public_html`

1. Log in to your cPanel account.
2. Open **File Manager**.
3. Navigate to `public_html` (create it if missing — it is the web root).
4. Click **Upload** and choose `alo-education-crm.zip`.
5. Wait until the upload completes (you will see a green progress bar).

> Tip: If your ZIP is larger than the cPanel upload limit (typically 50 MB),
> upload via FTP using FileZilla instead.

---

## STEP 2 — Extract the ZIP

1. Inside `public_html`, select `alo-education-crm.zip`.
2. Click **Extract** on the toolbar.
3. When prompted for the extraction path, enter: `public_html/` (or a
   sub-folder such as `public_html/crm/` if you want the CRM at
   `https://yourdomain.com/crm/`).
4. Click **Extract File(s)**.
5. After extraction you should see folders like:
   ```
   public_html/
     ├── app/
     ├── assets/
     ├── config/
     ├── database/
     ├── leads/
     ├── students/
     ├── api/
     ├── cron/
     ├── index.php
     ├── login.php
     ├── install.php
     └── ...
   ```
6. You can now safely delete the uploaded `alo-education-crm.zip`.

---

## STEP 3 — Create a MySQL database

1. In cPanel, open **MySQL Database Wizard** (or **MySQL Databases**).
2. **New Database** field: enter a name such as `alo_education`.
   - The full name will be prefixed by your cPanel username, e.g.
     `youruser_alo_education`. Note this name — you'll use it in Step 7.
3. Click **Create Database** → **Next Step**.

---

## STEP 4 — Create a MySQL user

1. Still in the wizard, create a new user:
   - **Username:** `alo_user` (full name: `youruser_alo_user`)
   - **Password:** generate a strong 16+ character password and **save it** —
     you'll need it in Step 7.
2. Click **Create User** → **Next Step**.

> Tip: store the credentials in a password manager. The password is hashed
> by MySQL but the plain text is required for `config.php`.

---

## STEP 5 — Assign the user to the database

1. In the wizard's step *"Manage User Privileges"* make sure the box
   **ALL PRIVILEGES** is checked. This grants `SELECT, INSERT, UPDATE, DELETE,
   CREATE, ALTER, INDEX, DROP, CREATE TEMPORARY TABLES, LOCK TABLES, CREATE
   VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, EXECUTE, TRIGGER, REFERENCES`.
2. Click **Next Step** → **Return Home**.

> If you used the **MySQL Databases** tool instead of the wizard:
> find the *"Add User To Database"* section, pick the user + database you
> just created, click **Add**, then tick **ALL PRIVILEGES** → **Make Changes**.

---

## STEP 6 — Open the installer in your browser

Go to:

```
https://YOUR-DOMAIN/install.php
```

For example:
- Main domain: `https://aloeducation.com/install.php`
- Sub-folder: `https://aloeducation.com/crm/install.php`
- Subdomain: `https://app.aloeducation.com/install.php`

The installer will detect whether the system is already installed and show
the welcome screen.

> ⚠️ **If you see a 500 error** here, your `php.ini` is missing `pdo_mysql`.
> Contact your host or enable the extension via **MultiPHP INI Editor**.

---

## STEP 7 — Enter the database credentials

On the installer's *Database* step, fill in:

| Field            | Example value                       |
| ---------------- | ----------------------------------- |
| DB Host          | `localhost`                         |
| DB Port          | `3306`                              |
| DB Name          | `youruser_alo_education`            |
| DB User          | `youruser_alo_user`                  |
| DB Password      | the password you saved in Step 4    |
| DB Charset       | `utf8mb4`                           |
| Application URL  | `https://yourdomain.com`            |
| App Key          | leave blank — installer generates one |

Click **Test Connection**. When it says **OK**, click **Install Schema & Write Config**.

The installer will:
1. Write `/config/config.php` with your credentials.
2. Run `database/schema.sql` to create all 27 tables.
3. Seed default roles, permissions, and 1 demo branch + 2 sample universities.

---

## STEP 8 — Create the Super Admin account

On the installer's *Admin User* step, fill in:

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| Full Name   | `Super Admin`                              |
| Email       | `admin@yourdomain.com`                     |
| Password    | 12+ characters, mixed case, number, symbol |
| Phone       | optional                                   |

Click **Create Super Admin**.

> The password is hashed using PHP's `password_hash()` (bcrypt with cost 10).
> The plain text is **never** stored.

---

## STEP 9 — Complete the installation

The installer will show a **"Installation Complete"** screen with a green
checklist. Click **"Go to Login"** to proceed to Step 10.

At this point:
- `config/config.php` exists and contains your DB credentials + a random
  `APP_KEY`.
- All 27 tables are created.
- The super admin account exists.
- A `settings` row has been inserted with sensible defaults.

---

## STEP 10 — Log in

Open:

```
https://YOUR-DOMAIN/login.php
```

Enter the email + password from Step 8. After successful login you will land
on the **Command Center** dashboard at `index.php`.

> If the login fails with "Invalid credentials", verify that:
> 1. The email is typed exactly as you entered it (case-insensitive).
> 2. The user record exists in the `users` table (use phpMyAdmin →
>    `youruser_alo_education` → `users`).
> 3. The user's `status` column is `active` (not `inactive` or `suspended`).

---

## STEP 11 — Delete or lock the installer

For production security, the installer (`install.php`) **must not remain
accessible**. You have two options:

**Option A — Delete (recommended):**
- In cPanel File Manager, right-click `install.php` → **Delete**.

**Option B — Lock via `.htaccess`:**
- Edit `/install.php` and add at the top, just after `<?php`:
  ```php
  if (php_sapi_name() !== 'cli') {
      http_response_code(403);
      exit('Installer disabled. Restore install.php from backup to re-run.');
  }
  ```
- Or in `.htaccess` add:
  ```
  <Files "install.php">
      Require all denied
  </Files>
  ```

> The installer will refuse to run a second time if `config/config.php`
> already exists — this is a secondary safety net.

---

## STEP 12 — Configure email (SMTP)

The CRM uses PHP `mail()` by default but **SMTP is strongly recommended** for
reliable email delivery (forgot-password resets, communication logs, etc.).

1. Open `/config/config.php` in cPanel File Manager → **Edit**.
2. Update the `MAIL_*` constants:

   ```php
   define('MAIL_HOST',     'smtp.yourdomain.com');
   define('MAIL_PORT',     '587');
   define('MAIL_USERNAME', 'noreply@yourdomain.com');
   define('MAIL_PASSWORD', 'your-smtp-password');
   define('MAIL_FROM',     'noreply@yourdomain.com');
   define('MAIL_FROM_NAME','ALO Education');
   ```

3. Save the file. The CRM will use these settings the next time an email is
   sent via `mail()` (configured SMTP relay) or via the dedicated
   `communications/send.php` flow.

> For Gmail: use `smtp.gmail.com:587`, your full Gmail address as username,
> and an **App Password** (not your regular password). See
> https://support.google.com/accounts/answer/185833.

---

## STEP 13 — Configure WhatsApp (optional)

If you intend to send WhatsApp messages directly from the CRM
(communications/send.php + api/communications/send.php):

1. Sign up for a WhatsApp Business API provider (e.g. Twilio, 360Dialog,
   Wati, MessageBird).
2. Get the API URL + Bearer token from the provider.
3. Update `/config/config.php`:

   ```php
   define('WA_API_URL',      'https://api.yourprovider.com/v1/messages');
   define('WA_API_TOKEN',    'your-bearer-token-here');
   define('WA_PHONE_NUMBER', '14155238886');  // your WhatsApp Business number
   ```

4. Save. The CRM will now attempt WhatsApp delivery when channel=WHATSAPP is
   selected. If delivery fails (no token, invalid number, etc.), the
   communication is still logged with `status=FAILED` for later retry.

> To leave WhatsApp disabled, simply keep `WA_API_URL` empty — the CRM
> falls back to logging-only mode.

---

## STEP 14 — Configure cPanel cron jobs

The CRM ships with **4 cron scripts** in `/cron/`. Each must be scheduled via
cPanel → **Cron Jobs**. Use the path `/usr/local/bin/php` (cPanel default) or
the path shown in *MultiPHP Manager* for your account.

### 14a — Follow-ups cron (daily at 8 AM)

Creates follow-up tasks for stale leads and bumps follow_up_date +7 days.

```
Minute:   0
Hour:     8
Day:      *
Month:    *
Weekday:  *
Command:  php -f /home/USERNAME/public_html/cron/followups.php
```

### 14b — Reminders cron (every 2 hours)

Sends in-app + email notifications for tasks due within 24h.

```
Minute:   0
Hour:     */2
Day:      *
Month:    *
Weekday:  *
Command:  php -f /home/USERNAME/public_html/cron/reminders.php
```

### 14c — Notifications cron (daily at 7 AM)

Notifies finance users about overdue invoices + counselors about upcoming
application deadlines.

```
Minute:   0
Hour:     7
Day:      *
Month:    *
Weekday:  *
Command:  php -f /home/USERNAME/public_html/cron/notifications.php
```

### 14d — Marketing auto-publish cron (every 15 minutes)

Publishes approved + scheduled marketing content.

```
Minute:   */15
Hour:     *
Day:      *
Month:    *
Weekday:  *
Command:  php -f /home/USERNAME/public_html/cron/marketing.php
```

> Replace `USERNAME` with your cPanel account username. To verify the path:
> in cPanel Terminal run `pwd` from inside `public_html/cron/`. The full
> path will be `/home/USERNAME/public_html/cron/`.

### Cron email output

By default cPanel emails the cron output to your account email. To suppress
this (and only email on failure) append `2>&1` and pipe through a grep:

```
php -f /home/USERNAME/public_html/cron/followups.php 2>&1 | grep -v "^$"
```

To silence entirely, append `> /dev/null 2>&1` (not recommended — you'll
miss errors).

---

## Troubleshooting

### "Database connection failed"
- Check `DB_HOST` is `localhost` (rarely a remote host on shared cPanel).
- Verify `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` match Step 3–5 exactly.
- Ensure the MySQL user has **ALL PRIVILEGES** on the database.
- Use cPanel → **phpMyAdmin** to test the credentials manually.

### "419 — Page Expired" on every form submit
- Your browser is rejecting the session cookie. Make sure:
  - You are accessing the site over HTTPS (the cookie is `Secure`).
  - Your server time is correct (drift breaks session tokens).
  - You haven't disabled cookies in the browser.

### "403 — Forbidden" on every page
- Your role lacks the `dashboard.view` permission. Use phpMyAdmin to run:
  ```sql
  INSERT IGNORE INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
   WHERE r.name='counselor' AND p.name='dashboard.view';
  ```
  Or assign the role `super_admin` to your user (which bypasses all checks).

### Login succeeds but immediately logs out
- The session save path is unwritable. Check with cPanel → **PHP Info** →
  look for `session.save_path`. The directory must be writable by the PHP
  user. Contact your host if you cannot fix this.
- Timezone drift — ensure server time matches Asia/Dhaka (or your TZ).

### Uploads fail with "Failed to create upload directory"
- The `/uploads/` directory must be writable. In cPanel File Manager:
  - Right-click `uploads/` → **Permissions**.
  - Set to **755** (directories) or **644** (files).
  - Owner: your cPanel username; Group: your cPanel username.
- For shared hosts with `suPHP`, use **755**. For `mod_php` setups, **770**
  with group `nobody` may be required.

### Cron jobs don't run
- Verify the path is `/usr/local/bin/php` (or whatever `which php` returns in
  cPanel Terminal).
- Test manually: `php -f /home/USERNAME/public_html/cron/followups.php`
- The script outputs status messages to stdout — check the cPanel cron email
  for the log.

### "CSRF token mismatch" on every POST
- Your `session.cookie_samesite` is set to `None` (incompatible). Edit
  `/app/bootstrap.php` and ensure the session cookie params use
  `'samesite' => 'Lax'`.
- Browser cache holding an old CSRF token — hard refresh (Ctrl+F5).

### Forgot password email never arrives
- SMTP not configured (Step 12). The CRM falls back to `mail()` which often
  lands in spam.
- Check `communications` table — outbound emails are logged with
  `status=SENT` or `FAILED`.
- Use the **Reset Password** link directly with the token from
  `users.remember_token` (phpMyAdmin).

### Blank white screen (HTTP 500)
- Set `APP_DEBUG=true` in `/config/config.php` to see the error.
- Check cPanel → **Errors** or **MultiPHP Errors** for PHP fatal errors.
- Common causes: missing PHP extension, file permission issue, syntax error
  in a customized PHP file.

### Reset password token expired
- Tokens are valid for 1 hour. Generate a new one via the forgot-password page.

---

## Post-install checklist

- [ ] SSL certificate is active (`https://` works without warning).
- [ ] `install.php` is deleted or locked (Step 11).
- [ ] `/config/config.php` is **not** world-readable (chmod 640).
- [ ] `/uploads/` is writable (chmod 755).
- [ ] At least one user account with role `super_admin` exists.
- [ ] SMTP credentials are tested (send a test communication).
- [ ] All 4 cron jobs are scheduled (Step 14a–d).
- [ ] Backup strategy is in place (cPanel → **Backup Wizard** weekly).

---

## Backup strategy

1. **cPanel Backup Wizard** → **Generate Backup** (full account) — weekly.
2. **phpMyAdmin** → select your DB → **Export** → **Custom** →
   **Compression: gzip** — daily (CRMs change often).
3. Store the SQL dumps in a `/backups/` folder *outside* `public_html` so
   they cannot be downloaded via the web.

---

## Support

- Documentation root: `/docs/` (if present).
- Internal help page: `https://yourdomain.com/help.php`
- Audit log: `https://yourdomain.com/admin/audit.php` (super_admin only)

You are now ready to use the ALO Education CRM. 🎓
