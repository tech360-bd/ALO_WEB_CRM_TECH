# PhD source verification record

_Register retrieved 2026-10-25 · verification status as of 2026-10-26_

## 1. Why this file exists

The PhD module must never present an institutional claim as fact because a search
result or a homepage existed. Every claim it stores carries:

- the exact URL it came from,
- an excerpt,
- the authority of that source (`OFFICIAL_PRIMARY`, `GOVERNMENT`, `SECONDARY`, …),
- a verification status, and
- the retrieval date.

This file records where the 27 target institutions stand. It is the human-readable
counterpart of the Source Verification Centre (`/api/phd/sources`).

## 2. Status vocabulary

| Status | Meaning |
|---|---|
| `NOT_YET_VERIFIED` | A URL has been located but nobody has confirmed the claim on the page |
| `SECONDARY_SOURCE_ONLY` | Only an aggregator or secondary article supports the claim |
| `VERIFIED_MAY_BE_OUTDATED` | Verified once; the re-verification date has passed |
| `VERIFIED_OFFICIAL` | Two reviewers confirmed the claim on the institution's own domain, with an archived snapshot |
| `SOURCE_UNAVAILABLE` | The page could not be retrieved (network, 403, robots, login wall) — **not** evidence the programme does not exist |
| `PROGRAMME_NOT_FOUND` | The specific programme is absent from an official page that was successfully read |
| `CONFIRMED_UNAVAILABLE` | The institution states the programme is closed or withdrawn |

## 3. Current state of the register

**Retrieved, not verified.** The 27 research-degree URLs below were located during
desk research on 2026-10-25. That is retrieval only. None has been marked
`VERIFIED_OFFICIAL`, because the two required steps have not happened in this
environment:

1. **Archiving.** No archive service is reachable from the build environment
   (outbound network is limited to GitHub and the package registries), so no
   snapshot hash can be recorded.
2. **Second review.** The rule is that the first reviewer locates the page and a
   second reviewer independently opens the archived copy and confirms the specific
   claim (research degree offered, URL stable, contact route). That second review
   has not taken place.

Consequently, every institution row in the database remains
`researchDegreesStatus = NOT_YET_VERIFIED`, and the public research directory
shows **no programmes** until a programme is individually verified. This is the
intended behaviour: an empty verified catalogue is honest; a populated one built
from unverified links is not.

## 4. The 27 target institutions

| # | Institution | Domain | Research-degrees URL (retrieved) | Page title | Status |
|---|---|---|---|---|---|
| 1 | University of Leicester | `le.ac.uk` | <https://le.ac.uk/study/research-degrees/research-subjects/management> | Research degrees — Management | `NOT_YET_VERIFIED` |
| 2 | University of East London | `uel.ac.uk` | <https://www.uel.ac.uk/postgraduate/courses/mphil-phd-school-business-law> | MPhil/PhD — School of Business and Law | `NOT_YET_VERIFIED` |
| 3 | Aston University | `aston.ac.uk` | <https://www.aston.ac.uk/study/courses/phd-aston-business-school> | PhD — Aston Business School | `NOT_YET_VERIFIED` |
| 4 | Edinburgh Napier University | `napier.ac.uk` | <https://www.napier.ac.uk/research-and-innovation/doctoral-college/fees-forms-and-funding> | Doctoral College — fees, forms and funding | `NOT_YET_VERIFIED` |
| 5 | Swansea University | `swansea.ac.uk` | <https://www.swansea.ac.uk/postgraduate/research/aerospace-civil-electrical-mechanical-engineering/civil/phd-mphil-civil-engineering/> | PhD/MPhil — Civil Engineering | `NOT_YET_VERIFIED` |
| 6 | Teesside University | `tees.ac.uk` | <https://www.tees.ac.uk/sections/research/degrees_opportunities.cfm> | Research degrees and opportunities | `NOT_YET_VERIFIED` |
| 7 | Nottingham Trent University | `ntu.ac.uk` | <https://www.ntu.ac.uk/course/nottingham-business-school/res/phd-research-degrees-at-nottingham-business-school> | PhD research degrees at Nottingham Business School | `NOT_YET_VERIFIED` |
| 8 | Liverpool Hope University | `hope.ac.uk` | <https://www.hope.ac.uk/postgraduateresearch/howtoapply/applyonline/> | Postgraduate research — how to apply | `NOT_YET_VERIFIED` |
| 9 | Bangor University | `bangor.ac.uk` | <https://www.bangor.ac.uk/courses/postgraduate-research/accounting-banking-economics-finance-management-studies-and-marketing> | Research degrees — Accounting, Banking, Economics, Finance, Management and Marketing | `NOT_YET_VERIFIED` |
| 10 | University of Hull | `hull.ac.uk` | <https://www.hull.ac.uk/study/postgraduate/research/engineering-research-degrees> | Engineering research degrees | `NOT_YET_VERIFIED` |
| 11 | Abertay University | `abertay.ac.uk` | <https://www.abertay.ac.uk/course-search/postgraduate-research/business-and-management/> | Postgraduate research — Business and Management | `NOT_YET_VERIFIED` |
| 12 | Cardiff Metropolitan University | `cardiffmet.ac.uk` | <https://www.cardiffmet.ac.uk/research/research-degrees/> | Research degrees | `NOT_YET_VERIFIED` |
| 13 | University of Gloucestershire | `glos.ac.uk` | <https://www.glos.ac.uk/courses/course/rsbse-phd-business-and-management/> | PhD Business and Management | `NOT_YET_VERIFIED` |
| 14 | University of the West of Scotland | `uws.ac.uk` | <https://www.uws.ac.uk/study/research-degrees/study-options/engineering/> | Research degrees — Engineering | `NOT_YET_VERIFIED` |
| 15 | University of Portsmouth | `port.ac.uk` | <https://www.port.ac.uk/study/courses/postgraduate-research/business-and-management-postgraduate-research-degrees> | Business and Management postgraduate research degrees | `NOT_YET_VERIFIED` |
| 16 | University of Liverpool | `liverpool.ac.uk` | <https://www.liverpool.ac.uk/courses/management-phd> | Management PhD | `NOT_YET_VERIFIED` |
| 17 | University of Plymouth | `plymouth.ac.uk` | <https://www.plymouth.ac.uk/courses/postgraduate/phd-business-with-management> | PhD Business with Management | `NOT_YET_VERIFIED` |
| 18 | University of Bradford | `bradford.ac.uk` | <https://www.bradford.ac.uk/courses/pg/phd-management/> | PhD Management | `NOT_YET_VERIFIED` |
| 19 | University of Salford | `salford.ac.uk` | <https://www.salford.ac.uk/courses/postgraduate-researchdoctorate/business-management-and-law> | Business, Management and Law postgraduate research | `NOT_YET_VERIFIED` |
| 20 | University of Lincoln | `lincoln.ac.uk` | <https://www.lincoln.ac.uk/course/mgtmgtrp/> | Management research degrees | `NOT_YET_VERIFIED` |
| 21 | University of Derby | `derby.ac.uk` | <https://www.derby.ac.uk/research/degrees/applicants/> | Research degrees — applicants | `NOT_YET_VERIFIED` |
| 22 | Goldsmiths, University of London | `gold.ac.uk` | <https://www.gold.ac.uk/pg/mphil-phd-management/> | MPhil/PhD Management | `NOT_YET_VERIFIED` |
| 23 | Queen Mary University of London | `qmul.ac.uk` | <https://www.qmul.ac.uk/postgraduate/research/subjects/business-and-management.html> | Research degrees — Business and Management | `NOT_YET_VERIFIED` |
| 24 | University of Bath | `bath.ac.uk` | <https://www.bath.ac.uk/courses/postgraduate-research/phd-management-full-time/> | PhD Management (full-time) | `NOT_YET_VERIFIED` |
| 25 | Anglia Ruskin University | `aru.ac.uk` | <https://www.aru.ac.uk/study/postgraduate/business-and-management> | Postgraduate research — Business and Management | `NOT_YET_VERIFIED` |
| 26 | Heriot-Watt University | `hw.ac.uk` | <https://www.hw.ac.uk/study/research/business-administration-dba-phd> | Business Administration DBA/PhD | `NOT_YET_VERIFIED` |
| 27 | Bath Spa University | `bathspa.ac.uk` | <https://www.bathspa.ac.uk/how-to-apply/research-degrees/choose-a-research-degree/> | Choose a research degree | `NOT_YET_VERIFIED` |

Regent's University London is deliberately **absent** from this register: the
supplied Spring 2027 commission structure excludes it from the commission-eligible
PhD list. It must never be marked commission-eligible for a PhD.

## 5. Procedure to promote a row to `VERIFIED_OFFICIAL`

1. Open the URL from a clean session. Respect `robots.txt`, any rate limit and any
   login wall; stop on `403`/`429` and record `SOURCE_UNAVAILABLE` with the reason.
2. Save an immutable snapshot (WARC/PDF) and record its checksum and the retrieval
   timestamp in `PhdSourceEvidence` (`sourceAuthority = OFFICIAL_PRIMARY`,
   `excerpt` = the exact sentence that supports the claim).
3. A second reviewer opens the snapshot, confirms the excerpt, and records a review
   decision through `PATCH /api/phd/sources/{evidenceId}`.
4. Only then update `PhdUniversity.researchDegreesStatus` /
   `PhdProgramme.verificationStatus`, with `lastVerifiedAt` and `nextVerificationAt`.
5. Add a `PhdVerificationEvent`. Statuses are appended, never overwritten silently.

## 6. Re-verification

- Programmes: every 180 days by default; a page whose `nextVerificationAt` has
  passed is reported by the `phd-maintenance` cron job as **stale** (report only —
  it is never silently downgraded or re-dated).
- Fees and funding: at least once per academic year, and immediately when a closing
  date passes.

## 7. What the register is not

- It is not a ranking, a recommendation or an admission-likelihood score.
- It is not a licence to copy university prose, prospectus PDFs, photographs or
  logos. Only the official title, a short ALO-written factual summary and the link
  are stored.
- It is not proof of supervisor availability. Availability is a separate field with
  its own source and date.
