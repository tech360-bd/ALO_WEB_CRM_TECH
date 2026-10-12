# Synthetic catalogue fixtures: NOT production data

This folder is the non-production archive for **generated or templated** university and course datasets: CSV and JSON files with universities, courses, intakes, fees, requirements, scholarships, rankings, supervisors, campuses and the reports derived from them.

- None of these records are verified, even where a file or column says "VERIFIED". `supervisors.csv` contains invented people and e-mail addresses.
- Production code never reads this folder.
- The legacy AI-agent loaders and the development seed scripts may read it only when a developer sets `ALO_ALLOW_SYNTHETIC_AGENT_DATA=1`, `ALO_SEED_UNIVERSITY_CATALOGUE=1` or `ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED=1` on a **non-production** environment. In production those flags are ignored.
- Never set those flags on Hostinger, never import these files through `/admin/data-import`, and never package them for deployment.
- Real catalogue data enters only through the reviewed CSV import, then approval, Super Admin apply and separate verification. See `docs/catalogue-import/README.md`.

The files move here with `node scripts/archive-synthetic-catalogue.mjs --apply`, which uses `git mv` and keeps history. The inventory and reasons are in `AUDIT/course-finder-2026-10-12/SYNTHETIC-CATALOGUE-ARCHIVE.md` and `synthetic-catalogue-manifest.json`.

## Running a synthetic generator (2026-10-12)

Guarded generators write only under an explicit non-production directory:

```bash
ALO_SYNTHETIC_OUTPUT_DIR=staging/synthetic/my-run python3 scripts/regenerate_csvs_every_month.py
```

Without `ALO_SYNTHETIC_OUTPUT_DIR`, with a directory outside `fixtures/synthetic-catalogue/` or `staging/synthetic/`, or with `NODE_ENV=production`, they exit 1 before writing anything. Their output is synthetic and unverified. Disabled outright: `generate_full_dataset.py`, `generate_missing_universities_and_intakes.py`, `add_courses.py`, `add_universities.py`, `run-production-real-collection.ts`, `generate-final-packages.ts`, and the archived copies under `alo-education-web-crm-final/scripts/`.
