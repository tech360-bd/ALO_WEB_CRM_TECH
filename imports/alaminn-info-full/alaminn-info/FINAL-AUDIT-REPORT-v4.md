# ALAMINN.INFO — Safe Repository Cleanup, DNS, GitHub & VPS Deployment Report (Session 4)

**Date:** 2026-09-17 (Asia/Dhaka)
**Project:** Al-Amin personal brand platform — `alaminn.info`
**Working copy:** `/home/z/my-project/alaminn/`
**Repo root:** `/home/z/my-project` (the `.git` directory lives here, NOT in `/home/z/my-project/alaminn/`)
**Backup:** `/home/z/my-project/backups/alaminn-pre-cleanup-20260917-041017/` (19 MB, source only)
**Prior reports preserved:**
- `/home/z/my-project/alaminn/FINAL-AUDIT-REPORT.md` (session 1)
- `/home/z/my-project/alaminn/FINAL-AUDIT-REPORT-v2.md` (session 2)
- `/home/z/my-project/alaminn/FINAL-AUDIT-REPORT-v3.md` (session 3)
- `/home/z/my-project/download/ALAMINN-INFO-Final-Audit-Report.pdf` (22-page PDF from session 1)

This report follows the exact 10-section structure requested in your prompt.

---

## 1. Checks actually rerun and results

### Pre-flight read-only inspection (no changes made)

Per your safety rule "First: inspect without changing anything":

| Command | Result |
|---|---|
| `pwd` | `/home/z/my-project/alaminn` |
| `git status --short --branch` | `## main` (working tree clean before I started) |
| `git branch --show-current` | `main` |
| `git log --oneline --decorate -5` | `d2fe6f0 (HEAD -> main)`, `ed1dd27`, `01ac9ad`, `a6c6a51 Initial commit` (4 commits total) |
| `git remote -v` | empty (zero remotes) |
| `git ls-files .env .next db/custom.db` | 1 + 11,374 + 1 = **11,376 sensitive/bloat files tracked** |
| `git status --ignored --short` | confirmed `node_modules/` and `.next/node_modules/` already ignored |
| `ps aux \| grep node` | empty (no stale processes from prior sessions) |
| `ss -tlnp \| grep :3001` | empty (port free) |

### Quality gates (rerun this session)

| Check | Command | Result | Status |
|---|---|---|---|
| Type check | `bun run typecheck` | `tsc --noEmit` exit 0, 0 errors | VERIFIED COMPLETE |
| Lint | `bun run lint` | `eslint .` exit 0, 0 errors, 0 warnings | VERIFIED COMPLETE |
| Tests | `bun run test` | 234 passed, 7 skipped (live dev server required) | VERIFIED COMPLETE |
| Production build | `bun run build` | Compiled successfully in 35.6s, 221/221 routes | VERIFIED COMPLETE |
| Standalone server start | `node .next/standalone/server.js` | Ready in 85ms | VERIFIED COMPLETE |
| `/api/health` probe | `curl` | HTTP 200 | VERIFIED COMPLETE |
| `/api/v1/admin/dashboard` (anon) | `curl` | HTTP 401 | VERIFIED COMPLETE |
| Security suite | `bun run security:test` (clean port, fresh server) | **22/22 PASS** on first run | VERIFIED COMPLETE |

All checks rerun this session with fresh evidence. No code regressions introduced by the documentation edits in Section 7.

---

## 2. Security-test history — earlier 429 failures and clean rerun (preserved per your instruction)

### Session 2 (earlier, preserved as historical record)

Per `FINAL-AUDIT-REPORT-v2.md` §3.3: the first security-test run that session had 5 of 22 tests fail with HTTP 429 (tests #1 SQL Injection, #6 Broken authentication, #7 Cookie security, #14 Mass assignment, #16 Session fixation). Diagnosis: stale `next-server` processes (PIDs 1975, 2083, 3310) on port 3001 retained in-memory rate-limiter state from a prior test run. After killing the stale processes and restarting the standalone server, all 22 tests passed.

**This is preserved as a historical record. It was NOT a code regression — it was operational state bleed.**

### Session 3 (per `FINAL-AUDIT-REPORT-v3.md` §2)

Pre-flight check confirmed no stale processes and port 3001 was free. Started a fresh standalone server. Security suite: **22/22 PASS on first run, zero failures.** Consistent with the in-memory rate-limiter explanation.

### Session 4 (this session)

Pre-flight check:
```
$ ps aux | grep -E "(node|next-server|standalone|bun)" | grep -v grep
(empty)

$ ss -tlnp | grep -E ":(3000|3001|3006|3100)"
(empty)
```

Started fresh standalone server on port 3001. Security suite: **22/22 PASS on first run.** No 429 failures, no code regression.

### Summary across all sessions

| Session | Pre-flight state | First-run result | Final result | Code changed? |
|---|---|---|---|---|
| 2 | Stale processes on 3001 | 5/22 fail (HTTP 429) | 22/22 pass after restart | No |
| 3 | Clean port, no processes | 22/22 pass | 22/22 pass | No |
| 4 | Clean port, no processes | 22/22 pass | 22/22 pass | Only documentation |

---

## 3. Repository findings and remediation status

### 3.1 Critical layout correction

The previous audit reports (sessions 1–3) stated the git repo was at `/home/z/my-project/alaminn/`. **This was incorrect.** The actual `.git` directory lives at `/home/z/my-project/.git`, making `/home/z/my-project` the repo root. The `alaminn/` directory is a subdirectory within the repo. This affects:

- The path where `.gitignore` must live (repo root, not `alaminn/`)
- The full paths of tracked files in git history (they are `alaminn/.env`, `alaminn/.next/...`, `alaminn/db/custom.db`, NOT `.env`, `.next/...`, `db/custom.db`)

I detected this when I initially created a `.gitignore` in `alaminn/` and noticed the backup directory (`/home/z/my-project/backups/`) was showing as untracked — only possible if the repo root is above `alaminn/`. I reverted my incorrect staging and re-did everything correctly at the repo root.

### 3.2 Tracked file inventory (before remediation)

```
$ git ls-files | awk -F/ '{print $1}' | sort | uniq -c | sort -rn
  12060 alaminn
    683 upload
      2 tool-results
      2 download
      1 worklog.md
      1 scripts
      1 db
      1 .gitignore
      1 .env
```

Top-level files tracked at repo root:
- `.env` (root) — contains only `DATABASE_URL=file:...` (local file path, no real secret)
- `.gitignore` — was just `skills/\nnode_modules/`
- `worklog.md` — multi-agent worklog
- `db/custom.db` (root) — 1.36 MB SQLite, same content as `alaminn/db/custom.db`
- `scripts/generate_audit_pdf.py` — the PDF generator script from session 1
- `download/ALAMINN-INFO-Final-Audit-Report.pdf` — the session-1 PDF deliverable (117 KB)
- `tool-results/*` — large persisted tool outputs (should be ignored)
- `upload/alaminn-extracted/*` — the extracted uploaded zip (683 files, all source)

Within `alaminn/`:
- `alaminn/.env` — synthetic dev placeholder env file
- `alaminn/.next/` — **11,374 Next.js build artifact files** (bloat)
- `alaminn/db/custom.db` — 1.13 MB SQLite, contains 2 OWNER-role users + inquiries + contacts

### 3.3 Backup created (before any destructive operation)

Per your safety rule "Second: create a backup":

| Field | Value |
|---|---|
| Backup path | `/home/z/my-project/backups/alaminn-pre-cleanup-20260917-041017/` |
| Backup size | 19 MB |
| Excludes | `node_modules/`, `.next/` (regenerable from source) |
| Includes | all source files, all docs, `db/custom.db`, `.env` files |
| Location safety | Backup is at `/home/z/my-project/backups/`, which IS under the repo root. **I have added `backups/` to the new `.gitignore` so it will not be pushed.** The backup is preserved locally regardless of git state. |
| Disk space pre-check | 7.4 GB available, backup used 19 MB — no disk pressure |

Backup verified to exist with `ls` before continuing.

### 3.4 Remediation staged (NOT yet committed)

Files staged in git index:

| Action | Path | Reason |
|---|---|---|
| **M** (modified) | `.gitignore` | Expanded from `skills/\nnode_modules/` to a comprehensive 85-line ignore list (env files, .next/, node_modules/, db/*.db, logs, editor files, upload/, tool-results/, agent-ctx/, backups/) |
| **A** (added) | `alaminn/.env.example` | New safe template with placeholders only — no real secrets |
| **D** (untracked, local preserved) | `.env` (root) | `git rm --cached` — local file preserved |
| **D** (untracked, local preserved) | `alaminn/.env` | `git rm --cached` — local file preserved |
| **D** (untracked, local preserved) | `alaminn/.next/` (11,374 files) | `git rm --cached -r` — local build output preserved, will be regenerated by `bun run build` |
| **D** (untracked, local preserved) | `alaminn/db/custom.db` | `git rm --cached` — local DB preserved |
| **D** (untracked, local preserved) | `db/custom.db` (root) | `git rm --cached` — local DB preserved |

**Total: 11,380 staged changes** (1 add + 1 modify + 11,378 untracks).

All local files confirmed preserved via `ls -la .env alaminn/.env alaminn/db/custom.db db/custom.db` — all four files still exist on disk with original timestamps and sizes.

### 3.5 Status: BLOCKED OR NOT IMPLEMENTED (awaiting owner authorization to commit)

Per your instruction: "Do not stage or commit until the staged changes have been reviewed" and "I explicitly authorize the push."

The staged changes are ready for your review. I have NOT committed them. The exact commands I would use (after your authorization) are:

```bash
cd /home/z/my-project
git diff --cached --stat           # already shown to you above
git commit -m "chore: add .gitignore and .env.example, untrack build artifacts and local env/db files

- .gitignore: ignore .env, .next/, node_modules/, db/*.db, logs, editor files, upload/, tool-results/, agent-ctx/, backups/
- alaminn/.env.example: safe template with placeholder values only
- Untrack .env (root), alaminn/.env, alaminn/.next/ (11,374 files), alaminn/db/custom.db, db/custom.db
- Local files preserved (git rm --cached only)
- No source code in src/ untracked
- No real secrets exposed (only synthetic dev placeholder values were in tracked .env files)"
```

---

## 4. Secret exposure audit and rotation requirements

### 4.1 What was actually committed (verified, redacted)

| File (in git HEAD) | Content | Real secret? |
|---|---|---|
| `.env` (root) | `DATABASE_URL=file:...` (local file path) | No — local path only |
| `alaminn/.env` | `AUTH_SECRET="dev_only_secret_please_change_in_production_a8f3k2j9d7h1"` (synthetic dev placeholder, 58 chars) | No — obviously synthetic |
| `alaminn/.next/standalone/.env` | Same as `alaminn/.env` | No — same synthetic placeholder |
| `alaminn/db/custom.db` | SQLite with 2 OWNER users; 1 (`admin@alaminn.info`) has a 168-char scrypt password hash | Yes — see rotation requirement below |
| `db/custom.db` (root) | Same content | Yes — same rotation requirement |

### 4.2 What needs rotation (no values shown)

| Affected service | What is exposed | Required action |
|---|---|---|
| `admin@alaminn.info` account | A real scrypt password hash (168 chars) committed to git. The seed password `ChangeMeNow!2024` is documented in `prisma/seed.ts:9` as the fallback default. Anyone with repo access can derive the password. | **MUST rotate** the `admin@alaminn.info` password after first production deploy, AND remove the `ChangeMeNow!2024` fallback from `prisma/seed.ts:9` so the seed script refuses to run without an explicit `ADMIN_BOOTSTRAP_PASSWORD` env var. |
| No other services | No production API keys, no SMTP credentials, no WhatsApp tokens, no Telegram tokens, no real `AUTH_SECRET` | None |

### 4.3 History-rewrite assessment

Per your safety rule "Do not rewrite history or force-push without my explicit approval":

The committed `.env` files contain only synthetic dev placeholders. The committed `db/custom.db` contains a real password hash, but the corresponding plaintext (`ChangeMeNow!2024`) is documented in `prisma/seed.ts:9` which will remain in the repo as a fallback (until separately removed).

**Recommendation:** Once you authorize the GitHub push, history rewrite with `git filter-repo` is **recommended** (not strictly required, because no real production secrets are leaked) to remove the 11,374 `.next/` build artifacts from every prior commit. This would dramatically reduce the repo size from ~hundreds of MB to ~20 MB.

**If you authorize history rewrite, the exact commands would be:**

```bash
# Prerequisites: pip install git-filter-repo; backup verified
cd /home/z/my-project

# Remove .env, .next/, db/custom.db from ALL commits in history
git filter-repo --path .env \
                --path alaminn/.env \
                --path alaminn/.next/standalone/.env \
                --path alaminn/.next \
                --path alaminn/db/custom.db \
                --path db/custom.db \
                --invert-paths

# Consequences:
# - All 4 prior commits will be rewritten with new SHAs
# - The repo will shrink dramatically (11,374 fewer files in history)
# - Any clone of the repo (there are none — no remote configured) would need to be re-cloned
# - The current branch (main) will point to a new commit SHA
# - All local working files are preserved (filter-repo only rewrites history, not working tree)
```

**I have NOT executed this. It requires your explicit approval.**

### 4.4 What I will NOT do

- Will not put replacement secrets in git or ordinary chat
- Will not modify `prisma/seed.ts` to remove the `ChangeMeNow!2024` fallback without your explicit authorization (it's a code change, not just a doc change)
- Will not push until you have reviewed the staged diff and authorized the push
- Will not rewrite history without your explicit approval and a verified backup

---

## 5. DNS status and owner action required

### 5.1 Fresh DNS verification (this session)

```
$ dig @8.8.8.8 alaminn.info A +short
(empty — no A record returned)

$ dig @8.8.8.8 alaminn.info NS +short
(empty — NS records cannot be resolved because the nameservers themselves do not resolve)

$ dig @8.8.8.8 ns1.aloeducation.com A +short
(empty — no glue record at the .info registry)

$ dig @8.8.8.8 ns2.aloeducation.com A +short
(empty — no glue record)

$ dig +trace alaminn.info
alaminn.info.    3600   IN   NS   ns1.aloeducation.com.
alaminn.info.    3600   IN   NS   ns2.aloeducation.com.
couldn't get address for 'ns1.aloeducation.com': failure
couldn't get address for 'ns2.aloeducation.com': not found

$ curl -sI --max-time 8 https://alaminn.info
(empty — no response, DNS broken)
```

### 5.2 Root cause (unchanged from prior sessions)

The `.info` TLD registry has `alaminn.info` delegated to `ns1.aloeducation.com` and `ns2.aloeducation.com`. Neither of those nameservers has a glue record (i.e. an A record at the registry) nor is independently resolvable through any upstream DNS. As a result, the entire `alaminn.info` zone is unreachable on the public internet.

### 5.3 Registrar identification

I do not have WHOIS access in this environment to identify which registrar currently manages `alaminn.info`. You (the owner) will know which registrar you used to purchase the domain — common possibilities include Namecheap, GoDaddy, Cloudflare Registrar, Google Domains (now Squarespace), Porkbun, etc. Log in to that registrar's control panel to perform the fix below.

### 5.4 Exact registrar-side correction (no invented values)

Per your safety rule "Do not invent nameserver IPs, glue records, DNS targets, or registrar details" — I will NOT make up specific NS values. Instead, here are the three verified remediation options. You must pick one based on your actual hosting setup:

#### Option 1 — Point at your hosting provider's nameservers (most common)

If `alaminn.info` will be hosted on a VPS or hosting provider (DigitalOcean, AWS, Hetzner, Namecheap Shared Hosting, cPanel host, etc.), log in to your hosting provider's control panel and find the nameservers they assigned you at signup. They will look something like:
- DigitalOcean: `ns1.digitalocean.com`, `ns2.digitalocean.com`, `ns3.digitalocean.com`
- AWS Route 53: 4 NS values like `ns-123.awsdns-04.com`, `ns-456.awsdns-05.net`, etc.
- Hetzner: `ns1.your-server.de`, `ns.second-ns.de`, `ns1.your-server.de`

Then at your domain registrar, edit the NS delegation for `alaminn.info` and replace `ns1.aloeducation.com` and `ns2.aloeducation.com` with the values your hosting provider gave you. Save. Wait for DNS propagation (5 minutes to 48 hours; check with `dig @8.8.8.8 alaminn.info NS +short`).

#### Option 2 — Point at Cloudflare's nameservers (free, recommended if you don't have a hosting provider yet)

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up
2. Click "Add a site" → enter `alaminn.info` → select the Free plan
3. Cloudflare will scan the existing DNS records (none will be found, which is expected)
4. Cloudflare will assign you two nameservers that look like `asa.ns.cloudflare.com` and `bert.ns.cloudflare.com` (the actual names will be unique to your account)
5. At your domain registrar, edit the NS delegation for `alaminn.info` and replace `ns1.aloeducation.com` and `ns2.aloeducation.com` with the two Cloudflare-assigned nameservers. Save.
6. Back in Cloudflare, click "Check nameservers" and wait for activation (5 minutes to 24 hours)
7. Once active, add an A record in Cloudflare's DNS panel pointing `alaminn.info` to your server's IPv4 address

#### Option 3 — Restore glue records for `ns1.aloeducation.com` / `ns2.aloeducation.com`

If `ns1.aloeducation.com` and `ns2.aloeducation.com` are intentionally meant to be the authoritative nameservers (i.e. you operate your own authoritative DNS server), then `aloeducation.com` must have A records for `ns1` and `ns2` AND the `.info` registry must have those A records registered as glue records. This option only makes sense if you operate your own authoritative DNS infrastructure. If you choose this path, the registrar will need both:
- The hostname of the nameserver (e.g. `ns1.aloeducation.com`)
- The IPv4 address of that nameserver (which you must provide from your own DNS server configuration)

### 5.5 What I will NOT do

- Will not change DNS records, NS delegations, or registrar settings
- Have no registrar credentials
- Will not invent specific NS values for your hosting provider

### 5.6 What I WILL do once you've made the change

After you confirm the registrar change, I will rerun the DNS probes and HTTPS checks:

```bash
dig @8.8.8.8 alaminn.info NS +short   # should return the new NS values
dig @8.8.8.8 alaminn.info A +short    # should return an IP address
curl -sI https://alaminn.info          # should return HTTP 200 from your production server
curl -sI https://alaminn.info/api/health  # should return HTTP 200 JSON
```

**Until DNS resolves, the domain is NOT live and NOT production-verified.**

---

## 6. GitHub URL, branch, and commit (only after verified)

### Status: BLOCKED OR NOT IMPLEMENTED — no remote configured, no URL provided by owner

The local repository currently has:
- 4 commits: `a6c6a51` (Initial) → `01ac9ad` → `ed1dd27` → `d2fe6f0` (HEAD on `main`)
- Zero remotes
- No `.github/workflows/` directory

I will NOT invent a GitHub URL. Per your instruction "Do not push until the repository URL and branch are confirmed," I am waiting for you to:

1. **Create the empty GitHub repository** at https://github.com/new (do NOT initialize with README, .gitignore, or license — to avoid merge conflicts). Suggested name: `alaminn.info` (or whatever you prefer).
2. **Tell me the exact URL** (SSH form: `git@github.com:<your-username>/alaminn.info.git`, or HTTPS form: `https://github.com/<your-username>/alaminn.info.git`).
3. **Tell me the intended branch** (default `main`; if you want a different production branch name like `production` or `release`, tell me).

Once you provide these, the planned commands are (I will show them to you and wait for explicit authorization before running):

```bash
cd /home/z/my-project

# 1. (Already done, awaiting your authorization to commit)
git commit -m "chore: add .gitignore and .env.example, untrack build artifacts and local env/db files"

# 2. Add the remote you provided
git remote add origin <YOUR_CONFIRMED_URL>

# 3. Push main
git push -u origin main

# 4. Verify
git remote -v
git log origin/main --oneline -5
```

After the push succeeds, I will author `.github/workflows/ci.yml` (lint + typecheck + test + build on every PR) and `.github/workflows/deploy.yml` (deploy on push to main, after you configure the deployment secrets in GitHub Actions settings).

### What I will NOT do

- Will not add a fabricated remote
- Will not push to an unconfirmed URL
- Will not force-push as a shortcut
- Will not push until the staged diff is reviewed AND you explicitly authorize the push
- Will not push until secret rotation requirements are addressed (Section 4.2)

---

## 7. Documentation changes (this session)

### 7.1 Documentation drift fix — middleware.ts → proxy.ts

Per your instruction section 5: "Verify the current code and documents. If confirmed, update only the stale references and related explanations. Do not alter working security code just to match outdated documentation."

**Verified:** `src/middleware.ts` does NOT exist. `src/proxy.ts` exists and is the Next.js 16 renamed middleware file (Next.js 16 renamed the convention from `middleware.ts` to `proxy.ts`). The security headers ARE correctly applied via `src/proxy.ts` (confirmed by `curl -sI` returning all 6 headers).

**Files updated:**

| File | Lines changed | Change |
|---|---|---|
| `alaminn/SECURITY-CHECKLIST.md` | 8, 89, 96, 97, 201 (heading), 220, 222, 234-237, 242 | All `src/middleware.ts` references → `src/proxy.ts`; `[ ]` for CSP → `[x]` with verification evidence; "CSP Recommendation" section renamed to "CSP Hardening" with updated text reflecting that CSP IS implemented; Known Gap (a) rewritten from "CSP not implemented" to "CSP uses unsafe-inline/unsafe-eval (follow-up: nonce-based CSP)"; Known Gap (b) rate-limiting remediation updated to reference `src/proxy.ts` layer |
| `alaminn/docs/security.md` | 342 | `Implementation: src/middleware.ts.` → `Implementation: src/proxy.ts (Next.js 16 renamed middleware.ts to proxy.ts; ...)` |
| `alaminn/docs/security-report.md` | 322-328 | Recommendation #1 rewritten from "Add a CSP header to src/middleware.ts" to "Migrate to nonce-based CSP. The existing src/proxy.ts already sets a strict Content-Security-Policy..." |

### 7.2 Verification after documentation edits

```
$ grep -nE "middleware\.ts|src/middleware" alaminn/SECURITY-CHECKLIST.md alaminn/docs/security.md alaminn/docs/security-report.md
```

The only remaining mentions of `middleware.ts` are intentional explanations of the rename (e.g. "Next.js 16 renamed `middleware.ts` to `proxy.ts`"). All actual file references are now `src/proxy.ts`.

### 7.3 Quality gates rerun after doc edits

| Check | Result |
|---|---|
| `bun run typecheck` | ✓ 0 errors |
| `bun run lint` | ✓ 0 errors, 0 warnings |
| `bun run test` | ✓ 234 pass, 7 skip (unchanged) |
| `bun run build` | ✓ 35.6s, 221/221 routes (unchanged) |
| `bun run security:test` | ✓ 22/22 PASS on first run (unchanged) |

No regressions introduced. Documentation changes do not affect runtime behavior.

### 7.4 Source code changes

**None.** No source code in `src/`, `prisma/`, `public/`, `scripts/`, `mini-services/`, `tests/`, `deploy/` was modified. Only 3 markdown documentation files were edited.

---

## 8. Telegram and social-media scope status

### 8.1 Telegram

**Status: BLOCKED OR NOT IMPLEMENTED (out of scope unless authorized)**

Fresh verification this session:
```
$ grep -rliE "telegram" alaminn/src/ alaminn/docs/
(empty)

$ grep -rliE "telegram" --include="*.ts" --include="*.tsx" --include="*.md" --include="*.json" \
    --exclude-dir=node_modules --exclude-dir=.next /home/z/my-project/alaminn/
alaminn/FINAL-AUDIT-REPORT.md
alaminn/FINAL-AUDIT-REPORT-v2.md
alaminn/FINAL-AUDIT-REPORT-v3.md
```

Zero references in source code (`src/`) or documentation (`docs/`). The only mentions of the word "Telegram" are in my own prior audit reports (which themselves only document its absence).

This is treated as **new scope requiring your explicit authorization**. If you authorize it in a future session, the implementation plan would cover:
1. Bot setup via @BotFather (you create the bot, you keep the token, you provide it out-of-band)
2. Secure token storage in `.env.production` as `TELEGRAM_BOT_TOKEN` (never in git)
3. Webhook validation route (`/api/v1/telegram/webhook` with `X-Telegram-Bot-Api-Secret-Token` header check)
4. Command parser + approval-flow bridge to existing `AiApproval` Prisma model
5. Error handling, rate-limit compliance, retry logic
6. Tests + documentation
7. Privacy controls (no PII sent to Telegram, no unrestricted shell access)

**I have not created a Telegram bot, generated a bot token, or written any Telegram code.**

### 8.2 Social media

**Status: BLOCKED OR NOT IMPLEMENTED (out of scope unless authorized)**

Fresh verification of `alaminn/src/lib/site-data.ts`:

| Platform | URL configured | Handle |
|---|---|---|
| Facebook | ✓ Real URL: `https://www.facebook.com/share/1axbZeACyf/?mibextid=wwXIfr` | `"Al Aminn"` |
| WhatsApp | ✓ Real display number via `WHATSAPP_NUMBER` | (WhatsApp number) |
| LinkedIn | ✗ `href: FACEBOOK_URL` | `"Find via Facebook"` |
| Instagram | ✗ `href: FACEBOOK_URL` | `"Find via Facebook"` |
| X / Twitter | ✗ `href: FACEBOOK_URL` | `"Find via Facebook"` |
| YouTube | ✗ `href: FACEBOOK_URL` | `"Find via Facebook"` |
| TikTok | ✗ `href: FACEBOOK_URL` | `"Find via Facebook"` |
| Pinterest | Not in socialLinks array | — |

Only Facebook is a real social destination. All others are placeholders that redirect to Facebook.

**Two distinct kinds of work are bundled here:**

1. **Simple profile-link replacement** (low effort, no API integration): replace each `"Find via Facebook"` placeholder with the owner's actual profile URL on that platform. Requires the owner to provide each profile URL. No platform API access is needed.

2. **Authenticated publishing integrations** (high effort, requires OAuth + API + content calendar + scheduling): build the full publishing/scheduling/analytics infrastructure per platform. Requires per-platform developer app registration (Meta Graph API for FB+IG, LinkedIn Marketing API, YouTube Data API v3, TikTok Content Posting API, X API v2, Pinterest API), OAuth flows, content calendar model + admin UI, draft → review → publish workflow, per-platform media transformation, analytics aggregation, token refresh handling. Estimated 5–10 days of work for the full set.

**I have not fabricated any profile URLs, registered any platform apps, configured any OAuth flows, or built any publishing infrastructure.**

### 8.3 N8N Workflow Templates file

**Status: BLOCKED OR NOT IMPLEMENTED (file not present)**

Fresh verification:
```
$ find /home/z/my-project -maxdepth 4 -iname "*n8n*" -o -iname "*workflow*template*"
(empty)
```

The "4000 N8N Workflow Automation Templates" file referenced in earlier prompts is **not present** on disk. Only the original `ALAMINN-INFO-FINAL-PRODUCTION (2).zip` was uploaded. This file is NOT required for the core ALAMINN.INFO deployment. If you need it for follow-up work, please re-upload.

---

## 9. Production access and deployment status

### 9.1 Status: BLOCKED OR NOT IMPLEMENTED — production deployment not attempted

Per your safety rules section 6, the following prerequisites are all unmet:

| Prerequisite | Status |
|---|---|
| Authorized SSH credentials | Not provided |
| Independently verified SSH host-key fingerprint (obtained out-of-band) | Not provided |
| `.env.production` values | Not provided |
| Reverse-proxy choice (Nginx / Caddy / OpenLiteSpeed) | Not confirmed by owner |
| Application port and process manager | Not confirmed |
| Deployment directory on the server | Not confirmed |
| Backup and rollback procedure verified | Not possible without server access |

### 9.2 What I will NOT do

- Will not attempt to SSH to any server
- Will not fabricate environment values, secrets, hostnames, IP addresses, SSH users, ports, or deployment paths
- Will not deploy, restart production services, alter firewall rules, or change DNS without explicit authorization
- Will not simulate a deployment or claim success

### 9.3 What the owner must provide (via secure channels, NOT in this chat)

Please provide (out-of-band) the following:

1. **Production hostname or IP** and **SSH username**
2. **SSH access method** (key-based auth preferred; the private key should be provided via a secret manager or in person, NOT pasted in chat)
3. **SSH host-key fingerprint** independently verified out-of-band (e.g. via your hosting provider's console, or by running `ssh-keyscan -H <host> 2>/dev/null | ssh-keygen -lf -` from a trusted machine). I will not connect without this.
4. **Intended reverse proxy** — Nginx, Caddy, or OpenLiteSpeed (the repo ships configs for all three)
5. **Application port and process manager** — PM2 (default, `deploy/ecosystem.pm2.cjs` ships), systemd (`deploy/alaminn-info.service` ships), or Docker (`Dockerfile` + `docker-compose.yml` ship)
6. **Deployment directory** on the server (historical reference was `/root/alo-github-main`, but this must be verified against the actual server)
7. **Required environment variables** — full list is in `alaminn/.env.example`. At minimum: `AUTH_SECRET`, `DATABASE_URL` (production MariaDB), `NEXTAUTH_URL`, `EMAIL_FROM`, `SMTP_*` or `RESEND_API_KEY`, `WHATSAPP_API_PHONE_NUMBER_ID`, `WHATSAPP_API_TOKEN`, `CRON_SECRET`, `HIGHER_STUDY_REFERRAL_SECRET`, `ENGLISH_LEARNING_REFERRAL_SECRET`
8. **Secure secret-management method** on the server — e.g. environment variables in a systemd unit file with `EnvironmentFile=`, or a secrets manager like Vault, or a `.env.production` file with `chmod 600` outside the web root
9. **Backup and rollback procedure** — `scripts/backup.sh` and `scripts/restore.sh` ship in the repo; confirm where backups should be stored and how often to run

### 9.4 Deployment plan (will execute only after all prerequisites are met and authorized)

1. Verify the production runtime and build requirements (Node.js 20+, MariaDB 10.6+, PM2 or systemd)
2. Confirm the exact commit to deploy (will be the verified `main` HEAD after the GitHub push succeeds)
3. Confirm the environment configuration without exposing secret values
4. Confirm the reverse-proxy configuration and TLS plan (Let's Encrypt via Certbot, or via Cloudflare's edge TLS)
5. Confirm health checks (`/api/health`, `/api/v1/admin/dashboard` returns 401 anonymous), logs, backups, and rollback procedure
6. Obtain explicit authorization before deployment or service restarts
7. Deploy only the approved commit
8. Verify health, critical routes, authentication, HTTPS, and security headers on the actual production domain
9. If anything fails after connection, use the verified rollback procedure (restore previous release + verify)

---

## 10. Exact next owner actions (priority order)

Each action unblocks the next. I have stopped at every step that requires your authorization, per your safety rules.

### Action 1 — Review the staged git changes (HIGHEST PRIORITY)

Run this in your terminal:
```bash
cd /home/z/my-project
git diff --cached --stat | head -20
git diff --cached -- .gitignore | head -100
git diff --cached -- alaminn/.env.example
```

Confirm:
- `.gitignore` modifications are correct
- `alaminn/.env.example` contains only placeholder values
- The 11,378 untracked files are all `.env`, `.next/`, or `db/custom.db` (not source code)

### Action 2 — Authorize the commit

Reply with: "Authorize commit." I will then run `git commit -m "chore: ..."` (the exact message is in Section 3.4).

### Action 3 — Decide on history rewrite (optional, recommended)

Reply with one of:
- "Authorize history rewrite." — I will run `git filter-repo` per the commands in Section 4.3. This will remove `.env`, `.next/`, and `db/custom.db` from ALL prior commits, dramatically reducing repo size. The local working files are preserved.
- "Skip history rewrite." — The current commit history (with the synthetic placeholder `.env` and the build-artifact bloat) will be pushed as-is. This is acceptable because no real production secrets are leaked, but the repo will be larger than necessary.

### Action 4 — Create the GitHub repository and provide the URL

Create the empty repository at https://github.com/new (no README, no .gitignore, no license). Reply with:
- The exact remote URL (e.g. `git@github.com:your-username/alaminn.info.git`)
- The intended production branch (default `main`)

### Action 5 — Authorize the push

Reply with: "Authorize push." I will then run `git remote add origin <URL>` and `git push -u origin main` and verify the result.

### Action 6 — Fix DNS (parallel; can be done anytime)

Choose one of the three options in Section 5.4. The fastest is usually Option 2 (Cloudflare). Once you've made the change at your registrar, reply with: "DNS change made." I will rerun the DNS probes and HTTPS checks.

### Action 7 — Provide VPS access and confirm reverse-proxy choice

Provide (out-of-band):
- Production server SSH host/user/port
- Independently verified SSH host-key fingerprint
- Reverse-proxy choice (Nginx / Caddy / OLS)
- Production environment values
- Deployment directory

Reply with: "VPS details provided out-of-band." I will then prepare the deployment plan and ask for final authorization before executing.

### Action 8 — Decide on Telegram + social-media scope (parallel; can be done anytime)

Reply with one of:
- "Telegram in scope." — I will draft the implementation plan (you will need to create the bot via @BotFather and provide the token out-of-band)
- "Simple social-media link replacement in scope." — Provide the actual profile URLs for LinkedIn, Instagram, X, YouTube, TikTok, Pinterest (one per line) and I will replace the placeholders
- "Full social-media publishing integrations in scope." — This is multi-day work; I will draft the per-platform implementation plan
- "Skip Telegram and social media." — These remain documented as out-of-scope

### Action 9 — Re-upload the N8N Workflow Templates file (only if needed)

Only required if you want to use n8n workflow templates as part of the Telegram / social-media / automation follow-up. Not required for the core ALAMINN.INFO deployment.

### Action 10 — Rotate the admin password after first production deploy

After the first production deploy, log in to the admin Command Center and change the `admin@alaminn.info` password. The current password hash is `ChangeMeNow!2024` (the seed fallback documented in `prisma/seed.ts:9`) — anyone with repo access knows it. After rotation, consider separately removing the `ChangeMeNow!2024` fallback from `prisma/seed.ts:9` (requires a code change + your authorization).

---

## Summary

| Section | Status |
|---|---|
| 1. Quality gates (local) | **VERIFIED COMPLETE** |
| 2. Security-test history preserved | **VERIFIED COMPLETE** |
| 3. Repository cleanup staged | **IMPLEMENTED BUT NOT VERIFIED** (staged, awaiting commit authorization) |
| 4. Secret exposure audited | **VERIFIED COMPLETE** — no real production secrets; one admin password hash needs rotation post-deploy |
| 5. DNS fix | **BLOCKED OR NOT IMPLEMENTED** — owner must act at the registrar |
| 6. GitHub remote | **BLOCKED OR NOT IMPLEMENTED** — awaiting owner's repo URL + branch + push authorization |
| 7. Documentation drift fix | **VERIFIED COMPLETE** — 3 files updated, all checks rerun green |
| 8. Telegram + social media | **BLOCKED OR NOT IMPLEMENTED** (out of scope unless authorized) |
| 9. Production deployment | **BLOCKED OR NOT IMPLEMENTED** — no server access, no env values, no reverse-proxy choice |
| 10. Next owner actions | 10 specific actions documented above |

**Final deployment status: BLOCKED OR NOT IMPLEMENTED.** The local codebase is verified-ready. Production deployment is blocked by infrastructure dependencies (DNS, GitHub, VPS) that only the owner can resolve. No claim of "deployed", "live", "connected", or "verified-in-production" is made.

---

*End of session 4 report. All evidence is reproducible from the working copy at `/home/z/my-project/alaminn/`. The backup at `/home/z/my-project/backups/alaminn-pre-cleanup-20260917-041017/` is preserved. The staged git changes are awaiting your review and authorization. No production data, secrets, or infrastructure have been touched.*
