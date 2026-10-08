# Feature Gaps

Gap status is based on what was checked in the repository. "Not verified" means the check was not done, so it is not counted as present or missing.

| # | Capability (from brief) | Status | Evidence / note |
|---|---|---|---|
| G1 | Login and registration routes standalone (no public navbar, no public footer) | **DONE** (production SSR verified) | Before: SSR of `/login`, `/portal/login`, `/student/login` contained one `<nav>` and one `<footer>`. Fix: `src/components/website/public-chrome-policy.ts` plus `PublicLayoutWrapper.tsx`. Unit test: `tests/unit/public-chrome-policy.test.ts` |
| G2 | One footer per public route | Present (checked before this pass) | Homepage prerender: one `<footer>` (`docs/design-system.md`) |
| G3 | Reusable data-driven diagram system | **Gap** | Only `src/components/marketing/EditorialFlowDiagram.tsx`, a fixed 4-step diagram |
| G4 | Icons: Lucide only | **Gap** | `src/app/student-journey/page.tsx` uses inline SVG path strings as phase icons |
| G5 | Student journey / lifecycle visual | Partly present | `src/app/student-journey/page.tsx` has the phase content. Visual is not a reusable component (see G3, G4) |
| G6 | B2B multi-tenant white-label with server-derived tenant IDs | **Not verified / likely gap** | `prisma/schema.prisma` has `PartnerProfile.companyName` and many `partnerId` columns. No tenant-scoped branding model was found in this pass. Needs a schema audit and a migration plan. No migration was written |
| G7 | Existing AI agents activated and verified, not rebuilt | **Not done** | `src/lib/ai-workforce/` has many modules (api, approvals, audit, health, memory, runner, telemetry, workflow-engine). Agent registration and runtime checks were not run |
| G8 | Unified AI context layer | **Gap** | No single context module found in this pass. Memory, knowledge, and skills exist as separate modules |
| G9 | Reporting layer | Not verified | `recharts` is a dependency. Coverage not audited |
| G10 | Audit log | Partly present | `PortalAuditLog` model exists (referenced in the typecheck fixes). Coverage not audited |
| G11 | Security tests | **Not verified** | Unit tests exist under `tests/unit/`. No security-specific suite was identified |
| G12 | E2E tests for every route in the test matrix | **Gap** | `tests/e2e/public-and-auth.spec.ts` covers public and auth routes only. Assertions at lines 40 and 49 expect `role=button` for "Book Free Consultation" and need updating |
| G13 | SEO module | Present | `src/components/crm/seo/` (6 components). Live data depends on external providers |
| G14 | Video engine with isolated GPU/provider boundary | Partly present | Remotion engine under `src/lib/video-engine/`. Provider boundary not verified against the brief |
| G15 | Marketing hub | Present | `src/components/marketing/hub/` (30 views). Not individually verified |
| G16 | `button.tsx` `xl` size on the spec scale | **Gap** | `h-[52px]`, outside the 44px button spec (carried from the design-system pass) |
| G17 | Hardcoded hex in homepage components | **Gap** | `C` constants at `HomepagePart1.tsx`, `Part2`, `Part3`, `Part4` (carried from the design-system pass) |
| G18 | "Not yet wired" placeholder copy | **Gap** | 512 occurrences across 163 files (design-system pass count) |
| G19 | Push verified changes to `main` | **Blocked by session policy** | Session restricts commits to `arena/d36e2d29-alo-education-z-ai`. Draft PR #34 is the substitute. Ask before any push to `main` |
| G20 | Hostinger build of the exact commit | **Not done** | No Hostinger access in this sandbox |
| G21 | Visual QA of every route | **Not done** | No browser in the sandbox |

## Priority order for the next pass

1. G1 build verification and E2E update (G12, partly).
2. G4 and G3: replace inline SVG icons with Lucide and add one reusable diagram component.
3. G6: schema audit of tenant identity before any migration.
4. G7 and G8: activate and verify the AI workforce, then add the context layer.
5. G11 and G12: security and route-matrix tests.
