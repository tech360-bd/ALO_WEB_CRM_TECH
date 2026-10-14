# Phase 0 — Master Implementation Instruction: Read-only Discovery Audit

**Date:** 2026-10-12 (Asia/Dhaka)
**Repository:** `tech360-bd/ALO_WEB_CRM_TECH` · branch `arena/1cf1296a-alo-web-crm-tech` @ `be9081f` (base: `main` @ `e4f26a1`, merge of PR #4)
**Directive:** Master Implementation Instruction §18 Phase 0 — *"comprehensive read-only audit … Do not modify production, DNS, secrets, mailboxes, repository files, database records or hosting resources during the initial audit."*

## Scope and method

This package is **documentation only**. No existing repository file, configuration, database record, DNS/hosting setting, or secret was modified while producing it. The only writes are these new files under `AUDIT/phase0-master-instruction-2026-10-12/`, which are the required Phase 0 deliverables themselves.

Method:

1. **Static inventory** of the working tree (schema, routes, pages, tests, deployment configs, env templates) — commands and counts recorded in the documents below.
2. **Cross-reference of prior verified audits** already in the repository, re-verified where cheap (file presence, test runs). Prior evidence is cited by path and dated; nothing is re-claimed without a source.
3. **Live verification** where the sandbox permits: full test suite executed today (results below), lint and scoped type-check executed today.
4. **Honest labelling.** Every feature area receives one of: **PASS** (implemented and verified with evidence), **FAIL** (tested and failed), **PARTIAL**, **NOT VERIFIED** (insufficient evidence), **BLOCKED** (needs external dependency/infrastructure).

## Verified baseline of this session (evidence, not estimates)

| Check | Result | Evidence |
|---|---|---|
| Unit + integration suite (`npx vitest run`) | **1911 passed / 14 failed / 35 skipped** | `AUDIT/final-check-2026-10-12/full-suite-summary.txt` (run 2026-10-12) |
| The 14 failures | all `@prisma/client did not initialize` — engine download (`binaries.prisma.sh`) unreachable from this audit sandbox | `AUDIT/final-check-2026-10-12/full-suite-failing-files.txt` |
| The 35 skipped | MySQL integration tests requiring a disposable MySQL | same run |
| ESLint + scoped `tsc` on all files changed this week | 0 errors | `AUDIT/final-check-2026-10-12/FINAL-CHECK-REPORT.md` |
| Post-merge defects found and fixed this week (committed `be9081f`) | sitemap parse error (build-breaking), duplicate `AuthContext` members, partner-marketing contract/security drift | `AUDIT/final-check-2026-10-12/FINAL-CHECK-REPORT.md` |

## Deliverable index

| # | Artifact | File |
|---|---|---|
| 0 | Repository/branch/PR snapshot (incl. **open PR #6 coordination finding**) | `00-REPOSITORY-STATE.md` |
| 1 | Existing system audit report (what works / incomplete / duplicated / insecure / unverifiable) | `01-EXISTING-SYSTEM-AUDIT.md` |
| 2 | Architecture and integration map | `02-ARCHITECTURE-MAP.md` |
| 3 | Feature inventory and gap matrix (Master Instruction §3–§17) | `03-FEATURE-GAP-MATRIX.md` |
| 4 | Risk register | `04-RISK-REGISTER.md` |
| 5 | Implementation plan (Phases 1–6, reviewable stages, approval gates) | `05-IMPLEMENTATION-PLAN.md` |

## What Phase 0 explicitly does NOT do

- No code, test, schema, seed, CI, or configuration changes.
- No production, DNS, mailbox, hosting, or repository-settings access.
- No claim that any environment-blocked check passed. Items that need `prisma generate`, a real MySQL, the production host, or live third-party consoles are labelled **NOT VERIFIED** or **BLOCKED** with the exact command needed to clear them.

**Next step after this package:** owner review of the plan (`05-IMPLEMENTATION-PLAN.md`) and explicit approval before Phase 1 begins. Consequential actions (migrations, deploys, DNS, mailbox changes) each carry their own later approval gate as required by the Master Instruction.
