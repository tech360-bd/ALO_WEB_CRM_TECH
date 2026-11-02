#!/usr/bin/env python3
"""
PHASE 0B usage analysis — read-only.

Builds an import graph over src/ (the active Next.js application), finds:
  * entry points (pages, layouts, API routes, cron, proxy, middleware)
  * modules that nothing imports (orphans)
  * API routes that no first-party client references (URL-string scan)
  * byte-identical duplicate files inside src/
  * models declared in prisma/schema.prisma that no src/ or scripts/ file references

Outputs: usage-analysis.json
"""
import csv, json, os, re, sys
from collections import defaultdict, Counter

ROOT = "/home/user/ALO_WEB_CRM_TECH"
OUT = os.path.join(ROOT, "docs/audit-2026-11-02")
SRC = os.path.join(ROOT, "src")

IMPORT_RE = re.compile(
    r"""(?:^|\n)\s*(?:import|export)\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]"""
    r"""|\brequire\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|\bimport\(\s*['"]([^'"]+)['"]\s*\)""",
    re.M,
)
CODE_EXT = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}


def walk_src():
    for dirpath, dirnames, filenames in os.walk(SRC):
        dirnames[:] = [d for d in dirnames if d not in {"node_modules", ".next"}]
        for name in filenames:
            if os.path.splitext(name)[1] in CODE_EXT:
                yield os.path.join(dirpath, name)


def resolve(spec, from_file):
    """Resolve a module specifier to a repo-relative src path, or None for external."""
    if spec.startswith("@/"):
        base = os.path.join(SRC, spec[2:])
    elif spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(from_file), spec))
    else:
        return None
    for cand in (base, base + ".ts", base + ".tsx", base + ".js", base + ".jsx",
                 os.path.join(base, "index.ts"), os.path.join(base, "index.tsx"),
                 os.path.join(base, "index.js")):
        if os.path.isfile(cand):
            return os.path.relpath(cand, ROOT)
    return None


files = sorted(walk_src())
imports = {}
for f in files:
    try:
        text = open(f, encoding="utf-8", errors="replace").read()
    except Exception:
        text = ""
    specs = [next(g for g in m if g) for m in IMPORT_RE.findall(text)] if False else []
    specs = []
    for m in IMPORT_RE.finditer(text):
        spec = m.group(1) or m.group(2) or m.group(3)
        if spec:
            specs.append(spec)
    resolved = []
    for s in specs:
        r = resolve(s, f)
        if r:
            resolved.append(r)
    imports[os.path.relpath(f, ROOT)] = {"specs": specs, "resolved": resolved}

referenced = Counter()
for src_file, info in imports.items():
    for r in info["resolved"]:
        if r != src_file:
            referenced[r] += 1

ENTRY_RE = re.compile(r"^src/app/(.*?)(page|layout|route|template|loading|error|not-found|global-error|default)\.(tsx|ts|jsx|js)$")
entries = []
for rel in imports:
    m = ENTRY_RE.match(rel)
    if m:
        entries.append(rel)
    if rel in {"src/proxy.ts", "src/middleware.ts"}:
        entries.append(rel)

entry_set = set(entries)
orphans = sorted(p for p in imports if p not in entry_set and referenced[p] == 0)

# URL-string scan: which API routes does any first-party file reference?
all_text = {}
for f in files:
    if "/app/api/" in f or "/app/api/" in f.replace("\\", "/"):
        continue
    try:
        all_text[os.path.relpath(f, ROOT)] = open(f, encoding="utf-8", errors="replace").read()
    except Exception:
        all_text[os.path.relpath(f, ROOT)] = ""
blob = "\n".join(all_text.values())

api_routes = sorted(p for p in imports if re.search(r"^src/app/api/.*route\.(ts|js)$", p))
def url_of(route_path: str) -> str:
    rel = route_path[len("src/app"):-len("route.ts")] if route_path.endswith("route.ts") else route_path[len("src/app"):-len("route.js")]
    rel = re.sub(r"\([^)]*\)/", "", rel)          # route groups do not appear in the URL
    rel = re.sub(r"/route$", "", rel)
    return re.sub(r"\[[^\]]+\]", "", rel.rstrip("/"))

api_usage = []
for r in api_routes:
    u = url_of(r)
    seg = [s for s in u.split("/") if s]
    needle = "/" + "/".join(seg)
    hit = needle + "" in blob and needle.count("/") >= 2
    api_usage.append({"route": r, "url_base": needle, "referenced_by_client_code": bool(hit)})

# duplicate files inside src
import hashlib
src_hashes = defaultdict(list)
for f in files:
    h = hashlib.sha256(open(f, "rb").read()).hexdigest()
    src_hashes[h].append(os.path.relpath(f, ROOT))
src_dupes = {h: v for h, v in src_hashes.items() if len(v) > 1}

# prisma models referenced anywhere in src/ or scripts/
schema = open(os.path.join(ROOT, "prisma/schema.prisma"), encoding="utf-8", errors="replace").read()
models = re.findall(r"^model\s+(\w+)\s*\{", schema, re.M)
code_blob = blob
for extra in ("scripts", "prisma"):
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, extra)):
        dirnames[:] = [d for d in dirnames if d != "node_modules"]
        for name in filenames:
            if os.path.splitext(name)[1] in CODE_EXT:
                try:
                    code_blob += open(os.path.join(dirpath, name), encoding="utf-8", errors="replace").read()
                except Exception:
                    pass
def camel(m):
    return m[0].lower() + m[1:]
unused_models = []
for m in models:
    accessors = {camel(m), m, m.lower()}
    if not any(f"db.{a}" in code_blob or f"tx.{a}" in code_blob or f"prisma.{a}" in code_blob for a in accessors):
        unused_models.append(m)

stats = Counter()
for p in imports:
    if re.search(r"/page\.(tsx|ts|jsx|js)$", p):
        stats["pages"] += 1
    elif re.search(r"/route\.(ts|js)$", p):
        stats["api_routes"] += 1
    elif re.search(r"/layout\.(tsx|ts|jsx|js)$", p):
        stats["layouts"] += 1

result = {
    "srcCodeFiles": len(files),
    "stats": dict(stats),
    "entryPoints": len(entries),
    "orphanModules": orphans,
    "orphanCount": len(orphans),
    "apiRoutes": len(api_routes),
    "apiRoutesWithoutClientReference": [a for a in api_usage if not a["referenced_by_client_code"]],
    "apiRoutesWithClientReference": sum(1 for a in api_usage if a["referenced_by_client_code"]),
    "srcDuplicateGroups": {h: v for h, v in src_dupes.items()},
    "prismaModels": len(models),
    "prismaModelsUnreferencedInCode": unused_models,
}
with open(os.path.join(OUT, "usage-analysis.json"), "w", encoding="utf-8") as fh:
    json.dump(result, fh, indent=2)

print(json.dumps({k: result[k] for k in ["srcCodeFiles", "stats", "entryPoints", "orphanCount", "apiRoutes",
                                          "apiRoutesWithClientReference", "prismaModels"]}, indent=2))
print("orphan modules:", len(orphans))
print("api routes w/o client ref:", len(result["apiRoutesWithoutClientReference"]))
print("src duplicate groups:", len(src_dupes))
print("unreferenced prisma models:", len(unused_models))
