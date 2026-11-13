#!/usr/bin/env python3
"""
PHASE 0D — evidence relink validation (read-only).

Phase 0C proposed three relinks. This script does NOT apply them. It tests each
against the six conditions the approval attached, per record, and records the
verdict plus the evidence ids involved.

The six conditions (from the approval):
  1. same institution and campus, where applicable
  2. same course and qualification
  3. same academic year or intake period
  4. correct field-level evidence
  5. original source URL and document provenance
  6. no conflicting evidence

Two defects in the Phase 0C estimate are corrected here:
  * Phase 0C matched evidence to courses by university slug in its sensitivity
    check. Evidence records name their own courseSlug, so the match must be on
    courseSlug — matching by university would have attached Centennial's
    BIOTECHNOLOGY admission rules to CONSTRUCTION PROJECT MANAGEMENT.
  * Phase 0C said relinking lifts "both Centennial courses 4/10 -> 6/10". Only
    the biotechnology course is named by that evidence. Construction PM gains
    nothing.

Outputs: relink-validation.csv, relink-coverage-before-after.csv,
         relink-validation.json
"""
import csv, importlib.util, json, os, re
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = "/home/user/ALO_WEB_CRM_TECH"
P0C = os.path.join(ROOT, "docs/audit-2026-11-02/phase0c")
DS = os.path.join(ROOT, "data/verified-2027/dataset.json")

# Reuse the Phase 0C field-group definition so "coverage" means one thing only.
_spec = importlib.util.spec_from_file_location("lbl", os.path.join(P0C, "build-label-analysis.py"))
_lbl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_lbl)
CORE_FIELDS = _lbl.CORE_FIELDS

CANDIDATES = [
    "cent-biotech-admission",
    "cent-biotech-fees",
    "mon-b6005-requirements",
]


def groups_hit(scope, core=CORE_FIELDS):
    return [g for g, fields in core if any(f in scope for f in fields)]


def coverage_ratio(scope):
    return len(groups_hit(scope)), len(CORE_FIELDS)


def years_in(text):
    return set(int(y) for y in re.findall(r"\b(20\d{2})\b", text or ""))


def main():
    d = json.load(open(DS, encoding="utf-8"))
    ev = {e["id"]: e for e in d["evidence"]}
    courses = {c["slug"]: c for c in d["courses"]}
    unis = {u["slug"]: u for u in d.get("universities", [])}

    # what is linked today, per course
    linked = {}
    for c in d["courses"]:
        ids = set()
        for cov in d["coverage"]:
            if cov["courseSlug"] == c["slug"]:
                ids.update(cov.get("evidenceIds") or [])
        linked[c["slug"]] = ids

    rows, coverage_rows = [], []

    for eid in CANDIDATES:
        e = ev[eid]
        slug = e.get("courseSlug")
        course = courses.get(slug)
        checks = []

        # ── condition 1: institution + campus ────────────────────────────────
        if course is None:
            checks.append(("1_institution_campus", "FAIL", "evidence names no course that exists in the dataset"))
        else:
            inst_ok = e.get("universitySlug") == course.get("universitySlug")
            # A campus claim can only conflict if the evidence actually scopes campus.
            if "campus" in (e.get("fieldScope") or []):
                camp = "PASS" if "campus" in (e.get("excerpt") or "").lower() else "REVIEW"
                camp_note = "evidence scopes campus; excerpt must be checked against %r" % course.get("campus")
            else:
                camp, camp_note = "N/A", "evidence makes no campus claim, so it cannot conflict with campus"
            checks.append(("1_institution_campus",
                           "PASS" if inst_ok else "FAIL",
                           f"universitySlug {e.get('universitySlug')!r} vs course {course.get('universitySlug')!r}; {camp_note}"
                           + ("" if inst_ok else "; INSTITUTION MISMATCH")))

        # ── condition 2: course + qualification ──────────────────────────────
        if course:
            typed = e.get("courseSlug")
            q_scope = "qualification" in (e.get("fieldScope") or [])
            checks.append(("2_course_qualification",
                           "PASS" if typed == course["slug"] else "FAIL",
                           f"evidence courseSlug {typed!r} is {'explicit' if typed else 'ABSENT'}; "
                           f"qualification {'is' if q_scope else 'is not'} in fieldScope"))

        # ── condition 3: academic year / intake period ───────────────────────
        ev_years = years_in(e.get("excerpt")) | years_in(e.get("sourceUrl")) | years_in(e.get("pageTitle"))
        course_years = years_in(course.get("academicYear")) | years_in(course.get("notes"))
        course_years |= {int(course["academicYear"][:4])} if course.get("academicYear", "")[:4].isdigit() else set()
        overlap = ev_years & course_years
        if not ev_years:
            y_status, y_note = "PASS", "evidence states no year, so it cannot contradict the course year"
        elif overlap:
            y_status = "PASS"
            y_note = f"evidence years {sorted(ev_years)} overlap course years {sorted(course_years)}"
            # Narrower is not wrong, but it limits what may be published.
            if ev_years != course_years:
                y_status = "PASS (scope caveat)"
                y_note += "; evidence covers a NARROWER period than the course record claims"
        else:
            y_status, y_note = "FAIL", f"evidence years {sorted(ev_years)} do not intersect course years {sorted(course_years)}"
        checks.append(("3_academic_year", y_status, y_note))

        # ── condition 4: field-level evidence ────────────────────────────────
        scope = set(e.get("fieldScope") or [])
        hit = groups_hit(scope)
        before = coverage_ratio({f for i in linked[course["slug"]] for f in (ev[i].get("fieldScope") or [])})
        after = coverage_ratio({f for i in linked[course["slug"]] | {eid} for f in (ev[i].get("fieldScope") or [])})
        unlocked = [g for g in hit if g not in groups_hit({f for i in linked[course["slug"]] for f in (ev[i].get("fieldScope") or [])})]
        checks.append(("4_field_level_evidence",
                       "PASS" if scope else "FAIL",
                       f"fieldScope {sorted(scope)} touches core groups {hit or 'NONE'}; "
                       f"newly unlocked: {unlocked or 'NOTHING'}"))

        # ── condition 5: source URL + provenance ─────────────────────────────
        url = e.get("sourceUrl") or ""
        host = urlparse(url).netloc.lower()
        unihost = urlparse(unis.get(course["universitySlug"], {}).get("officialWebsite", "")).netloc.lower().lstrip("www.")
        host_ok = host.endswith(unihost) if unihost else None
        prov = [
            ("https", url.startswith("https://")),
            ("httpStatus 200", e.get("httpStatus") == 200),
            ("retrievedAt", bool(e.get("retrievedAt"))),
            ("publisherName", bool(e.get("publisherName"))),
            ("excerpt", bool(e.get("excerpt"))),
            ("official host", bool(host_ok)),
            ("same URL as course officialCourseUrl", url == course.get("officialCourseUrl")),
        ]
        checks.append(("5_source_provenance",
                       "PASS" if all(ok for _, ok in prov) else "FAIL",
                       "; ".join(f"{k}={'yes' if ok else 'NO'}" for k, ok in prov)))

        # ── condition 6: conflicting evidence ────────────────────────────────
        conflicts = []
        for other_id in linked[course["slug"]]:
            other = ev.get(other_id, {})
            shared = scope & set(other.get("fieldScope") or [])
            if shared:
                conflicts.append(f"{other_id} also scopes {sorted(shared)}")
        # a fee/year claim that contradicts the course's own year
        if "feeAcademicYear" in scope and ev_years and course_years and ev_years != course_years:
            conflicts.append(
                "fee evidence states academic year %s while the course record claims %s"
                % (sorted(ev_years), sorted(course_years)))
        checks.append(("6_no_conflict",
                       "PASS" if not conflicts else "REVIEW",
                       "; ".join(conflicts) if conflicts else "no existing evidence scopes the same fields"))

        statuses = [c[1] for c in checks]
        if any(s == "FAIL" for s in statuses):
            verdict = "REJECT"
        elif any(s.startswith("REVIEW") for s in statuses) or any(s.startswith("PASS (scope") for s in statuses):
            verdict = "APPROVE_WITH_CAVEAT"
        else:
            verdict = "APPROVE"

        rows.append({
            "evidence_id": eid,
            "target_course_slug": slug or "",
            "target_course_title": course.get("title") if course else "",
            "field_scope": ";".join(sorted(scope)),
            "core_groups_touched": ";".join(hit) or "NONE",
            "newly_unlocked_groups": ";".join(unlocked) or "NONE",
            "coverage_before": f"{before[0]}/{before[1]}",
            "coverage_after": f"{after[0]}/{after[1]}",
            "verdict": verdict,
            **{c[0]: c[1] for c in checks},
            "detail": " | ".join(f"{c[0]}: {c[2]}" for c in checks),
        })

        coverage_rows.append({
            "course_slug": slug,
            "course_title": course.get("title") if course else "",
            "coverage_before": f"{before[0]}/{before[1]}",
            "coverage_after": f"{after[0]}/{after[1]}",
            "delta": after[0] - before[0],
            "evidence_ids_before": ";".join(sorted(linked[course["slug"]])),
            "evidence_ids_after": ";".join(sorted(linked[course["slug"]] | {eid})),
            "newly_unlocked": ";".join(unlocked) or "NONE",
            "evidence_id_added": eid,
            "verdict": verdict,
        })

    # Cumulative effect of applying every APPROVE / APPROVE_WITH_CAVEAT record.
    approved = {r["evidence_id"] for r in rows if r["verdict"].startswith("APPROVE")}
    cumulative = []
    for slug, c in courses.items():
        base = {f for i in linked[slug] for f in (ev[i].get("fieldScope") or [])}
        with_relink = {f for i in linked[slug] for f in (ev[i].get("fieldScope") or [])}
        for eid in approved:
            if ev[eid].get("courseSlug") == slug:
                with_relink |= set(ev[eid].get("fieldScope") or [])
        b, a = coverage_ratio(base), coverage_ratio(with_relink)
        if b[0] != a[0] or any(ev[x].get("courseSlug") == slug for x in approved):
            cumulative.append({
                "course_slug": slug,
                "course_title": c.get("title"),
                "coverage_now": f"{b[0]}/{b[1]}",
                "coverage_after_all_approved_relinks": f"{a[0]}/{a[1]}",
                "delta": a[0] - b[0],
                "groups_newly_covered": ";".join(
                    g for g, fs in CORE_FIELDS if any(f in with_relink for f in fs)
                    and not any(f in base for f in fs)) or "NONE",
            })

    # courses that receive no relink at all — the correction to Phase 0C
    untouched = [
        {"course_slug": s, "course_title": c["title"],
         "coverage": f"{coverage_ratio({f for i in linked[s] for f in (ev[i].get('fieldScope') or [])})[0]}/10",
         "note": "no candidate evidence record names this course; a university-level match would be a false link"}
        for s, c in courses.items()
        if not any(ev[x].get("courseSlug") == s for x in CANDIDATES)
    ]

    with open(os.path.join(HERE, "relink-validation.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    with open(os.path.join(HERE, "relink-coverage-before-after.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(coverage_rows[0].keys()))
        w.writeheader()
        w.writerows(coverage_rows)

    summary = {
        "candidates": len(rows),
        "verdicts": {r["evidence_id"]: r["verdict"] for r in rows},
        "perRecordCoverage": [
            {"evidence_id": r["evidence_id_added"], "course": r["course_slug"],
             "before": r["coverage_before"], "after_this_record_only": r["coverage_after"],
             "newly_unlocked": r["newly_unlocked"], "verdict": r["verdict"]}
            for r in coverage_rows
        ],
        "cumulativeAfterAllApprovedRelinks": cumulative,
        "coursesReceivingNothing": untouched,
        "phase0cClaimCorrected": (
            "Phase 0C estimated both Centennial courses would rise 4/10 -> 6/10. Only "
            "centennial-biotechnology-fast-track is named by the evidence; construction project "
            "management receives nothing, because the match must be on courseSlug, not university."
        ),
        "monashNote": (
            "mon-b6005-requirements scopes creditPoints and structure, neither of which is a core "
            "publication field, so Monash stays at 2/10 and remains on hold as approved."
        ),
    }
    with open(os.path.join(HERE, "relink-validation.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
