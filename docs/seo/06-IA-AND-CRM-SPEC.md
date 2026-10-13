# DELIVERABLES 9 & 10 — Information Architecture · WEB_CRM Product Specification

> **Merge-first, stated plainly.** An SEO module already exists in this repository: 9 routes under `src/app/api/seo/*` (`health`, `stats`, `opportunities`, `keywords` + `cluster`/`prioritize`/`stats`, `tasks` + `tasks/[id]/complete`), `src/lib/seo-engine.ts` (283 lines), `src/lib/keyword-research-engine.ts` (145 lines), `src/lib/seo/{ga4,request-access,schema-helpers}.ts`, and UIs at `src/app/admin/seo`, `src/app/crm/seo-manager`, `src/components/crm/seo`. **Only two Prisma models exist: `SeoOpportunity` and `SeoTask`.**
>
> **This specification extends that system. It does not replace it.** Everything below is additive; the two existing models are retained and referenced, not migrated away.

---

# DELIVERABLE 9 — INFORMATION ARCHITECTURE

## 9.1 Canonical URL policy (declared once, enforced everywhere)

| Rule | Decision | Enforced by |
|---|---|---|
| **9.1.1 Canonical host** | **One** host serves content; the other 301s to it permanently. Which one is **DEC-T4** — to be decided from GBP/citation evidence, not by preference | Server config + canonical tags + sitemap + GBP + all citations |
| **9.1.2 Protocol** | HTTPS only; HTTP 301s to HTTPS | Server config + HSTS |
| **9.1.3 Trailing slash** | `trailingSlash: false` — the extensionless form is canonical. `/about-us/` 301s to `/about-us` | `next.config` + internal links + canonical tags |
| **9.1.4 Case** | Lowercase only. Uppercase variants 301 to lowercase | Server config |
| **9.1.5 Query strings** | **Query-string URLs are not "unrankable".** They are controlled: tracked links use a documented parameter allow-list; no parameter generates a new indexable page; all tracking params are ignored by canonical logic | Canonical logic + `noindex` on non-content params |
| **9.1.6 Indexability** | Public marketing and content routes: `index,follow`. Every non-public route family (`/api/*`, `/login`, `/crm/*`, `/admin/*`, student portal) returns `X-Robots-Tag: noindex` | Middleware + response headers |
| **9.1.7 Redirect policy** | 301 for permanent, 302 only for temporary. **Never 301 unknown URLs to the homepage** — that is a soft-404 and is forbidden | Server config + a redirect register |
| **9.1.8 URL language** | ASCII, hyphenated, lowercase, no dates, no year stamps, no IDs, no `.html` | Convention + QA Agent check |

> **Standing rule honoured:** the brief states *never mechanically bump a title's year* and *never state query-string URLs cannot rank*. Both are reflected above: rule 9.1.5 controls duplication and crawl proliferation instead of making a false claim, and no URL in this architecture contains a year.

## 9.2 URL map

```
/                                          Home — public, must render without a session (fixes I3/J2)
/about-us                                  About — PUBLIC (currently login-gated: A1/I3)
/contact                                   Contact — canonical NAP from DEC-1
/our-counsellors                           Counsellor hub (3–5 profiles)
/our-counsellors/{name-slug}               Individual counsellor profile
/student-stories                           Consent-verified stories hub
/student-stories/{slug}                    Individual story
/offices                                   Office hub (only real, staffed locations)
/offices/{area}                            Location page — DEC-1 dependent

/visa-changes                              ★ Visa Rule Change Tracker (living hub — topic #9)
/visa-changes/{change-slug}                Dated change pages (UK 30 Nov; UK 1 Jan; AU 2 Oct)

/study/{country}                           Country hub (uk, canada, australia, ireland, new-zealand, usa)
/study/{country}/{topic}                   Spoke — e.g. /study/uk/student-visa
/study/{country}/student-visa              ★ Route decision page
/study/{country}/financial-requirements    ★ The 30 Nov page lives here for UK
/study/{country}/post-study-work           ★ Graduate visa / PGWP / 485

/services/{service}                        service: university-application, visa-support, sop-support, pre-departure
/tools/course-finder                       AI MVP #2
/tools/eligibility-checker                 AI MVP #1

/guides/{slug}                             Support articles (the 12–18 published from D8)
/scholarships                              Funding hub
/scholarships/{slug}                       Funding spokes
/compare/{slug}                            Comparison pages (honest tables)

/privacy  /terms  /complaints  /accessibility
/sitemap.xml  /robots.txt
```

**Prohibited patterns:** `/best-{destination}-consultancy-in-bangladesh` (self-serving list — Rule 5.4.2), `/study-in-{city}` for cities with no office (doorway risk), any URL containing `2026` or `2027`.

## 9.3 Hubs, spokes and breadcrumbs

Three hub families, each with one job:

| Hub | Job | Spokes | Rule |
|---|---|---|---|
| **`/visa-changes`** | Own the dated-policy category | One spoke per dated change | Every spoke links to the hub; the hub links to every money page the change affects |
| **`/study/{country}`** | Destination entry point | Student visa · Financial requirements · Post-study work · Universities · Scholarships | Every spoke links to its hub **and** to at least one commercial page |
| **`/services/{service}`** | Commercial conversion | Trust pages, guides, tools | Each service page links to exactly one primary next step |

**Breadcrumb pattern (identical everywhere):** `Home › {Hub} › {Page}` · displayed visibly · marked up with `BreadcrumbList` · **never** more than 3 levels deep.

## 9.4 Navigation

| Zone | Contents | Rule |
|---|---|---|
| **Primary nav** | Study Abroad (dropdown: countries) · Services · Visa Changes · Scholarships · Tools · About · Contact | Maximum 7 items. **No year in any label** |
| **Primary CTA** | *Book a free consultation* — persistent, right-aligned | One primary CTA; WhatsApp secondary |
| **Mobile** | Persistent bottom bar: **Call** · **WhatsApp** · **Book** | Fixes CV2. Visible without scrolling |
| **Footer** | Destinations · Services · Visa Changes · Guides · About · Policies · NAP block | **NAP block mirrors DEC-1 exactly, character for character** |
| **Depth rule** | **No money page more than 3 clicks from the homepage** | Fixes L6 |

## 9.5 Internal-link rules (the rule set the QA Agent enforces)

| # | Rule | Enforcement |
|---|---|---|
| IL-1 | Every published page has **≥ 2 contextual internal inlinks** from relevant body content | Publishing Agent **refuses** to publish otherwise (L5) |
| IL-2 | Every spoke links to its hub; every hub links to all its spokes | QA Agent check |
| IL-3 | Every support article links to **≥ 1 commercial page** with a descriptive anchor | QA Agent check |
| IL-4 | Anchor text names the destination and its benefit. **"Click here" and "read more" are prohibited** | QA Agent check (O7) |
| IL-5 | Every dated-policy page links to the `/visa-changes` hub, and the hub links back | QA Agent check |
| IL-6 | No page links to a non-public route family | QA Agent check |
| IL-7 | No more than one link to the same target from a single page | QA Agent check |
| IL-8 | Broken internal links are a **blocking** defect, not a warning | Monthly Internal Link Agent run |

---

# DELIVERABLE 10 — WEB_CRM PRODUCT SPECIFICATION

**Module name:** `SEO Growth`
**Status:** specification. Gated on **DEC-7** (authorisation to create schema).

## 10.1 The 22 sub-modules

| # | Sub-module | Purpose | Builds on existing |
|---|---|---|---|
| 1 | **Projects** | Multi-market/multi-site container (Bangladesh primary, Dhaka priority) | new |
| 2 | **Source Registry** | Every citable source with tier, jurisdiction, retrieval date, effective date, expiry | new |
| 3 | **Claims Registry** | Every factual claim linked to sources; the core anti-staleness mechanism | new |
| 4 | **Claim Verification** | Verification runs and results per claim | new |
| 5 | **Keyword Groups** | The 9 intent groups from D4 | extends `keyword-research-engine.ts` |
| 6 | **Keywords** | Keyword records with **explicit null volume** until verified | extends existing |
| 7 | **SERP Snapshots** | Point-in-time SERP evidence, incl. AI Overview presence | new |
| 8 | **Competitors** | Competitor register with tier + "never as visa law" flag | new |
| 9 | **Gap Findings** | Gap matrix rows (D5) | new |
| 10 | **Opportunities** | Priority-scored candidates (the D4 §4.3 score, stored with its components) | **extends existing `SeoOpportunity`** |
| 11 | **Page Queue** | The 30 money-page seeds + classification (D7) | new |
| 12 | **Content Queue** | The 100 classified topics (D8) | new |
| 13 | **Briefs** | Content briefs, each with required claims and sources | new |
| 14 | **Content Items** | Workflow state machine (IDEA→…→ARCHIVED) | new |
| 15 | **Content Versions** | Every version retained; enforces a real rollback path | new |
| 16 | **Reviews** | Fact-check, source-verification, human-expert and QA sign-offs | new |
| 17 | **Internal Links** | Link graph + IL-1…IL-8 validation | new |
| 18 | **Technical Findings** | D3 findings with severity/owner/deadline | new |
| 19 | **Tasks** | Work items | **extends existing `SeoTask`** |
| 20 | **Attribution** | Organic → lead → application → enrolment | new |
| 21 | **Agent Runs** | Every AI agent invocation, inputs, outputs, approvals, cost | new |
| 22 | **Reporting & Alerts** | Leading/mid/lagging dashboards + alerting | new |

## 10.2 The 21 tables

Naming follows the repository's existing Prisma conventions (`cuid()` ids, `createdAt`/`updatedAt`). **No existing table is dropped.**

| # | Table | Key fields | Notes |
|---|---|---|---|
| 1 | `seo_projects` | `id, name, market, priorityLocale, timezone, startDate, endDate, status` | Bangladesh/Dhaka/Asia/Dhaka seeded |
| 2 | `seo_sources` | `id, claimScope, jurisdiction, url, pageTitle, publisher, sourceTier, isPrimaryOfficial, retrievedAt, publishedAt, updatedAt, effectiveDate, expiryDate, supersededById, reviewerId, confidence` | **`sourceTier` A–E is mandatory.** `expiryDate` drives the Watchdog |
| 3 | `seo_claims` | `id, projectId, statement, category, jurisdiction, riskClass, status, primarySourceId, effectiveFrom, effectiveTo, lastVerifiedAt, nextReviewAt, reviewerId, notes` | **`riskClass`** ∈ IMMIGRATION_MONEY / IMMIGRATION_RULE / INSTITUTION / STATISTIC / GENERAL. IMMIGRATION_MONEY requires a same-day Tier A source |
| 4 | `seo_claim_verifications` | `id, claimId, sourceId, checkedAt, checkedBy, outcome, previousValue, newValue, evidenceNote` | Append-only audit trail |
| 5 | `seo_keyword_groups` | `id, projectId, code, name, intent, funnelStage, pageType, freshnessDays` | The 9 groups |
| 6 | `seo_keywords` | `id, groupId, keyword, locale, volume, volumeSource, difficulty, difficultySource, cpc, verifiedAt, isVerified` | **`volume` null + `isVerified=false` by default.** Scoring treats unverified as 0 |
| 7 | `seo_serp_snapshots` | `id, keywordId, capturedAt, device, locale, topResultsJson, hasAiOverview, aiOverviewSourcesJson, localPackPresent, notes` | Evidence for the `F` score component |
| 8 | `seo_competitors` | `id, name, domainsJson, tier, positioning, isSelfPublishedList, evidenceUrl, capturedAt` | `tier='D'` and `isSelfPublishedList=true` **can never** satisfy a claim |
| 9 | `seo_gap_findings` | `id, competitorId, capability, aloState, competitorState, canWin, evidence` | D5 matrix |
| 10 | `seo_opportunities` | **existing** + `scoreG, scoreD, scoreC, scoreB, scoreF, scoreU, totalScore, scoredAt, isProvisional` | **Additive columns only.** `isProvisional=true` while any component is null — prevents a partial score being read as a priority |
| 11 | `seo_page_queue` | `id, projectId, seedIndex, title, groupCode, classification, rationale, targetUrl, owner, status` | The 30 seeds with their classification |
| 12 | `seo_content_queue` | `id, projectId, topicIndex, title, groupCode, classification, rationale, mergedIntoItemId, status` | The 100 topics |
| 13 | `seo_content_briefs` | `id, contentItemId, targetQuery, searchIntent, requiredClaimsJson, requiredSourcesJson, outline, wordBudget, internalLinkTargetsJson, approvedBy` | **A brief cannot be approved without its required claims listed** |
| 14 | `seo_content_items` | `id, projectId, briefId, type, title, slug, state, currentVersionId, authorId, reviewerId, publishAt, publishedUrl, canonicalUrl, archivedAt` | State machine in §10.4 |
| 15 | `seo_content_versions` | `id, contentItemId, versionNo, bodyHtml, bodyPlain, metaTitle, metaDescription, structuredDataJson, imageAltJson, createdBy, createdAt, contentHash, isPublished` | **Every version retained.** Enables real rollback |
| 16 | `seo_content_reviews` | `id, contentItemId, versionId, reviewType, reviewerId, reviewerRole, outcome, findingsJson, reviewedAt` | `reviewType` ∈ SOURCE_VERIFICATION/FACT_CHECK/HUMAN_EXPERT/SEO_QA/LEGAL |
| 17 | `seo_internal_links` | `id, fromUrl, toUrl, anchorText, isContextual, validatedAt, validationResult, brokenAt` | Powers IL-1…IL-8 |
| 18 | `seo_technical_findings` | `id, projectId, section, code, title, severity, evidence, impact, fix, ownerType, effort, deadline, status, verifiedAt` | D3, machine-readable |
| 19 | `seo_tasks` | **existing** + `projectId, contentItemId, findingId, ownerType, dueAt, blockedReason` | Additive |
| 20 | `seo_lead_attribution` | `id, leadId, studentId, applicationId, firstTouchJson, lastTouchJson, landingUrl, referrer, utmJson, gclid, capturedAt, convertedAt, conversionType` | **The 20% score component and the only source of SEO's business value** |
| 21 | `seo_agent_runs` | `id, agentCode, projectId, contentItemId, trigger, inputHash, outputJson, status, failureReason, tokensUsed, costEstimate, requiresHumanApproval, approvedBy, approvedAt, startedAt, finishedAt` | Complete audit of every AI action |

### Why `seo_claims` + `seo_sources` are the whole point

The D2 research produced **three conflicting Australia visa fees** and **two conflicting IHS figures** from independent publishers, and ALO's own live site carries an unscoped *"No IELTS needed"* claim. **A content calendar cannot prevent any of that. A claims registry can**, because it makes the question *"has this figure been re-read from the official source since it last changed?"* a database query rather than a matter of memory.

## 10.3 Roles and permissions

| Role | Sources | Claims | Content drafts | Approve content | Publish | Attribution | Config |
|---|---|---|---|---|---|---|---|
| `SEO_ADMIN` | full | full | full | yes | yes | read | full |
| `SEO_EDITOR` | read | read | full | request | no | no | no |
| `SEO_RESEARCHER` | create/edit | propose | read | no | no | no | no |
| `FACT_CHECKER` | read | **verify** | read | **approve/block** | no | no | no |
| `REVIEWER` (SME) | read | read | read | **approve/block** | no | no | no |
| `PUBLISHER` | read | read | read | no | **publish** | no | no |
| `LOCAL_SEO` | read | read | edit (local) | no | no | no | local config |
| `ANALYST` | no | no | no | no | no | **full** | no |
| `VIEW_ONLY` | read | read | read | no | no | read | no |

**Separation of duties is enforced, not advisory:** the role that writes a claim cannot verify it, and the role that verifies cannot publish. `FACT_CHECKER` and `PUBLISHER` must be different users.

## 10.4 Workflow state machine

```
IDEA → RESEARCHING → BRIEF_READY → DRAFTING → FACT_CHECK →
  ├─ (fail) → CORRECTION_REQUIRED → DRAFTING
  ├─ (sensitive topic) → HUMAN_REVIEW →
  │       ├─ (fail) → CORRECTION_REQUIRED
  │       └─ (pass) → SEO_QA →
  └─ (pass) → SEO_QA →
        ├─ (fail) → CORRECTION_REQUIRED
        └─ (pass) → APPROVED → SCHEDULED → PUBLISHED → MONITORING
                                   MONITORING → UPDATE_REQUIRED → DRAFTING
                                   MONITORING → ARCHIVED
```

**Every transition records: `actorId`, `actorType` (human | agent), `timestamp`, `notes`, `fromState`, `toState`.** A transition lacking any of these is rejected at the service layer.

**Sensitive topics** (mandatory `HUMAN_REVIEW`): anything in `riskClass` IMMIGRATION_MONEY or IMMIGRATION_RULE, anything naming a person, anything quoting a success rate, anything involving money movement.

## 10.5 Scheduled jobs

| Cadence | Job | Idempotency | On failure |
|---|---|---|---|
| Daily | Claim review due-date scan → generate `UPDATE_REQUIRED` | Keyed on `claimId + reviewDate` | Retry ×3, exponential backoff, then dead-letter |
| Daily | Source expiry scan (source past `expiryDate`) → flag dependent claims | Keyed on `sourceId + expiryDate` | as above |
| Daily | Broken internal-link scan | Keyed on run date | as above |
| Weekly | GSC/GA4 performance ingest → `seo_metric_snapshots` via attribution | Keyed on `date + property` | Retry, then dead-letter + alert |
| Weekly | Freshness Watchdog report | Keyed on ISO week | as above |
| Weekly | Technical finding re-validation | Keyed on `findingId + week` | as above |
| Monthly | Internal link graph rebuild + orphan report | Keyed on month | as above |
| Monthly | SERP snapshot refresh for priority keywords | Keyed on `keywordId + month` | as above |
| On publish | Internal-link validation of the new page (blocks if < 2 inlinks) | Keyed on `versionId` | **Blocking** |
| On effective-date | Policy event trigger → force claim re-verification | Keyed on `claimId + effectiveDate` | Escalate to SEO_ADMIN |

All jobs follow the **already-implemented** cron contract in this repository: `cron-lock.ts` lease semantics (INSERT → conditional `updateMany WHERE expiresAt <= now`, fail-closed without a lock store, released in `finally`), ran→200 / skipped_locked→423 / blocked→501 / failed→500, `success = status === 'ran'`, and `Cache-Control: no-store`. **Jobs are declared in `CRON_JOBS.md`, which is the authoritative catalogue.**

## 10.6 What this specification deliberately does not do

* It does **not** propose an AEO/GEO module. D2 Part 2 records Google's own guidance that optimizing for generative AI is optimizing for Search, that no special files or schema are needed, and that `llms.txt` is ignored. Building a module for that would be spending on a documented non-tactic.
* It does **not** include keyword-volume estimation. `seo_keywords.volume` stays null until a real source exists, and the scoring model treats null as zero.
* It does **not** merge or drop `SeoOpportunity` / `SeoTask`. Both are extended additively, so existing UI at `/crm/seo-manager` and `/admin/seo` keeps working.
