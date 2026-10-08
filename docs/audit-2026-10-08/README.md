# ALO Education repository audit — 2026-10-08

These inventories are source-audit evidence, **not a claim of live runtime success**.

## Scope and counts

- `route-inventory.csv`: 1,259 App Router entries — 379 pages and 880 API routes.
  - 85 page route patterns are public under `src/proxy.ts` (62 static, 23 dynamic).
  - 294 page route patterns are protected and expect login/401/403 according to layer.
- `link-map.csv`: 607 literal/template href declarations from `src/app` and `src/components`.
- `api-call-map.csv`: 864 direct `fetch('/api/...')` / template API calls.
- `button-inventory.csv`: 1,950 JSX `Button`/`button` declarations captured by the controlled static scan.
- `form-inventory.csv`: 45 form elements across 42 files.

`LiveRuntime=NOT VERIFIED` is intentional. The agent environment cannot run a production HTTP crawler against `aloeducation.com` (direct TLS egress is blocked), and the content fetch tool does not execute browser JavaScript or expose reliable response headers/final status. Runtime-untested entries must not be interpreted as PASS.

## Change control

| File/system | Current behavior | Problem/root cause | Proposed/applied change | Risk |
|---|---|---|---|---|
| `src/app/sitemap.ts` | Throw when any DB sitemap query fails | Production DB authentication outage makes sitemap empty/500 | Serve deduplicated static public routes, log sanitized code, add DB routes only when query succeeds | Dynamic URLs are absent during DB outage, but sitemap remains valid and truthful |
| Homepage CTA/destination controls | Valid links wrapped disabled buttons; UK fallback used obsolete slug | Visible controls could not be activated; inconsistent canonical slugs | Enable real links; use `/destinations/uk`; add external English promo | English destination remains externally blocked until its app is deployed |
| Navbar destinations | UK/Dubai aliases differed from sitemap/footer/data | Inconsistent destinations and client behavior | Use canonical `/uk` and `/dubai` | Existing external inbound aliases remain supported by dynamic route |
| Registration aliases | `/student/register`, `/partner/register` showed “Development in Progress” | Placeholder App Router pages shadowed real shared registration form | Render the real form with selected portal | Registration DB write remains blocked while production DB is down |
| Eligibility aliases | Two copies rendered the same component | Duplicate indexable URLs | Permanently redirect `/eligibility-checker` to canonical `/eligibility-check` | Legacy URL intentionally returns 308 |
| Admin quick actions | `/admin/students`, `/admin/partners`, `/admin/tasks` had no pages | Dashboard claimed “real destination” but linked to 404 | Add protected wrappers around existing CRM pages | Requires authenticated runtime verification |
| Admin/API calls | Users update and agent task calls targeted nonexistent contracts | Frontend/API route mismatch | Use collection PUT with `userId`; use `/api/agentos/tasks`; add RBAC metrics endpoint | Requires DB/authenticated runtime verification |
| Marketing dry runs | Email/SMS prepare buttons called nonexistent APIs; consent GET was absent | Incomplete API linkage | Add RBAC, consent-counted dry-run endpoints; no delivery or fake success | Live delivery remains deliberately approval/provider dependent |
| Employee social actions | GET anchors pointed to missing connect/request routes; disconnect used GET | Links could not perform their labelled operation | Explicitly disable unimplemented OAuth/request and implement confirmed DELETE disconnect | Provider-side revocation remains NOT VERIFIED |
| Public country calculator | Silently POSTed to nonexistent `/api/student/timeline` | No authenticated identity association and no route | Remove unsafe dead write | Anonymous calculation is not persisted |
| Pagination | `href="#"` with JS interception | Dead fallback links and poor accessibility | Supply meaningful page-query hrefs while preserving client pagination | Query state needs browser verification |

## Known live blockers at audit time

1. `https://aloeducation.com/api/health` reports `status=degraded`, `database.connected=false`.
2. Production MySQL rejects credentials for `aloeduca_ALO_final_web_crm`.
3. Current deployed sitemap is empty HTML while the old code throws on DB failure.
4. `https://english.aloeducation.com` is the Hostinger default page, not the exam platform.
5. PR/branch changes are not deployed; Hostinger controls production deployment.
6. GitHub Actions jobs are failing before runner allocation (`runner_id=0`, zero steps), so CI is BLOCKED, not passed.
7. Prisma engine downloads are blocked in the agent sandbox; `prisma validate`, `prisma generate`, and `npm run build` cannot complete locally.
