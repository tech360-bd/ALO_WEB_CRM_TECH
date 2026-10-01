# Scheduler and worker functionality reconciliation

**BLOCKED for production operation.** None enabled, installed, invoked or certified. Canonical cron deliverable remains [CRON_RECONCILIATION.md](CRON_RECONCILIATION.md), with schedules, intended/current route mapping, locks and cadence. [WORKERS.md](production-reconciliation/2026-10-01/WORKERS.md) supplies implementation/trigger/idempotency/failure details per job.

| Surface | Implementation classification | Functional status | Evidence / unfinished gate |
|---|---|---|---|
| Worker SLA escalation | PARTIALLY IMPLEMENTED | DISABLED | DB path exists, hardcoded recipient fallback, non-atomic notification/outcome |
| Worker agent scheduling | PARTIALLY IMPLEMENTED | DISABLED | Creates AgentTask, not actual task execution; task/nextRunAt not atomic |
| Worker WhatsApp followups | PARTIALLY IMPLEMENTED | DISABLED | Creates counselor tasks, not verified WhatsApp sends; identity/idempotency defects |
| Worker sitemap/university verification | PLACEHOLDER | DISABLED | Counts/logs do not regenerate sitemap or verify sources |
| Worker session cleanup | PARTIALLY IMPLEMENTED | DISABLED | Optional delegate, no verified PortalSession cleanup |
| Remaining nine worker jobs | PLACEHOLDER | DISABLED | Logging/optional no-op, no verified durable business result |
| Shared worker lock | BROKEN | BLOCKED | Read/upsert race; optional nonexistent cronLock; DeploymentSequence lacks lease/owner/expiry; swallowed errors |
| `/api/cron/weekly-university-scan` | DISABLED | DISABLED | Prior quarantine: authenticated 503, no fabricated evidence |
| `/api/cron/weekly-ai-agent` | SIMULATED → DISABLED | DISABLED | This batch removes fake £14,500→£15,000 evidence creation; authenticated 503; regression tests |
| `/api/cron/weekly-university-update` | PARTIALLY IMPLEMENTED | PARTIAL | Counts needs_official_source rows; hardcoded changesFound=0 is not external scan proof |
| Other six HTTP cron routes | PARTIALLY IMPLEMENTED (inspection, not certification) | NOT VERIFIED | Separate from 15 worker definitions; auth exists, execution/concurrency/outcome unproved |
| `/api/automation/schedule` | PARTIALLY IMPLEMENTED | NOT VERIFIED | Separate runAllSchedulers entry; worker quarantine does not disable it |
| AgentOS/tool/workforce orchestration | PARTIALLY IMPLEMENTED | PARTIAL | Earlier lead-scoring-only path and tool gates tested with doubles; broad execution unsupported/unverified |
| Browser/in-process timers | PARTIALLY IMPLEMENTED | NOT VERIFIED | Restart, concurrent process, clock/lease and memory behavior untested |
| hPanel cron / external scheduler | Unknown runtime configuration | BLOCKED | No current entries, limits, environment visibility, logs or executable paths inspected |

Implementation labels describe source architecture; functional labels never imply production execution. Quarantine retains existing route/auth behavior while refusing false success; does not remove history. Existing external schedulers may still point at an old ZIP and require operator inspection.

Hostinger documentation uses UTC+0 for hPanel cron while declarations say Asia/Dhaka. Convert schedules explicitly after verifying account configuration. Before activation require real implementation, authorized trigger, atomic lease/claim, bounded retries/timeouts, idempotency, durable success/failure records, overlap tests, approved frequency/resources, backup and explicit deployment approval. A registered agent/model/task row is never execution proof.
