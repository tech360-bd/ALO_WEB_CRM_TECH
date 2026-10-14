# PR #7 — INTEGRATION VERIFICATION AND DECISION
**Branch under review:** `integration/ai-builder-full-20261013` @ `9b99840ebcec2a0d67a0f89603b8db824bf9c217`
**Target:** `main` @ `c2cc79e95`
**Verified:** 2026-10-14 · **Method:** real three-way merge + tree extraction (no checkout, no push, no merge)
**Authorization state — nothing was executed:** no merge, no push, no deploy, no production change, no branch modification.

---

## DECISION

> ## 🚫 DO NOT MERGE PR #7 AS-IS
>
> The nine conflicts are **not** merge conflicts between two valid versions of the same code.
> **They are regressions.** In eight of the nine, resolving the conflict normally would
> **reintroduce a fixed security defect**.
>
> This corroborates the decision already recorded in `PR7-FINAL-DECISION-2026-10-13.md`
> (main), which reached *"FULL PR #7 INTEGRATION: BLOCKED"* independently.
> This report adds **new critical findings that report did not contain.**

---

## 1. Why the earlier analysis was wrong about the topology

The repository was a **shallow clone** (graft boundary = `c2cc79e9`, 18 commits visible, `.git/shallow` present). In a shallow clone `git merge-base` returns unreliable answers — it reported `7c26aad4` as the merge base, which **is not even a common ancestor**.

After `git fetch --unshallow --filter=blob:none` (1.5 s), the true topology is:

| | Commit | Meaning |
|---|---|---|
| **True merge-base** | `e02f689cc` | *"Catalogue Phase 1 security fixes and review remediation (K1–K4, P0-A–P1-D) (#54)"* |
| **`main` tip** | `c2cc79e95` | **44 commits ahead** of the base |
| **PR #7 tip** | `9b99840eb` | **exactly 1 commit**, on top of the stale base |

**The PR is a single commit built against a `main` that is 44 commits out of date.** That is the entire cause of the conflicts. The PR is not "in progress" — it was completed against an old base and then abandoned while `main` moved on.

**Consequence for the security finding:** the PR's base *is the security-fix commit (#54)*. The PR then **reverts the very fixes it was built on.**

---

## 2. Scale and shape of the change

| Measure | Value |
|---|---|
| Files changed | **739** |
| Insertions / deletions | **+141,875 / −39,412** |
| Files **added** | 417 |
| Files **modified** | 322 |
| Files **deleted** | **0** |

Of the 322 modified files: **225 shrink**, 68 grow, 29 unchanged in size. **70 % of the files the PR touches get smaller** — the signature of an older, simpler application being laid over a newer one.

---

## 3. THE NINE CONFLICTS — file-by-file verdict

Verified by extracting all three sides (`git show <base|main|PR>:<file>`) and by running a real three-way merge (`git merge-tree --write-tree origin/main 9b99840e`), which **reproduced GitHub's conflict list exactly**.

| # | File | main | PR | Verdict |
|---|---|---|---|---|
| 1 | `prisma/schema.prisma` | MySQL · **532 models** · 11,705 lines | **SQLite** · **155 models** · 3,799 lines (−11,073) | **KEEP MAIN** |
| 2 | `next.config.ts` | 149 lines · type errors block the build | 11 lines · **`ignoreBuildErrors: true`** · `reactStrictMode: false` | **KEEP MAIN** |
| 3 | `src/lib/db.ts` | 64 lines · production logs `['error']` | 13 lines · **`log: ['query']`** | **KEEP MAIN** |
| 4 | `src/app/api/ai-command/execute/route.ts` | 452 lines · **401 + 403 auth** | 217 lines · **ZERO authentication** | **KEEP MAIN — CRITICAL** |
| 5 | `partner-admin/dashboard/route.ts` | 139 lines · `requirePartnerContext` ×2 | 84 lines · **×0** · `partnerId` from query string | **KEEP MAIN** |
| 6 | `partner-admin/seat-requests/route.ts` | 188 lines · guard ×2 | 47 lines · **×0** | **KEEP MAIN** |
| 7 | `partner-admin/users/route.ts` | 187 lines · guard ×2 | 70 lines · **×0** | **KEEP MAIN** |
| 8 | `partner-admin/vouchers/route.ts` | 191 lines · guard ×2 | 113 lines · **×0** | **KEEP MAIN** |
| 9 | `components/alo/views/partner-marketing-studio.tsx` | 1,250 lines | 1,313 lines | **REVIEW INDIVIDUALLY** — the only non-regression |

### 3.1 Finding #1 — the database schema would be destroyed

```
PR:      datasource db { provider = "sqlite"  }   ← wrong engine
main:    datasource db { provider = "mysql"   }   ← production
```

The PR **replaces the production MySQL schema with a different application's SQLite schema.**

* **−11,073 lines**, **−395 models** (532 → 155)
* Models that would cease to exist include **`AloApplication`, `AloDocument`, `AloMessage`, `AloPayment`, `AloAppointment`, `AloAuditLog`, `AloEnglishTest`** and the entire AI-workforce set (`AgentApprovalQueue`, `AgentAuditLog`, `AgentOSTask`, `AiModel*`, …)
* The PR's replacements are generic names from another codebase — `User`, `Lead`, `Student`, `Document`, `Application`

**Merging this and running any Prisma operation would drop 395 tables from the production CRM.** Prisma would require a migration that removes every one of them.

### 3.2 Finding #2 — an AI command endpoint would become unauthenticated

| | `src/app/api/ai-command/execute/route.ts` |
|---|---|
| **main (correct)** | `getServerSession(authOptions)` → `401 Unauthorized` → role check → `403 Insufficient permissions` |
| **PR** | **no session check. no 401. no 403. no token validation.** |

This endpoint **executes AI commands**. Unguarded, it is a public action-execution surface.

Note: the **base commit (`e02f689c`) contains the auth check (4 references)** — so the PR *removed* protection that existed in its own parent.

### 3.3 Finding #3 — cross-tenant data leak reintroduced across the partner surface

All four `partner-admin` routes follow one pattern:

| Route | `requirePartnerContext` in main | in PR | `partnerId` reads |
|---|---|---|---|
| dashboard | 2 | **0** | query string |
| seat-requests | 2 | **0** | query string |
| users | 2 | **0** | query string |
| vouchers | 2 | **0** | query string |

The PR's `dashboard` logic:

```ts
const partnerEmployeeId = req.nextUrl.searchParams.get("partnerId");
if (!partner) partner = await db.employeeHR.findFirst({ where: { role: "PARTNER" } });
```

**Any caller can pass any `partnerId`; if none is supplied it silently falls back to an arbitrary partner.** `main`'s own comment documents this as already-fixed:

> *"CROSS-TENANT LEAK. `activeApplications`, `submittedApplications`, `offerReceived` and `visaReadyStudents` were counted with no partner filter at all, so every partner's dashboard displayed ALO Education's platform-wide application totals as if they were its own."*

### 3.4 Finding #4 — production hardening reverted

* `typescript.ignoreBuildErrors: true` → **the build stops catching type errors.** (It is precisely this check that caught the `AloApplication.submitted` and nullable `UccAttachment.studentId` errors fixed in this session.)
* `reactStrictMode: false` → React's double-render safety checks disabled.
* `src/lib/db.ts` → `log: ['query']` restores **query logging that exposes bound parameters**, which main's comment states was deliberately removed because it *"can expose authentication material in bound parameters."*
* The 149-line production config (`output: 'standalone'`, `poweredByHeader: false`, restricted `allowedDevOrigins`, restricted image `localPatterns`) is replaced by 11 lines.

---

## 4. What the PR genuinely contributes (the salvageable 417 files)

The PR is **not worthless** — it adds 417 new files. Nothing in this section is a defect; it is the material worth porting:

| Area | Count | Notes |
|---|---|---|
| `src/components/alo/*` | 119 | AI Builder UI views |
| `src/app/api/*` | 107 | New API routes |
| `public/images/*` | 74 | Assets |
| `src/components/platform/*` | 38 | Platform components |
| `src/lib/ai/*` | 14 | AI helpers |
| `src/lib/offline/*` | 8 | Offline support |
| `mini-services/*` | 12 | `marketing-publisher`, `invoice-notifier`, `deadline-reminder`, `realtime-service` |
| `prisma/seed-*.ts` | ~15 | `seed-all-data`, `seed-course-finder`, `seed-ai-workforce`, `seed-more-unis`, `seed-official-sources`, … |
| Other | — | `public/.htaccess`, `public/robots.txt`, `src/lib/id-generator.ts`, `country-configs.ts`, `audit.ts`, `api-auth.ts` |

**The `prisma/seed-*.ts` files are likely the highest-value item for you** — `seed-course-finder`, `seed-more-unis`, `seed-all-countries` and `seed-official-sources` are exactly the kind of university/course data you asked about. They must be checked against the real 532-model schema before use, since they were written for the 155-model one.

---

## 5. Correction to the previous report

`PR7-FINAL-DECISION-2026-10-13.md` states the repository contains **357 tracked files with leftover conflict markers** and that this "prevent[s] safe full comparison."

**That is not true of `main` or of PR #7.** Verified by scanning every text file in both trees:

| Tree | Text files scanned | Files containing `<<<<<<<` / `>>>>>>>` |
|---|---|---|
| `origin/main` | 6,156 | **0** |
| PR #7 (`9b99840e`) | 6,485 | **0** |

The 357 markers were in **that session's own working branch** (`arena/5656dd34-alo-web-crm-tech` @ `15e6f925`), not in the PR. **This means "full comparison" was never actually blocked** — and the comparison now performed above is the one that was previously deferred.

---

## 6. Verification matrix

| Check | Result | Evidence |
|---|---|---|
| True merge base determined | **PASS** | `git merge-base --is-ancestor` after unshallow |
| Conflict list reproduced independently | **PASS** | `git merge-tree --write-tree` → identical 9 files |
| `main` schema engine | **PASS** | `provider = "mysql"` |
| PR schema engine | **FAIL** | `provider = "sqlite"` |
| Schema model preservation | **FAIL** | 532 → 155 (−395 models) |
| Auth on `/api/ai-command/execute` (main) | **PASS** | 401/403 present |
| Auth on `/api/ai-command/execute` (PR) | **FAIL** | absent |
| Tenant guard on partner-admin (main) | **PASS** | ×2 per route |
| Tenant guard on partner-admin (PR) | **FAIL** | ×0 per route |
| Build-time type checking (main) | **PASS** | no `ignoreBuildErrors` |
| Build-time type checking (PR) | **FAIL** | `ignoreBuildErrors: true` |
| Conflict markers in `main` | **PASS** | 0 files |
| Conflict markers in PR | **PASS** | 0 files |
| Secret scan of PR | **NOT RUN** | requires authorization |
| Prisma migration on disposable MySQL | **NOT RUN** | no MySQL available |
| Production build of merged result | **NOT RUN** | destructive merge not performed |
| **Merge executed** | **NOT RUN — DELIBERATELY** | see §7 |

---

## 7. What was deliberately NOT done

Per authorization boundaries carried forward from the previous report, and to avoid irreversible harm:

* **No merge was executed.** The verification used `git merge-tree` (in-memory plumbing) and `git show` (read-only extraction). No checkout, no working-tree mutation.
* **No push to any branch.** This session works only on `arena/57b0809e-alo-web-crm-tech`.
* **No production database touched.** No migration run.
* **PR #7 was neither merged nor closed** — the decision is yours to make explicitly.

---

## 8. Recommended path forward

**Do not resolve these nine conflicts by merging.** Instead:

### Step 1 — Keep `main` for 8 of the 9 files
For conflicts 1–8, the resolution is simply **main's current version**. This is not a compromise; in every one, main is strictly newer, is production-configured, and contains fixes the PR reverts.

### Step 2 — Review conflict 9 individually
`partner-marketing-studio.tsx` (1,250 → 1,313 lines) is the only conflict where the PR may add value. It needs a genuine diff review — no other file does.

### Step 3 — Extract the 417 added files onto current `main`
Create a **fresh** branch from `main` (not from the PR) and port the additive content **selectively**, verifying each against the real 532-model schema. Start with the `prisma/seed-*.ts` files and the AI Builder components — those are the highest-value items and the ones you asked about.

### Step 4 — Have the AI Builder re-based, or close the PR
The integration cannot be salvaged as a merge because its base is 44 commits stale. Either:
- **(a)** the author re-bases it onto current `main` and re-applies only the additive work, or
- **(b)** it is closed in favour of Step 3.

### Step 5 — Only then consider merging
After a clean re-base: secrets scan, disposable-MySQL migration run, production build, then review.

---

## 9. Answers to the questions shown in the GitHub UI

**"Still in progress?"** — No. The PR is a single finished commit (`9b99840e`) built on a stale base. Nothing is pending from the author.

**"Not planning to merge?"** — **Correct, and it should not be merged in its current form.** Doing so would drop 395 database models, switch the datasource to SQLite, expose an unauthenticated AI-command endpoint, reintroduce cross-tenant data leaks across the partner surface, and disable build-time type checking. The appropriate action is to **close it and re-integrate the additive work** (§8, Step 3) — not to resolve the conflicts.
