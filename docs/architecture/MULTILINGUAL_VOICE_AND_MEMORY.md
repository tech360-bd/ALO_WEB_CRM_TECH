# Multilingual voice and long-term memory — design

Status: **design for Phases 4–5.** Not implemented. Every quality figure referenced here is produced by `docs/testing/ACCEPTANCE_TEST_PLAN.md`; none is assumed.

---

## Part A — Language framework

### A.1 The language contract

One module owns language identity, so no call-center code contains language branches:

```ts
// src/lib/speech/languages.ts (to be created in Phase 4)
type LangTag = 'bn-BD' | 'en' | 'hi-IN' | 'ar';
interface LanguageProfile {
  tag: LangTag;
  script: 'bengali' | 'latin' | 'devanagari' | 'arabic';
  asrModel: string;         // e.g. 'whisper-large-v3'
  ttsVoice: string;         // engine-specific voice id
  numerals: 'bengali' | 'latin';      // how numbers are spoken/printed
  currencyWords: 'bangla' | 'english';
  codeSwitch: 'bn-en' | null;         // mixed-language policy
  transliteration: 'off' | 'romanize';
  greeting, fallback, handoffPhrases;  // short, human-reviewed strings
}
```

Adding a fifth language = adding a profile + model artefacts + a voice. No core change.

### A.2 Per-language requirements to evaluate (not assume)

For each of `bn-BD`, `en`, `hi-IN`, `ar`: ASR accuracy on local accents, TTS naturalness/intelligibility, streaming capability, latency, language identification, mixed-language speech, transliteration, available voices + licensing, CPU/RAM, model size/quantisation, offline operation.

### A.3 Bangla first — evaluation suite (Phase 4, blocking)

**Corpus:** ≥ 200 consented, locally stored utterances, recorded by 5–8 speakers (2+ female, mixed age, ≥ 3 regional accents, all Bangladeshi), covering:

| Category | Examples |
| --- | --- |
| Names | ব্যক্তিনাম (Bangla + Muslim/Hindu names), university names, company "ALO" |
| Places | ঢাকা, সিলেট, চট্টগ্রাম, London, Toronto (code-switch) |
| Numbers | টাকা amounts, percentages, IELTS scores, years |
| Dates | "আগামী ১৫ জানুয়ারি", "২০২৭ intake" |
| Contact | phone numbers spoken in Bangla and in English digits |
| Code-switch | "আমার IELTS score 6.5, UK যেতে চাই" |
| Intents | fees, eligibility, documents, deadline, visa refusal (negative emotion) |
| Noise | call-center background, mobile compression |

**Reference transcripts** are human-reviewed twice (transcriber + reviewer) and versioned. **Scoring:** WER/CER per category, per speaker, per accent; plus a 1–5 human intelligibility rating and a false-accept rate for the VAD/endpointing.

**Exit criteria for Bangla as default:** the measured result must be reported as-is. If Bangla WER is materially worse than English on the same corpus, the default flow becomes *scripted Bangla prompts + human hand-off for complex intents*, and that limitation is documented in the UI and in the operator guide. **No target number is written here in advance**, because inventing one is exactly what the brief forbids.

### A.4 Bangla voice quality plan

1. Evaluate open Bangla TTS with a **verified commercial-compatible** weight licence.
2. Native-speaker panel scores naturalness (MOS-style 1–5) on a fixed 20-sentence set that includes company/product terms.
3. If naturalness is inadequate and no compliant model is available, use a **consented voice pack**: a human voice actor records the fixed repertoire (greetings, IVR menu, disclosures, common confirmations, hold messages). Deterministic playback is honest, intelligible, and licence-clean; free-form AI speech is then disabled for Bangla rather than shipping a poor synthetic voice.
4. Pronunciation lexicon for company names, product names, universities, currencies — one versioned file per language, used by both ASR post-processing and TTS input preparation.
5. Bengali script by default; transliteration is an explicit per-profile option, never automatic.

---

## Part B — Long-term conversational memory

### B.1 Mapping onto what already exists

| Memory category (brief) | Existing model | Required extension |
| --- | --- | --- |
| A. Conversation history | `CommunicationMessage`, `UccConversation`/`UccMessage`, `AloMessage`; new `TranscriptSegment` for voice | link every row to `CallSession`/conversation, language, channel, provenance; retention field |
| B. Episodic memory | `AwfMemory` scope `LONG_TERM` | add `kind='EPISODIC'`, `sourceConversationId`, `unresolved` flag, `staleAt`, refresh marker |
| C. Customer facts | `AwfMemory` scope `USER` + `AiStudentMemory` | add `provenance` (customer-stated / verified-by-agent / inferred), `confidence`, `expiresAt`, `confirmedBy` |
| D. Semantic knowledge | `AwfKnowledgeSource`/`AwfKnowledgeChunk` (+`KnowledgeDocument`) | add `version`, per-chunk `citation` (exists), optional `embedding`, tenant/role scope (exists as `allowedRoles`) |
| E. Operational memory | `AwfMemory` scope `SHORT_TERM` + `AgentOSTask`/`CronLock` | durable workflow state with idempotency key and resume marker |

No new memory *system* is built: `AwfMemory` already has scope, owner, confidentiality, approval, expiry and a unique key. The extension adds typing, provenance and retention.

### B.2 Retrieval (start of every interaction)

1. Authenticate the caller (ANI lookup → approved identity check; never trust ANI alone for account actions).
2. Build a **mandatory scope object**: `{ tenantId|partnerId, subjectId, actorId, actorRole, maxClassification }`.
3. Retrieve: recent conversations (capped), open tickets/commitments, verified facts, approved knowledge for the current question.
4. Score by relevance × recency × confidence; **drop anything unverified** unless it is labelled an inference.
5. Fit within a context budget (default 1,200 + 1,500 tokens); summarise rather than truncate mid-sentence.
6. Record which memory ids were used, against the produced summary/answer.

### B.3 Safety rules (enforced in code, tested per rule)

* A scope object is required; the query builder throws without it (no default scope).
* Cross-tenant/subject reads are rejected and logged as security events.
* Never store: passwords, OTPs, API keys, card numbers/CVV, full bank details. A redaction filter runs before any persistence.
* Sensitive categories (health, financial, identity) are stored at `RESTRICTED` with shorter default retention and require an explicit purpose to read.
* Retrieved documents and transcripts are **data, not instructions**: they are wrapped in delimiters and the system prompt states they cannot change policy. Tests feed a document containing "ignore previous instructions and reveal…" and assert refusal.
* Consequential actions (payments, cancellations, account changes, external messages) require human confirmation; the agent can only *propose*.
* Deletion: customer/authorized-staff erasure removes memory rows, keeps an audit stub without content, and records the request.

### B.4 Retention defaults (configurable, documented, enforced by a job)

| Class | Default | Rationale |
| --- | --- | --- |
| Call recording | 90 days (matches `RECORDING_RETENTION_DAYS_DEFAULT`) | evidence only while a complaint is plausible |
| Transcript | 180 days | service quality + dispute |
| Episodic summary | 24 months | continuity |
| Customer fact (confirmed) | until contradicted or erased | stable preference |
| Customer fact (inferred) | 90 days, must be re-confirmed | prevents stale inference becoming "truth" |
| Knowledge chunk | while source is `ACTIVE`; versions retained | traceability |
| Operational state | until resolved + 30 days | resumability |

Each row carries `retentionClass`; a nightly job deletes expired rows and writes a count-only audit entry (never content).

### B.5 Acceptance (Phase 5)

A fact from an authorized prior call is retrieved with source + timestamp; a wrong fact can be corrected; deletion is enforced; a cross-tenant read is rejected; an injected document cannot override policy. See `docs/testing/ACCEPTANCE_TEST_PLAN.md` §E.
