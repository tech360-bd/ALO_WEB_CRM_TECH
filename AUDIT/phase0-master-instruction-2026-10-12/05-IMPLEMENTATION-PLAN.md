# 05 — Implementation Plan (Phases 1–6)

**Date:** 2026-10-12 · **Commit:** `be9081f` · Requirement source: Master Instruction §18. **Awaiting owner approval before Phase 1 starts.**

Principles (from §1/§18): reuse-first, small reviewable tested stages, no production/migration/deploy/DNS/mailbox actions without explicit approval at the named gates, evidence for every claim.

---

## Phase 1 — Architecture and security foundation

**Goal:** boundaries, permissions, verification gates, policies. Mostly decisions + small code.

| # | Stage (each its own PR-sized change) | Covers | Exit evidence |
|---|---|---|---|
| 1.0 | Clear environment gates on CI/dev: `prisma generate`, `npm run typecheck`, `npm run build`, full suite incl. MySQL job | R15 | Green CI run on the session branch |
| 1.1 | **Owner decision workshop (async doc):** registry consolidation (R10), identity mapping (R11), fabricated-CSV disposition (R2), VERIFIED-downgrade policy, intake unique index, MFA mandate level | B13, C1, B11, B4 | Signed decision record in `AUDIT/` |
| 1.2 | AI policy enforcement: `ALO_AI_ALLOW_PAID_AP` fail-closed switch + license register + prod-env CI check (no paid keys in prod env) | R4, §10 | Tests + CI gate |
| 1.3 | Permission-matrix reconciliation: §13 role list vs `ROLE_INVENTORY.csv` vs live DB roles; document salary/HR-record restrictions | §13, §6 | Updated matrix + negative tests |
| 1.4 | Mutation-origin + handler-authz sweep: inventory of ~85 proxy-only routes; add `mutationOriginAllowed`/handler guards in batches (5 batches) | B7, R6 | Per-batch tests; route inventory diff |
| 1.5 | Secrets/dependency gates: secret-scan + `npm audit` in CI; sweep tables for stored secrets | R16, §13 | CI logs |
| 1.6 | Schema-defaults migration (R1) prepared on isolated copy + VERIFIED-row read-only audit (R2 part 1) | R1, R2 | Migration tested on copy; audit report — **approval gate before applying anywhere live** |
| 1.7 | Deployment-topology verification: Hostinger plan facts (Node, processes, MySQL limits, GPU) → choose PM2-vs-Docker authority; document | R9, §2.1 | Verified constraints doc (owner supplies access/facts) |
| 1.8 | CI hardening: tenant-isolation negative tests required for new portal APIs; a11y/responsive smoke added | R6, §17 | Workflow diff |
| 1.9 | Backup/restore drill on staging (R17 part 1) | R7, R17 | Restore-test record |

**Exit condition (§18):** architecture, risks and migration plan approved — i.e. 1.1 decisions signed, 1.6 plan approved, 1.7 facts recorded.

## Phase 2 — Website and core CRM

| # | Stage | Exit evidence |
|---|---|---|
| 2.1 | CMS evidence pass (scheduling, redirects, version history, attribution, Bangla/English pairs) in staging | Scripted E2E per §3 |
| 2.2 | **Data-quality programme:** import pipeline for sourced university/course data (reuse `catalogue-import-service`, `apply-approved-changes`, source-logs); quarantine fabricated sets | Verified rows only; provenance on every row |
| 2.3 | Duplicate/conflict merge workflow (B13) using `MERGE-WORKFLOW-DESIGN.md` | Admin-tested merge with audit + rollback |
| 2.4 | Application lifecycle configurability (§4 stages) evidence + student/partner isolation negative suite | Staging test run |
| 2.5 | Apply-Now gating wired to verified intake data | E2E with real rows |
| 2.6 | Reports metric-definition review (derived-only, periods labelled) for lead/application/counsellor dashboards | Metric spec + tests |
| 2.7 | MFA (TOTP) for SUPER_ADMIN/ADMIN/Finance per 1.1 decision | Auth tests |

**Exit condition:** core user journeys pass tests in staging (§18 Phase 2).

## Phase 3 — Documents and communications

| # | Stage | Exit evidence |
|---|---|---|
| 3.1 | **Malware-scan stage** in Document Center (fail-closed on scanner outage) + upload/download negative tests | §7 workflow E2E incl. rejection path |
| 3.2 | Download-authorization proof: authenticated download service tests or signed short-lived URLs | Cross-role access matrix tests |
| 3.3 | SMTP live verification (send/delivery/reply/bounce) with templates; retention/notify paths | Delivery logs |
| 3.4 | WhatsApp Business live connection + webhook verification + retry/dead-letter evidence; consent/opt-out + frequency caps | Provider sandbox evidence |
| 3.5 | Social publishing capability-honesty sweep (pattern from `be9081f`) across remaining social UIs | UI/API contract tests |

**Exit condition:** end-to-end workflows and failure handling verified (§18 Phase 3).

## Phase 4 — AI Command Center foundation

| # | Stage | Exit evidence |
|---|---|---|
| 4.1 | Registry consolidation per 1.1 (Awf* canonical; aliases; freeze others) + dashboard metrics derived-only review (R12) | One registry view; metric sources documented |
| 4.2 | Self-hosted runtime deployment (Ollama first, vLLM when GPU available) + model license register + router health-gating | `model-health` evidence; offline tests green |
| 4.3 | AI evaluation dataset + suite (§17 list: Bangla/English quality, structured output, injection, retrieval attribution, tool permissions, isolation, retry, approvals, exhaustion, rollback, reproducibility) | **Deliverable 15** report |
| 4.4 | Knowledge-layer query-time permission tests (cross-role/cross-tenant) | Isolation test suite |
| 4.5 | Pilot: 1 department (e.g. Education Research) completes representative tasks with sources + human approval | Pilot report |

**Exit condition (§18):** small pilot set completes representative tasks securely.

## Phase 5 — Scale to 100 departments / 2,000 agents

| # | Stage | Exit evidence |
|---|---|---|
| 5.1 | Import/validate real department+agent definitions (from `agents/agent_registry_1020.json` + owner catalogue), deduplicate, version, least-privilege grants | Registry audit diff |
| 5.2 | Controlled batch enablement (10 → 50 → 100 departments) with quality gates; auto-disable failures | Batch reports |
| 5.3 | Load-test queue + inference; measure throughput/latency/hardware | Capacity report (not entry counts) |
| 5.4 | Operational docs: self-hosted model deployment/ops guide | **Deliverable 14** |

**Exit condition:** demonstrated workload capacity and quality — explicitly not "2,000 rows exist".

## Phase 6 — Production readiness

| # | Stage | Exit evidence |
|---|---|---|
| 6.1 | Full regression + security checks (incl. dependency scan) on release candidate | CI + report |
| 6.2 | **Backup restore drill on prod-copy** + RTO/RPO documented | Restore record |
| 6.3 | **Email/domain preservation checklist:** DNS capture, SPF/DKIM/DMARC verify, single-SPF rule, MX untouched | Checklist signed |
| 6.4 | Deploy/rollback rehearsal on staging with `deploy/ubuntu/*` scripts | Rehearsal log |
| 6.5 | Final acceptance report (deliverable 20) with PASS/FAIL/PARTIAL/NOT VERIFIED/BLOCKED per feature | Report |
| 6.6 | **Explicit release authorization** → staged deploy → monitored rollout | Owner sign-off + health evidence |

**Exit condition:** recorded production approval and verified operational health.

---

## Standing rules for all phases

1. Each stage = one reviewable change-set with tests and an evidence file under `AUDIT/`.
2. Consequential actions (prod migration, deploy, DNS, mailbox, repo settings, data deletion) each require explicit owner approval at the moment of action — not blanket approval.
3. Failures are reported as FAIL with logs; nothing is claimed PASS without an executed command and dated output.
4. Reuse before rebuild: any new module must first cite the existing implementation it extends or replaces (§1).
5. This plan revises in place when evidence contradicts it; revisions are recorded in this folder.

**Immediate next step:** owner approval of Phase 1 scope (and the 1.1 decision list), after which work begins at stage 1.0.
