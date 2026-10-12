# Reference and catalog repair evidence

Scope: aloeducation.com, existing Hostinger managed Node.js hosting only. No DNS, other websites, production database reset, demo seeds or record deletion.

## Confirmed defects repaired

- University/course batch import previously inferred VERIFIED from presence of source_url and manufactured lastVerifiedAt. New imports remain active, draft, NEEDS_REVIEW, with no verification timestamp until actual review.
- Missing university campus/type and course degree/level/duration/delivery/intake/currency no longer receive guessed values. Fee rows require recorded amount, currency, intake year and month, and remain NEEDS_REVIEW.
- Course institution matching and title duplicate lookup now use exact identifiers/names instead of substring matching.
- Batch record, fee and audit writes now share one Prisma transaction. Audit/fee errors no longer disappear behind a success response. Batch size is capped at 500; preview remains read-only.
- Historical run-production-real-collection.ts is disabled before Prisma client construction. It previously rejected every non-Aston course, assumed Aston verification, manufactured university URLs, campuses, faculties, fees and national metadata. This script was not run.

- Aston heuristic course/profile extraction no longer automatically sets VERIFIED or lastVerified timestamps. Extraction time and review warnings are retained separately.
- Services directory removes the unsupported blanket Verified content badge and derives its service count from returned data.

## Read-only official discovery

scripts/collect-official-source-evidence.py uses the explicit destination registry and produces evidence hashes, check timestamps, requested/final URLs, HTTP status, title and candidate links. It performs no database operations and never marks discovered data VERIFIED or published. It is a directory-discovery starting point, not a generic full course parser. It does not claim complete country coverage or acceptance criteria coverage. Single-page directories may need pagination or institution-specific adapters.

Initial registry covers 17 destinations: UK, US, Canada, Australia, Ireland, New Zealand, UAE, Germany, Netherlands, France, Italy, Malta, Cyprus, South Korea, Denmark, Sweden and Finland. Initial run fetched 11 directories and discovered 1,512 candidate links including navigation and review-required pages. Correcting moved directory URLs subsequently fetched 15 of 17 sources with 1,522 candidate links. Australia and Cyprus are HTTP 403 from this collection environment; no access bypass was attempted. No course fees, intakes or requirements have been imported or published from this run.

## Reference inspection bounds

Authenticated GitHub access retrieved metadata/READMEs for all 20 requested repositories. Six ALO reference repositories were cloned read-only and inventoried (2,426 source files). Existing ALO catalog arrays contain hardcoded rankings, tuition ranges, acceptance rates and visa statements; these are not authoritative import data. Public TCL and StudyIn pages were read for course search, shortlists, applications, counseling and destination navigation patterns. Those concepts already have extensive ALO source implementations; feature presence does not establish live workflow acceptance. Third-party CRM code was not imported without review of suitability, licensing and behavior. The thu-ml/CRM repository is a machine-learning research project and needs relevance review before being treated as a customer relationship management product.

## Verification

- Full TypeScript check passed.
- Production build passed; standalone manifests/assets verified.
- 126 unit files, 1,356 tests passed, including six new catalog import regression checks and an automatic-verification regression check.
- No production schema migration or data mutation was required for these changes.
- Hostinger release and live endpoint results must be recorded after the exact new commit completes deployment.

## Still incomplete

The full supplied documents, every external demo/reference and all private staff/student/partner workflows are not fully accepted. A complete international university/course catalog is not yet collected. Directory discoveries require individual source checks, parser adapters, official field evidence, deduplication and review before publication. Real account acceptance and provider delivery remain unverified. No full-system completion claim is supported.
