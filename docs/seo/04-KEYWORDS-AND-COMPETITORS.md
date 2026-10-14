# DELIVERABLES 4 & 5 — Keyword Intelligence Map · Competitor Gap Matrix

> **INTEGRITY NOTE (read first).** The brief refers to *"the supplied 30 pages, 100 topics and 9 keyword groups."* **Those literal lists are not present in my working context.** Rather than stall, this document delivers a **complete, evidence-derived equivalent**: 9 keyword groups, a 30-item money-page queue (D7), and a 100-item content queue (D8), every one of which is classified. Any original seed list maps 1:1 into these structures without rework.
>
> **No search volume, difficulty, CPC, or traffic figure appears below.** Where a metric belongs, the cell reads `DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS`. The scoring model is fully specified so that it becomes computable the moment GSC and a volume source are connected — see §4.3.

---

# DELIVERABLE 4 — KEYWORD INTELLIGENCE MAP

## 4.1 How this map was built (method, not opinion)

Since no volume data exists, priority is derived from **five observable signals**, each of which was verified in D2:

| Signal | What it means | Evidence source |
|---|---|---|
| **S1 — Policy-event demand** | An officially dated change forces people to search for the new rule | D2 Part 1 (verified effective dates) |
| **S2 — Competitor coverage** | Independent publishers are actively targeting the theme | D2 + §5 below (Tier D — positioning only) |
| **S3 — Local specificity gap** | The query requires Bangladeshi context that generic pages cannot supply | D2 §Part 3, market research |
| **S4 — Existing site position** | ALO may already rank 5–20 for the query | **GSC required** — currently unavailable |
| **S5 — CRM conversion evidence** | The query produces enrolments for ALO | **ALO's CRM required** — currently unavailable |

**S1–S3 are known today. S4–S5 are the two highest-weighted components of the score and are currently unavailable.** That is precisely why Week 1 of the roadmap is baseline extraction.

## 4.2 The nine keyword groups

Each group is defined by **search intent**, not by keyword string, because intent determines the page type — and page type determines whether a page should exist at all.

| # | Group | Intent | Funnel stage | Demand type | Page type required | Data status |
|---|---|---|---|---|---|---|
| **KG1** | **Dated policy change** | "What are the rules *now*, and when do they change?" | Consideration → Decision | **Event-driven, spiky, highest value** | Dated comparison page with a before/after table | S1 verified · volume `DATA NOT AVAILABLE` |
| **KG2** | **Financial proof & money logistics** | "How much money, held how, from which bank, in whose name?" | Decision | **High-intent, conversion-adjacent** | Deep procedural page + worked Bangladeshi examples | S3 gap confirmed · volume `DATA NOT AVAILABLE` |
| **KG3** | **Country-destination hub** | "Study in {country}" | Awareness → Consideration | Broad head terms | Country hub + spoke articles | S2 competitor-saturated · volume `DATA NOT AVAILABLE` |
| **KG4** | **Visa route & post-study work** | "Student visa / Graduate visa / PGWP / 485" | Consideration → Decision | **High intent, high risk of staleness** | Route page with eligibility + effective dates | S2 active · volume `DATA NOT AVAILABLE` |
| **KG5** | **University & course selection** | "Which university/course for my profile?" | Consideration | Mid-funnel, profile-dependent | Course finder + programme pages (CRM-backed) | S2 · volume `DATA NOT AVAILABLE` |
| **KG6** | **Scholarships & funding** | "How do I pay for it?" | Consideration | High emotional intent | Scholarship guide + eligibility reality-check | S2 · volume `DATA NOT AVAILABLE` |
| **KG7** | **Test & language requirements** | "IELTS required? What score? Any exemption?" | Awareness → Consideration | Volatile — institution-specific | Test-requirement page with an exemption explainer | S2 · volume `DATA NOT AVAILABLE` |
| **KG8** | **Trust, process & local service** | "Is this consultancy real, local, and safe?" | Decision | **Bottom-funnel, conversion-critical** | About, counsellor profiles, student stories, office pages, verified reviews | S3 **major gap — see D2 §3** · volume `DATA NOT AVAILABLE` |
| **KG9** | **Comparisons & alternatives** | "UK vs Canada vs Australia", "GIC vs bank statement" | Consideration | Comparative, cite-friendly | Honest comparison tables with an explicit "who this suits" column | S2 · volume `DATA NOT AVAILABLE` |

## 4.3 The priority score — mathematics

**Score = 0.25·G + 0.20·D + 0.20·C + 0.15·B + 0.10·F + 0.10·U** · each component ∈ [0,100] · Score ∈ [0,100]

| Term | Component | Definition (exact) | Current availability |
|---|---|---|---|
| **G** | GSC opportunity (25%) | For a candidate page: `G = 100 × (I_b / I_max) × P` where `I_b` = 28-day impressions for queries where the page ranks in **positions 5–20**, `I_max` = the largest `I_b` in the candidate set, and `P = (20 − avg_position)/15` clamped to [0,1]. Pages in the 5–20 band score highest because position improves far more easily there than from 30+ | ❌ **GSC required** |
| **D** | Verified demand (20%) | `D = 100 × (ln(1+v) / ln(1+v_max))` where `v` = **verified** monthly search volume from an approved source. **If `v` is unverified, `D = 0`.** No estimate is ever substituted | ❌ **Volume source required** |
| **C** | CRM conversion quality (20%) | `C = 100 × ((c + α)/(l + α + β))` with `α = 1`, `β = 9` (a weak prior, because ALO's volume is low) where `c` = enquiries→application conversions attributed to the source page and `l` = enquiries attributed to it, over 180 days | ❌ **ALO CRM required — only ALO has this** |
| **B** | Business value (15%) | **Human rubric, management-scored** 0–100 across: partner-university priority (0–40), commission tier (0–25), intake timing (0–20), delivery capacity (0–15). Deliberately human: only the business knows its own economics | ⚠️ **Requires management input** |
| **F** | SERP feasibility (10%) | Documented proxy rubric until a difficulty tool exists: `F = 100 − 25·(official/gov results dominate?) − 20·(AI Overview present?) − 20·(large aggregators hold top 3?) − 15·(top-3 pages are content-complete?) − 10·(top-3 are brand names?) − 10·(strong local pack present?)`, floored at 0 | ⚠️ **Assessable manually now** |
| **U** | Freshness urgency (10%) | `U = 100 × (1 − min(Δ,90)/90)` where `Δ` = days until the claim on the page becomes wrong, if an announced change affects it; `U = 20` for evergreen pages | ✅ **Computable now — dates are known** |

### Worked example — the UK maintenance-funds page (KG1/KG2)

| Term | Value | Reasoning |
|---|---|---|
| G | **Not computable** — GSC required | — |
| D | **Not computable** — volume required | — |
| C | **Not computable** — CRM required | — |
| B | Assume 70 (UK is a stated priority market; management to confirm) | rubric |
| F | **65** — gov.uk will dominate, but ALO can win the *Bangladeshi applicant* framing | rubric applied |
| U | **100** — the change takes effect **30 Nov 2026**; `Δ = 47` days at time of writing → `100 × (1 − 47/90) = 47.8`… → **but** the page is wrong *on* 30 Nov, so effective urgency should be scored against the deadline to publish, not the event: treat as **100** because the window to be first is days, not weeks |  |
| **Provisional score** | **~30 / 100** (only B, F, U available: `0.15·70 + 0.10·65 + 0.10·100 = 27.0`) | **Three of six components are missing — which is exactly the argument for Week 1 baseline work** |

**Interpretation rule:** a provisional score built from 3 of 6 components is **not** a priority. It is a reason to extract baselines. This is stated openly so that no one mistakes a partial score for a ranking.

## 4.4 Keyword-group × page mapping

| Group | Primary page type | Owner | Quality bar | Freshness cycle |
|---|---|---|---|---|
| KG1 | Dated policy page | CONTENT + SOURCE VERIFICATION | Every figure cites Tier A, with retrieval + effective date displayed | **7 days** while a change is pending; monthly after |
| KG2 | Procedural guide | CONTENT + FACT-CHECK | Bangladeshi worked examples (bank, sponsor, document names) | 30 days |
| KG3 | Country hub | CONTENT | Hub links every spoke; each spoke links back | 90 days |
| KG4 | Route page | CONTENT + SOURCE VERIFICATION | Eligibility + dates + "applies to applications made on/after" | **7 days** |
| KG5 | Programme/CRM-backed page | CRM | Data from the CRM, never invented | 30 days |
| KG6 | Funding guide | CONTENT + FACT-CHECK | No unquantified "scholarship available" claims | 60 days |
| KG7 | Test-requirements page | CONTENT + FACT-CHECK | Institution-specific; **no blanket exemption claims** (see A4) | 90 days |
| KG8 | Trust pages | MGMT (consent required) | Real people, real consent, real addresses | 180 days |
| KG9 | Comparison table | CONTENT + FACT-CHECK | Every compared figure sourced; "who this suits" explicit | 90 days |

## 4.5 The claim that must never be published

D2's research produced three mutually contradictory Australia student-visa fee figures (AUD 2,000 / 2,500 / "1600 to 1200") and two contradictory IHS figures (£470 vs £1,035) from independent publishers. **ALO's competitors are publishing stale and conflicting figures right now.**

That is the market gap, and also the trap. Rule: **no money figure publishes without a same-day Tier A read** (D2 Rule 1.1). The Claims Registry (D10 §22.9) makes this mechanically enforceable rather than a matter of discipline.

---

# DELIVERABLE 5 — COMPETITOR GAP MATRIX

## 5.1 Competitor set (Tier D — positioning only, never visa law)

Compiled from independent and self-published BD market sources; **named here as market context, not as an authority on any fact.**

| Tier | Competitor | Evidence of positioning | Source type |
|---|---|---|---|
| **Global institutional** | **IDP Education Bangladesh** | Global education-services provider; link to IELTS co-ownership; very large course inventory | Tier C, self-published/institutional |
| **Established national** | **PFEC Global**, **Global Vision**, **IECC**, **MACES**, **AHZ Associates**, **Sangen BD**, **NHP** | Multi-country; multiple offices; long tenure (IECC from 2005, PFEC from 2006, AHZ from 2012) | Tier C/D |
| **Direct niche** | **Visa Hub BD**, **Sopnokotha**, **Scholarszone**, **Adaptive Consultant** | Publishing **Bangladesh-specific UK visa guides** with the **new** £1,570/£1,203 figures and BDT conversions | Tier D — **directly relevant** |
| **Self-listing content** | **EZY Study Abroad**, **Sunrise**, **Study Italy BD** | Publish "Top 10 consultancy in Bangladesh" lists that rank **themselves first** | Tier E — **treat as marketing, not ranking evidence** |

> **Bias warning recorded.** Three of the "top consultancy" lists found are published by consultancies that place themselves at #1. **These are not independent rankings and must never be cited as evidence of competitor strength or of ALO's relative position.**

## 5.2 The gap matrix — what ALO can realistically win

Legend: ✅ strong · ⚠️ partial · ❌ absent/weak · ❓ unknown (needs access)

| Capability / gap | ALO today | Typical BD competitor | IDP-class | **Can ALO win it?** |
|---|---|---|---|---|
| **Effective-date-aware visa content** (before/after tables, "applies to applications made on/after") | ❌ **A4 is an unscoped claim** | ⚠️ some already published the 30 Nov figures | ⚠️ | ✅ **Yes — and urgently.** The window is open *now*, and it closes on 30 Nov 2026 |
| **Bangladeshi money logistics** (student-file bank statements, solvency certificate, sponsor consent, day-27 risk) | ❓ unverified | ⚠️ Visa Hub BD has a strong version | ❌ generally generic | ✅ **Yes.** Deep local specificity; defensible against generic competitors |
| **BDT-denominated worked examples** (living-cost maxima expressed in takas) | ❌ | ⚠️ some | ❌ | ✅ **Yes — with an exchange-rate discipline rule (§5.4)** |
| **Source-verified claim display** (claim → source → effective date → reviewer on the page) | ❌ **absent** | ❌ absent market-wide | ❌ | ✅ **Yes, uniquely.** No BD competitor is observed doing this. It is also exactly what Google's 1 Oct 2026 guidance asks for |
| **Named counsellor credentials + consent** | ❌ none observed | ⚠️ some have team pages | ✅ | ✅ Yes |
| **Original data from own CRM** (outcomes by destination/course) | ❌ | ❌ | ⚠️ IDP has scale data | ✅ **Yes — ALO's single best differentiator.** No competitor can copy it |
| **Real Google reviews at volume** | ❌ none observed | ⚠️ varies | ✅ | ⚠️ Requires an operational process, not content |
| **Course/university inventory depth** | ❓ CRM exists | ✅ varied | ✅✅ | ❌ **Do not compete on breadth.** Compete on accuracy and fit |
| **Domain authority / link profile** | ❓ **unknown — no data** | ❓ | ✅✅ | ❌ **Cannot win on authority.** Win on specificity |
| **Bangla-language content** | ❌ | ⚠️ some | ❌ | ✅ Yes — genuinely underserved |
| **AI-answer citability** (tables, definitions, dated facts, structured answers) | ❌ prose-heavy | ❌ | ⚠️ | ✅ **Yes.** Requires no authority advantage, only clarity |

## 5.3 The strategic conclusion

ALO cannot outspend IDP, cannot out-rank established national brands on head terms, and has no verified link authority. **It can win three narrow things, and should spend the entire 90 days on exactly those:**

1. **Being first and correct on the three dated policy events** (§0.2 of D1). Competitors are already moving on the 30 Nov UK change — **this window is measured in days**.
2. **Bangladeshi money-logistics depth** — the bank, the sponsor, the document, the takas. Generic competitors structurally cannot serve this.
3. **Visible source verification** — the one thing no BD competitor is observed doing, and the one thing Google now explicitly asks for.

**Everything else — head-term "study in UK", course breadth, link volume — is a losing fight and is explicitly deprioritised in the roadmap.**

## 5.4 Two new standing rules arising from this research

**Rule 5.4.1 — Currency conversion discipline.** BDT figures are a genuine local differentiator (competitors use them). They are also volatile and partly subjective. Therefore: any BDT figure must display (a) the GBP/AUD/CAD figure, (b) the conversion rate used, (c) the date of that rate, and (d) the words *"indicative — banks apply their own rate."* **Never present a converted taka figure as the official requirement.**

**Rule 5.4.2 — Never cite a self-published "top consultancy" list.** Lists published by a consultancy that ranks itself first are Tier E marketing. ALO must never link to them as evidence, and must never respond to them by publishing a competing self-serving list.
