# SMTP_SETUP.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — SMTP Email Setup Guide |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | How to configure outgoing email via cPanel: create the email account, find SMTP settings, set env vars, configure SPF/DKIM/DMARC, test, and identify all 10 email types the application sends. |

---

## Why email matters

Alaminn.info sends transactional emails at critical points in the user journey:

- **Inquiry acknowledgements** — sent to every contact form submitter within seconds.
- **Newsletter double-opt-in** — sent to every new subscriber; required for GDPR compliance.
- **OTP / verification codes** — sent during admin login and admin password reset.
- **Consultation confirmations** — sent when a meeting request is approved.
- **Scholarship / PhD deadline alerts** — sent by the `scholarship-deadlines` cron.
- **Referral failure notices** — sent to admins when an ALO Education handoff fails.

If SMTP is misconfigured, these emails silently fail (or land in spam), and users lose trust. This guide ensures they send reliably and reach the inbox.

---

## Step 1 — Create the cPanel email account

### Procedure

1. Log in to cPanel.
2. Navigate to **Email → Email Accounts**.
3. Click **Create**.
4. Fill in:
   - **Domain**: `alaminn.info` (must be added via cPanel → Domains first).
   - **Username**: `noreply` (produces `noreply@alaminn.info`).
   - **Password**: click **Generate** for a strong random password; copy it to a safe location.
   - **Storage**: 250 MB is plenty for a transactional mailbox (you'll rarely log in to read it).
5. Click **Create**.

> **Recommended accounts**:
> - `noreply@alaminn.info` — for transactional emails (inquiries, OTPs, deadline alerts).
> - `hello@alaminn.info` — for human-readable inbound (newsletter replies, contact replies).
> - `admin@alaminn.info` — for the admin user record (used as the ADMIN_EMAIL env var).

### Verify

```bash
# Connect to the mailbox via IMAP
openssl s_client -connect mail.alaminn.info:993 -quiet
# Login: a login noreply@alaminn.info <password>
# Expect: a OK LOGIN completed
```

If the login fails, the password is wrong — reset it via cPanel → Email Accounts → Manage → Change Password.

---

## Step 2 — Find the SMTP settings

### Via cPanel UI

1. cPanel → **Email → Email Accounts**.
2. Find the `noreply@alaminn.info` row.
3. Click **Connect Devices** (or "Configure mail client").
4. The page lists the SMTP settings:

| Setting | Value |
|---|---|
| **Mail server username** | `noreply@alaminn.info` |
| **Incoming mail server** | `mail.alaminn.info` (IMAP on 993, POP3 on 995) |
| **Outgoing mail server** | `mail.alaminn.info` (SMTP on 465 with SSL, or 587 with STARTTLS) |
| **SMTP SSL port** | `465` |
| **SMTP TLS port** | `587` |

### Recommended configuration

| Variable | Value | Why |
|---|---|---|
| `SMTP_HOST` | `mail.alaminn.info` | cPanel's mail subdomain. |
| `SMTP_PORT` | `465` | Implicit SSL — faster and more reliable than STARTTLS on 587. |
| `SMTP_SECURE` | `ssl` | Tells the transporter to use SSL on connect (not STARTTLS upgrade). |
| `SMTP_USER` | `noreply@alaminn.info` | Full email address as username. |
| `SMTP_PASS` / `SMTP_PASSWORD` | (the password from Step 1) | The cPanel email account password. |

### Alternative: STARTTLS on 587

| Variable | Value |
|---|---|
| `SMTP_HOST` | `mail.alaminn.info` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `starttls` |
| `SMTP_USER` | `noreply@alaminn.info` |
| `SMTP_PASS` | (same password) |

Use STARTTLS if port 465 is blocked by your hosting provider's firewall (rare; some shared hosts only allow 587).

---

## Step 3 — Set the env vars in `.env`

```bash
cd ~/alaminn.info
nano .env
```

Update these lines:
```bash
EMAIL_FROM="Alaminn.info <noreply@alaminn.info>"
EMAIL_REPLY_TO="Alaminn.info <hello@alaminn.info>"
SMTP_HOST=mail.alaminn.info
SMTP_PORT=465
SMTP_USER=noreply@alaminn.info
SMTP_PASSWORD=your-cpanel-email-password
SMTP_SECURE=ssl
```

> **Note**: The code accepts both `SMTP_PASS` and `SMTP_PASSWORD` (the canonical name in `.env.production` is `SMTP_PASSWORD`). Either works.

Save and restart the app: cPanel → Setup Node.js App → Restart.

### Verify the env vars are loaded

```bash
# Confirm the values are in .env
grep -E '^(SMTP_|EMAIL_)' ~/alaminn.info/.env

# Hit the health endpoint (some versions expose email config)
curl -s https://alaminn.info/api/health | python3 -m json.tool
# Look for "emailConfigured": true
```

---

## Step 4 — Configure SPF, DKIM, and DMARC DNS records

Without these DNS records, your transactional emails will likely land in Gmail/Outlook spam folders. They are MANDATORY for production.

### SPF (Sender Policy Framework)

SPF tells receiving mail servers which IPs/hosts are allowed to send email on behalf of `alaminn.info`.

**Record**:
- **Type**: `TXT`
- **Host/Name**: `alaminn.info` (or `@`)
- **Value**: `v=spf1 mx a ip4:<your-server-ip> include:mail.alaminn.info ~all`
  - Replace `<your-server-ip>` with the cPanel server's main IP (find via cPanel → Server Information).
  - If you use a third-party SMTP relay (Mailgun, SendGrid, Postmark), add `include:mailgun.org` etc.

**How to add in cPanel**:
1. cPanel → **Domains → Zone Editor**.
2. Find `alaminn.info` → click **Manage**.
3. Click **+ Add Record**.
4. Type: `TXT`, Name: `alaminn.info.`, TTL: `300`, TXT: `v=spf1 mx a ip4:<ip> ~all`.
5. Click **Save**.

**Verify**:
```bash
dig +short TXT alaminn.info
# Expect: "v=spf1 mx a ip4:<ip> ~all"
```

### DKIM (DomainKeys Identified Mail)

DKIM cryptographically signs each outgoing email so receivers can verify it wasn't tampered with.

**Enable in cPanel**:
1. cPanel → **Email → Email Deliverability**.
2. Find `alaminn.info` → click **Manage**.
3. If DKIM shows "Disabled", click **Enable**.
4. cPanel generates a DKIM key pair and adds the public key as a DNS TXT record automatically.

**Verify**:
```bash
dig +short TXT default._domainkey.alaminn.info
# Expect: "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3..."
```

If the record is missing, copy the public key from cPanel → Email Deliverability → DKIM → "Copy public key" and add it as a TXT record manually.

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

DMARC tells receivers what to do when SPF or DKIM fail (quarantine, reject, or none).

**Record**:
- **Type**: `TXT`
- **Host/Name**: `_dmarc.alaminn.info`
- **Value**: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@alaminn.info; ruf=mailto:dmarc-reports@alaminn.info; adkim=s; aspf=s`

Start with `p=quarantine` (sends failing emails to spam) for the first 2 weeks. After reviewing DMARC reports, escalate to `p=reject` (blocks failing emails entirely).

**Verify**:
```bash
dig +short TXT _dmarc.alaminn.info
# Expect: "v=DMARC1; p=quarantine; rua=mailto:..."
```

### DNS propagation

DNS changes propagate within minutes to hours. Verify from multiple locations:
- https://dnschecker.org/#TXT/alalminn.info
- https://mxtoolbox.com/SuperTool.aspx?action=spf%3aalaminn.info

---

## Step 5 — Test email sending

### Method A: Via the app (most realistic)

Submit any inquiry form on the live site:
```bash
curl -s -X POST https://alaminn.info/api/v1/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "education-advisory",
    "contact": { "fullName": "Test User", "email": "your-real-email@gmail.com" },
    "currentChallenge": "Test inquiry for SMTP verification",
    "privacyConsent": true,
    "commsConsent": true
  }'
```

Check `your-real-email@gmail.com` inbox (and spam folder). The acknowledgement email should arrive within 60 seconds.

### Method B: Via a Node one-liner (direct SMTP test)

```bash
cd ~/alaminn.info
node -e "
const nodemailer = require('nodemailer');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((a,l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) a[m[1]] = m[2].replace(/^\"|\"$/g, '');
  return a;
}, {});
const t = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: env.SMTP_SECURE === 'ssl',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
});
t.sendMail({
  from: env.EMAIL_FROM,
  to: 'your-real-email@gmail.com',
  subject: 'SMTP test from Alaminn.info',
  text: 'If you received this, SMTP is working.'
}).then(r => console.log('OK', r.messageId)).catch(e => console.error('FAIL', e));
"
```

Expected output: `OK <message-id>@alaminn.info`

### Method C: Direct SMTP via openssl

```bash
openssl s_client -connect mail.alaminn.info:465 -quiet
# At the prompt:
220 mail.alaminn.info ESMTP
HELO alaminn.info
250 mail.alaminn.info
AUTH LOGIN
334 VXNlcm5hbWU6
# Base64-encode your email: echo -n 'noreply@alaminn.info' | base64
# Paste the base64-encoded username
334 UGFzc3dvcmQ6
# Base64-encode your password: echo -n 'your-password' | base64
# Paste the base64-encoded password
235 2.7.0 Authentication successful
MAIL FROM:<noreply@alaminn.info>
250 OK
RCPT TO:<your-real-email@gmail.com>
250 OK
DATA
354 Start mail input
Subject: SMTP test
From: noreply@alaminn.info
To: your-real-email@gmail.com

Test
.
250 OK
QUIT
```

If you receive the email within 60 seconds, SMTP is working.

### Verify deliverability

Use https://www.mail-tester.com/ — send an email to the displayed address from `noreply@alaminn.info` and check the score:

- **10/10**: excellent — SPF + DKIM + DMARC + clean IP + good content
- **7-9/10**: acceptable — minor issues (e.g. no plain-text version)
- **Below 7**: investigate the report

---

## The 10 email types the application sends

| # | Email type | Trigger | Sender | Recipient | Template |
|---|---|---|---|---|---|
| 1 | **Student registration confirmation** | User submits the inquiry form on `/contact` or `/higher-study/book-consultation` | `noreply@alaminn.info` | The submitter's email | `src/lib/email/templates.ts` — inquiry acknowledgement |
| 2 | **OTP (one-time password)** | Admin attempts login at `/admin/login` and MFA is enabled (or password reset flow) | `noreply@alaminn.info` | The admin's email | OTP code valid for 5 minutes |
| 3 | **Account activation** | Admin creates a new staff user via `/admin/users` | `noreply@alaminn.info` | The new user's email | Activation link valid for 24 hours |
| 4 | **Consultation confirmation** | Admin approves a meeting request via `/admin/meetings` | `noreply@alaminn.info` | The requester's email | Calendar invite + meeting details |
| 5 | **Counsellor assignment** | ALO Education calls back to `/api/v1/higher-study/referral/[code]/confirm` and a counsellor is assigned | `noreply@alaminn.info` | The student's email | Introduces the assigned counsellor |
| 6 | **Scholarship deadline alert** | Cron `/api/cron/scholarship-deadlines` runs daily and finds scholarships with deadlines within 7 days | `noreply@alaminn.info` | Subscribers of `HigherStudyAlert` | Lists approaching deadlines |
| 7 | **Course enquiry confirmation** | Visitor submits an enquiry on a `/higher-study/courses/[slug]` page | `noreply@alaminn.info` | The visitor's email | Acknowledgement + next steps |
| 8 | **PhD enquiry confirmation** | Visitor submits an enquiry on a `/higher-study/research/[slug]` page | `noreply@alaminn.info` | The visitor's email | Acknowledgement + supervisor contact info |
| 9 | **Referral failure notice** | ALO Education callback reports `status=failed` for a referral | `noreply@alaminn.info` | The admin email (`ADMIN_EMAIL`) | Diagnostic info + referralCode |
| 10 | **Administrator alert** | Any system error triggers a security/admin alert (failed login lockout, suspicious activity, etc.) | `noreply@alaminn.info` | The admin email (`ADMIN_EMAIL`) | Alert details + recommended action |

### Template source

All email templates live in `src/lib/email/templates.ts` and use a shared layout (`src/lib/email/layout.ts`) for consistent branding.

### Email queue and retry

Outgoing emails are queued in `Notification` and `AuditLog` tables. The `email-worker` mini-service (port 3002) flushes the queue every 5 minutes (driven by the `/api/cron/email-queue` cron). If a send fails, it retries up to 3 times with exponential backoff (60s, 300s, 900s).

> On cPanel shared hosting without mini-services, emails send synchronously on the request thread. A single slow SMTP send can block a request for 5–10 seconds. This is acceptable for low-traffic transactional email.

---

## Alternative: Resend API

If cPanel SMTP is unreliable (slow, throttled, blacklisted IP), switch to Resend.com:

1. Sign up at https://resend.com.
2. Add and verify the `alaminn.info` domain (Resend will give you DKIM/CNAME records to add).
3. Get an API key: `re_xxxxxxxxxxxxxxxxxxxxxxxx`.
4. Add to `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Restart the app.

When `RESEND_API_KEY` is set, the email transport switches to Resend's API automatically. SMTP vars become unused (but keep them set as a fallback).

### Why prefer Resend?

- Dedicated IP reputation (not shared with other cPanel tenants).
- Higher deliverability (98%+ vs 90% for shared cPanel SMTP).
- Webhook events for opens/clicks/bounces.
- Free tier: 3,000 emails/month.

---

## Troubleshooting

### Email never arrives

1. **Check the Passenger log**: `tail ~/logs/alaminn.log | grep -i email`
   - If you see `Email queue: 1 pending` but no send, the SMTP transporter failed to initialize.
2. **Verify SMTP credentials**: run the Node one-liner from Step 5 Method B.
3. **Check spam folder**: Gmail is aggressive about cPanel-originated email. Whitelist `noreply@alaminn.info`.
4. **Verify DNS records**: `dig +short TXT alaminn.info` (SPF) and `dig +short TXT _dmarc.alaminn.info` (DMARC).
5. **Check mail-tester.com score**: send to a mail-tester address and review the report.

### `Email queue: 0 pending` but user never received

1. The email sent but landed in spam. Check the recipient's spam folder.
2. The recipient's email address was wrong (typo). Check the `Notification` table for the attempted send:
   ```bash
   mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "
     SELECT id, type, message, createdAt FROM Notification
     ORDER BY createdAt DESC LIMIT 5;
   "
   ```

### `EAUTH Authentication failed`

The cPanel email password is wrong. Reset it via cPanel → Email Accounts → Manage → Change Password. Update `.env` and restart.

### `ECONREFUSED Connection refused`

`SMTP_HOST` or `SMTP_PORT` is wrong. Verify with `openssl s_client -connect mail.alaminn.info:465 -quiet`.

### `Message too large`

The email body exceeds the cPanel limit (typically 50 MB). Split into multiple emails or remove large attachments.

### Emails marked as spam

1. Verify SPF/DKIM/DMARC are set (Step 4).
2. Check sender IP reputation: https://mxtoolbox.com/blacklists.aspx
3. If the cPanel server's IP is blacklisted, switch to Resend (Step 6) — they have clean IPs.
4. Review the email content: avoid spam-trigger words ("FREE", "BUY NOW", all-caps), include a plain-text version, keep the HTML clean.

---

## Reference

- **Email account**: `noreply@alaminn.info` (created via cPanel → Email Accounts)
- **SMTP host**: `mail.alaminn.info`
- **SMTP port**: `465` (SSL) preferred; `587` (STARTTLS) alternative
- **SMTP_SECURE**: `ssl` for port 465; `starttls` for port 587
- **Email transport module**: `src/lib/email/transport.ts`
- **Email templates**: `src/lib/email/templates.ts`
- **Email queue**: `src/lib/email/queue.ts` + `Notification` table
- **Email types**: 10 (see table above)
- **Alternative**: Resend API (`RESEND_API_KEY` env var)
- **DNS records**: SPF (TXT on `alaminn.info`), DKIM (TXT on `default._domainkey.alaminn.info`), DMARC (TXT on `_dmarc.alaminn.info`)
- **Deliverability check**: https://www.mail-tester.com/
