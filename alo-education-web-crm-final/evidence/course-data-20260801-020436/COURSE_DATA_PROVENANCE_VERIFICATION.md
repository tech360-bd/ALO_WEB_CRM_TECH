# Course Data Provenance Verification

Generated: 2026-07-31T20:11:44Z
Project: /Users/alaminn/Downloads/workspace-39fb1a01-5f16-4a6f-ab7d-88429dec6466 (9)

## Status
prisma-format=0
prisma-validate=0
prisma-generate=0
official-data-audit=0
mysql-create=0
mysql-migrate-deploy=0
mysql-schema-check=0
mysql-drop=0
typecheck=0
lint=1
vitest=1
build=0
test-db=alo_course_data_test_20260801020930
test-db-create=0
test-db-migrate=0
lint-rerun=0
vitest-rerun=0
test-db-drop=0
integration-db=alo_course_integration_20260801021122
integration-db-create=0
integration-db-migrate=0
integration-rerun=0
integration-db-drop=0
runtime-db-drop=0

## Runtime HTTP checks
Sat Aug  1 02:10:37 +06 2026

### /
status=200 content_type=text/html; charset=utf-8 redirect=
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/40896a00946e5828.css" data-precedence="next"

### /course-finder
status=200 content_type=text/html; charset=utf-8 redirect=
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="image" href="/images/landing/Copy of logo.webp"/><link rel="stylesh

### /universities
status=200 content_type=text/html; charset=utf-8 redirect=
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="image" href="/images/landing/Copy of logo.webp"/><link rel="stylesh

### /destinations
status=200 content_type=text/html; charset=utf-8 redirect=
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/40896a00946e5828.css" data-precedence="next"

### /crm/source-verification
status=200 content_type=text/html; charset=utf-8 redirect=
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000
body_sample=<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/40896a00946e5828.css" data-precedence="next"

### /api/course-finder
status=200 content_type=application/json redirect=
HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
Date: Fri, 31 Jul 2026 20:10:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

body_sample={"success":true,"courses":[],"total":0,"page":1,"limit":20,"pages":0}

### /api/crm/source-verification
status=401 content_type=application/json redirect=
HTTP/1.1 401 Unauthorized
content-type: application/json
Vary: Accept-Encoding
Date: Fri, 31 Jul 2026 20:10:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

body_sample={"success":false,"error":"Authentication required"}

### /api/crm/course-import/stats
status=401 content_type=application/json redirect=
HTTP/1.1 401 Unauthorized
content-type: application/json
Vary: Accept-Encoding
Date: Fri, 31 Jul 2026 20:10:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

body_sample={"success":false,"error":"Authentication required"}

## MySQL schema check
table_count
217
Tables_in_alo_course_data_test_20260801020554 (CrmDiscoverySource)
CrmDiscoverySource
Tables_in_alo_course_data_test_20260801020554 (CrmDiscoveryRecord)
CrmDiscoveryRecord
Tables_in_alo_course_data_test_20260801020554 (CrmRanking)
CrmRanking
Tables_in_alo_course_data_test_20260801020554 (CrmSourceVerificationEvent)
CrmSourceVerificationEvent
