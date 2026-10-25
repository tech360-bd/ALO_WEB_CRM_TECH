# Provider matrix and third-party review

Two different questions are answered here:

1. **Which model providers can the gateway use, and under what conditions?**
2. **What happened to the third-party projects listed in the brief?**

## 1. Adapters

| Provider id | Wire protocol | Status | Data class allowed | Requires |
|---|---|---|---|---|
| `mock` | in-process | **implemented and exercised** | any (deterministic test output) | `AI_GATEWAY_ENABLE_MOCK=true` (default outside production) |
| `local` | OpenAI-compatible `/chat/completions` | **implemented, not pointed at a model** | PUBLIC → RESTRICTED | `LOCAL_MODEL_BASE_URL`, `LOCAL_MODEL_NAME` |
| `external` | OpenAI-compatible `/chat/completions` | **implemented, disabled by default** | PUBLIC, INTERNAL only | `AI_EXTERNAL_DATA_POLICY=approved` **and** `AI_PROVIDER_ALLOWLIST` contains `external` **and** per-app `allowExternal=true` |

No other provider shape is implemented. Adding an adapter is a code change with
its own review; configuration alone cannot add a provider.

### Why OpenAI-compatible

Groq, OpenRouter, ZAI/GLM gateways, vLLM, llama.cpp server, Ollama (`/v1`) and
most hosted APIs expose the same `/chat/completions` contract. One adapter
therefore covers local and external use without embedding a vendor SDK and its
transitive dependencies in the gateway.

## 2. Conditions for external use (all must hold)

1. The provider has a written data-processing agreement and retention terms.
2. `AI_EXTERNAL_DATA_POLICY=approved` on the host.
3. `AI_PROVIDER_ALLOWLIST` contains `external`.
4. The calling application entry in `AI_GATEWAY_APPS` sets `allowExternal: true`.
5. The request's effective data class is `PUBLIC` or `INTERNAL` — `CONFIDENTIAL`
   and `RESTRICTED` are refused regardless of configuration.
6. The model is in the application's `allowedModels`, if that list is set.

Any one condition missing ⇒ `403`, not a silent downgrade.

### Never permitted

* Unofficial or reverse-engineered proxies (the repository's provider catalogue
  lists some; they must never receive student, employee, financial or applicant
  data, and are not wired to the gateway).
* Keys found in public repositories or shared chat.
* Sending uploaded documents or full proposal drafts to an external model before
  the university/provider terms are approved.

## 3. Local inference feasibility — measured

| Resource | This sandbox | Consequence |
|---|---|---|
| CPU | 2 vCPU | CPU-only generation is slow (single-digit tokens/s for small models). |
| RAM | ~3.9 GiB total | A 7B model at 4-bit needs ~5–6 GiB before context. **Not viable.** |
| Disk | 21 GB, 15 GB free | Enough for a small quantised model (~1–2 GB). |
| GPU | none detected | No acceleration. |

Conclusion: local inference is **optional and not enabled**. A small quantised
model may be evaluated on the production host only after measuring memory,
latency, quality and licence terms. The gateway's local adapter exists so that
evaluation does not require code changes.

## 4. Third-party review (the projects named in the brief)

No repository from the list was cloned, installed or executed. Reviews are
therefore **configuration-level**, and every row is either "not adopted" or
"deferred pending a licence/security review".

| Candidate | Verified purpose (stated) | Decision | Reason |
|---|---|---|---|
| HetrixTools | external uptime monitoring and alerts | **Deferred** | Useful, but it is an external SaaS that would receive availability metadata and requires an account/credentials that are not configured. Local Prometheus + alert rules are implemented first. |
| MetaGPT | multi-agent orchestration framework | **Rejected for now** | Adds a large dependency surface and an agent runtime; the gateway must stay deterministic. Experiment in an isolated repo if needed. |
| docGPT-langchain | document Q&A demo | **Not adopted** | Demo architecture; our documents are private and require provenance, not a chat wrapper. |
| Refine.ink | external manuscript-review service | **Rejected** | Sending a PhD draft to a third party requires explicit author consent, a DPA and university-policy review. Not available or approved here. |
| UnoRouter | model routing/proxy | **Not adopted** | It is a third-party proxy; using it for confidential data would violate the no-untrusted-proxy rule. The existing in-repo reference to it is not extended. |
| LLM7 / GetGoAPI | "free" model APIs | **Rejected** | Provider identity, terms, retention and stability could not be verified from official documentation. Free-tier claims in the existing catalogue are explicitly marked unverified. |
| Qwen Coder | coding assistant | **Out of scope** | Development tooling, not a runtime component; cannot be a source of academic authority. |
| `claude-code-gpt-5-codex` | coding tooling | **Rejected** | Unofficial wrapper; would sit next to production secrets. |
| `freegpt-webui` | web UI for free APIs | **Rejected** | Unsupported/archived-style project; no licence or security review possible. |
| `zai-org/GLM-5` | model weights | **Deferred** | Would need a GPU/large-memory host; not feasible here. Evaluate size, licence and hardware on the target host. |
| Mat3ra | materials-science simulation | **Not applicable yet** | Only relevant to a specific engineering workflow; no current requirement. |
| LiveTalk | real-time video generation | **Rejected** | No product requirement; unclear licensing. |
| `gpt4o-image-prompts` | prompt collection | **Not adopted** | Content collection, not infrastructure; generated imagery is never research evidence. |
| Stack Overflow | developer reference | **Reference only** | Not an academic evidence source. |
| Enerpize | accounting/ERP SaaS | **Not applicable** | The CRM already has finance modules; replacing them is out of scope. |
| AiPraktor | messaging automation | **Rejected** | Automated outreach conflicts with the "no mass contact, explicit approval" rule. |
| Buffer | social publishing | **Not applicable** | Marketing scope; no shared-infrastructure need. |
| Mureka | promotional media | **Not adopted** | No requirement; cost. |
| Supercool / join.supercool.com / Astryx / tinystruct-smalltalk | identity unclear | **Rejected** | The products could not be identified with confidence from official sources; nothing is adopted on the basis of a URL alone. |

**Licence review status:** no third-party code was added, so no new licence
obligation exists. The gateway has zero runtime dependencies outside the Node
standard library — it does not even import the application's `node_modules`.

## 5. Cost model

No verified price table is available for any provider in this environment, so
the gateway **does not claim** to enforce `AI_MONTHLY_BUDGET_LIMIT` or
`AI_MAX_COST_PER_REQUEST`. Metrics expose token counts only; the Grafana panel
is labelled "not billed cost". Enforcing budgets requires a maintained price
table with an effective date, which is remaining work.
