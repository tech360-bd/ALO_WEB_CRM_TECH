# Legacy branch references — NOT runtime code

The user requested inclusion of all remote branches on 2026-10-17. Three remaining
branches were independent/stale applications rather than safe updates to the
current app. Their histories are reconciled while preserving their differing
source here instead of replacing working authentication, MySQL, or deployment
configuration.

**This is archival integration, not activation or certification of old features.**
Do not install dependencies, execute scripts, seed databases, copy old credentials,
or deploy these snapshots. Any feature port needs normal security review and tests.

## What is preserved

`manifest.json` records all 1,937 paths introduced/modified by the three unmerged
commits (451 + 739 + 747). The first two commits have parents already in main; their
unchanged inherited content stays in that history. The unrelated third branch is
inventoried in full.

Each entry is one of:

- `archived`: a differing text file saved with an additional `.txt` suffix or a
  binary asset saved with `.asset`. No symlinks or executable permissions are used.
  SHA-256 describes the archived bytes; original blob identity is recorded separately.
- `existing-identical-blob`: identical content already exists in the pinned baseline
  commit. `existingPath` identifies it **at that commit**, not necessarily in future
  working trees. No redundant copy is created. The reference may point into existing
  historical `imports/` snapshots; it is not a claim of live feature equivalence.
- `omitted-runtime-artifact`: one process-id file and six private-storage files are
  deliberately not republished. Only their Git object/path identities are inventoried.
- `object-reference-only` or `deleted-in-donor`: reserved explicit representations
  for symlinks/submodules or removals; never followed or automatically applied.

Reference text has normalized line endings and trailing whitespace. Potential
credential-bearing lines are conservatively replaced with a redaction notice. The manifest lists affected original line numbers. The full tracked-file
credential scan still covers this archive; no allowlist/exemption was added.
Old credentials in pre-existing Git history must still be considered compromised
and rotated by the owner; scrubbing this reference does not purge history.

## Isolation

- This folder is outside `src`, `public`, root Prisma migrations and root workflows.
- Text filenames are suffixed `.txt`, including package manifests, workflows,
  deployment scripts, PHP, migrations, tests, and TypeScript.
- Existing `imports/**` lint exclusion applies. Root TypeScript/Vitest include only
  the active source/test paths. The archive is explicitly excluded from Next.js
  standalone file tracing.
- No runtime module is wired to these references. Current MySQL/auth safeguards
  remain authoritative.

## Reproduction

With the full pinned history fetched, run:

```sh
python3 scripts/archive-legacy-branches.py
```

The script reads Git objects only and is deterministic. It never checks out donor
branches, executes their code, or accesses the network. Review the manifest and
run credential scanning before committing regenerated output.
