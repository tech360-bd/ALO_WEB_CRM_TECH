#!/usr/bin/env python3
"""
PHASE 0D — corrected canonical recovery dataset (local files only).

Applies the classifications approved on 2026-11-02:

  * seven insufficiently evidenced courses -> PARTIALLY_VERIFIED
  * Monash Master of Business -> HOLD (reported 2/10; measured 4/10, see note)
  * Aston -> stays unpublished (NEEDS_REVIEW)
  * identity-verified institutions -> IDENTITY_VERIFIED_COURSE_UNVERIFIED
  * synthetic rows -> unchanged, never publishable
  * the three approved evidence relinks are recorded, with before/after coverage

Nothing is overwritten: the Phase 0C CSVs stay byte-identical as the "before"
record. Everything here is written under phase0d/canonical/.

Every row keeps its original label and source, so the audit history is
recoverable: legacy_verification_status, legacy_source, then the approved value.

No database is touched. No Prisma enum is assumed: `verificationStatus` is a
String in schema.prisma, and the public gate requires the literal 'VERIFIED',
which is recorded in public_gate_result rather than assumed away.

Outputs: canonical/canonical-courses.csv, canonical/canonical-institutions.csv,
         canonical/relink-log.csv, canonical/coverage-before-after.csv,
         canonical/recovery-v2-summary.json
"""
import csv, importlib.util, json, os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "canonical")
ROOT = "/home/user/ALO_WEB_CRM_TECH"
P0C = os.path.join(ROOT, "docs/audit-2026-11-02/phase0c")
DS = os.path.join(ROOT, "data/verified-2027/dataset.json")

DECISION_RECORD = "docs/audit-2026-11-02/phase0d/01-VERIFICATION-POLICY-DECISION-RECORD.md"
DECIDED_AT = "2026-11-02"

# Approved relinks. cent-biotech-fees is provenance-only: it evidences neither a
# core field nor the course's academic year, so it must not promote anything.
RELINKS = {
    "centennial-biotechnology-fast-track": [
        ("cent-biotech-admission", "PROMOTES"),
        ("cent-biotech-fees", "PROVENANCE_ONLY"),
    ],
    "monash-master-of-business": [
        ("mon-b6005-requirements", "PROVENANCE_ONLY"),
    ],
}

# Monash is held by decision. The approval text cites 2/10; the measured value
# under both the grouped and flat field definitions is 4/10. The hold stands on
# substance (no duration, fee, deadline, entry or English requirement), not on
# the number, and the discrepancy is recorded rather than smoothed over.
HOLD = {"monash-master-of-business"}


def load_core():
    spec = importlib.util.spec_from_file_location("lbl", os.path.join(P0C, "build-label-analysis.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.CORE_FIELDS


def main():
    os.makedirs(OUT, exist_ok=True)
    CORE = load_core()
    ds = json.load(open(DS, encoding="utf-8"))
    ev = {e["id"]: e for e in ds["evidence"]}

    base_ids = {}
    for c in ds["courses"]:
        ids = set()
        for cov in ds["coverage"]:
            if cov["courseSlug"] == c["slug"]:
                ids.update(cov.get("evidenceIds") or [])
        base_ids[c["slug"]] = ids

    courses = list(csv.DictReader(open(os.path.join(P0C, "canonical-courses.csv"), encoding="utf-8")))
    # canonical course_key is prefixed (VC-<slug>); the dataset keys on slug.
    key_to_slug = {"VC-" + s: s for s in base_ids}
    key_to_slug.update({"AS-" + s: s for s in base_ids if s.startswith("foundation")})

    def groups(scope):
        return [g for g, fields in CORE if any(f in scope for f in fields)]

    relink_log, coverage_rows = [], []
    out_courses = []

    for r in courses:
        course_key = r["course_key"]
        slug = key_to_slug.get(course_key, course_key)
        synthetic = r["synthetic"] == "YES"
        legacy = r["verification_status"]
        ids_after = set(base_ids.get(slug, set()))

        added = []
        for eid, kind in RELINKS.get(slug, []):
            ids_after.add(eid)
            added.append(f"{eid}({kind})")
            relink_log.append({
                "course_key": course_key,
                "evidence_id": eid,
                "link_kind": kind,
                "evidence_field_scope": ";".join(sorted(ev[eid].get("fieldScope") or [])),
                "evidence_course_slug": ev[eid].get("courseSlug", ""),
                "source_url": ev[eid].get("sourceUrl", ""),
                "retrieved_at": ev[eid].get("retrievedAt", ""),
                "http_status": ev[eid].get("httpStatus", ""),
                "decision": "APPLIED_TO_LOCAL_RECOVERY_DATASET_ONLY",
                "database_written": "NO",
            })

        scope_before = {f for i in base_ids.get(slug, set()) for f in (ev[i].get("fieldScope") or [])}
        scope_after = {f for i in ids_after for f in (ev[i].get("fieldScope") or [])}
        before, after = len(groups(scope_before)), len(groups(scope_after))

        # ── approved classification ──────────────────────────────────────────
        if synthetic:
            approved = "UNVERIFIED_SYNTHETIC"
            publication = "NEVER_PUBLIC_SYNTHETIC"
        elif legacy in ("VERIFIED", "PARTIALLY_VERIFIED"):
            approved = "PARTIALLY_VERIFIED"
            publication = "HOLD" if slug in HOLD else "PENDING_PUBLIC_GATE"
        elif legacy == "NEEDS_REVIEW":
            approved = "NEEDS_REVIEW"
            publication = "UNPUBLISHED_INSUFFICIENT_EVIDENCE"
        else:
            approved = legacy
            publication = "UNPUBLISHED"

        # The public gate requires verificationStatus === 'VERIFIED' AND
        # approvalStatus === 'PUBLISHED'. Nothing here satisfies it, so no
        # approved value can be rendered publicly without a code change.
        gate = "PASSES" if approved == "VERIFIED" else "BLOCKED_BY_PUBLIC_GATE"

        out_courses.append({
            **r,
            "legacy_verification_status": legacy,
            "legacy_source": r.get("source", ""),
            "approved_verification_status": approved,
            "publication_decision": publication,
            "public_gate_result": gate,
            "evidence_ids": ";".join(sorted(ids_after)),
            "evidence_ids_added": ";".join(added),
            "field_groups_evidenced": ";".join(groups(scope_after)) or "NONE",
            "field_groups_suppressed": ";".join(
                g for g, _ in CORE if g not in groups(scope_after)) or "NONE",
            "coverage_before": f"{before}/10",
            "coverage_after": f"{after}/10",
            "decision_record": DECISION_RECORD,
            "decided_at": DECIDED_AT,
            "scope_of_decision": "RECOVERY_DATASET_ONLY_NOT_PRODUCTION",
        })

        if not synthetic and (before != after or slug in RELINKS):
            coverage_rows.append({
                "course_key": course_key,
                "course_title": r["course_title"],
                "coverage_before": f"{before}/10",
                "coverage_after": f"{after}/10",
                "delta": after - before,
                "evidence_ids_before": ";".join(sorted(base_ids.get(slug, set()))),
                "evidence_ids_after": ";".join(sorted(ids_after)),
                "groups_newly_covered": ";".join(g for g in groups(scope_after) if g not in groups(scope_before)) or "NONE",
                "approved_status": approved,
                "publication_decision": publication,
            })

    # ── institutions ────────────────────────────────────────────────────────
    inst = list(csv.DictReader(open(os.path.join(P0C, "canonical-institutions.csv"), encoding="utf-8")))
    dup = json.load(open(os.path.join(P0C, "duplicate-summary.json"), encoding="utf-8"))
    suspect_names = set()
    for p in csv.DictReader(open(os.path.join(P0C, "duplicate-candidates.csv"), encoding="utf-8")):
        if p["classification"] in ("CONFIRMED_ALIAS", "DUPLICATE_SUSPECT"):
            suspect_names.add(p["name_a"])
            suspect_names.add(p["name_b"])

    out_inst = []
    for r in inst:
        identity = r["identity_verification"]
        approved = ("IDENTITY_VERIFIED_COURSE_UNVERIFIED" if identity == "VERIFIED_IDENTITY"
                    else "UNVERIFIED_NOT_PUBLIC")
        out_inst.append({
            **r,
            "legacy_identity_verification": identity,
            "approved_export_status": approved,
            "duplicate_flag": "REVIEW" if r["display_name"] in suspect_names else "",
            "decision_record": DECISION_RECORD,
            "decided_at": DECIDED_AT,
            "scope_of_decision": "RECOVERY_DATASET_ONLY_NOT_PRODUCTION",
        })

    def write(name, rows):
        path = os.path.join(OUT, name)
        with open(path, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        return len(rows)

    n_c = write("canonical-courses.csv", out_courses)
    n_i = write("canonical-institutions.csv", out_inst)
    n_r = write("relink-log.csv", relink_log)
    n_v = write("coverage-before-after.csv", coverage_rows)

    non_synth = [r for r in out_courses if r["synthetic"] == "NO"]
    summary = {
        "written": {"courses": n_c, "institutions": n_i, "relinks": n_r, "coverageRows": n_v},
        "coursesByLegacyStatus": dict(Counter(r["legacy_verification_status"] for r in out_courses)),
        "coursesByApprovedStatus": dict(Counter(r["approved_verification_status"] for r in out_courses)),
        "nonSyntheticByApprovedStatus": dict(Counter(r["approved_verification_status"] for r in non_synth)),
        "publicationDecisions": dict(Counter(r["publication_decision"] for r in out_courses)),
        "publicGateResults_nonSynthetic": dict(Counter(r["public_gate_result"] for r in non_synth)),
        "institutionsByApprovedStatus": dict(Counter(r["approved_export_status"] for r in out_inst)),
        "institutionsFlaggedDuplicateReview": sum(1 for r in out_inst if r["duplicate_flag"] == "REVIEW"),
        "coverageChanges": coverage_rows,
        "hold": sorted(HOLD),
        "monashDiscrepancy": (
            "Approval text cites 2/10 for Monash. Measured 4/10 under both the grouped and the flat "
            "field definitions (identity via courseCode/handbookYear, studyMode, campus). The HOLD "
            "decision is retained because duration, fee, entry requirement, English requirement, "
            "start months and application deadline are all unevidenced."),
        "gateFinding": (
            "passesPublicPagePolicy requires verificationStatus === 'VERIFIED' AND approvalStatus "
            "=== 'PUBLISHED'. No approved status here equals VERIFIED, so zero courses can be public "
            "without an application change. The classification is therefore export-only, as approved."),
    }
    with open(os.path.join(OUT, "recovery-v2-summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps({k: v for k, v in summary.items() if k != "coverageChanges"}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
