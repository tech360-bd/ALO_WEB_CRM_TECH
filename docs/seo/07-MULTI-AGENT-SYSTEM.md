# DELIVERABLE 11 — Multi-Agent AI System Specification

> ## Merge-first: most of this system already exists
>
> This repository already ships a production AI workforce platform. **Nothing below proposes a parallel system.** The 15 agents are **registrations + prompt templates + tool grants + Zod output contracts** on existing rails:
>
> | Existing component | Path | What it already provides |
> |---|---|---|
> | Agent registry | Prisma `AiAgent`, `AiAgentRegistry`, `AiEmployee` | `agentCode`, `agentType`, `promptTemplate`, `status`, `version`, `executionLog`, request/error counters |
> | Skills & tools | Prisma `AgentSkillExtension`, `AgentToolExtension`; `src/lib/ai-workforce/{skills,tools}/{registry,catalog,handlers}.ts` | Grantable, revocable capabilities per agent |
> | **Structured output contracts** | `src/lib/ai-workforce/output-schemas.ts` | Zod validation. Comment states: *"Model output is never trusted… Invalid output is rejected and the gateway falls back; it is never silently coerced."* |
> | **Human approval gate** | `src/lib/ai-workforce/approvals.ts` (`requestApproval`, `decideApproval`, `consumeApproval`), `src/lib/agentos/approval-transition.ts` (`canDecideApproval`, `processApproval`, `ApprovalConflict`, `ApprovalForbidden`) | Approval queue **with separation of duties already enforced** |
> | **RBAC** | `src/lib/ai-workforce/rbac.ts` | Capabilities `awf.agent.{read,create,edit,validate,test,approve,deploy,rollback,disable}`, `awf.tool.*`, `awf.skill.*`, `awf.workflow.*`, `awf.run.read.all`. Comment states: *"A role is never read from a request body, a prompt or a tool argument."* |
> | **Kill switch** | `src/lib/ai-safety.ts` | `GlobalAiPause` with scopes `GLOBAL`/`WORKFLOW`/`LEAD`/`STUDENT`/`CHANNEL`/**`AGENT`** — **fail-closed** (returns paused on DB error) |
> | Orchestrator | `src/lib/agent-orchestrator.ts` (`runOrchestrated`), `src/lib/agentos/agent-service.ts` | Event → result orchestration |
> | Existing verification agent | `src/lib/verification-agent.ts` | Weekly university/course verification with **content hashing**, `ProposedFieldChange`, approval queue — **this is already two thirds of the Freshness Watchdog** |
> | SEO brain | `src/app/api/brains/seo/{dependency,dna,impact-analysis,related,stale}` | Existing SEO intelligence surface, including staleness detection |
> | Audit | `src/lib/ai-workforce/audit.ts`, `src/lib/ai-workforce/telemetry.ts` | Run logging |
> | Scheduling | `src/lib/cron/route-handler.ts` + `CRON_JOBS.md` | ran→200 / skipped_locked→423 / blocked→501 / failed→500; lease locking; fail-closed |
>
> **Correction to the brief:** it specifies *"Orchestrator + 13 agents"* but then names **15**. All 15 are specified below. Every one of them is a registration, not a new subsystem.

---

## 11.1 The Orchestrator

**`seo-orchestrator`** — extends `runOrchestrated`, registered as the supervisor (`AiAgent.supervisorAgentId`).

**Responsibilities:** route work by trigger, enforce the D10 §10.4 state machine, hold the approval queue, enforce tool grants, apply the kill switch, and write `seo_agent_runs`.

**Trigger types:** `PUBLISH_REQUESTED` · `CLAIM_REVIEW_DUE` · `SOURCE_EXPIRED` · `CONTENT_STATE_CHANGED` · `PERFORMANCE_INGEST` · `TECHNICAL_FINDING_OPENED` · `MANUAL`.

**Routing table:**

| Trigger | Agents invoked, in order |
|---|---|
| `CLAIM_REVIEW_DUE` / `SOURCE_EXPIRED` | Policy Research → Source Verification → **(gate)** → Freshness Watchdog |
| `PUBLISH_REQUESTED` | SEO QA → Internal Link → Fact-Check → **(human gate)** → Publishing |
| New keyword opportunity | Search Opportunity → SERP Research → Content Brief |
| `PERFORMANCE_INGEST` | Performance → (may raise) Search Opportunity |
| `TECHNICAL_FINDING_OPENED` | Technical Audit → (creates `seo_tasks`) |

**Non-negotiable orchestrator rules:**
1. **No agent may transition a content item past `FACT_CHECK` or `SEO_QA` without a `seo_content_reviews` row.**
2. **No agent may publish.** Only a human with `PUBLISHER` may trigger `PUBLISHING`. The Publishing Agent prepares; it does not decide.
3. **The kill switch is checked before every step.** `GLOBAL` or `AGENT`-scoped pause → the step is skipped and logged as `blocked`, never silently dropped.
4. **Idempotency:** each step is keyed on `contentItemId + versionId + agentCode`. A repeated trigger on an unchanged version is a no-op.
5. **A failure in a downstream agent never rolls back an approval** — it raises a new `UPDATE_REQUIRED`.

---

## 11.2 The 15 agents

Common conventions: every agent writes `seo_agent_runs` (agentCode, projectId, contentItemId, trigger, inputHash, outputJson, status, failureReason, tokensUsed, costEstimate, requiresHumanApproval, approvedBy, startedAt, finishedAt). Every failure condition below is **fail-closed**: the agent stops and raises for a human rather than degrading silently.

---

### AG-01 · Technical Audit Agent

* **Purpose** — Crawl the public site and produce machine-readable findings in the D3 format.
* **Inputs** — sitemap.xml, robots.txt, priority URL list, `seo_technical_findings` (open items).
* **Tools** — HTTP fetcher (respecting the whitelisted user agent from **DEC-5**), HTML parser, JSON-LD extractor, `seo_technical_findings` writer.
* **Process** — fetch → parse → check against a rule catalogue (status codes, canonicals, robots directives, structured-data validity, **retired schema types**, title/meta/H1 presence, image alt presence, internal-link count) → diff against previous run → open/close findings.
* **Output** — `technicalAuditRunSchema`
* **Failure conditions** — non-200 on the target (raise, do not report phantom findings); **403/404 at scale → hard stop and raise `EDGE_BLOCK_DETECTED`** (this is what happened during this audit and must never be mistaken for site defects again); >30 % parse failures → stop.
* **Human gate** — **None to record findings.** Findings become `seo_tasks` only after a human sets severity and owner.
* **Logging** — one `seo_agent_runs` row per run + one row per finding written.

---

### AG-02 · Search Opportunity Agent

* **Purpose** — Compute the D4 §4.3 priority score and propose candidates.
* **Inputs** — GSC Performance/Pages exports, `seo_keywords`, `seo_lead_attribution`, business-value rubric (**human-supplied**), SERP snapshots.
* **Tools** — GSC reader, scoring function, `seo_opportunities` writer.
* **Process** — compute G, D, C, F, U → read B (never compute it) → apply weights → **if any component is null, set `isProvisional = true`** → rank → propose.
* **Output** — `opportunityScoreSchema`
* **Failure conditions** — any missing required input → **refuse to score and report which component is missing** (it must never substitute an estimate for `D` or `C`); weights summing ≠ 1.0 → hard fail.
* **Human gate** — **Yes.** A human approves opportunity ranking. The agent may not create a `seo_content_items` row (state `IDEA`) on its own.
* **Logging** — stores every component, not just the total, so a score can be audited.

---

### AG-03 · SERP Research Agent

* **Purpose** — Capture SERP evidence: who ranks, what format, whether an AI Overview is present.
* **Inputs** — priority keywords, locale (`en-BD` / `en-GB`), device.
* **Tools** — SERP capture (source must be declared in `seo_sources` with tier), snapshot writer.
* **Process** — capture → classify each result by type (official / aggregator / competitor / forum / UGC) → record AI Overview presence and cited sources → write `seo_serp_snapshots`.
* **Output** — `serpSnapshotSchema`
* **Failure conditions** — capture blocked or rate-limited → record the failure as evidence, **never fabricate a SERP**; fewer than 3 results parsed → discard the snapshot.
* **Human gate** — No. But every snapshot is timestamped evidence.
* **Logging** — snapshot + run row. **Snapshots are evidence, not opinions: they are never edited after capture.**

---

### AG-04 · Policy Research Agent

* **Purpose** — Detect immigration/policy changes affecting published claims.
* **Inputs** — the `seo_claims` register (jurisdiction + category), a watchlist of Tier A official URLs (GOV.UK, IRCC, Home Affairs, UKVI).
* **Tools** — official-source fetcher, content-difference detector (reusing the `verification-agent.ts` content-hash pattern), `seo_sources` writer.
* **Process** — fetch each watched official page → hash → compare to last hash → on change, extract the affected passages → match against `seo_claims` by jurisdiction and topic → raise `CLAIM_REVIEW_DUE`.
* **Output** — `policyChangeDetectionSchema`
* **Failure conditions** — official source unreachable → **raise `TIER_A_UNAVAILABLE` and take no action** (absence of evidence is not evidence of no change); hash unchanged → no-op; change detected but no matching claim → raise for human triage.
* **Human gate** — **Yes, always.** The agent detects; a human interprets. It may never edit a claim.
* **Logging** — every fetch, hash, and diff.

---

### AG-05 · Source Verification Agent

* **Purpose** — Confirm that each claim's citation actually supports it, at the required tier.
* **Inputs** — a claim, its cited source(s), the tier rule set.
* **Tools** — source fetcher, quotation extractor, tier classifier, `seo_claim_verifications` writer.
* **Process** — fetch the cited source → locate the supporting passage → test: (a) does it exist, (b) does it support the claim *as worded*, (c) is the tier sufficient for the claim's `riskClass`, (d) is the effective date current → record outcome.
* **Output** — `sourceVerificationSchema`
* **Failure conditions** — source unreachable → `UNVERIFIABLE` (**never** `PASS`); claim is `IMMIGRATION_MONEY` and the source tier is not A → `FAIL` regardless of accuracy; source is a Tier D competitor → **`FAIL` automatically** (structurally impossible to pass); source older than the claim's category freshness window → `FAIL` with `STALE_SOURCE`.
* **Human gate** — **Yes for `IMMIGRATION_MONEY` and `IMMIGRATION_RULE`.** The agent recommends; a `FACT_CHECKER` decides. The agent may never set a claim to `VERIFIED`.
* **Logging** — every verification appended; the table is append-only.

> **This is the agent that makes the D2 finding actionable.** Three conflicting Australia fees and two conflicting IHS figures exist in the live market. This agent is what makes it structurally impossible for ALO to publish one of them by accident.

---

### AG-06 · Content Brief Agent

* **Purpose** — Produce a brief that states what must be true before a page can be written.
* **Inputs** — the opportunity, target query, intent, required claims, competitor structure (positioning only), internal-link targets.
* **Tools** — `seo_content_briefs` writer, claim lookup, link-target lookup.
* **Process** — resolve intent → list **required claims from the registry** → list outline sections, each answering one question → specify word budget, internal-link targets, and the exact next step.
* **Output** — `contentBriefSchema`
* **Failure conditions** — a required claim is not in the registry → **create a claim-registration task instead of a brief** (this is the mechanism that stops unverifiable content being briefed); intent unresolved → stop.
* **Human gate** — **Yes.** A brief cannot be approved without its required-claims list (D10 §10.2 table 13).
* **Logging** — brief + run row.

---

### AG-07 · Draft Agent

* **Purpose** — Draft from the approved brief only.
* **Inputs** — the approved brief + approved claim wording.
* **Tools** — LLM text generation, `seo_content_versions` writer.
* **Process** — draft section by section against the outline → for every factual statement, emit `[[CLAIM:{id}]]` → never write a figure not present in an approved claim → produce meta title/description, structured data, and image alt text **as draft artefacts requiring review**.
* **Output** — `draftSchema`
* **Failure conditions** — the brief names a claim that is not `VERIFIED` → **refuse to draft that section**; the draft contains a number not traceable to a claim → hard fail; output fails Zod → rejected, never coerced.
* **Human gate** — **Yes, downstream.** A draft cannot reach `SEO_QA` without passing Fact-Check.
* **Logging** — version row with `contentHash`; every claim reference recorded.

> **Google guidance alignment.** Google's 1 Oct 2026 update asks publishers to **manually fact-check AI-generated content before publishing, including titles, meta descriptions, structured data and image alt text.** This agent therefore produces those artefacts as *draft* objects, and they are explicitly reviewable items — not auto-published metadata.

---

### AG-08 · Fact-Check Agent

* **Purpose** — Test the draft's claims against the registry and flag everything unsupported.
* **Inputs** — the draft version, its `[[CLAIM:]]` references, the claims registry.
* **Tools** — claim resolver, numeric-consistency checker, unsupported-statement detector.
* **Process** — resolve every reference → verify the draft's wording does **not overstate** the claim (scope, certainty, jurisdiction, date) → scan for **unreferenced factual statements** → classify each as `SUPPORTED`, `OVERSTATED`, `UNSUPPORTED`, `CONTRADICTS_CLAIM`.
* **Output** — `factCheckSchema`
* **Failure conditions** — any `UNSUPPORTED` or `CONTRADICTS_CLAIM` → **blocking failure**; more than 0 unreferenced numeric statements → blocking; a claim used outside its `effectiveFrom`/`effectiveTo` window → blocking.
* **Human gate** — **Yes for sensitive topics.** The agent blocks; a human resolves.
* **Logging** — findings list stored against the version, so a future reviewer can see exactly what was challenged.

---

### AG-09 · SEO QA Agent

* **Purpose** — Check on-page quality, link integrity, and policy compliance.
* **Inputs** — the version, the IL-1…IL-8 rules, the D3 severity model.
* **Tools** — title/meta/H1 validator, internal-link validator, schema-type validator, readability check, **retired-schema detector**, **scaled-content-abuse heuristic**.
* **Process** — validate metadata length and uniqueness → confirm exactly one H1 → confirm IL-1…IL-8 → validate JSON-LD against **currently supported** types → flag near-duplication against existing published pages.
* **Output** — `seoQaSchema`
* **Failure conditions** — a retired schema type is present (**HowTo, Practice Problem, FAQPage-as-a-rich-result-tactic**) → fail; fewer than 2 contextual internal inlinks → fail; content similarity to an existing page above the configured threshold → fail with `CANNIBALISATION_RISK`; title duplicated across the site → fail.
* **Human gate** — **Yes.** QA pass is a precondition for `APPROVED`, not a substitute for it.
* **Logging** — every check with pass/fail and the rule id.

---

### AG-10 · Internal Link Agent

* **Purpose** — Maintain the link graph and prevent orphans.
* **Inputs** — `seo_internal_links`, published URL inventory, hub/spoke map.
* **Tools** — link extractor, link validator, orphan detector, broken-link detector.
* **Process** — rebuild the graph → count contextual inlinks per URL → flag orphans (<2) → validate IL-2/IL-3/IL-5 → test every link for non-200 → propose contextual links for orphans.
* **Output** — `internalLinkSchema`
* **Failure conditions** — a money page has 0 inlinks → **escalate as High severity**; any broken internal link → **blocking defect** (IL-8); a link points to a non-public route family → blocking.
* **Human gate** — No for reporting. **Yes** to insert new links into a published page (that is a content change, and content changes go through the state machine).
* **Logging** — graph snapshot per run.

---

### AG-11 · Publishing Agent

* **Purpose** — Prepare and execute a release that a human has approved.
* **Inputs** — an `APPROVED` content item, its version, the redirect register, sitemap config.
* **Tools** — publish handler, sitemap updater, redirect registrar, cache invalidation, post-publish validator.
* **Process** — verify every gate is satisfied → publish → update the sitemap → register redirects if a URL changed → request indexing via **sitemap + internal links only** → validate live status, canonical, indexability → transition to `PUBLISHED` → open `MONITORING`.
* **Output** — `publishResultSchema`
* **Failure conditions** — **any missing approval → refuse, unconditionally**; kill switch active → refuse; a URL change without a 301 + canonical + sitemap entry + internal-link update → refuse; the internal-link minimum is unmet → refuse; post-publish validation fails → auto-revert to the previous version and alert.
* **Human gate** — **Yes, mandatory and non-bypassable.** Only a `PUBLISHER`-role human triggers this agent. `canDecideApproval` from `agentos/approval-transition.ts` enforces it.
* **Logging** — complete release record: what changed, who approved, the previous version retained, the validation result.

> **Standing rule honoured:** the Indexing API is **not** in this agent's tool grants. Google documents it as valid only for JobPosting and BroadcastEvent pages, and using it for ordinary content pages is outside its scope. Discovery is via sitemap + internal links.

---

### AG-12 · Performance Agent

* **Purpose** — Ingest performance data and detect meaningful change.
* **Inputs** — GSC Performance + Pages + **Generative AI report**, GA4, CRM conversions.
* **Tools** — GSC reader, GA4 reader, CRM reader, `seo_metric_snapshots` writer, anomaly detector.
* **Process** — ingest on a weekly key → compute deltas against the trailing baseline → attribute to published items by URL → flag anomalies beyond a configured threshold → annotate known external events (e.g. the global spam updates of **18–21 Aug 2026** and **24 Sep 2026**) so volatility is not misread as a content verdict.
* **Output** — `performanceReportSchema`
* **Failure conditions** — any source unavailable → report the gap explicitly and **never interpolate**; the GSC Generative AI report unavailable → record that fact rather than reporting zero (absence ≠ zero).
* **Human gate** — No for reporting. **Yes** before any conclusion is published as fact.
* **Logging** — every ingest with timestamp and property.

---

### AG-13 · Freshness Watchdog

* **Purpose** — Ensure no page silently becomes wrong.
* **Inputs** — `seo_claims.nextReviewAt`, `seo_sources.expiryDate`, announced effective dates.
* **Tools** — scheduler, claim scanner, **existing `verification-agent.ts` content-hash comparison**, `seo_alerts` writer.
* **Process** — daily scan → classify by risk → for `IMMIGRATION_MONEY`/`IMMIGRATION_RULE`, require a review at most **7 days** before an effective date and **on** the date → generate `UPDATE_REQUIRED` → escalate if overdue.
* **Output** — `freshnessAlertSchema`
* **Failure conditions** — a Tier A source is unreachable → `TIER_A_UNAVAILABLE` alert at **High** severity (not a silent pass); a claim is overdue past its `nextReviewAt` → escalate daily until resolved; the run itself fails → alert, because a watchdog that fails silently is worse than none.
* **Human gate** — No to raise. **Yes** to resolve. The agent may never extend a review date.
* **Logging** — every scan, every alert, every escalation.

> **Reuse, not rebuild:** `src/lib/verification-agent.ts` already performs weekly content-hash verification of official university URLs and proposes `ProposedFieldChange`s. The Watchdog **extends that existing agent's mechanism to the claims registry** rather than writing a second one.

---

### AG-14 · Local SEO Agent

* **Purpose** — Protect NAP consistency and local presence.
* **Inputs** — the canonical NAP (**DEC-1**), GBP data, citation register, `LocalBusiness` markup.
* **Tools** — GBP reader, NAP consistency checker, schema validator.
* **Process** — compare published NAP against the DEC-1 record character by character → check `LocalBusiness`/`Organization` markup → compare GBP against the site → report inconsistencies.
* **Output** — `localSeoSchema`
* **Failure conditions** — **if DEC-1 is unanswered, refuse to run.** With no ground truth, any "fix" could corrupt a correct value; inconsistency must be reported, never guessed; a proposed location page without a real, staffed office → **refuse** (doorway-page risk).
* **Human gate** — **Yes.** NAP changes require management sign-off — no agent may alter an address.
* **Logging** — consistency report, timestamped.

---

### AG-15 · Authority Opportunity Agent

* **Purpose** — Identify genuinely earned authority opportunities.
* **Inputs** — the D14 strategy, partner-university list, university/partner pages, the original data report, alumni consent register.
* **Tools** — public-web reader, existing-backlink lookup (**only if a real source exists**), contact-finder for publicly listed institutional contacts, prospect tracker.
* **Process** — identify where comparable organisations are referenced (partner lists, alumni pages, research citations, industry directories) → score relevance and attainability → surface **public, legitimate** pathways.
* **Output** — `authorityOpportunitySchema`
* **Failure conditions** — **no tool may ever send bulk or unsolicited email, buy links, or use PBN/guest-post networks** — a structural prohibition, not a setting; a prospect requires payment → flag `REJECT: PAID_LINK`; backlink data unavailable → report availability, never estimate.
* **Human gate** — **Yes, always.** A human sends every outreach message. The agent drafts and tracks only.
* **Logging** — prospect + rationale + status; every outreach drafted recorded with who sent it.

---

## 11.3 Consolidated capability matrix

| Agent | Reads GSC/GA4 | Reads CRM | Writes content | Writes claims | Changes live site | **Human gate required** |
|---|---|---|---|---|---|---|
| AG-01 Technical Audit | no | no | no | no | no | severity/owner assignment |
| AG-02 Search Opportunity | yes | yes | no | no | no | **ranking approval** |
| AG-03 SERP Research | yes | no | no | no | no | no |
| AG-04 Policy Research | no | no | no | no | no | **always** |
| AG-05 Source Verification | no | no | no | **no (recommend only)** | no | **yes for money/rule claims** |
| AG-06 Content Brief | no | no | no | no | no | **brief approval** |
| AG-07 Draft | no | no | **yes (draft only)** | no | no | downstream |
| AG-08 Fact-Check | no | no | no | no | no | **sensitive topics** |
| AG-09 SEO QA | no | no | no | no | no | **approval** |
| AG-10 Internal Link | no | no | no | no | no | **to modify published pages** |
| AG-11 Publishing | no | no | publishes **approved only** | no | **yes (gated)** | **mandatory, non-bypassable** |
| AG-12 Performance | yes | yes | no | no | no | to publish conclusions |
| AG-13 Freshness Watchdog | no | no | no | no | no | **to resolve an alert** |
| AG-14 Local SEO | no | no | no | no | no | **always for NAP** |
| AG-15 Authority Opportunity | no | no | no | no | no | **always** |

**No agent can both write a claim and verify it. No agent can verify and publish. No agent can publish at all without a human.**

## 11.4 Why this architecture answers the brief's operating principle

The brief's principle is: *AI researches and proposes → official sources establish high-risk facts → Source Verification checks evidence → Fact-Check tests claims → a human expert reviews sensitive content → SEO QA checks quality → Publishing releases only approved work.*

That chain is mapped one-to-one onto AG-02 → AG-04/05 → AG-08 → approval gate → AG-09 → AG-11, with the **existing** `approvals.ts` engine and `ai-safety.ts` kill switch enforcing it. **The design does not depend on agent discipline; it depends on the gate existing in code**, which is why nothing reaches the public web unverified.
