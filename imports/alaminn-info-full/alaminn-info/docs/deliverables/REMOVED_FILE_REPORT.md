# REMOVED_FILE_REPORT.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Removed File Report |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | List any files REMOVED from the project in this production build (relative to the prior state), with justification. |

---

## How this report was generated

The list below was compiled from worklog entries and a comparison of the current file tree against the prior state. Each removed file is listed with:

- **File path**
- **Reason for removal**
- **Justification** (why it's safe to remove)
- **Replacement** (if any)

---

## Removed files

| # | File | Reason | Justification | Replacement |
|---|---|---|---|---|
| 1 | `bun.lock` (from the cPanel deliverable ZIP packages only) | cPanel deployment uses `npm ci` with `package-lock.json`; `bun.lock` is not needed and could confuse the deployer | cPanel's Node.js App Manager only supports npm (not Bun). Including `bun.lock` would mislead the deployer into thinking Bun is required. The repo's `package.json` declares npm as the canonical package manager. The `bun.lock` file is removed ONLY from the cPanel deliverable packages (alaminn-info-cpanel.zip); it remains in the development repository for developers who prefer Bun. | `package-lock.json` (used by `npm ci` in `deploy/cpanel/setup-cpanel.sh`) |

---

## Summary

| Category | Count |
|---|---|
| Files removed from cPanel deliverable packages | 1 (`bun.lock`) |
| Files removed from the development repository | 0 |
| **Total removed** | **1** |

---

## Verification

To verify no unexpected files were removed from the development repository:

```bash
cd ~/alaminn.info

# Verify bun.lock is still in the dev repo (it should be)
[ -f bun.lock ] && echo "✓ bun.lock present in dev repo" || echo "✗ bun.lock missing from dev repo"

# Verify package-lock.json is present (canonical lockfile)
[ -f package-lock.json ] && echo "✓ package-lock.json present" || echo "✗ package-lock.json missing"

# Verify the cPanel deliverable ZIP excludes bun.lock
unzip -l alaminn-info-cpanel.zip | grep bun.lock
# Expect: no output (bun.lock is NOT in the ZIP)
```

---

## If a file IS removed in the future

If a future audit finds a removed file, add a row to the table above with:

```markdown
| N | <file-path> | <reason> | <justification> | <replacement-if-any> |
```

And update the Summary table.

---

## Why removing files matters

Removing unused or misleading files:
- Reduces the deployment artefact size (faster uploads)
- Avoids confusing the deployer (e.g. `bun.lock` implying Bun is required)
- Removes potential security surface (e.g. old backup files, stale configs)
- Keeps the deliverable clean and focused on what's needed for production

---

## Reference

- **Production build cycle tasks**: DOCS-001, HTACCESS-001, BACKUP-001
- **Audit date**: 2026-07-19
- **Files removed**: 1 (`bun.lock` from cPanel deliverable packages only)
- **Files removed from dev repo**: 0
- **Replacement**: `package-lock.json` (canonical for `npm ci`)
