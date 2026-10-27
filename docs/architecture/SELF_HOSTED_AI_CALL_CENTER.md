# Target architecture — self-hosted AI call center on AgentOS

Status: **design for Phases 3–7.** Nothing in this document is implemented yet. It describes how the call center is added to the existing ALO AgentOS application without replacing it.

---

## 1. Design principles

1. **Extend, don't fork.** Reuse `src/lib/ai.ts`, `model-router`, `services/ai-gateway`, `ai-workforce/{memory,knowledge}`, the RBAC engine and the existing CRM tables.
2. **Separate the conversation engine from the transport.** Changing SIP provider must not touch CRM code; changing LLM must not touch telephony.
3. **Local by default, external by exception.** `PAID_AI_API_ALLOWED` stays the single switch; audio and transcripts never leave the host unless an operator sets it *and* marks the data classification below CONFIDENTIAL.
4. **Fail to a human, never to a fabrication.** Every failure path ends in a transfer, a callback promise, or an honest "I can't help with that".
5. **Evidence before claims.** No latency, accuracy or voice-quality statement ships without a measurement in `docs/testing/ACCEPTANCE_TEST_PLAN.md`.

---

## 2. Component layout

```
                     ┌──────────────────────────────────────────────┐
   PSTN/SIP trunk ───►  Asterisk or FreeSWITCH   (SIP 5060/5061)     │
                     │     IVR · queues · recordings · CDT         │
                     └───────────────┬──────────────────────────────┘
                          ARI / AMI / EAGI (private network only)
                                     │
                     ┌───────────────▼──────────────────────────────┐
                     │  call-orchestrator (new, Node/TS)            │
                     │  call state machine · turn detection ·        │
                     │  barge-in · transfer · idempotent events      │
                     └───┬────────────┬──────────────┬───────────────┘
                         │            │              │
                  ┌──────▼─────┐ ┌────▼─────┐ ┌──────▼──────┐
                  │ asr-service│ │ ai-gateway│ │ tts-service │
                  │ faster-    │ │ (exists)  │ │ (new)       │
                  │ whisper    │ │  │        │ │ piper/other │
                  └──────┬─────┘ │  ▼        │ └──────┬──────┘
                         │       │ ollama    │        │
                         │       │ (local LLM)│       │
                         │       └────┬──────┘        │
                         │            │               │
                     ┌───▼────────────▼───────────────▼─────┐
                     │ Redis (partials, events, locks)      │
                     │ MySQL (durable CRM/call records)     │
                     │ local object storage (recordings)    │
                     └───────────────┬──────────────────────┘
                                     │
                     ┌───────────────▼──────────────────────────────┐
                     │ existing Next.js app (3044)                   │
                     │ agent workspace · supervisor · CRM · admin    │
                     └──────────────────────────────────────────────┘
```

Every box except Redis/MySQL/object storage is loopback- or private-bridge-bound. Only 80/443 (and SIP/TLS if a trunk exists) is internet-facing.

---

## 3. The real-time path

```
caller audio ─► VAD (Silero) ─► streaming ASR (faster-whisper) ─► partial transcript
     │                                                                 │
     │                            language id (ASR confidence + script heuristic)
     │                                                                 ▼
     │                     authorized memory retrieval (Phase 5, scoped)
     │                                                                 ▼
     │                          local LLM via ai-gateway (route=local_only)
     │                                                                 ▼
     └──────────── barge-in cancels TTS ────── TTS (sentence-chunked) ─► audio out
```

Rules:

* **Sentence-level TTS streaming**: synthesise the first clause, not the whole answer.
* **Barge-in**: caller speech above VAD threshold for ≥ 200 ms cancels the current generation and playback; the cancelled turn is logged as `interrupted` (never as an error).
* **Bounded context**: max ~1,200 tokens of memory + ~1,500 tokens of knowledge; the rest is summarised, not dumped.
* **Turn budget**: if first audio has not started within the configured deadline, play a filler ("একটু অপেক্ষা করুন…") rather than silence.
* **No reasoning narrated**: the LLM is instructed to answer in ≤ 2 sentences per turn; internal reasoning is never spoken or logged to the caller channel.

Latency is measured **audio-in → first audio-out** and reported as p50/p90, per language and per concurrency level.

---

## 4. Call state machine (authoritative, persisted)

```
RINGING → ANSWERED → GREETING → (IVR_LANGUAGE) → AI_LISTENING ⇄ AI_THINKING → AI_SPEAKING
                                        │              │
                                        ├──────────────┴──► HUMAN_QUEUED → HUMAN_CONNECTED → WRAP_UP → ENDED
                                        └──► CALLBACK_PROMISED → ENDED
Any state → FAILED_AI (ASR/LLM/TTS/telephony error) → HUMAN_QUEUED  (or polite close + callback)
Any state → ENDED (caller hung up)
```

Transitions are written as append-only `CallEvent` rows (idempotent by `(callId, seq)`), so a worker restart can resume a call without duplicating consequences.

---

## 5. Data model additions (additive only — mapped onto existing tables)

| New / extended | Reuses | Purpose |
| --- | --- | --- |
| `CallSession` (new) | links to `PhoneCallRecord`/`CallLog` | transport ids (SIP Call-ID, channel id), direction, language, consent, AI disclosure, outcome |
| `CallEvent` (new, append-only) | — | state transitions, failures, transfers, barge-ins |
| `CallParticipant` (new) | `PhoneCallRecord` | caller / AI / human agent, join/leave times |
| `TranscriptSegment` (new) | `UccConversation`/`UccMessage` for chat | speaker, start/end ms, text, language, confidence, `isFinal` |
| `CallSummary` (new) | `AwfMemory` for durable memory | summary, action items, disposition, model+prompt version |
| `AgentQueue` / `AgentPresence` (new) | — | queues, wrap-up, availability |
| `MemoryRecord` (new) | extends `AwfMemory` conceptually | episodic / fact / operational with provenance + expiry + retention |
| `KnowledgeChunk.embedding` (nullable) | `AwfKnowledgeChunk` | optional semantic layer; lexical stays the fallback |
| Indexes on `CallLog(phone, createdAt)` | — | call-center query performance |

Constraints: no column drops, no type changes, no data migration in the same step as DDL, every new table has an explicit rollback block (existing convention).

---

## 6. Memory retrieval contract (Phase 5)

```
buildContext({ tenant, subject, actor, question }) →
  ├─ recent authorized conversations (recency-weighted, capped)
  ├─ open tickets / unresolved commitments
  ├─ verified customer facts (confirmed only; inferences flagged)
  ├─ approved knowledge chunks (role-filtered, cited)
  └─ active operational state (callbacks, in-flight workflows)
```
Each item carries `source`, `timestamp`, `confidence`, `classification`. The assembled context records the ids it used so a summary can be audited later. A scope object is mandatory; the query builder throws without it.

---

## 7. Telephony decision

| Option | Licence | Pros | Cons |
| --- | --- | --- | --- |
| **Asterisk** (recommended) | GPLv2 (+ commercial) | complete IVR/queue/CDT/recording; ARI for control | GPL: run as a separate process, never link; AMI/ARI must stay private |
| FreeSWITCH | MPL (verify) | embeddable, strong media handling | smaller talent pool, different ops model |

Either way: SIP TLS + SRTP for trunk traffic, fail2ban on registration attempts, no management interface on a public IP, recordings on an encrypted volume with retention enforcement.

**Cost reality:** internal SIP calls (softphone ↔ AI within the host) incur no carrier charge. Any PSTN number, DID or outbound minute is a telecom cost paid to a carrier. Do not describe the platform as free to operate.

---

## 8. Phase mapping

| Phase | Deliverable | Gate |
| --- | --- | --- |
| 2 | Green CI, drift guard fixed, environment doc regenerated, route-auth inventory | `npm test`, drift step, `audit:env --check` all green |
| 3 | Ollama provisioned, local inference proven, `/api/health/ai` | Acceptance §C |
| 4 | ASR/VAD/TTS services + measurement harness; Bangla evaluated first | Acceptance §D |
| 5 | Memory + knowledge extension, retention, erasure | Acceptance §E |
| 6 | Telephony, queues, hand-off, barge-in | Acceptance §F |
| 7 | CRM linkage: every call → contact, outcome, task, timeline | Acceptance §F.9 |
| 8 | Consent, audit, secrets, backup/restore, monitoring | §9 checklist |
| 9 | Controlled pilot, test accounts only | operator sign-off |

---

## 9. Non-goals (explicit)

* Replacing the Next.js application or its design system.
* Re-hosting CRM data in another platform.
* Cloud AI as a mandatory dependency.
* Dialect-level Arabic or guaranteed Dhaka-accent TTS before measurement.
* Multi-region HA; the pilot is single-node with a documented restore path.
