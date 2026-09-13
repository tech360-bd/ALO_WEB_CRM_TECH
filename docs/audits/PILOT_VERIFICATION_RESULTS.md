# Pilot Verification Results — 10 University Sources

## Pilot Date
August 22, 2026

## Pilot Scope
- 10 University Official sources
- HTTP GET request with 10-second timeout
- Follow redirects
- Capture title, content hash, response time

## Results

| # | University | URL | HTTP Status | Time | Title | Result |
|---|------------|-----|-------------|------|-------|--------|
| 1 | Aberystwyth University | aber.ac.uk | 200 | 1617ms | Aberystwyth University | ✅ URL_RESPONDS |
| 2 | Abu Dhabi University | adu.ac.ae | 200 | 150ms | N/A | ⚠️ URL_RESPONDS (no title) |
| 3 | Advenio Academy | advenioacademy.com | 0 | 8ms | ERROR: fetch failed | ❌ BROKEN |
| 4 | Aix-Marseille University | univ-amu.fr | 200 | 851ms | Accueil | Aix Marseille Université | ✅ URL_RESPONDS |
| 5 | Ajman University | ajman.ac.ae | 200 | 1301ms | Ajman University | ✅ URL_RESPONDS |
| 6 | Ajou University | ajou.ac.kr | 404 | 719ms | Error | ❌ NOT_FOUND |
| 7 | Al Ain University | alainuniversity.ae | 0 | 548ms | ERROR: fetch failed | ❌ BROKEN |
| 8 | American College Dublin | amcd.ie | 0 | 5ms | ERROR: fetch failed | ❌ BROKEN |
| 9 | American University in Dubai | aud.edu | 200 | 722ms | American University in Dubai | ✅ URL_RESPONDS |
| 10 | American University of Cyprus | auc.edu.cy | 0 | 5ms | ERROR: fetch failed | ❌ BROKEN |

## Summary

| Status | Count | % |
|--------|-------|---|
| HTTP 200 (URL_RESPONDS) | 5 | 50% |
| HTTP 404 (NOT_FOUND) | 1 | 10% |
| Fetch failed (BROKEN) | 4 | 40% |

## SourceSnapshots Created
- 5 snapshots created (for HTTP 200 sources only)

## DataChanges Created
- 0 (first check — baseline only)

## ApprovalQueueItems Created
- 0 (no changes detected on first check)

## Key Findings

1. **50% success rate** — 5 out of 10 URLs responded with HTTP 200
2. **40% broken URLs** — 4 URLs failed completely (DNS resolution or connection refused)
3. **1 wrong URL** — Ajou University returned 404
4. **No identity verification performed** — HTTP 200 does NOT confirm the page belongs to the intended university
5. **No content extraction performed** — only title and hash were captured

## Conclusion

The pilot demonstrates that:
- The verification infrastructure WORKS (HTTP requests, snapshots, updates)
- But the URL quality from the JSON import is POOR (40% broken)
- Full verification will require URL correction for many sources
- The monitoring engine needs to handle failures gracefully
- Rate limiting is needed for full-scale runs

## Status: NEEDS_REVIEW

The pilot passed technically (infrastructure works) but revealed significant data quality issues with the auto-generated URLs.
