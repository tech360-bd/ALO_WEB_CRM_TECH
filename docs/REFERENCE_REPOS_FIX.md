# Fix: .gitmodules fatal No url found for submodule path

## Problem
On origin/main, `_reference_repos/*` were tracked as gitlink entries (mode 160000) without a `.gitmodules` file:

```
git ls-tree origin/main _reference_repos/
160000 commit 2a9c154... _reference_repos/CloddsBot
160000 commit c9148d0... _reference_repos/ECC
...
(29 entries)
```

But `.gitmodules` did not exist:
```
git show origin/main:.gitmodules → file not found
```

Result: `actions/checkout` with `submodules: recursive` or any `git submodule update` failed:
```
fatal: No url found for submodule path '_reference_repos/CloddsBot' in .gitmodules
```

This broke CI/CD and local clones.

## Root Cause
- Initial commit `a36e58d` already contained submodule gitlinks but no `.gitmodules`
- `_reference_repos/*` are reference copies (CloddsBot, ECC, EducationConsultancyWebsite, etc) — not required for production app
- They were added as submodules without proper `.gitmodules` URL mapping

## Fix Applied (arena/01a0a165-alo-education-z-ai)
1. Removed all submodule entries from index:
   ```bash
   git rm --cached -r _reference_repos
   ```
2. Deleted physical empty directories:
   ```bash
   rm -rf _reference_repos
   ```
3. Added to `.gitignore`:
   ```
   _reference_repos/
   _reference_repos/*
   **/_reference_repos/
   ```
4. Changed checkout in workflow to `submodules: false`:
   ```yaml
   uses: actions/checkout@v5
   with:
     fetch-depth: 0
     submodules: false
   ```
5. Verified clean:
   ```bash
   git ls-files --stage | grep 160000 → no output
   git submodule status → exit 0, no error
   ```

## Preservation of Reference Source
- `_reference_repos/` are local reference only, not tracked in Git
- If needed for video engine research, clone separately under `external/video-repos/` or local directory not in Git
- Do not re-add as submodules unless you create a valid `.gitmodules` with real URLs:
  ```
  [submodule "_reference_repos/CloddsBot"]
    path = _reference_repos/CloddsBot
    url = https://github.com/.../CloddsBot.git
  ```
- Since we don't have upstream URLs for all 29 repos and they are not needed for production, removal is safest.

## Verification
- `git ls-files --stage | grep 160000` → empty
- `git submodule status` → no fatal error
- Checkout with `submodules: false` succeeds cleanly
- Production deployment does not require these repos (app dir `/root/alo-live` contains only main app)

## Related
- Workflow fix: `deploy-production.yml` now documents `PRODUCTION_VPS_HOST` etc, removes invalid `script_stop`, uses correct port 3044, adds SHA verification, backup, .env preservation, prisma validate/generate/migrate deploy only, PM2 verification, health check /api/health, rollback safety.
