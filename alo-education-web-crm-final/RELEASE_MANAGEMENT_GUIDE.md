# Release Management Guide

## Release Gate
A release is acceptable only after clean-extract install, migration deploy, seed, typecheck, lint, automated tests, production build, standalone startup, HTTP checks, backup and restore.

## Update Process
1. Create a full source and database backup.
2. Build from a clean branch.
3. Run all gates.
4. Package source, production runtime, database, documentation and audit reports.
5. Verify checksums twice.
6. Deploy to staging first.
7. Run smoke tests and RBAC checks.
8. Promote to production only after approval.

## Rollback
Rollback requires the previous package, previous migration state, backup location, restore test result and post-rollback health check.
