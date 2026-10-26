# ALO branding and shared visual refinements — 26 October 2026

Base: 0b1d330434a0f46d108faa2ba411fffe18eae8b7 (PR34 merge).

## Scope and palette decision

The current base already contains the requested public header/footer, required destination/company/policy routes, contact/social registry, cap animation and self-hosted Latin fonts. Preserve these existing owners and do not duplicate pages. Explicit user branding (#0066CC, #F37021, #FFB347; Montserrat/Poppins and Open Sans/Roboto) takes priority over the older palette/font suggestions in the uploaded visual brief.

## Changes

- Cancel pending hover intent on click, Escape, click-away and navigation, preventing dropdowns from reopening after dismissal.
- All four homepage parts reuse the existing animation module's canonical BRAND palette; correct its old blue/orange values and matching decorative tints.
- Orange CTA normal state uses dark labels; dark orange hover/pressed state uses white labels. Remove hard-coded orange inline button backgrounds that blocked proper hover styling.
- Shared CardTitle uses heading typography. Mobile inputs use 16px text, preserving desktop density and existing validation.
- Shared dialog, alert-dialog and sheet overlays use a light, blurred surface. Dialogs have viewport-constrained scrolling and white/card surfaces; Radix behavior and focus traps remain intact.
- Public layout supplies Framer Motion reducedMotion=user; shared reveal offsets are restrained. Existing footer cap reduced-motion rules remain.
- Self-host Noto Sans Bengali variable Bengali subset (Fontsource package 5.3.0) with OFL license. No new runtime/package dependency or third-party font request.
- Build-only Webpack memory optimizations, explicit build worker, and disabled production compilation cache. Development HMR and HTTP runtime caching remain unchanged. Typechecking remains enabled.
- Extend existing browser regression tests for hover dismissal and light mobile-sheet overlay.

No API, authentication, RBAC, database schema, business workflow or Student Dashboard source changed. Shared visual primitives also affect their existing consumers; this is not a claim of pixel-identical portal presentation.

## Verification

- npm ci: passed; Node22 used for app verification.
- prisma generate: passed; generated client verified against 604 declared models.
- Full typecheck: passed after correcting a missing BRAND import found in the first run.
- Six focused brand/navigation/chrome suites: 75 tests passed. Full unit regression: 306 suites, 3438 tests passed (single worker).
- ESLint on modified TS/TSX: passed.
- git diff --check: passed.
- Production build: pending final result. An earlier attempt hit the sandbox 8GB memory limit (worker SIGKILL); memory optimization configuration was added before retry.
- Browser: the cloud browser cannot reach this workspace localhost (connection refused). New browser cases have not been executed here; no desktop/tablet/mobile screenshot acceptance is claimed.

## Release and rollback

This branch is reviewable code, not a verified live deployment. Do not treat an unmerged PR as production. No production changes or data mutation were made.

Merge only after required CI and browser/visual acceptance. Apply the normal Hostinger-owned deployment process, verify deployed commit, public chrome/menu order/contact/social links/cap strip on representative public pages, signed-in chrome suppression, and long modal/mobile behavior. No migration is required for this patch. Revert this change commit to roll back code; no destructive data rollback is needed.
