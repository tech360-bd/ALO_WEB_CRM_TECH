# 04 — Risk Register

**Date:** 2026-10-12 · **Commit:** `be9081f` · Severity = impact × likelihood (H/M/L). "Gate" = where the plan controls it.
Risks inherited from earlier registers (`SECURITY-AUDIT.md`, `AUDIT/catalogue-phase1-…/PHASE1-RESULTS.md`, `AUDIT/final-blockers-2026-10-11/`) are cited, not restated blindly.

| ID | Risk | Sev | Evidence | Mitigation | Gate |
|---|---|---|---|---|---|
| R1 | **Unsafe schema defaults** (`CoursePage.verificationStatus=VERIFIED`, `approvalStatus=PUBLISHED`) let any unguarded create path publish unverified content | H | `AUDIT/catalogue-phase1-2026-10-12/PHASE1-RESULTS.md` remaining risk 1–2 | Approved migration flipping defaults to NEEDS_REVIEW/draft + read-only audit of existing VERIFIED rows (R2) + fix `DEPLOY_CONTENT` fallback | Phase 1 (migration), needs explicit approval |
| R2 | **Legacy VERIFIED data may be fabricated** (old code auto-verified); fabricated CSVs still in git | H | `AUDIT/course-finder-2026-10-12/UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md`; audit §B5/D7 | Read-only DB audit → quarantine suspects → import only sourced data; owner decision on deleting/moving git CSVs | Phase 2 data programme |
| R3 | **No malware scanning on uploads** (§7 non-negotiable) | H | audit §B2 | Scanner stage (ClamAV or host-provided) before file availability; fail-closed on scan outage | Phase 3 |
| R4 | **Paid LLM API dependency creeps back** (§10 hard rule) | H | `model-router.ts` cloud providers; env keys | Fail-closed policy (`ALO_AI_ALLOW_PAID_AP`), prod env CI check, license register, local runtime health-gating | Phase 1 policy + Phase 4 runtime |
| R5 | **AI prompt-injection / over-privilege** in agent tool loops | H | D8; §17 AI tests unproven | Least-privilege grants (exists), sandboxed tools, injection eval suite, human approval for consequential actions (exists) | Phase 4 |
| R6 | **Cross-tenant leakage** (student/partner) via new code paths | H | `partner-b2b-security.test.ts` shows past defects of exactly this class | Make tenant-isolation negative tests mandatory CI for any new portal API; keep `auth.partnerId` server-resolved | Continuous; CI gate Phase 1 |
| R7 | **Production data loss / bad migration** on a 532-model live schema | H | schema size; `DATABASE_RECONCILIATION.md` | Isolated-copy migration tests, verified backups + restore test BEFORE any prod migration, rollback scripts | Phase 6 (hard gate) |
| R8 | **Email/DNS damage at cutover** (§15 preservation) | H | no DNS evidence yet | Pre-cutover DNS capture, SPF single-record rule, no MX edits in app work, staged cutover checklist | Phase 6 (hard gate) |
| R9 | **Hostinger runtime mismatch** (Node version, workers, DB limits, no GPU) | M–H | §2.1 directive; audit §B9 | Verify plan first; keep deployment topology swappable (PM2 vs Docker); local AI on separate host if needed | Phase 1 (verify) |
| R10 | **Registry duplication** (6 agent/department families) → divergent truth, double-counted "2,000 agents" | M | audit §C1 | Consolidation decision (Awf* canonical), read-model aliases, freeze on new registries | Phase 1 |
| R11 | **Identity-model debt** (User/PortalUser/Student/AloStudent/PortalStudentProfile) → authz confusion | M | `docs/ALO-EDUCATION-FULL-AUDIT.md` | Mapping layer + deprecation plan; no new identity tables | Phase 1–2 |
| R12 | **Metric fabrication risk** in AI dashboards (§9 "do not fabricate counts") | M | dashboards mixing seeded and live tables | Derived-only metrics with SQL/audit sources; "seeded/estimate" labels; review pass | Phase 4 |
| R13 | **Integration outages** (WhatsApp/Meta/SMTP) failing silently | M | `ProviderErrorLog`, retry queues exist | Delivery-status surfacing, dead-letter alerts, honest UI status (pattern established in partner-marketing `be9081f`) | Phase 3 |
| R14 | **Scope explosion** — 532 models, 1,300+ pages/routes invite endless rebuilds | M | tree size | Explicit "reuse-first" rule (§1), consolidation over rewrites, staged plan below | All phases |
| R15 | **This-sandbox tooling limits** caused unverifiable gates (Prisma engines) | L–M | audit §E | Clear gates on CI/dev machine first thing in Phase 1 | Phase 1 entry |
| R16 | **Secrets leakage into git** during later work | M | `SECRET_SCAN_REPORT.md` history | CI secret-scan gate; `.env` discipline (existing) | Phase 1 |
| R17 | **Backup exists but restore never tested** (classic failure) | H | `backup.sh`/`restore.sh` present; no restore-test evidence | Scheduled restore drill on staging copy; documented RTO/RPO | Phase 6 |
| R18 | **Legacy side-trees confuse future agents/humans** (PHP/Python/Bun/export trees) | M | audit §C2 | Quarantine docs + CI path excludes; archive with approval later | Phase 1 housekeeping |
| R19 | **Parallel in-flight repairs collide** — open PR #6 (`arena/712caef6`) repairs the same PR#4 merge damage as `be9081f` across 8 shared files (sitemap, auth-middleware, partner-marketing route, 4 tests, exporter script) and adds a `prisma/schema.prisma` duplicate-relation fix | H (conflict/regression risk if merged blindly) | `00-REPOSITORY-STATE.md` file-overlap table | Owner-directed merge order; per-file diff + test-based reconciliation (both sides run the same suites); re-run full suite on the merged result before Phase 1 work | **Immediate — before any Phase 1 code** |

**Top five to act on first:** R1/R2 (data integrity), R3 (§7), R4 (§10), R7/R17/R8 (production safety), R5/R6 (isolation).
