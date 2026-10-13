# .htaccess Security Rules — Explainer

This document explains every `.htaccess` file deployed in the Alaminn.info
project, what each rule does, why it exists, and how to verify it works in
production on cPanel / Apache.

Five files are deployed:

| # | File (relative to project root)         | Protects                                     |
|---|-----------------------------------------|----------------------------------------------|
| 1 | `public/.htaccess`                      | Static assets served by Apache under Passenger |
| 2 | `.htaccess`                             | The application root itself                  |
| 3 | `storage/.htaccess`                     | Private uploads, exports, backups            |
| 4 | `db/.htaccess`                          | SQLite dev DB, migration artifacts           |
| 5 | `docs/.htaccess`                        | Internal documentation                       |

In production the project root is `/home/aloeduca/alaminn.info`. cPanel's
"Setup Node.js App" creates a symlink in `public_html/` that points at this
root. Apache reads `.htaccess` files starting at the symlink target and walks
up the directory tree, applying every `.htaccess` it finds along the way.

---

## 1. How Passenger interacts with .htaccess

**Short version:** Passenger handles dynamic requests, Apache handles static
files. Both honor `.htaccess`, but at different layers.

### Dynamic requests (`/`, `/higher-study`, `/api/...`, etc.)

1. Browser → Apache vhost
2. Apache vhost has a `PassengerApp` directive pointing at the project root
3. Passenger spawns (or reuses) a Node.js worker that runs `server.js`
4. The worker receives the full request and Next.js routes it internally
5. Apache **does** parse `.htaccess` for auth/rewrite rules *before* handing
   the request to Passenger, so deny-rules and `FilesMatch` directives still
   fire — but anything Next.js generates after that point is sent straight
   back through Passenger, bypassing per-file rules.

**Practical effect:** a request for `/api/v1/users` is served by the Next.js
API route, not by Apache. `.htaccess` cannot block individual API paths —
that is the responsibility of the Next.js auth middleware. `.htaccess` can,
however, block files on disk (e.g. `server.js`, `package.json`, `.env`).

### Static requests (`/logo.svg`, `/_next/static/.../chunk.js`, etc.)

1. Browser → Apache vhost
2. Apache checks `.htaccess` chain (project root → `public/`)
3. If the file exists in `public/` (or `public_html/`) and is not blocked,
   Apache serves it directly — Passenger never sees the request
4. If `FilesMatch`/`RewriteRule` denies it, Apache returns 403

**Practical effect:** rules in `public/.htaccess` are the *primary* gate for
serving static files. This is where we add caching headers, compression, and
file-type denylists.

### Why defense in depth matters

Even though Passenger is supposed to handle everything, misconfigurations
happen:

- cPanel "Setup Node.js App" can be deleted, leaving the symlink pointing at
  a raw directory Apache will happily list
- AutoSSL / cPanel updates occasionally reset the vhost
- A misconfigured `DocumentRoot` can expose the project root directly
- An attacker who finds an LFI vulnerability in any Next.js route could
  trick the app into reading files outside `public/`

`.htaccess` rules survive all of these scenarios because Apache enforces
them before any application code runs.

---

## 2. `public/.htaccess` — static asset protection

This file lives in the directory Apache serves static files from. Every rule
here applies only to files inside `public/`.

### 2.1 Block dotfiles

```apache
<FilesMatch "^\.">
    Require all denied
</FilesMatch>
```

**What it does:** denies all HTTP access to any file whose name begins with a
dot (`.`).

**Why:** dotfiles are configuration files on Unix systems. Examples that
have leaked credentials historically: `.git/config`, `.env`, `.DS_Store`,
`.htpasswd`, `.npmrc`, `.vscode/settings.json`. None of them belong in a
web-served directory.

**Test:**
```bash
# Place a test dotfile (do this locally, not in prod)
touch public/.leaktest
# From the prod server:
curl -I https://alaminn.info/.leaktest
# Expected: HTTP/2 403
rm public/.leaktest
```

### 2.2 Block `.env` files

```apache
<FilesMatch "^\.env">
    Require all denied
</FilesMatch>
```

**What it does:** denies access to any file starting with `.env`
(`.env`, `.env.local`, `.env.production`, etc.).

**Why:** `.env` files contain `DATABASE_URL`, `AUTH_SECRET`, API keys, SMTP
credentials. This is the single most damaging file that could leak. The
rule is technically redundant with §2.1 (`.env` starts with a dot) but is
duplicated for explicitness and resilience if §2.1 is ever loosened.

**Test:**
```bash
echo "SECRET=do-not-leak" > public/.env.test
curl -I https://alaminn.info/.env.test
# Expected: HTTP/2 403
rm public/.env.test
```

### 2.3 Block backup files

```apache
<FilesMatch "\.(bak|backup|old|orig|tmp|swp|save|~)$">
    Require all denied
</FilesMatch>
```

**What it does:** denies access to files ending in `.bak`, `.backup`,
`.old`, `.orig`, `.tmp`, `.swp`, `.save`, or `~`.

**Why:** editors (vim, emacs) and careless deploy scripts leave these
behind. They typically contain source code or prior versions of files that
should not be public. Examples: `index.html.bak`, `.swp` (vim swap file),
`config.js~`.

**Test:**
```bash
echo "old code" > public/index.html.bak
curl -I https://alaminn.info/index.html.bak
# Expected: HTTP/2 403
rm public/index.html.bak
```

### 2.4 Block SQL dumps

```apache
<FilesMatch "\.(sql|sql\.gz|db|db-journal|sqlite)$">
    Require all denied
</FilesMatch>
```

**What it does:** denies access to `.sql`, `.sql.gz`, `.db`,
`.db-journal`, `.sqlite` files.

**Why:** a leaked SQL dump is a full data breach — every user, password
hash, and PII record exposed. SQLite `.db` files in particular can be
downloaded and opened locally with zero tooling. None of these should ever
live in `public/`, but this is the safety net.

**Test:**
```bash
echo "CREATE TABLE leak(id int);" > public/dump.sql
curl -I https://alaminn.info/dump.sql
# Expected: HTTP/2 403
rm public/dump.sql
```

### 2.5 Block archive files

```apache
<FilesMatch "\.(zip|tar|tar\.gz|tgz|tar\.bz2|rar|7z|gz)$">
    Require all denied
</FilesMatch>
```

**What it does:** denies access to compressed archives.

**Why:** deploy artifacts (`alaminn-info-cpanel.zip`,
`alaminn-info-project.zip`) and source backups have no business being served
to browsers. A leaked source archive reveals every secret, every internal
endpoint, every comment.

**Test:**
```bash
echo "fake zip" > public/leak.zip
curl -I https://alaminn.info/leak.zip
# Expected: HTTP/2 403
rm public/leak.zip
```

### 2.6 Block log files

```apache
<FilesMatch "\.(log|log\.\d+)$">
    Require all denied
</FilesMatch>
```

**What it does:** denies access to `.log` and `.log.N` (rotated logs,
e.g. `app.log.1`, `app.log.20240101`).

**Why:** application logs frequently contain stack traces with file paths,
user IDs, email addresses, and occasionally Authorization headers or
session tokens captured by mistake.

**Test:**
```bash
echo "stack trace with /home/aloeduca/..." > public/error.log
curl -I https://alaminn.info/error.log
# Expected: HTTP/2 403
rm public/error.log
```

### 2.7 Block source maps in production

```apache
<FilesMatch "\.map$">
    Require all denied
</FilesMatch>
```

**What it does:** denies access to `.map` files (JavaScript / CSS source
maps).

**Why:** source maps map minified production JS back to the original
TypeScript source, including comments, original variable names, and file
structure. Great for debugging; terrible for security because they reveal
internal API paths, helper function names, and component structure that
attackers can use for reconnaissance.

**Test:**
```bash
echo '{"version":3}' > public/test.js.map
curl -I https://alaminn.info/test.js.map
# Expected: HTTP/2 403
rm public/test.js.map
```

### 2.8 Block TypeScript / JSX source

```apache
<FilesMatch "\.(tsx?|jsx?)$">
    Require all denied
</FilesMatch>

# Exception: allow .js files in _next/static/ (compiled bundles)
<FilesMatch "^_next/static/.*\.js$">
    Require all granted
</FilesMatch>
```

**What it does:** denies access to `.ts`, `.tsx`, `.jsx`, and `.js` files,
*then* re-allows `.js` files under `_next/static/`.

**Why:** Next.js compiles everything to `_next/static/chunks/*.js`. The raw
`.ts`/`.tsx` source files should never be in `public/`, but if a stray
copy gets there (e.g. from a misconfigured copy step), this rule stops it.
The exception is critical: without it, every Next.js chunk would 403 and
the site would break.

**Order matters:** `FilesMatch` directives are processed in order. The
grant rule *must* come after the deny rule, otherwise the deny wins.

**Test:**
```bash
# Source file should be blocked
echo "export const secret = '...';" > public/leak.ts
curl -I https://alaminn.info/leak.ts
# Expected: HTTP/2 403
rm public/leak.ts

# Compiled chunk should be served
curl -I https://alaminn.info/_next/static/chunks/main.js
# Expected: HTTP/2 200 (or 404 if the chunk doesn't exist; never 403)
```

### 2.9 Disable directory listing

```apache
Options -Indexes
```

**What it does:** prevents Apache from generating an HTML directory index
when no `index.html` exists.

**Why:** without this, a request to `https://alaminn.info/brand/` would
return a listing of every image file in that directory. Useful for
reconnaissance by attackers, embarrassing for us.

**Test:**
```bash
curl https://alaminn.info/brand/
# Expected: HTTP/2 403 (or 404) — never an HTML <ul> of files
```

### 2.10 Security headers

```apache
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
</IfModule>
```

**What each header does:**

| Header                       | Effect                                                                    |
|------------------------------|---------------------------------------------------------------------------|
| `X-Content-Type-Options: nosniff` | Browser will not sniff MIME types. Prevents `.txt` files from being interpreted as HTML/JS. |
| `X-Frame-Options: SAMEORIGIN`     | Page cannot be embedded in an `<iframe>` on a different origin. Stops clickjacking. |
| `X-XSS-Protection: 1; mode=block` | Legacy reflected-XSS filter (mostly superseded by CSP, but harmless). |
| `Referrer-Policy: strict-origin-when-cross-origin` | Sends full referrer on same-origin requests, origin-only on cross-origin, no referrer on HTTPS→HTTP downgrade. |
| `Permissions-Policy: geolocation=(), microphone=(), camera=()` | Disables device APIs the site never uses. Stops a malicious script from accessing the camera even if it gets injected. |
| `Strict-Transport-Security` (HSTS) | Forces HTTPS for 1 year; applies to subdomains; eligible for browser HSTS preload list. Only sent when `HTTPS` env var is set (i.e. when the request came in over TLS). |

**Test:**
```bash
curl -sI https://alaminn.info/ | grep -iE 'x-content-type|x-frame|x-xss|referrer|permissions|strict-transport'
# Expected: all six headers present
```

### 2.11 Compress responses

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>
```

**What it does:** enables gzip compression for text-based MIME types.

**Why:** HTML, CSS, JS, JSON, and SVG are highly compressible (often 70%
smaller). Images (JPEG, PNG, WebP, AVIF, WOFF2) are already compressed and
would just waste CPU trying to compress again — note they are absent from
the list.

**Test:**
```bash
curl -sH 'Accept-Encoding: gzip' -I https://alaminn.info/ | grep -i content-encoding
# Expected: content-encoding: gzip
```

### 2.12 Cache static assets

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/avif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/json "access plus 1 hour"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

**What it does:** sets `Cache-Control: max-age=N` based on MIME type.

**Why:**
- **Images, CSS, JS, fonts (1 year):** these are fingerprinted by Next.js
  (`_next/static/chunks/[hash].js`). The hash changes when the content
  changes, so a long cache lifetime is safe.
- **JSON (1 hour):** API responses and `manifest.json` change
  occasionally; 1 hour balances freshness with cache hit rate.
- **HTML (0 seconds):** HTML is the entry point. Always revalidate so users
  see new content immediately.

**Test:**
```bash
curl -sI https://alaminn.info/_next/static/chunks/main-abc123.js | grep -i cache-control
# Expected: max-age=31536000
```

---

## 3. Root `.htaccess` — application root protection

This file lives at the project root (`/home/aloeduca/alaminn.info/.htaccess`).
It protects files that should never be web-accessible even if Apache's
`DocumentRoot` is misconfigured to point at the root.

### 3.1 Block dotfiles globally

```apache
<FilesMatch "^\.">
    Require all denied
</FilesMatch>
```

**Why:** `.git/`, `.env`, `.DS_Store`, `.vscode/`, `.idea/` all live at the
project root. Same logic as §2.1 but applied one level up.

### 3.2 Block `.env` explicitly

```apache
<Files ".env">
    Require all denied
</Files>
<Files ".env.*">
    Require all denied
</Files>
```

**Why:** `.env` is the single most dangerous file in the project. `Files`
and `FilesMatch` handle the case differently; using both ensures coverage
even if one syntax is patched out by a cPanel Apache update.

### 3.3 Block config files

```apache
<FilesMatch "^(package\.json|package-lock\.json|tsconfig\.json|next\.config\.ts|tailwind\.config\.ts|postcss\.config\.mjs|eslint\.config\.mjs|components\.json|vitest\.config\.ts|bun\.lock)$">
    Require all denied
</FilesMatch>
```

**Why:**
- `package.json` reveals every dependency and version → attacker can look
  up known CVEs for any outdated package
- `package-lock.json` / `bun.lock` reveal transitive dependency tree
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`,
  `postcss.config.mjs`, `eslint.config.mjs` reveal build configuration
  (path aliases, plugin list, experimental features)
- `components.json` reveals the shadcn/ui setup
- `vitest.config.ts` reveals test infrastructure

None of these are secrets on their own, but each is a piece of the
reconnaissance puzzle.

### 3.4 Block `server.js`

```apache
<Files "server.js">
    Require all denied
</Files>
```

**Why:** Passenger reads `server.js` as Node.js source and executes it.
Apache should never serve it. The file contains the Next.js standalone
bootstrap, and may contain inline configuration (port, hostname) that
shouldn't be public.

### 3.5 Block internal directories

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^prisma/ - [F,L]
    RewriteRule ^src/ - [F,L]
    RewriteRule ^scripts/ - [F,L]
    RewriteRule ^tests/ - [F,L]
    RewriteRule ^docs/ - [F,L]
    RewriteRule ^mini-services/ - [F,L]
    RewriteRule ^deploy/ - [F,L]
    RewriteRule ^storage/ - [F,L]
    RewriteRule ^node_modules/ - [F,L]
    RewriteRule ^\.next/ - [F,L]
    RewriteRule ^db/ - [F,L]
</IfModule>
```

**What each rule does:**

| Path              | Contents                                                | Risk if exposed                                   |
|-------------------|---------------------------------------------------------|---------------------------------------------------|
| `prisma/`         | `schema.prisma`, `seed.ts`, migrations                  | DB schema + seed data (may contain admin email, default password hash) |
| `src/`            | All TypeScript source                                   | Full application source code                      |
| `scripts/`        | `backup.sh`, `restore.sh`, `seed-admin.ts`              | Backup/restore logic, admin seed credentials      |
| `tests/`          | Test fixtures and assertions                            | Reveals internal behavior, edge cases             |
| `docs/`           | Architecture diagrams, API docs, security notes         | Internal architecture, potential key references   |
| `mini-services/`  | Worker source (email-worker, audit-worker, etc.)        | Worker internals, queue names, internal API paths |
| `deploy/`         | cPanel/LiteSpeed/Nginx configs, env templates           | Deployment topology, production env template      |
| `storage/`        | Backups, logs, exports                                  | DB backups, application logs                      |
| `node_modules/`   | Third-party packages                                    | Package version disclosure, potential supply-chain intel |
| `.next/`          | Build cache, server components, source maps             | Build artifacts, internal route structure         |
| `db/`             | SQLite dev database                                     | Dev DB with seed users                            |

**Why `mod_rewrite` instead of `<Directory>`:** `<Directory>` blocks are not
allowed in `.htaccess` for security reasons (they would let `.htaccess`
override `<Directory>` blocks in `httpd.conf`). `RewriteRule ... [F,L]`
achieves the same effect: a 403 Forbidden response, processed last so no
other rule can override it.

**Test:**
```bash
curl -I https://alaminn.info/prisma/schema.prisma
# Expected: HTTP/2 403
curl -I https://alaminn.info/src/lib/auth.ts
# Expected: HTTP/2 403
curl -I https://alaminn.info/storage/backups/
# Expected: HTTP/2 403
```

### 3.6 Disable directory listing

```apache
Options -Indexes
```

Same as §2.9, applied at the root level.

### 3.7 Hide server signature

```apache
ServerSignature Off
```

**What it does:** stops Apache from appending its version number to
generated error pages (404, 403, 500).

**Why:** server version disclosure makes it trivial for an attacker to
find CVEs that apply to the exact version running. Combined with
`ServerTokens Prod` (which can only be set in `httpd.conf`, not
`.htaccess`), this minimizes information leakage.

**Test:**
```bash
curl https://alaminn.info/this-page-does-not-exist-404
# Expected: a generic 404 page with NO "Apache/2.4.41 (Ubuntu) Server at ..." footer
```

---

## 4. `storage/.htaccess`, `db/.htaccess`, `docs/.htaccess`

All three files contain essentially the same content:

```apache
Require all denied
Options -Indexes
```

**What it does:** denies all HTTP access to every file in the directory,
recursively. Apache merges `.htaccess` from parent to child, so this
overrides any "grant" rule above it.

**Why have these when the root `.htaccess` already blocks these paths via
`RewriteRule`?** Defense in depth. If the root `.htaccess` is deleted,
corrupted by a bad edit, or the rewrite module is disabled, the per-directory
`.htaccess` still blocks access. The cost of three extra files is zero; the
cost of a leaked DB backup is catastrophic.

**Test:**
```bash
curl -I https://alaminn.info/storage/backups/any-file
# Expected: HTTP/2 403
curl -I https://alaminn.info/db/custom.db
# Expected: HTTP/2 403
curl -I https://alaminn.info/docs/security.md
# Expected: HTTP/2 403
```

---

## 5. Verifying everything in one pass

Run this script from any machine with `curl` and `jq`:

```bash
#!/usr/bin/env bash
set -u
BASE="${BASE:-https://alaminn.info}"

check() {
    local path="$1" expect="$2"
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$path")
    if [[ "$code" == "$expect" ]]; then
        printf '  PASS  %-50s → %s\n' "$path" "$code"
    else
        printf '  FAIL  %-50s → got %s, expected %s\n' "$path" "$code" "$expect"
    fi
}

echo "== Should be blocked (403) =="
check ".env"                       403
check ".git/config"                403
check "package.json"               403
check "server.js"                  403
check "prisma/schema.prisma"       403
check "src/lib/auth.ts"            403
check "storage/backups/"           403
check "db/custom.db"               403
check "docs/security.md"           403
check "index.html.bak"             403
check "dump.sql"                   403
check "leak.zip"                   403
check "test.js.map"                403

echo
echo "== Should succeed (200) =="
check ""                           200
check "logo.svg"                   200
check "favicon.svg"                200
check "robots.txt"                 200

echo
echo "== Security headers =="
curl -sI "$BASE/" | grep -iE 'x-content-type|x-frame|x-xss|referrer-policy|permissions-policy|strict-transport'
```

Expected output: every check prints `PASS`. If any `FAIL`s appear, see §7.

---

## 6. What if a rule breaks something?

### Symptom: a real public asset returns 403

**Most likely cause:** the file extension matches one of the deny rules.
Common culprits:

- A `.json` file in `public/` that isn't `manifest.json` → denied by §2.8
  (the `.js` exception is narrow; `.json` is not excepted)
- A `.map` file that the dev tools need in production → denied by §2.7
  (intentional, but maybe you have a legit reason)
- A `.zip` download you actually want to serve → denied by §2.5

**Fix options (in order of preference):**

1. **Move the file out of `public/`.** If it's source code, it doesn't
   belong in `public/`. If it's a real download, consider serving it via a
   Next.js API route that streams from `storage/`.
2. **Add a narrow exception** in `public/.htaccess`:
   ```apache
   <FilesMatch "^downloads/.*\.zip$">
       Require all granted
   </FilesMatch>
   ```
   Place it *after* the broader deny rule so it overrides.
3. **As a last resort, comment out the offending deny rule** and add a
   TODO to revisit. Use `#` at the start of each line:
   ```apache
   # <FilesMatch "\.map$">
   #     Require all denied
   # </FilesMatch>
   ```
   Reload Apache is not needed for `.htaccess` changes — they take effect
   on the next request.

### Symptom: the entire site returns 403

**Most likely cause:** the root `.htaccess` has a syntax error, or the
`RewriteRule` is matching too aggressively.

**Quick recovery:**

1. SSH to the server: `cd /home/aloeduca/alaminn.info`
2. Move the file aside: `mv .htaccess .htaccess.broken`
3. Verify the site loads: `curl -I https://alaminn.info/` → expect 200
4. Inspect the broken file: `cat .htaccess.broken`
5. Common syntax mistakes:
   - Missing `</FilesMatch>` closing tag
   - Unescaped `.` in regex (use `\.` to match a literal dot)
   - `RewriteEngine On` missing before `RewriteRule`
6. Fix and rename back: `mv .htaccess.broken .htaccess`
7. Re-test

### Symptom: a 500 Internal Server Error

**Most likely cause:** a directive is not allowed in `.htaccess` because
`AllowOverride` doesn't permit it. cPanel hosts typically allow
`AllowOverride All`, but some restrict it.

**Diagnosis:** check the Apache error log:
```bash
tail -100 /home/aloeduca/logs/alaminn.info.error.log
# or
tail -100 /usr/local/apache/logs/error_log
```

Look for `.htaccess: <directive> not allowed here`.

**Fix:** wrap the offending directive in `<IfModule mod_xyz.c>...</IfModule>`
so it's silently skipped if the module isn't loaded. The provided
`.htaccess` files already do this for `mod_headers`, `mod_deflate`,
`mod_expires`, and `mod_rewrite`. If a *new* directive is added, follow the
same pattern.

### Symptom: security headers not appearing

**Cause:** `mod_headers` is not loaded.

**Diagnosis:** create a `phpinfo()` page (if PHP is available) and check the
"Loaded Modules" section, or:
```bash
apachectl -M 2>/dev/null | grep headers
# or
httpd -M 2>/dev/null | grep headers
```

**Fix:** in cPanel, you usually can't enable Apache modules directly. Use
**MultiPHP Manager → Switch to PHP-FPM** (headers module is always loaded
under PHP-FPM), or add the headers via Next.js middleware instead:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // ... etc
  return response;
}
```

### Temporarily disabling all rules

If you need to take every `.htaccess` offline at once (e.g. to debug a
cPanel/Apache configuration issue), rename them:

```bash
cd /home/aloeduca/alaminn.info
for f in .htaccess public/.htaccess storage/.htaccess db/.htaccess docs/.htaccess; do
    mv "$f" "$f.disabled"
done
# ... debug ...
# Restore:
for f in .htaccess public/.htaccess storage/.htaccess db/.htaccess docs/.htaccess; do
    mv "$f.disabled" "$f"
done
```

**This removes all defense in depth — only do this in an emergency and
restore as soon as possible.**

---

## 7. Maintenance checklist

- **After every deploy:** run the verification script from §5.
- **After adding a new file to `public/`:** check its extension against the
  deny lists. If it's a new type (e.g. `.webmanifest`), decide whether it
  should be public.
- **After upgrading Next.js:** the `_next/static/` exception path may
  change. Verify that compiled chunks still load.
- **After a cPanel update:** cPanel occasionally resets Apache
  configuration. Re-run the verification script.
- **Quarterly:** review whether each deny rule is still needed. New file
  types emerge (e.g. `.avif` was rare 5 years ago); the allow-list for
  static assets should evolve.
- **Annually:** review the HSTS `max-age`. If you ever need to drop HTTPS,
  you'll need to wait for the `max-age` to expire before browsers will
  accept HTTP. Lowering it to a day (`max-age=86400`) temporarily makes
  the transition easier.

---

## 8. File locations (production)

| File                                                          | Mode  |
|---------------------------------------------------------------|-------|
| `/home/aloeduca/alaminn.info/.htaccess`                       | 0644  |
| `/home/aloeduca/alaminn.info/public/.htaccess`                | 0644  |
| `/home/aloeduca/alaminn.info/storage/.htaccess`               | 0644  |
| `/home/aloeduca/alaminn.info/db/.htaccess`                    | 0644  |
| `/home/aloeduca/alaminn.info/docs/.htaccess`                  | 0644  |

Mode `0644` is required — Apache must be able to read the file. Never make
it world-writable; a writable `.htaccess` is a privilege escalation vector.

---

End of document.
