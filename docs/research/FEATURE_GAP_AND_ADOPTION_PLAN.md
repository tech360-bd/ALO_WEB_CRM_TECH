# Feature Gap and Adoption Plan

**Generated:** 2026-10-18
**Scope:** which submitted repositories address gaps that were *verified to exist* in
`tech360-bd/ALO_WEB_CRM_TECH`, and which do not.

Companion files: [`GITHUB_SOURCE_CATALOG.csv`](./GITHUB_SOURCE_CATALOG.csv) (one row per
repository, with disposition and reason) and
[`GITHUB_LICENSE_MATRIX.md`](./GITHUB_LICENSE_MATRIX.md) (the licensing rules that constrain
adoption).

---

## 1. Method

A gap counts as *verified* only if it was observed in this repository's source during the Phase 1
audit — a file that exists, a route that is missing, a model that is empty. Gaps asserted by the
specification but not observed in code are marked **UNVERIFIED** and are not used to justify
adopting anything.

Evidence for the Phase 1 findings is in the seven audit documents at the repository root:
`CURRENT-STATE-AUDIT.md`, `INTEGRATION-MAP.md`, `DOCUMENT-STORAGE-ARCHITECTURE.md`,
`WHATSAPP-AUTOMATION-REPORT.md`, `SOCIAL-API-CONNECTIONS.md`, `AI-AGENT-INTEGRATION.md`,
`PRODUCTION-VERIFICATION.md`.

---

## 2. Verified gaps and what addresses them

| # | Gap | Evidence in this repo | Adopt | Disposition |
|---|---|---|---|---|
| G1 | **No local model runtime.** `src/lib/model-router.ts` routes to `local` only if `LOCAL_AI_URL`/`LOCAL_AI_MODEL` are set; nothing in the repo runs a model. | `src/lib/model-router.ts`, `src/lib/ai.ts` | `ollama/ollama` (MIT) as a sidecar; `ggml-org/llama.cpp` (MIT) for CPU inference | INTEGRATE |
| G2 | **No RAG / vector memory.** No embeddings, no vector store, no chunking anywhere in `src/`. | grep across `src/` returns no embedding or vector-store client | `huggingface/transformers`, `huggingface/datasets` (Apache-2.0) | REFERENCE → build in-house against existing `AiSop`/document models |
| G3 | **No model evaluation harness.** `AiModelEvaluation` exists as a Prisma model but no benchmark dataset is present. | `prisma/schema.prisma` `AiModelEvaluation`; no dataset under `prisma/` or `tests/` | `huggingface/datasets` | REFERENCE |
| G4 | **No LoRA / fine-tuning path.** | none present | `huggingface/peft`, `jingyaogong/minimind` | REFERENCE — only if CPU feasibility is measured first |
| G5 | **No first-party analytics.** Marketing routes exist but nothing measures delivery. | `src/app/api/marketing/*`, no analytics client | `umami-software/umami` (MIT, self-hosted) | INTEGRATE |
| G6 | **No proofreading / language checking** in the content pipeline. | `src/app/api/marketing/content/*` | `languagetool-org/languagetool` (LGPL-2.1) as a sidecar | INTEGRATE |
| G7 | **SEO is declared but not implemented.** Channel-registry entries exist with no server-side OAuth or audit. | `SOCIAL-API-CONNECTIONS.md` finding | `every-app/open-seo` (MIT) | ADAPT |
| G8 | **No public-URL layout analysis / crawler.** | none present | `firecrawl/web-agent` (MIT) | ADAPT |
| G9 | **No malware scanner deployed.** `src/lib/documents/malware-scan.ts` was added in Phase 1 and fails closed, but no clamd host is configured. | `PRODUCTION-VERIFICATION.md` blocker | none from this list — needs ClamAV provisioning | n/a |

Gaps G1–G4 are the ones the specification's sections 5 and 6 actually target, and they are all
real. G5–G8 are smaller and independently shippable.

---

## 3. Rejected for duplication — the largest category

This repository already contains **911 API route files, 413 page routes and 533 Prisma models**,
including a full CRM, WhatsApp Cloud integration, Facebook OAuth, private document storage, an
AI gateway with a provider catalog, and an agent registry (`AiAgent`, `AiAgentRegistry`,
`AiSkill`, `AiSop`, `AiEngine`, `AiCommandAction`, `AiTask`).

The specification's own rule is: *"If a feature already exists, repair or reuse it rather than
rebuilding it."* Applying it:

| Submitted | Why not adopted |
|---|---|
| `trycompai/crm`, `frappe/crm`, `idurar/idurar-erp-crm`, `Django-CRM/Django-CRM`, `melgarafael/DeskcommCRM`, `ChurchCRM/CRM`, `crmeb/CRMEB`, `fatfreecrm/fat_free_crm`, `twentyhq/twenty`, `oroinc/crm`, `oroinc/crm-application`, `Odoo-mobile/crm`, `dennisivy/crash-course-CRM` | Thirteen CRM frameworks. Adopting any of them means either a parallel CRM or a migration of 533 models. Both violate the reuse rule. **REFERENCE** for pipeline and UI patterns only. |
| `FoundationAgents/MetaGPT`, `ruvnet/ruflo`, `THU-MAIC/OpenMAIC`, `thu-ml/CRM` | Agent frameworks. ALO already has agent, skill, SOP and engine models plus an approval queue. Adopt the *patterns* — bounded tool calls, approval gating — not the code. **REFERENCE**. |
| `ToolJet/ToolJet` | Low-code app builder. ALO has a real Next.js frontend; embedding ToolJet creates a second app surface with its own auth. **REFERENCE**. |
| `nextcloud/server`, `siyuan-note/siyuan` | Full platforms, AGPL. ALO already has private file storage. **REFERENCE**. |
| `chatwoot/chatwoot` | Complete support inbox, and GitHub reports no license file. **REFERENCE**. |

**104 of 123 repositories land in REFERENCE.** That is the correct answer for a codebase this
complete, not a failure to evaluate them.

---

## 4. Already integrated — verified, not assumed

| Component | Where it is used | License posture |
|---|---|---|
| `NdoleStudio/httpsms` | httpSMS channel in the communications channel registry | AGPL-3.0 — isolated as an external service, no code copied. **Owner review of the AGPL posture recommended.** |
| `dani-garcia/vaultwarden` | `src/lib/vaultwarden-client.ts` | AGPL-3.0 — isolated as an external service. **Same review recommended.** |

Both were confirmed present during the Phase 1 audit rather than assumed from the specification.

---

## 5. Adoption sequence

Ordered so each step is independently shippable and testable, per the specification's "small,
tested pull requests" instruction.

| Step | Work | Depends on | Blocks |
|---|---|---|---|
| 1 | **Provider verification record.** Mark every free-tier claim in `src/lib/ai-providers/catalog.ts` as unverified until checked against official provider docs. | — | Trust in the catalog |
| 2 | **Ollama sidecar + gateway wiring.** `LOCAL_AI_URL` already exists; deploy Ollama, then benchmark Qwen 1.5B/3B per specification section 5. | Server access | G1, all local-first rules |
| 3 | **Model benchmarks.** `docs/research/MODEL_BENCHMARKS.md` with measured memory, first-token latency, Bangla/English quality, JSON reliability. | Step 2 | Model selection |
| 4 | **RAG pipeline** against the existing document models, with per-record source, owner and access level. | Step 2 | G2 |
| 5 | **Evaluation set** — 200 questions, held separate from any training data. | Step 4 | G3, any LoRA decision |
| 6 | **Usage and budget recording** per company, agent, model and provider. | Step 2 | Acceptance test 11 and 14 |
| 7 | Smaller integrations: umami, languagetool, open-seo, web-agent. | — | G5–G8 |

Steps 2–6 cannot start from this session — see the blockers in
[`../../FINAL_IMPLEMENTATION_REPORT.md`](../../FINAL_IMPLEMENTATION_REPORT.md).

---

## 6. Deliberate non-adoptions that need an owner decision

These are not refusals; they are decisions the owner should make explicitly.

1. **Two AGPL services are in production** (`httpsms`, `vaultwarden`). Running them as separate
   services is the standard mitigation, but the owner should confirm they are comfortable with the
   AGPL posture for a commercial SaaS.
2. **`remotion-dev/remotion` carries a custom commercial license**, not open source. Video
   rendering workflows would need it reviewed and possibly paid for. No paid dependency has been
   added, consistent with `NO_SURPRISE_PAYMENT=true`.
3. **Model weights have licenses separate from their code.** `zai-org/GLM-5`,
   `Tencent-Hunyuan/HunyuanVideo`, `zai-org/CogVideo` and `zai-org/GLM-5` weights were not
   inspected. Do not deploy weights before reading the model card.
4. **`GetGoAPI/Free-GPT-Grok-Gemini-Claude-API` was rejected.** It is a free proxy for paid
   models. If the owner disagrees, that is a deliberate reversal of `PAID_AI_API_ALLOWED=false`
   and needs to be recorded as such.
