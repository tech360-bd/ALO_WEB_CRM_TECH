#!/usr/bin/env python3
"""
PHASE 0C data inventory — read-only.

For every CSV / JSON / SQL dataset in the repository (root masters, docs/import
templates, data/, storage/, nested project copies, AUDIT artefacts) record:
  path, role, bytes, rows/records, detected subject, header, candidate keys,
  duplicate rows, duplicates on the candidate key, https-source share,
  verification-label distribution.

Emits: datasets.csv and dataset-summary.json
"""
import csv, hashlib, json, os, re, sys
from collections import Counter, defaultdict

ROOT = "/home/user/ALO_WEB_CRM_TECH"
OUT = os.path.join(ROOT, "docs/audit-2026-11-02")
INV = os.path.join(OUT, "inventory.csv")

SUBJECT_RULES = [
    ("scholarship", ["scholarship"]),
    ("tuition_fee", ["tuition_fee", "yearly_tuition", "fee_amount", "tuition_currency"]),
    ("intake", ["intake_year", "intake_month", "intake_name"]),
    ("deadline", ["application_deadline", "deadline"]),
    ("requirement", ["academic_req", "ielts_overall", "entry_requirement", "english_requirement", "academic_requirement"]),
    ("campus", ["campus_name", "campus_id", "campuses_count"]),
    ("source", ["source_url", "official_source_url", "source_count", "primary_source"]),
    ("ranking", ["world_ranking", "ranking_provider", "ranking_information"]),
    ("university", ["university_name", "university_id", "official_university_url", "institution_type"]),
    ("course", ["course_title", "course_name", "course_id", "degree_level", "study_level"]),
]
KEY_HINTS = [
    ("university", ["university_id", "university_name"]),
    ("course", ["course_id", "university_id", "course_title"]),
    ("course", ["course_id", "university_id", "course_name"]),
    ("intake", ["course_id", "intake_year", "intake_month"]),
    ("requirement", ["course_id"]),
    ("deadline", ["course_id", "intake_year", "intake_month"]),
    ("tuition_fee", ["course_id", "intake_year", "intake_month"]),
    ("scholarship", ["university_id", "scholarship_name"]),
    ("campus", ["campus_id"]),
    ("university", ["university_id"]),
    ("course", ["course_id"]),
]
VERIF_FIELDS = ["verification_status", "verificationStatus", "status", "publication_status"]


def detect_subject(header):
    low = [h.lower() for h in header]
    score = Counter()
    for name, needles in SUBJECT_RULES:
        for n in needles:
            if n in low:
                score[name] += 1
    return score.most_common(1)[0][0] if score else "other"


def pick_key(header, subject):
    low = {h.lower(): h for h in header}
    for subj, parts in KEY_HINTS:
        if subj != subject:
            continue
        if all(p in low for p in parts):
            return [low[p] for p in parts]
    for subj, parts in KEY_HINTS:
        if all(p in low for p in parts):
            return [low[p] for p in parts]
    return []


def https_share(rows, header):
    url_cols = [h for h in header if "url" in h.lower() or "link" in h.lower()]
    if not url_cols:
        return None
    ok = 0
    for r in rows:
        if any((r.get(c) or "").strip().lower().startswith("https://") for c in url_cols):
            ok += 1
    return round(ok / len(rows), 4) if rows else None


def verify_mix(rows):
    out = {}
    for f in VERIF_FIELDS:
        vals = Counter((r.get(f) or "").strip() for r in rows if f in r)
        if vals:
            out[f] = dict(vals.most_common(6))
    return out


records = []
rows_total = 0
with open(INV, newline="", encoding="utf-8") as fh:
    inv = list(csv.DictReader(fh))

for entry in inv:
    ext = entry["ext"]
    if ext not in {"csv", "json", "sql", "xlsx", "xls", "tsv"}:
        continue
    path = os.path.join(ROOT, entry["path"])
    size = int(entry["bytes"])
    rec = {"path": entry["path"], "area": entry["area"], "role": entry["role"], "ext": ext,
           "bytes": size, "rows": "", "subject": "", "key": "", "duplicate_rows": "",
           "duplicate_key_rows": "", "https_source_share": "", "verification": "", "note": ""}
    try:
        if ext in {"csv", "tsv"}:
            delim = "\t" if ext == "tsv" else ","
            with open(path, newline="", encoding="utf-8", errors="replace") as fh:
                reader = csv.DictReader(fh, delimiter=delim)
                header = reader.fieldnames or []
                data = list(reader)
            rec["rows"] = len(data)
            rows_total += len(data)
            rec["subject"] = detect_subject(header)
            key = pick_key(header, rec["subject"])
            rec["key"] = "+".join(key)
            rec["header"] = ",".join(header[:40])
            raw = Counter(tuple((r.get(h) or "").strip().lower() for h in header) for r in data)
            rec["duplicate_rows"] = sum(v - 1 for v in raw.values() if v > 1)
            if key:
                kc = Counter(tuple((r.get(k) or "").strip().lower() for k in key) for r in data)
                rec["duplicate_key_rows"] = sum(v - 1 for v in kc.values() if v > 1)
                rec["unique_key_rows"] = len(kc)
            rec["https_source_share"] = https_share(data, header)
            rec["verification"] = json.dumps(verify_mix(data))[:220]
        elif ext == "json":
            if size > 20 * 1024 * 1024:
                rec["note"] = "large JSON — structure sampled, not loaded"
                with open(path, encoding="utf-8", errors="replace") as fh:
                    head = fh.read(4000)
                m = re.findall(r'"(\w+)"\s*:', head[:4000])
                rec["header"] = ",".join(dict.fromkeys(m))[:200]
            else:
                with open(path, encoding="utf-8", errors="replace") as fh:
                    payload = json.load(fh)
                if isinstance(payload, dict):
                    keys = list(payload.keys())
                    rec["header"] = ",".join(keys)[:200]
                    lists = {k: len(v) for k, v in payload.items() if isinstance(v, list)}
                    rec["rows"] = sum(lists.values())
                    rows_total += rec["rows"]
                    rec["subject"] = detect_subject(list(lists.keys()) or keys)
                    rec["note"] = "object: " + json.dumps(lists)[:200]
                elif isinstance(payload, list):
                    rec["rows"] = len(payload)
                    rows_total += rec["rows"]
                    if payload and isinstance(payload[0], dict):
                        header = list(payload[0].keys())
                        rec["header"] = ",".join(header)[:200]
                        rec["subject"] = detect_subject(header)
                        key = pick_key(header, rec["subject"])
                        rec["key"] = "+".join(key)
                        if key:
                            kc = Counter(tuple((str(r.get(k) or "")).strip().lower() for k in key) for r in payload if isinstance(r, dict))
                            rec["duplicate_key_rows"] = sum(v - 1 for v in kc.values() if v > 1)
                        rec["verification"] = json.dumps(verify_mix(payload))[:220]
        else:
            rec["note"] = "not parsed (sql/xlsx)"
    except Exception as exc:
        rec["note"] = f"parse error: {exc}"
    records.append(rec)

fields = ["path", "area", "role", "ext", "bytes", "rows", "subject", "key", "header",
          "unique_key_rows", "duplicate_rows", "duplicate_key_rows", "https_source_share", "verification", "note"]
with open(os.path.join(OUT, "datasets.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    w.writerows(records)

by_subject = defaultdict(lambda: {"files": 0, "rows": 0})
for r in records:
    s = r["subject"] or "other"
    by_subject[s]["files"] += 1
    if isinstance(r["rows"], int):
        by_subject[s]["rows"] += r["rows"]

summary = {
    "datasetFiles": len(records),
    "datasetRows": rows_total,
    "bySubject": dict(by_subject),
    "largest": sorted(({"path": r["path"], "bytes": r["bytes"], "rows": r["rows"]} for r in records),
                      key=lambda x: -x["bytes"])[:15],
}
with open(os.path.join(OUT, "dataset-summary.json"), "w", encoding="utf-8") as fh:
    json.dump(summary, fh, indent=2)
print(json.dumps({"datasetFiles": len(records), "datasetRows": rows_total, "bySubject": dict(by_subject)}, indent=2))
