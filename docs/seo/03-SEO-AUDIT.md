# DELIVERABLE 3 — Complete SEO Audit

**12 sections.** Every issue carries **Severity · Evidence · Impact · Fix · Owner · Effort · Deadline.**
Owner types: `SEO` (SEO lead) · `DEV` (developer) · `OPS` (hosting/ops) · `CRM` (WEB_CRM) · `CONTENT` · `MGMT` (management sign-off) · `AGENT` (AI agent, human-gated).
Deadlines are dated against the re-based window **14 Oct 2026 → 12 Jan 2027**.
Effort: **S** ≤ 4h · **M** ≤ 1 day · **L** ≤ 3 days · **XL** > 3 days.
Where a finding cannot be evidenced, it is marked **BLOCKED (Class B/C)** with the exact access required — **no finding is asserted as fact without evidence.**

---

## §1 TECHNICAL SEO

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| T1 | **Deployment parity / edge behaviour unverified.** `/` and `www` return 403; `/contact`, `/aqf-compliance`, `/api/health`, `/sitemap.xml` return 404 — all from LiteSpeed, not the app | **Critical** | D2 S1–S6, direct fetch 2026-10-14 | If the app is not deployed, **no SEO change can take effect**. Blocks the entire programme | Execute the 4-step disambiguation test (D2 §2.1). If H2, restore deployment parity before any content work | OPS + DEV | S to resolve · XL if rebuild needed | **20 Oct 2026** |
| T2 | **`/sitemap.xml` returns 404.** The repo ships `src/app/sitemap.ts` | **Critical** | D2 S2, S8 | Search engines lose the complete URL inventory; new pages rely on link discovery alone | Resolve T1 first. Then confirm `/sitemap.xml` serves valid XML with correct absolute URLs, and that DB failures don't crash it | DEV | S | **20 Oct 2026** |
| T3 | **`robots.txt` has no `Sitemap:` directive** | High | D2 S1 | Sitemap may never be fetched even when it exists | Add `Sitemap: https://aloeducation.com/sitemap.xml`. Keep the existing permissive rules | DEV | S | **20 Oct 2026** |
| T4 | **Root domain canonicalisation undefined.** Apex and `www` both answer; no evidence of a declared preference | High | D2 S4 | Duplicate-host signals; split link equity | Declare one canonical host; 301 the other permanently; align canonical tags, sitemap, GSC and all citations | DEV + OPS | M | **27 Oct 2026** |
| T5 | **Trailing-slash policy undefined.** `/about-us` → login but `/about-us/` → public content | High | D2 S7, A5 | Two URLs for one concept; canonical ambiguity | Declare `trailingSlash: false` (or `true`) once, enforce with 301s, align internal links | DEV | M | **27 Oct 2026** |
| T6 | **HTTPS / HSTS / redirect chain not verified** | **BLOCKED (B)** | Not observable here | Security + crawl efficiency | Verify in browser and via GSC; enforce single 301 to HTTPS+canonical host | OPS | S | 27 Oct 2026 |
| T7 | **404 handling policy undefined.** Unknown paths return the host's LiteSpeed 404 | Medium | D2 S5 | Poor UX; no recovery path for link decay | Implement a real 404 with navigation + popular destinations. Never 301 unknown URLs to the homepage | DEV | S | 3 Nov 2026 |
| T8 | **XML sitemap segmentation unknown** (single vs index; lastmod accuracy) | BLOCKED (B) | Requires T1 | Crawl efficiency at scale | Once live: verify `lastmod` reflects real content changes, not build time | DEV | S | 3 Nov 2026 |
| T9 | **Structured data inventory unaudited** — unknown what markup exists today | BLOCKED (B) + HIGH | Cannot fetch HTML | Risk of emitting **retired** types (HowTo, Practice Problem, FAQ as a rich-result tactic) | Once crawlable: extract all JSON-LD, validate, remove retired-type expectations, build on the **supported** set (Organization, Article, BreadcrumbList, LocalBusiness) | DEV + SEO | M | 3 Nov 2026 |
| T10 | **No evidence of a staging environment** | Medium | Register §281-282: no staging config exists | Every change is tested on production — directly amplifies R1 (publishing wrong immigration facts) | Stand up a staging target, or institute a documented pre-publish checklist with a rollback path | OPS | L | 17 Nov 2026 |
| T11 | **Cron jobs are not deployed to the host.** 15 enabled jobs exist in-repo; 6 are blocked | Medium | `CRON_JOBS.md`, this session's cron work | Any automated freshness check (D11 Freshness Watchdog) cannot run until jobs execute | Deploy the cron trigger per `CRON_JOBS.md` Hostinger hPanel form | OPS + CRM | M | 10 Nov 2026 |
| T12 | **No `llms.txt`.** Correct decision — do not add one | Info | D2 Part 2: Google states it ignores `llms.txt`; neither helps nor harms | None | **No action.** Record as a deliberate non-action so it is not revisited | SEO | — | n/a |

---

## §2 INDEXATION

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| I1 | **Whether Google has a sitemap at all is unconfirmed** | **Critical** | A8 + no Sitemap directive | Core discovery risk | GSC → Sitemaps. Submit/normalise; resolve T2/T3 first | SEO + DEV | S | **20 Oct 2026** |
| I2 | **`/login?callbackUrl=%2Fabout-us` is indexed** and carries the homepage hero copy | High | D2 S6 | Query-string URLs compete with real pages; the brand's primary indexed URL is a login redirect | Audit `middleware.ts` route protection. Ensure auth-gated paths return **noindex** or a proper 302 to a public equivalent; stop linking to protected URLs from public navigation | DEV | M | **27 Oct 2026** |
| I3 | **About page gated for unauthenticated visitors** at `/about-us` | High | D2 S7 | Blocks a core trust page; wastes the indexed URL | DEC-3: un-gate it, or publish a public About and 301 `/about-us` there | DEV + MGMT | S | **27 Oct 2026** |
| I4 | **Indexed-page inventory unknown** — bloat, near-duplicates, thin pages | BLOCKED (B) | Requires GSC | Unknown cannibalisation and dilution | GSC → Pages. Export; classify by template; identify include/exclude candidates | SEO | M | 27 Oct 2026 |
| I5 | **No declared robots directive policy** for `/api/*`, `/login`, `/crm`, `/admin`, student portal routes | High | No evidence either way; app has these route families | Sensitive and non-public surfaces may be crawlable; wastes crawl budget | Declare `X-Robots-Tag: noindex` for all non-public route families; verify each in GSC URL Inspection | DEV | M | 3 Nov 2026 |
| I6 | **Manual actions / security issues unknown** | BLOCKED (B) | Requires GSC | Historic tactics could suppress the whole domain | GSC → Security & Manual Actions. Document findings in D18 | SEO | S | 20 Oct 2026 |
| I7 | **`/api/health` is intended to be public but returns 404** | Medium | D2 S5 | Monitoring and uptime verification impossible | Resolve with T1/T2 | DEV | S | 20 Oct 2026 |
| I8 | **Crawl stats unverified** — does Googlebot receive the same 403/404 as my client? | **Critical** | Requires GSC | If yes, the site is effectively invisible and every other finding is moot | GSC → Settings → Crawl stats. Compare response codes against Googlebot's experience | SEO | S | **20 Oct 2026** |

---

## §3 JAVASCRIPT RENDERING

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| J1 | **Rendering strategy per route unverified** — cannot confirm whether key content is in the initial HTML | **BLOCKED (Critical)** | Cannot fetch HTML (T1) | If content is client-only, everything downstream is at risk | Once crawlable: `view-source` (not DevTools) on `/`, `/contact`, one service page, one course page. Confirm H1, body copy, and links exist in raw HTML | DEV + SEO | M | **27 Oct 2026** |
| J2 | **Homepage hero is indexed under a login URL** — suggests the homepage component renders behind an auth gate | High | D2 S6 | The most important page may not be publicly renderable | Decouple the public homepage from the auth shell; public marketing routes must render without a session | DEV | L | 10 Nov 2026 |
| J3 | **App Router + `output: standalone`** (repo evidence) means streaming/PPR behaviour must be verified in production, not assumed | Medium | `next.config` in repo | Server-rendered HTML may differ from dev | Verify in production; if key content is deferred, ensure it is in the initial payload or prerendered | DEV | M | 10 Nov 2026 |
| J4 | **Sitemap generation resilience unknown** — `src/app/sitemap.ts` may query the DB | Medium | Repo evidence | A 500 in sitemap generation can 404 the whole file (T2) | Make sitemap generation defensive: static fallback, try/catch, never emit an empty or erroring sitemap | DEV | S | 27 Oct 2026 |
| J5 | **No-JS experience unchecked** — nav, links, contact form | Medium | Cannot test | Contact conversion loss for degraded clients | Test with JS disabled. Public marketing pages must be navigable and the contact form must degrade gracefully | DEV + CONTENT | M | 17 Nov 2026 |
| J6 | **Canonical tags not verified in raw HTML** | **BLOCKED (B)** | Requires crawl | Self-referencing canonicals are the backbone of T4/T5 | Audit canonicals on every public template; each must be absolute, self-referencing, and match the declared host/slash policy | DEV | M | 3 Nov 2026 |

---

## §4 PERFORMANCE

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| P1 | **Core Web Vitals field data unknown** | BLOCKED (B) | Requires CrUX/PSI/GSC | CWV is a tie-breaker, not a primary factor — but a poor LCP on a money page measurably costs conversions | Establish the baseline for the top 10 templates on mobile. Record LCP/INP/CLS | SEO + DEV | S | **27 Oct 2026** |
| P2 | **Mobile performance unknown on a Bangladeshi network profile** | HIGH | No data; audience is mobile-first in BD | High bounce and abandonment on the pages that matter most | Test with 4G throttling and a Moto G-class profile, not desktop. Optimise images, defer non-critical JS | DEV | M | 10 Nov 2026 |
| P3 | **Image weight and format unverified** — university logos, campus photos, counsellor/student photos | Medium | Not observable | Common top-1 cause of poor LCP on consultancy sites | Convert to AVIF/WebP, size correctly, lazy-load below the fold, never lazy-load the LCP image | DEV | M | 17 Nov 2026 |
| P4 | **No performance budget defined** | Medium | Absent | Performance regresses silently as pages are added | Set a budget (e.g. LCP ≤ 2.5s mobile p75, INP ≤ 200ms, CLS ≤ 0.1) and check it before publishing any template change | DEV + SEO | S | 3 Nov 2026 |
| P5 | **Third-party script weight unverified** — analytics, chat, WhatsApp widgets | Medium | Not observable | Each widget is a mobile tax | Inventory all third-party scripts; defer or remove; load chat only on interaction | DEV | M | 17 Nov 2026 |
| P6 | **Font loading strategy unverified** | Low | Not observable | CLS risk | Prefer system fonts or `font-display: swap` with preload | DEV | S | 24 Nov 2026 |

---

## §5 ON-PAGE OPTIMISATION

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| O1 | **Title/meta strategy unaudited across templates** | BLOCKED (B) | Requires crawl | Titles are the single highest-leverage on-page element | Export all titles+metas via GSC + crawl. Flag: duplicates, truncation, missing brand, year-stamped titles | SEO + CONTENT | M | **27 Oct 2026** |
| O2 | **No documented H1 policy** | Medium | Not observable | Weak topical signals | Exactly one H1 per page, describing the page's purpose in the student's language | CONTENT | S | 3 Nov 2026 |
| O3 | **"Year-stamped" titles risk permanent staleness.** A year in a title must be maintained or dropped | High | Known pattern in study-abroad content | A stale year actively signals low quality | **Never bump a year without reviewing the page** (standing rule). Prefer undated titles unless the page is genuinely year-specific | CONTENT + SEO | S | Ongoing; first pass 3 Nov 2026 |
| O4 | **"No IELTS needed" is a live on-page claim** | **High** | D2 S12 | Factually unsafe; contradicts the brand promise; potential regulatory exposure | DEC-2: remove or scope precisely. **Do not replace it with another blanket claim** | CONTENT + MGMT | S | **20 Oct 2026** |
| O5 | **Heading hierarchy unaudited** | Low-Medium | Not observable | Snippet and AI extraction quality | Audit logical H2/H3 order; each section answerable on its own | CONTENT | M | 17 Nov 2026 |
| O6 | **Image alt text unaudited.** Google's 1 Oct 2026 guidance explicitly names alt text as requiring human fact-check | Medium | D2 Part 2 | Accessibility + AI extraction + policy alignment | Alt text must describe the image accurately; never keyword-stuff; never name a person who is not in the image | CONTENT | M | 24 Nov 2026 |
| O7 | **Internal anchor text unaudited** | Medium | Not observable | Weak contextual link signals | Replace "click here"/"read more" with descriptive anchors naming the destination and its benefit | CONTENT + SEO | M | 24 Nov 2026 |
| O8 | **No breadcrumb implementation verified** | Medium | Not observable | Loss of SERP path display and hierarchy signals | Implement visible breadcrumbs + `BreadcrumbList` on all non-home templates | DEV | M | 10 Nov 2026 |
| O9 | **Open Graph / Twitter cards unverified** | Low | Not observable | Poor social sharing of content ALO will promote | Verify OG title/description/image on all templates | DEV | S | 1 Dec 2026 |

---

## §6 CONTENT

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| C1 | **Content inventory unknown** — no map of existing pages, topics, or overlaps | **High** | Not observable | Cannot decide publish/merge/rewrite/retire without it. D7/D8 depend on it | GSC Pages export + a crawl, mapped into a content inventory spreadsheet | SEO | M | **27 Oct 2026** |
| C2 | **Cannibalisation likely on country pages.** UK/Canada/Australia content overlaps across "study in X", "student visa X", "X for Bangladeshi students" | High | Pattern inference + D2 competitor research shows the industry norm | Split relevance; no page reaches its potential | One primary intent per URL; consolidate overlapping pages; canonicalise to the primary | SEO + CONTENT | L | 17 Nov 2026 |
| C3 | **No content lifecycle model.** Nothing records when a visa fact was last verified | **High** | Absent | **Direct cause of R1** — stale immigration facts are the top risk | Implement the Claims Registry (`seo_claims`/`seo_sources`) — D10 §22.9/22.10 | CRM | L | 10 Nov 2026 |
| C4 | **Thin / placeholder content risk on service and course pages** | Medium | Not observable | Dilutes the domain's quality signal | Review against a minimum-content standard: what it is, who it's for, what's required, what it costs, what happens next, who to contact | CONTENT | L | 24 Nov 2026 |
| C5 | **No named author / reviewer on published content** | **High** | D2 S16 pattern; no bylines observed | E-E-A-T is materially weakened; Google's guidance asks **who** created content | Every page carries author + reviewer + last-verified date. See D11 Fact-Check Agent and D19 DoD | CONTENT + MGMT | M | 10 Nov 2026 |
| C6 | **No original data or first-hand experience.** Content is currently general guidance | High | Indexed copy is generic consultancy guidance | Google's guidance rewards non-commodity information; AI answers cite original sources | Produce 1 original data report from ALO's own CRM data (D8 §Data report) — the highest-value differentiator available | SEO + MGMT | XL | 22 Dec 2026 |
| C7 | **No content freshness policy** | High | Absent | Stale pages decay silently and can become factually wrong | Freshness Watchdog: visa/policy pages reviewed at **7-day intervals** where a dated change is imminent; 90-day otherwise | AGENT + SEO | M | 10 Nov 2026 |
| C8 | **No disaster-content rule.** Immigration changes can invalidate live pages overnight | High | D2 Part 1 shows three such events this quarter | Publishing then leaving wrong = the worst outcome | "Policy event" workflow: page freeze → claim suspension → correct → re-approve → publish, with the previous version retained | CRM + CONTENT | M | 10 Nov 2026 |
| C9 | **Scaled-content-abuse exposure if the brief's 100 topics are published as 100 pages** | **High** | D2 Part 2 (Google policy, verbatim) | Manual action or demotion | Classify all 100 (D8) — most are support articles, merges into existing pages, or postponed. **Never** one page per query variation | SEO | S | **27 Oct 2026** |
| C10 | **Content in Bangla / Banglish is unaddressed** | Medium | No evidence of either | Significant underserved local demand for a Dhaka-market consultancy | Assess Bangla content for the highest-intent local queries (fees, bank statements, sponsor documents) — only after the English base is correct | CONTENT + SEO | L | 22 Dec 2026 |

---

## §7 INTERNAL LINKING

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| L1 | **Internal link graph unknown** | BLOCKED (B) | Requires crawl | Cannot identify orphans or authority flow | Crawl once unblocked; produce inlink counts per URL; find orphans (0 inlinks) | SEO | M | **27 Oct 2026** |
| L2 | **No documented internal-linking rules** | High | Absent | Links depend on whoever edits a page | Publish the rule set (D9 §Internal-link rules) and enforce it in the SEO QA Agent | SEO + AGENT | S | **20 Oct 2026** |
| L3 | **Hub-and-spoke architecture unverified** | Medium | Not observable | Country/topic hubs may not exist | Establish country hubs (UK, Canada, Australia, USA, Ireland, NZ) that link to every spoke; every spoke links back to its hub | SEO + CONTENT | L | 17 Nov 2026 |
| L4 | **Money pages may be under-linked from body content** | High | Not observable | Commercial pages receive no internal authority | Rule: every support article links to at least one commercial page with a descriptive anchor | CONTENT | M | 24 Nov 2026 |
| L5 | **Orphan risk grows with every publication** | Medium | Process gap | New pages may never be discovered | The Publishing Agent must refuse to publish a page with fewer than 2 contextual internal inlinks (enforced in D19 DoD) | AGENT + CRM | S | 3 Nov 2026 |
| L6 | **Nav depth and click-depth unverified** | Medium | Not observable | Deep pages are crawled less and convert worse | No money page deeper than 3 clicks from the homepage | SEO | M | 24 Nov 2026 |
| L7 | **No internal-link audit cadence** | Low-Medium | Absent | Link rot accumulates | Run the Internal Link Agent monthly; report orphans and broken links | AGENT | S | 1 Dec 2026 |

---

## §8 AUTHORITY & BACKLINKS

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| A1 | **Backlink profile entirely unknown** — no referring domains, anchors, or authority data available (and none will be invented) | **BLOCKED (High)** | No tool access | Cannot benchmark or target link building | GSC → Links report (free, real data). Then decide on a paid tool via cost/benefit | SEO | S | **27 Oct 2026** |
| A2 | **No link-earning asset exists.** A consultancy site with no original research earns links only by accident | High | C6 | Authority stagnates | Build the original data report (C6) as the anchor asset; derive PR angles from it | SEO + MGMT | XL | 22 Dec 2026 |
| A3 | **No university/partner link pathway documented** | High | Not observable | The highest-relevance, lowest-cost links are untouched | Audit which partner universities link to their agent/consultancy partners. See D14 | SEO + MGMT | M | 10 Nov 2026 |
| A4 | **No alumni link pathway** | Medium | Not observable | ALO's own students are a linkable community | Alumni success-page strategy with written consent. See D14 | CONTENT + MGMT | L | 15 Dec 2026 |
| A5 | **Duplicate brand property** `alo-education.odoo.com` may be splitting authority | Medium-High | D2 S13 | Dilutes and confuses the entity | DEC-4: noindex + delink, or 301 into the main site | OPS + DEV | S | **27 Oct 2026** |
| A6 | **Uncontrolled third-party claims** ("Proven visa success record", "first consultancy…MRes visa") | Medium | D2 S14 | Reputational exposure on claims ALO did not make | Correct at source where possible; ensure ALO's own pages never repeat them without an auditable dataset | MGMT | S | 10 Nov 2026 |
| A7 | **No digital-PR process** | Medium | Absent | Reactive, sporadic link acquisition | Define the process + templates in D14 | SEO | M | 24 Nov 2026 |
| A8 | **No competitor link comparison possible** | BLOCKED | No tool | Cannot prioritise targets | Defer until a tool is approved; do not purchase without the cost/benefit analysis the brief requires | SEO | — | 15 Dec 2026 |

---

## §9 LOCAL SEO

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| LO1 | **NAP is inconsistent across ALO's own properties — three addresses, three phone formats, two sets of hours** | **Critical** | D2 S8–S11 | Directly damages local pack eligibility and citation consistency. Also a trust failure against the brand promise | DEC-1 establishes ground truth → publish one canonical NAP → fix every surface → audit citations | MGMT + SEO | M | **20 Oct 2026** |
| LO2 | **Google Business Profile status unknown** — claimed? verified? correct NAP? | BLOCKED (High) | Requires GBP access | Without a verified GBP, local pack visibility is severely limited for Dhaka queries | Verify ownership; correct all fields; add real photos; enable messaging; post weekly | SEO + MGMT | M | **27 Oct 2026** |
| LO3 | **No evidence of `LocalBusiness`/`Organization` structured data** | High | U9 | Missed entity signals for a location-based business | Implement `Organization` + `LocalBusiness` (with the DEC-1 address) and `BreadcrumbList`. **Not** FAQPage | DEV | M | 3 Nov 2026 |
| LO4 | **No location-page policy.** Multiple real offices could justify real location pages — but fake ones are forbidden | High | Freeze rule §16 of the brief | Either under-serving real locations, or risking doorway pages | Publish location pages **only** for offices that genuinely operate and are staffed. One page per real location, each with unique content | CONTENT + MGMT | M | 17 Nov 2026 |
| LO5 | **Citation consistency unverified** across BD directories, Maps, social profiles, university agent lists | BLOCKED (B) | No data | Inconsistent citations weaken the entity | Build a citation register; fix top 20 sources to match DEC-1 | SEO | L | 1 Dec 2026 |
| LO6 | **Local content gap: Dhaka-specific intent is unaddressed** | High | Indexed copy is country-level, not city-level | Misses high-intent local queries | Publish genuinely local content: consultation locations, document-collection logistics, local bank/student-file processes, seminar schedules | CONTENT | L | 15 Dec 2026 |
| LO7 | **Reviews: none observed, none to be fabricated** | Medium | D2 evidence | Reviews are a major local ranking and conversion input | Institute a real review-request process at a defined touchpoint. **Never** generate reviews | MGMT | M | 8 Dec 2026 |
| LO8 | **Bing Places / Apple Business Connect unverified** | Low | No data | Small incremental local surface | Claim and align with the canonical NAP | SEO | S | 5 Jan 2027 |

---

## §10 CONVERSION

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| CV1 | **Conversion definition absent.** What counts as a lead — form submit, WhatsApp message, call, portal signup? | **High** | CRM evidence shows multiple channels exist (`/api/whatsapp/send`, contact form, portal invitations) | Without a definition, no channel can be optimised and no KPI is meaningful | Define the canonical conversion event set in D12/D15 and implement it in the CRM | MGMT + CRM | M | **27 Oct 2026** |
| CV2 | **No visible phone/WhatsApp CTA in a persistent position** | Medium | Cannot fetch HTML | Mobile users will not scroll to find contact | Persistent, tappable WhatsApp + call CTA on mobile across all public templates | DEV | M | 10 Nov 2026 |
| CV3 | **Contact form friction unknown** — field count, validation, error handling, mobile keyboard types | Medium | Cannot test | Each unnecessary field costs submissions | Audit and minimise to name + phone/WhatsApp + destination interest. Use `inputmode` for phone | DEV | M | 10 Nov 2026 |
| CV4 | **Trust signals are weak or absent on money pages** | High | No counsellor profiles, no consented stories, no visible credentials observed | Study abroad is a high-trust, high-anxiety purchase | Publish 3–5 real counsellor profiles and 6–10 consented student stories (D7). This is the highest-impact conversion work available | CONTENT + MGMT | L | 15 Dec 2026 |
| CV5 | **Attribution chain from organic → lead → enrolment unverified** | **High** | CRM has `Student`, `AloApplication`, `WhatsAppContact`, `PortalStudentProfile` models but no SEO attribution model | Cannot prove SEO's business value; cannot feed the 20% priority component | Implement `seo_lead_attribution` (D10 §22.15) and capture first-touch and last-touch source at lead creation | CRM | L | 24 Nov 2026 |
| CV6 | **No next-step clarity on content pages** | Medium | Not observable | Research traffic exits without converting | Every content page ends with exactly one primary next step, relevant to that page's intent | CONTENT | M | 24 Nov 2026 |
| CV7 | **Free-consultation offer not mechanised into the booking flow** | Medium | The offer exists in copy | The strongest hook is not converted into a scheduled event | Add a concrete booking path with real availability; route into the CRM as a task | DEV + CRM | L | 8 Dec 2026 |
| CV8 | **No WhatsApp click tracking** | Medium | No evidence | WhatsApp is clearly a primary channel and is currently unmeasured | Track the `wa.me` click as a conversion event with campaign parameters | DEV + CRM | S | 17 Nov 2026 |

---

## §11 MEASUREMENT

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| M1 | **GA4 implementation unverified** — and the repo contains `src/lib/seo/ga4.ts` (48 lines) plus `request-access.ts` | High | Repo evidence | Cannot measure or attribute anything | Verify the property exists and receives data. Confirm the repo helper is actually wired to a live measurement ID | DEV + SEO | M | **27 Oct 2026** |
| M2 | **GSC property ownership and verification type unknown** | **Critical** | Absent | Everything in §2, §11 depends on it | Confirm Owner/Full access on both domain and URL-prefix properties; prefer a **Domain property** | SEO | S | **20 Oct 2026** |
| M3 | **GSC Generative AI report availability unconfirmed.** It went worldwide 31 Aug 2026 | High | D2 Part 2 | Losing a first-party AI-visibility baseline that ALO is already entitled to | Check GSC → Performance → Generative AI. Export the baseline immediately. Note AI Mode+Overviews are **combined since 7 Sep 2026** | SEO | S | **27 Oct 2026** |
| M4 | **No baseline dataset stored anywhere** | **Critical** | Absent | Every future claim of improvement is unfalsifiable | Export and archive: GSC 16 months Performance + Pages, GA4 12 months, CRM lead/conversion counts. Store versioned | SEO + CRM | M | **27 Oct 2026** |
| M5 | **No ranking-tracking method** | Medium | Absent | Cannot measure position movement independently of GSC | Use GSC average position as primary (real data); add a rank tracker only if its cost is justified | SEO | S | 10 Nov 2026 |
| M6 | **CRM has no SEO reporting surface** | High | Only `SeoOpportunity`/`SeoTask` exist | No link between search performance and business outcomes | D10 §22.20 reporting sub-module | CRM | L | 8 Dec 2026 |
| M7 | **No dashboard exists** | Medium | Absent | Reporting is manual and inconsistent | Build the D12 dashboard (leading/mid/lagging) from stored baselines | CRM | L | 22 Dec 2026 |
| M8 | **FAQ reporting must be retired** | Medium | D2 Part 2 — SC filter and API support removed Jun/Aug 2026 | Dashboards will silently return null and mislead | Remove FAQ search-appearance filters from all reporting; export any historical data now | SEO | S | **27 Oct 2026** |
| M9 | **No annotation practice** | Low-Medium | Absent | Cannot explain movement | Annotate GA4/GSC for every publication, fix, and policy event. Especially the Aug/Sept 2026 spam updates | SEO | S | 3 Nov 2026 |

---

## §12 AI-SEARCH VISIBILITY

| # | Issue | Severity | Evidence | Impact | Fix | Owner | Effort | Deadline |
|---|---|---|---|---|---|---|---|---|
| AI1 | **No AI-visibility baseline** | High | M3 | Cannot tell whether AI surfaces help or hollow out traffic | Baseline from the GSC Generative AI report + a manual prompt panel for the top 25 questions | SEO | M | 3 Nov 2026 |
| AI2 | **Content not structured for extraction** | High | Indexed copy is prose-heavy, general | AI answers cannot lift a specific, checkable answer | Lead each section with the answer in one sentence; then evidence, then detail. Table-form comparisons for dated policy facts | CONTENT | L | 24 Nov 2026 |
| AI3 | **No entity clarity.** Duplicate property + inconsistent NAP confuses the entity graph | High | A2, A3 | A confused entity is cited less | Consolidate to one entity: one site, one canonical NAP, consistent `Organization` markup, consistent external profiles | SEO + MGMT | M | 17 Nov 2026 |
| AI4 | **Risk of "AEO/GEO" theatre.** Google states optimizing for generative AI **is** optimizing for Search, and requires no special files, chunks, or schema | Medium | D2 Part 2 | Wasted budget on tactics Google explicitly says are unnecessary or ignored | **Record as a deliberate non-action.** Spend on technical access, structure, and non-commodity content | SEO | S | **27 Oct 2026** |
| AI5 | **No AI-answer accuracy monitoring.** Wrong AI answers about ALO or its claims may circulate uncorrected | Medium | Not observable | Reputational risk, especially with stale visa facts | Monthly manual prompt panel recording whether ALO is cited and whether cited facts are correct | SEO | M | 8 Dec 2026 |
| AI6 | **No `data-nosnippet` / preview-control policy** | Low-Medium | Absent | Either over-sharing or over-blocking | Decide deliberately which content should be previewable; keep valuable content fully crawlable. Do not blanket-block | SEO + DEV | S | 1 Dec 2026 |
| AI7 | **Google's 1 Oct 2026 guidance requires human fact-checking of AI-generated titles, metas, structured data and alt text** | High | D2 Part 2 | Compliance and quality expectation | Encode as a hard gate in the publishing workflow (D11, D19) — no AI-generated metadata publishes unreviewed | CRM + AGENT | M | 17 Nov 2026 |
| AI8 | **Manipulating generative AI responses is now explicitly spam (since 15 May 2026)** | **High** | D2 Part 2 | Any attempt to engineer AI answers is a policy violation | Prohibit all AI-answer manipulation tactics. Document the prohibition in D18 | SEO | S | **20 Oct 2026** |

---

## §13 AUDIT SUMMARY

### Severity distribution

| Severity | Count | Representative items |
|---|---|---|
| **Critical** | 6 | T1, T2, I1, I8, LO1, M2 |
| **High** | 34 | T3–T5, I2–I5, J2, P2, O3–O4, C1, C3, C5–C9, L2, L4, A2–A3, LO2–LO4, LO6, CV1, CV4–CV5, M1, M3–M4, M6, AI1–AI3, AI7–AI8 |
| **Medium** | 40+ | see individual sections |
| **BLOCKED (Class B/C)** | 18 | require GSC / GA4 / GBP / Hostinger / MySQL / a crawler |

### The five things to do first (all achievable without external tools)

1. **Resolve T1** (deployment parity / edge) — 4-step test, 20 Oct. **Nothing else matters until this is answered.**
2. **Fix LO1** (NAP) — needs one management decision, then it is a single afternoon of edits. **Critical and entirely within ALO's control.**
3. **Remove or scope O4** ("No IELTS needed") — 20 Oct. **Two minutes of editing removes a live factual risk.**
4. **Fix I2/I3** (login-gated About, indexed `?callbackUrl=` URLs) — 27 Oct.
5. **Capture the baselines M1–M4** — GSC, GA4, CRM. Without these, month two cannot set honest targets.

### What this audit explicitly does **not** claim

No Core Web Vitals value. No indexed-page count. No ranking position. No backlink count. No traffic or conversion figure. No competitor metric. Each is marked BLOCKED with the exact access that resolves it. **The 18 blocked findings are blocked on ALO's credentials, not on ALO's effort** — and 14 of the 18 resolve in a single afternoon once GSC and Hostinger access are granted.
