# Course URL Mapping Audit

## Summary

| Metric | Count |
|--------|-------|
| Total courses | 17,653 |
| Courses with sourceUrl | 17,653 (100%) |
| Courses without sourceUrl | 0 |
| Unique sourceUrls | 5,509 |
| URLs shared by multiple courses | 2,881 |

## URL Sharing Analysis

### Why URLs are shared:
Many courses at the same university share a common course page URL pattern. For example:
- `https://www.law.ac.uk/courses/foundation-certificate-in-llb-law` → shared by 35 courses (different campuses)
- `https://www.qmul.ac.uk/malta/courses/foundation-certificate-in-medicine` → shared by 32 courses

### Top 5 Most Shared URLs:
| Courses | URL |
|---------|-----|
| 35 | https://www.law.ac.uk/courses/foundation-certificate-in-llb-law |
| 33 | https://www.law.ac.uk/courses/bsc-hons-llm-legal-practice |
| 32 | https://www.qmul.ac.uk/malta/courses/foundation-certificate-in-medicine |
| 30 | https://www.qmul.ac.uk/malta/courses/msc-medicine |
| 29 | https://nyuad.nyu.edu/courses/foundation-certificate-in-computer-science |

## URL Path Patterns

| Pattern | Count | Type |
|---------|-------|------|
| /courses/ | 16,899 | University course page (auto-generated) |
| /study/ | 470 | Alternative course path |
| /malta/ | 145 | Malta campus |
| /dubai/ | 123 | Dubai campus |

## Critical Finding

All 17,653 course URLs follow the pattern `{university_domain}/courses/{course-slug}`. These URLs were **auto-generated** during the JSON import — they were NOT discovered by visiting actual university websites. The URL may or may not exist on the actual university website.

## Status

| Status | Count |
|--------|-------|
| AUTO_GENERATED_URL | 17,653 (100%) |
| HTTP_VERIFIED | 0 (0%) |
| BROKEN | Unknown (not tested) |
| THIRD_PARTY | 0 (0%) — all appear to be university domains |
