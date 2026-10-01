# Dependency remediation — 2026-10-01 continuation

Fresh audit before change: 3 HIGH / 0 critical, all one advisory chain.

| Package | Installed before | Affected range | Advisory | Fix | Risk / usage / action |
|---|---|---|---|---|---|
| deepmerge-ts | 7.1.5 | <8.0.0 | GHSA-ggr8-5vv4-36mx, recursive graph stack exhaustion | 8.0.0 | Targeted explicit major override under @prisma/config only; no silent broad upgrade |
| @prisma/config | 6.19.3 | Audit transitive range 6.13.0-dev.1–8.1.0-dev.4 | Same advisory via deepmerge-ts | Scoped dependency override | Version unchanged |
| prisma | 6.19.3 | Same transitive audit range | Same advisory | Scoped dependency override | Version and binaryTargets unchanged; no downgrade or force fix |

Inspected actual @prisma/config/dist/index.js: dynamically imports standard `deepmerge` and supplies it as c12's merger; remote config extension, dotenv and rc files disabled. No application direct imports found. Inspected npm tarball v8.0.0 CHANGELOG: breaking changes concern deepmergeInto alias mutations, metadata/type renames, and colliding Map keys; this repository config does not use those APIs. Both module exports and Node >=16 are compatible with repository Node >=22.

New tests verify ordinary nested/array/undefined merging, recursive graph handling, and loading an actual temporary Prisma config via @prisma/config/c12. This is stronger evidence than audit suppression but not an upstream support guarantee. CI must also validate Prisma generate/typecheck/build. npm lock regeneration includes bundled optional Tailwind wasm dependency metadata; no direct Tailwind version change.

After override and npm ci: npm audit reports **0 vulnerabilities**, full and production dependency sets. CI now blocks high/critical audit findings. No advisory suppression, Prisma version churn or npm audit fix --force.
