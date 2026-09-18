# AI Agent Inventory

> Mandate §42. Generated 2026-09-18 from `AI_AGENT_INVENTORY.csv`, `src/lib/ai-agents/`,
> `src/lib/agentos/`, and `src/app/api/agentos/`. **These are ALO Education's own
> real agents — not generic chatbot cards (§41).**

## Agent runtime (the execution layer)

| Component | File | Role |
|---|---|---|
| Orchestrator | `src/lib/agent-orchestrator.ts` | `runOrchestrated()` — enforces `isGlobalAiPaused`, maxSteps/maxRuntime/maxToolCalls/tokenBudget, approvalPolicy (STRICT/STANDARD), idempotency, audit |
| Agent service | `src/lib/agentos/agent-service.ts` | `getOrCreateRuntime`, `createTask`, `processApproval`, `getAgentMemory`/`writeAgentMemory`, `logAgentAction` |
| Extension registry | `src/lib/agent-extension-registry.ts` | tool/skill registry |
| AgentOS API | `src/app/api/agentos/*` (11 routes) | agents, approvals, capacity-test, dashboard, departments, engines, rollout, schedules, skills, tasks, tools |

> The orchestrator writes `automationEvent` + `agentTask` records and queues
> approval-required actions (`WAITING_APPROVAL`) rather than auto-executing —
> this is the §45/§46 human-approval + kill-switch behaviour.

## Registered agents (from AI_AGENT_INVENTORY.csv)

| ID | Name | Target area | Permission scope | Default mode |
|---|---|---|---|---|
| `alo_cmd_orchestrator` | Super Admin AI Command Center | Platform Governance | COMPANY | READ_ONLY / APPROVAL_REQUIRED |
| `alo_reply_assistant` | UCC AI Reply Assistant | Omnichannel Messaging | ASSIGNED | SAFE_ACTION (Human Review) |
| `alo_ocr_agent` | Document Intelligence Agent | OCR & Autofill | ASSIGNED | APPROVAL_REQUIRED (High-Risk) |
| `alo_office_hours_agent` | After-Hours Qualification Agent | Lead Qualification | ALL | SAFE_ACTION |
| `alo_international_course_advisor` | International Course Advisor | Course Discovery & Research | ASSIGNED | SAFE_ACTION |
| `alo_campus_mapper` | Campus-Course Mapper | Campus & Course Linkage | ASSIGNED | READ_ONLY |
| `alo_supervisor_matcher` | MRes/PhD Supervisor Matcher | Research Supervisor ID | ASSIGNED | SAFE_ACTION |
| `alo_research_assistant` | Research Coursework & Paper Assistant | MRes/PhD Research | ASSIGNED | SAFE_ACTION |

## Concrete agent implementations (`src/lib/ai-agents/`)

| File | Lines | Substance | Status |
|---|---|---|---|
| `social-media-agent.ts` | 551 | substantial execution logic | CODE_COMPLETE |
| `student-intake-agent.ts` | 278 | substantial execution logic | CODE_COMPLETE |
| `international-course-agent.ts` | 71 | moderate | CODE_COMPLETE |
| `supervisor-matcher.ts` | 28 | thin | IMPLEMENTED_BUT_UNVERIFIED |
| `research-assistant.ts` | 13 | **stub** | IMPLEMENTED_BUT_UNVERIFIED |
| `campus-course-mapper.ts` | 10 | **stub** (no exec logic) | IMPLEMENTED_BUT_UNVERIFIED |

> **Honest finding (§43/§98):** three registered agents (`alo_campus_mapper`,
> `alo_supervisor_matcher`, `alo_research_assistant`) have only thin/stub
> implementations. They are registered and routable but their execution logic is
> minimal. They are **NOT** marked VERIFIED. See `AI-AGENT-VERIFICATION.md`.

## Agent security (§46)
- Global kill switch: `isGlobalAiPaused` checked by the orchestrator.
- Budget guards: maxSteps / maxRuntime / maxToolCalls / tokenBudget.
- Approval policy: STRICT/STANDARD; high-risk actions queue for human approval.
- Permission scope per agent: COMPANY / ALL / ASSIGNED.
- Every action logged via `logAgentAction` + `automationEvent`.

## Verification status
**No agent is `LIVE_VERIFIED`.** Execution requires model credentials + a database;
this sandbox has neither configured for live runs. The runtime is `CODE_COMPLETE`;
per-agent execution is `IMPLEMENTED_BUT_UNVERIFIED` pending the §43 execution test.
