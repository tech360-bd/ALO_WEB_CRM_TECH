# ALO EDUCATION — ELITE 90-DAY SEO GROWTH SYSTEM
### Deliverables index · prepared 2026-10-14

**Repo:** `tech360-bd/ALO_WEB_CRM_TECH` · branch `arena/57b0809e-alo-web-crm-tech`
**Status:** research and design complete. **Nothing in this set has been deployed, committed, or published.**

---

## Two corrections to the brief, stated up front

1. **The execution window in the brief has closed.** The brief specifies a planning date of 9 July 2026 and a window of 9 July → 7 October 2026. **Today is 14 October 2026.** Everything here is re-based to **14 October 2026 → 12 January 2027**.

2. **"Orchestrator + 13 agents" names 15 agents.** All 15 are specified. (See `07-MULTI-AGENT-SYSTEM.md`.)

---

## Deliverable map

| # | Deliverable | File |
|---|---|---|
| **1** | Executive Truth Report | [`00-EXECUTIVE-TRUTH-REPORT.md`](00-EXECUTIVE-TRUTH-REPORT.md) |
| **2** | Evidence Log | [`01-EVIDENCE-LOG.md`](01-EVIDENCE-LOG.md) |
| — | Current-State Truth Report *(demanded actions #3 and #5: what cannot be verified publicly)* | [`02-CURRENT-STATE-TRUTH-REPORT.md`](02-CURRENT-STATE-TRUTH-REPORT.md) |
| **3** | Complete SEO Audit — 12 sections | [`03-SEO-AUDIT.md`](03-SEO-AUDIT.md) |
| **4** | Keyword Intelligence Map | [`04-KEYWORDS-AND-COMPETITORS.md`](04-KEYWORDS-AND-COMPETITORS.md) |
| **5** | Competitor Gap Matrix | [`04-KEYWORDS-AND-COMPETITORS.md`](04-KEYWORDS-AND-COMPETITORS.md) |
| **6** | 90-Day Roadmap | [`05-ROADMAP-AND-QUEUES.md`](05-ROADMAP-AND-QUEUES.md) |
| **7** | Page Production Queue — 30 money-page seeds, all classified | [`05-ROADMAP-AND-QUEUES.md`](05-ROADMAP-AND-QUEUES.md) |
| **8** | Content Queue — 100 topics, all classified | [`05-ROADMAP-AND-QUEUES.md`](05-ROADMAP-AND-QUEUES.md) |
| **9** | Information Architecture | [`06-IA-AND-CRM-SPEC.md`](06-IA-AND-CRM-SPEC.md) |
| **10** | WEB_CRM Product Specification — 22 sub-modules, 21 tables | [`06-IA-AND-CRM-SPEC.md`](06-IA-AND-CRM-SPEC.md) |
| **11** | Multi-Agent AI System Specification — Orchestrator + 15 agents | [`07-MULTI-AGENT-SYSTEM.md`](07-MULTI-AGENT-SYSTEM.md) |
| **12** | Analytics & Attribution Plan | [`08-ANALYTICS-LOCAL-AUTHORITY-KPI.md`](08-ANALYTICS-LOCAL-AUTHORITY-KPI.md) |
| **13** | Local SEO Plan | [`08-ANALYTICS-LOCAL-AUTHORITY-KPI.md`](08-ANALYTICS-LOCAL-AUTHORITY-KPI.md) |
| **14** | Authority Plan | [`08-ANALYTICS-LOCAL-AUTHORITY-KPI.md`](08-ANALYTICS-LOCAL-AUTHORITY-KPI.md) |
| **15** | KPI Framework — leading / mid-funnel / lagging | [`08-ANALYTICS-LOCAL-AUTHORITY-KPI.md`](08-ANALYTICS-LOCAL-AUTHORITY-KPI.md) |
| **16** | First 20 Development Tickets | [`09-TICKETS-RISKS-DOD.md`](09-TICKETS-RISKS-DOD.md) |
| **17** | First 20 SEO Execution Tickets | [`09-TICKETS-RISKS-DOD.md`](09-TICKETS-RISKS-DOD.md) |
| **18** | Risk Register — 12 named risks | [`09-TICKETS-RISKS-DOD.md`](09-TICKETS-RISKS-DOD.md) |
| **19** | Definition of Done — 7 categories | [`09-TICKETS-RISKS-DOD.md`](09-TICKETS-RISKS-DOD.md) |

---

## The five findings that shape everything

### 1. Three dated policy events fall inside the re-based window
| Date | Event |
|---|---|
| **2 Oct 2026** *(in force)* | Australia: onshore lodgement restricted; dependants no longer includable in most Student visa applications |
| **30 Nov 2026** | UK Student visa maintenance: **£1,529 → £1,570** (London) / **£1,171 → £1,203** (outside London) |
| **1 Jan 2027** | UK Graduate visa: **2 years → 18 months** for non-doctoral applications |

These are the strategy. Dated changes create high-intent demand, they are where generic AI summaries are wrong, and they are exactly what Google's 1 Oct 2026 guidance rewards.

### 2. ALO's own promise is currently violated by four live pages
The site states ***"no hidden fees, no false promises."*** Live today: an unscoped **"No IELTS needed"** claim · **three different office addresses** · an About page **gated behind login** · a third-party **"Proven visa success record"** claim. Positioning, compliance and search performance all point the same way here.

### 3. `/sitemap.xml` returns 404 and `robots.txt` advertises nothing
Confirmed by direct fetch. The repo ships a sitemap; the live domain 404s. **Deployment parity is the true P0** — until it is answered, no SEO change can be known to reach the public web.

### 4. The repo already has a production AI workforce
`agent-orchestrator.ts`, `agentos/`, `ai-workforce/` (approvals, RBAC, Zod output contracts, audit, telemetry), `ai-safety.ts` (fail-closed kill switch), `verification-agent.ts` (content-hash verification), and Prisma `AiAgent`/`AiAgentRegistry`/`AgentSkillExtension`/`AgentToolExtension`. **The 15 agents are registrations, not a new system.**

### 5. Three conflicting Australia visa fees and two conflicting IHS figures exist in the live market
Independent BD publishers disagree with each other. **That is the market gap and the trap** — and it is why `seo_claims` + `seo_sources` + AG-05 Source Verification, not a content calendar, is the centrepiece of this design.

---

## Integrity statement

**No search volume, keyword difficulty, CPC, domain authority, backlink count, traffic estimate, conversion rate, visa success rate, or review/application/enrolment count appears anywhere in this deliverable set.** Every such figure is marked `DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS`.

This is not a limitation of effort; it is the brief's own rule applied without exception, and it is the reason the plan front-loads work that requires no external access.

**Class A — confirmed public findings:** 16 (direct fetches, dated)
**Class B — likely risks requiring access:** 6
**Class C — exact access required:** 23 known unknowns, each mapped to the credential that resolves it
**Blocked audit items:** 18 — **14 of which resolve in one afternoon** once Search Console and Hostinger access are granted

### Research sources and their tiers
Tier A (official primary) · Tier B (licensed professional) · Tier C (institutional) · Tier D (competitor, **positioning only — never visa law**) · Tier E (forum, **question discovery only**).

**Important caveat recorded in the Evidence Log:** the UK Graduate visa and Australia fee tables are currently **Tier B/C consensus only**. They are **BLOCKED for publication** until read from GOV.UK / Home Affairs. Two sources also disagree on the student IHS rate (£470 vs £1,035), and one contradicts another on UK visa fees — **no fee figure ships unresolved.**

---

## The ten decisions ALO must make

These are authorisations, not research questions. The plan proceeds without them; affected items are marked BLOCKED.

| # | Decision | Blocks |
|---|---|---|
| **DEC-1** | Which office address is canonical? | Local SEO, LocalBusiness schema, all citations |
| **DEC-2** | "No IELTS needed" — remove or scope? | SEO-01 (do this today regardless) |
| **DEC-3** | Un-gate the About page? | DEV-05, I3 |
| **DEC-4** | `alo-education.odoo.com` — noindex or 301? | Entity consolidation |
| **DEC-5** | May the audit user agent be whitelisted at the edge? | All crawl-based auditing, AG-01 |
| **DEC-6** | Is there an auditable dataset for any ALO result claim? | Original data report, authority plan |
| **DEC-7** | Authorise the 21-table SEO schema in the CRM? | Claims Registry, workflow, all 15 agents |
| **DEC-T4** | Which host is canonical — apex or `www`? | DEV-04 |
| **DEC-C1** | Who is the named human reviewer for sensitive content? | R-06 — the review gate |
| **DEC-C2** | Who owns verification over the 23 Dec–5 Jan holiday period? | R-09 — the 1 Jan policy event |

---

## Volume target vs the brief's guidance

| Item | Brief guidance | This plan |
|---|---|---|
| Money pages | 12–15 | **15 Publish Now** (of 30 classified) |
| Support articles | 12–18 | **18 Publish Now** (of 95 classified) |
| Counsellor profiles | 3–5 | **3–5** (SEO-12) |
| Student stories | 6–10 | **6–10** (SEO-13) |
| Original data report | 1 | **1** (SEO-20) |
| AI MVPs | 2 | **2** (Weeks 11 and 12) |

**Merge is the largest classification band (32 of 95).** This is deliberate: Google's spam policy treats separate pages for query variations as scaled content abuse, and honouring the article cap requires merging rather than multiplying. Merging includes a 301 where a URL already exists.

---

## First actions, in order

1. **Answer DEV-01** (deployment parity) — 4-step test, no credentials needed beyond a browser.
2. **Remove or scope "No IELTS needed"** — two minutes, needs no access, removes a live factual risk.
3. **Grant Hostinger + Search Console + CRM access** — unblocks 18 blocked findings and the entire baseline.
4. **Decide DEC-1 (the canonical address)** — needs one management decision.
5. **Start SEO-03 (the 30 Nov UK page)** — the window is measured in days, not weeks.
