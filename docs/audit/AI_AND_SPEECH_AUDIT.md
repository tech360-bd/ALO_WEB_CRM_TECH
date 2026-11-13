# AI & speech audit — ALO AgentOS

Read-only, 2026-10-27, commit `e74d145e`.

---

## 1. What exists (and is genuinely good)

| Capability | Implementation | Evidence |
| --- | --- | --- |
| Provider abstraction, OpenAI-compatible | `src/lib/ai.ts` (`groq`, `openrouter`, `zai`, `local`) + 66-entry provider catalogue | unit tests pass |
| Local-first routing | `routeModel()` prefers `local` whenever `LOCAL_AI_URL`/`LOCAL_AI_MODEL` are set; private-data tasks are *forced* local | `src/lib/model-router.ts:31-42` |
| Hard cloud gate | `PAID_AI_API_ALLOWED === 'true'` required; typed error otherwise | `src/lib/ai-providers/resolve.ts:36-43` |
| Central gateway service | `services/ai-gateway/gateway.mjs` (~900 lines): token-hashed app registry, data classification, `local_only` route, circuit breaker, bounded retries, metrics listener, graceful shutdown | `docs/ai-gateway/*`, `tests/unit/ai-gateway/` |
| Permission-aware memory | `AwfMemory` with scopes SHORT_TERM / LONG_TERM / COMPANY / DEPARTMENT / USER, confidentiality ceiling, approval flag, expiry | `src/lib/ai-workforce/memory.ts` |
| Knowledge retrieval with citations | deterministic BM25-style lexical scoring over `AwfKnowledgeChunk.termIndex`; per-chunk `citation`; role filtering before content release | `src/lib/ai-workforce/knowledge.ts` |
| Agent runtime, approvals, audit, telemetry | `src/lib/ai-workforce/*` (25 modules) | 6 test files pass |
| Model registry with evaluation gate | `src/lib/ai-models/registry.ts` — a version is promotable only with a passing evaluation | `tests/unit/ai-model-registry.test.ts` passes |

**Assessment:** the *governance* half of a self-hosted AI platform already exists and is better than most commercial CRM codebases. The *runtime* half — actual local model serving and any speech — does not.

---

## 2. What is missing

| Capability | Status | Note |
| --- | --- | --- |
| Local LLM runtime | **not provisioned** | `LOCAL_AI_URL` / `LOCAL_AI_MODEL` are hooks. No Ollama/vLLM install, no model manifest, no pull script, no health probe, no latency measurement |
| Embeddings / vector store | **absent** | retrieval is lexical only; no embedding model, no `pgvector`/Qdrant, no `vector` column |
| ASR | **absent** (a mock exists — §3) | no faster-whisper/whisper.cpp/Vosk integration |
| TTS | **absent** | no engine, no voice catalogue, no licensing record |
| VAD / endpointing | **absent** | no silence detection, no turn detection |
| Streaming audio | **absent** | no WebSocket audio path, no jitter buffer, no barge-in |
| Language identification | **absent** | |
| Telephony | **absent** | see `PHASE1_AUDIT_REPORT_2026-10-27.md` F2 |
| Hindi/Arabic UI + prompts | **absent** | `src/i18n/dictionaries.ts` declares `Locale = 'en' \| 'bn'` only |
| Model health in readiness | **absent** | `/api/health` probes DB + 6 tables, nothing AI |
| AI Workforce acceptance gates in CI | **absent** | `npm run awf:*` is never invoked by `.github/workflows/ci.yml` |

---

## 3. Finding: a mock presented as ASR (Severity: High)

`src/lib/video-engine/captioning/videocaptioner.ts:236-249`

```ts
export async function transcribeWithWhisperLocal(audioPath: string, modelPath?: string) {
  // Would use whisper.cpp or openai-whisper Python
  // For now mock
  return { text: "Mock transcription from local Whisper", segments: [ … ] };
}
```

* It is currently **unreferenced** (only its own definition matches `grep`), so it does not leak fabricated transcripts to users today.
* It is exported from `src/lib/video-engine`, whose caption route is live (`POST /api/video-engine/caption`) and whose config advertises `captioning.whisperLocal.enabled` and `WHISPER_MODEL`.
* It violates the programme rule "do not claim a feature works because a component exists". A future engineer wiring `useWhisperLocal: true` would ship invented text.

**Correction (Phase 4):** delete the function or replace it with a real client that calls a local ASR service and throws `ASR_UNAVAILABLE` when the service is down. Add a test asserting that no source file returns the word "Mock transcription".

Same class of finding in the UI: `src/components/alo/views/phone-call-center.tsx` hard-codes `"counselor-demo"` and renders a simulated incoming-call banner. Mock call activity must be visibly labelled as demo data (the brief forbids presenting fake call activity as operational).

---

## 4. Component evaluation (licences verified against the repositories on 2026-10-27)

Licences below were read from the GitHub API (`license.spdx_id`, `archived`, `pushed_at`) — not assumed. **Model weights can carry different licences than the code**; every weight file must be verified separately at the pinned revision before adoption.

| Component | Role | Declared licence | Maintenance | Notes / risks |
| --- | --- | --- | --- | --- |
| `ollama/ollama` | local LLM runtime (OpenAI-compatible `/v1`) | MIT | active (pushed 2026-10-27) | simplest self-host path; already the shape `LOCAL_AI_URL` expects |
| `SYSTRAN/faster-whisper` | streaming ASR (CTranslate2) | MIT | active (2026-10-25) | fastest CPU path; multilingual incl. `bn`, `hi`, `ar` |
| `ggml-org/whisper.cpp` | ASR alternative, no Python | MIT | active (2026-10-19) | good for edge/CPU-only; quantised ggml weights |
| `m-bain/whisperX` | ASR + diarisation + alignment | BSD-2-Clause | active (2026-10-22) | diarisation pipeline needs pyannote weights (**gated licence — verify before use**) |
| `alphacep/vosk-api` | lightweight streaming ASR | Apache-2.0 | active (2026-10-15) | small models; lower accuracy than Whisper; has `bn`/`hi` community models |
| `snakers4/silero-vad` | VAD / end-of-turn | MIT | active (2026-10-22) | ONNX, CPU-only, very fast — the pragmatic default for barge-in |
| `rhasspy/piper` | TTS (classic) | MIT | **archived** 2025-08-26 | superseded → see next row |
| `OHF-Voice/piper1-gpl` | TTS (current Piper) | **GPL-3.0** | active (2026-10-25) | GPL-3.0: acceptable only as an isolated service invoked over the network, never linked into the app. Legal review required before commercial shipping |
| `coqui-ai/TTS` | TTS research stack | MPL-2.0 (code) | **dormant** since 2024-08-16 | XTTS v2 **weights are CPML (non-commercial)** — do not ship |
| `AI4Bharat/Indic-TTS` | Indic TTS (bn/hi) | MIT (code) | dormant 2024-11-08 | check the per-model licence on the model card; strong Indic coverage |
| `espnet/espnet` | TTS/ASR toolkit (incl. Bangla recipes) | Apache-2.0 | active (2026-10-26) | research-grade; heavier integration |
| `livekit/livekit` | WebRTC audio transport | Apache-2.0 | active (2026-10-27) | clean answer to "browser/supervisor audio"; SIP bridge is a separate component |
| `qdrant/qdrant` | vector store | Apache-2.0 | active (2026-10-26) | optional; the existing lexical index may suffice at pilot scale |
| `asterisk/asterisk` | SIP/IVR/queues | **GPLv2** (+ commercial alternative) | active (2026-10-26) | run as a separate process; do not link. Full IVR/queue feature set |
| `signalwire/freeswitch` | SIP/IVR/queues | MPL (per upstream `LICENSE`; GitHub reports NOASSERTION) | active (2026-10-26) | more permissive for embedding; steeper ops |

**Known licence landmines to avoid:** XTTS/Coqui CPML weights (non-commercial), `facebook/mms-tts-*` (widely published as CC-BY-NC — must be verified, not assumed usable), pyannote diarisation weights (gated).

**Recommended defaults (subject to Phase 4 measurement):** Ollama + faster-whisper (or whisper.cpp on CPU-only hosts) + Silero VAD + an MIT/Apache TTS path, with Piper kept as an isolated, GPL-quarantined option. Asterisk preferred for feature completeness, FreeSWITCH if embedding-friendliness dominates.

---

## 5. Language readiness

| Language | UI strings | Prompt/answer language | ASR candidate | TTS candidate | Verdict |
| --- | --- | --- | --- | --- | --- |
| Bangla `bn-BD` | ✅ (`bn` dictionary) | not implemented | Whisper `large-v3` (bn is supported but under-represented), Vosk `bn` | Indic-TTS / ESPnet Bangla models / Piper bn voice if a BD voice exists | **Unproven.** Primary priority; must be measured first |
| English `en` | ✅ | not implemented | Whisper large-v3 (excellent) | many permissive options | Likely acceptable |
| Hindi `hi-IN` | ❌ | not implemented | Whisper (good) | Indic-TTS, ESPnet | Likely acceptable |
| Arabic `ar` (MSA) | ❌ | not implemented | Whisper (good for MSA) | fewer permissive natural options | Needs evaluation; dialect support out of scope |

**Bangla-specific risks (state plainly):**

1. Whisper's Bengali is trained mostly on Indian Bengali sources; Bangladeshi phonology, names, places and code-switched Bangla-English are weaker. No evidence in this repository contradicts that, and none is available to confirm quality either.
2. Public bangla TTS models are disproportionately West Bengali or Indic-language read speech. A **Dhaka-accent, conversational** voice may not exist as an open model with a commercial licence.
3. Therefore: **do not promise natural Bangladeshi Bangla speech until Phase 4 measurements exist.** If the measured result is poor, the honest options are (a) a smaller set of vetted phrases recorded by a consented human voice actor and played back (a "voice pack"), (b) a licensed self-hosted model, or (c) human-agent first with AI assistance. All three are configurable; none requires a paid AI API.

No accuracy score, WER, MOS or latency figure in this document is invented — every number must come from `docs/testing/ACCEPTANCE_TEST_PLAN.md` §D.

---

## 6. Resource expectations to be measured (not claimed)

| Component | Model size class | CPU feasibility | Notes |
| --- | --- | --- | --- |
| LLM (7–8B, 4-bit) | 4–5 GB RAM | ~5–15 tok/s on 8 vCPU; usable for short answers, marginal for barge-in | GPU strongly preferred for ≤800 ms first-token |
| LLM (3–4B, 4-bit) | 2–3 GB | faster | may be the realistic pilot default |
| faster-whisper `small`/`medium` int8 | 0.5–1.5 GB | near real-time on 8 vCPU with chunked streaming | `large-v3` needs GPU for real-time |
| Silero VAD | <50 MB | negligible | always CPU |
| TTS (neural, CPU) | 100–500 MB | often slower than real-time on CPU depending on engine | GPU or a voice-pack fallback for Bangla |

Concurrency must be measured per component; audio-to-audio latency is the only metric that matters for the product (`docs/testing/ACCEPTANCE_TEST_PLAN.md` §D.4).

---

## 7. Local-only policy — current vs required

| Requirement | Current | Required |
| --- | --- | --- |
| Disable all external AI providers | ✅ `PAID_AI_API_ALLOWED` default deny | keep |
| Prevent accidental fallback | ✅ typed errors, no silent switch | keep |
| Report degraded state | ⚠️ app-level only; no model health probe | add `/api/health/ai` with per-service state |
| Bounded retries | ✅ gateway circuit breaker | extend to ASR/TTS |
| Human hand-off when AI unavailable | ❌ | implement in Phase 6 |
| Never send audio/transcripts externally | ⚠️ no audio path exists yet | enforce in the audio gateway config, with a test |
| Offline operation after download | ❌ unproven | prove with the network interface down in Phase 4 |

**Cost honesty:** self-hosting removes *AI API* fees, not costs. Electricity, hardware depreciation, SIP trunk minutes for PSTN calls, and operator time remain. Internal SIP calls between softphones on the same host cost no carrier fee.

---

## 8. Phase-4 entry criteria (what must be true before speech work starts)

1. A local LLM answers a real prompt through the app with no API key and no outbound network (`docs/testing/ACCEPTANCE_TEST_PLAN.md` §C).
2. Model/ASR/TTS health is visible in readiness and degrades safely.
3. The mock ASR function is gone and a test prevents its return.
4. A consented Bangla/English/Hindi/Arabic test corpus exists with human-reviewed transcripts (§D.2).
5. Licence decisions recorded per component **and per weight file**, with the chosen licence written into the deployment doc.
