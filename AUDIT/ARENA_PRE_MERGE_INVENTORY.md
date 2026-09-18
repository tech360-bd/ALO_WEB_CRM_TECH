# ARENA PRE-MERGE INVENTORY — ALO Education

**Date:** 2026-09-18 · **Session:** `arena/01a0b26d-alo-education-z-ai`
**Repository:** `engralaminn-collab/alo_education_z....ai`
**Base commit:** `85560ac7d5a173cbf9de9f34f58ebffbdf468a67` (= `origin/main` `cc15869` + PR #15 security work)

Read-only forensic inventory taken **before** any application code was modified.

---

## 1. Correction to the brief's premises

Three premises in the merge instruction did not survive verification. They are
recorded here because they change what the correct merge is.

### 1.1 "SOURCE A: canonical local project uploaded to this repository" — NOT FOUND as a separate source

There is no second uploaded tree inside the repository. `git ls-remote --heads origin`
returned 12 branches; `main` and this session branch contain the same single
codebase. There is no "canonical local upload" distinct from the GitHub history —
the repository *is* the canonical source.

### 1.2 "SOURCE B: existing GitHub project and its previous history" — FOUND, but not where expected

The genuine second source is the remote branch **`other-ai-builder-2026-09-13`**,
one commit `b22a18ae` — *"chore: upload other AI builder ALO source for
comparison"* — which is **not merged into `main`**:

```
git merge-base --is-ancestor origin/other-ai-builder-2026-09-13 origin/main  → NO
git rev-list --count origin/main..origin/other-ai-builder-2026-09-13         → 1
git rev-list --count origin/other-ai-builder-2026-09-13..origin/main         → 165
merge-base = 85560ac7 (this session's branch tip)
```

So `b22a18ae` is a **direct child of this session's commit**. It is not an
independent history to be reconciled; it is one commit that replaces large parts
of the current tree with a different, smaller implementation.

### 1.3 "Search the ENTIRE repository for conflict markers" — NONE EXIST

```
git grep -nE '^(<{7}|={7}|>{7})( |$)' -- .   → 0 files
```

There is no in-progress merge, no rebase, and no conflict marker anywhere in
tracked or untracked files. §3 of the brief is satisfied vacuously: there is
nothing to semantically resolve from markers.

---

## 2. The two source systems, measured

| | **SOURCE A — `main` / this branch** (`85560ac7`) | **SOURCE B — `other-ai-builder-2026-09-13`** (`b22a18ae`) |
|---|---|---|
| Tracked files | 5,565 | ~830 |
| Prisma models | **479** | **214** |
| `page.tsx` | 366 | far fewer (deletes most of `src/app`) |
| `route.ts` (API) | **818** | ~436 |
| API routes with an auth helper | **583** | **0** |
| CI/CD workflows | 4 (`ci`, `deploy-production`, `deploy-recovery`, `health-monitor`) | **0 — deletes all four** |
| Package manager | npm 10.9.2 + `package-lock.json` | removes `vitest`, `tsx`, `mysql2`, `csv-parse`, `dotenv`, `js-yaml`, `firebase-admin`, `@playwright/test`, `effect` |
| App port | **3044** | **3015** |
| Deploy path | `/root/alo-github-main-new` | `/home/aloedu/aloeducation` (cPanel) |
| Reverse proxy target | `127.0.0.1:3044` | `http://app:3000` (Docker) |
| Extra content | — | `alo-cpanel/` (83-file PHP/cPanel CRM), `examples/websocket/` |

Diff between them: **85 added · 382 modified · 4,818 deleted · 2 renamed**.

**Conclusion.** Source B is not a superset and not an alternative of equal
standing — it is a smaller, older-shaped implementation that would delete the
CI/CD pipeline, 265 Prisma models, ~380 API routes and the entire test setup if
adopted. Merging "the strongest valid combination" therefore means: **A as the
base**, plus the specific things B does better, extracted individually.

---

## 3. Repository inventory (Source A, verified)

| Area | Count / value |
|---|---|
| Tracked files | 5,565 |
| `src/app/**/page.tsx` | 366 → `AUDIT/ARENA-PAGE-INVENTORY.csv` |
| `src/app/api/**/route.ts` | 818 → `AUDIT/ARENA-ROUTE-INVENTORY.csv` |
| Prisma models | 479 (`prisma/schema.prisma`, MySQL) |
| Prisma migrations | 10 (`prisma/migrations/`) |
| Test files | 19 → 200 tests passing at base |
| Scripts | 105 in `scripts/` |
| GitHub workflows | 4, all `state=active` |
| AI agent registry | `agents/agent_registry_1020.json` — 2,000 declared agents |
| Agent context prompts | `agent-ctx/` — 17 markdown files |
| MCP servers | **0** — the only `mcp` string in `src/` is UI copy |
| Mini-services | 3 (`sla-monitor`, `follow-up-sender`, `university-monitor`), bun-based, own lockfiles |
| Nested project | `alo-education-web-crm-final/` — 1,520 files, historical delivery snapshot |
| Datasets | ~90 CSV/JSON at root (universities, courses, intakes, fees, scholarships, deadlines, provenance) |

### Legacy technology classification (§18 of the brief)

| Reference | Classification | Evidence |
|---|---|---|
| cPanel / PHP | **LEGACY** (now also present as `alo-cpanel/`) | no workflow, Dockerfile, nginx.conf or PM2 entry references it |
| Firebase (`firebase-admin`, `firestore.rules`) | **ACTIVE dependency, narrow use** | in `package.json`; `src/lib/firebase-admin.ts` |
| Vercel (`vercel.json`) | **UNUSED at runtime** | production is PM2 on a VPS; file is inert |
| Base44 | **NOT PRESENT** | no reference found |
| Supabase | **NOT PRESENT** | no reference found |
| Docker (`Dockerfile`, `docker-compose.yml`) | **CONFIGURED, not the deploy path** | deploy workflow uses PM2 + nginx/Caddy |

---

## 4. Deployment target — evidence, and a disagreement with the brief

§20 of the brief instructs that the production path is `/root/alo-github-main`
and that `/root/alo-github-main-new` must not be used "unless explicitly
required by a verified configuration".

**The verified configuration requires `-new`.** Measured:

```
git grep -c 'alo-github-main-new'  → 406 occurrences
git grep    'alo-github-main' (excluding -new) → 19 occurrences
```

and in `.github/workflows/deploy-production.yml`:

```yaml
INTENDED_DEPLOY_DIR: '/root/alo-github-main-new'
```

with the non-`-new` path retained only as a **legacy detection candidate** —
live PM2 `exec cwd` is treated as ground truth over both.
`tests/unit/deployment-config.test.ts` is titled
*"target 3044 / /root/alo-github-main-new"*.

**Decision: the path was NOT changed.** Changing it would contradict 406
references, the installed workflow, and a passing test, on the strength of an
assertion that cannot be checked from this sandbox (no SSH access). Recorded as
**OWNER ACTION REQUIRED** — verify on the VPS:

```
pm2 describe alo-education | grep 'exec cwd'
```

Port **3044** and PM2 name **`alo-education`** are confirmed and unchanged.
`learn.aloeducation.com` / `alo-learning-journey` / **3017** is confirmed
protected: the deploy workflow only ever runs `pm2 describe` on it, never a
restart.

---

## 5. Security state found during the inventory

Recorded here because it shaped the merge priorities. Details and fixes are in
`AUDIT/ARENA-MERGE-REPORT.md` §5 and `docs/SECURITY_FINDINGS_2026-09-18.md`.

| ID | Finding | Status at inventory |
|---|---|---|
| SEC-A | `/api/commissions` — no auth | fixed in PR #15 |
| SEC-B | `/api/counselor/students/[id]` — no auth, leaked `password`/`otpCode` | fixed in PR #15 |
| SEC-C | `/api/crm/seed` — public, returned plaintext admin passwords | fixed in PR #15 |
| SEC-D | Real production DB password committed | removed in PR #15; **rotation still required** |
| SEC-E | CI secret scan excluded all `*.md`/`docs/` | fixed in PR #15 |
| SEC-F | `/api/hr/payroll`, `/api/finance` — no auth | fixed this session |
| SEC-G | `/api/student/profile` — IDOR via `?studentId=` | fixed this session |
| SEC-H | `/api/employee/documents/[id]/download` — identity from `?viewerId=` | fixed this session |
| SEC-I | **all 9** `/api/cron/*` routes unauthenticated (2 had empty-bodied guards) | fixed this session |
| SEC-J | Source B's `alo-cpanel/config/config.php` re-commits the same leaked DB password | sanitised on import |

Production itself was **not** verified in this session: sandbox egress is
allowlisted to `github.com` + `registry.npmjs.org` and all TLS is intercepted by
a proxy CA, so probes of `aloeducation.com` are meaningless. The repository's own
health monitor last reported **HTTP 502**.
