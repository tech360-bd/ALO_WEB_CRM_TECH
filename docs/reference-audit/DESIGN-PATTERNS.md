# Design Patterns Taken from References

Only patterns are recorded. No code, text, screenshots, or trademarked assets were copied. Each pattern notes where it applies in ALO and what is still missing.

| Pattern | Source | ALO status (verified) | Gap |
|---|---|---|---|
| Static-first, semantic-HTML + inline-SVG diagrams that work without animation or print | diagram-design (MIT) | Implemented once: `src/components/marketing/EditorialFlowDiagram.tsx`, used in `src/app/admin/marketing-automation/page.tsx` | No reusable data-driven diagram component. `src/app/student-journey/page.tsx` builds its own phase layout from inline SVG path strings, which breaks the Lucide-only rule |
| Agent skills as versioned Markdown files, one workflow per file | marketingskills (MIT) | `src/lib/ai-workforce/skills/` exists | Skill inventory and activation not audited in this pass |
| Long-term agent memory with explicit recall/write separation | ai-memory (MIT), OpenViking (AGPL, pattern only) | `src/lib/ai-workforce/memory.ts`, `knowledge.ts` exist | Not compared against either reference in detail |
| Context tiers for the AI layer (short-term, retrieved, long-term) | OpenViking (AGPL, pattern only) | Partly covered by the modules above | A unified AI context layer is not yet built |
| Text-quality pass that removes generic AI phrasing | humanizer (MIT) | `src/lib/ai-workforce/text.ts` exists | No rule-based check is wired into content generation |
| HTML/CSS scene as a video source, rendered by a separate renderer | HyperFrames (Apache-2.0) | Remotion engine in `src/lib/video-engine/remotion/` | Provider boundary for an alternative renderer not verified |
| Self-hosted SEO workflows exposed to agents through MCP | open-seo (MIT) | SEO suite in `src/components/crm/seo/` (6 components) | MCP exposure not verified; live data depends on a paid key |
| Static-first page sections with one shared shell | Internal design-system pass | One navbar, one footer, one hero, one product section in place | Login route fixed this pass (see FEATURE-GAPS.md) |

## Visual rules these patterns must respect

- Brand tokens only (`globals.css`). No hardcoded colours in new components.
- Lucide icons only. No emoji and no inline SVG path strings in new UI.
- Card radius, button height, and type sizes follow the design-system scale in `docs/design-system.md`.
- No gradients, glassmorphism, or decorative shadows added for a reference's look alone.
