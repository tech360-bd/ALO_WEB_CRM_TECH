#!/usr/bin/env python3
"""
PHASE 0B enrichment — read-only.

Upgrades inventory.csv (path/area/role/ext/bytes/lines/sha256/tracked) to a full
per-file audit record by adding, for every first-party and data/document file:

  purpose          first documentation block / heading of the file
  exports          exported symbols (code files)
  imports_internal resolved first-party dependencies (code files)
  imported_by      reverse edges (who depends on this file)
  disposition      active | entry_point | orphan | duplicate | stale_snapshot |
                   nested_copy | generated | data | documentation | binary
  audit_note       why that disposition was chosen

Also emits:
  snapshot-comparison.json   per-file comparison of src/ against every imported
                             or nested copy in the repository
  doc-claims.json            strong completeness claims found in documents,
                             for cross-checking against measured reality

Output: inventory-enriched.csv, snapshot-comparison.json, doc-claims.json
"""
import csv, hashlib, json, os, re, sys
from collections import Counter, defaultdict

ROOT = "/home/user/ALO_WEB_CRM_TECH"
AUD = os.path.join(ROOT, "docs/audit-2026-11-02")
CODE_EXT = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".cts", ".mts", ".py"}
DOC_EXT = {".md", ".mdx", ".txt"}
DATA_EXT = {".csv", ".json", ".sql", ".xlsx", ".xls", ".tsv", ".ndjson"}
BIN_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".ttf",
           ".eot", ".mp4", ".pdf", ".zip", ".gz", ".db", ".sqlite", ".bin", ".wasm", ".avif", ".bmp"}

IMPORT_RE = re.compile(
    r"""(?:^|\n)\s*(?:import|export)\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]"""
    r"""|\brequire\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|\bimport\(\s*['"]([^'"]+)['"]\s*\)""", re.M)
EXPORT_RE = re.compile(
    r"^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)"
    r"|^export\s+(?:type|interface|enum)\s+(\w+)"
    r"|^export\s*\{\s*([^}]+)\}", re.M)


def read_text(path, size):
    if size > 4 * 1024 * 1024:
        return ""
    try:
        return open(path, encoding="utf-8", errors="replace").read()
    except Exception:
        return ""


def purpose_of(text, ext):
    """First documentation block: header comment, docstring, or markdown heading+lede."""
    if not text:
        return ""
    head = text[:6000]
    if ext in {".md", ".mdx", ".txt"}:
        lines = [l.strip() for l in head.splitlines()]
        title = next((l.lstrip("# ").strip() for l in lines if l.startswith("#")), "")
        body = " ".join(l for l in lines if l and not l.startswith("#") and not l.startswith("|"))
        if title:
            return (title + " — " + body)[:240]
        return body[:240]
    # code: leading block comment or line comments, ignoring directives
    m = re.search(r"\A\s*/\*\*?(.*?)\*/", head, re.S)
    if m:
        block = " ".join(x.strip(" *\t") for x in m.group(1).splitlines() if x.strip(" *\t"))
        if block:
            return block[:240]
    lines = head.splitlines()
    collected = []
    for line in lines:
        s = line.strip()
        if s.startswith("//"):
            s = s.lstrip("/").strip()
            if s and not s.startswith("@ts-") and not s.startswith("---"):
                collected.append(s)
            if len(" ".join(collected)) > 200:
                break
        elif s.startswith(("'use client'", '"use client"', "'use server'", "#!/")):
            continue
        elif s.startswith(("import ", "export ", "const ", "let ", "type ", "interface ")):
            break
    if collected:
        return " ".join(collected)[:240]
    # fall back to the first docstring in python / first export name
    m = re.search(r'"""(.*?)"""', head, re.S)
    if m:
        return " ".join(m.group(1).split())[:240]
    return ""


# ── purpose derivation ladder: documented → structural → type_only ─────────
ROUTE_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS")


def structural_purpose(path, ext, text="", exports=""):
    """Derive a purpose from framework role and location. Never guesses intent."""
    base = os.path.basename(path)
    penv = ext.lstrip(".")
    if path.startswith("prisma/"):
        if "/migrations/" in path:
            return "Prisma SQL migration applied to the database schema"
        if base == "schema.prisma":
            return "Prisma schema — defines every database model, field and relation"
        return "Prisma/database artefact"
    if path.startswith("src/app/"):
        seg = path[len("src/app/"):]
        route = "/" + re.sub(r"/(page|layout|route|loading|error|not-found|template|default|global-error)\.\w+$", "", seg)
        route = route.replace("/(", "/").rstrip("/") or "/"
        parent = os.path.dirname(seg)
        if base == "route.ts":
            methods = [m for m in ROUTE_METHODS if re.search(r"export\s+(?:async\s+)?function\s+" + m + r"\b", text)]
            host = " (directory parent: %s)" % parent if parent else ""
            return "Next.js API route — handles %s for %s" % (("/".join(methods) or "no exported HTTP method"), route)
        if base == "page.tsx":
            return "Next.js page component — route %s" % route
        if base == "layout.tsx":
            return "Next.js layout — shared chrome for route subtree %s" % route
        if base in ("loading.tsx", "error.tsx", "not-found.tsx", "template.tsx", "default.tsx"):
            return "Next.js %s boundary for route %s" % (base[:-4], route)
    if path.startswith("src/components/"):
        area = path[len("src/components/"):].split("/")[0]
        return "React component in the %s component area%s" % (area, (" (exports: " + exports + ")") if exports else "")
    if path.startswith("src/lib/") or path.startswith("src/server/") or path.startswith("src/services/"):
        area = path.split("/")[2] if len(path.split("/")) > 3 else ""
        return "Application library module (%s)%s" % (area or "src", (" — exports: " + exports) if exports else "")
    if path.startswith("src/hooks/"):
        return "React hook module%s" % ((" — exports: " + exports) if exports else "")
    if path.startswith("src/types/") or base.endswith(".d.ts"):
        return "TypeScript type/declaration module%s" % ((" — exports: " + exports) if exports else "")
    if path.startswith(("tests/", "src/**/__tests__/")):
        return "Automated test suite%s" % ((" — subject: " + os.path.basename(path).replace(".test", "").replace(".spec", "")) if ext in (".ts", ".tsx") else "")
    if path.startswith("scripts/"):
        return "Operational/maintenance script (%s)" % penv
    if path.startswith(("deploy-build/", "deploy/", "infra/")):
        return "Deployment/build artefact or configuration (%s)" % penv
    if path.startswith("public/"):
        return "Publicly served static asset copied verbatim into the web root"
    return ""


SPECIAL_NAMES = {
    ".env": "Environment-variable definition (keys only; values must never be committed or published)",
    ".env.example": "Example environment-variable template — documents required configuration keys",
    ".dockerignore": "Docker build-context exclusion list",
    ".gitignore": "Git tracking exclusion list",
    ".nvmrc": "Node.js runtime version pin",
    ".npmrc": "npm registry/install configuration",
    ".editorconfig": "Editor formatting configuration",
}


def type_only_purpose(path, ext, size):
    base = os.path.basename(path)
    if base in SPECIAL_NAMES:
        return "%s (%s bytes)" % (SPECIAL_NAMES[base], f"{size:,}")
    if base.startswith(".env") and ("example" in base or "template" in base):
        return "Example environment-variable template (%s bytes) — configuration reference, not a live secret file" % f"{size:,}"
    if ext == ".sql":
        return "SQL script (%s bytes) — schema migration, seed, or ad-hoc query; execution scope recorded in datasets.csv" % f"{size:,}"
    if ext == ".sh":
        return "Shell script (%s bytes) — operational/automation command sequence" % f"{size:,}"
    if ext == ".html":
        return "Static HTML document (%s bytes) — served page or generated report" % f"{size:,}"
    if ext in (".mjs", ".cjs", ".js"):
        return "JavaScript module outside the app tree (%s bytes) — tooling or standalone script" % f"{size:,}"
    if ext == ".py":
        return "Python script/module (%s bytes) — tooling or analysis code, not part of the Next.js runtime" % f"{size:,}"
    kind = {
        ".webp": "WebP image", ".png": "PNG image", ".jpg": "JPEG image", ".jpeg": "JPEG image",
        ".gif": "GIF image", ".avif": "AVIF image", ".bmp": "BMP image", ".svg": "SVG vector image",
        ".ico": "favicon icon", ".woff": "WOFF font", ".woff2": "WOFF2 font", ".ttf": "TrueType font",
        ".eot": "EOT font", ".mp4": "MP4 video", ".pdf": "PDF document", ".zip": "ZIP archive",
        ".gz": "gzipped archive", ".db": "SQLite database file", ".sqlite": "SQLite database file",
        ".bin": "binary blob", ".wasm": "WebAssembly module", ".pyc": "compiled Python bytecode cache",
        ".lock": "dependency lockfile", ".map": "source map",
    }.get(ext)
    if kind:
        return "%s (%s bytes) — static/media or tooling asset, not executable application logic" % (kind, f"{size:,}")
    return "%s file (%s bytes) — no in-file documentation; classification is type-level only" % ((ext.lstrip(".").upper() or "Unclassified"), f"{size:,}")


def exports_of(text):
    names = []
    for m in EXPORT_RE.finditer(text):
        if m.group(1):
            names.append(m.group(1))
        elif m.group(2):
            names.append(m.group(2))
        elif m.group(3):
            names.extend(n.strip().split(" as ")[-1].strip() for n in m.group(3).split(",") if n.strip())
    seen, out = set(), []
    for n in names:
        if n and n not in seen:
            seen.add(n); out.append(n)
    return out[:12]


def resolve(spec, from_rel):
    """Resolve a first-party specifier to a repo-relative path (or None)."""
    if spec.startswith("@/"):
        base = os.path.join(ROOT, "src", spec[2:])
    elif spec.startswith("."):
        base = os.path.normpath(os.path.join(ROOT, os.path.dirname(from_rel), spec))
    else:
        return None
    for cand in (base, base + ".ts", base + ".tsx", base + ".js", base + ".jsx",
                 os.path.join(base, "index.ts"), os.path.join(base, "index.tsx"),
                 os.path.join(base, "index.js")):
        if os.path.isfile(cand):
            return os.path.relpath(cand, ROOT)
    return None


# ── load base inventory ────────────────────────────────────────────────────
with open(os.path.join(AUD, "inventory.csv"), newline="", encoding="utf-8") as fh:
    rows = list(csv.DictReader(fh))

src_root = os.path.join(ROOT, "src")
src_hashes = {}
hash_groups = defaultdict(list)
for r in rows:
    if r["sha256"]:
        hash_groups[r["sha256"]].append(r["path"])

# ── pass 1: purpose / exports / dependencies ──────────────────────────────
info = {}
for r in rows:
    p = os.path.join(ROOT, r["path"])
    ext = "." + r["ext"] if r["ext"] else ""
    rec = {"purpose": "", "purpose_basis": "", "exports": "", "imports_internal": "", "imported_by": "",
           "disposition": "", "audit_note": ""}
    if ext in BIN_EXT:
        rec["disposition"] = "binary"
        rec["audit_note"] = "binary asset — checksummed and sized, not text-inspected"
        rec["purpose"] = type_only_purpose(r["path"], ext, int(r["bytes"] or 0))
        rec["purpose_basis"] = "type_only"
        info[r["path"]] = rec
        continue
    if ext in DATA_EXT:
        rec["disposition"] = "data"
        rec["audit_note"] = "dataset — row/key/duplicate analysis in datasets.csv"
        if ext == ".json":
            try:
                head = read_text(p, int(r["bytes"]))[:600]
                keys = re.findall(r'"(\w+)"\s*:', head)
                rec["purpose"] = "JSON data; top-level keys: " + ", ".join(dict.fromkeys(keys))[:180]
            except Exception:
                pass


        elif ext == ".csv":
            try:
                with open(p, encoding="utf-8", errors="replace") as fh:
                    header = fh.readline().strip()[:200]
                rec["purpose"] = "CSV dataset; header: " + header
            except Exception:
                pass
        if not rec["purpose_basis"]:
            rec["purpose_basis"] = "structural" if rec["purpose"] else ""
        if not rec["purpose"]:
            rec["purpose"] = type_only_purpose(r["path"], ext, int(r["bytes"] or 0))
            rec["purpose_basis"] = "type_only"
        info[r["path"]] = rec
        continue
    text = read_text(p, int(r["bytes"]))
    in_project = r["path"].startswith(("src/", "tests/", "scripts/"))
    if ext in CODE_EXT and not in_project:
        # An import inside an imported snapshot or nested copy resolves against
        # THAT copy, not against src/. Resolving it here would create fake edges.
        rec["disposition"] = "stale_snapshot" if r["path"].startswith("imports/") else "nested_copy"
        rec["audit_note"] = "copy of project code outside the running app; dependencies not traced into src/"
        rec["exports"] = ", ".join(exports_of(text))
        rel = r["path"].split("/src/", 1)[1] if "/src/" in r["path"] else r["path"]
        p = purpose_of(text, ext) or structural_purpose(rel, ext, text, rec["exports"])
        if p:
            rec["purpose"] = "Inactive %s copy of %s — %s" % (
                "imported-snapshot" if r["path"].startswith("imports/") else "nested-copy",
                ("src/" + rel) if "/src/" in r["path"] else rel, p)
            rec["purpose_basis"] = "documented" if purpose_of(text, ext) else "structural"
        else:
            rec["purpose"] = "Inactive %s copy — " % (
                "imported-snapshot" if r["path"].startswith("imports/") else "nested-copy"
            ) + type_only_purpose(r["path"], ext, int(r["bytes"] or 0))
            rec["purpose_basis"] = "type_only"
        info[r["path"]] = rec
        continue
    if ext in CODE_EXT:
        rec["purpose"] = purpose_of(text, ext)
        rec["purpose_basis"] = "documented" if rec["purpose"] else ""
        rec["exports"] = ", ".join(exports_of(text))
        deps = []
        for m in IMPORT_RE.finditer(text):
            spec = m.group(1) or m.group(2) or m.group(3)
            if not spec:
                continue
            res = resolve(spec, r["path"])
            if res and res != r["path"]:
                deps.append(res)
        rec["imports_internal"] = ", ".join(dict.fromkeys(deps))
    elif ext in DOC_EXT:
        rec["purpose"] = purpose_of(text, ext)
        rec["purpose_basis"] = "documented" if rec["purpose"] else ""
    else:
        rec["purpose"] = purpose_of(text, ext)
        rec["purpose_basis"] = "documented" if rec["purpose"] else ""

    if not rec["purpose"]:
        sp = structural_purpose(r["path"], ext, text, rec["exports"])
        if sp:
            rec["purpose"] = sp
            rec["purpose_basis"] = "structural"
        else:
            rec["purpose"] = type_only_purpose(r["path"], ext, int(r["bytes"] or 0))
            rec["purpose_basis"] = "type_only"
    info[r["path"]] = rec

# ── pass 2: reverse edges + disposition ───────────────────────────────────
imported_by = defaultdict(set)
for path, rec in info.items():
    if path.startswith(("imports/", "alo-education-web-crm-final/")):
        continue  # importer must live in the running project to count
    if rec["imports_internal"]:
        for dep in rec["imports_internal"].split(", "):
            imported_by[dep].add(path)

ENTRY_RE = re.compile(r"^src/app/.*(page|layout|route|template|loading|error|not-found|global-error|default)\.(tsx|ts|jsx|js)$")
for r in rows:
    path, rec = r["path"], info[r["path"]]
    if not path.startswith("src/"):
        if not rec["disposition"]:
            if path.startswith(("imports/",)):
                rec["disposition"] = "stale_snapshot"
                rec["audit_note"] = "imported copy of a project state; not part of the running app"
            elif path.startswith("alo-education-web-crm-final/"):
                rec["disposition"] = "nested_copy"
                rec["audit_note"] = "full second copy of project data/docs inside the repo"
            elif path.startswith(("docs/", "AUDIT", "audit/", "documentation/", "reports/",
                                  "deliverables/", "evidence/", "agent-ctx/", "delivery-evidence")):
                rec["disposition"] = "documentation"
                rec["audit_note"] = "report/audit document, not executable code"
            elif r["path"].count("/") == 0 and r["ext"] in {"csv"}:
                rec["disposition"] = "generated"
                rec["audit_note"] = "root dataset — analysed in datasets.csv; synthetic vs verified in report 3"
            else:
                rec["disposition"] = "peripheral"
                rec["audit_note"] = "outside the app tree and outside a known snapshot/copy — not imported by src/"
        rec["imported_by"] = ", ".join(sorted(imported_by.get(path, []))[:6])
        continue

    deps = imported_by.get(path, set())
    ext_dot = "." + r["ext"] if r["ext"] else ""
    if ext_dot not in CODE_EXT and not (ENTRY_RE.match(path) or path in {"src/proxy.ts", "src/middleware.ts"}):
        rec["disposition"] = "asset" if ext_dot in BIN_EXT or ext_dot in {".css", ".scss", ".svg", ".png", ".webp"} else "documentation"
        rec["audit_note"] = "non-code file shipped with the app"
        continue
    if ENTRY_RE.match(path) or path in {"src/proxy.ts", "src/middleware.ts"}:
        rec["disposition"] = "entry_point"
        rec["audit_note"] = "Next.js route/layout or proxy — reachable by URL"
    elif deps and all(d.startswith(("tests/", "scripts/")) for d in deps):
        rec["disposition"] = "test_only"
        rec["audit_note"] = ("imported only by test/script code (%d) — reachable in CI, "
                             "not from the shipped app bundle; reviewed separately from dead code" % len(deps))
    elif deps:
        rec["disposition"] = "active"
        rec["audit_note"] = f"imported by {len(deps)} module(s)"
    else:
        rec["disposition"] = "orphan"
        rec["audit_note"] = "no first-party importer found"
    if len(hash_groups.get(r["sha256"], [])) > 1:
        others = [x for x in hash_groups[r["sha256"]] if x != path]
        rec["audit_note"] += f"; byte-identical copy of {others[0]}"
    rec["imported_by"] = ", ".join(sorted(deps)[:6])

# ── write enriched inventory ──────────────────────────────────────────────
fields = ["path", "area", "role", "ext", "bytes", "lines", "sha256", "tracked",
          "disposition", "purpose", "purpose_basis", "exports", "imports_internal", "imported_by", "audit_note"]
with open(os.path.join(AUD, "inventory-enriched.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        rec = dict(r)
        rec.update(info[r["path"]])
        w.writerow(rec)

disp = Counter(info[r["path"]]["disposition"] or "active" for r in rows)
src_disp = Counter(info[r["path"]]["disposition"] for r in rows if r["path"].startswith("src/"))

# ── snapshot comparison: src/ vs every nested copy ────────────────────────
copies = {
    "imports/alo-education-full/src": "imported snapshot (alo-education-full)",
    "imports/alo-education-source/src": "imported snapshot (alo-education-source)",
}
snap = {}
for base, label in copies.items():
    if not os.path.isdir(os.path.join(ROOT, base)):
        continue
    same = differ = unique = 0
    differs, uniques = [], []
    for dp, dn, fn in os.walk(os.path.join(ROOT, base)):
        dn[:] = [d for d in dn if d not in {"node_modules", ".next"}]
        for f in fn:
            rel = os.path.relpath(os.path.join(dp, f), os.path.join(ROOT, base))
            cur = os.path.join(ROOT, "src", rel)
            if not os.path.isfile(cur):
                unique += 1
                if len(uniques) < 40:
                    uniques.append(rel)
                continue
            a = hashlib.sha256(open(os.path.join(dp, f), "rb").read()).hexdigest()
            b = hashlib.sha256(open(cur, "rb").read()).hexdigest()
            if a == b:
                same += 1
            else:
                differ += 1
                if len(differs) < 40:
                    differs.append(rel)
    snap[label] = {"base": base, "identicalToCurrent": same, "differsFromCurrent": differ,
                   "onlyInSnapshot": unique, "sampleDiffering": differs, "sampleOnlyInSnapshot": uniques}

# ── document claims scan ──────────────────────────────────────────────────
CLAIM_RE = re.compile(
    r"\b(100\s?%\s?(complete|coverage|verified)|fully complete|production[- ]ready|complete catalogue|"
    r"all (\d[\d,]* )?(universities|courses) (collected|covered|verified)|no missing data|"
    r"complete university database|every course)\b", re.I)
claims = []
count = 0
for r in rows:
    ext = "." + r["ext"] if r["ext"] else ""
    if ext not in DOC_EXT:
        continue
    path = os.path.join(ROOT, r["path"])
    text = read_text(path, int(r["bytes"]))
    if not text:
        continue
    hits = CLAIM_RE.findall(text)
    if hits:
        count += 1
        sample = []
        for line in text.splitlines():
            if CLAIM_RE.search(line):
                sample.append(line.strip()[:180])
            if len(sample) >= 3:
                break
        claims.append({"path": r["path"], "hits": len(hits), "sample": sample})
claims.sort(key=lambda c: -c["hits"])

with open(os.path.join(AUD, "snapshot-comparison.json"), "w", encoding="utf-8") as fh:
    json.dump(snap, fh, indent=2)
with open(os.path.join(AUD, "doc-claims.json"), "w", encoding="utf-8") as fh:
    json.dump({"documentsWithClaims": count, "claims": claims[:80]}, fh, indent=2)

print(json.dumps({
    "rowsEnriched": len(rows),
    "dispositionAllFiles": dict(disp),
    "dispositionSrcOnly": dict(src_disp),
    "purposeFilled": sum(1 for r in rows if info[r["path"]]["purpose"]),
    "purposeBasis": dict(Counter(info[r["path"]].get("purpose_basis") or "none" for r in rows)),
    "purposeBlank": sum(1 for r in rows if not info[r["path"]]["purpose"]),
    "internalDependencyEdges": sum(len(info[r["path"]]["imports_internal"].split(", ")) for r in rows if info[r["path"]]["imports_internal"]),
    "snapshots": {k: {kk: vv for kk, vv in v.items() if not kk.startswith("sample")} for k, v in snap.items()},
    "documentsWithCompletenessClaims": count,
}, indent=2))
