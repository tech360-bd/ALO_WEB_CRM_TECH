#!/usr/bin/env python3
"""
PHASE 0D — Prisma test-blocker analysis.

Reads a vitest JSON report and classifies EVERY failure individually. The point
is to refuse the blanket claim "the 31 failures are infrastructure": only the
ones whose message proves a missing generated Prisma client are classified that
way. Everything else is left as a genuine failure requiring triage.

Classes:
  BLOCKED_PRISMA_CLIENT     the failure message is the missing '.prisma/client/default'
  ENVIRONMENT_NO_DATABASE   the handler caught a DB error and returned 503
  ENVIRONMENT_TEST_DOUBLE   the test's own mock was never called (undefined call record)
  GENUINE_FAILURE           an assertion about product behaviour that is not explained
                            by the environment — must be triaged, not excused

Usage: build-test-blocker.py /tmp/vitest.json
Output: test-blocker-analysis.csv, test-blocker-summary.json
"""
import csv, json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))


def classify(message: str, title: str):
    m = message or ""
    if ".prisma/client/default" in m:
        return "BLOCKED_PRISMA_CLIENT", "message is the missing generated Prisma client"
    if "503" in m and ("to be 200" in m or "to be 400" in m or "to be 403" in m):
        return "ENVIRONMENT_NO_DATABASE", "handler returned 503 from a DB catch block; no database in this environment"
    if "Cannot read properties of undefined (reading '0')" in m or "mock.calls[0]" in m:
        return "ENVIRONMENT_TEST_DOUBLE", "the test's database mock was never called, so the assertion index is undefined"
    if "Number of calls: 0" in m or "to have been called" in m:
        return "ENVIRONMENT_TEST_DOUBLE", "expected mock was never invoked (DB layer not reached)"
    return "GENUINE_FAILURE", "assertion about product behaviour, not explained by the environment"


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/vitest.json"
    d = json.load(open(path, encoding="utf-8"))

    rows = []
    for f in d["testResults"]:
        rel = f["name"].split("/tests/")[-1]
        failed = [a for a in f.get("assertionResults", []) if a["status"] == "failed"]
        if not failed and f.get("message"):
            cls, why = classify(f["message"], "")
            rows.append({
                "file": rel, "scope": "file_collection", "test_title": "(whole file failed to load)",
                "classification": cls, "evidence": why,
                "first_error_line": next((l.strip() for l in f["message"].split("\n") if l.strip()), "")[:200],
                "assertions_in_file": len(f.get("assertionResults", [])),
            })
            continue
        for a in failed:
            msg = (a.get("failureMessages") or [""])[0]
            cls, why = classify(msg, a["title"])
            first = next((l.strip() for l in msg.split("\n") if l.strip()), "")
            rows.append({
                "file": rel, "scope": "test", "test_title": a["title"],
                "classification": cls, "evidence": why,
                "first_error_line": first[:200],
                "assertions_in_file": len(f.get("assertionResults", [])),
            })

    rows.sort(key=lambda r: (r["classification"], r["file"]))
    with open(os.path.join(HERE, "test-blocker-analysis.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    by_class = Counter(r["classification"] for r in rows)
    test_level = [r for r in rows if r["scope"] == "test"]
    summary = {
        "reportFile": path,
        "totals": {
            "testAssertions": d.get("numTotalTests"),
            "passed": d.get("numPassedTests"),
            "failedAssertions": d.get("numFailedTests"),
            "filesWithFailures": len(d["testResults"]),
        },
        "byClassification": dict(by_class),
        "failedAssertionsByClassification": dict(Counter(r["classification"] for r in test_level)),
        "filesFailingToLoad": sorted(r["file"] for r in rows if r["scope"] == "file_collection"),
        "genuineFailuresRequiringTriage": [
            {"file": r["file"], "test": r["test_title"], "error": r["first_error_line"]}
            for r in rows if r["classification"] == "GENUINE_FAILURE"
        ],
        "note": (
            "Only failures whose message is the missing generated Prisma client are attributed to "
            "Prisma. The rest are reported with their own cause; none is excused as infrastructure "
            "without evidence."),
    }
    with open(os.path.join(HERE, "test-blocker-summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps({k: v for k, v in summary.items() if k != "genuineFailuresRequiringTriage"},
                     indent=2, ensure_ascii=False))
    print("\nGENUINE FAILURES:", len(summary["genuineFailuresRequiringTriage"]))
    for g in summary["genuineFailuresRequiringTriage"]:
        print(f"  {g['file'][:46]:46} {g['test'][:52]:52} {g['error'][:60]}")


if __name__ == "__main__":
    main()
