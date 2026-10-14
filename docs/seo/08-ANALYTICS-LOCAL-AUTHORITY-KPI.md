# DELIVERABLES 12, 13, 14 & 15 — Analytics & Attribution · Local SEO · Authority · KPI Framework

---

# DELIVERABLE 12 — ANALYTICS & ATTRIBUTION PLAN

## 12.1 The core problem

ALO can measure **search visibility** easily (GSC). It cannot currently measure **whether search visibility produces students**, because no link exists between a search click and a lead in the CRM. **`seo_lead_attribution` (D10 §10.2 table 20) is therefore the single most important analytics artefact in this plan** — it is also what makes the 20 % *CRM conversion quality* component of the priority score computable at all.

## 12.2 Measurement layers

| Layer | Question | Source | Status |
|---|---|---|---|
| **Discovery** | Can search engines see and index us? | GSC → Pages, Sitemaps, Crawl stats | ❌ access required |
| **Visibility** | For what, where, how often? | GSC → Performance | ❌ access required |
| **AI visibility** | Are we cited in AI answers? | GSC → **Generative AI report** | ❌ access required — **live worldwide since 31 Aug 2026** |
| **Engagement** | What happens on arrival? | GA4 | ❌ access required |
| **Conversion** | Did it become a lead? | CRM + GA4 | ⚠️ CRM exists; **no attribution model** |
| **Business outcome** | Did the lead become an enrolled student? | CRM (`Student`, `AloApplication`) | ⚠️ data exists; **not linked to source** |
| **Data integrity** | Are our own facts still correct? | `seo_claims`, `seo_sources` | ❌ not built |

## 12.3 The AI-visibility section — a real, dated capability

This is a first-class part of the plan because it became measurable on a known date:

| Fact | Detail |
|---|---|
| Launched | **3 June 2026**, UK subset first |
| **Worldwide** | **31 August 2026** — every verified property |
| Shows | Impressions in **AI Overviews, AI Mode, AI Overviews in Discover**; by page · country · device · date |
| **Does not show** | **Clicks, CTR, average position, or queries** (except AI Mode prompt filtering) |
| Since **7 Sept 2026** | AI Mode and AI Overview impressions are **combined** — annotate reports accordingly |
| Historical data | available from **18 May 2026** |
| Opt-out control | exists; opting out means **no impressions or traffic** from AI features; Google states it is **not** a ranking signal elsewhere |

**Recommendation: remain opted in, and record that as a deliberate decision.** Reported AI impressions alongside a flat CTR is the expected pattern as generative surfaces absorb clicks — **this plan flags that pattern rather than hiding it.**

**Reporting rule:** every AI-visibility figure must be labelled *"AI Overviews + AI Mode combined (from 7 Sep 2026)"*. AI impressions are **not** traffic and must never be added to sessions.

## 12.4 Attribution model

| Model | Use | Why |
|---|---|---|
| **First touch** | Understanding acquisition | Which channel created awareness |
| **Last touch** | Understanding conversion | Which channel closed — **the practical default** |
| **Linear (multi-touch)** | Longer consideration cycles | Study abroad decisions take weeks-to-months; single-touch under-credits research content |

**Capture at these events:** landing URL + referrer + UTM + `gclid` at first session · form submit · WhatsApp click · call click · portal signup · application created.

**The rule that makes this workable:** capture attribution **at lead creation** in the CRM, not only in the browser. Browser data is lost across devices and sessions; the CRM lead is the durable record.

**Honest limitation, stated up front:** WhatsApp and phone are primary channels in this market, and neither is fully attributable without wrapper numbers or click tracking. **CV8 (WhatsApp click tracking) is therefore a measurement priority, not a nice-to-have.**

## 12.5 What cannot be measured yet, and why

| Not measurable | Why | Resolves when |
|---|---|---|
| Organic → enrolment rate | No attribution link | `seo_lead_attribution` built |
| CTR from AI surfaces | Google does not report it | Google ships it (no date announced) |
| True keyword volume | No tool | Keyword Planner / paid tool |
| Competitor traffic | No tool, and would be an estimate | Not required by this plan |
| Offline/word-of-mouth leads | No capture | Manual "how did you hear about us" field on the form |

**That last row is a genuine, cheap win:** a single required question on the contact form — *"How did you hear about us?"* — captures the channel attribution that neither GA4 nor GSC can recover.

---

# DELIVERABLE 13 — LOCAL SEO PLAN

## 13.1 Ground truth first

**Nothing in this section can be executed before DEC-1.** The audit confirmed **three different addresses, three phone formats, and two sets of opening hours** across ALO's own pages. Guessing which is correct would risk corrupting the correct one.

**Step 1 — management decides the canonical record.** Exactly one of each: legal entity name · trading name · street address · area · city · postcode · primary phone · WhatsApp · email · hours (with the Sat–Thu working week stated explicitly).

**Step 2 — publish it identically, character for character**, on: site footer · contact page · About page · GBP · all social profiles · every BD directory listing · email signatures.

## 13.2 Google Business Profile

| Action | Detail | Priority |
|---|---|---|
| Verify ownership | Confirm who controls the listing | **P0** |
| Correct every field | Against the DEC-1 record | **P0** |
| Primary category | Choose the most accurate category for an education consultancy | **P0** |
| Service area | Only real coverage | P1 |
| Real photos | Office, team (with consent), signage. **No stock imagery presented as the office** | P1 |
| Hours | Including the Sat–Thu week and any Friday closure | P1 |
| Messaging | Enable, and route into the CRM | P2 |
| Weekly posts | Real updates only — seminars, deadlines, **dated policy changes** | P2 |
| Q&A | Seed with genuinely asked questions; answer accurately | P2 |
| **Reviews** | **Request from real students after a defined touchpoint. Never generate, never incentivise falsely, never gate by sentiment** | P1 |

## 13.3 Location pages — the doorway-page rule

A city page is legitimate **only** where ALO genuinely operates and is staffed. A page created for a city with no presence is a doorway page and is explicitly forbidden by the brief.

| Legitimate | Forbidden |
|---|---|
| One page per **real, staffed** office | Pages for cities with no office |
| Unique content: the actual team, the actual directions, the actual local process | Templated pages with the city name swapped |
| Real photos of that location | Stock photos of another city |

**If DEC-1 establishes that ALO has one real office, ALO gets one location page. That is the correct outcome and it should not be padded.**

## 13.4 Structured data for local

| Type | Purpose | Rules |
|---|---|---|
| `Organization` | Brand entity: name, logo, sameAs profiles, contactPoint | Must match DEC-1 exactly |
| `LocalBusiness` (or a specific subtype) | Location: address, geo, hours, telephone | **Only for real locations.** One per real office |
| `BreadcrumbList` | SERP path + hierarchy | All non-home templates |
| **`FAQPage`** | ❌ **Not as a rich-result tactic** | Google retired FAQ rich results **7 May 2026**; the search appearance and Rich Results Test support were removed in June 2026 and API support in August 2026. Markup is harmless but yields nothing — do not build pages around it |

## 13.5 Local content that is genuinely local

The differentiator is not "study abroad in Dhaka" — it is the **local mechanics no generic page can cover:**

* Which Bangladeshi banks issue **visa-suitable statements** (verify per bank before publishing)
* What a **solvency certificate** is and how UKVI treats it
* The **student file** account and how officers read its history
* **Sponsor documentation** — the consent letter, the birth certificate, the relationship evidence
* Document collection and courier logistics in Dhaka
* **Seminar and university-visit calendar** — real events, which also generate real GBP posts

## 13.6 Measurement

| Metric | Source | Why |
|---|---|---|
| GBP calls, direction requests, website clicks | GBP Insights | Direct local demand — **currently unavailable** |
| Local pack presence for priority local queries | SERP snapshots | Leading indicator |
| NAP consistency score | AG-14 output | Data integrity |
| Location-page conversions | CRM attribution | Outcome |
| Review count **and** rating | GBP | Trust, not a target to game |

**No target is set for review count.** Targets for reviews create pressure to fabricate them, and the brief forbids fabricated reviews absolutely. The process exists to make real reviews likely, not to hit a number.

---

# DELIVERABLE 14 — AUTHORITY PLAN

## 14.1 Reality check before strategy

**ALO's backlink profile is unknown** (`DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS`; the free GSC Links report is the Week-2 action). **No link count, domain rating, or referring-domain figure appears in this plan.**

Two things are true regardless: ALO cannot out-link established national brands in 90 days, and **link-building tactics that would work fast are exactly the ones that carry penalty risk.** This plan therefore pursues only pathways where a real relationship or a real asset exists.

## 14.2 Pathway 1 — University and partner links (highest relevance, lowest cost)

| Step | Detail |
|---|---|
| 1 | Build the partner roster: which institutions does ALO actually represent, and under what agreement type? (Tier C evidence) |
| 2 | Audit each partner's website for an existing **"our agents in Bangladesh"** or **"authorised representative"** page |
| 3 | Where the page exists but ALO is absent → request inclusion (this is a *correction*, not a favour — it is the strongest possible ask) |
| 4 | Where ALO is listed → verify accuracy of name, URL, and address against DEC-1 |
| 5 | Where no such page exists → ask the partner's regional/marketing contact, who already wants more Bangladeshi recruitment |

**Why this works:** the link is genuinely earned, topically exact, and the partner benefits. **Disclosure rule:** never misrepresent the relationship's nature, and never claim representation ALO does not hold.

## 14.3 Pathway 2 — Original research from ALO's own data (the anchor asset)

**This is ALO's single best differentiator, because no competitor can copy it and no AI can synthesise it.**

The data already exists in the CRM: applications by destination, course type, intake, profile band, and outcome. **Every figure must come from real records (DEC-6), with a stated methodology, sample size, and date range. If the sample is too small, publish the methodology and say so rather than implying more.**

Candidate reports (choose one for the 90 days):
1. **Bangladeshi student application outcomes by destination, 2023–2026** — profile bands, course types, timings
2. **The real cost of a UK master's for a Bangladeshi family, itemised** — fees, maintenance, IHS, travel, by city
3. **Where Bangladeshi applicants get refused, and on what grounds** — pattern analysis of documented refusals

**Why it earns links:** it is the only version of this data that exists. Universities, education media, and forums cite original datasets. It is also the most citable asset shape for AI answers.

**Hard rule:** if the data does not support a conclusion, the report says so. **An honest small-sample report outperforms a large fabricated one, and a fabricated one is career-ending.**

## 14.4 Pathway 3 — Alumni and student stories

| Step | Rule |
|---|---|
| 1 | **Written consent from every named individual** — for name, photo, university, program, and outcome |
| 2 | Where consent is partial, anonymise rather than omit |
| 3 | Some students' universities and employers publish "meet our students" content — offer a factual, consented story |
| 4 | Never publish a visa result, approval, or job outcome without the student's consent and a verifiable basis |

**Forbidden without exception:** fabricated student stories, purchased testimonials, invented visa results, or "success rates" without an auditable dataset (DEC-6).

## 14.5 Pathway 4 — Digital PR around the dated policy events

**The three dated events of D1 §0.2 are the most natural PR hook ALO will have all quarter.** A correct, clearly-explained, locally-relevant analysis of a rule change is genuinely newsworthy to education media and student communities — and it is published *because* it is useful.

**Draft outreach template (also used for Pathway 1):**

> **Subject:** Bangladesh-specific data on the 30 November UK maintenance change
>
> Hi {name},
>
> On 30 November 2026 the UK Student visa maintenance requirement rises to £1,570/month in London and £1,203/month outside London (£14,130 and £10,827 over nine months) for applications made on or after that date.
>
> Most coverage explains the UK rule. Fewer explain what it means for a Bangladeshi family — the 28-day holding period, how study-abroad bank statements and solvency certificates are actually assessed, and why deposits placed just before the window are scrutinised.
>
> We've put that version together here: {URL}. It is sourced to {official source}, and states the effective date and the date we last verified it.
>
> No ask beyond this: if it's useful to your readers, feel free to reference it. Happy to answer questions on the record.
>
> {Name}, {Role}, ALO Education

**Why this template works:** it leads with a verified specific, offers a genuinely non-obvious angle, states its sourcing, and asks for nothing. **It is also not spam** — it is a factual note to a relevant person.

## 14.6 Absolute prohibitions

| Prohibited | Reason |
|---|---|
| Buying links, PBNs, link farms | Penalty risk |
| Paid guest posts with followed links | Undisclosed paid links violate Google's link spam policy |
| Bulk/unsolicited email outreach | — |
| Fake directory listings or fake offices | Brief forbids; also a doorway/local-spam issue |
| Fabricated reviews, testimonials, or success rates | Brief forbids absolutely |
| Publishing a competing self-serving "top consultancy" list | Rule 5.4.2 — self-published rankings are Tier E marketing |
| **Editing Wikipedia about ALO** | Conflict of interest |
| Reciprocal link schemes | Link spam |

## 14.7 90-day authority objective

**Not** a link count (which cannot be honestly targeted here). The objective is:

1. **An asset worth citing** — one original data report, published with a stated methodology.
2. **A correct ask to an existing relationship** — every partner university audited, and inclusion requested where a roster page exists.
3. **A repeatable process** — templates, a prospect tracker, and a documented rule set, so month 4 onward does not restart from zero.

---

# DELIVERABLE 15 — KPI FRAMEWORK

**Governing rule: every KPI below is a *measurement definition*, not a target.** Targets are set only in Week 13, from observed baselines (D6 §6.3). Any figure marked ❌ cannot be measured today, and **inventing one would be worse than having none.**

## 15.1 Leading indicators — inputs ALO controls

| KPI | Definition | Source | Now |
|---|---|---|---|
| Claims in registry | Count of claims with a Tier-appropriate source and a `nextReviewAt` | `seo_claims` | ❌ 0 — not built |
| **Claims overdue for review** | Claims past `nextReviewAt` | `seo_claims` | ❌ **Target: 0, always** |
| Source tier coverage | % of `IMMIGRATION_MONEY` claims with a Tier A source recorded same-day | `seo_claims` | ❌ |
| Pages published meeting DoD | Count passing every D19 gate | `seo_content_items` | ❌ |
| **Rejected at fact-check** | Drafts blocked by AG-08 | `seo_content_reviews` | ❌ **A rising number is healthy** — it means the gate works |
| Internal-link coverage | % of published URLs with ≥ 2 contextual inlinks | `seo_internal_links` | ❌ |
| Orphan pages | Pages with 0 contextual inlinks | AG-10 | ❌ **Target: 0** |
| Broken internal links | Count | AG-10 | ❌ **Target: 0** |
| NAP consistency | % of checked surfaces matching DEC-1 | AG-14 | ❌ |
| Technical findings open by severity | Count by Critical/High/Medium | `seo_technical_findings` | ❌ |
| Content freshness compliance | % of dated-policy pages verified within their window | AG-13 | ❌ |

**Why these are the leading set:** every one of them is a *controllable* action, and every one of them is a **precondition** for the lagging ones. A plan measured only on traffic cannot tell you *why* traffic moved.

## 15.2 Mid-funnel indicators — market response

| KPI | Definition | Source | Now |
|---|---|---|---|
| Indexed pages | Valid indexed count | GSC → Pages | ❌ |
| Impressions | 28-day impressions, by page/query/country | GSC → Performance | ❌ |
| Average position | By query cluster — **especially the 5–20 band** | GSC → Performance | ❌ |
| CTR | Impressions → clicks, by cluster | GSC → Performance | ❌ |
| **AI visibility impressions** | AI Overviews + AI Mode combined | GSC → Generative AI report | ❌ — **available worldwide since 31 Aug 2026** |
| Ranking-5–20 count | Queries with an existing foothold | GSC | ❌ **The single best predictor of near-term gain** |
| Branded search volume | Queries containing "alo education" | GSC | ❌ |
| Sessions by landing page | Organic entrances | GA4 | ❌ |
| Engagement rate | By page type | GA4 | ❌ |
| GBP actions | Calls, directions, website clicks | GBP Insights | ❌ |

## 15.3 Lagging indicators — business outcomes

| KPI | Definition | Source | Now |
|---|---|---|---|
| **Organic leads** | Leads with an organic first/last touch | CRM `seo_lead_attribution` | ❌ not built |
| **WhatsApp leads from organic** | Click-tracked `wa.me` → CRM contact | CRM + click tracking | ❌ |
| Lead → application rate | Applications ÷ leads, by source | CRM | ⚠️ data exists, unattributed |
| Application → enrolment rate | Enrolments ÷ applications, by source | CRM | ⚠️ as above |
| **Cost per organic lead** | Content+tool cost ÷ organic leads | Internal + CRM | ❌ |
| Revenue attribution | Commission value by originating channel | Internal | ❌ |
| Counsellor time saved | Hours saved by agent-assisted work | Internal | ❌ |

**The honest statement about lagging KPIs:** in a 90-day window with a study-abroad sales cycle measured in months, **enrolment movement is unlikely to be attributable to this quarter's SEO work.** Claiming otherwise would be exactly the kind of unfounded claim this plan exists to eliminate. The realistic 90-day test is whether **leading indicators moved and the measurement chain now works** — which is what makes month 4 onward accountable.

## 15.4 Reporting cadence

| Cadence | Audience | Contents |
|---|---|---|
| Weekly | SEO team | Leading KPIs, blockers, claims overdue, gate rejections |
| Monthly | Management | Mid-funnel movement vs baseline, published inventory, decision requests |
| Quarterly | Management | Lagging outcomes + a retrospective on what was classified wrong (D6 W13) |

**Annotation is mandatory.** Every report annotates publications, technical fixes, and **external algorithm events** — specifically the global spam updates of **18–21 Aug 2026** and **24 Sep 2026** — so that short-term volatility is never misread as the verdict on content quality.

## 15.5 The one KPI that matters most in the first 30 days

**Claims overdue for review = 0, and every `IMMIGRATION_MONEY` claim carrying a Tier A source read on the day of publication.**

Because a wrong maintenance figure or a wrong visa fee does not cost a ranking — **it costs a student money they cannot recover, and it destroys the exact thing ALO's own homepage promises.**
