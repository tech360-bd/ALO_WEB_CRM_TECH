# Phase 0C · 05 — Snapshot-Only Reconciliation

**Generated:** 2026-11-02 · **Data:** `snapshot-comparison.json`, `inventory-enriched.csv`
**Rule:** nothing was deleted, restored, overwritten or merged. This report describes the 316 files and
proposes a decision for each group. **Unimported is not automatically safe to delete.**

---

## 1. The two snapshots are the same tree

| Snapshot | `src` files identical to current | differ | only in snapshot |
|---|---:|---:|---:|
| `imports/alo-education-full/src` | 68 | 324 | **316** |
| `imports/alo-education-source/src` | 68 | 324 | **316** |

`proxy.ts` is byte-identical between the two snapshots, and both carry the identical 316/324/68 split.
**They are one archived state imported twice.** Treating them as two independent historical versions
would double-count every conclusion below — so this report covers 316 files, not 632.

## 2. Where the 316 live

| Path | Files | Same-name twin elsewhere in `src`? | Assessment |
|---|---:|---|---|
| `components/alo/**` | 121 | mostly no | older component generation: `new/`, `pages/`, `cards/`, `home/`, `drawers/` |
| `app/api/**` | 105 | mostly yes (renamed) | API handlers whose successors moved to `agentos`, `ai-agents`, `ai-command`, `ai-workforce` |
| `components/platform/**` | 38 | **no** | a complete parallel page layer that current `src` does not have |
| `lib/ai/**` | 14 | no | orchestrator, circuit breaker, event router, persistent memory, task processor |
| `components/diagrams/**` | 9 | no | chart/diagram primitives (funnel, swimlane, pyramid, timeline…) |
| `lib/offline/**` | 8 | **no** | full offline-first sync engine (IndexedDB, queue, conflicts) |
| `lib/view-registry/**` | 4 | **no** | view-name → component registry, split into group files |
| `components/public/**` | 2 | no | public navbar/footer |
| `app/page.tsx.bak`, `app/page.tsx.bak2` | 2 | n/a | editor backups of the home page |
| `app/login`, `app/register`, `components/providers.tsx`, `components/home`, others | 13 | no | singleton leftovers |

**183 of the 316 have no same-name successor anywhere in the current tree.** That is the number that
matters: those files are not "renamed", they are *absent*. The other 133 have a name twin and are
almost certainly superseded.

## 3. The four areas that need an explicit decision

### 3.1 `components/platform` — 38 files, zero successors

A complete page layer: `landing-page.tsx`, `crm-dashboard.tsx`, `student-dashboard.tsx`,
`course-finder-pro.tsx`, `whatsapp-crm.tsx`, `voip-call-center-page.tsx`, `seo-audit-page.tsx`,
`diagram-builder-page.tsx`, plus the public legal/content pages (about, contact, privacy, terms,
cookie-policy, careers, news, events, faq, blog, partners, services, scholarships, resources,
universities, destinations, knowledge-hub, success-stories, integrations, exams, email-campaign,
sms-campaign, lead-enrichment, analytics-dashboard, api-directory, ai-command-center,
ai-education-toolkit, auth-modal, lead-modal, student-info-center).

Current `src` has **no `components/platform` directory at all**. Some of this functionality exists as
`src/app/**/page.tsx` routes and `src/components/alo/views/**`, but there is no 1:1 successor, and
`voip-call-center`, `sms-campaign`, `email-campaign`, `diagram-builder`, `api-directory` and
`seo-audit` have no obvious current counterpart.

**Assessment:** this is the single largest block of potentially lost UI. It is *not* proof of loss —
route-based Next.js pages could cover the same ground — but it cannot be called safe either.
**Decision required:** keep as archive / confirm replaced / schedule restore.

### 3.2 `lib/offline` — 8 files, a whole capability

`sync-engine.ts`, `sync-queue.ts`, `cache-manager.ts`, `conflict-manager.ts`, `network-status.ts`,
`schema.ts`, plus helpers. This is a genuine offline-first engine: IndexedDB stores, a pending-mutation
queue, conflict resolution and auto-sync scheduling.

Current `src` has `src/app/offline/page.tsx` (a fallback "you are offline" page with a retry button)
and **no sync engine**. So the app can *tell* a user they are offline; it cannot *work* offline.

**Assessment:** capability loss with a plausible product cost (staff on mobile networks in Dhaka). No
indication it was consciously retired. **Decision required** before any cleanup.

### 3.3 `lib/view-registry` — 4 files, and a live symptom

`view-registry.ts` plus `group-public.ts`, `group-legal.ts`, `group-tools.ts`, `group-advanced.ts`.

Current `src` contains **no view registry** — yet `components/alo/views/*` still call
`onNavigate("public-country", slug)` from at least eight files
(`public-home`, `public-course`, `public-university`, `public-destinations`, `public-search`,
`public-admission-requirements`, `public-visa-support`, and the super-admin dashboard). Nothing maps
that view name to a component.

**Assessment:** this is not just an archived file — it is the most likely explanation for navigation
that does nothing. `public-country.tsx` is itself an orphan in the current tree (report 06 §4), so the
chain is broken end to end. **Highest-value item in this report.**

### 3.4 `app/page.tsx.bak` and `app/page.tsx.bak2`

Two editor backups of the home page. Neither is referenced by anything, and Next.js does not route
`.bak` files. They are pure clutter — but they are also the only record of two previous home-page
states.

**Assessment:** lowest risk of the four. Recommend deletion *after* the current `app/page.tsx` is
confirmed to be the intended version, and after the diff is reviewed — not before.

## 4. What the 316 are not

They are **not part of the running application**. Next.js only compiles `src/`; the snapshots live under
`imports/`, outside the app root, and are not in the import graph. The 316 do not ship, do not affect
the build, and are not reachable at runtime. That is why they are safe to leave in place — and why
"safe to leave" is not the same as "safe to delete".

## 5. Recommended decision, per group

| Group | Recommendation | Risk if ignored |
|---|---|---|
| `lib/view-registry` (4) | **investigate first** — likely cause of dead `onNavigate` view names | broken navigation, silent |
| `lib/offline` (8) | **decide explicitly** — restore, or record a product decision to drop offline mode | users lose offline capability nobody documented dropping |
| `components/platform` (38) | per-file triage against `src/app` routes; 6 files have no candidate successor | up to 6 features may be unimplemented today |
| `lib/ai` (14) | confirm the `agentos` / `ai-workforce` rewrite covers orchestrator, circuit breaker, memory | AI resilience features may be missing |
| `app/api` (105) | diff against `agentos`/`ai-agents`/`ai-command`/`ai-workforce`; retire the rest | dead endpoints linger as security surface |
| `components/alo` (121) | archive; the `new/` and `pages/` generations are superseded by `src/app` routes | confusion only |
| `components/diagrams` (9), `components/public` (2) | confirm no page needs them, then archive | cosmetic |
| `.bak`, `.bak2` | delete last, after diff review | none |

## 6. Sequencing

1. `lib/view-registry` — trace the `onNavigate` dead ends (they are observable in the UI today).
2. `lib/offline` — a product decision, not a cleanup decision.
3. `components/platform` — 38-file triage, 6 without a successor.
4. Everything else — archive under `imports/` or delete, only with approval.
