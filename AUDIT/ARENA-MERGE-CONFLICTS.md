# ARENA MERGE CONFLICTS — ALO Education

Every meaningful conflict between the two source systems, and its resolution.
**No conflict was resolved by deleting a side or by `git checkout --ours/--theirs`.**

There were **no git conflict markers** in the repository (verified:
`git grep -nE '^(<{7}|={7}|>{7})( |$)'` → 0 files), so every conflict below is a
**same-path different-code** conflict (§4 of the brief), resolved by reading both
implementations.

Scale of the conflict set: **382 same-path files differ**, 85 files exist only in
Source B, 4,818 files exist only in Source A.

---

## C-1 · `prisma/schema.prisma` — 479 models vs 214 · HIGHEST PRIORITY

| | Source A | Source B |
|---|---|---|
| Models | **479** | **214** |
| Diff | +4,040 / −9,456 lines | |
| Provider | `mysql` | `mysql` |

**Analysis.** 281 models exist only in Source A. 16 exist only in Source B:

`BehaviorEvent`, `BrandProfile`, `ContentCalendar`, `ContentCampaign`,
`ContentVersion`, `CreativeAsset`, `DocumentReview`, `KnowledgeBookmark`,
`KnowledgeSource`, `MarketingModel`, `MarketingProfile`,
`PartnerSocialAccount`, `PartnerUser`, `StudentHelpTicket`, `VisibilityPolicy`,
`VoiceProfile`.

**Critical finding: adding all 16 would create parallel duplicates, not a
merge.** Source A already has equivalent concepts under different names:

| Source B model | Existing Source A equivalent |
|---|---|
| `ContentCalendar` | `MarketingCalendar` |
| `ContentCampaign` | `MarketingCampaign` |
| `CreativeAsset` | `BrandAsset`, `ContentAsset` |
| `ContentVersion` | `DocumentVersion`, `ContentApproval` |
| `KnowledgeSource` | `KnowledgeBaseArticle`, `KnowledgeDocument`, `KnowledgeObject` |
| `PartnerUser` | `PartnerProfile`, `PartnerUserSeatRequest`, `PortalUser` |
| `MarketingProfile` / `MarketingModel` | `MarketingCampaign`, `MarketingGeneratedContent`, `MarketingContentIdea` |
| `DocumentReview` | `DocumentAudit`, `DocumentChecklist`, `ContentApproval` |

Genuinely absent concepts are roughly: `BehaviorEvent` (visitor analytics),
`VoiceProfile`, `VisibilityPolicy`, `StudentHelpTicket`, `KnowledgeBookmark`.

**Resolution: `KEEP` Source A's schema unchanged.** Adopting Source B's file
would drop 265 models. Adding the 16 would fork the data model.

**Why the 5 genuinely-absent models were NOT added.** They are standalone (no
hard relations, so technically safe), but adding them means a **database
migration against production**, which requires:

1. `prisma migrate dev` — **BLOCKED** here: `binaries.prisma.sh` is outside this
   sandbox's egress allowlist.
2. A verified backup + review + explicit approval (brief §11: *"Do not perform
   destructive database operations… If migrations are required, document them
   separately"*).

They are therefore documented as a proposed migration rather than applied.
Adding models nothing reads or writes would also be dead schema.

**Proposed migration (owner decision, not applied):**

```prisma
// Requires: verified backup + review + `prisma migrate deploy` approval.
// Only these five are genuinely absent from the current 479-model schema.

model BehaviorEvent {
  id           String   @id @default(cuid())
  visitorId    String
  studentId    String?
  leadId       String?
  eventType    String
  eventData    String   @default("{}")
  pageUrl      String?
  referrer     String?
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  intentPoints Int      @default(0)
  sessionId    String?
  createdAt    DateTime @default(now())
  @@index([visitorId])
  @@index([eventType])
}

model StudentHelpTicket {
  id        String   @id @default(cuid())
  studentId String
  subject   String
  body      String
  status    String   @default("OPEN")
  createdAt DateTime @default(now())
  @@index([studentId])
  @@index([status])
}

model KnowledgeBookmark {
  id         String   @id @default(cuid())
  userId     String
  documentId String?
  newsId     String?
  trainingId String?
  createdAt  DateTime @default(now())
  @@index([userId])
  @@index([documentId])
}

model VoiceProfile {
  id        String   @id @default(cuid())
  name      String
  provider  String
  voiceRef  String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model VisibilityPolicy {
  id         String   @id @default(cuid())
  scope      String
  resource   String
  rule       String   @default("{}")
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  @@index([scope])
}
```

---

## C-2 · `ecosystem.config.cjs` — MERGE_BOTH

| Aspect | Source A | Source B | Taken |
|---|---|---|---|
| App name | `alo-education` | `alo-education` | same |
| `PORT` | `"3044"` | `3015` | **A** — §20/§21 of the brief require 3044; `tests/unit/deployment-config.test.ts` pins `PORT: "3044"` |
| `HOSTNAME` | `0.0.0.0` | `127.0.0.1` | **A** — matches the deploy workflow |
| `cwd` | `"./"` | `/home/aloedu/aloeducation` | **A** — B's path is the legacy cPanel home |
| `interpreter` | `node` | *(absent)* + `bun` for mini-services | **A** — npm-only project |
| log paths | `storage/logs/pm2-*.log` | `/var/log/alo-education/*.log` | **A** — `/var/log/...` is not provisioned by the deploy workflow, and `storage/` is backed up pre-deploy |
| `max_memory_restart` | `2G` | `1G` | **A** — the build itself needs a 4G heap |
| restart strategy | absent | `max_restarts: 10`, `min_uptime: 30s`, `restart_delay: 3000` | **B** ✅ |
| graceful shutdown | absent | `kill_timeout: 5000`, `listen_timeout: 10000` | **B** ✅ |
| log timestamps | absent | `log_date_format`, `merge_logs` | **B** ✅ |
| watch ignores | absent | `ignore_watch` | **B** ✅ |
| `env_production` | absent | present | **B** ✅ |
| `health_check{}` | absent | present | **NEITHER** — not a supported PM2 option; PM2 would warn and ignore it. Liveness is `/api/health` + the health-monitor workflow |
| 3 mini-service apps | absent | present (bun) | **NOT TAKEN** — see below |

**Mini-services decision.** `mini-services/{sla-monitor,follow-up-sender,university-monitor}/`
exist in **both** trees with their own `bun.lock` files, so they are real code.
They were deliberately not declared in PM2 because the deploy workflow runs
`pm2 restart ecosystem.config.cjs`, which would **start** them — changing
production behaviour on a deploy whose contract is to restart `alo-education`
only — and because they need `bun`, which this project does not use
(`tests/unit/deployment-config.test.ts` asserts no root `bun.lock`).
Documented in a comment at the bottom of the file. **REVIEW_REQUIRED.**

Verification: `tests/unit/deployment-config.test.ts` → 12/12 pass.

---

## C-3 · `nginx.conf` — KEEP Source A

Source B changes `proxy_pass http://127.0.0.1:3044` → `http://app:3000`
(a Docker service name) and deletes the SEC-05 comment. That contradicts
§20/§21 (port 3044) and the test asserting `nginx.conf` contains `3044`.
**Resolution: A retained unchanged.** The Docker variant remains available via
`docker-compose.yml` if that path is ever adopted.

---

## C-4 · `package.json` — KEEP Source A

Source B removes 72 entries and adds 28. Among the removals: `vitest`,
`@vitest/coverage-v8`, `tsx`, `mysql2`, `csv-parse`, `dotenv`, `js-yaml`,
`@playwright/test`, `effect`, `firebase-admin`, `autoprefixer`, `postcss`,
`cron-parser`, and the `engines`/`overrides`/`packageManager` blocks.

Removing `vitest` and `tsx` would break `npm test`, `npm run db:seed` and every
`tsx scripts/*` invocation. Removing `engines`/`packageManager` would drop the
Node ≥ 22 / npm ≥ 10 contract that `tests/unit/deployment-config.test.ts`
asserts. **Resolution: A retained.** No dependency was added or removed.

---

## C-5 · `next.config.ts` — KEEP Source A (+5 / −87 in B)

Source A's version carries the security headers (CSP, HSTS, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) and the
rewrite table that keeps legacy URLs alive. Source B strips 87 lines.
**Resolution: A retained** — brief §27 forbids weakening security during a merge.

---

## C-6 · The 382 `src/` and `prisma/seed-*` files — KEEP Source A, per-file review

Direction of change measured across the whole set:

| | Source A | Source B |
|---|---|---|
| API routes referencing an auth helper | **583** | **0** |

Representative file reviewed in full — `src/app/api/admin/resources/route.ts`:

| Change in B | Verdict |
|---|---|
| `contentAuditLog.create(...)` → `db.auditLog.create(...)` | **REJECT** — loses the dedicated content audit trail |
| adds `detail: err.message` to 500 responses | **REJECT** — internal error leakage (brief §27, "error leakage") |
| `_count` adds `relationships` + `reverseRelationships` | **ACCEPT IN PRINCIPLE** — genuinely useful |

**Resolution: Source A retained for all 382.** Source B's `src/` is a
consistently reduced variant: no auth helpers, generic audit logging, error
detail exposed. The one improvement found (richer `_count`) is noted as
**REVIEW_REQUIRED** rather than applied blindly, because it depends on relation
names that only exist in the 479-model schema.

All 382 rows are individually listed in `AUDIT/ARENA_FILE_MERGE_MANIFEST.csv`
with `merge_action=REVIEW_REQUIRED`.

---

## C-7 · `alo-cpanel/` (85 new files) — EXTRACT_AND_MERGE, sanitised

New in Source B: an 83-file PHP 8 + PDO/MySQL cPanel CRM covering leads,
students, applications, courses, universities, communications, marketing,
finance, tasks, reports, users and cron; plus `examples/websocket/` (2 files).

**Kept, not deleted** (brief §6), but **not wired into the runtime** (brief §18:
the active runtime must not depend on obsolete infrastructure). Porting 83 PHP
files into Next.js would be a rewrite and would duplicate existing
`src/app/api/` routes.

**Sanitised on import** — `alo-cpanel/config/config.php` shipped with:

- the **real production database password** — the same value as SEC-D,
  i.e. merging this branch naively would have **re-committed a credential that
  PR #15 had just removed**
- the real database **username**
- a default `APP_KEY` placeholder used as a live value

All replaced with a `alo_env()`/`getenv()` helper with no insecure fallback.
`install.php`'s form placeholder echoing the real username was generalised.
Classification and hazards: `alo-cpanel/STATUS.md`.

Verification: the CI secret-scan step (extracted from `ci.yml` and executed
verbatim) passes over the staged tree including all 85 files.

---

## C-8 · The 4,818 deletions — ALL REJECTED

Source B deletes 4,818 files that exist in Source A, including:

- **all four GitHub workflows** (`ci.yml`, `deploy-production.yml`,
  `deploy-recovery.yml`, `health-monitor.yml`) — would remove CI, gated
  deployment, recovery and health monitoring entirely
- `.env.example`, `.env.production.example`, `.npmrc`, `.dockerignore`
- `.github/`, most of `src/`, the test suite, `package-lock.json`
- the root dataset CSVs and the delivery-evidence directories

Accepting these deletions would destroy the delivery pipeline and most of the
application. **Resolution: every deletion rejected.** Each is recorded in
`AUDIT/ARENA_FILE_MERGE_MANIFEST.csv` with `merge_action=KEEP` and reason
*"Other branch deletes it; deletion REJECTED"*.

---

## Summary

| Conflict class | Count | Resolution |
|---|---|---|
| Git conflict markers | **0** | none exist |
| Same-path different code | 382 | Source A retained; each row logged `REVIEW_REQUIRED` |
| Files only in Source B | 85 | extracted, sanitised, classified LEGACY |
| Files only in Source A | 4,818 | deletions rejected |
| Renames | 2 | logged `REVIEW_REQUIRED` |
| Config files merged field-by-field | 1 (`ecosystem.config.cjs`) | MERGE_BOTH |
| Config files where A was kept | 4 (`nginx.conf`, `package.json`, `next.config.ts`, `prisma/schema.prisma`) | KEEP |
