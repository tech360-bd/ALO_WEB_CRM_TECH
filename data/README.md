# Catalogue evidence warning — 2026-10-10

**Do not bulk-import or publish the legacy CSV/JSON files as verified facts.**
They are retained for provenance review, not approved for student advice.

The read-only audit found 400 university rows with template faculty structure,
471 course rows with generic modules/descriptions and constructed curriculum
URLs, and 823 future-intake rows whose own evidence says the 2027 calendar was
not published. Status labels such as `VERIFIED_OFFICIAL` do not prove individual
fields. The older `docs/import-templates/package-verified` has 17,653 course rows
with the same template patterns; its name does not establish verification.

Run `python3 scripts/audit-local-catalog.py` to reproduce CSV row counts and
pattern flags. Results: `AUDIT/local-catalog-quality-2026-10-10.json`.
This script never accesses the network or database and never changes datasets.
A flag indicates review is required; absence of a flag is not verification.

The misleading `scripts/run-real-data-audit.ts` exporter is disabled. Do not run
legacy/exported copies of that utility either. Existing packages remain unchanged
for forensic review; no live database quarantine/migration was executed.

Before import/publish, each claimed field needs the exact official page, entity
match, dated evidence, reviewer decision and applicable fee/intake year. Unknown
facts remain unknown. Homepage links, competitor marketing counts and a fetched
HTML page are not complete university/course data. Use the existing official
crawler/review pipeline only after confirming source access and usage permission.
