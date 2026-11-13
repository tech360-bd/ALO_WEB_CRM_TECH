#!/usr/bin/env python3
"""Offline integrity check for the evidence-backed 13-month Aston subset."""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/official-source-audit/aston-ai-msc-2027-monthly-staging.json"
QUEUE = ROOT / "data/official-source-audit/destination-research-queue.json"

with DATA.open(encoding="utf-8") as stream:
    dataset = json.load(stream)
course = dataset["course"]
months = course["months"]
expected = [f"2027-{month:02d}" for month in range(1, 13)] + ["2028-01"]
assert [row["calendarMonth"] for row in months] == expected, "Coverage rows must be ordered and contiguous Jan 2027–Jan 2028"
assert len({row["calendarMonth"] for row in months}) == 13
available = [row["calendarMonth"] for row in months if row["availabilityStatus"] == "VERIFIED_AVAILABLE"]
assert available == ["2027-01", "2027-04", "2027-09"], available
unpublished = [row["calendarMonth"] for row in months if row["availabilityStatus"] == "NOT_PUBLISHED"]
assert len(unpublished) == 10
assert all(row.get("tuitionAmount") is None for row in months), "2026/27 fee must not be copied into 2027/28 monthly rows"
assert all(row.get("applicationCloseDate") is None and row.get("internationalDeadline") is None for row in months)
assert dataset["institution"]["catalogueTraversalComplete"] is False
assert dataset["institution"]["facultiesTraversed"] == 0
assert dataset["institution"]["departmentsTraversed"] == 0
assert len(course["sources"]) == 5
assert all(urlparse(source["url"]).scheme == "https" and urlparse(source["url"]).hostname == "www.aston.ac.uk" for source in course["sources"])
assert course["publishedFeeEvidence"]["academicYear"] == "2026/27"
assert course["publishedFeeEvidence"]["internationalAnnualTuition"] == 24800
assert "NOT been copied" in course["publishedFeeEvidence"]["applicabilityNote"]
assert sum(len(row.get("scholarshipDetails", [])) for row in months) == 6
with QUEUE.open(encoding="utf-8") as stream:
    destinations = json.load(stream)
assert len(destinations) == 12
assert sum(row["research_status"] == "PARTIAL_RESEARCH" for row in destinations) == 1
assert sum(row["research_status"] == "NOT_STARTED" for row in destinations) == 11

print(json.dumps({
    "status": "PASS",
    "coursePagesOpened": 1,
    "officialUrlsOpened": len(course["sources"]),
    "monthlyRows": len(months),
    "verifiedAvailableMonths": available,
    "notPublishedMonths": len(unpublished),
    "verified2027Or2028TuitionRows": 0,
    "scholarshipMonthAssociations": 6,
    "destinationCountriesTracked": len(destinations),
    "completeInstitutionCatalogues": 0,
    "liveDatabaseWrites": 0,
}, indent=2))
