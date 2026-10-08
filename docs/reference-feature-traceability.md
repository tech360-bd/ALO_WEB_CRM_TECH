# Reference Feature Traceability

Maps each capability from the 2026-10-08 brief to the reference that informed it, the ALO file that implements or covers it, and its status. Status values: **DONE** (implemented and verified by tool output), **PARTIAL**, **GAP**, **NOT VERIFIED**, **BLOCKED**. Source: `docs/reference-audit/REFERENCE-MATRIX.md`, `FEATURE-GAPS.md`.

| Capability | Informed by (reference) | ALO file / area | Status | Verification |
|---|---|---|---|---|
| Standalone login/register/reset routes | Brief requirement (no reference) | `src/components/website/public-chrome-policy.ts`, `PublicLayoutWrapper.tsx` | DONE | Unit test (19 cases) + production SSR: `/login`, `/portal/login`, `/student/login`, `/student/register`, `/register`, `/forgot-password` all show nav=0 footer=0. `/`, `/book-consultation` keep nav=1 footer=1 |
| One navbar / one footer / one hero per public page | Brief requirement | `PublicLayoutWrapper.tsx`, `PublicNavbar.tsx`, `PublicFooter.tsx` | DONE (earlier design-system pass) | Homepage prerender counts |
| Editorial static-first diagram | diagram-design (MIT, pattern) | `src/components/marketing/EditorialFlowDiagram.tsx` | PARTIAL: one fixed diagram | Not re-verified |
| Reusable data-driven diagram system | diagram-design (MIT, pattern) | none | GAP | - |
| Lucide-only icons on journey page | Brief requirement | `src/app/student-journey/page.tsx` | GAP (inline SVG paths) | - |
| SEO workflows (keywords, audit, competitors, policy) | open-seo (MIT, pattern) | `src/components/crm/seo/*` | PRESENT (not verified live) | - |
| AI content quality check | humanizer (MIT, pattern) | `src/lib/ai-workforce/text.ts` | NOT VERIFIED | - |
| Agent skills as files | marketingskills (MIT, pattern) | `src/lib/ai-workforce/skills/` | PRESENT (not audited) | - |
| Agent long-term memory | ai-memory (MIT), OpenViking (AGPL, pattern only) | `src/lib/ai-workforce/memory.ts` | PRESENT (not compared) | - |
| Unified AI context layer | OpenViking (AGPL, pattern only) | none | GAP | - |
| Video engine with provider boundary | MoneyPrinterTurbo (MIT), HyperFrames (Apache-2.0), both pattern/evaluate only | `src/lib/video-engine/` (Remotion) | PARTIAL | - |
| n8n automation | n8n (licence not re-checked) | `src/lib/video-engine/n8n/`, `N8nWorkflowsView.tsx` | PRESENT | - |
| Public API catalogue for research | public-apis (MIT, catalogue only) | none | NOT ADOPTED | - |
| B2B multi-tenant white-label | Django-CRM candidate (multi-tenant), brief | `prisma/schema.prisma` (`PartnerProfile.companyName`) | GAP (schema audit needed) | - |
| Audit log | Brief requirement | `PortalAuditLog` model | PARTIAL (coverage not audited) | - |
| Security tests | Brief requirement | `tests/unit/` | GAP (no security suite identified) | - |
| E2E tests for route matrix | Brief requirement | `tests/e2e/public-and-auth.spec.ts` | PARTIAL (public/auth only) | - |
| Reporting layer | Brief requirement | `recharts` dependency | NOT VERIFIED | - |
| Existing AI agents activated and verified | Brief requirement | `src/lib/ai-workforce/` | NOT DONE | - |
| Push to `main` | Brief requirement | git | BLOCKED: session is limited to the arena branch; draft PR #34 open | - |
| Hostinger build and live QA | Brief requirement | - | BLOCKED: no access | - |
