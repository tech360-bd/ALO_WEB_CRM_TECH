# CPANEL_CONFIGURATION.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — cPanel Node.js Application Manager Configuration |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Reference for configuring the cPanel "Setup Node.js App" entry for the Alaminn.info Next.js 16 standalone production build. Covers every field in the cPanel UI form, why each value matters, and how to operate the app once it's created. |

---

## Where to find this screen

cPanel → **Software** → **Setup Node.js App** (also labelled "Node.js App" or "Manage Node.js Apps" depending on theme).

This screen uses CloudLinux's Phusion Passenger integration to run a persistent Node.js process per application. Requests from Apache/Nginx are proxied to that Node process via a Unix socket.

---

## Field-by-field configuration

### 1. Node.js version

| Value | Notes |
|---|---|
| **22.x** (preferred) | Current LTS as of 2026; matches the local build environment. |
| **20.x** (minimum) | Required by Next.js 16 and `node:crypto` webcrypto APIs. |
| **18.x or older** | NOT supported — will fail at runtime. |

After selecting a version, cPanel shows the absolute path it will use, e.g. `/opt/alt/alt-nodejs22/default`. To verify from Terminal:

```bash
source /opt/alt/alt-nodejs22/default 2>/dev/null && node --version
# Expect: v22.x.x
```

### 2. Application mode

| Value | Notes |
|---|---|
| **Production** | Disables Next.js dev warnings, enables caching, sets `NODE_ENV=production`. |
| Development | Never use in production — disables caching, leaks stack traces. |

> ⚠️ The `NODE_ENV=production` env var is ALSO forced inside `server.js`. Even if cPanel UI says "Production", `server.js` will overwrite it. The two settings should agree; if they don't, `server.js` wins.

### 3. Application root

| Value | Notes |
|---|---|
| `alaminn.info` | Maps to `/home/aloeduca/alaminn.info`. The folder MUST exist before you click Create. |

The Application root is RELATIVE to `/home/<cpanel_user>/`. cPanel refuses to create an app whose root doesn't exist on disk.

Verify:
```bash
ls -ld /home/aloeduca/alaminn.info
# Expect: drwxr-xr-x ... aloeduca aloeduca ... alaminn.info
```

### 4. Application URL

| Value | Notes |
|---|---|
| `alaminn.info` | The domain the app answers on. Must be added via cPanel → Domains first. |

If you also have a `www.alaminn.info` alias, cPanel creates a redirect rule from `www.` to the apex (or vice versa) automatically. Verify both:
```bash
curl -sI https://alaminn.info | head -1
curl -sI https://www.alaminn.info | head -1
```

### 5. Application startup file

| Value | Notes |
|---|---|
| `server.js` | The project-root file Passenger invokes. Loads `.env`, sets NODE_ENV, requires `.next/standalone/server.js`. |

The path is RELATIVE to the application root. Do NOT prefix it with `/home/aloeduca/alaminn.info/` — just `server.js`.

Verify the file exists and is readable:
```bash
ls -l /home/aloeduca/alaminn.info/server.js
# Expect: -rw-r--r-- ... server.js (mode 644)
```

If the file is missing or non-executable as a Node script, Passenger returns 502 Bad Gateway. See `server.js` source for the exact boot sequence.

### 6. Passenger log file

| Value | Notes |
|---|---|
| `logs/alaminn.log` (default) | All `console.log` / `console.error` from the Node process land here. |

This path is RELATIVE to `/home/<cpanel_user>/`. The actual file is `/home/aloeduca/logs/alaminn.log` (NOT inside the app root).

Tail the log:
```bash
tail -f ~/logs/alaminn.log
```

If the file doesn't exist, Passenger creates it on the first request. If you can't write to `~/logs/`, the cPanel account has a permission problem — submit a ticket.

### 7. Environment variables

| Where | Notes |
|---|---|
| **`.env` file at `/home/aloeduca/alaminn.info/.env`** (preferred) | Loaded by `server.js` BEFORE Next.js boots. Mode 600. See `ENVIRONMENT_VARIABLES.md` for the full list. |
| **cPanel UI → Environment variables** (alternative) | cPanel injects these into the Passenger process env directly. Useful for secrets you don't want in a file. |

> **The two sources merge**: cPanel UI env vars win over `.env` (the `server.js` loader only sets vars that aren't already in `process.env`). This lets you override a single var temporarily via the UI without editing the file.

Recommended: keep all env vars in `.env` for reproducibility. Use the UI only for emergency overrides (e.g. temporarily flipping `LOG_LEVEL=debug`).

The minimum env vars cPanel needs to know about (the rest live in `.env`):

| Variable | Value | Why |
|---|---|---|
| `NODE_ENV` | `production` | Already forced by `server.js`; set in UI for clarity. |
| `PORT` | (auto) | Passenger sets this; don't override. |

---

## How to start / stop / restart

All actions are buttons on the cPanel Node.js App screen (next to your application row):

| Action | Effect |
|---|---|
| **Start App** | Boots the Node process if stopped. |
| **Stop App** | Kills the Node process; site returns 503 until restarted. |
| **Restart** | Kills + boots. Use after every `.env` change or code redeploy. |
| **Edit** | Opens the configuration form (pre-filled). |
| **Delete** | Removes the Passenger entry. Source files on disk are NOT deleted. |
| **Run NPM Install** | Runs `npm install` in the app root. Equivalent to Terminal `npm ci`. |
| **View Logs** | Opens a viewer for `~/logs/alaminn.log` (also accessible via Terminal). |

### Restart from Terminal (alternative)

If the cPanel UI is unresponsive, you can restart Passenger from the command line:

```bash
which passenger-config
# /opt/passenger/bin/passenger-config  (typical path)

# Restart the app
/opt/passenger/bin/passenger-config restart-app /home/aloeduca/alaminn.info

# If passenger-config is not in PATH, fall back to touching a restart file
mkdir -p /home/aloeduca/alaminn.info/tmp
touch /home/aloeduca/alaminn.info/tmp/restart.txt
# Passenger checks this file on every request; presence triggers a restart
```

### When you MUST restart

| Change | Restart required? |
|---|---|
| `.env` edited | **Yes** |
| `server.js` edited | **Yes** |
| `.next/standalone/server.js` rebuilt | **Yes** |
| `src/**` edited (no rebuild) | No (Next.js won't pick it up until rebuild) |
| `prisma/schema.prisma` edited | **Yes** (after `prisma generate`) |
| `public/**` static asset replaced | No (Passenger serves `public/` directly) |
| cPanel UI env var added | **Yes** |
| `package.json` deps changed | **Yes** (after `npm ci`) |

---

## How to view logs

### Primary log (Passenger + app)
```bash
# Real-time tail
tail -f ~/logs/alaminn.log

# Search for errors in the last 24h
grep -i error ~/logs/alaminn.log | grep "$(date +%Y-%m-%d)"

# Last 100 lines
tail -100 ~/logs/alaminn.log
```

### Backup log
```bash
tail -f ~/alaminn.info/storage/logs/backup.log
```

### Cron execution log (if cron redirects here)
```bash
# If you set cron output to a log file:
tail -f ~/alaminn.info/storage/logs/cron.log
```

### Apache access / error log
cPanel → **Metrics** → **Raw Access** (downloads) OR **Logs** → **Errors** (last 300 lines).

```bash
# Direct file (typical cPanel paths)
tail -f ~/access-logs/alaminn.info
tail -f ~/error-logs/alaminn.info  # may not exist; check ~/logs/error_log instead
```

---

## Application mode and behavior

In **Production** mode, the app:

- Sets `NODE_ENV=production` (forces React production build, disables dev warnings)
- Enables Next.js standalone caching middlewares
- Sends HSTS + CSP headers (`src/proxy.ts` only adds HSTS in production)
- Throws FATAL on missing required env vars (`AUTH_SECRET`, `EMAIL_FROM`) instead of using dev fallbacks
- Cookies are marked `Secure` (only sent over HTTPS)
- Source maps are NOT served (no `.map` files in `.next/standalone/`)

In **Development** mode (never use in production), the app:

- Uses dev fallback secrets (logs a warning)
- Cookies are NOT marked `Secure`
- HSTS header is NOT sent (would break localhost testing)
- Detailed error messages with stack traces are returned to the client

---

## Files Passenger expects on disk

```
/home/aloeduca/alaminn.info/
├── .env                          ← Secrets (mode 600, NOT in public_html)
├── server.js                     ← cPanel entry point (mode 644)
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── node_modules/                 ← Installed by `npm ci`
├── .next/
│   └── standalone/
│       ├── server.js             ← Next.js standalone server (built by `npm run build`)
│       ├── .next/
│       │   └── static/           ← JS/CSS chunks
│       └── public/               ← Static assets (copied by build)
├── public/                       ← Original static assets
├── prisma/
│   ├── schema.prisma             ← MySQL provider (swapped by setup)
│   └── seed.ts
├── deploy/cpanel/
│   ├── .env.production           ← Template (copy to .env)
│   ├── setup-cpanel.sh           ← First-time setup
│   └── redeploy.sh               ← Redeploy script
└── logs/                         ← (NOT here — logs are at ~/logs/alaminn.log)
```

If any of the above is missing, Passenger or `server.js` fails with a clear error in `~/logs/alaminn.log`.

---

## Mini-services (optional)

The project ships 4 background services that are NOT required for the main app:

| Service | Port | Purpose |
|---|---|---|
| `email-worker` | 3002 | Email retry queue (offloads SMTP retries) |
| `audit-worker` | 3003 | Async audit-log writer (offloads slow DB writes) |
| `health-monitor` | 3004 | Internal service health polling |
| `notification-service` | 3005 | Notification ingestion |

### On cPanel shared hosting
Background processes are typically NOT allowed (CloudLinux LVE limits). The main Next.js app runs fine without them — it falls back to synchronous writes and direct SMTP sends. You lose retry queues and async logging, but no functionality is broken.

### On cPanel VPS / dedicated (with SSH)
You can start them manually:
```bash
cd ~/alaminn.info/mini-services/email-worker
nohup bun run index.ts > ~/logs/email-worker.log 2>&1 &
disown
```

But they won't survive a server reboot. Use PM2 (`npm i -g pm2`) or systemd to keep them alive:
```bash
pm2 start ~/alaminn.info/mini-services/email-worker/index.ts --interpreter bun
pm2 save
pm2 startup  # follow the printed instructions to install the systemd unit
```

### Recommendation
On shared cPanel, skip the mini-services entirely. The app is fully functional without them.

---

## Common misconfigurations

### 1. Application root set to `public_html/alaminn.info`
**Symptom**: `.env` is web-accessible at `https://alaminn.info/.env`, leaking all secrets.
**Fix**: Application root MUST be `alaminn.info` (sibling of `public_html`, NOT inside it). The whole point of `server.js`'s `.env` loader is to keep secrets OUT of `public_html`.

### 2. Startup file set to `.next/standalone/server.js`
**Symptom**: `.env` is not loaded; `AUTH_SECRET` missing in production.
**Fix**: Startup file is `server.js` (project root). It loads `.env` and THEN requires `.next/standalone/server.js`. Bypassing it skips the env load.

### 3. Application mode set to "Development"
**Symptom**: Cookies lack `Secure` flag; HSTS not sent; detailed errors leak to clients.
**Fix**: Set to "Production". `server.js` will also force `NODE_ENV=production` regardless.

### 4. Node version 18 or older
**Symptom**: App crashes on boot with `TypeError: crypto.webcrypto is undefined` or similar.
**Fix**: Select Node 22.x (or 20.x minimum).

### 5. Environment variables in cPanel UI override `.env`
**Symptom**: `LOG_LEVEL=debug` you added via UI persists after editing `.env`.
**Fix**: cPanel UI vars win over `.env`. Remove the var from the UI (Edit → delete the row → Save) to let `.env` take effect.

### 6. Passenger log path is wrong
**Symptom**: `~/logs/alaminn.log` is empty even though `console.log` runs.
**Fix**: Confirm the "Passenger log file" field is `logs/alaminn.log` (relative to home). If it's `alaminn.log` without `logs/`, the file ends up at `~/alaminn.log` (still readable, just confusing).

### 7. Forgot to restart after `.env` change
**Symptom**: New `ADMIN_PASSWORD` doesn't work.
**Fix**: Always Restart from cPanel UI (or `touch tmp/restart.txt`) after editing `.env`. Passenger doesn't watch the file.

---

## Verification checklist

After creating the application, verify each of the following:

- [ ] Application root field = `alaminn.info`
- [ ] Application URL field = `alaminn.info`
- [ ] Application startup file = `server.js`
- [ ] Node.js version = 22.x (or 20.x minimum)
- [ ] Application mode = Production
- [ ] Passenger log file = `logs/alaminn.log`
- [ ] `.env` exists at `/home/aloeduca/alaminn.info/.env` with mode 600
- [ ] `server.js` exists at `/home/aloeduca/alaminn.info/server.js` with mode 644
- [ ] `.next/standalone/server.js` exists (built by `npm run build`)
- [ ] Status shows "Running" after Start App
- [ ] `curl -sI https://alaminn.info` returns `HTTP/2 200`
- [ ] `curl -s https://alaminn.info/api/health` returns `{"status":"ok",...}`
- [ ] `tail -f ~/logs/alaminn.log` shows the app boot banner with no errors

When all boxes are checked, the cPanel Node.js App is correctly configured.

---

## Reference

- **cPanel UI path**: cPanel → Software → Setup Node.js App
- **Application root**: `/home/aloeduca/alaminn.info`
- **Startup file**: `server.js`
- **Passenger log**: `/home/aloeduca/logs/alaminn.log`
- **Node version**: 22.x preferred, 20.x minimum
- **App mode**: Production
- **Env vars**: in `/home/aloeduca/alaminn.info/.env` (see `ENVIRONMENT_VARIABLES.md`)
- **Restart command (Terminal)**: `/opt/passenger/bin/passenger-config restart-app /home/aloeduca/alaminn.info` OR `touch /home/aloeduca/alaminn.info/tmp/restart.txt`
