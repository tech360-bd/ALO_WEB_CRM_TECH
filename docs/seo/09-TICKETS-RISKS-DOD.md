# DELIVERABLES 16, 17, 18 & 19 — Development Tickets · SEO Tickets · Risk Register · Definition of Done

Priority: **P0** blocks everything · **P1** this quarter · **P2** next quarter.
Owner type: `DEV` · `OPS` · `SEO` · `CRM` · `CONTENT` · `MGMT` · `AGENT`

---

# DELIVERABLE 16 — FIRST 20 DEVELOPMENT TICKETS

### DEV-01 · Verify and restore deployment parity
* **PROBLEM** — The live domain returns 403/404 from LiteSpeed on `/`, `/contact`, `/api/health` and `/sitemap.xml`, while the repo ships `src/app/sitemap.ts` and the pages.
* **USER STORY** — As the business, I need to know whether the deployed site is the current code, so that SEO work can reach the public web.
* **SCOPE** — Execute the 4-step disambiguation (D2 §2.1); document hypothesis H1 (edge) vs H2 (deployment gap); if H2, restore deployment.
* **ACCEPTANCE CRITERIA** — A written verdict with evidence; if H2, `/` returns 200 with current content from the repo; if H1, the blocking rule is identified and the audit user agent whitelisted (DEC-5).
* **DEPENDENCIES** — Hostinger access; DEC-5
* **PRIORITY** — **P0**
* **OWNER TYPE** — OPS + DEV
* **TEST PLAN** — Browser fetch of `/`, `/contact`, `/sitemap.xml`; compare rendered HTML against the repo's router output; confirm `/api/health` returns the expected JSON.

### DEV-02 · Serve a valid, resilient sitemap
* **PROBLEM** — `/sitemap.xml` returns 404. The repo has a sitemap route.
* **USER STORY** — As a search engine, I need the full URL inventory so I can discover pages.
* **SCOPE** — Ensure `src/app/sitemap.ts` serves valid XML with absolute canonical URLs; handle DB failure with a static fallback; never emit an empty sitemap.
* **ACCEPTANCE CRITERIA** — `GET /sitemap.xml` → 200, `application/xml`, well-formed, contains every indexable URL, no non-public routes, no 4xx/5xx entries.
* **DEPENDENCIES** — DEV-01
* **PRIORITY** — **P0**
* **OWNER TYPE** — DEV
* **TEST PLAN** — XML schema validation; assert zero non-public URLs; simulate a DB failure and assert a valid fallback is still served.

### DEV-03 · Advertise the sitemap in robots.txt and gate non-public routes
* **PROBLEM** — robots.txt has no `Sitemap:` line; no declared policy for `/api`, `/login`, `/crm`, `/admin`, portal routes.
* **USER STORY** — As a search engine, I need to be told where the sitemap is and what not to index.
* **SCOPE** — Add the `Sitemap:` directive; add `X-Robots-Tag: noindex` to every non-public route family.
* **ACCEPTANCE CRITERIA** — `robots.txt` contains the directive; each non-public family returns the header; public routes do not.
* **DEPENDENCIES** — DEV-02
* **PRIORITY** — **P0**
* **OWNER TYPE** — DEV
* **TEST PLAN** — Fetch `robots.txt`; curl each route family and assert the header; assert public routes lack it.

### DEV-04 · Declare and enforce canonical host + trailing-slash policy
* **PROBLEM** — Apex and `www` both answer; `/about-us` and `/about-us/` behave differently.
* **USER STORY** — As a search engine, I need one URL per page.
* **SCOPE** — Choose the canonical host (DEC-T4); 301 the other; set `trailingSlash: false`; align canonicals, sitemap and internal links.
* **ACCEPTANCE CRITERIA** — Exactly one 200 per page; all variants 301 in a single hop; canonicals self-referencing and absolute.
* **DEPENDENCIES** — DEC-T4
* **PRIORITY** — **P0**
* **OWNER TYPE** — DEV + OPS
* **TEST PLAN** — Assert single-hop 301s for `http`, `www`, and slash variants; crawl and assert canonical uniqueness.

### DEV-05 · Un-gate the About page and de-index login-redirect variants
* **PROBLEM** — `/about-us` redirects to login; `/login?callbackUrl=%2Fabout-us` is indexed carrying homepage copy.
* **USER STORY** — As a prospective student, I want to read about the business without creating an account.
* **SCOPE** — Make About public; inspect `middleware.ts`; ensure auth routes are noindexed and never linked from public navigation.
* **ACCEPTANCE CRITERIA** — `/about-us` → 200 for anonymous visitors; `/login*` carries `noindex`; no public nav link to a protected route.
* **DEPENDENCIES** — DEC-3
* **PRIORITY** — **P0** (it also removes a live trust defect)
* **OWNER TYPE** — DEV
* **TEST PLAN** — Anonymous fetch returns 200; assert `noindex` on login URLs; grep the sitemap for `/login`.

### DEV-06 · Implement Organization, LocalBusiness and BreadcrumbList structured data
* **PROBLEM** — No verified structured data; entity signals missing for a location-based business.
* **USER STORY** — As a search engine, I need to understand the organisation and its location.
* **SCOPE** — Emit JSON-LD using **only** the currently supported types; `LocalBusiness` only for real offices; `sameAs` for verified profiles. **Do not add FAQPage as a tactic.**
* **ACCEPTANCE CRITERIA** — Valid JSON-LD on all public templates; Rich Results Test passes for supported types; **zero retired types present** (HowTo, Practice Problem, FAQPage-as-tactic).
* **DEPENDENCIES** — DEC-1 (address), DEV-04
* **PRIORITY** — P1
* **OWNER TYPE** — DEV
* **TEST PLAN** — Rich Results Test + JSON-LD parsing assertions; a unit test asserting no retired type appears in any template.

### DEV-07 · Real 404 page with recovery paths
* **PROBLEM** — Unknown paths return the host's default 404.
* **USER STORY** — As a visitor who mistyped or followed a stale link, I need a way forward.
* **SCOPE** — A branded 404 with navigation, search, and popular destinations. **Never 301 unknown URLs to the homepage.**
* **ACCEPTANCE CRITERIA** — Correct 404 status (not 200); helpful content rendered; no soft-404.
* **DEPENDENCIES** — DEV-01
* **PRIORITY** — P1
* **OWNER TYPE** — DEV
* **TEST PLAN** — Assert status === 404; assert the page renders nav and links; assert no redirect to `/`.

### DEV-08 · Make the public homepage render without a session
* **PROBLEM** — The homepage content Google holds is under a `/login?callbackUrl=` URL, implying an auth-gated marketing shell.
* **USER STORY** — As a prospective student, I want the homepage to load without signing in.
* **SCOPE** — Decouple public marketing routes from the auth shell.
* **ACCEPTANCE CRITERIA** — `/` → 200 anonymous; H1 and body copy present in **raw HTML source**, not only after JS.
* **DEPENDENCIES** — DEV-01
* **PRIORITY** — P1
* **OWNER TYPE** — DEV
* **TEST PLAN** — `view-source` (not DevTools) asserts H1, body copy and primary links; assert no redirect for anonymous users.

### DEV-09 · Persistent mobile call / WhatsApp / book CTA bar
* **PROBLEM** — Conversion path may require scrolling on mobile.
* **USER STORY** — As a mobile visitor, I want to contact ALO immediately.
* **SCOPE** — Persistent bottom bar with Call, WhatsApp, Book; all three instrumented.
* **ACCEPTANCE CRITERIA** — Visible without scrolling on mobile; each target tracked; hides on the CRM/portal.
* **DEPENDENCIES** — DEV-18
* **PRIORITY** — P1
* **OWNER TYPE** — DEV
* **TEST PLAN** — Mobile viewport check; assert click events fire with campaign parameters; assert absence on internal routes.

### DEV-10 · Minimise and instrument the contact form
* **PROBLEM** — Field count and mobile input types unverified; conversion friction unknown.
* **USER STORY** — As a prospective student on a phone, I want to leave my details in under 30 seconds.
* **SCOPE** — Reduce to name + phone/WhatsApp + destination interest; `inputmode="tel"`; real validation errors; add **"How did you hear about us?"** (D12 §12.5).
* **ACCEPTANCE CRITERIA** — ≤ 4 fields; submit works with JS disabled or degrades explicitly; CRM lead carries source; success state is unambiguous.
* **DEPENDENCIES** — CRM lead model
* **PRIORITY** — P1
* **OWNER TYPE** — DEV + CRM
* **TEST PLAN** — Submit happy path, invalid phone, empty name; assert the CRM row and the attribution fields; test on a throttled mobile profile.

### DEV-11 · Performance baseline and budget enforcement
* **PROBLEM** — No CWV data; no budget.
* **USER STORY** — As the business, I want pages that load on a Bangladeshi mobile network.
* **SCOPE** — Measure top 10 templates on mobile; set the budget (LCP ≤ 2.5 s p75, INP ≤ 200 ms, CLS ≤ 0.1); wire a pre-publish check.
* **ACCEPTANCE CRITERIA** — Every template measured and recorded; budget documented; a failing template blocks publication.
* **DEPENDENCIES** — DEV-01
* **PRIORITY** — P1
* **OWNER TYPE** — DEV + SEO
* **TEST PLAN** — PSI/CrUX per template; assert CI or the pre-publish checklist reports the budget.

### DEV-12 · Image pipeline and third-party script inventory
* **PROBLEM** — Image weight and third-party scripts unverified; the most common LCP causes on consultancy sites.
* **USER STORY** — As a mobile visitor, I want images and widgets not to block the page.
* **SCOPE** — AVIF/WebP, correct sizing, lazy-load below the fold, **never lazy-load the LCP image**; defer chat until interaction; inventory all third-party scripts.
* **ACCEPTANCE CRITERIA** — All content images in a modern format and correctly sized; no render-blocking third-party script; LCP image not lazy-loaded.
* **DEPENDENCIES** — DEV-11
* **PRIORITY** — P1
* **OWNER TYPE** — DEV
* **TEST PLAN** — Assert formats and dimensions; assert the LCP element lacks `loading="lazy"`; measure before/after.

### DEV-13 · Claims Registry schema and service layer
* **PROBLEM** — No mechanism records when a visa fact was last verified — the direct cause of the highest risk in this plan.
* **USER STORY** — As the business, I need to know instantly whether any live claim has expired.
* **SCOPE** — `seo_claims`, `seo_sources`, `seo_claim_verifications` (D10 §10.2 tables 2–4) + service layer + review-date logic.
* **ACCEPTANCE CRITERIA** — Migration applies cleanly; every claim requires a source and a `nextReviewAt`; a query returns all overdue claims; IMMIGRATION_MONEY claims reject non-Tier-A sources at the service layer.
* **DEPENDENCIES** — **DEC-7**
* **PRIORITY** — P1
* **OWNER TYPE** — CRM
* **TEST PLAN** — Unit tests: a money claim with a Tier D source is rejected; `nextReviewAt` in the past is returned as overdue; verification rows are append-only.

### DEV-14 · SEO content workflow state machine
* **PROBLEM** — No enforceable content lifecycle; the brief's IDEA→…→ARCHIVED chain does not exist.
* **USER STORY** — As the business, I need no unverified content to be publishable.
* **SCOPE** — `seo_content_items`, `seo_content_versions`, `seo_content_reviews`, `seo_content_briefs` (tables 13–16) + transitions with actor, timestamp, notes; reject transitions lacking any of the three.
* **ACCEPTANCE CRITERIA** — Illegal transitions rejected; no path from DRAFTING to PUBLISHED bypassing FACT_CHECK and SEO_QA; every transition persists actor+timestamp+notes.
* **DEPENDENCIES** — DEV-13
* **PRIORITY** — P1
* **OWNER TYPE** — CRM
* **TEST PLAN** — Attempt every illegal transition and assert rejection; assert the audit row shape.

### DEV-15 · Lead attribution capture
* **PROBLEM** — No link between a search click and a CRM lead; the 20 % score component is uncomputable.
* **USER STORY** — As the business, I want to know which content produces students.
* **SCOPE** — `seo_lead_attribution` (table 20); capture first/last touch + UTM + `gclid` + landing URL at lead creation.
* **ACCEPTANCE CRITERIA** — Every new lead carries a source row; first-touch and last-touch both stored; missing data recorded as `unknown`, never guessed.
* **DEPENDENCIES** — DEV-10
* **PRIORITY** — P1
* **OWNER TYPE** — CRM
* **TEST PLAN** — Create leads via form, WhatsApp and portal and assert the attribution row; assert `unknown` is recorded rather than a fabricated channel.

### DEV-16 · Agent registrations and Zod output contracts
* **PROBLEM** — The 15 SEO agents do not exist, though the registry and contract infrastructure does.
* **USER STORY** — As the business, I want the agents registered and their output validated.
* **SCOPE** — Register all 15 in `AiAgentRegistry` with `promptTemplate`, `agentType`, version; add Zod schemas to `output-schemas.ts`; grant tools explicitly per §11.3.
* **ACCEPTANCE CRITERIA** — All 15 registered and listed; each returns a schema-validated object; **invalid output is rejected, never coerced**; no agent holds a tool beyond its grant.
* **DEPENDENCIES** — DEV-13, DEC-7
* **PRIORITY** — P1
* **OWNER TYPE** — CRM + AGENT
* **TEST PLAN** — Feed each agent malformed output and assert rejection with a logged `failureReason`; assert tool grants match §11.3 exactly.

### DEV-17 · Agent run logging and kill-switch integration
* **PROBLEM** — No `seo_agent_runs` table; kill-switch coverage for these agents unverified.
* **USER STORY** — As the business, I want every AI action auditable and stoppable.
* **SCOPE** — `seo_agent_runs` (table 21); check `GlobalAiPause` (GLOBAL + AGENT scopes) before every step; log skips as `blocked`.
* **ACCEPTANCE CRITERIA** — Every run logged with input hash and cost; a GLOBAL pause halts all agents; a paused step is logged as `blocked`, never silently dropped; DB error → treat as paused (fail-closed).
* **DEPENDENCIES** — DEV-16
* **PRIORITY** — P1
* **OWNER TYPE** — CRM + AGENT
* **TEST PLAN** — Activate GLOBAL pause and assert all agents halt; simulate a DB error and assert fail-closed; assert one run row per invocation.

### DEV-18 · WhatsApp click and channel tracking
* **PROBLEM** — WhatsApp is a primary channel and is unmeasured.
* **USER STORY** — As the business, I want WhatsApp enquiries attributed to a source.
* **SCOPE** — Instrument `wa.me` clicks with campaign parameters; carry them into `WhatsAppContact` → CRM lead.
* **ACCEPTANCE CRITERIA** — A WhatsApp click from an organic landing page produces a CRM contact with the landing URL and channel.
* **DEPENDENCIES** — DEV-15
* **PRIORITY** — P1
* **OWNER TYPE** — DEV + CRM
* **TEST PLAN** — Click through from three landing pages and assert the resulting contact's attribution.

### DEV-19 · SEO reporting surface in the CRM
* **PROBLEM** — No link between search performance and business outcomes inside the CRM.
* **USER STORY** — As management, I want one screen showing visibility, leads and claims health.
* **SCOPE** — Reporting sub-module (D10 §10.1 item 22) rendering D15's leading/mid/lagging KPIs; store baselines.
* **ACCEPTANCE CRITERIA** — Renders from stored snapshots; every unavailable metric shows `DATA NOT AVAILABLE` rather than zero; AI impressions labelled "AI Overviews + AI Mode combined".
* **DEPENDENCIES** — DEV-15, DEV-13
* **PRIORITY** — P2
* **OWNER TYPE** — CRM
* **TEST PLAN** — Render with an empty dataset and assert `DATA NOT AVAILABLE`; render with data and assert the figures match the source exports.

### DEV-20 · Scheduled SEO jobs on the existing cron contract
* **PROBLEM** — The Freshness Watchdog and other jobs need scheduling; the repo's cron contract must be reused.
* **USER STORY** — As the business, I want claim reviews to happen automatically.
* **SCOPE** — Declare jobs in `CRON_JOBS.md`; use the existing lock/orchestration (`cron-lock.ts` lease semantics, fail-closed without a lock store, released in `finally`); idempotency keys; retries; dead-letter.
* **ACCEPTANCE CRITERIA** — Jobs return ran→200 / skipped_locked→423 / blocked→501 / failed→500; `success = status === 'ran'`; a duplicated trigger is a no-op; a failing job lands in dead-letter and alerts.
* **DEPENDENCIES** — DEV-13, DEV-17, Hostinger cron configured
* **PRIORITY** — P1
* **OWNER TYPE** — CRM + OPS
* **TEST PLAN** — Invoke concurrently and assert exactly one `ran` plus locks skipped; assert the status-code mapping; force a failure and assert dead-letter.

---

# DELIVERABLE 17 — FIRST 20 SEO EXECUTION TICKETS

### SEO-01 · Remove or scope the "No IELTS needed" claim
* **PROBLEM** — An unscoped English-test exemption claim is live and factually unsafe.
* **USER STORY** — As a prospective student, I need accurate English-requirement information so I don't plan around a false exemption.
* **SCOPE** — Remove or scope precisely to specific institutions/routes; do not substitute another blanket claim.
* **ACCEPTANCE CRITERIA** — The claim is gone or explicitly scoped with named conditions; a replacement explanatory page exists (SEO-14).
* **DEPENDENCIES** — **DEC-2**
* **PRIORITY** — **P0** *(do today — it needs no access and no tooling)*
* **OWNER TYPE** — CONTENT + MGMT
* **TEST PLAN** — Grep the rendered page for the phrase; confirm the new wording names specific conditions.

### SEO-02 · Establish the canonical NAP and fix every surface
* **PROBLEM** — Three addresses, three phone formats, two sets of hours across ALO's own pages.
* **USER STORY** — As a prospective student, I need to know where ALO actually is.
* **SCOPE** — Publish the DEC-1 record identically on footer, contact and About; then GBP, socials, directories.
* **ACCEPTANCE CRITERIA** — Byte-identical NAP on all ALO surfaces; a consistency report shows 100 % match.
* **DEPENDENCIES** — **DEC-1**
* **PRIORITY** — **P0**
* **OWNER TYPE** — MGMT + SEO
* **TEST PLAN** — AG-14 consistency check; manual spot-check of footer, contact, About and GBP.

### SEO-03 · UK Student Visa maintenance funds — the 30 November 2026 page
* **PROBLEM** — The maintenance requirement changes on 30 Nov 2026 and most BD coverage is generic. ALO has no correct page.
* **USER STORY** — As a Bangladeshi student applying after 30 November, I need to know exactly how much to show.
* **SCOPE** — Before/after table (£1,529/£1,171 → £1,570/£1,203; maxima £13,761/£10,539 → £14,130/£10,827), the 28-day rule, the application-date rule, worked Bangladeshi examples, BDT indicative conversion per **Rule 5.4.1**, named reviewer, cited Tier A sources with retrieval + effective dates.
* **ACCEPTANCE CRITERIA** — Live **before 30 Nov 2026**; every figure Tier A sourced with the retrieval date shown; re-verified **on** 30 Nov; passes D19 content DoD.
* **DEPENDENCIES** — Tier A GOV.UK read; Source Verification + Fact-Check gates
* **PRIORITY** — **P0**
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 verification PASS; AG-08 fact-check PASS; a human reviewer confirms each figure against GOV.UK on the day; AG-13 confirms the review date.

### SEO-04 · UK Graduate visa transition page (1 January 2027)
* **PROBLEM** — Non-doctoral Graduate visa duration drops to 18 months for applications on/after 1 Jan 2027.
* **USER STORY** — As a Bangladeshi graduate deciding when to apply, I need the transition rule.
* **SCOPE** — Before/after (2 years → 18 months), the application-date rule, the doctoral exemption, "cannot be extended", "not a settlement route", the transition table.
* **ACCEPTANCE CRITERIA** — Live **before 1 Jan 2027**; re-verified on the day; no processing-time promise.
* **DEPENDENCIES** — Tier A GOV.UK read (currently only Tier B consensus — **not publishable**)
* **PRIORITY** — **P0**
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 + AG-08 gates; human verification on 1 Jan 2027.

### SEO-05 · Australia Subclass 500 correction (2 October 2026 changes)
* **PROBLEM** — Onshore lodgement restrictions and dependant changes took effect 2 Oct 2026; ALO's content is likely wrong today.
* **USER STORY** — As a student in Australia or planning to be, I need to know whether I can apply onshore.
* **SCOPE** — Onshore prohibition, the exemptions, the partner/child inclusion change, the "lodged before 2 Oct" carve-out, and the raised weight on course progression.
* **ACCEPTANCE CRITERIA** — Corrected with every claim Tier A sourced; the previous version retained in `seo_content_versions`.
* **DEPENDENCIES** — Tier A Home Affairs read
* **PRIORITY** — **P0**
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 + AG-08; human verification against Home Affairs.

### SEO-06 · Canada SDS is closed — retire and replace
* **PROBLEM** — The SDS ended 8 Nov 2024, yet BD content widely still describes it; if ALO has such content it is a live defect.
* **USER STORY** — As a prospective Canadian applicant, I need to know which stream applies to me.
* **SCOPE** — Replace SDS content with the regular-stream reality: PAL/TAL, proof of funds, GIC's changed role.
* **ACCEPTANCE CRITERIA** — Zero live references to SDS as a current option; 301s in place if URLs change; Tier A sourced.
* **DEPENDENCIES** — Tier A IRCC read; redirect register
* **PRIORITY** — **P0**
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — Site-wide grep for "SDS" asserting only historical references remain; redirect test; AG-05 gate.

### SEO-07 · PGWP language-requirement page (including the IELTS Academic trap)
* **PROBLEM** — Since 1 Nov 2024 PGWP requires CLB 7 (degree) or CLB 5 (non-degree); **IELTS Academic is not accepted** — an expensive, avoidable mistake.
* **USER STORY** — As a Bangladeshi student planning a PGWP, I need to take the right test.
* **SCOPE** — CLB 7/5 tables, accepted tests, IELTS General Training vs Academic, the 180-day window, the 8-month minimum.
* **ACCEPTANCE CRITERIA** — Every threshold Tier A sourced; the Academic/General distinction is unmissable; no approval-rate implication.
* **DEPENDENCIES** — Tier A IRCC read
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 + AG-08; human review.

### SEO-08 · Genuine Student statement guide (Australia)
* **PROBLEM** — GS replaced GTE in 2024; it is the single biggest hurdle and BD guidance is thin.
* **USER STORY** — As a Bangladeshi applicant, I need to write a GS statement that answers what the case officer actually asks.
* **SCOPE** — The questions the assessment addresses, a structure, what weak evidence looks like. **No outcome guarantees.**
* **ACCEPTANCE CRITERIA** — Mirrors the official criteria; contains no approval promise; Tier A sourced.
* **DEPENDENCIES** — Tier A Home Affairs read
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-08 fact-check plus human review for tone and honesty.

### SEO-09 · Bangladeshi money-logistics cluster (bank statements, solvency certificate, sponsor rules)
* **PROBLEM** — The strongest local differentiator is unwritten; generic competitors cannot serve it.
* **USER STORY** — As a Bangladeshi family, I need to know which documents my bank must provide and in whose name.
* **SCOPE** — 5–6 pages: bank statement format, solvency certificate, student file accounts, the 28-day rule in local terms, sponsor consent + birth certificate, sudden-deposit risk. **No bank-specific claims until verified per bank.**
* **ACCEPTANCE CRITERIA** — Every procedural claim sourced; bank-specific statements verified or explicitly marked as needing verification; BDT figures follow Rule 5.4.1.
* **DEPENDENCIES** — Tier A reads; per-bank verification
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 per claim; AG-08; human review by a counsellor who has processed these documents.

### SEO-10 · UK vs Canada vs Australia honest comparison
* **PROBLEM** — Genuine student indecision; comparison content is highly citable and mostly self-serving elsewhere.
* **USER STORY** — As a student who hasn't chosen, I want an honest comparison including who each destination suits least.
* **SCOPE** — One table covering cost, post-study work, dependants, and language requirements, with a "who this suits" and a "who this does not suit" column.
* **ACCEPTANCE CRITERIA** — Every figure sourced; the "does not suit" column is genuinely answered; no destination is presented as universally best.
* **DEPENDENCIES** — SEO-03, 04, 05, 06 complete first
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 + AG-08; human review.

### SEO-11 · Visa Rule Change Tracker hub
* **PROBLEM** — Dated changes are scattered; no hub owns the category or internally links the affected pages.
* **USER STORY** — As a prospective student, I want one page listing every upcoming visa change and its date.
* **SCOPE** — `/visa-changes` listing each dated change with its effective date, affected page, and last-verified date.
* **ACCEPTANCE CRITERIA** — Every dated claim links to its page; the hub is linked from primary nav and every dated page (IL-5).
* **DEPENDENCIES** — SEO-03, 04, 05
* **PRIORITY** — P1
* **OWNER TYPE** — SEO + CONTENT
* **TEST PLAN** — Link-graph assertion (IL-5); AG-13 confirms every listed date is tracked.

### SEO-12 · Counsellor profiles with real credentials and consent
* **PROBLEM** — E-E-A-T is weak; no named, credentialed humans are visible.
* **USER STORY** — As a prospective student, I want to know who will advise me.
* **SCOPE** — 3–5 profiles: name, role, real experience, real credentials, optional photo **with written consent**.
* **ACCEPTANCE CRITERIA** — Every credential verifiable; **written consent on file for each named person and photo**; no invented qualification, employer, or years-of-experience.
* **DEPENDENCIES** — Real HR data; consent
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT + MGMT
* **TEST PLAN** — Confirm a consent record exists per person; management attests to each credential.

### SEO-13 · Consented student stories
* **PROBLEM** — No social proof; trust is the core purchase barrier.
* **USER STORY** — As a prospective student, I want to hear from someone who has done it.
* **SCOPE** — 6–10 stories with **written consent** covering name/photo/outcome as applicable.
* **ACCEPTANCE CRITERIA** — Consent on file for every story; **no invented outcome, university, or result**; anonymised where consent is partial; no success-rate implication.
* **DEPENDENCIES** — Consent register
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT + MGMT
* **TEST PLAN** — Consent record per story; management attestation; AG-08 confirms no unsupported claim.

### SEO-14 · Honest English-requirement page replacing the IELTS claim
* **PROBLEM** — The removed claim leaves a genuine question unanswered.
* **USER STORY** — As a student with a low IELTS score, I want to know my real options.
* **SCOPE** — Requirement by route/institution; MOI certificates; pre-sessional English; foundation pathways. **No blanket exemption statement.**
* **ACCEPTANCE CRITERIA** — Every requirement is institution/route-specific and sourced; no unconditional exemption appears anywhere.
* **DEPENDENCIES** — SEO-01
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT
* **TEST PLAN** — AG-05 + AG-08; grep for unconditional exemption phrasing.

### SEO-15 · Service and pricing transparency page
* **PROBLEM** — ALO's promise is "no hidden fees, no false promises" and nothing on the site substantiates it.
* **USER STORY** — As a prospective client, I want to know what is free and what is not before I share my details.
* **SCOPE** — What is free, what is paid, third-party costs (visa fees, IHS, tests, tuition) clearly separated from ALO's own.
* **ACCEPTANCE CRITERIA** — Every fee stated accurately with an effective date; no hidden cost implied; management-approved.
* **DEPENDENCIES** — MGMT approval
* **PRIORITY** — P1
* **OWNER TYPE** — MGMT + CONTENT
* **TEST PLAN** — Management sign-off; support agent spot-check against a real enquiry.

### SEO-16 · Consent-verified postgraduate application page
* **PROBLEM** — ALO's copy claims free application processing and SOP support without substantiating either.
* **USER STORY** — As an applicant, I want to know exactly what ALO does at each stage.
* **SCOPE** — The real process, stage by stage, with honest timeframes described as variable.
* **ACCEPTANCE CRITERIA** — Matches the actual internal process; no processing-time promise; each stage has an owner and a typical duration framed as variable.
* **DEPENDENCIES** — Internal process confirmation
* **PRIORITY** — P1
* **OWNER TYPE** — CONTENT + MGMT
* **TEST PLAN** — Counsellor review confirms the described process matches practice.

### SEO-17 · Origin prioritisation from Search Console
* **PROBLEM** — The D4 priority score cannot be computed; three of six components are missing.
* **USER STORY** — As the SEO lead, I need scored opportunities so I work on what will actually move.
* **SCOPE** — Export GSC Performance + Pages; identify pages ranking 5–20; compute G, D, C, F, U; record B from management; store in `seo_opportunities` with `isProvisional` false.
* **ACCEPTANCE CRITERIA** — Every opportunity carries all six components; none is an estimate; `isProvisional` is false only when all six exist.
* **DEPENDENCIES** — GSC access; volume source; CRM attribution (DEV-15)
* **PRIORITY** — **P0** *(this is Week 1 work)*
* **OWNER TYPE** — SEO
* **TEST PLAN** — Assert no stored opportunity has a null component while `isProvisional` is false; spot-check three scores by hand.

### SEO-18 · Baseline capture and storage
* **PROBLEM** — Without a stored baseline, every future improvement claim is unfalsifiable.
* **USER STORY** — As management, I want a dated baseline so month-4 targets are honest.
* **SCOPE** — Export and version: GSC 16 months (Performance, Pages, Sitemaps, **Generative AI**), GA4 12 months, CRM lead/application/enrolment counts.
* **ACCEPTANCE CRITERIA** — All exports stored with their retrieval dates; the AI report baseline captured (available worldwide since 31 Aug 2026); **no gap is interpolated**.
* **DEPENDENCIES** — GSC, GA4, CRM access
* **PRIORITY** — **P0**
* **OWNER TYPE** — SEO + CRM
* **TEST PLAN** — Assert each export opens and matches the date range; assert the retrieval date is recorded.

### SEO-19 · Internal-link hub-and-spoke build
* **PROBLEM** — Orphans risk; no documented linking rules are enforced.
* **USER STORY** — As a search engine, I need a clear hierarchy to understand the site.
* **SCOPE** — Implement IL-1…IL-8 across the country hubs, `/visa-changes`, and services; run AG-10 and fix every orphan.
* **ACCEPTANCE CRITERIA** — Zero orphans; ≥ 2 contextual inlinks per published URL; every spoke links to its hub and ≥ 1 commercial page; zero broken internal links.
* **DEPENDENCIES** — DEV-14, published pages
* **PRIORITY** — P1
* **OWNER TYPE** — SEO + CONTENT
* **TEST PLAN** — AG-10 run asserting IL-1…IL-8 all pass; link-graph export reviewed.

### SEO-20 · Original data report from ALO's own records
* **PROBLEM** — Nothing ALO publishes is uncopyable; authority stagnates.
* **USER STORY** — As the market, I want data about Bangladeshi student outcomes that doesn't exist anywhere else.
* **SCOPE** — One report from real CRM records with a stated methodology, sample size, and date range (D14 §14.3).
* **ACCEPTANCE CRITERIA** — Every figure traces to real records; methodology published; **small samples stated as small**; management approves publication; no individually identifiable student data.
* **DEPENDENCIES** — **DEC-6**, CRM access
* **PRIORITY** — P2
* **OWNER TYPE** — SEO + MGMT
* **TEST PLAN** — A named analyst reproduces each figure from the source data; privacy review confirms no identifiable data.

---

# DELIVERABLE 18 — RISK REGISTER (12 named risks)

Score: Likelihood (L) × Impact (I), each 1–5; **Score = L × I**.

| ID | Risk | L | I | Score | Mitigation | Owner | Trigger / early warning |
|---|---|---|---|---|---|---|---|
| **R-01** | **Stale immigration facts published.** A visa fee, maintenance figure or rule is published and silently becomes wrong | 4 | 5 | **20** | Claims Registry + Tier A same-day rule (D2 Rule 1.1) + AG-04/05/13 + mandatory effective-date display | SEO + FACT_CHECKER | Any claim past `nextReviewAt`; a Tier A hash change with no review opened |
| **R-02** | **Deployment parity not resolved (H2).** The live site does not serve the current app, so no SEO work can take effect | 3 | 5 | **15** | DEV-01 as the first action; business-visible escalation | OPS | Browser check of `/` fails; repo file count ≠ live page count |
| **R-03** | **Edge/WAF blocks crawlers and audit tools.** Crawling-based auditing is unreliable and findings misread as site defects | 4 | 3 | **12** | Identify the rule (DEC-5); whitelist the audit agent; verify Googlebot by reverse DNS (**never** by weakening protection) | OPS | 403/404 at scale from a known-good client |
| **R-04** | **NAP inconsistency persists.** DEC-1 unanswered, so three addresses remain live | 3 | 4 | **12** | DEC-1 as a management decision with a deadline; AG-14 refuses to run without ground truth | MGMT | Three addresses still present after Week 2 |
| **R-05** | **Scaled content abuse from overproduction.** Publishing the 100 topics as 100 pages | 3 | 5 | **15** | D8's Merge-dominant classification; the 12–18 article cap; AG-09 cannibalisation check; a named human author + substantive edit on every page | SEO + MGMT | Page count rising faster than lead count; template-shaped pages |
| **R-06** | **Human-review bottleneck.** No named expert available, so the gate blocks everything or is bypassed | 4 | 4 | **16** | Name the reviewer **before** Week 3; define a fallback reviewer; make the gate structurally unbypassable (DEV-14) so "temporarily skipping it" is not an available action | MGMT | Drafts queued in `HUMAN_REVIEW` > 5 days |
| **R-07** | **Claims Registry not built (DEC-7 withheld).** The entire anti-staleness design collapses to a spreadsheet | 3 | 5 | **15** | Treat DEC-7 as a P1 decision in Week 1; interim: a versioned spreadsheet with the same fields, migrated later | MGMT + CRM | DEC-7 unanswered by Week 2 |
| **R-08** | **Baseline access never granted.** No GSC/GA4/CRM access → no baseline → no honest targets, ever | 3 | 4 | **12** | Credential request in Week 1 with named owners; escalate in Week 2 | MGMT | Week 2 ends without access |
| **R-09** | **Holiday staffing gap.** 23 Dec–5 Jan spans the 1 Jan policy event with reduced capacity | 4 | 4 | **16** | Both policy pages published **before** 23 Dec, not on the day; schedule the on-the-day verification to a named person on call | MGMT | No named holiday owner by Week 8 |
| **R-10** | **Duplicate brand entity unresolved.** `alo-education.odoo.com` splits the entity and confuses citations | 3 | 3 | **9** | DEC-4: noindex + delink (low cost, reversible), or 301 | MGMT + OPS | Odoo URL still indexed in Week 4 |
| **R-11** | **An unsupported claim reaches the live site via AI drafting.** A draft's number is not traceable to an approved claim | 2 | 5 | **10** | AG-07 emits `[[CLAIM:id]]` for every factual statement; AG-08 blocks unreferenced numeric statements; DEV-14 makes `PUBLISHED` unreachable without both gates | AGENT + FACT_CHECKER | Any fact-check rejection pattern indicating a bypass |
| **R-12** | **Fabricated trust signals.** An invented counsellor credential, student story, review or visa result is published | 2 | 5 | **10** | Written consent per story and per counsellor; management attestation per credential; AG-08 checks for unsupported claims; explicit prohibition in D14 §14.6 | MGMT | Any story or profile lacking a consent record |

**Risks that must not be accepted at any score:** R-01, R-11, R-12. These are the three where the harm is to a student or to a person's trust, **not to a ranking**. They are mitigated structurally (database constraints, workflow gates, consent records), not by policy statements.

**Note on R-05 and R-11 together:** they are the same failure viewed from opposite ends — one produces too much unverified content, the other lets it through. The shared control is the gate in DEV-14.

---

# DELIVERABLE 19 — DEFINITION OF DONE

**No item is Done without evidence. "Done" means the evidence exists and is linked.**

## 19.1 Technical fix
- [ ] Reproduced the defect **before** the fix, with evidence (status code, header, or rendered output)
- [ ] Change merged and **verified in production** (not only locally)
- [ ] Post-fix evidence captured (status code, header, Rich Results Test, or measurement)
- [ ] No regression in status codes, canonicals, indexability, or CWV budget
- [ ] Sitemap reflects the change where URLs were involved
- [ ] A rollback path is documented and the previous state is recoverable

## 19.2 Content page
- [ ] Brief approved, including its **required-claims list**
- [ ] Every factual statement traceable to a `seo_claims` row; **zero unreferenced numbers**
- [ ] `IMMIGRATION_MONEY` / `IMMIGRATION_RULE` claims carry a **Tier A** source with **retrieval date and effective date displayed**
- [ ] Source Verification PASS; Fact-Check PASS; **human expert review PASS** for sensitive topics
- [ ] SEO QA PASS: one H1, title/meta unique and within length, structured data valid and not a retired type, no cannibalisation flag
- [ ] **≥ 2 contextual internal inlinks**; links to its hub and ≥ 1 commercial page; zero broken links
- [ ] Named author **and** named reviewer displayed, with a last-verified date
- [ ] Exactly one primary next step, relevant to the page's intent
- [ ] Meets the performance budget
- [ ] Image alt text accurate and human-reviewed (Google's 1 Oct 2026 guidance)
- [ ] `nextReviewAt` set from the D4 §4.4 freshness cycle
- [ ] Published by a `PUBLISHER`-role human; previous version retained

## 19.3 Policy update (a change to a published claim)
- [ ] The affected claim is identified by id; the source change is evidenced (hash diff or quotation)
- [ ] **Every page using that claim is located** (this is the step that is usually missed)
- [ ] New value sourced to Tier A with the retrieval date recorded
- [ ] **Old → new recorded in `seo_claim_verifications`**, including who verified it
- [ ] All dependent pages updated in the same release, not "later"
- [ ] If the old value was wrong, a correction note is published where the page is high-traffic
- [ ] `nextReviewAt` recalculated
- [ ] If the change affects a dated event, the event calendar is updated

## 19.4 New AI tool
- [ ] Registered in `AiAgentRegistry` with `agentCode`, `agentType`, version, and `promptTemplate`
- [ ] **Zod output contract** exists in `output-schemas.ts`; invalid output is **rejected, not coerced**
- [ ] Tool grants are explicit and match the §11.3 capability matrix exactly — **no ambient access**
- [ ] Human approval gate wired through the **existing** `approvals.ts` / `agentos/approval-transition.ts`, with separation of duties enforced (`canDecideApproval`)
- [ ] `GlobalAiPause` coverage verified: GLOBAL and AGENT scopes both halt it; **fail-closed on DB error**
- [ ] Every run logs to `seo_agent_runs` with input hash, output, status, cost, and approval
- [ ] Failure conditions from §11.2 implemented and **tested** (each one exercised)
- [ ] RBAC enforced server-side; **no role is read from a request body, prompt, or tool argument**
- [ ] Kill-switch test and malformed-output test both pass

## 19.5 CRM feature
- [ ] Schema migration applies cleanly and is reversible
- [ ] **Additive only** — no existing table dropped or column repurposed; `SeoOpportunity`/`SeoTask` and their existing UI remain functional
- [ ] Roles and permissions per D10 §10.3; `FACT_CHECKER` and `PUBLISHER` are different users
- [ ] Every state transition records **actor + timestamp + notes**; transitions lacking any are rejected
- [ ] Idempotency verified for every scheduled job (duplicate trigger = no-op)
- [ ] Cron jobs follow the repo contract: ran→200 / skipped_locked→423 / blocked→501 / failed→500; `success = status === 'ran'`; retries + dead-letter; declared in `CRON_JOBS.md`
- [ ] Tests cover the illegal-transition paths, not only the happy path
- [ ] No secret, token, or full database URL in code, logs, or docs

## 19.6 Analytics integration
- [ ] Property confirmed and receiving data **before** the change
- [ ] Conversion events fire exactly once per action (verified in debug mode)
- [ ] Attribution captured **at lead creation in the CRM**, not only in the browser
- [ ] Missing data recorded as `unknown` — **never interpolated, never defaulted to zero**
- [ ] Dashboard labels every unavailable metric `DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS`
- [ ] AI-visibility figures labelled **"AI Overviews + AI Mode combined (from 7 Sep 2026)"** and never added to sessions
- [ ] Baseline stored with its retrieval date before any target is set
- [ ] FAQ search-appearance filters removed from all reporting (support ended June/August 2026)
- [ ] Annotations recorded for every publication, fix, and known algorithm event

## 19.7 Backlink campaign
- [ ] The link is **genuinely earned** — a real relationship, a real asset, or a real correction
- [ ] **No payment, no exchange, no PBN, no undisclosed paid placement** — all links `rel="nofollow"`/`sponsored` if any consideration exists
- [ ] Any factual claim in the outreach is sourced, and the recipient can verify it
- [ ] No fabricated relationship or representation is claimed
- [ ] **No fabricated data, testimonial, review, or success rate** is used anywhere in the campaign
- [ ] The human sends every message; the agent drafts and tracks only
- [ ] The prospect and outcome are recorded in the tracker
- [ ] **No link to, or citation of, a self-published "top consultancy" list**
- [ ] If a partner is mentioned, the relationship's nature is stated accurately

---

## Closing note

Every deliverable in this set is built on one premise: **ALO's own promise is "no hidden fees, no false promises," and four live pages currently contradict it.**

The 90-day system's purpose is not to publish more — it is to make ALO's accuracy **provable**: every figure dated and sourced, every counsellor real, every story consented, every address existing once.

That is also what Google's own guidance now asks for, and what AI answer engines cite. **For this particular brand, honesty is not just the positioning — it is the SEO strategy.** Where the evidence was missing, this plan says so and names the exact access needed, because a plan built on invented numbers would fail the same test it was written to pass.
