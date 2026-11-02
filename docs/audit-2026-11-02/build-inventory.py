#!/usr/bin/env python3
"""
PHASE 0A/0B inventory builder — read-only.

Walks the whole repository (no depth limit), skips .git internals and any
node_modules tree (recorded separately with size/count/version), and emits:

  inventory.csv   one row per inspected file (path, size, sha256, lines, area, role, tracked)
  inventory-summary.json   totals, exclusions, per-area and per-role rollups,
                           duplicate groups by sha256, unreadable files

Nothing is written outside the audit output directory.
"""
import csv, hashlib, json, os, subprocess, sys
from collections import defaultdict, Counter

ROOT = "/home/user/ALO_WEB_CRM_TECH"
OUT = os.path.join(ROOT, "docs/audit-2026-11-02")
os.makedirs(OUT, exist_ok=True)

TRACKED = set()
try:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True).stdout
    TRACKED = {p.decode("utf-8", "replace") for p in out.split(b"\0") if p}
except Exception as exc:  # pragma: no cover
    print("warning: git ls-files failed:", exc, file=sys.stderr)

TEXT_EXT = {
    "ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "md", "mdx", "txt", "csv", "sql", "py",
    "sh", "yml", "yaml", "css", "scss", "html", "svg", "prisma", "env", "example", "toml",
    "ini", "conf", "xml", "map", "cts", "mts", "flow", "editorconfig", "gitignore", "npmrc",
    "nvmrc", "node-version", "dockerignore", "gitattributes", "log", "flag",
}
BINARY_EXT = {"png", "jpg", "jpeg", "webp", "gif", "ico", "woff", "woff2", "ttf", "eot", "mp4",
              "pdf", "zip", "gz", "xlsx", "xls", "docx", "db", "sqlite", "bin", "wasm", "avif", "bmp"}


def area_of(rel: str) -> str:
    parts = rel.split("/")
    if len(parts) == 1:
        return "(root)"
    top = parts[0]
    if top.startswith(".repair-backup"):
        return ".repair-backup"
    return top


def role_of(rel: str, ext: str) -> str:
    p = rel
    if p.startswith("src/app/api/"):
        return "api_route"
    if p.startswith("src/app/"):
        return "page_route"
    if p.startswith("src/components/"):
        return "ui_component"
    if p.startswith("src/lib/"):
        return "lib_module"
    if p.startswith("src/"):
        return "app_other"
    if p.startswith("prisma/migrations/"):
        return "db_migration"
    if p.startswith("prisma/"):
        return "db_schema_seed"
    if p.startswith("tests/") or ".test." in p or ".spec." in p:
        return "test"
    if p.startswith("scripts/"):
        return "script"
    if p.startswith(".github/"):
        return "ci_config"
    if p.startswith("public/"):
        return "public_asset"
    if p.startswith("imports/"):
        return "imported_snapshot"
    if p.startswith("alo-education-web-crm-final/"):
        return "nested_project_copy"
    if ext in {"csv", "tsv", "xlsx", "xls"}:
        return "dataset_csv"
    if ext in {"json", "ndjson"}:
        return "dataset_json"
    if ext == "sql":
        return "dataset_sql"
    if ext in {"md", "mdx"}:
        return "documentation"
    if ext == "txt":
        return "text_report"
    if p.startswith("docs/"):
        return "documentation"
    if p.startswith(("AUDIT", "audit/", "reports/", "deliverables/", "evidence/", "documentation/",
                     "agent-ctx/", "delivery-evidence")):
        return "audit_artifact"
    if ext in BINARY_EXT:
        return "binary_asset"
    if p.count("/") == 0 and (ext in {"json", "ts", "js", "mjs", "cjs", "yml", "yaml"} or p.startswith(".")):
        return "root_config"
    if ext in {"ts", "tsx", "js", "mjs", "cjs", "cts", "mts", "py"}:
        return "other_code"
    return "other"


def sha256_of(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def count_lines(path: str, size: int) -> int:
    if size > 8 * 1024 * 1024:
        return -1
    try:
        with open(path, "rb") as fh:
            return sum(1 for _ in fh)
    except Exception:
        return -1


rows = []
excluded_trees = []
unreadable = []
role_bytes = Counter()
role_files = Counter()
area_bytes = Counter()
area_files = Counter()

for dirpath, dirnames, filenames in os.walk(ROOT):
    # never descend into .git
    if os.path.abspath(dirpath) == os.path.join(ROOT, ".git"):
        dirnames[:] = []
        continue
    # record (and skip) any node_modules tree
    for d in list(dirnames):
        if d == "node_modules":
            full = os.path.join(dirpath, d)
            size = 0
            count = 0
            for dp2, _dn2, fn2 in os.walk(full):
                for f2 in fn2:
                    fp = os.path.join(dp2, f2)
                    try:
                        size += os.path.getsize(fp)
                        count += 1
                    except OSError:
                        pass
            pkg = os.path.join(full, ".package-lock.json")
            version = ""
            try:
                with open(pkg) as fh:
                    version = json.load(fh).get("lockfileVersion", "")
            except Exception:
                version = ""
            excluded_trees.append({
                "path": os.path.relpath(full, ROOT) + "/",
                "reason": "third-party dependency tree (not first-party ALO code)",
                "files": count,
                "bytes": size,
                "lockfileVersion": version,
            })
            dirnames.remove(d)
    for name in filenames:
        full = os.path.join(dirpath, name)
        rel = os.path.relpath(full, ROOT)
        try:
            size = os.path.getsize(full)
        except OSError as exc:
            unreadable.append({"path": rel, "reason": str(exc)})
            continue
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        role = role_of(rel, ext)
        area = area_of(rel)
        digest = ""
        try:
            digest = sha256_of(full)
        except Exception as exc:
            unreadable.append({"path": rel, "reason": f"hash failed: {exc}"})
        lines = count_lines(full, size) if ext in TEXT_EXT else -1
        rows.append({
            "path": rel,
            "area": area,
            "role": role,
            "ext": ext,
            "bytes": size,
            "lines": lines,
            "sha256": digest,
            "tracked": "yes" if rel in TRACKED else "no",
        })
        role_bytes[role] += size
        role_files[role] += 1
        area_bytes[area] += size
        area_files[area] += 1

rows.sort(key=lambda r: r["path"])

with open(os.path.join(OUT, "inventory.csv"), "w", newline="", encoding="utf-8") as fh:
    writer = csv.DictWriter(fh, fieldnames=["path", "area", "role", "ext", "bytes", "lines", "sha256", "tracked"])
    writer.writeheader()
    writer.writerows(rows)

by_hash = defaultdict(list)
for r in rows:
    if r["sha256"]:
        by_hash[r["sha256"]].append(r["path"])
dupe_groups = {h: ps for h, ps in by_hash.items() if len(ps) > 1}
dupe_wasted = sum(os.path.getsize(os.path.join(ROOT, ps[0])) * (len(ps) - 1) for ps in dupe_groups.values())

summary = {
    "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    "root": ROOT,
    "inspectedFiles": len(rows),
    "inspectedBytes": sum(r["bytes"] for r in rows),
    "trackedFiles": sum(1 for r in rows if r["tracked"] == "yes"),
    "untrackedFiles": sum(1 for r in rows if r["tracked"] == "no"),
    "unreadable": unreadable,
    "excludedTrees": sorted(excluded_trees, key=lambda e: -e["bytes"]),
    "excludedFilesTotal": sum(e["files"] for e in excluded_trees),
    "excludedBytesTotal": sum(e["bytes"] for e in excluded_trees),
    "byRole": {k: {"files": role_files[k], "bytes": role_bytes[k]} for k in sorted(role_files, key=lambda k: -role_files[k])},
    "byArea": {k: {"files": area_files[k], "bytes": area_bytes[k]} for k in sorted(area_files, key=lambda k: -area_files[k])},
    "duplicateHashGroups": len(dupe_groups),
    "duplicateRedundantFiles": sum(len(v) - 1 for v in dupe_groups.values()),
    "duplicateWastedBytes": dupe_wasted,
    "topDuplicateGroups": sorted(
        ({"sha256": h, "files": ps, "bytes": os.path.getsize(os.path.join(ROOT, ps[0]))} for h, ps in dupe_groups.items()),
        key=lambda g: -g["bytes"] * (len(g["files"]) - 1),
    )[:60],
}
with open(os.path.join(OUT, "inventory-summary.json"), "w", encoding="utf-8") as fh:
    json.dump(summary, fh, indent=2)

print(json.dumps({k: summary[k] for k in ["inspectedFiles", "inspectedBytes", "trackedFiles", "untrackedFiles",
                                          "excludedFilesTotal", "excludedBytesTotal", "duplicateHashGroups",
                                          "duplicateRedundantFiles", "duplicateWastedBytes"]}, indent=2))
print("unreadable:", len(unreadable))
