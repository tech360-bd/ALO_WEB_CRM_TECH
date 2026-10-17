#!/usr/bin/env python3
"""Build review-only candidate queues from repository CSV evidence.

This script does not connect to a database and does not mark rows verified.
Aston course IDs are re-used from the existing master by exact official URL;
all course-page facts not present in the directory-discovery artifact remain
blank. Foreign university URLs are copied as unreviewed candidates from the
existing ALO master.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "catalogue-review"
DISCOVERY = ROOT / "data" / "official-source-audit" / "aston_course_discovery.csv"
COURSE_MASTER = ROOT / "ALO_COURSE_MASTER.csv"
UNIVERSITY_MASTER = ROOT / "ALO_UNIVERSITY_MASTER.csv"
ASTON_UNIVERSITY_ID = "UNI-UN-0039"
QUEUE_DATE = "2026-10-14"


FOREIGN_SHORTLIST = [
    ("Australia", "University of Melbourne"),
    ("Australia", "University of Sydney"),
    ("Australia", "Australian National University"),
    ("Australia", "University of New South Wales"),
    ("Australia", "University of Queensland"),
    ("Australia", "Monash University"),
    ("Australia", "RMIT University"),
    ("Australia", "Deakin University"),
    ("New Zealand", "University of Auckland"),
    ("New Zealand", "University of Otago"),
    ("New Zealand", "University of Canterbury"),
    ("New Zealand", "Victoria University of Wellington"),
    ("New Zealand", "Massey University"),
    ("New Zealand", "Auckland University of Technology"),
    ("Canada", "University of Toronto"),
    ("Canada", "University of British Columbia"),
    ("Canada", "McGill University"),
    ("Canada", "University of Alberta"),
    ("Canada", "University of Waterloo"),
    ("Canada", "University of Calgary"),
    ("Ireland", "Trinity College Dublin"),
    ("Ireland", "University College Dublin"),
    ("United States", "Massachusetts Institute of Technology"),
    ("United States", "Harvard University"),
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def build_aston_queue() -> int:
    discovery_rows = read_csv(DISCOVERY)
    master_rows = read_csv(COURSE_MASTER)
    universities = read_csv(UNIVERSITY_MASTER)
    aston = next((row for row in universities if row.get("university_id") == ASTON_UNIVERSITY_ID), None)
    if not aston:
        raise SystemExit(f"Aston university ID {ASTON_UNIVERSITY_ID} not found in {UNIVERSITY_MASTER.name}")

    master_by_url: dict[str, dict[str, str]] = {}
    for row in master_rows:
        url = (row.get("official_course_url") or row.get("course_url") or "").strip()
        if not url:
            continue
        if url in master_by_url:
            raise SystemExit(f"Duplicate official course URL in ALO_COURSE_MASTER.csv: {url}")
        master_by_url[url] = row

    discovery_by_url: dict[str, dict[str, str]] = {}
    for row in discovery_rows:
        url = (row.get("url") or "").strip()
        if not url:
            raise SystemExit("Blank URL in Aston discovery CSV")
        if url in discovery_by_url:
            raise SystemExit(f"Duplicate discovery URL in Aston crawl: {url}")
        discovery_by_url[url] = row

    if len(discovery_by_url) != 471 or len(master_by_url) != 471 or set(discovery_by_url) != set(master_by_url):
        missing = sorted(set(discovery_by_url) - set(master_by_url))
        extra = sorted(set(master_by_url) - set(discovery_by_url))
        raise SystemExit(f"Aston URL reconciliation failed: discovered={len(discovery_by_url)}, master={len(master_by_url)}, missing={missing[:3]}, extra={extra[:3]}")

    fields = [
        "university_id", "university_name", "country", "university_website",
        "university_official_url", "university_source_url", "course_id", "course_title",
        "study_level", "course_official_url", "course_source_url", "international_eligibility",
        "intake_year", "intake_month", "application_deadline", "tuition_currency", "yearly_tuition",
        "total_tuition", "deposit_currency", "deposit_amount", "course_code", "source_catalogue_url",
        "source_content_hash", "discovery_status", "individual_course_page_checked",
        "verification_status", "publication_status", "discovered_on", "review_note",
    ]
    rows: list[dict[str, str]] = []
    course_ids: set[str] = set()
    for url, found in sorted(discovery_by_url.items(), key=lambda item: item[1].get("linkText", "").casefold()):
        master = master_by_url[url]
        course_id = (master.get("course_id") or "").strip()
        if master.get("university_id") != ASTON_UNIVERSITY_ID:
            raise SystemExit(f"Course {course_id} is assigned to the wrong university")
        if not course_id or course_id in course_ids:
            raise SystemExit(f"Missing or repeated Aston course ID: {course_id}")
        course_ids.add(course_id)
        rows.append({
            "university_id": ASTON_UNIVERSITY_ID,
            "university_name": "Aston University",
            "country": "United Kingdom",
            "university_website": (aston.get("website") or "").strip(),
            "university_official_url": (aston.get("official_university_url") or "").strip(),
            "university_source_url": (found.get("sourceUrl") or "").strip(),
            "course_id": course_id,
            # Keep the official directory link label; do not substitute generated master prose.
            "course_title": (found.get("linkText") or "").strip(),
            "study_level": "",
            "course_official_url": url,
            "course_source_url": (found.get("sourceUrl") or "").strip(),
            "international_eligibility": "not_verified",
            "intake_year": "",
            "intake_month": "",
            "application_deadline": "",
            "tuition_currency": "",
            "yearly_tuition": "",
            "total_tuition": "",
            "deposit_currency": "",
            "deposit_amount": "",
            # Existing ALO_COURSE_MASTER identifiers are not treated as official course codes.
            "course_code": "",
            "source_catalogue_url": (found.get("sourceUrl") or "").strip(),
            "source_content_hash": (found.get("contentHash") or "").strip(),
            "discovery_status": "official_directory_link_discovered",
            "individual_course_page_checked": "false",
            "verification_status": "NEEDS_REVIEW",
            "publication_status": "draft",
            "discovered_on": "2026-07-31",
            "review_note": "Directory link only; page content, course status, intake, fees, requirements and international eligibility are not verified.",
        })

    write_csv(OUTPUT / "aston-course-discovery-candidates.csv", fields, rows)
    return len(rows)


def build_uk_review_queue() -> tuple[int, dict[str, int]]:
    source_rows = read_csv(UNIVERSITY_MASTER)
    uk_rows = [row for row in source_rows if row.get("country") == "United Kingdom"]
    ids = [row.get("university_id", "").strip() for row in uk_rows]
    if len(uk_rows) != 140 or len(set(ids)) != 140 or not all(ids):
        raise SystemExit(f"Expected 140 unique UK university IDs in ALO master; found {len(uk_rows)} rows / {len(set(ids))} IDs")
    fields = [
        "university_id", "university_name", "country", "university_website",
        "university_official_url", "university_source_url", "course_id", "course_title",
        "official_international_url_candidate", "official_course_catalogue_url_candidate",
        "master_ranking_claim_text", "master_ranking_source_text", "ranking_provider",
        "ranking_edition", "world_rank", "ranking_source_url", "ranking_verification_status",
        "master_verification_status", "queue_status", "publication_status",
        "course_catalogue_status", "master_last_verified_at_candidate", "source_master", "review_note",
    ]
    rows: list[dict[str, str]] = []
    for source in sorted(uk_rows, key=lambda row: row.get("university_name", "").casefold()):
        official_url = (source.get("official_university_url") or "").strip()
        rows.append({
            "university_id": (source.get("university_id") or "").strip(),
            "university_name": (source.get("university_name") or "").strip(),
            "country": "United Kingdom",
            "university_website": (source.get("website") or official_url).strip(),
            "university_official_url": official_url,
            "university_source_url": (source.get("primary_source") or official_url).strip(),
            "course_id": "",
            "course_title": "",
            "official_international_url_candidate": (source.get("official_international_url") or "").strip(),
            "official_course_catalogue_url_candidate": (source.get("official_course_catalogue_url") or "").strip(),
            "master_ranking_claim_text": (source.get("ranking_information") or "").strip(),
            "master_ranking_source_text": (source.get("ranking_source") or "").strip(),
            "ranking_provider": "",
            "ranking_edition": "",
            "world_rank": "",
            "ranking_source_url": "",
            "ranking_verification_status": "NOT_VERIFIED",
            "master_verification_status": (source.get("verification_status") or "").strip(),
            "queue_status": "NEEDS_REVIEW",
            "publication_status": "draft",
            "course_catalogue_status": "NOT_CHECKED",
            "master_last_verified_at_candidate": (source.get("last_verified_at") or "").strip(),
            "source_master": "ALO_UNIVERSITY_MASTER.csv (unreviewed candidate row)",
            "review_note": "Candidate only; verify profile, ranking provider/edition/rank/source URL and the full official international course catalogue before publication.",
        })
    status_counts: dict[str, int] = {}
    for row in rows:
        status = row["master_verification_status"] or "BLANK"
        status_counts[status] = status_counts.get(status, 0) + 1
    write_csv(OUTPUT / "uk-university-profile-review-queue.csv", fields, rows)
    return len(rows), status_counts


def build_foreign_shortlist() -> tuple[int, dict[str, int]]:
    master_rows = read_csv(UNIVERSITY_MASTER)
    by_name_country = {(row.get("university_name", "").strip().casefold(), row.get("country", "").strip()): row for row in master_rows}
    fields = [
        "university_id", "university_name", "country", "university_website",
        "university_official_url", "university_source_url", "course_id", "course_title",
        "course_official_url", "course_source_url", "international_eligibility", "intake_year", "intake_month",
        "official_university_url", "official_international_url", "course_catalogue_url", "ranking_provider", "ranking_edition",
        "world_rank", "bangladesh_market_priority_basis", "market_popularity_status",
        "university_source_status", "course_catalogue_status", "verification_status",
        "publication_status", "source_master", "shortlist_created_on", "review_note",
    ]
    rows: list[dict[str, str]] = []
    counts: dict[str, int] = {}
    seen_ids: set[str] = set()
    for country, name in FOREIGN_SHORTLIST:
        source = by_name_country.get((name.casefold(), country))
        if not source:
            raise SystemExit(f"Foreign shortlist candidate not found in ALO master: {country} / {name}")
        uid = (source.get("university_id") or "").strip()
        if not uid or uid in seen_ids:
            raise SystemExit(f"Missing or repeated university ID for {country} / {name}: {uid}")
        seen_ids.add(uid)
        url = (source.get("official_university_url") or "").strip()
        if not url:
            raise SystemExit(f"No candidate official URL in ALO master for {country} / {name}")
        rows.append({
            "university_id": uid,
            "university_name": name,
            "country": country,
            "university_website": url,
            "university_official_url": url,
            "university_source_url": url,
            "course_id": "",
            "course_title": "",
            "course_official_url": "",
            "course_source_url": "",
            "international_eligibility": "",
            "intake_year": "",
            "intake_month": "",
            "official_university_url": url,
            "official_international_url": (source.get("official_international_url") or "").strip(),
            "course_catalogue_url": "",
            "ranking_provider": "",
            "ranking_edition": "",
            "world_rank": "",
            "bangladesh_market_priority_basis": "DESTINATION_COVERAGE_SHORTLIST_ONLY",
            "market_popularity_status": "NOT_VERIFIED",
            "university_source_status": "NEEDS_OFFICIAL_URL_RECHECK",
            "course_catalogue_status": "NOT_CHECKED",
            "verification_status": "NEEDS_REVIEW",
            "publication_status": "draft",
            "source_master": "ALO_UNIVERSITY_MASTER.csv (existing unreviewed candidate row)",
            "shortlist_created_on": QUEUE_DATE,
            "review_note": "Existing candidate ID/URL only; verify official source, current status, Bangladesh market demand, ranking source, admissions facts and international course coverage before publication.",
        })
        counts[country] = counts.get(country, 0) + 1

    if len(rows) < 20:
        raise SystemExit("Foreign destination shortlist has fewer than 20 rows")
    write_csv(OUTPUT / "bangladesh-destination-review-shortlist.csv", fields, rows)
    return len(rows), counts


def main() -> None:
    aston_count = build_aston_queue()
    uk_count, uk_statuses = build_uk_review_queue()
    foreign_count, by_country = build_foreign_shortlist()
    print(f"Aston discovery queue: {aston_count} course-link candidates (individual pages not newly checked)")
    print(f"UK profile/ranking review queue: {uk_count} universities ({', '.join(f'{status}={count}' for status, count in uk_statuses.items())})")
    print(f"Bangladesh destination review queue: {foreign_count} universities ({', '.join(f'{country}={count}' for country, count in by_country.items())})")
    print("No database connection or verification/publication write was performed.")


if __name__ == "__main__":
    main()
