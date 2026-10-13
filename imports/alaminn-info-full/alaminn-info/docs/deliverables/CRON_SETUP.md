# CRON_SETUP.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Cron Job Configuration Guide |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | How to configure the 11 scheduled cron jobs that drive Alaminn.info's background maintenance: deadline alerts, queue flushing, cleanup, backups, health monitoring, sitemap, and session cleanup. |

---

## How Alaminn.info cron jobs work

Each cron endpoint is an HTTP route under `/api/cron/*` that:

1. Is invoked by an EXTERNAL scheduler (cPanel cron, systemd timer, UptimeRobot cron-monitor, GitHub Actions).
2. Authenticates via a shared `CRON_SECRET` (verified in constant time with `timingSafeEqual` — never accepts an unauthenticated request).
3. Runs to completion synchronously (most jobs take < 5 seconds).
4. Returns a JSON status like `{"status":"ok","job":"scholarship-deadlines","processed":3}`.

> **Important**: cron endpoints NEVER accept cookies or session tokens. The `CRON_SECRET` is the only authentication. If `CRON_SECRET` is missing from `.env`, every cron endpoint returns `503 Service Unavailable` rather than running unauthenticated — fail-closed by design.

---

## The CRON_SECRET requirement

### Setting the secret

1. Generate a strong secret:
   ```bash
   openssl rand -hex 32
   # Output: b8c9a0f1e2d3c4b5a6978877665544332211ffeeddccbbaa9988776655443322
   ```

2. Add it to `/home/aloeduca/alaminn.info/.env`:
   ```bash
   cd ~/alaminn.info
   nano .env
   # Add or update:
   CRON_SECRET=<REPLACE_WITH_openssl_rand_hex_32>
   ```

3. Restart the app from cPanel UI (Setup Node.js App → Restart).

4. Use the same secret in EVERY cron command below.

### Verifying the secret works

```bash
# Without the secret — should return 401
curl -s -o /dev/null -w "%{http_code}\n" https://alaminn.info/api/cron/scholarship-deadlines
# Expect: 401

# With the wrong secret — should return 401
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "x-cron-secret: wrong-secret" \
  https://alaminn.info/api/cron/scholarship-deadlines
# Expect: 401

# With the right secret — should return 200
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "x-cron-secret: YOUR_ACTUAL_SECRET" \
  https://alaminn.info/api/cron/scholarship-deadlines
# Expect: 200
```

### Acceptable authentication methods

The cron auth helper (`src/lib/cron-auth.ts`) accepts the secret via either:

| Method | Format | When to use |
|---|---|---|
| **HTTP header** (preferred) | `x-cron-secret: <secret>` | Most cPanel cron implementations. |
| **Query parameter** (fallback) | `?secret=<secret>` | Schedulers that can't set headers (rare). |

Both are matched in constant time (timingSafeEqual) to prevent timing attacks.

> **Recommendation**: use the header method. The query string ends up in nginx/Apache access logs which are more widely readable than the request headers.

---

## The 11 cron endpoints — schedule + command table

### Schedule notation

cPanel uses 5-field cron syntax: `minute hour day-of-month month day-of-week`

| Field | Values | Special chars |
|---|---|---|
| Minute | 0–59 | `*` (every), `*/N` (every N), `,` (list), `-` (range) |
| Hour | 0–23 | same |
| Day of month | 1–31 | same |
| Month | 1–12 (or JAN-DEC) | same |
| Day of week | 0–6 (0=Sunday, or SUN-SAT) | same |

### The table

| # | Endpoint | Schedule | Frequency | Command |
|---|---|---|---|---|
| 1 | `scholarship-deadlines` | `0 9 * * *` | Daily at 09:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/scholarship-deadlines` |
| 2 | `phd-deadlines` | `0 9 * * *` | Daily at 09:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/phd-deadlines` |
| 3 | `data-verification` | `0 6 * * 0` | Weekly Sunday 06:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/data-verification` |
| 4 | `referral-retry` | `*/15 * * * *` | Every 15 minutes | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/referral-retry` |
| 5 | `email-queue` | `*/5 * * * *` | Every 5 minutes | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/email-queue` |
| 6 | `notification-queue` | `*/2 * * * *` | Every 2 minutes | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/notification-queue` |
| 7 | `temp-cleanup` | `0 3 * * *` | Daily at 03:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/temp-cleanup` |
| 8 | `backup` | `0 2 * * *` | Daily at 02:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/backup` |
| 9 | `health-monitor` | `*/5 * * * *` | Every 5 minutes | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/health-monitor` |
| 10 | `sitemap-generate` | `0 4 * * 0` | Weekly Sunday 04:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/sitemap-generate` |
| 11 | `session-cleanup` | `0 5 * * 0` | Weekly Sunday 05:00 | `curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/session-cleanup` |

> Replace `YOUR_SECRET` with the actual `CRON_SECRET` value from `.env`. NEVER paste the real secret into a public doc or commit it to git.

### Why each schedule

| Endpoint | Why this schedule |
|---|---|
| `scholarship-deadlines` | 09:00 in the server timezone catches deadlines before end-of-day; daily is the minimum frequency to alert students in time. |
| `phd-deadlines` | Same as above; runs alongside scholarship-deadlines to share the DB query cost. |
| `data-verification` | Weekly is sufficient — university/scholarship data doesn't change hourly. Sunday 06:00 is low-traffic. |
| `referral-retry` | 15 minutes balances responsiveness (failed referrals get retried quickly) with not hammering ALO Education's API. |
| `email-queue` | 5 minutes is short enough that queued emails don't pile up, long enough to batch. |
| `notification-queue` | 2 minutes keeps in-app notifications feeling real-time without overloading the DB. |
| `temp-cleanup` | 03:00 is the lowest-traffic window; daily cleanup prevents storage bloat. |
| `backup` | 02:00 daily — runs before temp-cleanup so the backup captures the day's data including any temp files needed for audit. |
| `health-monitor` | 5 minutes catches outages within one UptimeRobot cycle. |
| `sitemap-generate` | Weekly keeps the sitemap fresh for search engines without DB churn. |
| `session-cleanup` | Weekly purges expired session records (sessions TTL is 8 hours, so weekly cleanup is plenty). |

---

## How to add the crons in cPanel

### Method A: cPanel UI (recommended)

1. cPanel → **Advanced → Cron Jobs**.
2. Under "Add New Cron Job":
   - **Common Settings**: pick "Once Per Minute" (`* * * * *`) for the most frequent jobs, then edit the fields manually.
   - **Minute / Hour / Day / Month / Weekday**: enter the schedule fields from the table above.
   - **Command**: paste the curl command, replacing `YOUR_SECRET`.
3. Click **Add New Cron Job**.
4. Repeat for each of the 11 endpoints.

### Method B: crontab via Terminal

```bash
# Open the crontab editor
crontab -e

# Paste all 11 lines (replace YOUR_SECRET first):
0 9 * * *     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/scholarship-deadlines
0 9 * * *     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/phd-deadlines
0 6 * * 0     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/data-verification
*/15 * * * *  curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/referral-retry
*/5 * * * *   curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/email-queue
*/2 * * * *   curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/notification-queue
0 3 * * *     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/temp-cleanup
0 2 * * *     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/backup
*/5 * * * *   curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/health-monitor
0 4 * * 0     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/sitemap-generate
0 5 * * 0     curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/session-cleanup

# Save and exit (in vi: Esc :wq Enter)
```

### Method C: cPanel UI → Cron Email

By default, cPanel emails the cron output to the account owner. To suppress emails for jobs that produce no output:

Append `> /dev/null 2>&1` to each command:
```bash
0 9 * * * curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/scholarship-deadlines > /dev/null 2>&1
```

OR set **cPanel → Cron Jobs → Cron Email** to a blank address (NOT recommended — silent failures go unnoticed).

**Recommended**: redirect output to a log file instead:
```bash
0 9 * * * curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/scholarship-deadlines >> /home/aloeduca/alaminn.info/storage/logs/cron.log 2>&1
```

---

## Verifying cron jobs are running

### Immediate manual run

```bash
# Run each endpoint manually to confirm it works
for endpoint in scholarship-deadlines phd-deadlines data-verification referral-retry email-queue notification-queue temp-cleanup backup health-monitor sitemap-generate session-cleanup; do
  echo "=== $endpoint ==="
  curl -s -H "x-cron-secret: YOUR_SECRET" "https://alaminn.info/api/cron/$endpoint"
  echo ""
done
```

Expected: each returns `{"status":"ok","job":"<name>","processed":N}`.

### Check the cron log

If you redirected output to `storage/logs/cron.log`:
```bash
tail -f ~/alaminn.info/storage/logs/cron.log
```

### Check the Passenger log

Cron jobs hit `/api/cron/*` which goes through the Node app. Errors appear in `~/logs/alaminn.log`:
```bash
grep -i cron ~/logs/alaminn.log | tail -20
```

### Check the database

Most cron jobs write audit rows:
```bash
mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "
  SELECT action, COUNT(*), MAX(createdAt) as last_run
  FROM AuditLog
  WHERE action LIKE 'cron.%'
  GROUP BY action
  ORDER BY last_run DESC;
"
```

Expected: each cron endpoint appears with a recent `last_run` timestamp.

### Health monitor writes SystemHealth

```bash
mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "
  SELECT component, status, message, checkedAt
  FROM SystemHealth
  ORDER BY checkedAt DESC
  LIMIT 10;
"
```

---

## Backup cron — preferred alternative

The `backup` cron endpoint (Step 8 in the table) triggers an HTTP-based backup. The **more robust** alternative is to invoke `scripts/backup.sh` directly via cron:

```bash
0 2 * * * /home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1
```

### Why prefer the script?

| Feature | HTTP endpoint | Bash script |
|---|---|---|
| Writes to `storage/backups/` | Yes (if cron endpoint does) | Yes |
| SHA-256 checksum | Depends | Yes (always) |
| 30-day retention | No | Yes |
| `flock` to prevent concurrent runs | No | Yes |
| Credentials via `--defaults-extra-file` mode 0600 | N/A | Yes |
| Survives app crash | No | Yes |
| Requires app to be up | Yes | No |

**Recommendation**: use the bash script for backups. Use the HTTP endpoint only as a fallback for environments where bash isn't available.

---

## Troubleshooting

### Cron returns 401 Unauthorized

**Cause**: `CRON_SECRET` in the curl command doesn't match `.env`.
**Fix**:
1. `grep CRON_SECRET ~/alaminn.info/.env` — show the secret in `.env`.
2. Compare with the secret in your cron command.
3. If different, update the cron command (or update `.env` and restart the app).

### Cron returns 503 Service Unavailable

**Cause**: `CRON_SECRET` is missing or empty in `.env` — fail-closed mode.
**Fix**:
1. Add `CRON_SECRET=<strong-secret>` to `.env`.
2. Restart the app from cPanel UI.
3. Retry the curl command.

### Cron never runs

**Cause**: cPanel cron is disabled, OR the schedule is wrong.
**Fix**:
1. cPanel → Cron Jobs → verify the row exists and is enabled.
2. Check the schedule syntax — `*/5 * * * *` is valid; `* /5 * * * *` (with spaces) is NOT.
3. Run `crontab -l` to verify the crontab is loaded.
4. Check cPanel → Server Status → Cron — should be "running".

### Cron runs but does nothing

**Cause**: The endpoint returns 200 with `processed: 0` — nothing to process.
**Fix**: This is NORMAL. Empty queues are healthy. Check the response body:
```bash
curl -s -H "x-cron-secret: YOUR_SECRET" https://alaminn.info/api/cron/email-queue
# {"status":"ok","job":"email-queue","processed":0,"remaining":0}
```
If `processed` is always 0 over 24h, investigate whether the queue is being populated upstream.

### Cron times out

**Cause**: The endpoint took > 30 seconds (default cPanel cron timeout).
**Fix**:
1. Increase the curl timeout: `curl -s --max-time 60 -H "x-cron-secret: ..."`
2. Investigate why the endpoint is slow — `tail ~/logs/alaminn.log` for slow query warnings.
3. Add DB indexes if missing (Prisma schema declares them via `@@index`).

### Cron secret leaked

**Cause**: The secret appears in shell history, a public doc, or a Slack message.
**Fix**:
1. Generate a new secret: `openssl rand -hex 32`.
2. Update `.env` and restart the app.
3. Update all 11 cron commands with the new secret.
4. Audit `~/logs/alaminn.log` and `storage/logs/cron.log` for unauthorized runs in the window between leak and rotation.

---

## Alternative: external scheduler (if cPanel cron is unavailable)

If cPanel cron is disabled or you want redundancy, use an external scheduler:

### UptimeRobot cron monitor

1. Sign up at https://uptimerobot.com.
2. Add a new monitor → **Monitor type: Cron Job Monitor**.
3. **URL**: `https://alaminn.info/api/cron/scholarship-deadlines` (with `x-cron-secret` header).
4. **Schedule**: match the cPanel schedule.
5. UptimeRobot will ping the URL on schedule and alert if it doesn't return 200.

> **Limitation**: UptimeRobot doesn't support custom headers on the free tier. Use the query-string fallback: `?secret=YOUR_SECRET` (less secure).

### GitHub Actions

```yaml
# .github/workflows/cron-scholarship-deadlines.yml
name: Cron — Scholarship Deadlines
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -s -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            https://alaminn.info/api/cron/scholarship-deadlines
```

Store `CRON_SECRET` as a GitHub Actions secret (Settings → Secrets → Actions).

---

## Reference

- **Number of cron endpoints**: 11
- **Auth method**: `x-cron-secret` header (preferred) OR `?secret=` query param (fallback)
- **Auth source**: `src/lib/cron-auth.ts` (timingSafeEqual, fail-closed)
- **Secret env var**: `CRON_SECRET` (≥ 32 bytes, generate with `openssl rand -hex 32`)
- **Secret location**: `/home/aloeduca/alaminn.info/.env` (mode 600)
- **Log file (recommended)**: `/home/aloeduca/alaminn.info/storage/logs/cron.log`
- **Passenger log**: `/home/aloeduca/logs/alaminn.log`
- **Most frequent**: `notification-queue` every 2 minutes
- **Least frequent**: `data-verification`, `sitemap-generate`, `session-cleanup` weekly
- **Backup script alternative**: `bash scripts/backup.sh` (more robust than the HTTP endpoint)
