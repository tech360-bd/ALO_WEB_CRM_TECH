# Aston Official Verification Evidence
Generated: 2026-07-31T21:02:04Z
Project: /Users/alaminn/Downloads/workspace-39fb1a01-5f16-4a6f-ab7d-88429dec6466 (9)

## Command Status
prisma-format=0
prisma-validate=0
prisma-generate=0
aston-unit=0
db-create=0
db-migrate=0
aston-live-smoke=0
db-evidence-counts=0
aston-unit-after-paths=0
aston-live-smoke-after-paths=0
db-evidence-counts-after-paths=0
typecheck=2
typecheck-rerun=0
lint-final=0
vitest-final=0
build-final=0
db-drop=0

## Aston Report
{
  "generatedAt": "2026-07-31T20:52:33.406Z",
  "startedAt": "2026-07-31T20:52:20.487Z",
  "adapter": "AstonAdapter",
  "status": "PARTIAL_ASTON_OFFICIAL_SMOKE",
  "writeDb": true,
  "catalogUrl": "https://www.aston.ac.uk/courses-atoz",
  "catalogHttpStatus": 200,
  "catalogPageTitle": "Courses - A to Z | Aston University",
  "catalogEntriesDiscovered": 471,
  "uniqueCoursePagesSelectedForSmoke": 3,
  "individualCoursePagesChecked": 3,
  "coursesParsed": 3,
  "intakeRecordsParsed": 2,
  "parsingFailures": 0,
  "verifiedCourses": 0,
  "needsReviewCourses": 3,
  "note": "This is an Aston official-source smoke crawl. It does not publish course rows and does not complete full Aston verification."
}
## Runtime HTTP
Sat Aug  1 03:01:42 +06 2026

### /admin/source-verification
status=200 content_type=text/html; charset=utf-8
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/03004833234a4706.css" data-precedence="next"

### /crm/source-verification
status=200 content_type=text/html; charset=utf-8
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/03004833234a4706.css" data-precedence="next"

### /api/crm/source-verification
status=401 content_type=application/json
HTTP/1.1 401 Unauthorized
content-type: application/json
Vary: Accept-Encoding
Date: Fri, 31 Jul 2026 21:01:42 GMT
Connection: keep-alive
body_sample={"success":false,"error":"Authentication required"}

### /api/course-finder
status=200 content_type=application/json
HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
Date: Fri, 31 Jul 2026 21:01:42 GMT
Connection: keep-alive
body_sample={"success":true,"courses":[],"total":0,"page":1,"limit":20,"pages":0}
