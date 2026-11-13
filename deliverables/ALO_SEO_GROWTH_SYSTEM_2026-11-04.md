# ALO Education — SEO Growth and WEB_CRM Implementation System

**Evidence checked:** 4 November 2026, Asia/Dhaka. **Proposed 90-day execution:** 4 November 2026–1 February 2027 inclusive. The supplied 9 July–7 October 2026 window is historical; results cannot be reconstructed without accounts. This is a research-backed implementation plan, not a claim that the jobs, integrations, content, or deployment have been completed. Public observations are snapshots, not proof of Google indexation. Recheck volatile sources at publication. **D:** DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS. **Reviewer:** unassigned until actually recorded.

## 1. Executive Truth Report

The live [home page](https://aloeducation.com/) exposes destination, consultation and course-finder links. The [UK destination](https://aloeducation.com/destinations/uk) displays an unconditional two-year Graduate route; the [Dubai destination](https://aloeducation.com/destinations/dubai) claims 100% visa success and other unsourced specifics. These are immediate editorial risks, not substantiated results. The public [sitemap](https://aloeducation.com/sitemap.xml) includes `/user-guide`, while observed [robots.txt](https://aloeducation.com/robots.txt) differs from the checkout's `src/app/robots.ts`; it lists `/destinations/dubai` while home links to `/destinations/dubai-uae`. Both Dubai URLs returned substantially the same visible content; HTTP status, canonical and redirect behavior remain unverified. The fetched finder showed January, May and September options; the checkout has a newer multi-month finder. Do not assume this branch is deployed.

**P0 within 24 hours:** publishing owner should remove or qualify misleading UK/Dubai statements, audit shared templates and cached surfaces, and have a country reviewer approve replacements. Preserve functionality and URL equity. Confirm office details with management before changing NAP. Freeze unreviewed policy content and inspect the historical SDS article. Local `src/lib/blogs-data.ts` contains old SDS and Graduate-route text; its current public reach is unverified.

**Baseline:** GSC, GA4, CRM, GBP, logs, CrUX/PSI and backlink tools are not connected here. Organic clicks, indexed counts, search volume, keywords, competitors' traffic, outcomes and revenue are D. Request property-level read access, consent settings and de-identified CRM export. Define 28-day and 90-day baselines with completeness and seasonality before setting targets.

**90-day objective:** correct evidenced high-risk content; establish technical/source inventories, human-gated publishing and attribution; improve existing high-intent hubs before adding pages; use business outcomes to choose work. Volume depends on capacity, not a traffic forecast. No ranking, visa, admissions, scholarship or growth guarantee.

## 2. Evidence Log and Mandatory Current-Risk Checks

All checked 2026-11-04. Effective dates below only where observed; expiry/updated dates otherwise not recorded in inspected extract. All immigration rows require a named qualified human reviewer before publication. Confidence refers to source text, not a personal eligibility decision.

| Claim / finding | Finding and effective or change date | Primary source, title and type | Confidence / action |
|---|---|---|---|
| UK Student visa | Current route is Student visa; requirements depend on circumstances. | [2](https://www.gov.uk/student-visa) GOV.UK, Student visa | High; separately verify fees, dependants and evidence. |
| UK Graduate | Non-doctoral: 2 years if application made by 31 Dec 2026; 18 months from 1 Jan 2027. PhD/other doctoral: 3 years, subject to eligibility. | [1](https://www.gov.uk/graduate-visa) GOV.UK, Graduate visa; [9](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-graduate) Appendix Graduate | High; P0 correct page; date-triggered review. |
| Canada SDS | Ended 8 Nov 2024 at 2 pm ET; eligible earlier applications have transitional treatment. | [4](https://www.canada.ca/en/immigration-refugees-citizenship/news/notices/end-student-direct-stream-nigeria-student-express.html) IRCC, End of SDS | High; rewrite/retire obsolete comparison after URL inventory. |
| Canada PGWP | General, program, language, location and sometimes field-of-study conditions apply. | [1](https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html) IRCC, Who can apply | High; check individual program and application dates. |
| PGWP field of study | IRCC lists exemptions including bachelor/master/doctoral graduates; qualifying CIP and dates matter. IRCC states 2026 list frozen. | [2](https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility/field-of-study.html) IRCC, Field of study | High; 2027 status not inferred. |
| Australia subclass 500 | CoE generally needed unless specified exceptions; evidence depends on case. | [1](https://immi.homeaffairs.gov.au/visas/web-evidentiary-tool) Home Affairs, Document Checklist Tool | High; use individualized checklist. |
| Australia GS | Applies to student visa applications lodged on/after 23 March 2024; earlier applications use GTE. | [1](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement) Home Affairs, Genuine Student | High; reviewer required. |
| Australia onshore restrictions | Factsheet describes changes effective 2 October 2026, exceptions and transition; do not generalize to all applicants. | [4](https://immi.homeaffairs.gov.au/Visa-subsite/files/changes-to-student-visa-applications-factsheet.pdf) Home Affairs | High for source; reviewer check scope and rules. |
| US F/M | F covers academic, M vocational/nonacademic institutions with stated exceptions. | [1](https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html) U.S. Department of State, Student Visa | High; no visa decision guarantee. |
| US appointment times | Estimates vary by location, season and category and do not guarantee appointment availability. | [2](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html) U.S. State Department | High; date-stamp estimates. |
| FAQ rich result | Google removed FAQ rich-result feature; FAQ text can still help users. | [1](https://developers.google.com/search/docs/appearance/structured-data/faqpage) Google Search Central change log, May/June 2026 | High; do not promise FAQ dropdowns. |
| AI scaled content | Generating many pages without user value may violate spam policy; fact-check. | [6](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) Google Search Central | High; originality/review gate. |
| AI Search eligibility | Google's newer guide describes a site-wide generative AI inclusion control in Search Console; indexed, snippet-eligible content and settings matter. No llms.txt or mechanical chunking requirement. | [3](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) Google AI Search guidance | High; verify actual property setting. Older documentation describes no additional technical requirements; use newer guidance and check settings. |
| AI reporting | Dedicated generative-AI impression reports announced 3 June 2026 for a subset of sites; page/country/date, device for Search. ALO availability/API support is D. | [2](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) Google Search Central | High; show unavailable rather than invent clicks/dimensions. |
| Indexing API | Limited to eligible JobPosting or livestream BroadcastEvent embedded in VideoObject. | [5](https://developers.google.com/search/apis/indexing-api/v3/quickstart) Google Indexing API | High; never use for ordinary content pages. |
| Structured data | Feature support varies; follow current gallery and visible content. | [6](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) Google Search Central | High; validate actual markup. |
| GBP reviews | Google prohibits incentives and selective positive solicitation. | [1](https://support.google.com/business/answer/7400114?hl=en&visit_id=639290342693138969-1661290786&rd=1) Google review policy | High; invite customers neutrally across outcomes. |
| Core Web Vitals | Good p75 targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 segmented by device. Actual ALO readings D. | [1](https://web.dev/articles/vitals) web.dev, Web Vitals | High for thresholds; collect field and lab separately. |
| Live content | UK/Dubai claims are present in fetched pages; not independently substantiated. | [UK](https://aloeducation.com/destinations/uk), [Dubai](https://aloeducation.com/destinations/dubai) public pages | High for observed text; corrections require review/deployment. |
| Locations | Live contact lists Panthapath. Search result for same URL shows Uttara footer; `/about-us/` search result shows another address but current fetch redirects to login. Snippets may be stale. | [2](https://aloeducation.com/contact), [3](https://aloeducation.com/about-us/) ALO pages | Medium; confirm actual offices/hours. |
| ALO partner/course numbers | `/about` displays 360+ partners and 8,800+ courses; no audit evidence available. | [About](https://aloeducation.com/about) ALO | High for display, low for truth; verify numerator, date, relationships and filters. |

No fees, university requirements, scholarship deadlines or processing times are approved for publication by this report. Capture actual source text, source hash, jurisdiction, effective/review dates, reviewer and confidence per claim.

## 3. Complete SEO Audit — Current Scope and Limitations

**Method:** search and page-fetch snapshots plus repository inspection. No authenticated crawl, controlled browser DOM/raw HTML comparison, response headers, Search Console, mobile instrumentation or PSI run. Converted page text is neither raw HTML nor a controlled rendered-DOM test. This is a prioritized partial audit, not a full crawl. P0 immediate safety, P1 urgent, P2 normal; deadline relative to kickoff.

| Area / severity | Evidence / impact | Fix; owner; effort; deadline |
|---|---|---|
| P0 policy | UK page unconditional Graduate-route duration contradicts effective-date rule. | Correct reused occurrences and metadata with official date distinctions; reviewer/editor; M; D1. |
| P0 unsupported outcomes | Dubai page displays 100% success, near-100%, unverified timing/work/tuition and “verified” badge. | Suspend or qualify unsupported statements; preserve page/CTAs; compliance/editor; M; D1. |
| P0 legacy source | `src/lib/blogs-data.ts` contains ended SDS claim; live reach unknown. | Inventory public/cached use, block outdated advice, update from IRCC; developer/reviewer; M; D2. |
| P1 editorial rendering | Fetched UK/Dubai pages expose template instructions such as “filter country_id” and placeholders. | Remove implementation instructions, use honest empty states and sources; dev/editor; M; W1. |
| P1 deployment parity | Live robots differs from checkout; live finder shows three months vs checkout multi-month. | Record deployed commit and compare public config/templates; release manager; S; W1. |
| P1 sitemap/robots | Live sitemap includes `/user-guide`; checkout disallows it; observed live robots does not. | Determine route access and indexing, remove if noncanonical/nonpublic; use auth/noindex as appropriate; dev; S; W1. Robots alone neither prevents indexing nor secures access. |
| P1 alias duplication | `/destinations/dubai` and `/destinations/dubai-uae` fetch equivalent content; home links latter, sitemap former. | Inspect HTTP, canonical and GSC; choose authoritative established URL and redirect only when safe; dev; S; W2. |
| P1 legacy URL | Search results show `/about-us/` and MRes page; current fetches resolve to login. | Verify redirect chain and ownership; map meaningful equivalents after traffic/link review; dev; M; W2. |
| P1 NAP | Contact lists Panthapath; search snippets show other addresses/hours, possibly stale. | Verify real offices, hours, GBP and footer, synchronize; local lead; S; W1. |
| P1 indexation | Indexed/nonindexed, staging and parameter coverage D. | GSC Page Indexing + URL Inspection on critical samples; compare crawl/sitemap/logs; analyst; M; W1. |
| P1 crawl | Broken links, 5xx, redirect chains, soft 404 and orphan counts D. | Crawl canonical host, store headers/link graph/sitemap comparison; developer; M; W1. |
| P1 performance | Field/lab values D; homepage fetch shows 3840px hero variant but no measured LCP conclusion. | PSI/CrUX by URL/device; Lighthouse traces and image/script waterfall; frontend; M; W1–2. |
| P1 raw vs DOM | Fetch extraction yielded text, not raw-vs-rendered comparison; title/canonical/schema/headers unverified. | Compare raw HTTP and browser DOM for home, country, university, course, blog, service, tool, contact; frontend; M; W1. |
| P1 metadata/schema | Initial HTML and JSON-LD unmeasured; FAQ rich result unavailable. | Audit unique titles/canonicals and Rich Results Test; truthful supported schema only; SEO/dev; M; W2. |
| P1 measurement | No GSC/GA4/CRM property access. | Capture provenance, consent and access; synthetic lead→qualified→application test; analyst/CRM; L; W1–4. |
| P2 content | Money-page overlap and institutional claims unverified; existing `/destinations/*`, `/services/*`, `/course-finder`. | Inventory by URL/query; update established pages first; editor; M; W1–4. |
| P2 authority | Backlinks, university agreements and story permissions D. | Audit relationships and link sources; PR; M; W3–10. |
| P2 mobile/accessibility | Mobile parity, sticky elements and tap targets D. | Mobile/desktop screenshots, keyboard, viewport and body content; frontend; M; W2. |
| P2 AI visibility | GSC AI report availability D. | Check Search generative AI property setting and report availability; analyst; S; W2. |
| P2 conversion | Home links consultation/finder; visa service links CTAs; funnel rates D. | Trace consent-aware events through CRM; analyst/CRM; M; W3–4. |

**Exact access:** GSC verified property read (performance, indexation, AI report); GA4 report access and consent settings; GBP read/manager; de-identified lead/status timestamps and approved revenue access; CDN/server logs; CrUX/PSI; backlink/rank provider. No student personal data to research agents. Missing access is a blocker, not zero.

## 4. Keyword Intelligence Map and Scoring

All demand, volume, CPC, competition, GSC, CRM outcomes and positions: **D**. Clusters are hypotheses; mapping needs GSC, local SERP and CRM review.

| Seeds / intent | Existing candidate, not confirmed canonical | Action | Volume/GSC/CRM/score |
|---|---|---|---|
| study abroad consultant Dhaka, near me / local | `/contact`, service inventory | UPDATE after local SERP and office verification | D |
| free study abroad consultation / transactional | `/book-consultation` | IMPROVE CTR/conversion after baseline | D |
| study in UK from Bangladesh / destination | `/destinations/uk` | UPDATE; P0 policy correction | D |
| UK student visa, financial evidence / immigration | `/destinations/uk/visa-guide` | UPDATE after source review | D |
| UK Graduate visa / immigration | `/destinations/uk` | UPDATE or create spoke only after overlap check | D |
| UK without IELTS / admissions | `/destinations/uk/admission-requirements` | WAIT, verify per institution | D |
| F1 interview questions / tool | `/services/interview-preparation` | UPDATE, test demand | D |
| Canada study permit, PGWP / immigration | `/destinations/canada/visa-guide` | UPDATE, segregate if intent supports | D |
| Australia student visa, GS / immigration | `/destinations/australia/visa-guide` | UPDATE with sources | D |
| education loan Bangladesh / financing | `/services/financial-planning` | WAIT for product and SERP evidence | D |
| scholarships UK/USA/Canada | `/scholarships` | UPDATE verified records | D |
| course finder study abroad | `/course-finder` | UPDATE landing; control filter combinations | D |
| study gap acceptable universities | inventory required | WAIT, no blanket acceptance | D |

**Formula:** six components scaled 0–100: GSC 25%, demand 20%, CRM quality 20%, business value 15%, feasibility 10%, freshness urgency 10%. `score = Σ(weight × component)/100`. GSC = 50% normalized log impressions (28d vs eligible cohort max) + 50% position band (5–20=100; 3–<5 or >20–30=60; other=20); exclude low-sample/incompatible dates. Demand = percentile of externally sourced BD/language volume with provider/date; CRM = smoothed qualified-lead rate `(qualified+2)/(leads+4)×100`, only after predeclared minimum 20 leads and comparable attribution; business = approved unit-economics or explicit 0–100 management rubric; feasibility = human rubric for intent, unique value, SERP competition and effort; urgency = 100 overdue high-volatility, 70 due within 7d, 30 evergreen due, 0 recently reviewed. **Any missing component → `INSUFFICIENT_DATA`** and completeness, not a fabricated score. P0 safety bypasses growth score.

## 5. Competitor Gap Matrix

Evidence is limited to inspected pages; this is not a verified ranking/backlink comparison. IDP, MACES, Mentors', TCL Global, GoStudy, GSC Global Solutions, Eduvisors and Career Paths remain research queue / D for metrics and actual SERP ranking. [1](https://shabujglobal.com/) Shabuj's homepage describes admissions, selection, visa help and office locations; these are its claims, not independent verification.

| Dimension | ALO observed | Shabuj observed | Other competitors | Next evidence |
|---|---|---|---|---|
| Destination | Home links `/destinations/*` | Services and destinations advertised | D | crawl comparable templates |
| Conversion | Consultation, finder, eligibility, WhatsApp links | Guidance/contact options | D | compare actual mobile funnels |
| Local trust | Panthapath contact; inconsistent snippets | Bangladesh offices self-reported | D | verify GBP, no fake offices |
| Tools | Finder and eligibility entry points | D, not assumed absent | D | test completion and provenance |
| Visibility, backlinks, CWV, AI | D | D | D | controlled SERP, CrUX/PSI, provider export |

Potential differentiators to validate: transparent dated Bangladesh-specific guidance, counsellor-reviewed decision support, consent-aware lead-to-outcome measurement. Keyword overlap, ranks, authority scores and publishing frequency remain D.

## 6. Final 90-Day Roadmap

| Week | Task / owner | Dependencies / output | KPI / risk |
|---|---|---|---|
| 1 | Policy triage, deployment parity, crawl and baselines / SEO lead, reviewer, developer | access and owner inventory | P0 closure; stale cache |
| 2 | Canonicals/sitemap/internal links, CRM schema / dev | W1 audit | critical templates tested; deployment mismatch |
| 3 | UK/USA hubs and local intent / editor, reviewer | SERP/GSC/official sources | approvals/source coverage; volatility |
| 4 | Canada/Australia hubs and NAP / reviewer, local manager | official sources and actual locations | coverage/NAP; access |
| 5 | UK visa/scholarship/language / editor | case-specific sources | reviewed pages; overlap |
| 6 | USA cluster/interview MVP safety / product | consent/test data/reviewer | truthful tool completion; privacy |
| 7 | Canada permit/PGWP, watcher / reviewer/dev | IRCC snapshots | overdue claims; source change |
| 8 | Australia cluster/course matcher / product | verified catalogue | match/info-gap rate; false certainty |
| 9 | Real profiles/stories/review policy / editor | credentials/consent | evidence completeness; privacy |
| 10 | University outreach/original research / PR | verified relationships/privacy | replies/earned links; small sample |
| 11 | GSC early data / analyst | 28d baseline | impressions/opportunities; small samples |
| 12 | CRO/contextual linking / product | working events | funnel improvement; experiment validity |
| 13 | Review and next-quarter plan / lead | actual pipeline data | retrospective; lagging outcomes mature later |

Reserve quality capacity for 12–15 commercial updates, 12–18 support pieces, 3–5 verified profiles, 6–10 consented stories and one privacy-reviewed study only if evidence and staff permit. Not a mandatory publishing quota.

## 7. Thirty Money-Page Decisions

Provisional because live SERP/GSC/cannibalization and source audits are D. U=update candidate, P=postpone, M=merge, R=rewrite. No page is unconditionally approved for immediate publication; preserve established URLs.

| # | Seed | Decision | Candidate URL | Why |
|---|---|---|---|---|
| 1 | UK destination | U | `/destinations/uk` | correct Graduate route |
| 2 | USA destination | U | `/destinations/usa` | verify admissions |
| 3 | Canada destination | U | `/destinations/canada` | review study permit |
| 4 | Australia destination | U | `/destinations/australia` | review 2026 changes |
| 5 | Ireland destination | U | `/destinations/ireland` | verify rules |
| 6 | Dubai destination | R | `/destinations/dubai` | remove unsupported claims |
| 7 | New Zealand destination | U | `/destinations/new-zealand` | verify sources |
| 8 | UK Student visa | U | `/destinations/uk/visa-guide` | dated requirements |
| 9 | US F1/interview | M | `/services/interview-preparation` | separate visa facts from practice |
| 10 | Canada study permit | U | `/destinations/canada/visa-guide` | IRCC review |
| 11 | Australia subclass 500 | U | `/destinations/australia/visa-guide` | 2026 change/GS |
| 12 | Affordable UK | P | `/destinations/uk/universities` | verify tuition |
| 13 | Affordable USA | P | `/destinations/usa/universities` | verify fees |
| 14 | Affordable Canada | P | `/destinations/canada/universities` | verify data |
| 15 | UK English options | M | `/destinations/uk/admission-requirements` | institution-specific rules |
| 16 | USA English options | P | `/destinations/usa/admission-requirements` | institution evidence |
| 17 | USA scholarships | M | `/scholarships` | verified records |
| 18 | UK scholarships | M | `/destinations/uk/scholarships` | verify deadlines |
| 19 | Canada scholarships | M | `/destinations/canada/scholarships` | verify deadlines |
| 20 | Consultant Dhaka | U | `/contact` | confirm location/intent |
| 21 | Visa guidance | U | `/services/visa-guidance` | review scope |
| 22 | Admissions assistance | U | `/services/application-assistance` | map existing service |
| 23 | Study gap | P | `/guides` | university-specific policy |
| 24 | Canada PGWP | P | `/destinations/canada/visa-guide` | source/overlap check |
| 25 | UK Graduate visa | U | `/destinations/uk` | date transition |
| 26 | Visa interview practice | U | `/services/interview-preparation` | test MVP safeguards |
| 27 | SOP review | U | `/services/sop-cv-support` | academic integrity |
| 28 | Education financing | U | `/services/financial-planning` | verify lenders |
| 29 | Financial evidence | P | `/visa` | separate jurisdictions |
| 30 | Course finder | U | `/course-finder` | deployment parity/filters |

## 8. Complete 100-Topic Content Queue

All decisions provisional. U=update if mapped; M=merge; P=postpone pending demand/sources; R=rewrite. Every topic requires live target-market SERP, GSC cannibalization and consent/source review before publishing. No demand is implied.

### A — Decision and Foundations

| # | Topic | Decision | Reason / evidence gate |
|---|---|---|---|
| 1 | UK vs Canada | P | comparison/eligibility |
| 2 | IELTS vs PTE vs Duolingo | U | language comparison |
| 3 | Reasons to study abroad 2026 | R | dated; review, not year swap |
| 4 | Fall vs Spring intake | M | country intake hubs |
| 5 | Strong SOP | U | academic integrity |
| 6 | CAS letter | M | UK visa guide |
| 7 | I-20 form | M | USA admissions |
| 8 | Cost from Bangladesh | U | financial planning |
| 9 | Family discussion | P | demand/expert input |
| 10 | Safety and experience comparison | P | credible sources |
| 11 | Cold-country packing | P | lower priority |
| 12 | Culture shock | P | real experiences |
| 13 | Part-time work preparation | P | country legal review |
| 14 | Student health insurance | P | country-specific sources |
| 15 | Open bank account preparation | P | bank-specific advice |
| 16 | Identify misleading agents | U | trust/editorial policy |

### B — UK

| # | Topic | Decision | Reason / evidence gate |
|---|---|---|---|
| 1 | Russell Group | P | independent value |
| 2 | Affordable UK cities | P | dated costs |
| 3 | Business/MBA universities | P | institution data |
| 4 | Computer Science universities | P | verified catalogue |
| 5 | Immigration Health Surcharge | M | official dated source |
| 6 | Student dependant rules | M | visa guide |
| 7 | Pre-CAS interview | U | interview preparation |
| 8 | Masters universities | P | catalogue overlap |
| 9 | January intake | M | verified finder |
| 10 | May/September intakes | M | verified finder |
| 11 | Accommodation | P | sources/capacity |
| 12 | Manchester vs London | P | evidence/intent |
| 13 | Scholarships for Bangladesh | U | verified awards |
| 14 | Financial requirements | M | official current evidence |
| 15 | Graduate visa/effective dates | U | P0 reviewer |
| 16 | After UK visa refusal | P | official guidance/reviewer |
| 17 | UK student work rights | M | conditional rules |

### C — USA

| # | Topic | Decision | Reason / evidence gate |
|---|---|---|---|
| 1 | F1 interview questions | U | interview service |
| 2 | F1 interview preparation | M | duplicate intent |
| 3 | STEM OPT extension | P | USCIS source |
| 4 | Community college vs university | P | SERP validation |
| 5 | Selective US admissions | P | institution sources |
| 6 | GRE/GMAT requirements | P | institution-specific |
| 7 | On-campus work CPT OPT | P | DHS/USCIS |
| 8 | Texas universities | P | verified catalogue |
| 9 | New York universities | P | verified catalogue |
| 10 | USA intake deadlines | M | course-level dates |
| 11 | US admission essay | M | SOP integrity |
| 12 | Recommendation letters | P | counsellor expertise |
| 13 | 214(b) refusal | P | State Department |
| 14 | I-20/sponsor documents | M | official sources |
| 15 | Professional interview preparation | M | interview guide |
| 16 | SEVIS fee | P | current official source |
| 17 | Women in STEM opportunities | P | verified awards |

### D — Canada

| # | Topic | Decision | Reason / evidence gate |
|---|---|---|---|
| 1 | Study permit process | U | visa guide |
| 2 | SDS vs Non-SDS | R | SDS ended; historical only |
| 3 | Ontario universities | P | verified catalogue |
| 4 | British Columbia universities | P | verified catalogue |
| 5 | Post-study immigration pathways | P | neutral IRCC review |
| 6 | Co-op programs | P | institution/IRCC |
| 7 | Vancouver vs Toronto | P | dated costs |
| 8 | Study plan/letter of explanation | M | truthful authorship |
| 9 | Financial requirements | M | IRCC dated evidence |
| 10 | Affordable accommodation | P | reliable data |
| 11 | Changing institutions/programs | P | current IRCC |
| 12 | Spouse/family rules | P | current eligibility |
| 13 | Provincial pathways | P | no easy PR |
| 14 | Diploma vs degree | P | sources/intent |
| 15 | Biometrics and medical | M | IRCC guide |
| 16 | Processing times | P | date and official tool |

### E — Australia and Other Destinations

| # | Topic | Decision | Reason / evidence gate |
|---|---|---|---|
| 1 | Australia Genuine Student | U | official source |
| 2 | Regional Australia study | P | current policy |
| 3 | Sydney vs Melbourne | P | dated comparison |
| 4 | Subclass 500 processing times | P | dated official tool |
| 5 | Study areas/skilled migration | P | no PR promise |
| 6 | Ireland Stamp 1G | P | official source |
| 7 | Ireland technology study | P | institution data |
| 8 | Dublin cost of living | P | dated sources |
| 9 | New Zealand post-study work | P | Immigration NZ |
| 10 | Dubai admissions/cost/evidence | R | remove unsupported claims |
| 11 | Branch campus transfer | P | verify agreements |
| 12 | Malta visa/costs | P | official source |
| 13 | English options in Europe | P | institution-specific |
| 14 | Public vs private Australia | P | regulator evidence |
| 15 | Australia OSHC | P | official sources |
| 16 | Australia South Asian scholarships | P | verify awards |
| 17 | Germany costs/requirements | P | official/institution sources |

### F — High-conversion Problems

| # | Topic | Decision | Reason / evidence gate |
|---|---|---|---|
| 1 | Explain a study gap | P | no universal rules |
| 2 | Options after visa refusal | P | country-specific review |
| 3 | Bangladesh education financing | U | verified providers |
| 4 | Student-file banking | P | verify each bank |
| 5 | Police clearance | P | official source |
| 6 | US home-country ties | M | truthful guidance |
| 7 | Airport and border questions | P | official advice |
| 8 | Travel vs health insurance | P | country/contract |
| 9 | AI tools for students | U | only working tested tools |
| 10 | Unsupported 98% visa success article | R | remove unless audited |
| 11 | Application mistakes | U | existing resources |
| 12 | How early to apply | U | program-specific dates |
| 13 | Lower grades/options | P | institution verification |
| 14 | Direct entry vs pathway | P | verify agreements |
| 15 | Scholarship success story | P | proof/consent |
| 16 | Visa journey case study | P | proof/consent |
| 17 | When consultant adds value | U | transparent scope |

## 9. Information Architecture

Retain `/destinations/{uk,usa,canada,australia,ireland,new-zealand,dubai}` and existing `/destinations/[slug]/{visa-guide,universities,courses,scholarships,admission-requirements,cost-calculator}` where verified to work, `/services/{visa-guidance,application-assistance,course-matching,scholarship-guidance,sop-cv-support}`, `/course-finder`, `/universities/{slug}`, `/courses/{slug}`, `/blog/{slug}`, `/contact`, `/book-consultation`. This is a checkout route map, not proof each is publicly indexable. For Dubai aliases, inspect first and consolidate only with equivalence and redirect tests. New guides/tools follow existing CMS conventions after inventory, not automatic `/study-in-*` migration.

Navigation: destination hub → relevant visa, course, institution and scholarship spokes → appropriate consultation/eligibility action. Contextual backlinks to hub and adjacent useful content; use natural anchors. Breadcrumbs mirror actual hierarchy and visible UI. Self-canonical unique content; variant parameter/filter results use tested canonical/noindex policies based on intent, allowing discovery of meaningful paginated pages; parameters can rank. Sitemap contains canonical, public, 200/indexable pages with factual lastmod. Any migration: map, test 301, update links/canonical/sitemap, monitor GSC and rollback.

## 10. WEB_CRM Product Specification

**Existing, not greenfield:** checkout contains `/crm/seo-manager`, dashboard components, `src/app/api/seo/{audit,health,keywords,opportunities,search-console,stats,tasks}`, `SeoOpportunity`, `SeoTask`, `src/lib/seo/{ga4,search-console-client,request-access}`, and attribution plumbing. `requireSeoStaff` limits listed SEO routes to staff roles and checks mutation origin. Policy watcher currently says no verified feed; its historical fixture is not operational. Verify integrations, RBAC and durability before reuse; do not present fixture data as live.

**Menu/screens:** Executive; Technical Health; Keyword/Opportunities; Competitors/SERP; Content Planner; Sources/Claims; Briefs/Versions/Reviews/QA/Publishing; Internal Links; Freshness; Backlinks/Outreach; Local; Performance/AI Search; Attribution; Experiments; Alerts; Agent Operations. Every panel shows source, last successful sync, sample/coverage, access status, owner, date filters and `unavailable` rather than fabricated zero.

**Roles:** SEO_ADMIN configuration and grants; SEO_MANAGER planning; SEO_EDITOR edits; COUNTRY_REVIEWER source/high-risk approval; COUNSELLOR_AUTHOR expert input; DEVELOPER technical work; ANALYST ingestion/reporting; PUBLISHER release of approved immutable version; VIEW_ONLY scoped read. Server checks staff authentication and project scope on every endpoint; separate review/publish; no agent approval. Map existing roles explicitly. Audit sensitive exports and all writes.

**Schema proposal (additive; index project/status/due/source/page/date; migration and retention review):**

| Entity | Fields beyond primary id/created/updated | Integrity |
|---|---|---|
| `seo_projects` | name, domain, market, language, timezone, status, start/end | unique domain/project scope |
| `seo_pages` | project, normalized URL, slug, type, country, level, cluster, keyword, intent, stage, owner/author/reviewer, canonical, robots, publication/update/verification/review dates, scores | unique project+normalized URL; nullable scores unknown |
| `seo_keywords`, `seo_keyword_page_map` | keyword/market/language/intent/funnel/destination, volume/CPC/competition provider/date, position/url, score/action; relation/confidence/risk | unique market keyword; no fake metric defaults |
| `seo_serp_snapshots`, `seo_competitors` | query/time/location/locale/device/rank/URL/type/notes; competitor name/domain/type/country/last audit | provenance and lawful collection |
| `seo_sources` | URL/domain/title/jurisdiction/topic/type, published/updated/retrieved/effective/expiry/review, hash/trust/verification | verified snapshot, URL alone insufficient |
| `seo_claims` | page/version, exact text, jurisdiction/volatility/source, verified/effective/expiry, confidence, human review/reviewer/status | version immutable; reviewed evidence link |
| `seo_content_briefs`, `seo_content_versions`, `seo_content_reviews` | objective, intent/audience/CTA, source/link/value requirements; body/creator/model/prompt/source snapshots; reviewer/type/result/date | immutable version; approvals bind content and evidence hash |
| `seo_internal_links`, `seo_backlinks`, `seo_outreach` | source/target/anchor/context/status/check; external source/target/relationship/date; org/contact/owner/follow-up/status | no link spam; audit consent/external URLs |
| `seo_gsc_daily` | property/date/page/query/country/device/appearance/clicks/impressions/position | dimensional unique key; row limits/coverage indicated |
| `seo_ga4_daily`, `seo_ai_search_visibility` | date/landing/source/medium/campaign/sessions/engaged/events; AI impressions/page/country/device/report type when supported | nullable unknown; report/API availability verified |
| `seo_lead_attribution` | lead id/consent basis, first/latest landing/source/medium, UTM/referrer, pseudonymous id, first visit/lead time, cluster/page | no raw PII in analytics id; restricted encrypted join; deletion/retention |
| `seo_agent_runs`, `seo_prompt_versions`, `seo_alerts` | agent/task/status/input hash/prompt/model/timestamps/usage/cost/output/errors; approved prompt lifecycle; alert severity/entity/owner/status | immutable audit; redact sensitive data |
| `seo_workflow_events`, `seo_job_runs` | actor/time/from/to/note/version/source hash; job key/attempt/status/checkpoint/error | append-only; idempotency/dead-letter |

**Workflow:** IDEA→RESEARCH_PENDING→SOURCES_COLLECTED→FACTS_VERIFIED→BRIEF_READY→AI_DRAFTED→FACT_CHECK→SEO_QA→EXPERT_REVIEW→APPROVED→SCHEDULED→PUBLISHED→INDEX_STATUS_PENDING→MONITORING→UPDATE_REQUIRED/ARCHIVED. Server enforces allowed transitions; high-risk publication requires current claim evidence, named independent reviewer, approval of exact version and source snapshot, QA pass and authorized publisher. Edits, changed/expired sources or withdrawn approval invalidate approval. Schedule and publish recheck atomically; no agent grants its own approval. Failed checks block release with actionable reasons.

**API convention:** GET requires scoped read role; POST requires relevant editor/manager/reviewer/publisher/analyst role + origin/CSRF + project scope. Mutations require `Idempotency-Key` (unique actor/operation/key and request hash; conflict on changed payload), bounded JSON schema, correlation ID and append-only before/after audit without secrets. Return `{data, provenance, asOf, requestId}` or `{error:{code,message,details},requestId}`. `400` invalid, `401` unauthenticated, `403` denied, `404` scoped not found, `409` conflict/stale version, `422` gate failure, `429` rate limit, `503` provider unavailable; transactions couple action to audit/outbox.

| Endpoint | Authorization; request → response | Validation/error |
|---|---|---|
| GET `/api/seo/projects/{id}/dashboard` | viewer; date range → KPI/provenance | unavailable explicitly null |
| GET `/api/seo/opportunities` | viewer; filters/pagination → rows | missing data insufficient |
| POST `/api/seo/research/run` | editor; page/jurisdiction/objective → job | approved sources, SSRF controls |
| GET `/api/seo/sources`; POST `/api/seo/sources/verify` | viewer; editor submits source/claim → review task | human confirms support, not URL existence |
| POST `/api/seo/briefs`, `/drafts` | editor; page/evidence/prompt → version | volatile missing source blocks |
| POST `/api/seo/fact-check`, `/qa` | editor; version → findings | no auto-approval |
| POST `/api/seo/reviews/{id}/approve` | reviewer; exact version/source hashes/decision → audit | separation of duties, expired evidence blocked |
| POST `/api/seo/publications/schedule`, `/publish` | publisher; version/time → job/result | revalidate on execution; stale version conflict |
| GET `/api/seo/pages/{id}/performance` | viewer; dates → metrics/coverage | preserve provider timezone |
| POST `/api/seo/sync/gsc`, `/sync/analytics` | analyst; project/dates → job | least privilege, quotas, idempotent upsert |
| POST `/api/seo/source-watch/run` | manager; source ids → job | allowlist hosts; never autopublish |
| POST `/api/seo/internal-links/suggest` | editor; page version → proposed links | editorial review |
| POST `/api/seo/opportunities/recalculate` | analyst; cohort/date → run | missing inputs prevent score |
| POST `/api/seo/webhooks/lead-status-changed` | verified internal service; event id/lead/status/time → accepted | signature/replay protection, consent, event idempotency |

**Jobs:** daily GSC/GA4 sync, volatile source hash, publication checks, stale-review alerts; weekly scoring, links, decay/backlinks; monthly crawl, competitor/local inventory and KPI review. Queue exponential retry for transient failures with jitter, bounded attempts, dead-letter + owner alert, replay-safe keys and durable checkpoints. Auth errors block and require reconnection. Normalize noisy source snapshots and send diffs to humans, never auto-publish policy changes.

## 11. Multi-Agent AI System Specification

All JSON output schemas extend `{runId, agent, taskId, inputHash, promptVersion, model, sourceIds:[], startedAt, finishedAt, status, warnings:[], humanApprovalRequired}`. Tools scoped/read-only by default; retrieval uses allowlisted official hosts, DNS/IP revalidation, redirect and size/time limits. External content cannot override instructions. No secrets or raw sensitive student fields in prompts/logs. Human owns actual publication.

| Agent | Inputs / permitted tools / process | Output JSON additions | Failure / approval |
|---|---|---|---|
| Orchestrator | objective/page/policy; queue; schedule dependencies | `steps:[{agent,dependsOn,status}], blockers:[], approvals:[]` | missing evidence/reviewer blocks; cannot bypass gate |
| Technical Audit | crawl, raw/rendered snapshots, headers/PSI; read parser | `issues:[{url,evidence,severity,impact,fix,test,owner,effort,due}]` | partial coverage marked; dev triages |
| Search Opportunity | GSC, CRM aggregates, score function | `opportunities:[{query,page,score,completeness,action,evidence}]` | missing metric→insufficient; manager approves |
| SERP Research | lawful localized SERP/page snapshots | `results:[{query,locale,device,url,type,observedAt}], gaps:[]` | missing search→unknown; editor verifies |
| Policy Research | jurisdiction/topic, official retrieval | `claims:[{claim,jurisdiction,topic,currentRule,effectiveDate,transitionDate,sourceUrl,retrievedAt,confidence,volatility}]` | missing primary source→block; reviewer mandatory |
| Source Verification | claims/snapshots | `checks:[{claimId,sourceId,supports,scope,superseded,notes}]` | contradictory or secondary only→block |
| Brief | intent/CRM aggregate/approved sources | `brief:{audience,goal,cta,topics,sourceIds,uniqueValue,links,reviewCadence}` | missing intent/source→pending; editor approves |
| Draft | approved brief/sources/expert input | `draft:{versionId,body,claimRefs,unresolvedClaims}` | unsupported promises→block; never publish |
| Fact Check | version/evidence | `findings:[{sentence,class,sourceId,issue,correction}]` | unresolved high-risk claim→fail; human review |
| SEO QA | exact version/metadata/links/schema | `result:PASS|PASS_WITH_WARNINGS|FAIL, checks:[{name,result,evidence}]` | hard requirement missing→fail |
| Internal Link | version/page graph | `suggestions:[{source,target,anchor,context,reason,confidence}]` | unavailable graph→partial; editor approves |
| Publishing | immutable approved version/release state | `publication:{versionId,url,gateChecks,jobId}` | failed gate/race→block; authorized publisher triggers |
| Performance | observed metrics/CRM aggregates | `pages:[{page,class,primaryAction,evidence,coverage}]` | unavailable→unknown; analyst approves |
| Freshness Watchdog | snapshots/due dates | `alerts:[{sourceId,affectedClaimIds,changeHash,due,severity}]` | provider failure→alert, not stable; reviewer |
| Local SEO | verified offices/GBP export | `locations:[{id,issues,evidence,actions}]` | unverified location→no page; local owner |
| Authority Opportunity | relationships/outreach | `prospects:[{organization,relationship,evidence,target,owner,nextAction}]` | no consent/relationship→no outreach; PR approves |

Visa practice MVP: consented minimal inputs, practice-only disclaimer, no invented answers or deception; structured clarity/consistency feedback, no score marketed as probability. Course matcher MVP: verified catalogue only, disclose missing fields, explain each match and offer human review; no admission guarantee. Both require adversarial tests, retention/deletion controls, model failure/abuse limits and event tracking. Existing checkout features need testing, not claims of production readiness.

## 12. Analytics and Attribution Plan

**Flow:** consented first touch → first/latest landing/referrer and UTM in first-party storage → lead capture with consent → restricted CRM attribution → status events with event IDs/times → aggregate reports. Honor opt-out/retention; no names, email, phone, passport or visa history in GA4, referrers or URL parameters. Define lawful cross-domain linker for actual domains, no PII, short TTL, test consent/cookies; do not assume identity.

**Events:** `consultation_cta_click`, `whatsapp_cta_click`, `generate_lead`, `course_match_started/completed`, `eligibility_check_started/completed`, `visa_mock_started/completed`, `consultation_booked`; CRM `qualify_lead`, `disqualify_lead`, `working_lead`, `application_started/submitted`, `offer_received`, `deposit_paid`, `visa_approved`, `enrolled`, `close_convert_lead`, `close_unconvert_lead`. Properties: opaque event ID, page/cluster/country where consented, source, occurred_at, schema version; financial values restricted. Map current GA4 recommended lead events correctly; CRM milestones are custom. Deduplicate client/server events by ID.

**Pipeline:** MVP read-only GSC Search Analytics + GA4 reporting API + CRM daily, preserving property/timezone/retrieval/granularity/filtering/row limits/partial results. Scalable mode: GSC bulk export, GA4 BigQuery, secure CRM export, warehouse partitions/retention. GSC click ≠ GA4 session (consent, blockers, canonical URL, timezone, attribution and processing). AI impressions are a subset view and cannot be added to total Search impressions. Property/API support must be verified; don't invent AI clicks.

**Funnel:** organic session → lead → qualified → consultation → application started → submitted → offer → deposit → visa outcome → enrolment. Define cohort, timestamp, attribution window and lag. First/last touch separately; deduplicate lead IDs. Qualified/lead, application/qualified, offer/submitted include denominator/sample size and null when zero. Organic pipeline/revenue requires CRM value/currency/maturity; otherwise D. Use 7d, 28d, preceding 28d, 90d views; de-identified aggregation and access logs.

## 13. Local SEO Plan

Panthapath is visible on `/contact`; other snippets conflict and may be stale. Management must verify every office's existence, eligibility, profile, street, pin, hours, holiday hours and phone before GBP/schema edits. Do not assert additional real locations. One useful page per verified location only; match NAP, real photos and booking. GBP metrics require access.

**Review workflow:** invitations after a consistent service milestone (e.g. consultation/application-support completion), across eligible experiences and outcomes—not only approved visa/enrolment or predicted positive students. Check consent, prior request and timing; send a neutral link without incentive; at most one consent-compliant reminder; log request time/channel, opt-out and response where available. Do not suppress negative feedback. This corrects the seed's success-only trigger, which could bias solicitation.

## 14. Authority Plan

University links: verify real authorized relationship/contact; request relevant representative listing, record permission, owner/date/status/live URL; do not claim partnership from CRM alone. Digital PR: pitch supported findings with methods/limitations; no manipulative paid links. Original study: approved de-identified cohort, collection period, consent/legal basis, sample size, suppression thresholds, methodology and limitations; no causal inference/re-identification; privacy and management approval. Alumni stories: informed consent, withdrawal, document-backed timeline, no guarantee or fabricated quotation.

**University outreach:** “Hello [verified contact], ALO and [institution] have [verified relationship]. If appropriate, would you review our details for your official representative directory? We can provide the current agreement and contact information. Thank you, [real owner].”

**Media outreach:** “We have an anonymized Bangladesh study-intent analysis covering [actual period and sample], with methods and limitations. Would you like the report and an interview with [verified expert]?” Do not fill placeholders until evidence exists.

## 15. KPI Framework

| Tier | Measure | Definition / target setting |
|---|---|---|
| Leading | indexability, impressions, pages gaining queries, 5–20 positions, CTR, tool starts/completions | GSC and tests, field vs lab, device/country |
| Mid | organic leads, qualified leads, consultations, application starts | deduplicated consent-aware CRM funnel and coverage |
| Lagging | submitted applications, offers, deposits, visa outcomes, enrolments, revenue | first-touch cohort/maturity, reconciled CRM; suppress small cohorts |
| Safety | overdue claims, blocked releases, reviewer turnaround, provider failures, P0 closure | auditable source/version events |

After a 28-day baseline and four prior comparable weeks, review historical variance, seasonal intakes and capacity; set ranges for leading indicators and 90–180-day cohort lagging metrics. Zero unapproved high-risk publishing and traceable sources are engineering acceptance targets, not SEO promises. D is not zero.

## 16. First 20 Development Tickets

Common user story: **As an authorized operator, I need this capability with provenance so I can make safe decisions.** Common test plan: unit tests for valid/invalid/access; integration tests for persistence/idempotency/rollback; audit and UI empty/error-state tests. No ticket is already implemented unless verified.

### D01 — Resolve deployment parity
- **Problem:** Live and checkout robots/finder differ. **User story:** common story above.
- **Scope:** Record deployed SHA/config/routes. **Acceptance criteria:** Observed outputs and rollback documented.
- **Dependencies:** release access. **Priority:** P0. **Owner type:** Release engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D02 — Correct UK Graduate content
- **Problem:** Duration ignores 2027 transition. **User story:** common story above.
- **Scope:** Inventory data/templates/metadata and update. **Acceptance criteria:** Rendered claims distinguish dates and doctorate; reviewer signs.
- **Dependencies:** official source. **Priority:** P0. **Owner type:** Frontend + reviewer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D03 — Remediate Dubai claims
- **Problem:** Page promises 100% and timing. **User story:** common story above.
- **Scope:** Qualify unsupported claims across surfaces. **Acceptance criteria:** No unsupported success/timing; links preserved.
- **Dependencies:** editorial review. **Priority:** P0. **Owner type:** Frontend + reviewer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D04 — Legacy SDS quarantine
- **Problem:** Ended SDS claim in legacy source. **User story:** common story above.
- **Scope:** Trace reachability and rewrite safely. **Acceptance criteria:** No public current SDS advice; redirects preserved.
- **Dependencies:** IRCC review. **Priority:** P0. **Owner type:** Developer + reviewer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D05 — Sitemap canonical parity
- **Problem:** User-guide and alias mismatch. **User story:** common story above.
- **Scope:** Generate eligible canonical URLs. **Acceptance criteria:** Samples public, canonical and indexable.
- **Dependencies:** crawl. **Priority:** P1. **Owner type:** SEO engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D06 — URL mapping and redirects
- **Problem:** Legacy URLs may reach staff login. **User story:** common story above.
- **Scope:** Inventory mappings and test relevant 301s. **Acceptance criteria:** No loops; old URL maps to valid equivalent.
- **Dependencies:** GSC/crawl. **Priority:** P1. **Owner type:** Developer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D07 — Project/page registry
- **Problem:** No complete durable SEO project model. **User story:** common story above.
- **Scope:** Add scoped registry and migrations. **Acceptance criteria:** Scoped CRUD and unique canonical URL; rollback.
- **Dependencies:** schema review. **Priority:** P1. **Owner type:** Backend. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D08 — Source/claim registry
- **Problem:** No versioned evidence for claims. **User story:** common story above.
- **Scope:** Add snapshots, hashes, claim relations/dates. **Acceptance criteria:** URL alone cannot verify a claim.
- **Dependencies:** project registry. **Priority:** P1. **Owner type:** Backend. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D09 — Immutable versions/reviews
- **Problem:** Approval may drift after edits. **User story:** common story above.
- **Scope:** Store version and source hashes. **Acceptance criteria:** Edit or changed source invalidates approval.
- **Dependencies:** source registry. **Priority:** P1. **Owner type:** Backend. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D10 — Workflow enforcement
- **Problem:** UI states alone are bypassable. **User story:** common story above.
- **Scope:** Server transition graph and audit. **Acceptance criteria:** Unapproved high-risk publish always fails.
- **Dependencies:** versioning. **Priority:** P0. **Owner type:** Security backend. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D11 — Publisher outbox
- **Problem:** Publishing needs atomic gate. **User story:** common story above.
- **Scope:** Idempotent queue and revalidation. **Acceptance criteria:** Retry publishes once; stale version fails closed.
- **Dependencies:** workflow. **Priority:** P1. **Owner type:** Backend. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D12 — SEO roles/project scope
- **Problem:** Existing staff guard is coarse. **User story:** common story above.
- **Scope:** Map roles and authorize server-side. **Acceptance criteria:** Cross-project and agent approval denied.
- **Dependencies:** registry. **Priority:** P1. **Owner type:** Security. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D13 — Safe source watcher
- **Problem:** Volatile info becomes stale. **User story:** common story above.
- **Scope:** Allowlist fetch and hash normalized snapshots. **Acceptance criteria:** Change alerts, timeouts and SSRF denial; no autopublish.
- **Dependencies:** source registry. **Priority:** P1. **Owner type:** Backend. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D14 — GSC ingestion
- **Problem:** Live data unverified. **User story:** common story above.
- **Scope:** Least-privilege sync/checkpoints/provenance. **Acceptance criteria:** Retry safe; partial rows flagged; auth failure visible.
- **Dependencies:** GSC access. **Priority:** P1. **Owner type:** Data engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D15 — GA4 ingestion
- **Problem:** Sessions/events unverified. **User story:** common story above.
- **Scope:** Consent-aware reports/timezone metadata. **Acceptance criteria:** Unknowns null; no sensitive fields; idempotent.
- **Dependencies:** GA4 access. **Priority:** P1. **Owner type:** Data engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D16 — Opportunity scoring
- **Problem:** Missing data risks false scores. **User story:** common story above.
- **Scope:** Implement stated scoring and unknown gate. **Acceptance criteria:** No score when inputs missing; sample tests.
- **Dependencies:** GSC GA4 CRM. **Priority:** P1. **Owner type:** Data engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D17 — Attribution/event joins
- **Problem:** Lead source/outcome link unverified. **User story:** common story above.
- **Scope:** Consent-aware first/latest touch and retention. **Acceptance criteria:** Synthetic lead traces; no PII in GA4; opt-out works.
- **Dependencies:** privacy approval. **Priority:** P1. **Owner type:** CRM engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D18 — Source QA/schema checks
- **Problem:** Evidence may be missing. **User story:** common story above.
- **Scope:** Prepublish validators and visible errors. **Acceptance criteria:** Unsourced/expired claims fail; schema matches UI.
- **Dependencies:** claims workflow. **Priority:** P1. **Owner type:** Backend + SEO. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D19 — AI practice safety
- **Problem:** Tool may hallucinate/coach deception. **User story:** common story above.
- **Scope:** Disclaimers, consent, controls, review. **Acceptance criteria:** Adversarial tests pass, no outcome promise.
- **Dependencies:** privacy/policy. **Priority:** P1. **Owner type:** AI engineer. **Test plan:** common tests plus targeted end-to-end acceptance validation.

### D20 — Observability/dead letters
- **Problem:** Failures may be ignored. **User story:** common story above.
- **Scope:** Job status, retry, alert, replay. **Acceptance criteria:** Failed provider run visible and never marked success.
- **Dependencies:** queue design. **Priority:** P1. **Owner type:** Platform. **Test plan:** common tests plus targeted end-to-end acceptance validation.

## 17. First 20 SEO Execution Tickets

Common user story: **As an editorial owner, I need evidence-backed actions so students receive accurate guidance and outcomes can be measured.** Common test plan: verify source links/dates, screenshots or exports, independent owner sign-off and no unsupported claim.

### S01 — UK Graduate emergency
- **Problem:** Page omits transition. **User story:** common story above.
- **Scope:** Find all occurrences; approve replacement. **Acceptance criteria:** Reviewer signs date/doctorate wording.
- **Dependencies:** GOV.UK. **Priority:** P0. **Owner type:** Country reviewer. **Test plan:** common tests plus independent acceptance verification.

### S02 — Dubai claims triage
- **Problem:** Unsupported success/timing. **User story:** common story above.
- **Scope:** Remove unsupported claims. **Acceptance criteria:** No promise in live HTML/cache.
- **Dependencies:** release access. **Priority:** P0. **Owner type:** Compliance editor. **Test plan:** common tests plus independent acceptance verification.

### S03 — SDS inventory
- **Problem:** Ended stream in legacy source. **User story:** common story above.
- **Scope:** Map live URLs and rewrite/retire safely. **Acceptance criteria:** No current SDS advice; redirect evidence.
- **Dependencies:** IRCC/crawl. **Priority:** P0. **Owner type:** Canada reviewer. **Test plan:** common tests plus independent acceptance verification.

### S04 — Current-state crawl
- **Problem:** No complete crawl. **User story:** common story above.
- **Scope:** Collect status/robots/canonical/links. **Acceptance criteria:** Timestamped inventory/issues.
- **Dependencies:** crawler. **Priority:** P1. **Owner type:** Technical SEO. **Test plan:** common tests plus independent acceptance verification.

### S05 — GSC baseline
- **Problem:** No visibility baseline. **User story:** common story above.
- **Scope:** Export 90d/28d property dimensions. **Acceptance criteria:** Reproducible baseline/limits.
- **Dependencies:** GSC access. **Priority:** P1. **Owner type:** Analyst. **Test plan:** common tests plus independent acceptance verification.

### S06 — GA4 baseline
- **Problem:** No session baseline. **User story:** common story above.
- **Scope:** Document consent, traffic/events. **Acceptance criteria:** Reproducible 28d report/timezone.
- **Dependencies:** GA4 access. **Priority:** P1. **Owner type:** Analyst. **Test plan:** common tests plus independent acceptance verification.

### S07 — CRM funnel baseline
- **Problem:** No outcome evidence. **User story:** common story above.
- **Scope:** Deidentify and aggregate stages. **Acceptance criteria:** Reconciled cohort/missing data.
- **Dependencies:** CRM access. **Priority:** P1. **Owner type:** CRM analyst. **Test plan:** common tests plus independent acceptance verification.

### S08 — Verify GBP/NAP
- **Problem:** Conflicting snippets. **User story:** common story above.
- **Scope:** Verify offices, hours, ownership. **Acceptance criteria:** Approved source of truth.
- **Dependencies:** management/GBP. **Priority:** P1. **Owner type:** Local manager. **Test plan:** common tests plus independent acceptance verification.

### S09 — Raw vs DOM audit
- **Problem:** No rendering comparison. **User story:** common story above.
- **Scope:** Compare eight template types. **Acceptance criteria:** Evidence for body, links, metadata/schema.
- **Dependencies:** browser/crawler. **Priority:** P1. **Owner type:** Technical SEO. **Test plan:** common tests plus independent acceptance verification.

### S10 — Field/lab performance
- **Problem:** No LCP INP CLS data. **User story:** common story above.
- **Scope:** Collect CrUX/PSI/Lighthouse. **Acceptance criteria:** Mobile/desktop field/lab report.
- **Dependencies:** PSI/CrUX. **Priority:** P1. **Owner type:** Performance engineer. **Test plan:** common tests plus independent acceptance verification.

### S11 — Money-page inventory
- **Problem:** Seed URLs may duplicate. **User story:** common story above.
- **Scope:** Map 30 topics to URLs/SERPs. **Acceptance criteria:** One candidate/action per topic.
- **Dependencies:** crawl/GSC. **Priority:** P1. **Owner type:** SEO manager. **Test plan:** common tests plus independent acceptance verification.

### S12 — UK hub update
- **Problem:** Content needs review. **User story:** common story above.
- **Scope:** Refresh sourced guidance. **Acceptance criteria:** Approved version/CTA/review date.
- **Dependencies:** UK triage. **Priority:** P1. **Owner type:** Editor. **Test plan:** common tests plus independent acceptance verification.

### S13 — USA hub update
- **Problem:** Admissions content unvalidated. **User story:** common story above.
- **Scope:** Research intent/institution sources. **Acceptance criteria:** Approved content and tracking.
- **Dependencies:** inventory. **Priority:** P1. **Owner type:** Editor. **Test plan:** common tests plus independent acceptance verification.

### S14 — Canada hub update
- **Problem:** Policy volatility/SDS. **User story:** common story above.
- **Scope:** Update permit/PGWP. **Acceptance criteria:** IRCC sources/effective dates reviewed.
- **Dependencies:** SDS audit. **Priority:** P1. **Owner type:** Canada reviewer. **Test plan:** common tests plus independent acceptance verification.

### S15 — Australia hub update
- **Problem:** 2026 policy changes. **User story:** common story above.
- **Scope:** Review GS/subclass 500. **Acceptance criteria:** Reviewer-approved conditional language.
- **Dependencies:** official sources. **Priority:** P1. **Owner type:** Australia reviewer. **Test plan:** common tests plus independent acceptance verification.

### S16 — Claims baseline
- **Problem:** No complete claim inventory. **User story:** common story above.
- **Scope:** Record high-risk claims/sources/dates. **Acceptance criteria:** Each published claim has review owner/date.
- **Dependencies:** registry. **Priority:** P1. **Owner type:** Researcher. **Test plan:** common tests plus independent acceptance verification.

### S17 — Competitor/SERP research
- **Problem:** Position/gaps unverified. **User story:** common story above.
- **Scope:** Capture localized results and pages. **Acceptance criteria:** Methods/date/device/noninvented metrics.
- **Dependencies:** search tooling. **Priority:** P2. **Owner type:** SEO analyst. **Test plan:** common tests plus independent acceptance verification.

### S18 — Internal link plan
- **Problem:** Orphans unknown. **User story:** common story above.
- **Scope:** Map hub/spoke links from crawl. **Acceptance criteria:** Useful tested links, no forced anchors.
- **Dependencies:** crawl. **Priority:** P2. **Owner type:** SEO editor. **Test plan:** common tests plus independent acceptance verification.

### S19 — Real stories and experts
- **Problem:** Trust claims need evidence. **User story:** common story above.
- **Scope:** Collect consent and verify credentials. **Acceptance criteria:** Approved records and withdrawal process.
- **Dependencies:** legal approval. **Priority:** P2. **Owner type:** Content lead. **Test plan:** common tests plus independent acceptance verification.

### S20 — University outreach
- **Problem:** Relationships unverified. **User story:** common story above.
- **Scope:** Verify agreements then contact owners. **Acceptance criteria:** Outreach log and genuine placements.
- **Dependencies:** relationship owner. **Priority:** P2. **Owner type:** PR lead. **Test plan:** common tests plus independent acceptance verification.

## 18. Risk Register

| Risk | Impact / trigger | Mitigation and owner |
|---|---|---|
| Policy freshness | misleading eligibility after changes | source watch, event-triggered review; country lead |
| AI hallucination | fabricated fees/waivers/stories | claim evidence, fail-closed QA, human approval; AI lead |
| Search spam / overproduction | mass low-value pages | intent and unique-value gate; SEO lead |
| Duplicate / cannibalization | competing URLs | crawl/GSC mapping, avoid unnecessary migrations; SEO engineer |
| Incorrect immigration content | applicant harm | P0 triage, official dates, reviewer and rollback; compliance |
| Tracking loss / cross-domain | wrong attribution | consent-aware IDs, synthetic reconciliation; analyst |
| Review policy | biased/incentivized reviews | neutral invitations across outcomes; local manager |
| Privacy | exposure of passport/visa/PII | minimization, encryption, least privilege, retention and deletion; privacy officer |
| Provider outage | missing data mistaken for success | unavailable state, retries/dead-letter; platform |
| Developer capacity | backlog stalls | P0-first and small releases; product manager |
| SSRF / prompt injection | unsafe source retrieval | host allowlist, DNS/IP checks, bounded content; security |
| Deployment divergence | fixes not actually live | SHA and external smoke tests; release owner |

## 19. Definition of Done

- **Technical fix:** before/after evidence; acceptance tests; canonical/redirect/robots/sitemap checks; release SHA, production smoke test, rollback and owner sign-off.
- **Content page:** intent/duplicate check, claim sources, named author/reviewer as needed, exact approved version, metadata, links, accessibility, truthful schema, CTA and event, freshness date and production verification.
- **Policy update:** official primary source and jurisdiction, effective/transition dates, affected versions, independent human approval, cache verification and recheck date.
- **AI tool:** tested flow, uncertainty and truthful-use disclaimers, no deception/promise, human escalation, consent/security/retention, adversarial tests and failure handling.
- **CRM feature:** additive migration/rollback, scoped RBAC, server-side gates, idempotency, audited mutations, meaningful errors, unit/integration/security tests and monitoring.
- **Analytics integration:** least privilege and consent, taxonomy/timezone/coverage, synthetic reconciliation, PII exclusion, failure visibility, retention and owner; no fabricated data.
- **Backlink campaign:** real relationship, useful context, compliant outreach, permission when needed, live evidence, owner/follow-up; no purchased manipulation or fake stories.

**Limitations:** This is a blueprint and partial public audit, not a completed build, full crawl, verified search baseline, legal opinion or live-site deployment. Human owners must prioritize and publish P0 corrections, verify deployed versions and obtain read access before replacing D with measured data. Recheck date-sensitive evidence before publication.
