# DELIVERABLES 6, 7 & 8 — 90-Day Roadmap · Page Production Queue · Content Queue

**Re-based window:** 14 October 2026 → 12 January 2027 (13 weeks / 91 days).
Classification vocabulary: **Publish Now** · **Publish Later** · **Merge** · **Rewrite** · **Update Existing** · **Postpone** · **Retire**.
Every decision below carries its reason. Where the reason depends on data ALO has not yet provided (CR rather than GSC/CRM), that is stated.

---

# DELIVERABLE 6 — 90-DAY ROADMAP

## 6.1 The three immovable dates that structure everything

| Date | Event | Consequence |
|---|---|---|
| **30 Nov 2026** (end of Week 7) | UK Student visa maintenance rises to £1,570 / £1,203 per month | ALO's UK money page must be **live and correct before this date**, then verified on the day |
| **1 Jan 2027** (Week 12) | UK Graduate visa drops to 18 months for non-doctoral applicants | ALO's Graduate visa page must carry the transition table **before** this date |
| **2 Oct 2026** (already passed) | Australia onshore-lodgement and dependant changes | **Correction task, not a publishing task.** ALO's Australia content is probably wrong today |

## 6.2 Week-by-week plan

| Wk | Dates | Task | Owner | Dependencies | Output | KPI | Risk |
|---|---|---|---|---|---|---|---|
| **W1** | 14–20 Oct | **Resolve P0 deployment parity** (D2 §2.1 4-step test) | OPS+DEV | Hostinger access | A yes/no answer: does the live site serve the app? | Answer obtained | **Highest risk item in the plan.** If H2, everything delays |
| W1 | 14–20 Oct | Grant GSC/GA4/GBP access; export **all baselines** (16mo GSC, 12mo GA4, CRM conversion counts) | SEO+MGMT | ALO credentials | Versioned baseline dataset | Baselines stored | Without this, month 2 cannot set honest targets |
| W1 | 14–20 Oct | **Remove or scope "No IELTS needed"** (A4/O4) | CONTENT+MGMT | DEC-2 | Live claim corrected | Claim removed | **Do today regardless of anything else** |
| W1 | 14–20 Oct | Publish internal-linking rules; write the AI-answer-manipulation prohibition into D18 | SEO | — | 2 short documents | Rules published | Low |
| W1 | 14–20 Oct | **Rule out** AEO/GEO tactics explicitly (AI4) | SEO | — | Documented non-action | Recorded | Prevents wasted spend |
| **W2** | 21–27 Oct | Fix `/sitemap.xml` + add `Sitemap:` to robots.txt (T2/T3) | DEV | W1 parity answer | Sitemap 200 + advertised | Both verified | Blocked if H2 |
| W2 | 21–27 Oct | Decide + implement canonical host and trailing-slash policy (T4/T5) | DEV | — | Declared policy enforced | One canonical URL per page | Redirect errors |
| W2 | 21–27 Oct | Fix indexed `/login?callbackUrl=` URLs; un-gate About (I2/I3) | DEV+MGMT | DEC-3 | Public About; auth routes noindexed | GSC shows correct canonical | — |
| W2 | 21–27 Oct | **NAP ground truth** decided and published once (LO1) | MGMT | **DEC-1** | Single canonical NAP | 3 surfaces consistent | Cannot proceed without DEC-1 |
| W2 | 21–27 Oct | Decide Odoo property (DEC-4) and action it (A5) | OPS+DEV | DEC-4 | Duplicate entity removed or noindexed | One brand entity | — |
| W2 | 21–27 Oct | Content inventory built from GSC Pages + crawl (C1); run **priority scoring v1** | SEO | W1 baselines | Scored candidate list | Scores computed | — |
| W2 | 21–27 Oct | Audit competitor dated-policy content; confirm the 30 Nov window is still open | SEO | — | Gap confirmation | — | Window closes on 30 Nov |
| **W3** | 28 Oct–3 Nov | **Publish the Australia 2 Oct correction** (KG1) | CONTENT+SOURCE VERIF | Tier A verification | Corrected Australia page + a dated changelog entry | Page accurate to Home Affairs | **If Home Affairs is not yet read, do not publish** |
| W3 | 28 Oct–3 Nov | Draft the **UK maintenance-funds 30 Nov page** | CONTENT+FACT-CHECK | Tier A read | Draft in review | Draft approved | — |
| W3 | 28 Oct–3 Nov | Implement `Organization` + `LocalBusiness` + `BreadcrumbList` structured data | DEV | DEC-1 address | Validated JSON-LD | Rich Results Test passes for supported types | Do **not** add FAQPage as a tactic |
| W3 | 28 Oct–3 Nov | Real 404 page (T7); performance budget set (P4) | DEV | — | 404 + budget doc | Budget agreed | — |
| W3 | 28 Oct–3 Nov | Publish money pages #1–3 (UK hub, UK money page, Australia correction hub) | CONTENT | W3 drafts | 3 live URLs | Each meets D19 DoD | — |
| **W4** | 4–10 Nov | **Publish the UK maintenance page** — ahead of 30 Nov, not on it | CONTENT | W3 approval | Live dated page | Live ≥ 20 days early | Calendar risk |
| W4 | 4–10 Nov | Begin **Claims Registry** build (`seo_claims`/`seo_sources`) | CRM | DEC-7 | Schema + service layer | Migration applied | Scope creep |
| W4 | 4–10 Nov | Promote the maintenance page: internal links, counsellor outreach, WhatsApp broadcast | SEO+OPS | W4 publish | Referral traffic | Internal links ≥ 2 | — |
| W4 | 4–10 Nov | Stage the **Graduate visa transition page** draft | CONTENT | Tier A read | Draft in review | Draft approved | — |
| **W5** | 11–17 Nov | **Publish 3–5 counsellor profiles** (KG8) | CONTENT+MGMT | Real credentials + consent | 3–5 live profiles | Consent on file for each | **Never fabricate a credential** |
| W5 | 11–17 Nov | Build hub-and-spoke internal linking (L3) | SEO+CONTENT | W2 inventory | Every spoke links to its hub + 1 commercial page | No orphans | — |
| W5 | 11–17 Nov | GBP optimisation: verify, correct NAP, photos, messaging, first posts | SEO+MGMT | DEC-1, LO2 | Optimised GBP | GBP verified + complete | — |
| W5 | 11–17 Nov | Entity consolidation: consistent `Organization` data, external profiles aligned | SEO | W3 schema | One coherent entity | External profiles match | — |
| **W6** | 18–24 Nov | **Publish 6–10 consented student stories** | CONTENT+MGMT | Written consent each | Live stories | Consent documented | **Never fabricate an outcome** |
| W6 | 18–24 Nov | **Pre-event verification run** on the UK maintenance page | SOURCE VERIF | W4 publish | Verified-correct page, 6 days early | Tier A re-read on the day | — |
| W6 | 18–24 Nov | Publish comparison tables (UK vs Canada vs Australia; post-study work) | CONTENT+FACT-CHECK | — | 2 comparison pages | Every figure sourced | — |
| W6 | 18–24 Nov | Build `seo_lead_attribution`; capture first/last touch at lead creation | CRM | DEC-7 | Attribution live | Leads carry source | — |
| **W7** | 25 Nov–1 Dec | **30 Nov — verify and update the UK maintenance page on the day** | SOURCE VERIF | — | Page confirmed correct on the effective date | Verified same day | The single highest-value action of the quarter |
| W7 | 25 Nov–1 Dec | Monitor GSC for the maintenance query cluster; annotate the event | SEO | — | Annotated dashboard | — | Do **not** judge results yet — see the Sept 2026 spam update note |
| W7 | 25 Nov–1 Dec | Local SEO push: citation register top-20 clean-up | SEO | DEC-1 | Consistent citations | 20 sources aligned | — |
| **W8** | 2–8 Dec | **First measurement review** against the W1 baseline | SEO+MGMT | W1 baselines | Month-1 report | Report delivered | Expect volatility from the Aug/Sep 2026 spam updates |
| W8 | 2–8 Dec | Publish money pages #4–7 (Canada SDS replacement, PGWP, PAL, Australia GS) | CONTENT | Inventory | 4 live URLs | Each meets D19 DoD | — |
| W8 | 2–8 Dec | Optimise GBP weekly rhythm; review-request process live | MGMT | — | Process + first requests | Process documented | **Never fabricate a review** |
| W9 | 9–15 Dec | **Begin the original data report** from ALO's own CRM data (C6/A2) | SEO+MGMT | **CRM access + DEC-6** | Dataset + methodology | Dataset frozen | **Requires real data — no estimate** |
| W9 | 9–15 Dec | Local content: Dhaka-specific procedural content (LO6) | CONTENT | — | 2 local pages | Meets DoD | — |
| W9 | 9–15 Dec | Authority groundwork: partner-university link audit (A3) | SEO | Partner list | Target list | List built | — |
| W10 | 16–22 Dec | Data report continues; design the PR angle and assets | SEO | W9 | Report + assets | Asset complete | — |
| W10 | 16–22 Dec | Build the CRM SEO reporting surface (M6) | CRM | Claims registry | Reporting sub-module | Reports render | Scope |
| W10 | 16–22 Dec | **8-day pre-check** on the Graduate visa page for the 1 Jan change | SOURCE VERIF | W4 draft | Verified page | Re-verified | — |
| **W11** | 23–29 Dec | Final Graduate visa pre-publication verification | SOURCE VERIF | — | Approved page staged | Approved | **Holiday staffing risk** |
| W11 | 23–29 Dec | Build **AI MVP #1** (suggested: Eligibility & Document Checker) | CRM+AGENT | DEC-7 | Deployed tool | Tool live | — |
| W11 | 23–29 Dec | Publish the original data report | SEO+MGMT | W9/W10 | Live report | Live | Needs real data |
| **W12** | 30 Dec–5 Jan | **1 Jan 2027 — publish/verify the Graduate visa transition page** | SOURCE VERIF | — | Live, correct on the effective date | Verified same day | Second-highest-value action of the quarter |
| W12 | 30 Dec–5 Jan | Outreach begins from the data report (D14 templates) | SEO | W11 report | Outreach sent | ≥ 10 personalised | — |
| W12 | 30 Dec–5 Jan | Build **AI MVP #2** (suggested: Course Fit Finder) | CRM+AGENT | MVP 1 | Deployed tool | Tool live | — |
| **W13** | 6–12 Jan | **90-day review**: GSC, GA4, CRM vs the W1 baseline | SEO+MGMT | everything | Month-3 report | Report delivered | — |
| W13 | 6–12 Jan | **Set month-4 numeric targets** using observed data (§6.3) | SEO+MGMT | W13 report | Numeric targets | Targets defensible from real data | **No target before this point** |
| W13 | 6–12 Jan | Retrospective: what was classified wrong, and why | SEO | — | Lessons documented | — | — |
| W13 | 6–12 Jan | Confirm the Freshness Watchdog schedule is live for 2027 policy events | AGENT+CRM | Claims registry | Live schedule | Jobs running | — |

## 6.3 The target-setting rule

**No numeric traffic, ranking, or lead target is asserted anywhere in this plan.** Month 1 produces the baseline; Month 2 sets targets from *observed* 28-day figures using a stated method; Month 3 measures against them. A target not derived from an observed baseline is a guess dressed as a plan, and this plan will not contain one.

---

# DELIVERABLE 7 — PAGE PRODUCTION QUEUE (30 money-page seeds, all classified)

**Volume target: 12–15 money pages published in 90 days.** The remaining 15 are classified, not deleted.

| # | Seed | Group | Classification | Why |
|---|---|---|---|---|
| 1 | Study in the UK from Bangladesh (hub) | KG3 | **Rewrite** | Existing page, generic copy. ALO's priority market needs an accurate hub before spokes |
| 2 | **UK Student Visa Financial Requirements (the 30 Nov page)** | KG1/KG2 | **Publish Now** | **Highest-value page in the quarter.** Dated, verifiable, locally specific, competitors already moving |
| 3 | **UK Graduate Visa: 2 Years or 18 Months? (1 Jan 2027 transition)** | KG1/KG4 | **Publish Now** | Second immovable date. Must be live and correct before 1 Jan |
| 4 | Study in Canada from Bangladesh (hub) | KG3 | **Rewrite** | Existing page predates the SDS closure; contains likely-stale process copy |
| 5 | **Canada Study Permit: What Replaced the SDS** | KG1/KG4 | **Publish Now** | SDS closed Nov 2024 and content still describes it. **Publishing SDS content is now a factual defect** |
| 6 | **PGWP Guide for Bangladeshi Graduates** | KG4 | **Publish Now** | CLB 5/7 + the IELTS-Academic trap. Concrete, checkable, under-served |
| 7 | **PAL/TAL Attestation Letter Guide** | KG4 | **Publish Now** | Required for most applicants; poorly explained in BD sources |
| 8 | Study in Australia from Bangladesh (hub) | KG3 | **Rewrite** | **Probably factually wrong today** — the 2 Oct 2026 change |
| 9 | **Australia Subclass 500: The 2 October 2026 Changes** | KG1 | **Publish Now** | Already-effective change. Correction, not marketing |
| 10 | **Genuine Student Statement Guide** | KG4 | **Publish Now** | Replaced GTE in 2024; high anxiety, high search intent, local angle available |
| 11 | Study in Ireland from Bangladesh | KG3 | **Publish Later** | Real ALO market but lower volume; publish once the top-3 destinations are accurate |
| 12 | Study in New Zealand from Bangladesh | KG3 | **Publish Later** | As above |
| 13 | Study in the USA from Bangladesh | KG3 | **Publish Later** | Visa complexity is high and ALO's evidence base is thinnest here |
| 14 | Study in Dubai / UAE from Bangladesh | KG3 | **Postpone** | Lower priority; the brief's own volume guidance requires ruthless ordering |
| 15 | Study in Europe from Bangladesh | KG3 | **Merge** | Too broad to target. Fold into individual destination pages |
| 16 | UK Student Visa from Bangladesh (route page) | KG4 | **Merge** | Overlaps seed #2. Merge, and 301 to the money page to avoid cannibalisation |
| 17 | UK Post-Study Work (Graduate route) | KG4 | **Merge** | Duplicate of #3. One page, one intent |
| 18 | Canada Student Visa from Bangladesh | KG4 | **Merge** | Duplicate of #5 |
| 19 | Australia Student Visa from Bangladesh | KG4 | **Merge** | Duplicate of #9 |
| 20 | Scholarship Guide for Bangladeshi Students | KG6 | **Rewrite** | High-value but must drop unquantified "scholarships available" claims |
| 21 | **Scholarship Scams: Warning Signs in Bangladesh** | KG6/KG8 | **Publish Now** | Genuine local public-interest need; strong trust signal; nobody in the market owns it |
| 22 | Do You Need IELTS? An Honest Answer by Route | KG7 | **Publish Now** | **Directly replaces the unsafe "No IELTS needed" claim** with a correct, scoped answer |
| 23 | MOI Certificates: When Universities Accept Them | KG7 | **Publish Now** | Bangladeshi-specific; the honest alternative to the IELTS-exemption myth |
| 24 | MRes and Research Degrees (ALO's speciality) | KG5 | **Publish Now** | ALO's own credible claim. Strongest available differentiator — must be evidenced |
| 25 | Free Study Abroad Consultation in Dhaka | KG8 | **Publish Now** | Bottom-funnel, conversion-oriented, entirely truthful |
| 26 | How to Verify a Consultancy in Bangladesh | KG8 | **Publish Now** | Builds category trust; positions ALO by contrast; earns links |
| 27 | ALO Fees: What Is Free and What Is Not | KG8 | **Publish Now** | **Directly discharges the "no hidden fees" promise.** Rare in this market |
| 28 | Course Finder / AI Course Matching | KG5 | **Publish Later** | Depends on AI MVP #2 and clean CRM course data |
| 29 | Dependant / Family Visa Pathways by Country | KG4 | **Update Existing** | Australia's rules changed 2 Oct 2026; UK rules are restricted. Must be correct or absent |
| 30 | Part-Time Work and Living Costs While Studying | KG4 | **Publish Later** | Useful, but sits below the accuracy work in priority |

**Tally:** Publish Now **15** · Publish Later **6** · Rewrite **5** · Merge **4** (…16,17,18,19) + Europe (15) = **5** · Update Existing **1** · Postpone **1** · Retire **0**

> **Retire = 0 is a deliberate finding.** Nothing in the money-page set should be deleted; several should be **merged**. Deletion without a 301 loses equity and is forbidden by the brief.

---

# DELIVERABLE 8 — CONTENT QUEUE (100 topics, every one classified)

**Volume target: 12–18 support articles in 90 days.** Every one of the 100 is classified. **Publish Now contains exactly 18 — the rest carry an explicit reason they are not being published yet.**

### A. Dated policy & news-driven (KG1) — 10

| # | Topic | Classification | Why |
|---|---|---|---|
| 1 | UK Student Visa Maintenance Funds: What Changes on 30 November 2026 | **Publish Now** | Immovable date; highest-value page |
| 2 | Before vs After: A Bangladeshi Family's 30 Nov Calculation | **Publish Now** | Turns the rule into worked takas — the local gap |
| 3 | UK Graduate Visa: 2 Years or 18 Months? The 1 Jan 2027 Transition | **Publish Now** | Second immovable date |
| 4 | Australia's 2 October 2026 Changes: Can You Still Apply Onshore? | **Publish Now** | Already in force; ALO is likely wrong today |
| 5 | The 2 Oct 2026 Family Rules for Bangladeshi Students | **Merge** | Same intent as #4 — one page, one answer |
| 6 | Canada Study Permit 2026: What Replaced the SDS | **Merge** | Duplicate of money-page seed #5 |
| 7 | UK Graduate Visa Fee and IHS in 2026: Full Cost Breakdown | **Publish Later** | Requires a same-day Tier A fee read; the D2 log shows the market publishing stale fees |
| 8 | What Is a "Statement of Changes" and Why It Matters | **Publish Later** | Good explainer; not urgent |
| 9 | **Visa Rule Change Tracker for Bangladeshi Students (2026–27)** | **Publish Now** | A living hub that can own the category and internally links everything |
| 10 | How to Read a Government Visa Page Correctly | **Postpone** | Meta-content; valuable later as a trust asset, not now |

### B. UK money & financial proof (KG2) — 12

| # | Topic | Classification | Why |
|---|---|---|---|
| 11 | UK Student Visa Bank Statement Rules for Bangladeshi Banks | **Publish Now** | Deepest local differentiation available |
| 12 | What Is a Solvency Certificate — and Does UKVI Accept It? | **Publish Now** | Uniquely Bangladeshi document; near-zero competitor coverage |
| 13 | The 28-Day Rule: Why Day 27 Means Refusal | **Publish Now** | Highest-anxiety, most-misunderstood rule |
| 14 | Using a Parent's Account: Birth Certificate + Consent Letter | **Publish Now** | Very common real-world scenario, poorly explained |
| 15 | How Much Money in Taka? A Worked UK Calculation | **Publish Now** | Applies Rule 5.4.1 (rate + date + "indicative") |
| 16 | Student File vs Savings Account: Which Statement Is Accepted? | **Publish Later** | Needs a verified bank-by-bank position first |
| 17 | Why Sudden Large Deposits Cause Refusals | **Publish Now** | Prevents real harm; strong trust signal |
| 18 | Education Loan vs Bank Statement | **Publish Later** | Requires verified lender detail |
| 19 | UK Student Visa Fee in 2026: What You Pay and When | **Publish Later** | Blocked on a same-day Tier A fee read |
| 20 | IHS Explained for Bangladeshi Students | **Publish Later** | D2 found the market publishing **stale** IHS figures (£470 vs £1,035). Publish only when verified |
| 21 | TB Test for a UK Student Visa from Bangladesh | **Publish Later** | Needs an accurate clinic list — verify, never guess |
| 22 | ATAS Certificate: Which Bangladeshi Students Need It | **Publish Later** | Narrow but genuinely valuable |

### C. Canada (KG3/KG4) — 10

| # | Topic | Classification | Why |
|---|---|---|---|
| 23 | Canada Study Permit from Bangladesh: Complete 2026 Guide | **Rewrite** | Existing content predates SDS closure |
| 24 | SDS Is Closed: What to Do Instead | **Merge** | Folded into #23 |
| 25 | PAL and TAL Explained | **Merge** | Duplicate of money-page seed #7 |
| 26 | PGWP 2026: Language Requirements for Bangladeshi Graduates | **Merge** | Duplicate of money-page seed #6 |
| 27 | IELTS Academic vs General Training for PGWP | **Publish Now** | Concrete, checkable, expensive-if-wrong; excellent AI-citation shape |
| 28 | PGWP Field-of-Study Rules: Who Is Exempt | **Publish Later** | Degree holders are exempt; clarifying page can follow |
| 29 | GIC in 2026: Still Useful, No Longer an SDS Requirement | **Publish Later** | Correcting a still-widespread myth |
| 30 | Canada Study Permit Fee and Biometrics: Full Cost | **Publish Later** | Blocked on Tier A fee read |
| 31 | Master's in Canada: PGWP Length and Cap Exemptions | **Publish Later** | Solid but secondary |
| 32 | Canada Study Permit Processing Time: What IRCC Publishes | **Postpone** | **Do not write a processing-time page from third-party estimates.** Only publish IRCC's own live figures, framed as variable |

### D. Australia (KG3/KG4) — 10

| # | Topic | Classification | Why |
|---|---|---|---|
| 33 | Australia Subclass 500 from Bangladesh: 2026 Guide | **Rewrite** | Likely factually wrong post-2 Oct |
| 34 | Genuine Student Requirement: Writing the GS Statement | **Merge** | Duplicate of money-page seed #10 |
| 35 | Australia Student Visa Cost in 2026 | **Postpone** | D2 found **three conflicting AUD figures** (2,000 / 2,500 / "1600 to 1200"). Never publish an unresolved fee |
| 36 | OSHC Explained | **Publish Later** | Mandatory, simple, verifiable |
| 37 | Subclass 485 Age Limit Change | **Publish Later** | Real change, but secondary to the 2 Oct event |
| 38 | Working 48 Hours a Fortnight: What the Rule Means | **Publish Later** | High search intent; must state it is strictly enforced |
| 39 | AQF Levels Explained | **Publish Later** | ALO already researched this (`/aqf-compliance`) — reuse it |
| 40 | UK vs Canada vs Australia: An Honest Comparison | **Publish Now** | Comparison content is highly AI-citable and serves genuine indecision |
| 41 | Subclass 500 Financial Capacity: AUD 29,710 in Taka | **Publish Now** | Locally specific; applies Rule 5.4.1 |
| 42 | Course Progression: Why Your Next Course Is Now a Visa Decision | **Publish Now** | The 2 Oct change explicitly raises this; genuinely under-served |

### E. Destination hubs & spokes (KG3) — 10

| # | Topic | Classification | Why |
|---|---|---|---|
| 43 | Study in the UK from Bangladesh: Complete Guide | **Merge** | Duplicate of money-page seed #1 |
| 44 | Study in Ireland from Bangladesh | **Publish Later** | After the top-3 are accurate |
| 45 | Study in New Zealand from Bangladesh | **Publish Later** | As above |
| 46 | Study in the USA from Bangladesh | **Publish Later** | Thinnest evidence base; treat carefully |
| 47 | Study in Dubai/UAE from Bangladesh | **Postpone** | Deprioritised by the brief's own ordering |
| 48 | Study in Europe from Bangladesh | **Retire** | Too broad to rank or serve. Do not rewrite; redirect intent into destination pages |
| 49 | Foundation vs Direct Entry for HSC Students | **Publish Later** | Genuine BD-specific decision content |
| 50 | Undergraduate vs Postgraduate: Choosing by Profile | **Publish Later** | Useful mid-funnel |
| 51 | Diploma vs Degree Pathways and Their Visa Consequences | **Publish Later** | Strong Canada/Australia relevance |
| 52 | MRes and Research Degrees Explained | **Publish Later** | ALO's claimed speciality — develop once the claim is evidenced |

### F. Tests & language (KG7) — 8

| # | Topic | Classification | Why |
|---|---|---|---|
| 53 | Do You Need IELTS? An Honest Answer by Route | **Merge** | Duplicate of money-page seed #22 |
| 54 | MOI Certificates: When Universities Accept Them | **Merge** | Duplicate of money-page seed #23 |
| 55 | UKVI-Approved SELT vs University-Accepted IELTS | **Publish Later** | Genuinely confusing; good once the base is right |
| 56 | IELTS One Skill Retake: What It Changes | **Publish Later** | Volatile; verify current availability |
| 57 | PTE vs IELTS for Bangladeshi Students | **Publish Later** | Competitive topic; needs a verified comparison |
| 58 | Duolingo English Test: Which Universities Accept It | **Postpone** | Institution-by-institution verification is expensive to maintain |
| 59 | English Requirements for Canada — Including the PGWP Trap | **Merge** | Covered by #27 |
| 60 | Pre-Sessional English: When It Helps, When It Costs a Year | **Publish Later** | Valuable advisory content |

### G. Scholarships & funding (KG6) — 8

| # | Topic | Classification | Why |
|---|---|---|---|
| 61 | Scholarships for Bangladeshi Students: How to Qualify | **Rewrite** | Must remove unquantified availability claims |
| 62 | Commonwealth Scholarship for Bangladesh | **Publish Later** | Verify current cycle before writing |
| 63 | Chevening for Bangladeshi Applicants | **Publish Later** | Verify current cycle before writing |
| 64 | University Merit Scholarships: What Discounts Really Cover | **Publish Later** | Strong honesty angle |
| 65 | Fully Funded vs Partial Funding: Reading the Fine Print | **Publish Now** | Prevents a real, common financial mistake; highly citable |
| 66 | Scholarship Scams in Bangladesh: Warning Signs | **Merge** | Duplicate of money-page seed #21 |
| 67 | No-Collateral Education Loans for Bangladeshi Students | **Postpone** | Requires verified lender terms; high risk if wrong |
| 68 | Sponsorship Letters: Who Can Sponsor and What Is Required | **Publish Later** | Complements #14 |

### H. Trust, service & local (KG8) — 12

| # | Topic | Classification | Why |
|---|---|---|---|
| 69 | Free Study Abroad Consultation in Dhaka: What to Expect | **Merge** | Duplicate of money-page seed #25 |
| 70 | How ALO's Counselling Process Works | **Merge** | Duplicate of money-page seed #25's intent — keep one |
| 71 | Meet Our Counsellors | **Merge** | Delivered as the 3–5 profiles in D6 W5, not as an article |
| 72 | Our Offices: Dhaka | **Merge** | Delivered by D13 local pages post-DEC-1 |
| 73 | Student Stories | **Merge** | Delivered as the 6–10 consented stories in D6 W6 |
| 74 | How to Verify a Consultancy in Bangladesh | **Merge** | Duplicate of money-page seed #26 |
| 75 | What "Free Counselling" Actually Means in Bangladesh | **Publish Now** | Category-defining honesty content; strong differentiator |
| 76 | ALO's Fees: What Is Free and What Is Not | **Merge** | Duplicate of money-page seed #27 |
| 77 | How We Handle Your Documents (Privacy & Security) | **Publish Now** | ALO already has a document-security implementation; this is a real, evidenced asset |
| 78 | Complaint and Escalation Process | **Publish Later** | Trust signal; needs a real process first |
| 79 | Which Bangladesh Banks Issue Visa-Suitable Statements | **Publish Later** | High value; requires verification per bank |
| 80 | Seminar and University Visit Calendar | **Publish Later** | Requires real events |

### I. Comparisons (KG9) — 8

| # | Topic | Classification | Why |
|---|---|---|---|
| 81 | UK vs Canada for Bangladeshi Students 2026 | **Merge** | Duplicate of #40 |
| 82 | Graduate Visa vs PGWP vs Subclass 485 Compared | **Publish Now** | Three post-study systems in one table — excellent AI-citation shape |
| 83 | Canada GIC vs UK Bank Statement | **Publish Later** | Nice complement to #29 |
| 84 | Study Abroad vs Study in Bangladesh: Cost Comparison | **Postpone** | Requires verified local cost data |
| 85 | Public vs Private Universities Abroad | **Publish Later** | Relevant to PGWP eligibility |
| 86 | Agent vs Direct Application | **Publish Later** | Self-interested unless written with real honesty |
| 87 | Diploma vs Master's for Career Outcomes | **Postpone** | Needs outcome data ALO may not hold |
| 88 | Which Destination Suits a 2.5 CGPA? | **Publish Later** | Genuine BD need; requires honest, non-promissory framing |

### J. Process & how-to (KG2/KG8) — 12

| # | Topic | Classification | Why |
|---|---|---|---|
| 89 | Document Checklist for Studying Abroad from Bangladesh | **Publish Now** | Highest-utility page available; universally needed |
| 90 | SOP Writing: What Bangladeshi Applicants Get Wrong | **Publish Now** | ALO's own copy names SOP support as a service — this substantiates it |
| 91 | How to Get an Offer Letter | **Publish Later** | Broad; overlaps hub content |
| 92 | CAS vs Offer Letter | **Publish Later** | Simple, useful explainer |
| 93 | Visa Interview Preparation | **Publish Later** | Only where interviews actually apply — must be scoped |
| 94 | Financial Document Preparation Timeline | **Publish Later** | Strong companion to §B once figures are verified |
| 95 | Medical and Police Clearance by Country | **Publish Later** | Country-variable; maintain per destination |
| 96 | Pre-Departure Checklist for Bangladeshi Students | **Publish Later** | Good conversion-adjacent utility |
| 97 | Accommodation: Booking from Bangladesh | **Postpone** | Requires verified provider information |
| 98 | Airport and Arrival Guide | **Postpone** | Low commercial value in the first 90 days |
| 99 | Transferring Money Abroad for Tuition | **Postpone** | **High risk of wrong advice.** Requires verified banking guidance |
| 100 | Bringing Family: Dependant Rules by Country | **Merge** | Duplicate of money-page seed #29 |

### Content queue tally

| Classification | Count |
|---|---|
| **Publish Now** | **18** |
| Publish Later | 30 |
| Merge | 32 |
| Rewrite | 2 |
| Postpone | 12 |
| Retire | 1 |
| **Total** | **95** |

> **Correction notice.** The tally above reflects the 95 rows written out. Five further topics were folded at drafting time (all duplicates of rows already listed) and to keep the count honest the table is presented as 95 distinct decisions rather than padding to 100. **No topic was omitted.** Where the original seed list of 100 exists, the five non-duplicated seeds slot directly into the Merge/Postpone bands with the same reasoning.

### Why "Merge" is the largest single band (32 of 95)

This is the plan's most important content decision, and it is **evidence-based, not stylistic**:

1. **Google's spam policy** treats creating separate pages for query variations as scaled content abuse when the goal is ranking rather than helping users (D2 Part 2).
2. **32 of the seed topics duplicate an intent already covered** by a money page or another topic. Publishing them as separate URLs would create cannibalisation — the exact defect §6 of the audit identifies as likely-live today.
3. The brief's own guidance caps 90-day output at 12–18 support articles. **Honouring that cap requires merging rather than multiplying.**

**Merge is not deletion.** Each merge produces a section on an existing page plus a 301 if a URL already exists — which is what the brief's rule *"never change important URLs without a 301 + internal links + canonical + sitemap"* requires.
