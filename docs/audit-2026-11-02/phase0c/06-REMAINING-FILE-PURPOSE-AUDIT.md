# Phase 0C · 06 — Remaining File-Purpose Audit

**Generated:** 2026-11-02 · **Script:** `enrich-inventory.py` (read-only) ·
**Data:** `inventory-enriched.csv` (9,789 rows × 15 columns)
**Requirement:** every first-party file needs a meaningful purpose **or** a justified classification,
including non-code data and assets, with SHA-256 and the dependency graph preserved.

---

## 1. Result: 0 files without a purpose, and an honest account of how

| Measure | Before Phase 0C | After |
|---|---:|---:|
| Rows in inventory | 9,789 | 9,789 |
| Rows with a purpose | 5,075 | **9,789** |
| Rows without a purpose | 4,714 | **0** |

Getting to zero did **not** mean inventing 4,714 descriptions. Each row now also carries
`purpose_basis`, so the strength of every purpose is visible:

| Basis | Rows | What it means |
|---|---:|---|
| `documented` | 3,145 | a comment block, docstring or markdown heading in the file itself |
| `structural` | 4,482 | derived from framework role and location (route path, HTTP methods, component area, module exports) |
| `type_only` | 2,162 | a file-type statement only — binaries, fonts, lockfiles, `.pyc` |

Within `src/` (2,704 files) the split is **524 documented / 2,171 structural / 9 type_only**. Within
first-party files overall (5,679, excluding snapshot and nested-copy trees) it is
**1,034 documented / 4,101 structural / 544 type_only**.

**Stated plainly:** only 1,034 first-party files describe themselves. The other 4,645 have a purpose
this audit *inferred* from where they sit and what they export. That is a meaningful classification,
but it is not the same as documentation — and a future audit should not confuse the two.

## 2. Why the earlier count was 4,714 (and drifted to 4,942)

The original enrichment assigned a purpose **only** to `src/`+`tests/`+`scripts/` code and to
documentation files, then `continue`d for four whole classes:

```python
if ext in BIN_EXT:   ... ; continue   # 434 binaries
if ext in DATA_EXT:  ... ; continue   # 2,014 data files (only JSON/CSV got a header line)
if CODE_EXT and not in_project: ... continue   # 2,266 snapshot + 661 nested copies
```

So snapshot code, nested copies and binaries were dispositioned but never *described*. After the
non-code-under-`src/` reclassification the figure read 4,942; the correct reading is that both numbers
were artefacts of early exits, not of missing information.

## 3. How a purpose is now derived (the ladder)

Each row is resolved by the first rule that applies, and the rule used is recorded:

1. **Documented** — leading block comment, `//` header, Python docstring, or markdown heading + lede.
2. **Structural**, by framework role:
   * `src/app/**/route.ts` → `Next.js API route — handles GET/POST for /api/x` (methods read from the
     exported symbols, not guessed)
   * `src/app/**/page.tsx` → `Next.js page component — route /x`; `layout.tsx` → layout for a subtree;
     `loading|error|not-found|template|default` → route boundary
   * `src/components/<area>/**` → `React component in the <area> component area (exports: …)`
   * `src/lib|server|services/**` → `Application library module (<area>) — exports: …`
   * `src/hooks`, `src/types`, `*.d.ts`, `tests/`, `scripts/`, `prisma/`, `public/`, `deploy-build/`
   * snapshot copies → `Inactive imported-snapshot copy of src/<path> — <purpose>`
3. **Type-only** — `WebP image (352,148 bytes) — static/media asset, not application logic`;
   `SQL script — schema migration, seed or ad-hoc query`; `.env.example` → `Example environment-variable
   template — configuration reference, not a live secret file`.

Route methods are read from the source (`export async function GET`…), so a route that exports only
`POST` is described as handling POST. Where no method is exported, the purpose says
`no exported HTTP method` rather than assuming one.

## 4. Dispositions (9,789 files, sums exactly)

| Disposition | Files | Meaning |
|---|---:|---|
| `stale_snapshot` | 2,266 | `imports/**` copies of a past project state |
| `data` | 2,014 | CSV/JSON/SQL datasets and exports |
| `entry_point` | 1,575 | Next.js route/layout/proxy — reachable by URL |
| `peripheral` | 1,183 | outside the app tree and outside a known snapshot; not imported by `src/` |
| `active` | 866 | imported by at least one non-test first-party module |
| `nested_copy` | 661 | second copy of project data/code (`alo-education-web-crm-final/**`) |
| `documentation` | 528 | reports, audit documents, READMEs |
| `binary` | 434 | images, fonts, archives, databases |
| `orphan` | 226 | no first-party importer |
| `test_only` | **32** | imported **only** by `tests/` or `scripts/` |
| `asset` | 4 | non-code files shipped with the app |
| `documentation` (in `src/`) | 1 | a `.md` inside the app tree |

**`src/` totals 2,704:** 1,575 entry points + 866 active + 226 orphan + 32 test-only + 4 assets + 1 doc.

### The 226 and the 32 are different problems

* **226 orphans** — nothing imports them, in the app or in tests. That is not proof they are dead (a
  Next.js convention file, a dynamically-imported module, or a `page.tsx` reached by URL can look
  orphaned), which is exactly why they were reviewed separately and none was deleted.
* **32 test-only** — imported by test or script code only. They *are* executed, just not by the app
  bundle. Deleting one removes test coverage rather than dead weight.

Concentrations among the 226: `src/components/alo` 100, `src/components/ui` 20,
`src/components/communication` 13, `src/components/course-finder` 8, `src/lib/video-engine` 7,
`src/components/website` 5. The `components/alo` cluster is the same generation as the snapshot
`components/platform` set (report 05), which supports the "superseded UI layer" reading — and
`src/components/course-finder/eligibility-checker.tsx` is an orphan whose only purpose is to call an
endpoint that returns 401 (report 07 §4).

**The dependency graph is intact:** 8,509 internal edges, `imports_internal` and `imported_by` on every
code row, SHA-256 on every row. Importers inside `imports/**` and `alo-education-web-crm-final/**` are
deliberately excluded from reverse edges — an `@/` import inside a snapshot resolves against *that*
copy, and counting it inflated the "active" count by 82 files in an earlier run of this script.

## 5. Non-code files: classified, not ignored

| Class | Files | Classification given |
|---|---:|---|
| Images (webp/png/jpg/avif/gif) | ~424 | type + byte size + "static/media asset, not application logic" |
| Fonts (woff2/woff/ttf) | ~14 | type + size |
| SQL | 78 | "schema migration, seed, or ad-hoc query; execution scope in datasets.csv" |
| `.pyc` | 22 | "compiled Python bytecode cache" |
| Lockfiles | 18 | "dependency lockfile" |
| Shell | 32 | "operational/automation command sequence" |
| `.env.example` / templates | — | "configuration reference, not a live secret file" |
| HTML | 16 | "static HTML document — served page or generated report" |

SQL is the one class where a type-level purpose is genuinely insufficient for a *safety* judgement: 78
SQL scripts exist and `datasets.csv` records their scope, but nothing in Phase 0C executed or validated
them. They must not be run against any database without the non-production identity check in report 08.

## 6. Limitations

1. **Structural purposes are inferences.** They are accurate about framework role; they say nothing
   about whether the code is correct, used, or wanted.
2. **2,162 rows have only a type-level purpose**, dominated by 352 WebP images and 78 SQL files.
3. **`peripheral` (1,183) is a weak bucket** — it means "not imported by `src/` and not obviously a
   snapshot". It is a classification, not a verdict.
4. **`documented` does not mean documented well.** An agent-framework `/api/ai-workforce/*` handler
   with a 20-line header comment counts the same as a one-line `// TODO` file.
5. **Nothing was deleted, and no disposition should be read as approval to delete.** The 226 and the 32
   are inputs to a decision, not the decision.
