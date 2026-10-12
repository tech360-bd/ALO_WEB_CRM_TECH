# Synthetic catalogue datasets: inventory, containment and archive plan

Date: 2026-10-12. This covers owner decision 4.

The machine-readable manifest is `synthetic-catalogue-manifest.json`. It lists 542 entries, each with path, bytes, line count, SHA-256, header and category. It was generated read-only by `node scripts/archive-synthetic-catalogue.mjs --manifest` against HEAD `c5bfcbb`.

## 1. Inventory of tracked CSV and catalogue JSON files

| Category | Files | Size | Action |
| --- | --- | --- | --- |
| `synthetic_catalogue`: generated or templated catalogue data, or reports derived from it | **421** | **682.6 MiB** (715.7 MB) | Move to `fixtures/synthetic-catalogue/<original path>` |
| `keep_project_inventory`: code, route and API inventories | 43 | 2.3 MiB | Keep |
| `keep_audit_evidence`: `AUDIT/`, delivery-evidence reports | 15 | 2.0 MiB | Keep |
| `keep_project_document`: merge ledgers, audit maps, editorial calendar | 9 | 4.7 MiB | Keep |
| `keep_research_evidence`: `data/official-source-audit/` (real official-URL fetch and check results for Aston; unverified as catalogue facts, not fabricated, not read by runtime code) | 38 | 0.3 MiB | Keep |
| `keep_header_only_template`: header row only, no records (`conflict_log.csv`, `import_manifest.csv`, …) | 16 | 0 MiB | Keep |

The synthetic set by location:

| Location | Files | Size |
| --- | --- | --- |
| Repository root | 91 | 262.8 MiB |
| `alo-education-web-crm-final/` (nested archived copy of the repo) | 210 | 283.1 MiB |
| `docs/import-templates/` (the name says "templates", but they contain generated records) | 97 | 132.0 MiB |
| `data/` | 23 | 4.7 MiB |

The set includes the two "VERIFIED" master JSON files (`ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json`, ~51 MB, and its copy). Their content is generated. For example, `ALO_VERIFICATION_REPORT.csv` claims `VERIFIED_OFFICIAL` by an "AI Auditor", and 17,182 of 18,053 URLs in `ALO_URL_VERIFICATION_REPORT.csv` are `PLACEHOLDER_URL`. The evidence is in `UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md` and `catalogue-csv-quality.json`.

### Legitimate templates (kept, and how they differ)

| File | What it is |
| --- | --- |
| `docs/catalogue-import/catalogue-import-TEMPLATE.csv` | Header row only, the import contract. Usable as is. |
| `docs/catalogue-import/catalogue-import-EXAMPLE-SYNTHETIC.csv` | Labelled synthetic: `SAMPLE-` IDs and reserved example domains. The importer rejects every row, and a test checks this. |
| `GET /api/crm/course-import/template/course?sample=1` | Generated on request. Its sample rows are labelled `DO_NOT_UPLOAD_SAMPLE_DATA` with `example*` domains. |

Both `docs/catalogue-import` CSVs were previously **git-ignored** by the global `*.csv` rule, so they would have been left out of any commit. A negation `!docs/catalogue-import/*.csv` was added to `.gitignore`.

## 2. Every code path that read the synthetic data, and its state now

| Path | Before | Now |
| --- | --- | --- |
| `src/lib/ai-agents/supervisor-matcher.ts`: `supervisors.csv`, `courses.csv` | Read from the repository root | Read only `syntheticFixturePath(name)`. This is `null` unless `ALO_ALLOW_SYNTHETIC_AGENT_DATA=1` **and** `NODE_ENV !== 'production'`, and resolves only inside `fixtures/synthetic-catalogue/`. There is no fallback to the root. |
| `src/lib/ai-agents/international-course-agent.ts`: `universities.csv`, `course_intakes.csv`, `tuition_fees.csv` | Root | Same as above |
| `src/lib/ai-agents/campus-course-mapper.ts`: `campuses.csv`, `courses.csv` | Root | Same as above |
| `/api/agent/course-advisor`, the only HTTP consumer of these loaders | Served invented supervisors | `503` for every method; imports no loader |
| `prisma/seed-complete.ts`, the **default** seed (`prisma.config.ts`) | With `ALO_SEED_UNIVERSITY_CATALOGUE=1`, read root CSVs, **even in production** | Reads only `fixtures/synthetic-catalogue/`. The flag is ignored when `NODE_ENV=production`. Off by default. |
| `prisma/seed-university-data.ts` (destructive) | Root JSON, `upload/`, the legacy `/home/z/...` path, an env override, and root CSV fallbacks | Reads only `fixtures/synthetic-catalogue/` (its JSON-to-CSV fallback also stays inside that folder). No env override, and no `upload/`, legacy-path or root fallbacks. Refuses to run unless `ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED=1` on a non-production environment. |
| `POST /api/crm/seed-universities` | **ADMIN** could generate template catalogue rows, and with `{clear:true}` delete every university, course, intake, requirement, scholarship and **commission** row, with no transaction or audit | `503 CATALOGUE_SEEDER_DISABLED` before authentication or any database access, unless the synthetic opt-in is set on a non-production environment. Even then it is Super Admin only. |
| `scripts/build-delivery-packages-portable.sh` | Copied root catalogue CSVs into the "VPS private app" and "VPS database" zips, with "560 verified" claims | Copies none. It removes any `fixtures/` folder from the package and writes an honest `DATASET_STATUS.txt`. |
| `scripts/package-production-source.sh` | Packages `src prisma public scripts tests .github cron` plus named root files | No change needed: the root CSVs and `fixtures/` are not in its scope |
| Other `scripts/*.ts|py|mjs` generators and auditors | Developer tools that read or write the CSV sets | Not runtime paths. They will need path updates if anyone runs them after the move. |

Production can no longer reach the synthetic data through:

- **Default settings:** every loader returns empty data, and the default seed skips the catalogue.
- **Environment flags:** every opt-in is ignored when `NODE_ENV=production`, and `seed-university-data` has no path override.
- **AI-agent loaders:** they use the fixture archive only, behind the guard.
- **Seed scripts:** see the table above.
- **Fallback logic:** there are no root, `upload/` or legacy-path fallbacks left.

The tests are `tests/unit/course-finder-final-safety.test.ts` and `tests/unit/course-finder-remediation.test.ts`.

**Remaining caveat.** The guards rely on `NODE_ENV`. `next start` sets `production`, but a manual `prisma db seed` on the server might run with a different `NODE_ENV`. The seed flags are off by default, and today the fixture files do not exist at the new path, so even an opted-in seed would load nothing. After the move, the files exist at the fixture path. An operator who sets the opt-in flag on the server **and** runs with a non-production `NODE_ENV` could still load them. Never set those flags on Hostinger.

## 3. Physical move: prepared, not yet run

The move has not been run because of the size of the change:

- The synthetic set is ~683 MiB of tracked files.
- As an uncommitted working-tree change, a move appears as ~683 MiB deleted plus ~683 MiB added. That exceeds this session's change-capture limit, so the review state could be lost.
- As a committed `git mv` it is a rename that costs almost nothing in the repository.

**Prepared script:** `scripts/archive-synthetic-catalogue.mjs`.

| Command | Effect |
| --- | --- |
| (no flag) | Dry run; prints the plan and changes nothing. This is what was run. |
| `--manifest` | Also writes the manifest. This was run. |
| `--apply` | `git mv` of the 421 files into `fixtures/synthetic-catalogue/<original path>`. Never deletes. Refuses if any file to be moved has uncommitted changes or a destination already exists. |

Proposed sequence, to run only with commit approval:

1. Commit the reviewed code changes.
2. Run `node scripts/archive-synthetic-catalogue.mjs --apply`, then `git status` (expect 421 renames), then commit "Move synthetic catalogue datasets to fixtures/synthetic-catalogue".
3. Re-run the unit tests.

**Reversal:** `git revert` the move commit. History is preserved by `git mv`.

**Optional later step (owner decision):** take the archive out of the main branch entirely, for example into a separate archive repository or release asset. This only shrinks the size of fresh checkouts and does not change how safe the runtime is.
