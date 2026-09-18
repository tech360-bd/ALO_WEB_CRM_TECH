# ARENA MERGE REPORT — ALO Education

**Date:** 2026-09-18 · **Session:** `arena/01a0b26d-alo-education-z-ai`
**Base:** `85560ac7` · **Second source:** `other-ai-builder-2026-09-13` @ `b22a18ae`

Companion documents:
`AUDIT/ARENA_PRE_MERGE_INVENTORY.md` · `AUDIT/ARENA-MERGE-CONFLICTS.md` ·
`AUDIT/ARENA_FILE_MERGE_MANIFEST.csv` (5,287 rows) ·
`AUDIT/ARENA-FINAL-FILE-MANIFEST.csv` (103 rows) ·
`AUDIT/ARENA-ROUTE-INVENTORY.csv` (818 routes) ·
`AUDIT/ARENA-PAGE-INVENTORY.csv` (366 pages)

---

## 1. What the merge actually was

The brief described two co-equal sources and a repository full of conflict
markers. Verification found something different, and the correct merge follows
from what is actually there:

| Brief premise | Verified reality |
|---|---|
| Two source systems inside the repo | One codebase. The second source is the **unmerged remote branch** `other-ai-builder-2026-09-13` (`b22a18ae`) |
| Conflict markers to resolve semantically | **Zero** conflict markers, tracked or untracked |
| Neither source is automatically correct | Correct — but they are not comparable in size. Source B has **214 Prisma models vs 479**, **0 auth-guarded API routes vs 583**, and **deletes all 4 CI workflows** |
| Same file + different code = merge the coding | Applied to the one file where B was genuinely better (`ecosystem.config.cjs`), field by field |

**Result: Source A is the base. Source B contributed 85 new files (sanitised) and
its PM2 hardening. Its 4,818 deletions and 382 reduced rewrites were rejected
individually, not wholesale.**

---

## 2. Files compared, merged, retained, removed

| | Count | Detail |
|---|---|---|
| Same-path files compared | **382** | `AUDIT/ARENA_FILE_MERGE_MANIFEST.csv`, `merge_action=REVIEW_REQUIRED` |
| Files merged from both sides | **1** config + **17** source/test | see §3 |
| Files extracted from Source B | **85** | `alo-cpanel/` (83) + `examples/websocket/` (2) |
| Deletions rejected | **4,818** | incl. all 4 workflows, `package-lock.json`, most of `src/`, the test suite |
| Files removed as redundant | **0** | nothing was proven redundant — see §7 |
| Renames logged | **2** | `REVIEW_REQUIRED` |
| Secrets removed on import | **3** | DB password, DB username, default `APP_KEY` in `alo-cpanel/config/config.php` |

---

## 3. The one true field-level merge: `ecosystem.config.cjs`

`MERGE_BOTH`. Source B's operational hardening, at Source A's port and paths.

**Taken from Source B:** `max_restarts: 10`, `min_uptime: 30s`,
`restart_delay: 3000`, `kill_timeout: 5000`, `listen_timeout: 10000`,
`log_date_format`, `merge_logs`, `ignore_watch`, `env_production`.

**Rejected from Source B:** `PORT 3015` (brief §20/§21 require 3044),
`HOSTNAME 127.0.0.1`, `cwd /home/aloedu/aloeducation` (legacy cPanel home),
`/var/log/...` log paths (not provisioned by the deploy workflow),
`max_memory_restart 1G` (the build needs a 4G heap), `health_check{}` (not a
supported PM2 option — PM2 would warn and ignore it), and the three `bun`
mini-service apps (declaring them would make `pm2 restart ecosystem.config.cjs`
start them, changing production behaviour on a deploy contracted to restart
`alo-education` only).

Every decision is recorded as a comment in the file itself.
Verification: `tests/unit/deployment-config.test.ts` → **12/12 pass**.

---

## 4. Prisma / database merge

**Status: Source A's 479-model schema retained unchanged. No migration applied.**

16 models exist only in Source B. Mapping them against the existing schema
showed that **11 of the 16 are conceptual duplicates** already present under
different names (`ContentCalendar`→`MarketingCalendar`,
`CreativeAsset`→`BrandAsset`/`ContentAsset`, `PartnerUser`→`PartnerProfile`,
and so on). Adding all 16 would fork the data model, not merge it.

The ~5 genuinely absent models (`BehaviorEvent`, `StudentHelpTicket`,
`KnowledgeBookmark`, `VoiceProfile`, `VisibilityPolicy`) are documented with
full definitions in `AUDIT/ARENA-MERGE-CONFLICTS.md` §C-1 as a **proposed
migration**, deliberately **not applied**:

- `prisma migrate dev` is **BLOCKED** here (`binaries.prisma.sh` is outside the
  sandbox egress allowlist)
- a production migration needs a verified backup, review and explicit approval
  (brief §11)
- nothing in the code reads or writes these models, so adding them would be dead
  schema

No destructive database operation was performed. No data was touched.

---

## 5. Security work done during the merge

The inventory surfaced five previously-unreported vulnerabilities. All are fixed,
each with a regression test that **fails against the unfixed code**.

| ID | Route / area | Finding | Fix |
|---|---|---|---|
| **SEC-F** | `GET/PATCH /api/hr/payroll` | No auth. Anyone could read **every employee salary** and set any row to `APPROVED`/`PAID` with a body-supplied `approvedBy` | `withAuth` + staff `requireUserTypes`; status validated; approver taken from the verified actor |
| **SEC-F** | `GET /api/finance` | No auth. Returned total revenue, pending/paid partner and employee commissions, recent payments | `withAuth` + staff `requireUserTypes` |
| **SEC-G** | `GET /api/student/profile` | **IDOR.** `?studentId=` with no auth returned any student's full record — including the `password` and `otpCode` columns via the `...student` spread — plus documents, payments, applications, visa cases, timeline | `authenticateUnified`; students may read only their own record (mismatched id → 403); staff must be the assigned counselor or privileged; credential columns stripped |
| **SEC-H** | `GET /api/employee/documents/[id]/download` | Identity came from a `?viewerId=` **query parameter**, and the check was `viewerId === doc.employeeId` — so passing the owner's id granted access to confidential HR documents | Identity from `authenticateRequest`; client-supplied `viewerId` ignored; existing owner/`super_admin`/`hr_manager` rule preserved |
| **SEC-I** | **all 9** `/api/cron/*` routes | Every cron route was publicly triggerable. 7 had no check at all; **2 had guards whose bodies were empty** (`sla-monitor`, `weekly-university-scan`) — the condition ran, nothing was returned, the request always proceeded. One GET could fire outbound WhatsApp follow-ups, generate reports, drain retry queues or start scraping | New `src/lib/cron-auth.ts`: constant-time secret compare (`ALO_CRON_SECRET`/`CRON_SECRET`, ≥ 16 chars), `x-cron-secret` support, admin-session fallback, **fails closed** in production. Applied to all 9; the two dead guards removed |
| **SEC-J** | `alo-cpanel/config/config.php` | Source B re-committed the **same production DB password** PR #15 had just removed, plus the real DB username and a default `APP_KEY` | `alo_env()`/`getenv()` with no insecure fallback; `install.php` placeholder generalised |

Also carried forward from PR #15: SEC-A (`/api/commissions`), SEC-B
(`/api/counselor/students/[id]`), SEC-C (`/api/crm/seed` returning plaintext
admin passwords), SEC-D (committed DB password), SEC-E (CI secret scan excluded
all markdown).

### New regression tests

| File | Tests | Asserts |
|---|---|---|
| `tests/unit/cron-auth-regression.test.ts` | 11 | anonymous → 401 with **no** job db access; correct secret proceeds; wrong secret rejected; fail-closed with no secret |
| `tests/unit/finance-authz-regression.test.ts` | 5 | payroll GET/PATCH and finance GET → 401 before any db access; forged token rejected |

Both import the **real** handlers; only `@/lib/db` and `next-auth` are mocked.

---

## 6. Verification

| Gate | Result |
|---|---|
| `npm test` | **205 passed / 7 skipped** (21 files) — base was 200 + 5 new; 189 at session start |
| `npm run lint` | exit **0** |
| CI secret-scan step (extracted from `ci.yml` via `js-yaml`, executed verbatim) | **PASS** on the staged tree incl. all 85 imported files; **FAIL** on pre-fix `cc15869`, flagging the 4 leaked lines |
| `tests/unit/deployment-config.test.ts` | 12/12 |
| All 4 workflow YAMLs | parse clean |
| `npm run typecheck` | **NOT VERIFIED here** — needs `prisma generate`; `binaries.prisma.sh` is outside the sandbox egress allowlist. CI runs it on a real runner |
| `npm run build` | **NOT VERIFIED here** — same cause |
| `prisma validate` | **NOT VERIFIED here** — same cause |
| PHP syntax (`alo-cpanel/`) | **NOT VERIFIED** — `php` is not installed in the sandbox and CI does not lint PHP. Files were imported unmodified except `config.php`/`install.php` |
| Production health | **NOT VERIFIED** — sandbox egress is allowlisted and TLS is proxy-intercepted. The repo's own monitor last reported **HTTP 502** |

No test was faked, skipped to force a pass, or converted from failure without
fixing the cause. Two of my own test assertions were wrong during this session
(too strict about what counts as a database call) and were corrected, not
deleted.

---

## 7. Duplicate removal — none performed

Brief §29 permits removal only *after* functionality is merged and only for files
**proven** redundant. Nothing met that bar:

- **`alo-education-web-crm-final/`** (1,520 files) — a historical delivery
  snapshot. Not referenced by any workflow, build or deploy path. Kept; owner
  archival decision outstanding. Removing it would destroy the only record of
  that delivery.
- **`alo-cpanel/`** (83 files) — kept and classified LEGACY per §6 of the brief.
- **`examples/websocket/`** (2 files) — kept. Not wired into the build.
- **Root dataset CSVs** — many are near-duplicates by byte size
  (e.g. `07_ALO_SCHOLARSHIPS.csv` and `09_ALO_SCHOLARSHIPS.csv` are both
  531,864 bytes). Brief §14 forbids blind concatenation and requires stable
  identifiers before dedup. **Not deduplicated** — that needs the data owner to
  confirm which file is authoritative. Recorded as `REVIEW_REQUIRED`.

Duplicate files removed: **0**.

---

## 8. Route audit

`AUDIT/ARENA-ROUTE-INVENTORY.csv` — 818 API route files, 366 pages.

| | Count |
|---|---|
| API routes referencing an auth helper | **583** |
| Signature-verified webhooks | **5** |
| Cron routes | **9** — all now guarded by `requireCron` |
| No auth helper detected | **230** |

Of the 230, **46 sit under privileged-looking prefixes** (`admin`, `crm`,
`student`, `hr`, `employee`, `counselor`, `partner`, `finance`). Many are
legitimately public — `/api/student/auth/login`, `/api/crm/leads/public`,
OAuth callbacks. Five were confirmed genuinely broken and fixed (SEC-F, SEC-G,
SEC-H). The remaining ~41 are listed in the CSV with `auth=NONE` and are
**REVIEW_REQUIRED**; they were not mass-edited because a blanket wrapper would
break the intentionally public ones.

Recommended follow-up: a lint rule failing when a mutating route exports a
handler without referencing a known auth helper, with an owner-maintained
allowlist for public endpoints. Deliberately **not** added here — it needs that
allowlist to avoid false failures.

---

## 9. Deployment configuration

| Item | Value | Status |
|---|---|---|
| App | `alo-education` (PM2) | VERIFIED consistent |
| Port | **3044** | VERIFIED — `ecosystem.config.cjs`, `nginx.conf`, workflow, tests all agree |
| Protected app | `alo-learning-journey` / `learn.aloeducation.com` / **3017** | VERIFIED protected — the workflow only ever runs `pm2 describe` on it |
| Deploy path | `/root/alo-github-main-new` | **NOT changed** — see below |
| Branch | `main` | VERIFIED |
| Secrets in workflows | none hardcoded; `permissions: contents: read` | VERIFIED |

**Disagreement with the brief, recorded rather than silently resolved.** §20
states the path is `/root/alo-github-main`. The repository says otherwise, by a
wide margin:

```
git grep -c 'alo-github-main-new'                     → 406
git grep    'alo-github-main' (excluding -new)        →  19
deploy-production.yml: INTENDED_DEPLOY_DIR: '/root/alo-github-main-new'
tests/unit/deployment-config.test.ts: "target 3044 / /root/alo-github-main-new"
```

The workflow also treats the live PM2 `exec cwd` as ground truth over both
constants, and keeps the non-`-new` path as a legacy detection candidate.
Changing it would contradict 406 references, the installed workflow and a
passing test, based on an assertion this sandbox cannot check (no SSH).

**OWNER ACTION REQUIRED:**
```
pm2 describe alo-education | grep 'exec cwd'
```

---

## 10. Unresolved issues

| # | Issue | Why unresolved | Owner action |
|---|---|---|---|
| 1 | **Rotate the exposed DB password** | It is in git history on `main` *and* on `other-ai-builder-2026-09-13`; removal does not un-leak it | `ALTER USER … IDENTIFIED BY '<new>'`, update VPS `.env`, restart `alo-education` only |
| 2 | Deploy path `-new` vs not | Unverifiable without SSH | `pm2 describe alo-education \| grep 'exec cwd'` |
| 3 | 5 absent Prisma models | Needs a migration + backup + approval; `prisma` binaries unreachable here | Review §C-1, then `prisma migrate deploy` |
| 4 | ~41 privileged-prefix routes with no detected auth | Needs per-route review; a blanket rule breaks public endpoints | Triage `AUDIT/ARENA-ROUTE-INVENTORY.csv` where `auth=NONE` |
| 5 | Root CSV datasets not deduplicated | §14 requires stable identifiers + owner confirmation of authority | Confirm canonical file per dataset |
| 6 | Mini-services not in PM2 | Need `bun` provisioned + smoke tests | Enable deliberately, separately |
| 7 | `alo-education-web-crm-final/` disposition | Owner archival decision | Archive or keep |
| 8 | Production health (502) | Requires VPS console | `docs/VPS_INCIDENT_RUNBOOK_2026-09-17.md` §3–4 |
| 9 | `DEPLOY_PORT` secret + `DEPLOY_HOST_SSH_FINGERPRINT` variable | Root cause of 36 failed deploys, 0 successes | Set in GitHub → Settings → Secrets and variables → Actions |
| 10 | Health monitor not firing on schedule | `state=active` with a daily cron, but exactly one run ever recorded | Check Settings → Actions scheduled-workflow enablement |
| 11 | PHP in `alo-cpanel/` not syntax-checked | no `php` in sandbox, CI does not lint PHP | `find alo-cpanel -name '*.php' -exec php -l {} \;` |
| 12 | `other-ai-builder-2026-09-13` still unmerged | Its useful content is now in `main` via this merge; the rest is rejected | Close or delete the branch once reviewed |
