# Diagram Design System — ALO Education

The project's editorial SVG diagram library: `src/components/diagrams/`.

**Source:** [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) — a 44-type editorial diagram system (self-contained HTML/SVG, semantic tokens, strict connector grammar). That skill's own onboarding rule says *never ship default-skinned diagrams into a branded project* — so this library is its design language **re-skinned to the ALO brand palette** (`src/app/globals.css`: navy `#0F172A`, blue `#2563EB`, orange `#F97316`).

## Token mapping (semantic roles, never raw hexes at call sites)

Defined once in `src/components/diagrams/tokens.ts`:

| Role | ALO value | Source role default | Used for |
|---|---|---|---|
| `paper` | `#FFFFFF` | `#f5f5f5` | Page background, default node fill |
| `paper2` | `#F8FAFC` | `#ececec` | Container bg, secondary fill, funnel layers |
| `ink` | `#0F172A` (alo-navy) | `#2d3142` | Primary text + primary stroke |
| `muted` | `#64748B` | `#4f5d75` | Secondary text, default arrow stroke |
| `soft` | `#94A3B8` | `#7a8399` | Sublabels, boundary labels |
| `rule` | `rgba(15,23,42,0.12)` | `rgba(45,49,66,0.12)` | Hairline borders |
| `ruleSolid` | `#CBD5E1` | `#bfc0c0` | Stronger borders, baselines |
| `accent` | `#F97316` (alo-cta) | `#eb6c36` | **Focal — 1–2 elements per diagram max** |
| `accentTint` | `rgba(249,115,22,0.08)` | `rgba(235,108,54,0.08)` | Fill for accent-bordered boxes |
| `link` | `#2563EB` (alo-brand) | `#2e5aa8` | External / API arrows |
| `series[0..4]` | sage / dusty-blue / mustard / rust / slate | same hues | Multi-series charts only — never backfilled to other types |

## Typography roles

| Role | Treatment | Usage |
|---|---|---|
| node name | sans 12px, weight 600 | Human-readable labels |
| sublabel | mono 9px | Codes, timeframes, field types |
| eyebrow | mono 8px, uppercase, tracked 0.18em | Stage tags, axis labels, legends |
| arrow label | mono 8px, tracked 0.06em | Connector annotations (yes/no, handoffs) |

## Non-negotiable grammar (carried over from the source skill)

1. **Orthogonal connectors only** — rounded quarter-arc bends (`r = 8`, clamped to half the shortest segment). Diagonal connectors are an automatic fail. `roundedOrthoPath()` in `primitives.tsx` enforces this.
2. **Arrows render before boxes** — lines sit behind nodes (z-order).
3. **Labels never sit on their arrow** — 6–10px gap with an opaque mask rect.
4. **One accent rule** — 1–2 focal elements per diagram (e.g., the focal process node, the trough stage, the conversion layer). Coral/orange is editorial, not a flag.
5. **Shape carries type, not color** — pills for start/end, rects for steps, diamonds for decisions, dots for merge points.
6. **Honest geometry** — funnel widths are proportional to real counts; timelines space events by real elapsed time; sentiment is ordinal (named levels, never numeric).
7. **Every decision branch is labeled** (yes/no).
8. **Accessibility** — every diagram is `role="img"` with an `aria-label`; static SVG (no autoplay animation), so it works in print and reduced-motion mode.

## Components

| Component | Type (source skill) | Used on |
|---|---|---|
| `ProcessDiagram` | Process (lanes × steps) | `/application-process` — who does what across Student / Counselor / University·Visa |
| `JourneyMapDiagram` | User journey (sentiment curve) | `/student-journey` — sentiment by stage, trough + pain markers |
| `FunnelDiagram` | Pyramid/funnel | `/admin/marketing-automation` — live enquiry→enrollment funnel (real CRM counts) |
| `TimelineDiagram` | Timeline | `/application-process` — intake timeline to scale |
| `FlowDiagram` | Flowchart | `/eligibility-check` — eligibility decision logic |

ALO-specific compositions live in `alo-diagrams.tsx` (`ApplicationProcessDiagram`, `StudentJourneyMapDiagram`, `EligibilityFlowDiagram`, `MarketingFunnelDiagram`, `IntakeTimelineDiagram`). Generic types take data via props; compositions are the site content.

## Rules for adding a new diagram

1. Pick the type by **behavior first** (what the reader must learn), then layout.
2. Use tokens from `tokens.ts` — never inline hexes.
3. Keep the complexity budget: ≤6 journey stages, ≤6 funnel layers, ≤3 decision exits per diamond, ≤2 pain markers.
4. Exactly one focal element; everything else muted.
5. Never invent data — funnels/timelines render real values (the marketing funnel fetches live counts from `/api/crm/*`).
6. Add/extend `tests/unit/diagram-library.test.ts` — every new composition needs a no-NaN render test.
