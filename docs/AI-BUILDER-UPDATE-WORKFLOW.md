# ALO Education — AI Builder Update Workflow (authoritative from 2026-10-12)

```
AI Builder output ─► compare with tech360-bd/ALO_WEB_CRM_TECH main
                 ─► feature branch ─► pull request ─► CI (2 required jobs)
                 ─► security gates ─► human approval ─► merge to main
                 ─► Hostinger auto-deploy ─► production health checks ─► report
```

Destination for **every** future update: `https://github.com/tech360-bd/ALO_WEB_CRM_TECH`, branch `main`.
The old repository (`engralaminn-collab/alo_education_z....ai`) receives nothing by default. There is no ongoing old→new sync.

## 1. Intake (new files, modified files, ZIP, git patch)

| Input | How it is applied |
| --- | --- |
| Git patch / branch | `git apply --3way` or `git merge` onto a fresh branch from `origin/main` |
| ZIP archive | Extract to a temp dir **outside** the repo; copy only the paths that belong to the change. Never replace the whole tree ("complete ZIP replacement" is forbidden — it re-introduces every bug fixed since the ZIP was produced). |
| Individual files | Copy to the matching path; a new file must be reachable from existing routing/imports or it is dead code. |

Validation before anything is committed:

1. Paths: inside `src/`, `prisma/`, `scripts/`, `tests/`, `docs/`, `public/` only; reject `.env*`, `*.pem`, `*.key`, `node_modules/`, `.next/`, large binaries, and anything that overwrites `.github/workflows/` without an explicit request.
2. Secrets: run the CI scanner locally (`bash /tmp/scan.sh` equivalent — the `git grep` block in `.github/workflows/ci.yml`), plus `node scripts/audit-env-vars.mjs --check`.
3. Compare: `git diff origin/main --stat`; for each touched file confirm that fixes already on `main` are **kept** (three-way merge, never "take theirs"). The CI breakage of 2026-10-12 came entirely from merges that took one side blindly.
4. Prisma: if `prisma/schema.prisma` changes, a migration **must** accompany it (`prisma migrate dev --create-only` on a disposable MySQL 8.4), and `0_init`/applied migrations are never edited.

## 2. Branch & PR

```bash
git fetch origin
git switch -c feature/<topic>-<yyyymmdd> origin/main
# apply the change …
npm ci --no-audit
node scripts/ci/npm-security-audit.mjs      # fail-closed audit, id-scoped waivers only
npm run lint && npm test
git commit -s -m "<what and why>"
git push -u origin feature/<topic>-<yyyymmdd>
gh pr create --base main --fill
```

## 3. Required checks (both must be `success`; never merge on "pending" or "skipped")

| Job | Proves |
| --- | --- |
| **Lint · Typecheck · Tests · Prisma · Build** | `npm ci` from lockfile, dependency audit (high/critical block), secret-leak scan, deployment-ownership tests, env classification current, `prisma validate/generate`, lint, typecheck, unit tests, production standalone build |
| **MySQL 8 · Migrate · Integrate · Boot** | `migrate deploy` on an empty MySQL 8.4, `migrate status` up-to-date, **zero drift** between migrations and `schema.prisma`, DB-backed integration tests, standalone server boots and `/api/health` + consultation workflow pass over HTTP |

CI never deploys and holds no production secrets (`tests/deployment-ownership.test.mjs` enforces this).

## 4. Approval & merge

- At least one human reviewer from ALO Education approves (branch protection on `main` should require: 1 approval, both status checks, no force-push — **owner/admin must configure this; it cannot be read or set with the current token**).
- Merge with the GitHub button or `gh pr merge <n> --merge`. No force-push to `main`, ever.

## 5. Deployment & verification

- Merging to `main` is the release event. Hostinger's GitHub integration (Node.js app → repository `tech360-bd/ALO_WEB_CRM_TECH`, branch `main`, `npm ci` / `npm run build` / `npm start`, startup `server.js`, Node 22) builds and restarts.
- After deploy, verify and record in the PR:
  - `curl -sI https://aloeducation.com` → 200/301 + valid TLS; `https://www.aloeducation.com` redirects correctly
  - `curl -s https://aloeducation.com/api/health` → green, and the reported commit SHA (if exposed) equals `main`
  - Home, `/course-finder`, `/universities`, student login page, portal login pages render
  - No new 5xx in Hostinger logs
- Rollback: redeploy the previous `main` SHA from Hostinger (documented in `docs/PRODUCTION-ROLLBACK-RUNBOOK.md`); database rollback is a separate, approved operation.

## 6. Database & accounts

Code migration ≠ data migration. Student, employee, counselor, admin and partner accounts, sessions, applications, documents, CRM records, payments and notifications are **never** reset, re-seeded or overwritten by a repository change. `prisma migrate deploy` runs only forward migrations that were reviewed in the PR. `prisma db push`, `migrate reset` and `seed-complete.ts` are not deployment steps.
