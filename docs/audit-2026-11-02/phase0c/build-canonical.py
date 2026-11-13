#!/usr/bin/env python3
"""
PHASE 0C — existing catalogue data recovery. READ-ONLY against source files.

Consolidates every existing university / course / intake / evidence source into
one canonical bundle with record-level provenance, WITHOUT converting any legacy
label to VERIFIED and WITHOUT collecting anything new.

Sources read:
  AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv   (70 identity rows)
  AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv         (32 official sources)
  data/verified-2027/dataset.json                     (10 uni / 8 courses / 104 months / 30 evidence)
  data/official-source-audit/*                        (Aston parsed + source checks + URL validation)
  data/catalogue-review/*                             (UK 140 queue, BD shortlist, Aston candidates)
  01_ALO_UNIVERSITY_MASTER.csv, universities.csv      (synthetic masters)
  02_ALO_COURSE_MASTER.csv, 04_ALO_UNIVERSITY_COURSE_MASTER.csv, courses.csv
  02_ALO_COURSE_INTAKES_2027.csv, 04_ALO_UNIVERSITY_COURSE_MASTER.csv (intakes)

Outputs (docs/audit-2026-11-02/phase0c/):
  canonical-institutions.csv, canonical-courses.csv, canonical-intakes.csv,
  evidence-manifest.csv, conflicts.csv, coverage-by-destination.csv,
  canonical-dataset.json, recovery-summary.json
"""
import csv, json, os, re, unicodedata
from collections import Counter, defaultdict

ROOT = "/home/user/ALO_WEB_CRM_TECH"
OUT = os.path.join(ROOT, "docs/audit-2026-11-02/phase0c")
os.makedirs(OUT, exist_ok=True)

DESTINATIONS = {
    "United Kingdom": "UK", "Australia": "AU", "New Zealand": "NZ",
    "Ireland": "IE", "Canada": "CA", "United States": "US",
    "United States of America": "US", "USA": "US",
    "Ireland (Republic of Ireland)": "IE",
}
COUNTRY_ALIASES = {"UK": "United Kingdom", "US": "United States"}


def norm_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", (s or "")).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"\(.*?\)", " ", s)
    s = re.sub(r"\b(the|university|of|college|institute|school|and|&)\b", " ", s) if False else s
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


IRELAND_LABELS = {"ireland", "ireland (republic of ireland)", "republic of ireland", "eire"}


def norm_country(c: str) -> str:
    c = (c or "").strip()
    if c.lower() in IRELAND_LABELS:
        return "Ireland"
    code = DESTINATIONS.get(c)
    if code:
        return COUNTRY_ALIASES.get(code, c if c in COUNTRY_ALIASES.values() else c)
    return COUNTRY_ALIASES.get(c.upper(), c)


def read_csv(rel):
    p = os.path.join(ROOT, rel)
    if not os.path.isfile(p):
        return []
    with open(p, newline="", encoding="utf-8", errors="replace") as fh:
        return list(csv.DictReader(fh))


institutions = {}      # key -> record
merge_log = []
conflicts = []


def inst_key(country, name):
    return (norm_country(country).lower(), norm_name(name))


def upsert_inst(country, name, **fields):
    key = inst_key(country, name)
    rec = institutions.get(key)
    if rec is None:
        rec = {
            "institution_key": f"{norm_country(country)[:2].upper()}-{re.sub(r'[^a-z0-9]+', '-', norm_name(name))[:60]}",
            "official_name": name,
            "display_name": name,
            "country": norm_country(country),
            "country_code": {"United Kingdom": "UK", "Australia": "AU", "New Zealand": "NZ",
                             "Ireland": "IE", "Canada": "CA", "United States": "US"}.get(norm_country(country), ""),
            "provider_classification": "",
            "regulator_identifier": "",
            "official_website": "",
            "universe_source_url": "",
            "identity_verification": "UNVERIFIED",
            "identity_evidence": "",
            "identity_verified_date": "",
            "catalogue_survey_status": "NOT_SURVEYED",
            "faculty_department_status": "NOT_SURVEYED",
            "synthetic_present": "NO",
            "in_scope": "YES",
            "provenance": [],
            "notes": "",
        }
        institutions[key] = rec
    if len(name) > len(rec["official_name"]):
        rec["display_name"] = name
    for k, v in fields.items():
        if not v:
            continue
        if k in {"identity_verification", "catalogue_survey_status"}:
            if v == "VERIFIED_IDENTITY":
                rec[k] = v
            elif rec[k] == "UNVERIFIED":
                rec[k] = v
        elif not rec.get(k):
            rec[k] = v
    src = fields.get("_source")
    if src and src not in rec["provenance"]:
        rec["provenance"].append(src)
    return rec


# ── 1. Phase-1 regulator/sector identity rows (70) ─────────────────────────
phase1 = read_csv("AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv")
for r in phase1:
    country = r["country"]
    name = (r["official_name_from_source"] or r["official_trading_or_display_name"]).strip()
    rec = upsert_inst(
        country, name,
        provider_classification=r.get("provider_classification", ""),
        regulator_identifier=r.get("official_identifier", ""),
        official_website=r.get("official_website_url", ""),
        universe_source_url=r.get("universe_source_url", ""),
        identity_verification="VERIFIED_IDENTITY",
        identity_evidence="; ".join(x for x in [r.get("recognition_or_registration_status", ""),
                                                r.get("source_record_evidence", "")[:180]] if x),
        identity_verified_date=r.get("verification_date", ""),
        catalogue_survey_status="NOT_SURVEYED",
        faculty_department_status="NOT_SURVEYED",
        notes=r.get("notes", ""),
        _source="AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv",
    )
    rec["display_name"] = r.get("official_trading_or_display_name") or rec["display_name"]

# ── 2. Researched verified dataset (10 universities) ──────────────────────
ds = json.load(open(os.path.join(ROOT, "data/verified-2027/dataset.json"), encoding="utf-8"))
ds_uni_by_slug = {u["slug"]: u for u in ds["universities"]}
for u in ds["universities"]:
    rec = upsert_inst(
        u["country"], u["name"],
        official_website=u.get("officialWebsite", ""),
        universe_source_url=u.get("catalogueUrl", ""),
        identity_verification="VERIFIED_IDENTITY",
        identity_evidence=f"verified-catalogue dataset {ds['datasetId']}; university verificationStatus={u['verificationStatus']}",
        identity_verified_date=(u.get("lastVerifiedAt") or "")[:10],
        catalogue_survey_status="PARTIAL",
        notes=u.get("notes", ""),
        _source="data/verified-2027/dataset.json",
    )
    rec["catalogue_survey_status"] = "PARTIAL"
    rec["dataset_verification_status"] = u.get("verificationStatus", "")

# ── 3. Synthetic masters (never verified) ─────────────────────────────────
syn_master = read_csv("01_ALO_UNIVERSITY_MASTER.csv")
syn_univ = read_csv("universities.csv")
seen_syn = {}
for r in syn_master + syn_univ:
    country = r.get("country", "")
    name = (r.get("university_name") or r.get("name") or "").strip()
    if not name:
        continue
    rec = upsert_inst(
        country, name,
        official_website=r.get("official_university_url") or r.get("website", ""),
        universe_source_url=r.get("official_course_catalogue_url", ""),
        _source="01_ALO_UNIVERSITY_MASTER.csv" if r is not None and "university_name" in r else "universities.csv",
    )
    rec["synthetic_present"] = "YES"
    if rec["identity_verification"] == "UNVERIFIED":
        rec["identity_evidence"] = "synthetic seed/export only — no regulator or official-source validation"
    label = (r.get("verification_status") or "").strip()
    if label:
        seen_syn.setdefault((norm_country(country).lower(), norm_name(name)), set()).add(label)

for rec in institutions.values():
    if (rec["display_name"].count(",") >= 3 or len(rec["display_name"]) > 120
            or "formerly" in rec["display_name"].lower()):
        conflicts.append({
            "conflict_type": "ALIAS_BUNDLE_NEEDS_SPLIT",
            "entity": rec["display_name"][:90],
            "country": rec["country"],
            "values": (f"{rec['display_name'].count(',') + 1} comma-separated aliases in display_name"
                       if rec["display_name"].count(",") >= 3
                       else "parenthetical former name in display_name"),
            "sources": "AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv",
            "canonical_action": "identity is regulator-confirmed; aliases must move to an alias table before import",
            "severity": "MEDIUM",
        })

for key, labels in seen_syn.items():
    if len(labels) > 1:
        rec = institutions.get(key)
        conflicts.append({
            "conflict_type": "VERIFICATION_LABEL_DISAGREEMENT",
            "entity": rec["display_name"] if rec else key[1],
            "country": rec["country"] if rec else "",
            "values": " | ".join(sorted(labels)),
            "sources": "01_ALO_UNIVERSITY_MASTER.csv, universities.csv",
            "canonical_action": "neither label accepted; record stays UNVERIFIED pending field-level official evidence",
            "severity": "HIGH",
        })

# synthetic coverage disagreement (Australia 20 vs 40)
au_master = sum(1 for r in syn_master if r.get("country") == "Australia")
au_univ = sum(1 for r in syn_univ if r.get("country") == "Australia")
if au_master != au_univ:
    conflicts.append({
        "conflict_type": "COVERAGE_COUNT_DISAGREEMENT",
        "entity": "Australia (synthetic masters)",
        "country": "Australia",
        "values": f"01_ALO_UNIVERSITY_MASTER.csv={au_master}; universities.csv={au_univ}",
        "sources": "01_ALO_UNIVERSITY_MASTER.csv, universities.csv",
        "canonical_action": "use the regulator universe (44 TEQSA rows) as truth; both exports are incomplete",
        "severity": "MEDIUM",
    })

# ── 4. Canonical institution rows ─────────────────────────────────────────
CODE_OF = {"United Kingdom": "UK", "Australia": "AU", "New Zealand": "NZ", "Ireland": "IE",
           "Canada": "CA", "United States": "US"}
for rec in institutions.values():
    rec["country_code"] = CODE_OF.get(rec["country"], "")
    rec["in_scope"] = "YES" if rec["country"] in CODE_OF else "NO_OUT_OF_SCOPE"
    if rec["identity_verification"] == "VERIFIED_IDENTITY" and rec["catalogue_survey_status"] == "NOT_SURVEYED":
        rec["public_status"] = "IDENTITY_VERIFIED_ONLY — not publishable (no verified course/intake data)"
    elif rec["catalogue_survey_status"] == "PARTIAL":
        rec["public_status"] = "PARTIAL — publishable per verified course only"
    else:
        rec["public_status"] = "NOT_PUBLIC — unverified"

inst_rows = sorted(institutions.values(), key=lambda r: (r["country"], r["display_name"].lower()))

# ── 5. Courses ────────────────────────────────────────────────────────────
courses = []
for c in ds["courses"]:
    u = ds_uni_by_slug.get(c["universitySlug"], {})
    key = inst_key(u.get("country", ""), u.get("name", ""))
    inst = institutions.get(key)
    courses.append({
        "course_key": f"VC-{c['slug']}",
        "institution_key": inst["institution_key"] if inst else "",
        "institution_name": u.get("name", ""),
        "country": u.get("country", ""),
        "course_title": c["title"],
        "qualification": c.get("qualification", ""),
        "study_level": c.get("studyLevel", ""),
        "subject_area": c.get("subjectArea", ""),
        "duration_months": c.get("durationMonths", ""),
        "study_mode": c.get("studyMode", ""),
        "campus": c.get("campus", ""),
        "official_course_url": c.get("officialCourseUrl", ""),
        "application_url": c.get("applicationUrl", ""),
        "academic_year": c.get("academicYear", ""),
        "verification_status": c.get("verificationStatus", ""),
        "evidence_ids": ";".join(sorted({e for row in ds["coverage"] if row["courseSlug"] == c["slug"] for e in row["evidenceIds"]})),
        "last_verified_at": c.get("lastVerifiedAt", ""),
        "synthetic": "NO",
        "source": "data/verified-2027/dataset.json",
        "notes": c.get("notes", ""),
    })

# Aston parsed (official-source-audit) — 3 rows, flagged by their own parseWarnings
for r in read_csv("data/official-source-audit/aston_courses_parsed.csv"):
    courses.append({
        "course_key": f"AS-{re.sub(r'[^a-z0-9]+', '-', (r.get('officialCourseTitle') or '').lower())[:50]}",
        "institution_key": inst_key("United Kingdom", "Aston University")[1],
        "institution_name": "Aston University",
        "country": "United Kingdom",
        "course_title": r.get("officialCourseTitle", ""),
        "qualification": r.get("award", ""),
        "study_level": r.get("studyLevel", ""),
        "subject_area": "",
        "duration_months": "",
        "study_mode": r.get("studyMode", ""),
        "campus": r.get("campus", ""),
        "official_course_url": r.get("officialCourseUrl", ""),
        "application_url": "",
        "academic_year": r.get("feeYear", ""),
        "verification_status": r.get("verificationStatus", "") or "PARSE_INCOMPLETE",
        "evidence_ids": "",
        "last_verified_at": "",
        "synthetic": "NO",
        "source": "data/official-source-audit/aston_courses_parsed.csv",
        "notes": r.get("parseWarnings", ""),
    })

# Synthetic courses for the six destinations
uni_id_to_inst = {}
for r in syn_master + syn_univ:
    name = (r.get("university_name") or r.get("name") or "").strip()
    country = r.get("country", "")
    if name:
        rec = institutions.get(inst_key(country, name))
        uid = r.get("university_id") or r.get("university_id")
        if rec and uid:
            uni_id_to_inst[uid] = rec

syn_course_count = 0
for rel in ("04_ALO_UNIVERSITY_COURSE_MASTER.csv", "courses.csv"):
    seen = set()
    for r in read_csv(rel):
        country = r.get("country", "")
        name = (r.get("university_name") or "").strip()
        if not name:
            uid = r.get("university_id", "")
            rec = uni_id_to_inst.get(uid)
            if not rec:
                continue
            name, country = rec["display_name"], rec["country"]
        rec = institutions.get(inst_key(country, name))
        if not rec or rec["in_scope"] != "YES":
            continue
        title = (r.get("course_title") or r.get("course_name") or "").strip()
        level = (r.get("study_level") or r.get("degree_level") or "").strip()
        k = (rec["institution_key"], norm_name(title), level.lower())
        if k in seen:
            continue
        seen.add(k)
        syn_course_count += 1
        courses.append({
            "course_key": f"SYN-{syn_course_count:05d}",
            "institution_key": rec["institution_key"],
            "institution_name": rec["display_name"],
            "country": rec["country"],
            "course_title": title,
            "qualification": (r.get("qualification") or r.get("award") or "").strip(),
            "study_level": level,
            "subject_area": (r.get("subject_area") or r.get("subject") or "").strip(),
            "duration_months": r.get("duration_months", ""),
            "study_mode": (r.get("study_mode") or r.get("delivery_mode") or "").strip(),
            "campus": r.get("campus", ""),
            "official_course_url": (r.get("official_course_url") or r.get("course_url") or "").strip(),
            "application_url": (r.get("application_url") or "").strip(),
            "academic_year": r.get("intake_year", ""),
            "verification_status": "UNVERIFIED_SYNTHETIC",
            "evidence_ids": "",
            "last_verified_at": "",
            "synthetic": "YES",
            "source": rel,
            "notes": "generated seed/export row; course URL pattern is templated — not independently verified",
        })
        if country not in ("", None):
            pass

# ── 6. Intakes / course-months ────────────────────────────────────────────
intakes = []
for row in ds["coverage"]:
    c = next((x for x in ds["courses"] if x["slug"] == row["courseSlug"]), {})
    u = ds_uni_by_slug.get(c.get("universitySlug", ""), {})
    intakes.append({
        "intake_key": f"VC-{row['courseSlug']}-{row['year']}-{row['month']:02d}",
        "course_key": f"VC-{row['courseSlug']}",
        "institution_name": u.get("name", ""),
        "country": u.get("country", ""),
        "intake_year": row["year"],
        "intake_month": row["month"],
        "status": row["status"],
        "confidence": row.get("confidence", ""),
        "evidence_ids": ";".join(row.get("evidenceIds") or []),
        "verification_status": "VERIFIED" if row["status"] == "VERIFIED_AVAILABLE" else row["status"],
        "synthetic": "NO",
        "source": "data/verified-2027/dataset.json",
        "notes": row.get("notes", ""),
    })

syn_intakes = 0
for r in read_csv("02_ALO_COURSE_INTAKES_2027.csv"):
    syn_intakes += 1
    intakes.append({
        "intake_key": r.get("course_intake_id", f"SYN-INT-{syn_intakes:05d}"),
        "course_key": r.get("course_id", ""),
        "institution_name": "",
        "country": "",
        "intake_year": r.get("intake_year", ""),
        "intake_month": r.get("intake_month", ""),
        "status": r.get("intake_status") or "REQUIRES_REVIEW",
        "confidence": "",
        "evidence_ids": "",
        "verification_status": "UNVERIFIED_SYNTHETIC",
        "synthetic": "YES",
        "source": "02_ALO_COURSE_INTAKES_2027.csv",
        "notes": f"declared availability={r.get('availability','')}; deadline={r.get('application_deadline','')}",
    })

# ── 7. Evidence / provenance manifest ─────────────────────────────────────
evidence = []
for e in ds["evidence"]:
    evidence.append({
        "evidence_id": e["id"],
        "class": "CATALOGUE_EVIDENCE",
        "source_url": e.get("sourceUrl", ""),
        "source_type": e.get("sourceType", ""),
        "publisher": e.get("publisherName", ""),
        "page_title": e.get("pageTitle", ""),
        "retrieved_at": e.get("retrievedAt", ""),
        "http_status": e.get("httpStatus", ""),
        "field_scope": ";".join(e.get("fieldScope") or []),
        "entity_type": e.get("entityType", ""),
        "entity_slug": e.get("universitySlug", ""),
        "confidence": e.get("confidence", ""),
        "excerpt": (e.get("excerpt") or "")[:300],
        "source": "data/verified-2027/dataset.json",
    })
for r in read_csv("AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv"):
    evidence.append({
        "evidence_id": f"PHASE1-SRC-{abs(hash(r.get('source_url',''))) % 100000:05d}",
        "class": "UNIVERSE_SOURCE",
        "source_url": r.get("source_url", ""),
        "source_type": r.get("source_authority_type", ""),
        "publisher": r.get("source_name", ""),
        "page_title": r.get("source_name", ""),
        "retrieved_at": r.get("accessed_on", ""),
        "http_status": r.get("access_result", ""),
        "field_scope": "institution identity / universe",
        "entity_type": r.get("country_or_scope", ""),
        "entity_slug": "",
        "confidence": "",
        "excerpt": (r.get("evidence_used") or "")[:300],
        "source": "AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv",
    })
for r in read_csv("data/official-source-audit/aston_official_source_checks.csv"):
    evidence.append({
        "evidence_id": f"ASTON-CHK-{r.get('targetId','')[:20]}-{r.get('sourceType','')}",
        "class": "URL_CHECK",
        "source_url": r.get("finalUrl") or r.get("requestedUrl", ""),
        "source_type": r.get("sourceType", ""),
        "publisher": "Aston University",
        "page_title": r.get("pageTitle", ""),
        "retrieved_at": r.get("checkedAt", ""),
        "http_status": r.get("httpStatus", ""),
        "field_scope": "page availability / entity match",
        "entity_type": r.get("targetType", ""),
        "entity_slug": r.get("targetId", ""),
        "confidence": "",
        "excerpt": f"entityMatch={r.get('entityMatchStatus','')}; soft404={r.get('soft404','')}; failure={r.get('failureReason','')}"[:300],
        "source": "data/official-source-audit/aston_official_source_checks.csv",
    })
for r in read_csv("data/official-source-audit/URL_validation_report.csv"):
    evidence.append({
        "evidence_id": f"URLCHK-{abs(hash(r.get('url',''))) % 100000:05d}",
        "class": "URL_CHECK",
        "source_url": r.get("final_url") or r.get("url", ""),
        "source_type": "THIRD_PARTY_REFERENCE",
        "publisher": r.get("source_name", ""),
        "page_title": "",
        "retrieved_at": r.get("checked_at", ""),
        "http_status": r.get("http_status", ""),
        "field_scope": "URL availability",
        "entity_type": "",
        "entity_slug": "",
        "confidence": "",
        "excerpt": f"soft404={r.get('soft_404','')}; status={r.get('status','')}",
        "source": "data/official-source-audit/URL_validation_report.csv",
    })


SOURCE_OF_TRUTH_NOTE = {
    "United Kingdom": "OfS / Scottish Funding Council / Welsh & NI registers exist but no provider list was extracted; the 140-row review queue is a sample, not a universe",
    "Australia": "TEQSA National Register (TQNR); the 'Australian University' category was enumerated, other provider categories were not",
    "New Zealand": "Universities New Zealand publishes exactly 8 universities; all are captured; the remaining rows are non-university providers",
    "Ireland": "HEA list captured; Quality and Qualifications Ireland (QQI) providers were not enumerated",
    "Canada": "Designated Learning Institution list not extracted; 1 sample institution only",
    "United States": "College Navigator not extracted; the 20 US rows are synthetic seeds",
}


def _gap_statement(country, known, identity, surveyed, verified_courses, months):
    """Compose the gap from the measured numbers, never from a hand-written claim."""
    parts = [
        f"{identity} of {known} known institutions identity-verified",
        f"{surveyed} catalogue-surveyed",
        f"{verified_courses} course(s) with field-level evidence",
        f"{months} course-month record(s)",
    ]
    return SOURCE_OF_TRUTH_NOTE[country] + " — " + "; ".join(parts)


# ── 8. Coverage by destination ────────────────────────────────────────────
cov = []
for country in ["United Kingdom", "Australia", "New Zealand", "Ireland", "Canada", "United States"]:
    insts = [r for r in inst_rows if r["country"] == country]
    ident = [r for r in insts if r["identity_verification"] == "VERIFIED_IDENTITY"]
    partial = [r for r in insts if r["catalogue_survey_status"] == "PARTIAL"]
    vcrs = [c for c in courses if c["country"] == country and c["synthetic"] == "NO" and c["verification_status"] == "VERIFIED"]
    vint = [i for i in intakes if i["country"] == country and i["synthetic"] == "NO"]
    syn = [c for c in courses if c["country"] == country and c["synthetic"] == "YES"]
    cov.append({
        "country": country,
        "institutions_known": len(insts),
        "institutions_identity_verified": len(ident),
        "institutions_catalogue_surveyed": len(partial),
        "institutions_with_verified_course": len({c["institution_key"] for c in vcrs}),
        "courses_verified": len(vcrs),
        "course_months_recorded": len(vint),
        "course_months_verified_available": sum(1 for i in vint if i["status"] == "VERIFIED_AVAILABLE"),
        "synthetic_courses_present": len(syn),
        "evidence_records": sum(1 for e in ds["evidence"]
                                if ds_uni_by_slug.get(e.get("universitySlug", ""), {}).get("country") == country),
        "identity_source": {"United Kingdom": "OfS/Scottish Gov/Welsh/NI registers (universe NOT extracted)",
                            "Australia": "TEQSA National Register (TQNR API)",
                            "New Zealand": "Universities New Zealand list",
                            "Ireland": "HEA list",
                            "Canada": "DLI list (not extracted)",
                            "United States": "College Navigator (not extracted)"}[country],
        "gap_statement": _gap_statement(country, len(insts), len(ident), len(partial), len(vcrs), len(vint)),
    })


# ── 9. Write canonical CSVs ───────────────────────────────────────────────
def write(name, rows, fields):
    path = os.path.join(OUT, name)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return len(rows)

inst_fields = ["institution_key", "official_name", "display_name", "country", "country_code",
               "provider_classification", "regulator_identifier", "official_website", "universe_source_url",
               "identity_verification", "identity_evidence", "identity_verified_date",
               "catalogue_survey_status", "faculty_department_status", "public_status",
               "synthetic_present", "in_scope", "provenance", "notes"]
course_fields = ["course_key", "institution_key", "institution_name", "country", "course_title",
                 "qualification", "study_level", "subject_area", "duration_months", "study_mode", "campus",
                 "official_course_url", "application_url", "academic_year", "verification_status",
                 "evidence_ids", "last_verified_at", "synthetic", "source", "notes"]
intake_fields = ["intake_key", "course_key", "institution_name", "country", "intake_year", "intake_month",
                 "status", "confidence", "evidence_ids", "verification_status", "synthetic", "source", "notes"]
ev_fields = ["evidence_id", "class", "source_url", "source_type", "publisher", "page_title", "retrieved_at",
             "http_status", "field_scope", "entity_type", "entity_slug", "confidence", "excerpt", "source"]

for r in inst_rows:
    r["provenance"] = " | ".join(r["provenance"])
n_inst = write("canonical-institutions.csv", inst_rows, inst_fields)
n_crs = write("canonical-courses.csv", courses, course_fields)
n_int = write("canonical-intakes.csv", intakes, intake_fields)
n_ev = write("evidence-manifest.csv", evidence, ev_fields)

# course-level structural conflicts worth surfacing
syn_titles = defaultdict(set)
for c in courses:
    if c["synthetic"] == "YES":
        syn_titles[(c["institution_key"], c["course_title"].lower())].add(c["study_level"].lower())
conflicts.append({
    "conflict_type": "SYNTHETIC_COURSE_LEVEL_AMBIGUITY",
    "entity": "generated courses appearing at more than one study level",
    "country": "all synthetic",
    "values": str(sum(1 for v in syn_titles.values() if len(v) > 1)),
    "sources": "04_ALO_UNIVERSITY_COURSE_MASTER.csv, courses.csv",
    "canonical_action": "not resolvable without official catalogue evidence",
    "severity": "LOW",
})
write("conflicts.csv", conflicts,
      ["conflict_type", "entity", "country", "values", "sources", "canonical_action", "severity"])
write("coverage-by-destination.csv", cov, list(cov[0].keys()))

# ── 10. Canonical verified-only dataset bundle (ingest-compatible shape) ───
bundle = {
    "schemaVersion": ds["schemaVersion"],
    "datasetId": "alo-canonical-recovery-2026-11-02",
    "generatedAt": "2026-11-02T00:00:00Z",
    "derivedFrom": ["data/verified-2027/dataset.json",
                    "AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv",
                    "AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv",
                    "data/official-source-audit/*"],
    "containsSyntheticData": False,
    "notes": "Verified subset only. No legacy label was converted to VERIFIED. Synthetic masters excluded by design.",
    "universities": ds["universities"],
    "courses": ds["courses"],
    "coverage": ds["coverage"],
    "evidence": ds["evidence"],
    "traversals": ds["traversals"],
    "provenanceIndex": {
        "universities": "verbatim from data/verified-2027/dataset.json (unchanged)",
        "courses": "verbatim from data/verified-2027/dataset.json (unchanged)",
        "coverage": "verbatim from data/verified-2027/dataset.json (unchanged)",
        "evidence": "verbatim from data/verified-2027/dataset.json (unchanged)",
        "identityOnlyInstitutions": "70 rows in canonical-institutions.csv (no course data attached)",
    },
}
json.dump(bundle, open(os.path.join(OUT, "canonical-dataset.json"), "w", encoding="utf-8"), indent=2)

summary = {
    "institutionsTotal": len(inst_rows),
    "institutionsIdentityVerified": sum(1 for r in inst_rows if r["identity_verification"] == "VERIFIED_IDENTITY"),
    "institutionsSyntheticOnly": sum(1 for r in inst_rows if r["identity_verification"] != "VERIFIED_IDENTITY"),
    "institutionsOutOfScope": sum(1 for r in inst_rows if r["in_scope"] != "YES"),
    "coursesTotal": len(courses),
    "coursesVerified": sum(1 for c in courses if c["synthetic"] == "NO" and c["verification_status"] == "VERIFIED"),
    "coursesNonSyntheticUnverified": sum(1 for c in courses if c["synthetic"] == "NO" and c["verification_status"] != "VERIFIED"),
    "coursesSynthetic": sum(1 for c in courses if c["synthetic"] == "YES"),
    "intakesTotal": len(intakes),
    "intakesVerifiedDataset": sum(1 for i in intakes if i["synthetic"] == "NO"),
    "intakesVerifiedAvailable": sum(1 for i in intakes if i["status"] == "VERIFIED_AVAILABLE"),
    "intakesSynthetic": sum(1 for i in intakes if i["synthetic"] == "YES"),
    "evidenceTotal": len(evidence),
    "evidenceByClass": dict(Counter(e["class"] for e in evidence)),
    "conflicts": len(conflicts),
    "conflictsBySeverity": dict(Counter(c["severity"] for c in conflicts)),
    "written": {"institutions": n_inst, "courses": n_crs, "intakes": n_int, "evidence": n_ev},
}
json.dump(summary, open(os.path.join(OUT, "recovery-summary.json"), "w", encoding="utf-8"), indent=2)
print(json.dumps(summary, indent=2))
