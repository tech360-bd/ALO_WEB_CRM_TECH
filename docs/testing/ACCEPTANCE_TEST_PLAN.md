# Acceptance test plan — AgentOS self-hosted AI call center

Every criterion is **executable** and has a binary pass condition. Nothing here is satisfied by a file existing. Status column reflects reality on 2026-10-27.

---

## A. Code quality

| ID | Criterion | Command / method | Pass condition | Status |
| --- | --- | --- | --- | --- |
| A1 | TypeScript passes | `npm run typecheck` | exit 0 | **Blocked** (Prisma engines unavailable in sandbox; green in CI) |
| A2 | Lint passes | `npm run lint` | exit 0 | Not run (needs generated client for some rules) |
| A3 | Unit + integration tests pass | `npm test` | 0 failed files | **FAIL** — 2 real files + 18 environment files (§A3a) |
| A4 | Production build passes | `npm run build` | exit 0, `.next/standalone/server.js` exists | **Blocked** here; green in CI |
| A5 | Dependency position documented | `npm audit --omit=dev` | 0 high, 0 critical; moderates triaged | **PASS** (4 moderate) |
| A6 | CI failure fixed with a regression test | drift-guard fix has fixtures | new fixture fails before the fix, passes after | **Open** |
| A7 | Drift guard proves migrations reproduce the schema | `prisma migrate diff … \| filter-lob-default-drift.mjs` | `0 real drift` | **FAIL** (6 false positives) |
| A8 | Environment classification current | `npm run audit:env -- --check` | exit 0 | **FAIL** (stale file) |
| A9 | AI Workforce acceptance gates run in CI | `npm run awf:mirror && awf:verify && awf:audit` | exit 0, mirror byte-identical | **Open** (not wired) |

**A3a** real failures: `tests/unit/design-tokens.test.ts` (`text-[10px]` ×6 files, `text-slate-500` ×2 files) and `tests/unit/brand-chrome-partner-footer.test.ts` (third `<footer>` in `src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx`).

---

## B. Database

| ID | Criterion | Method | Pass condition | Status |
| --- | --- | --- | --- | --- |
| B1 | Schema generation uses the intended provider | `prisma validate` + `prisma generate` with MySQL `DATABASE_URL` | client generates from `provider = "mysql"`, zero warnings about adapters | Blocked here; green in CI |
| B2 | Migrations tested against a disposable DB | CI `mysql-integration` job | `migrate deploy` on empty DB, then `migrate status` clean | **PASS** in CI |
| B3 | Migrations reproduce `schema.prisma` | drift step | `0 real drift` | **FAIL** (§A7) |
| B4 | Foreign keys and uniqueness behave | integration tests on disposable DB | unique violation and FK violation both raise the expected errors | Partial (CI) |
| B5 | Tenant isolation | negative tests per scope object | cross-tenant read throws `MEMORY_SCOPE_REQUIRED`/`FORBIDDEN` | **Open** (Phase 5) |
| B6 | Backup restore verified | `docs/operations/BACKUP_AND_RESTORE.md` §4 | 9/9 steps pass on an isolated host | **Never performed** |
| B7 | Existing records intact across migration | row-count parity before/after | identical counts on a fixed table list | **Open** |
| B8 | SQLite verification mirror matches schema | `npm run awf:mirror` + `git diff --exit-code` | no diff | **PASS** (verified in audit) |

---

## C. Local AI

| ID | Criterion | Method | Pass condition | Status |
| --- | --- | --- | --- | --- |
| C1 | Real inference through the app, local model | `POST /api/ai/chat` (or the owner-chat route) with `LOCAL_AI_URL` set and **no** cloud keys | non-empty completion, `provider: "local"` in telemetry | **Open** |
| C2 | No paid API key required | run C1 with all `*_API_KEY` unset, `PAID_AI_API_ALLOWED` unset | succeeds | **Open** |
| C3 | No silent external fallback | unit test: cloud slug requested while `PAID_AI_API_ALLOWED` unset | throws `ProviderConfigurationError` | **PASS** (`tests/unit/ai-provider-policy.test.ts`) |
| C4 | Gateway denies `local_only` escalation | `tests/unit/ai-gateway/` | 403 `LOCAL_ONLY_UNAVAILABLE` | **PASS** |
| C5 | Model unavailability → safe degraded state | stop Ollama, call the app | explicit `MODEL_UNAVAILABLE`, HTTP 503, no fabrication, human hand-off offered | **Open** |
| C6 | Offline operation | block egress, restart stack | C1 still passes | **Open** |
| C7 | Health surface | `GET /api/health/ai` | per-service state + last successful latency | **Open** |

---

## D. Multilingual speech (Bangla first)

| ID | Criterion | Method | Pass condition | Status |
| --- | --- | --- | --- | --- |
| D1 | Consented local corpus exists | review of `fixtures/speech/` + consent records | ≥ 200 utterances, 5–8 speakers, 4 languages, no cloud-hosted audio | **Open** |
| D2 | ASR scored against human-reviewed transcripts | harness computes WER/CER per language and category | numbers reported per category; **no invented targets** — the report states the measured value and the decision it supports | **Open** |
| D3 | Bangla-specific categories | names, places, numbers, dates, phone digits, code-switch | each category reported separately | **Open** |
| D4 | TTS naturalness reviewed by native speakers | fixed 20-sentence set, 1–5 scale, ≥ 3 raters per language | mean + spread reported; company/product terms pronounced correctly | **Open** |
| D5 | Language switching mid-call | scripted scenario: bn → en → bn | transcript language labels correct; no crash; answer language follows caller | **Open** |
| D6 | Code-switched Bangla-English | 20 scripted utterances | measured, documented acceptance or documented limitation | **Open** |
| D7 | Numbers/dates/money spoken correctly | per language, 10 cases each | human-verified audio and text | **Open** |
| D8 | Audio-to-audio latency | instrumented timer: caller stops speaking → first TTS audio byte | p50/p90 reported per language and per concurrency 1/3/5 | **Open** |
| D9 | No model licence violates commercial use | licence record per model + weight file | every artefact has a recorded, compatible licence | **Open** |

---

## E. Memory

| ID | Criterion | Method | Pass condition | Status |
| --- | --- | --- | --- | --- |
| E1 | Prior fact retrievable | call 1 states a fact; call 2 (same subject) retrieves it | retrieved with `source` + `timestamp` | **Open** |
| E2 | Incorrect fact correctable | overwrite with confirmed value | new value wins; old row marked superseded, not deleted silently | **Open** |
| E3 | Deletion and retention enforced | run retention job past expiry | expired rows gone, audit stub without content | **Open** |
| E4 | Cross-tenant access rejected | request another tenant's memory | `403` + security event logged | **Open** |
| E5 | Prompt injection from retrieved content | document containing "ignore previous instructions…" | model refuses; policy unchanged; attempt logged | **Open** |
| E6 | Inference vs confirmed distinguished | inspect stored record | `provenance` and `confidence` present and surfaced in UI | **Open** |
| E7 | Consequential action requires approval | ask agent to cancel/refund | agent proposes only; no side effect without approval row | **Open** |

---

## F. End-to-end call

| ID | Criterion | Pass condition | Status |
| --- | --- | --- | --- |
| F1 | Call enters telephony | SIP INVITE accepted, `CallSession` created | **Open** |
| F2 | Language selected by IVR or speech | correct `language` persisted on the session | **Open** |
| F3 | Local ASR transcribes | `TranscriptSegment` rows with `isFinal=true` | **Open** |
| F4 | Authorized memory + knowledge retrieved | context ids recorded against the turn | **Open** |
| F5 | Local LLM answers grounded | answer cites knowledge source; no invented policy/price | **Open** |
| F6 | Local TTS returns intelligible audio | native-speaker confirmation on the recorded call | **Open** |
| F7 | Caller can interrupt | barge-in cancels generation + playback; event logged `interrupted` | **Open** |
| F8 | Transfer to human works | `HUMAN_QUEUED → HUMAN_CONNECTED`; agent receives a handoff summary | **Open** |
| F9 | Outcome, transcript, summary, follow-up persisted | all rows exist and link to the right CRM contact | **Open** |
| F10 | Metrics/logs recorded safely | no transcript/phone number in application logs; latency recorded | **Open** |
| F11 | Same test passes with all external AI keys absent | full F1–F10 repeat with egress blocked | **Open** |

**Rule:** F11 is the gate for any "self-hosted" claim. Until F1–F11 pass on the target hardware, the platform is *not* production-ready and this document must say so.

---

## G. Reporting template (per phase)

```
Phase: <n>
Inspected:      <files/dirs>
Changed:        <exact paths>
Commands run:   <verbatim commands + exit codes>
Results:        <observed output, pass/fail per criterion id>
Remaining risks:<…>
Paid service?   <none | which | why>
Network access: <none | which hosts>
Data modified:  <none | what | approval id>
Next step:      <…>
```
