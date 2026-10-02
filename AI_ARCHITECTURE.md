# ALO Education — AI Architecture

> Describes the **actual** AI platform. Principles and controls follow
> `AI_AGENT_ARCHITECTURE.md` (agent classes, approval rules, scoped service
> identities). This document maps those principles to the implementation.

## 1. Design principle

AI is **not** one giant chatbot. It is a gateway + registry + runtime with
scoped tools, memory, approvals and audit. Provider selection is
**environment-driven**; API keys are never hardcoded.

## 2. Layer map

```
Callers (API routes, agents, cron)
   │
   ▼
src/lib/ai-gateway.ts          ALO AI GATEWAY
   • authoritative provider routing (adapters never silently change it)
   • JSON-schema validation (Ajv) BEFORE any prompt leaves the system
   • correlation ids, latency + usage capture, controlled fallback
   │
   ▼
src/lib/ai.ts                  Provider adapters
   • Groq, OpenRouter, ZAI/GLM, local (LOCAL_AI_URL/LOCAL_AI_MODEL)
   • one provider per request; private/local requests never transit cloud
   │
   ▼
src/lib/model-router.ts        Task-type routing + privacy policy
src/lib/department-model-config.ts   Department-level model policy
src/lib/groq-protection.ts     Provider-specific guard
   │
   ▼
Agent runtime
src/lib/agentos/ (agent-service, approval-transition)
src/lib/agent-orchestrator.ts
src/lib/agent-extension-registry.ts
src/lib/ai-tool-loop.ts        Tool calling loop with permission boundaries
src/lib/ai-action-executor.ts
```

## 3. Registries (Prisma models)

| Model | Purpose |
|---|---|
| `AiAgent`, `AiAgentRegistry` | Agent registry + versions/lineage (`AiAgentLineage`) |
| `AgentSkillExtension` | Skill registry |
| `AgentToolExtension` | Tool registry |
| `AgentRuntime` | Run records (latency, provider, model, usage, result) |
| `AgentApprovalQueue` | Human-approval gate for high-impact actions |
| `AgentMemory`, `AiStudentMemory` | Agent & per-student memory |
| `PromptTemplate` | Prompt registry |
| `AgentTask`/`agent-tasks` API | Workflow queue |
| `MarketingRagSource`/`MarketingRagChunk` | RAG corpus for marketing |

## 4. Business agents (implemented)

- **Data/Admissions:** `campus-course-mapper`, `international-course-agent`,
  `research-assistant`, `student-intake-agent`, `supervisor-matcher`
  (`src/lib/ai-agents/`), verification agent
  (`tests/unit/verification-agent.test.ts`).
- **Brains (domain intelligence):** `content-brain`, `marketing-brain`,
  `seo-brain`, `student-intelligence-brain`, `university-research-brain`
  (`src/lib/brains/`).
- **Marketing agents:** campaign/content/social jobs (`MarketingAgentJob`,
  `MarketingAgentMemory`), AI Marketing Director view.
- **Student assistant:** AI advisor, application assistant, SOP/CV studio.
- **WhatsApp AI:** intent classification + AI reply engine
  (`src/lib/ai-whatsapp-engine.ts`, `/api/whatsapp/ai-*`).

## 5. Memory & privacy

- Conversation, student, organization and long-term memory via `AgentMemory`
  families.
- Per-student memory is **student-scoped**: one student's data is never
  exposed to another (enforced in document/portal scope tests, e.g.
  `document-portal-student-scope.test.ts`).
- Private-data requests (`requiresLocalAI`) are hard-blocked from external
  providers; department configs with CONFIDENTIAL/RESTRICTED privacy force
  local inference.

## 6. RAG / knowledge

Sources: university/course data, English requirements, visa knowledge,
scholarships, ALO policies/SOPs, FAQs (`prisma/seed-knowledge.ts`,
`MarketingRagSource/Chunk`, knowledge APIs).
Pipeline: source → ingestion → normalization → chunking → retrieval →
provider response → **source citation / verification status** for
admissions- and visa-impact answers (source-verification lib + UI badges).

## 7. Guardrails & audit

- `src/lib/ai-safety.ts` — safety checks; `tool-permission-boundary`,
  `false-success-quarantine`, `cron-quarantine` tests pin the behavior.
- High-impact agent actions require approval (`AgentApprovalQueue`,
  approval-transition tests).
- Every AI run records agent, provider, model, latency, token usage and
  result status. Never logged: prompts containing secrets, full passport
  numbers, bank statements.

## 8. Environment

| Variable | Effect |
|---|---|
| `GROQ_API_KEY` | Enables Groq provider |
| `OPENROUTER_API_KEY` | Enables OpenRouter provider |
| `ZAI_API_KEY` | Enables ZAI/GLM provider |
| `LOCAL_AI_URL` / `LOCAL_AI_MODEL` | Local (Ollama-compatible) provider |
| `AI_GATEWAY_*` / department configs | Department model policy |

No provider configured → requests fail fast with a clear message; they never
silently route somewhere else.
