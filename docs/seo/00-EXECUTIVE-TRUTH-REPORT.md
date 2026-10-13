# DELIVERABLE 1 — Executive Truth Report

**ALO Education · 90-Day SEO Growth System**
**Prepared:** 2026-10-14 · **Repo:** `tech360-bd/ALO_WEB_CRM_TECH` @ `arena/57b0809e-alo-web-crm-tech`
**Status:** evidence-based audit and plan. **Not a deployment confirmation. No ranking, traffic or visa outcome is promised.**

---

## 0. Two corrections to the brief that change the plan

### 0.1 The execution window in the brief has already closed

The brief states *planning date 9 July 2026* and an execution window of *9 July → 7 October 2026*. **Today is 14 October 2026.** That window ended seven days ago.

This plan therefore runs on a **re-based 90-day window: 14 October 2026 → 12 January 2027**, and every week in the roadmap is re-dated. Nothing else in the brief changes.

### 0.2 The re-based window contains **three dated policy events** — and that is the strategy

This is the single most important finding of the research phase. Three high-intent, high-volume immigration changes fall **inside** the next 90 days:

| Date | Change | Jurisdiction | Consequence for ALO |
|---|---|---|---|
| **2 Oct 2026** (already in force) | Most temporary visa holders can no longer lodge a Subclass 500/590 application from inside Australia; partners and dependent children can no longer be included in most Student visa applications, and family members can no longer be added after grant | Australia | ALO's existing Australia content is very likely **now wrong**. Immediate correction, not a new article. |
| **30 Nov 2026** | UK Student visa maintenance funds rise: London **£1,529 → £1,570**/month, outside London **£1,171 → £1,203**/month (9-month maxima **£13,761 → £14,130** and **£10,539 → £10,827**). Governed by **application date**, not CAS date | UK | The highest-volume UK financial-content event of the year. ALO can be first with the correct before/after table for Bangladeshi students. |
| **1 Jan 2027** | UK Graduate visa duration for non-doctoral graduates reduces **2 years → 18 months**; doctoral graduates stay at **3 years**. Governed by **application date** | UK | ALO's `/uk/graduate-visa` page must carry the transition table or it will be wrong within days of publication. |

**Why this matters more than any keyword list:** dated policy events generate a burst of high-intent search demand, they are the one thing generic AI summaries get wrong, and they are exactly where Google's own guidance (below) rewards first-hand, fact-checked, expert-reviewed content. ALO's differentiator is not "more articles" — it is **being the most accurate Bangladeshi-facing source on these three dates**.

---

## 1. Actual current condition (evidence only)

### 1.1 The live site cannot be fully audited from this environment — and that itself is a finding

Requests to `aloeducation.com` on 2026-10-14 returned:

| URL | Result | Server |
|---|---|---|
| `/robots.txt` | **200** — permissive `Allow: /`, **no `Sitemap:` directive** | LiteSpeed |
| `/sitemap.xml` | **404** | LiteSpeed |
| `/` | **403 Forbidden** | LiteSpeed |
| `/contact` | **404** | LiteSpeed |
| `/aqf-compliance` | **404** | LiteSpeed |
| `/api/health` | **404** | LiteSpeed |
| `www.aloeducation.com/` | **403** | LiteSpeed |

**Critical nuance — do not over-read this.** An independent check confirms Google **has** the site indexed with real content (`/contact`, `/about-us`, `/login?callbackUrl=%2Fabout-us` all appear in search results with legitimate copy). So the 403/404 responses are almost certainly **WAF / bot protection against a non-browser client**, not a user-facing outage.

But two things remain genuinely unresolved and are a **P0 audit item**:

1. **`/sitemap.xml` returned 404**, and `robots.txt` does not advertise a sitemap. Google's crawler may or may not be treated differently from my client. **This must be checked in Search Console → Sitemaps.** If Google also gets a 404, the site is relying on link discovery alone.
2. **Automated clients are being blocked at the edge.** Whatever is doing that determines how every other crawl-based tool (and part of the plan's own Technical Audit Agent) behaves. **This must be identified from Hostinger account access.**

**Honest conclusion: the plan's automated auditing cannot run reliably until item 2 is resolved.** That is an access dependency, recorded in §5.

### 1.2 Confirmed public defects (Class A — verified)

| # | Finding | Evidence | Severity |
|---|---|---|---|
| A1 | **`/about-us/` is gated behind login.** Google has indexed `aloeducation.com/login?callbackUrl=%2Fabout-us`, meaning the About page redirects an unauthenticated visitor to sign-in | indexed SERP snapshot, 2026-10-14 | **High** — an About page is a core trust page; gating it wastes the indexed URL and blocks E-E-A-T signals |
| A2 | **Severe NAP inconsistency across ALO's own properties.** Three different addresses appear: *Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205* (contact page + Odoo), *House 08, Road 17/A, Sector 11, Uttara, Dhaka-1230* (also on the contact page), *Suite No: 347 (2nd Floor, Signal, Concept Tower, 68/69, Green Road, Panthapath, Dhaka 1205* (about page). Phone numbers differ too (`+88 01805020101-10`, `+8801327189194`, `+880 1805 020101`) and hours differ (`10 AM–6 PM` vs `9:00 AM–7:00 PM`) | indexed SERP snapshots | **High** — direct hit on local SEO and on Google Business Profile trust |
| A3 | **A second live property duplicates the brand**: `alo-education.odoo.com` hosts About/team/mission content that overlaps `aloeducation.com/about-us` | SERP result; earlier session verification found the Odoo instance returning "Database blocked / subscription expired" | **Medium-High** — split brand entity; and a broken user-facing property |
| A4 | **Unsupported high-risk claim live on the About page: "No IELTS needed."** | indexed SERP snapshot of `/about-us/` | **High** — a blanket English-test exemption claim. The brief's §31 forbids exactly this, and it is factually unsafe |
| A5 | **Trailing-slash / duplicate-route ambiguity**: `/about-us/` is indexed while `/about-us` routes to login | SERP snapshots | **Medium** — canonicalisation needs a declared rule |
| A6 | Third-party profile (RocketReach) carries **"Proven visa success record"** — an unquantified success claim ALO does not control | SERP result | **Medium** — reputational/claim risk to correct at source |

### 1.3 Class B — likely risks requiring account access

| # | Likely risk | Needs |
|---|---|---|
| B1 | Sitemap may not exist in Google's view at all | GSC → Sitemaps |
| B2 | Index bloat / duplicate variants (www vs apex, trailing slash, `/login?callbackUrl=` URL variants being indexed) | GSC → Pages |
| B3 | Whether the production deployment actually matches this repository (repo ships `src/app/sitemap.ts`; the live domain 404s on `/sitemap.xml`) | Hostinger + GSC URL Inspection |
| B4 | Core Web Vitals field data unknown | CrUX / PSI / GSC |
| B5 | Indexed-page inventory and cannibalisation unknown | GSC → Pages + Performance |
| B6 | Whether robots/edge rules inadvertently block any important resource | GSC → robots.txt report, URL Inspection |

### 1.4 Class C — exact access required

Google Search Console (verified property) · GA4 · Google Business Profile · Hostinger account (deployment + edge/security rules) · MySQL production read access · WhatsApp Business / Meta Business Suite · DNS zone · registrar.

**No keyword volume, difficulty, CPC, DA/DR, traffic, conversion-rate or visa-success number appears anywhere in this plan.** Where a metric is required it is marked `DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS`.

---

## 2. Biggest opportunities

| # | Opportunity | Why it is real | Evidence base |
|---|---|---|---|
| O1 | **Own the three dated policy events (§0.2)** | Highest-intent demand, published official effective dates, and generic AI summaries get these wrong. ALO can be the accurate Bangladeshi-diaspora source | verified above |
| O2 | **Existing pages already rank positions 5–20** (hypothesis to confirm) | The brief identifies this as the best value band; it must be confirmed in GSC before committing. **No GSC data available in this environment** | `DATA NOT AVAILABLE` |
| O3 | **Fix the confirmed defects A1–A4** | Cheap, certain, and they remove live factual risk | verified above |
| O4 | **A genuinely differentiated local-financial content layer** | Bangladeshi students need *how money actually moves* — bank statements, sponsor documents, student-file banking, education loans. No competitor in the seed list is verified to cover this deeply | competitor metrics not verified — see D5 |
| O5 | **Source-verified content as a moat** | Google's own 1 Oct 2026 guidance now *asks* publishers to manually fact-check AI-generated content. A visible claim→source→reviewer layer is both compliance and differentiation | verified below |
| O6 | **AI Search visibility is now measurable** | Search Console's Generative AI report went **worldwide on 31 Aug 2026** | verified below |

## 3. Biggest risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Publishing stale immigration facts** (Australia's 2 Oct 2026 change; UK's 30 Nov and 1 Jan changes) | Claims Registry + 7-day review cycle on visa pages; "applies to applications made on/after" date labels. See D18 risk register |
| R2 | **Scaled content abuse** from AI drafting at volume | Google's policy targets scale-without-value, not AI use. Enforce named author + substantive human edit + original analysis + verified citations on every page |
| R3 | **The site cannot be crawled by automated tools** (blocked at edge) | Resolve with Hostinger before any crawl-based auditing |
| R4 | **NAP inconsistency** undermining local SEO | Single canonical business record; fix all surfaces; see D13 |
| R5 | **Duplicate brand property** (Odoo) competing with the main site | Decide: 301 into the main site, or noindex and delink |
| R6 | **Overproduction** — the brief's own §58 warning | Hard cap: see the quality-first volumes in §4 |
| R7 | Reputational third-party claims ALO does not control | Outreach to correct; monitor |

## 4. 90-day realistic objective — and what cannot be promised

**What 90 days can realistically deliver (verifiable, not traffic promises):**

| Objective | Success measure | Why achievable |
|---|---|---|
| Correct the three policy events accurately, before or at the date | 3 pages live with dated before/after tables, each with a named reviewer and cited official sources | dates are known; content is bounded |
| Remove the confirmed defects A1–A4 | `/sitemap.xml` resolves or is proven intentional; About page un-gated; one canonical NAP; "No IELTS needed" claim removed or scoped | all single-system changes |
| Establish a source-verified publishing pipeline inside WEB_CRM | Every high-risk claim carries claim→source→jurisdiction→retrieved_at→effective_date→reviewer→confidence | schema + workflow, no external dependency |
| Establish a measurement baseline | GSC, GA4 and CRM-organic baselines exported and stored so **month 4 can set numeric targets** | depends on access |
| Publish, quality-first | **12–15** commercial pages, **12–18** research articles, **3–5** counsellor profiles, **6–10** consented student stories, **1** original data report, **2** AI tool MVPs | matches the brief's own recommended range |

**What cannot be promised, and will not be:** a ranking position; first-page placement; a traffic/impression percentage increase (no baseline exists in this environment); visa, admission, scholarship or PR approval; any specific processing time; any business claim such as a visa success rate without an auditable dataset.

**Target-setting method, because §1 forbids invented targets:** month 1 collects the baseline; month 2 sets numeric targets from *observed* 28-day figures using a defined method (e.g. target = trailing-28-day impressions × a stated multiplier applied only to pages already ranking 5–20); month 3 measures against them. No number is asserted before its baseline exists.

---

## 5. The one honest structural limitation of this plan

The brief asks for a public audit of `aloeducation.com` and a full current-state keyword picture. **Neither can be completed from this environment**, because:

* the site blocks automated clients at the edge (403), so crawling and rendering tests cannot run;
* no Search Console, GA4, Google Business Profile, backlink, rank-tracking or CRM access exists here;
* no keyword volume/difficulty/CPC source is available.

Accordingly every affected section of this plan is written as **"how to obtain and interpret the data"**, with the exact access named — not as fabricated numbers. This is the brief's own rule (`DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS`) applied without exception.

**The plan is therefore deliberately front-loaded with work that needs no external access** (technical fixes, the claims registry, the pipeline, the dated policy content) and defers metric-dependent prioritisation to Week 1 of the roadmap, when the baselines are exported.
