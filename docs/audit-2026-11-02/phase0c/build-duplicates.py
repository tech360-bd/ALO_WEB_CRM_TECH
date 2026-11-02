#!/usr/bin/env python3
"""
PHASE 0C — duplicate / alias detection for the canonical institution set.

The canonical merge keys institutions by normalised name. That cannot catch a
Māori-named row and its English-named row, "University of X" vs "The University
of X", or "&" vs "and". This script finds those, classifies each pair with a
transparent rule (no fuzzy scoring that hides its logic), and reports how many
IDENTITY_VERIFIED rows are inflated by double counting.

Classes:
  CONFIRMED_ALIAS  same provider, different spelling — must merge
  CAMPUS_VARIANT   same provider, distinct campus — keep, but parent must be modelled
  FALSE_POSITIVE   different institutions that merely share generic words

Output: duplicate-candidates.csv, duplicate-summary.json
"""
import csv, itertools, json, os, re, unicodedata
from collections import Counter

OUT = os.path.dirname(os.path.abspath(__file__))

# Words that appear in many institution names and therefore carry no identity.
# Only genuinely non-distinctive words. Words such as "catholic", "national",
# "american", "australia", "sydney" DISTINGUISH institutions and must be kept —
# stripping them made "Australian Catholic University" equal "Australian National
# University", which is the exact class of error this audit must not repeat.
GENERIC = {
    # "technology", "polytechnic" and "academy" are NOT generic here: stripping
    # them made "Queensland University of Technology" equal "University of
    # Queensland", two different institutions.
    "university", "college", "institute", "school", "of", "the", "at", "and", "for",
    "limited", "ltd", "pty", "inc", "plc",
}
STRIP = set()  # legal forms live in GENERIC so they cannot change identity


def norm(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return [t for t in s.split() if t not in STRIP]


def core(name):
    return set(norm(name)) - GENERIC


# Institution types that, when present in only one of two names, prove they are
# different providers: "University of Birmingham" is not "University College
# Birmingham".
TYPE_WORDS = {"college", "institute", "school", "academy", "polytechnic"}

# Known distinct legal entities whose names normalise to the same tokens.
# Adelaide University (2026 merger of the University of Adelaide and UniSA) is a
# different provider from the University of Adelaide it replaced.
# Compared on raw lower-cased display names, because these two normalise to the
# same token set by design and no automatic rule can separate them.
KNOWN_DISTINCT = {
    frozenset({"adelaide university", "the university of adelaide"}),
    frozenset({"adelaide university", "university of adelaide"}),
}


def classify(a, b):
    ca, cb = core(a), core(b)
    if not ca or not cb:
        return "FALSE_POSITIVE", "one name has no distinctive token (all generic)"

    na, nb = " ".join(norm(a)), " ".join(norm(b))
    if na == nb:
        return "CONFIRMED_ALIAS", "identical normalised name"

    if ca == cb:
        # Same distinctive tokens. Distinguish a spelling variant from a
        # genuinely different provider that merely shares those tokens.
        ta = {w for w in norm(a) if w in TYPE_WORDS}
        tb = {w for w in norm(b) if w in TYPE_WORDS}
        if ta != tb:
            return "DUPLICATE_SUSPECT", "different institution type words: %s vs %s" % (
                ", ".join(sorted(ta)) or "none", ", ".join(sorted(tb)) or "none")
        if frozenset({a.strip().lower(), b.strip().lower()}) in KNOWN_DISTINCT:
            return "DUPLICATE_SUSPECT", "known distinct legal entities with similar names"
        return "CONFIRMED_ALIAS", "identical distinctive token set"

    shorter, longer = (na, nb) if len(na) <= len(nb) else (nb, na)
    if re.search(r"(^| )" + re.escape(shorter) + r"( |$)", longer):
        extra = sorted((core(longer) - core(shorter)) if len(na) <= len(nb) else (core(shorter) - core(longer)))
        return "DUPLICATE_SUSPECT", "contiguous substring; extra distinctive tokens: " + (", ".join(extra) or "none")
    return "FALSE_POSITIVE", "shares only generic tokens"


def main():
    rows = list(csv.DictReader(open(os.path.join(OUT, "canonical-institutions.csv"), encoding="utf-8")))
    by_country = {}
    for r in rows:
        by_country.setdefault(r["country"], []).append(r)

    pairs = []
    for country, lst in by_country.items():
        for a, b in itertools.combinations(lst, 2):
            cls, why = classify(a["display_name"], b["display_name"])
            if cls == "FALSE_POSITIVE":
                continue
            pairs.append({
                "country": country,
                "institution_a": a["institution_key"],
                "name_a": a["display_name"],
                "identity_a": a["identity_verification"],
                "institution_b": b["institution_key"],
                "name_b": b["display_name"],
                "identity_b": b["identity_verification"],
                "classification": cls,
                "rule": why,
                "both_verified": "YES" if a["identity_verification"] == b["identity_verification"] == "VERIFIED_IDENTITY" else "NO",
                "merge_target": (a["display_name"] if a["identity_verification"] == "VERIFIED_IDENTITY" else b["display_name"]),
            })

    pairs.sort(key=lambda p: (p["classification"], p["country"], p["name_a"]))
    with open(os.path.join(OUT, "duplicate-candidates.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(pairs[0].keys()))
        w.writeheader()
        w.writerows(pairs)

    # How many identity-verified rows are redundant duplicates?
    # Union-find over CONFIRMED_ALIAS pairs: within one component the provider is
    # one institution, so (verified rows in component - 1) are redundant counts.
    # The verified row is always the keeper; an unverified twin never reduces the
    # verified total, it only reduces the row count.
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[ry] = rx

    for p in pairs:
        if p["classification"] == "CONFIRMED_ALIAS":
            union(p["institution_a"], p["institution_b"])

    from collections import defaultdict as _dd
    comps = _dd(list)
    for r in rows:
        if r["institution_key"] in parent:
            comps[find(r["institution_key"])].append(r)

    redundant = set()
    for root, members in comps.items():
        verified = [m for m in members if m["identity_verification"] == "VERIFIED_IDENTITY"]
        if len(verified) > 1:
            # keep the row that carries a regulator identifier, then the shortest name
            keep = sorted(verified, key=lambda m: (m["regulator_identifier"] == "", len(m["display_name"])))[0]
            for m in verified:
                if m["institution_key"] != keep["institution_key"]:
                    redundant.add(m["institution_key"])

    verified_rows = [r for r in rows if r["identity_verification"] == "VERIFIED_IDENTITY"]
    summary = {
        "candidatePairs": len(pairs),
        "byClassification": dict(Counter(p["classification"] for p in pairs)),
        "confirmedAliasPairs": sum(1 for p in pairs if p["classification"] == "CONFIRMED_ALIAS"),
        "duplicateSuspectPairs": sum(1 for p in pairs if p["classification"] == "DUPLICATE_SUSPECT"),
        "suspectsAffectingVerifiedCount": sum(1 for p in pairs if p["classification"] == "DUPLICATE_SUSPECT" and p["both_verified"] == "YES"),
        "identityVerifiedRowsBefore": len(verified_rows),
        "redundantVerifiedRows": len(redundant),
        "identityVerifiedDistinctAfter": len(verified_rows) - len(redundant),
        "redundantVerifiedExamples": sorted(redundant)[:10],
        "confirmedAliases": [
            {"country": p["country"], "keep": p["merge_target"],
             "merge": p["name_b"] if p["merge_target"] == p["name_a"] else p["name_a"]}
            for p in pairs if p["classification"] == "CONFIRMED_ALIAS"
        ],
    }
    with open(os.path.join(OUT, "duplicate-summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps({k: v for k, v in summary.items() if k != "confirmedAliases"}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
