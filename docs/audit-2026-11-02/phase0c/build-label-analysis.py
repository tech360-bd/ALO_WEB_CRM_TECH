#!/usr/bin/env python3
"""
PHASE 0C — verification-label analysis (read-only).

Applies the Phase 0C promotion rule literally:

    A record may carry the canonical public status VERIFIED only when its
    official evidence has been validated AT FIELD LEVEL.

For every course in the verified dataset this script answers, per field:
is there a first-party evidence record whose fieldScope[] actually covers it?
It never infers coverage from a course-level VERIFIED label.

Outputs (docs/audit-2026-11-02/phase0c/):
  field-level-evidence-matrix.csv   course x core-field coverage + evidence ids
  label-resolution-proposal.csv     asserted label -> evidence-backed action
  label-analysis-summary.json       aggregate counts
"""
import csv, json, os
from collections import Counter

ROOT = "/home/user/ALO_WEB_CRM_TECH"
OUT = os.path.join(ROOT, "docs/audit-2026-11-02/phase0c")
DS = os.path.join(ROOT, "data/verified-2027/dataset.json")

# Fields a public course page must be able to state. Grouped so a missing
# group (not every individual synonym) drives the publish decision.
CORE_FIELDS = [
    ("identity", ["qualification", "courseCode", "catalogueTitle"]),
    ("duration", ["duration"]),
    ("study_mode", ["studyMode"]),
    ("campus", ["campus"]),
    ("fee", ["feeAmount", "fee", "feeCurrency", "feeRange", "feePeriod"]),
    ("entry_requirement", ["academicRequirement"]),
    ("english_requirement", ["englishRequirement", "englishRequirements"]),
    ("start_months", ["startMonths", "startDate", "intakeName"]),
    ("application_deadline", ["applicationCloses", "internationalDeadline", "applicationWindow"]),
    ("academic_year", ["academicYear", "entryYear", "handbookYear", "yearOfEntry"]),
]

# Out-of-band confirmations that are real evidence but cannot publish a field.
SUPPORT_ONLY = {"postgraduate2027_28ListingCount", "courseListing", "institutionIntakeMonths"}


def main():
    d = json.load(open(DS, encoding="utf-8"))
    evidence = {e["id"]: e for e in d["evidence"]}

    rows, proposals = [], []
    field_counter = Counter()

    for c in d["courses"]:
        ev_ids = []
        for cov in d["coverage"]:
            if cov["courseSlug"] == c["slug"]:
                ev_ids.extend(cov.get("evidenceIds") or [])
        ev_ids = list(dict.fromkeys(ev_ids))

        scope, scav = set(), {}
        for eid in ev_ids:
            e = evidence.get(eid)
            if not e:
                continue
            for f in e.get("fieldScope") or []:
                scope.add(f)
                scav.setdefault(f, []).append(eid)

        row = {
            "course_slug": c["slug"],
            "university_slug": c["universitySlug"],
            "course_title": c["title"],
            "asserted_label": c["verificationStatus"],
            "evidence_records": len(ev_ids),
        }
        covered, missing = [], []
        for group, fields in CORE_FIELDS:
            hits = [f for f in fields if f in scope]
            row["has_" + group] = "YES" if hits else "NO"
            row["evidence_" + group] = ";".join(
                dict.fromkeys([i for f in hits for i in scav.get(f, [])])
            )
            (covered if hits else missing).append(group)
            field_counter[(group, bool(hits))] += 1
        row["fields_covered"] = ";".join(covered)
        row["fields_missing"] = ";".join(missing)
        row["coverage_ratio"] = f"{len(covered)}/{len(CORE_FIELDS)}"
        rows.append(row)

        # Promotion decision on evidence alone.
        if len(missing) == 0:
            action, status = "publish all core fields as VERIFIED", "VERIFIED"
        elif len(covered) >= 6:
            action = ("publish the %d evidenced fields, suppress the %d unevidenced fields "
                      "as null/unknown; do not backfill from another source" % (len(covered), len(missing)))
            status = "PARTIALLY_VERIFIED"
        elif len(covered) >= 3:
            action = ("internal only — publish the %d evidenced fields behind a review flag, "
                      "not on the public catalogue until %d missing fields are sourced"
                      % (len(covered), len(missing)))
            status = "PARTIALLY_VERIFIED"
        else:
            action = "withhold from publication — evidence covers too few core fields to be useful"
            status = "UNPUBLISHABLE_INSUFFICIENT_EVIDENCE"

        proposals.append({
            "record_type": "course",
            "record": c["slug"],
            "asserted_label": c["verificationStatus"],
            "evidence_records": len(ev_ids),
            "fields_covered": len(covered),
            "fields_missing": len(missing),
            "missing_fields": ";".join(missing),
            "proposed_public_status": status,
            "proposed_action": action,
            "rationale": "course-level label is not evidence of field-level coverage",
        })

    # Institution-level rows: identity verification is a separate axis.
    inst = list(csv.DictReader(open(os.path.join(OUT, "canonical-institutions.csv"), encoding="utf-8")))
    for r in inst:
        if r["identity_verification"] != "VERIFIED_IDENTITY":
            continue
        proposals.append({
            "record_type": "institution",
            "record": r["institution_key"],
            "asserted_label": r["identity_verification"] + " / catalogue=" + (r["catalogue_survey_status"] or ""),
            "evidence_records": 1 if "PHASE1" in r["provenance"] else 0,
            "fields_covered": 1,
            "fields_missing": 2,
            "missing_fields": "course_catalogue_surveyed;admissions_requirements_verified",
            "proposed_public_status": "IDENTITY_VERIFIED_COURSE_UNVERIFIED",
            "proposed_action": ("publish institution name/identifier/regulator only; keep every course and "
                                "intake claim unverified until course-level evidence exists"),
            "rationale": "regulator register proves the provider exists — it proves nothing about its courses",
        })

    with open(os.path.join(OUT, "field-level-evidence-matrix.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    with open(os.path.join(OUT, "label-resolution-proposal.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(proposals[0].keys()))
        w.writeheader()
        w.writerows(proposals)

    summary = {
        "coursesAnalyzed": len(rows),
        "coreFieldGroups": len(CORE_FIELDS),
        "coursesWithAllCoreFieldsEvidenced": sum(1 for r in rows if r["coverage_ratio"] == f"{len(CORE_FIELDS)}/{len(CORE_FIELDS)}"),
        "coursesByCoverageRatio": dict(Counter(r["coverage_ratio"] for r in rows)),
        "assertedVsProposed": dict(Counter(
            "%s -> %s" % (r["asserted_label"], r["proposed_public_status"]) for r in proposals if r["record_type"] == "course")),
        "fieldAvailabilityAcrossCourses": {
            group: {"evidenced": field_counter[(group, True)], "notEvidenced": field_counter[(group, False)]}
            for group, _ in CORE_FIELDS
        },
        "institutionsIdentityVerified": sum(1 for p in proposals if p["record_type"] == "institution"),
        "evidenceIDsOrphaned": sorted(set(evidence) - {i for r in rows for i in r["evidence_records"] and []}),
    }

    # evidence records not reachable from any course coverage row
    used = set()
    for c in d["courses"]:
        for cov in d["coverage"]:
            if cov["courseSlug"] == c["slug"]:
                used.update(cov.get("evidenceIds") or [])
    summary["evidenceIDsOrphaned"] = sorted(set(evidence) - used)

    with open(os.path.join(OUT, "label-analysis-summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
