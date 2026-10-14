# CURRENT-STATE TRUTH REPORT
### Demanded actions #3 and #5 · What is verifiably true today · What cannot be verified publicly

**Date:** 2026-10-14 · **Domain:** aloeducation.com · **Environment:** outbound HTTP + live web search
**Companion to:** D1 Executive Truth Report · D2 Evidence Log

---

## 1. What is verifiably true today

### 1.1 The domain serves *something*, but not to automated clients

| Probe | Status | Server | Interpretation |
|---|---|---|---|
| `/robots.txt` | 200 | LiteSpeed | robots.txt is served as a **static file** by the host |
| `/sitemap.xml` | 404 | LiteSpeed | **not** served — 404 originates at the web server layer, not the app |
| `/` | 403 | LiteSpeed | blocked at the edge |
| `/contact` | 404 | LiteSpeed | not reaching the app |
| `/aqf-compliance` | 404 | LiteSpeed | not reaching the app |
| `/api/health` | 404 | LiteSpeed | **a Next.js API route cannot 404 at LiteSpeed if it is proxied** — so the app is not handling these paths |
| `www.` `/` | 403 | LiteSpeed | www behaves like the apex |

**Two competing hypotheses, and I will not assert which is true without access:**

**H1 — Edge blocking (most likely).** A WAF/mod_security-style rule returns 403 for non-browser user agents. Googlebot is whitelisted, which is why Google has real content indexed (S6). This is consistent with everything observed.

**H2 — Deployment gap.** The production web root does not contain the Next.js application (or not a current build), so LiteSpeed answers with its own 403/404 pages, and a **static or separately-hosted** version of the site (or an older deployment under a path) is what Google indexed.

**Why this matters and why I will not guess:** H1 means "configure the audit tool's user agent." H2 means "the repository and the live site have diverged, and no SEO work can take effect until that is fixed." **These demand opposite actions.** The disambiguation test is in §2.1.

**A supporting signal for H2, stated carefully:** the `robots.txt` served is a hand-written permissive file with **no Sitemap directive**, whereas Next.js's `src/app/robots.ts` convention and the repository's `src/app/sitemap.ts` would normally produce both. The repo ships a sitemap; the live domain 404s on `/sitemap.xml`. That is at minimum a **deployment-parity question**, not merely a bot question.

### 1.2 Google's index of the site (independent evidence)

Google returns four distinct live URLs with genuine, page-specific content:

* `https://aloeducation.com/contact` — real contact copy, phone, hours, address, WhatsApp number
* `https://aloeducation.com/about-us/` — real About copy, "Quick Links: Universities / Study Abroad / Services"
* `https://aloeducation.com/login?callbackUrl=%2Fabout-us` — the **homepage hero** ("Your Global Education Journey Starts Here", "Track applications in real-time", "AI-powered course matching")
* `https://alo-education.odoo.com/` — a **separate** property with founder/mission/team content

**Conclusions that follow directly:**

1. The site **is** indexed and **has** real content. It is not a blank or parked domain.
2. `/` requires login OR the homepage copy Google holds was captured under a query-string variant. Either way, **the homepage URL Google associates with the brand is a `/login?callbackUrl=` URL** — that is a real, indexable duplicate-signal problem (B2).
3. `/about-us` resolves to login for an unauthenticated visitor, but `/about-us/` (trailing slash) is a separate indexed URL with real content. **Route and canonical rules need to be declared and enforced.**

### 1.3 The confirmed-defect list (Class A)

Reproduced from D2 Part 3 with severity:

| ID | Defect | Severity | Certain |
|---|---|---|---|
| A1 | About page gated behind login at `/about-us` while `/about-us/` is public and indexed | High | High |
| A2 | **Three different office addresses, three phone formats, two sets of opening hours** across ALO's own pages | High | High |
| A3 | Duplicate brand property `alo-education.odoo.com` | Medium-High | High |
| A4 | Live claim **"No IELTS needed"** | High | High |
| A5 | Trailing-slash variant indexed as separate URL | Medium | High |
| A6 | Third-party "Proven visa success record" ALO does not control | Medium | Medium |
| A7 | `robots.txt` has no `Sitemap:` directive | Medium | Confirmed |
| A8 | `/sitemap.xml` returns 404 | **High** | Confirmed |
| A9 | `/login?callbackUrl=...` variants are crawlable/indexable | Medium | Medium-High |

### 1.4 Content inference (Medium confidence — from indexed copy only)

ALO's positioning as captured by Google is: *"Bangladesh's trusted study abroad consultancy. Honest guidance from application to arrival — no hidden fees, no false promises."* The `/about-us/` copy emphasises **free counselling and application processing**, a UK emphasis ("Free support for Bangladeshi students to study in the UK"), and **"Steps to study abroad"** as a content block.

**This is the single most important positioning asset in the audit** — see §3.

---

## 2. What cannot be verified from this environment — and the exact test that resolves it

### 2.1 P0 — Deployment parity / Edge configuration (blocks everything else)

**Cannot verify:** whether the live site runs the current `main` build; whether Hostinger terminates TLS and proxies to a Node process or serves a static export; what rule produces 403/404 for non-browser clients; whether `www` and apex both resolve to the same origin.

**The exact test, in order:**

1. In a **browser**, load `https://aloeducation.com/sitemap.xml` and `https://aloeducation.com/contact`. Note the status and whether it renders.
2. If **browser works but curl does not** → **H1 confirmed.** → Whitelist the audit user agent, or run audits from a browser-context tool. **Do not** weaken the WAF for Googlebot; verify Googlebot by reverse-DNS instead.
3. If **browser also fails** → **H2 confirmed.** → The deployment does not contain the app. **All SEO work is blocked until deployment parity is restored.** Fix under D16 tickets DEV-01…DEV-04.
4. Compare the HTML of `/contact` in the browser with `src/app/contact/page.tsx` (or its router output) in this repo. Any divergence confirms drift.

**Why this is the true P0:** every other audit finding, every content publication, and the entire CRM publishing pipeline terminates at this question. Spending effort on keyword content before answering it risks producing work that cannot reach the public web.

### 2.2 Full inventory of what is unverifiable here

| # | Unknown | Exact access needed | What it unlocks |
|---|---|---|---|
| U1 | Deployment parity / edge rules | Hostinger hPanel + a browser | Resolves P0; all downstream work |
| U2 | Whether Google has a sitemap | Search Console → Sitemaps | Resolves A8/A7 definitively |
| U3 | Indexed-page inventory, canonical selection, exclusions | GSC → Pages | Index bloat, cannibalisation, duplicates |
| U4 | Queries, impressions, clicks, CTR, position | GSC → Performance | **The entire priority score** (25% + 20% + 10% components) |
| U5 | Which pages rank 5–20 | GSC → Performance (position filter) | Highest-ROI work — the brief's own thesis |
| U6 | AI Overview / AI Mode impressions | GSC → Generative AI report (live worldwide since 31 Aug 2026) | D12 AI-search section — **ALO should already have this** |
| U7 | Core Web Vitals field data | GSC → Core Web Vitals, CrUX, PSI | D3 §Performance |
| U8 | Manual actions / security issues | GSC → Security & Manual Actions | Whether prior tactics caused harm |
| U9 | Crawl stats, crawl budget, response codes | GSC → Settings → Crawl stats | Verifies the 403/404 pattern **as Google experiences it** |
| U10 | Search volume, difficulty, CPC | Google Keyword Planner / a paid tool | D4 priority score (20% + 10% components) |
| U11 | Backlink profile, referring domains, anchors | Ahrefs / Semrush / GSC Links report | D3 §Authority, D14 |
| U12 | Traffic, engagement, conversions, channel mix | GA4 (+ any ad accounts) | D12, D15 leading indicators |
| U13 | Phone/direction/demand by locality | Google Business Profile Insights | D13 Local SEO |
| U14 | **Leads → applications → enrolments by source; CPA; lead quality; close rate** | **ALO's own MySQL / CRM** | **20% of the priority score** — the only source in existence |
| U15 | Course/university/partner roster and current agreements | ALO internal | Which money pages are truthful |
| U16 | Counsellor names, roles, credentials, photos, consent | ALO HR/internal | D7 counsellor profiles (3–5) |
| U17 | Student stories: consent, outcome, dates | ALO internal + written consent | D7 student stories (6–10) |
| U18 | Brand/legal constraints on claims (e.g. "No IELTS needed") | ALO management + compliance | Whether A4 can be corrected or must be removed |
| U19 | Actual NAP ground truth (which office is real, which is legacy) | ALO management | Resolves A2 — **cannot be inferred**; all three addresses may be real |
| U20 | Competitor set, their real offerings and pricing | Manual + access | D5 — **I will not assert competitor metrics** |
| U21 | Server-side rendering behaviour of the live app | A browser + view-source, or curl once unblocked | D3 §JS rendering |
| U22 | Whether `/login?callbackUrl=` URLs are deliberately crawlable | Codebase + GSC | A9 |
| U23 | Any historic penalties, migrations, or prior domains | ALO internal + GSC | D18 risk register |

### 2.3 Access request list — ordered by how much it unblocks

| Priority | Access | Unblocks | Owner |
|---|---|---|---|
| **P0** | Hostinger hPanel (or a confirmed browser check) | U1 — **everything** | ALO |
| **P0** | Google Search Console (Owner on the verified property) | U2–U9, U11 (Links), U23 | ALO |
| **P1** | ALO CRM/MySQL read access (or the CRM's own reporting UI) | **U14 — the differentiator no competitor has** | ALO |
| **P1** | GA4 | U12 | ALO |
| **P2** | Google Business Profile | U13 | ALO |
| **P2** | Keyword Planner (Ads account) or a paid tool | U10 | ALO |
| **P3** | Internal: partner roster, counsellor profiles, consent register | U15–U18 | ALO |

**Note on U14.** Search Console tells you what the market searched for. **Only the CRM tells you which of those searches became enrolled students.** That is ALO's structural advantage over every generic SEO agency, and it is why D10/D11 specify attribution at the CRM level rather than the analytics level.

---

## 3. The strategic finding that follows from the evidence

ALO's own indexed copy states the brand promise as ***"no hidden fees, no false promises."***

**Today, four live pages violate that promise:**

| Page condition | Violates "no false promises" because |
|---|---|
| "No IELTS needed" (A4) | It is a blanket claim the evidence does not support for all routes and institutions |
| Three different addresses (A2) | A student cannot know which address is real |
| About page behind login (A1) | The page that would substantiate trust is hidden from the public |
| Third-party "Proven visa success record" (A6) | An unquantified success claim attached to the brand |

**This is not a marketing observation; it is the plan's organising principle.**

The brand's stated differentiator is *verifiable honesty*. The 90-day system's job is therefore **not** to produce more content — it is to make ALO's accuracy **demonstrable and machine-readable**: every visa claim carrying its official source and effective date, every counsellor carrying a real credential, every student story carrying real consent, and every address existing exactly once.

That is also, conveniently, exactly what Google's 1 Oct 2026 guidance now asks publishers to do (D2 Part 2), and exactly what AI answer engines reward. **Positioning, compliance and search performance point in the same direction for this specific brand.** That alignment is the whole plan.

---

## 4. Immediate decisions required from ALO (not questions to the AI)

These are **authorisation decisions**, not research questions — the plan proceeds without them, but the affected items are marked BLOCKED until each is answered:

| # | Decision | Blocks | Default if unanswered |
|---|---|---|---|
| DEC-1 | Which office address is the **canonical** one? Are the others historic or additional locations? | A2, D13, LocalBusiness schema | **Do not publish any address change.** Flag only |
| DEC-2 | Is "No IELTS needed" to be **removed** or **scoped** to specific institutions/routes? | A4 | Remove the unscoped claim; do not replace it with a new claim |
| DEC-3 | About page: **un-gate** it, or accept it as gated and create a public alternative? | A1 | Recommend un-gate |
| DEC-4 | `alo-education.odoo.com`: **301 into the main site**, or `noindex` + delink? | A3 | Recommend noindex + delink (no migration cost, no data loss) |
| DEC-5 | Edge/WAF: may the audit user agent be **whitelisted**, or must auditing run via a browser-context tool? | U1 | No crawling-based auditing |
| DEC-6 | Any figure on the site attributed to ALO's own results (success rates, counts): is there an **auditable dataset**? | Claims Register, D14 | No such claim may be published |
| DEC-7 | Approval to create the 21-table SEO schema in the CRM | D10, D11 | Schema remains a specification only |
