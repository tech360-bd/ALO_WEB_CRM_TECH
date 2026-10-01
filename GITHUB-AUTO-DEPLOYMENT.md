> Deployment ownership update (2026-10-01): GitHub Actions is CI-only. Legacy release/recovery entries are disabled. Hostinger external branch selection remains UNKNOWN. See [DEPLOYMENT_ENTRYPOINT_MATRIX.md](DEPLOYMENT_ENTRYPOINT_MATRIX.md); older release instructions below are historical and must not be executed.

# GitHub auto-deployment

Repository: `engralaminn-collab/alo_education_z....ai`. Production-trigger branch: `main`. Session changes are on `arena/01a0f2b5-alo-education-z-ai`; review and merge them into main, never force-push.

The production workflow now calls the reusable CI workflow for the exact triggering checkout: npm ci → secret-pattern scan → Prisma validate/generate → generated-client verification → lint → typecheck → tests → integration tests → production build → standalone verification. Any failure prevents the deploy job.

**Auto-deployment is not implemented or claimed live.** The protected-environment deployment job deliberately exits with a configuration error until a real cPanel contract is verified. It contains no alternative transport or database migration. `SKIP_MIGRATIONS=true`. Recovery similarly refuses to act on an unknown hosting runtime. A failed or skipped job is not deployment success.

Required next implementation: exact-SHA artifact/commit transfer, manifest and checksums, provider completion polling, persistent-storage preservation, managed restart, deployed-SHA attestation, HTTPS readiness and role-specific smoke tests. Use only the provider's documented API or native Git mechanism. Do not enable an unconditional pull-on-push shortcut.

GitHub API reports main is unprotected and production environment has no review rules. Configure required checks and release approval before enabling delivery. Listing secret/variable names was denied by the connection (403); no missing/present credentials can be inferred. No deployment credential names are invented until the mechanism is selected.
