#!/usr/bin/env python3
"""
PHASE 0C — API authorization matrix (read-only).

The Phase 0A scan matched only require*/auth*/session*/role* names and therefore
(a) produced false negatives for the shared `guard(...)` helper and for
resolveStudentAccess, and (b) produced false positives by ignoring the global
proxy gate entirely.

This script answers the question that actually matters, per mutating route:

  public            reachable anonymously by design (listed in PUBLIC_API_WRITE_ROUTES)
  role-gated        proxy SENSITIVE_API_ROUTES prefix AND/OR an in-handler guard
  auth-only         any authenticated identity of any role reaches the handler
                    and the handler performs no further authorisation
  public-write-gap  mutating route that is public but has no in-handler guard

It never executes the app; it reads source text and mirrors src/proxy.ts logic.

Output: authz-matrix.csv, authz-summary.json
"""
import csv, json, os, re
from collections import Counter

ROOT = "/home/user/ALO_WEB_CRM_TECH"
AUD = os.path.join(ROOT, "docs/audit-2026-11-02")
OUT = os.path.join(AUD, "phase0c")

# Guard helpers that appear in this codebase. Order matters only for reporting.
GUARD_PATTERNS = [
    # Generic naming conventions actually used in this codebase.
    ("requireX", r"\brequire[A-Z]\w*\s*\("),
    ("withAuth", r"\bwith\w*Auth\w*\s*\("),
    ("authenticate", r"\bauthenticate[A-Z]\w*\s*\("),
    ("guard", r"\bguard\s*\(\s*(?:request|req)"),
    ("authorize", r"\bauthorize[A-Z]\w*\s*\("),
    ("getServerSession", r"\bgetServerSession\s*\("),
    ("auth()", r"\bauth\s*\(\s*\)"),
    ("getToken", r"\bgetToken\s*\("),
    ("hasXAccess", r"\bhas[A-Z]\w*(?:Access|Permission)\w*\s*\("),
    ("isXManager/Admin", r"\bis[A-Z]\w*(?:Manager|Admin|Staff)\s*\("),
    ("can", r"\bcan\s*\("),
    ("resolveStudentX", r"\bresolveStudent\w*\s*\("),
    ("secret", r"\b(?:CRON_SECRET|WORKER_SECRET|INTERNAL_API_TOKEN|SERVICE_TOKEN|WEBHOOK_SECRET)\b"),
    ("hmac/signature", r"\bverify(?:Signature|Hmac|Webhook)\w*\s*\("),
]


def load_proxy():
    s = open(os.path.join(ROOT, "src/proxy.ts"), encoding="utf-8").read()

    def lst(name):
        m = re.search(r"const %s\s*=\s*\[(.*?)\n\];" % name, s, re.S)
        return re.findall(r'"([^"]+)"', m.group(1)) if m else []

    sens_block = re.search(r"SENSITIVE_API_ROUTES[^=]*=\s*\{(.*?)\n\};", s, re.S).group(1)
    sens = {k: [x.strip().strip('"\'') for x in v.split(",") if x.strip()]
            for k, v in re.findall(r'"([^"]+)"\s*:\s*\[([^\]]*)\]', sens_block)}
    return set(lst("PUBLIC_API_READ_ROUTES")), set(lst("PUBLIC_API_WRITE_ROUTES")), sens


# Rules that are NOT expressed as list entries in proxy.ts. Mirrored verbatim so
# this matrix cannot claim a route is protected when the gate makes it public.
AUTH_CATCH_ALL = "/api/auth"          # line 417: every /api/auth/* except change-password
AUTH_CATCH_ALL_EXCEPT = "/api/auth/change-password"
SPECIAL_PUBLIC_WRITES = {"/api/crm/leads/public", "/api/employee/activate", "/api/partner/activate"}


def matches(path, prefix):
    n = prefix.rstrip("/")
    return path == n or path.startswith(n + "/")


def to_url(route_file):
    p = route_file[len("src/app"):-len("/route.ts")]
    p = re.sub(r"/\([^)]*\)", "", p)
    return p or "/"


def main():
    reads, writes, sens = load_proxy()
    scan = json.load(open(os.path.join(AUD, "api-auth-scan.json"), encoding="utf-8"))["rows"]

    out = []
    for r in scan:
        url = to_url(r["route"])
        path = os.path.join(ROOT, r["route"])
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            text = ""
        found = [name for name, rx in GUARD_PATTERNS if re.search(rx, text)]
        public = any(matches(url, p) for p in (writes if r["mutating"] else reads))
        if matches(url, AUTH_CATCH_ALL) and not matches(url, AUTH_CATCH_ALL_EXCEPT):
            public = True
        if url in SPECIAL_PUBLIC_WRITES:
            public = True
        role_prefix = next((p for p in sens if matches(url, p)), "")
        roles = ",".join(sens.get(role_prefix, [])) if role_prefix else ""

        if public:
            verdict = "public-write-gap" if (r["mutating"] and not found) else "public"
        elif found:
            verdict = "role-gated" if role_prefix else "handler-gated"
        elif role_prefix:
            verdict = "role-gated"
        else:
            verdict = "auth-only"

        out.append({
            "url": url,
            "route_file": r["route"],
            "mutating": "YES" if r["mutating"] else "NO",
            "public_listed": "YES" if public else "NO",
            "proxy_role_allowlist": roles or "(none — any authenticated role)",
            "in_handler_guards": ", ".join(found) or "(none)",
            "layers": sum([bool(found), bool(role_prefix), not (public or found or role_prefix)]),
            "verdict": verdict,
            "residual_risk": {
                "public-write-gap": "mutating and anonymous — must be verified intentional and rate-limited",
                "public": "intentional public surface",
                "role-gated": "two independent layers (proxy allow-list + handler guard)",
                "handler-gated": "single layer: handler guard only; proxy adds authentication",
                "auth-only": "single weak layer: any authenticated role reaches this handler",
            }[verdict],
        })

    out.sort(key=lambda x: (x["verdict"], x["url"]))
    with open(os.path.join(OUT, "authz-matrix.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0].keys()))
        w.writeheader()
        w.writerows(out)

    summary = {
        "routes": len(out),
        "byVerdict": dict(Counter(r["verdict"] for r in out)),
        "mutatingByVerdict": dict(Counter(r["verdict"] for r in out if r["mutating"] == "YES")),
        "authOnlyMutating": [r["url"] for r in out if r["verdict"] == "auth-only" and r["mutating"] == "YES"],
        "publicWriteGaps": [r["url"] for r in out if r["verdict"] == "public-write-gap"],
        "guardHelpersObserved": dict(Counter(
            g.strip() for r in out for g in r["in_handler_guards"].split(",") if g.strip() != "(none)")),
    }
    with open(os.path.join(OUT, "authz-summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
