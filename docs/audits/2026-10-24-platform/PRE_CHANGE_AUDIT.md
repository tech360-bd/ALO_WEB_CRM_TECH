# Pre-change platform audit — ALO Education

Generated before implementation changes for this request. Base commit: `8511b7461818d88520fb6109686e6641bc5d1dc6`. Source tree matches the verified PR #29 head. **Overall production readiness: NOT VERIFIED / NOT COMPLETE.** This report is a complete category inventory, not a claim every file has been semantically executed or every business acceptance criterion passed.

## Scope and evidence

Every tracked path was inventoried, non-vendor duplicates hashed, and active source imports/literal assets checked with TypeScript module resolution. Legacy files remain separate evidence; four LFS pointers include two original archives and two old native binaries, so their underlying contents have not been inspected in this checkout. No production login, database mutation, migration, provider message, deployment, restore or service restart occurred.

Baseline CI: https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/40102374273 — 3,207 tests passed / 86 skipped; 108 actual MySQL tests; builds; 8/8 HTTP smoke. Same tree is main `8511b746…`; public production equivalence is not established.

| Requested audit category | Finding | Verification / action |
|---|---|---|
| Files/folders/missing tracked files | 68,101 tracked files; 8,671 tracked folders; 0 missing tracked paths | VERIFIED inventory; absence of an unlisted business requirement is not disproved. |
| Physical workspace | 171,514 files; 27,785 folders excluding .git | Snapshot includes installed dependencies and build output, not project-only totals. |
| Empty files | 138 tracked empty files; 1 in src | REVIEW: vendor/fixture/barrel files may be intentionally empty; list retained. |
| Placeholder files / TODO / FIXME | 0 TODO and 0 FIXME in active src; 2,103 lexical mock/demo/placeholder marker lines | REVIEW: input placeholders, comments and test terminology are not automatically unfinished functionality. |
| Broken imports / exports | 0 unresolved static imports across 2,423 active JS/TS files | Compiler on identical baseline tree passed in PR #29; dynamic/archived auxiliary code not proven. |
| Missing dependencies/packages | One undeclared-name candidate: nodemailer, in a type declaration | NOT a proven missing runtime dependency: smtp-mailer is the pinned nodemailer@10.0.13 alias and @types/nodemailer supplies declaration types. |
| Environment variables | 411 classified names; {'UNUSED': 102, 'REFERENCED_WITH_FALLBACK': 155, 'REFERENCED_FAIL_CLOSED': 20, 'REFERENCED': 122, 'PUBLIC': 12} | Production configuration values/availability UNKNOWN. No secret values recorded. |
| Configuration / deployment / Docker / Ubuntu / PM2 / Caddy | All required-path candidates exist (see JSON) | PRESENT; Docker/Ubuntu/PM2/Caddy release entry points are intentionally disabled by HOSTINGER-RUNTIME-STANDARD.md. Do not silently activate conflicting deployment owners. |
| Pages / APIs / models / migrations | 440 page files; 975 API route files; 552 Prisma models; 36 migrations | DECLARED, not all business workflows verified. Missing live database tables/history UNKNOWN without production metadata. |
| Missing APIs / backend routes / frontend pages | 1 unmatched literal API call sites; 5 unmatched literal link sites | CANDIDATES only; full unabridged route comparison in baseline-source-checks.json. Runtime/rewrites review required. |
| Authentication / authorization / validation / security | Existing auth middleware, central security engine, RBAC and negative tests present | PARTIAL verification: 3,207 tests + 108 real MySQL tests on exact baseline tree. Does not certify every controller or zero vulnerabilities. |
| Build / TypeScript / ESLint / install | PASS on baseline tree f09f25aa… via CI run 40102374273 and local checks | Verified source baseline, not production release proof; main merge CI checked separately. |
| Runtime / database / API / auth errors | Production anonymous probe currently reports /api/health 404, / 403, /destinations hosting-server 404 | FAIL from this execution path; WAF/edge/deployed-revision uncertainty. Browser/authenticated live workflows NOT VERIFIED. |
| Backup system | scripts/backup-mysql.sh exists, but set -e without pipefail can label a failed dump successful; password passed on argv | CONFIRMED source defect. No backup or restore was run; latest successful/restorable production backup UNKNOWN. |
| Monitoring / logging / SSL | Health monitor workflow, public HTTPS URL and logging code exist | Presence only. Live PM2/system/Caddy/Nginx logs, origin TLS expiry/renewal and private provider state UNKNOWN. |
| Background jobs | 13 cron API route files | DECLARED routes, not running-job count. Scheduler registration, queue workers and successful production jobs UNKNOWN. |
| AI agents | Registry/seed/runtime modules exist | Designed definitions are not operational agents. Configured/active/working counts and successful real model task UNKNOWN. |
| Broken images / links | 0 missing literal src asset references in active JSX; required header/footer pages declared | External assets, CMS/database image URLs, full dynamic links and deployed target remain NOT VERIFIED. |
| Public branding | Shared PublicNavbar/PublicFooter, required contact constants, policy pages, fonts, cap animation and brand tests already exist | REUSE. Required links need rendered-browser/HTTP verification. Current live site appears older; no duplicated header/footer is justified. |
| Official social links | LinkedIn corroborated; configured Instagram @aloeducation is an unrelated account; public evidence identifies @aloeducation.bd and YouTube @aloeducationbd | CONFIRMED wrong-account risk; Facebook identity must use corroborated ALO Bangladesh page. Research evidence is not account-admin ownership proof. |
| Brand favicon | Root metadata includes z-cdn.chatglm.cn/z-ai/static/logo.svg despite local public/logo.svg | CONFIRMED brand mismatch/external asset dependency. |
| Dead / duplicate / unused code | 1577 exact non-vendor duplicate-content groups; 58,758 vendored dependency files; multiple legacy snapshots | Do not delete or execute legacy copies blindly. No inbound static imports is not dead-code proof; entrypoints/scripts/framework discovery matter. |
| Memory leaks / performance / production optimizations | Standalone build, lazy routes and cached/public assets exist; earlier concurrent local build OOM was resolved by sequential retry | No long-running soak, heap profiling, load/concurrency test or all-route Core Web Vitals evidence; no zero-leak claim. |
| Documentation / missing files / missing folders | Existing deployment, runtime, environment, security and audit documentation plus all 20 uploaded specs inventoried | 20 attachments; 18 exact unique files. Older historical claims are not current verification. Derived requirement map retained. |

## Initial confirmed repair queue

1. Correct public social account targets using corroborated Bangladesh identities; retain exact platform order.
2. Remove the external unrelated favicon and use the existing ALO asset.
3. Repair backup failure propagation, credential handling and success verification; test failure and success paths without accessing customer data.
4. Execute the existing public header/footer through the built app on desktop/mobile, check required routes and portal separation, then patch actual failures.
5. Resolve confirmed unmatched API/link candidates after tracing rewrites; do not create dummy endpoints to make a static checker pass.
6. Preserve documented deployment ownership. Production health, provider credentials, running agents/jobs, real backup restore and host services remain external verification gates.

## Exact evidence files

- baseline-inventory.json — counts, every empty/LFS path, duplicate groups, marker locations, project manifests, required-path presence and cron declarations.
- baseline-source-checks.json — imports/assets, every declared route and unmatched literal candidates.
- attachment-requirements.json — SHA-256, exact duplicates, section/constraint extraction and declared-route comparisons for every attachment. This is a requirement discovery index, not proof the requirements are implemented.

No feature is marked complete merely because its files exist. Placeholder form attributes, safety refusals, historical documentation and mocked test fixtures will not be erased to manufacture a zero count.
