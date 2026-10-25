/**
 * UK PhD target-institution register — 27 entries.
 *
 * Provenance policy
 * -----------------
 * Every entry below points at an official page on the institution's own domain.
 * The page was located during desk research on 2026-10-25 (see
 * docs/phd/SOURCE_VERIFICATION.md). That is *retrieval*, not verification: a
 * second reviewer must still open the archived page and confirm the specific
 * claim (research degree offered, URL stable, contact route) before the record
 * becomes `VERIFIED_OFFICIAL`.
 *
 * Rules enforced by the register:
 *   - `registerId` is immutable. Records are never deleted, renamed or merged.
 *   - An institution we cannot verify is marked `SOURCE_UNAVAILABLE` or
 *     `NOT_YET_VERIFIED`; it is never silently dropped or described as
 *     "not offered".
 *   - `officialDomain` must be the institution's own registrable domain.
 *   - Regent's University London is deliberately absent: the supplied Spring
 *     2027 commission structure excludes it from the commission-eligible PhD
 *     list, and it is not one of the 27 targets. It is handled separately in
 *     the commission register, not here.
 */

export const REGISTER_RETRIEVAL_DATE = '2026-10-25';

export interface InstitutionSeed {
  registerId: string;
  rank: number;
  slug: string;
  name: string;
  officialDomain: string;
  officialHomepage: string;
  researchDegreesUrl: string;
  researchDegreesPageTitle: string;
  /** Optional notes shown in the Source Verification Centre. */
  note?: string;
}

export const TARGET_INSTITUTIONS: InstitutionSeed[] = [
  {
    registerId: 'UK-PHD-001',
    rank: 1,
    slug: 'university-of-leicester',
    name: 'University of Leicester',
    officialDomain: 'le.ac.uk',
    officialHomepage: 'https://le.ac.uk',
    researchDegreesUrl: 'https://le.ac.uk/study/research-degrees/research-subjects/management',
    researchDegreesPageTitle: 'Research degrees — Management',
    note: 'Business PhD/MPhil offered on campus and by distance learning (school page). Full-time and part-time routes and writing-up fee are listed by the university.',
  },
  {
    registerId: 'UK-PHD-002',
    rank: 2,
    slug: 'university-of-east-london',
    name: 'University of East London',
    officialDomain: 'uel.ac.uk',
    officialHomepage: 'https://www.uel.ac.uk',
    researchDegreesUrl: 'https://www.uel.ac.uk/postgraduate/courses/mphil-phd-school-business-law',
    researchDegreesPageTitle: 'MPhil/PhD — School of Business and Law',
    note: 'Royal Docks campus. International fee published for the academic year covered by the page.',
  },
  {
    registerId: 'UK-PHD-003',
    rank: 3,
    slug: 'aston-university',
    name: 'Aston University',
    officialDomain: 'aston.ac.uk',
    officialHomepage: 'https://www.aston.ac.uk',
    researchDegreesUrl: 'https://www.aston.ac.uk/study/courses/phd-aston-business-school',
    researchDegreesPageTitle: 'PhD — Aston Business School',
    note: 'Business School PhD page lists January and October start points.',
  },
  {
    registerId: 'UK-PHD-004',
    rank: 4,
    slug: 'edinburgh-napier-university',
    name: 'Edinburgh Napier University',
    officialDomain: 'napier.ac.uk',
    officialHomepage: 'https://www.napier.ac.uk',
    researchDegreesUrl: 'https://www.napier.ac.uk/research-and-innovation/doctoral-college/fees-forms-and-funding',
    researchDegreesPageTitle: 'Doctoral College — fees, forms and funding',
    note: 'Doctoral College page covers the Business School and the School of Engineering and the Built Environment. Duration and fee framework are published per academic year.',
  },
  {
    registerId: 'UK-PHD-005',
    rank: 5,
    slug: 'swansea-university',
    name: 'Swansea University',
    officialDomain: 'swansea.ac.uk',
    officialHomepage: 'https://www.swansea.ac.uk',
    researchDegreesUrl: 'https://www.swansea.ac.uk/postgraduate/research/aerospace-civil-electrical-mechanical-engineering/civil/phd-mphil-civil-engineering/',
    researchDegreesPageTitle: 'PhD/MPhil — Civil Engineering',
    note: 'Engineering research degrees are advertised with multiple start points; the Bay Campus is the engineering campus. Business research degrees are on a separate school page.',
  },
  {
    registerId: 'UK-PHD-006',
    rank: 6,
    slug: 'teesside-university',
    name: 'Teesside University',
    officialDomain: 'tees.ac.uk',
    officialHomepage: 'https://www.tees.ac.uk',
    researchDegreesUrl: 'https://www.tees.ac.uk/sections/research/degrees_opportunities.cfm',
    researchDegreesPageTitle: 'Research degrees and opportunities',
    note: 'University research-degree pages publish entry requirements and a fee schedule separately from the course list.',
  },
  {
    registerId: 'UK-PHD-007',
    rank: 7,
    slug: 'nottingham-trent-university',
    name: 'Nottingham Trent University',
    officialDomain: 'ntu.ac.uk',
    officialHomepage: 'https://www.ntu.ac.uk',
    researchDegreesUrl: 'https://www.ntu.ac.uk/course/nottingham-business-school/res/phd-research-degrees-at-nottingham-business-school',
    researchDegreesPageTitle: 'PhD research degrees at Nottingham Business School',
    note: 'Business School research degrees have published October and January intakes; part-time study is listed for home students.',
  },
  {
    registerId: 'UK-PHD-008',
    rank: 8,
    slug: 'liverpool-hope-university',
    name: 'Liverpool Hope University',
    officialDomain: 'hope.ac.uk',
    officialHomepage: 'https://www.hope.ac.uk',
    researchDegreesUrl: 'https://www.hope.ac.uk/postgraduateresearch/howtoapply/applyonline/',
    researchDegreesPageTitle: 'Postgraduate research — how to apply',
    note: 'Application route and intake information are published by the postgraduate research office.',
  },
  {
    registerId: 'UK-PHD-009',
    rank: 9,
    slug: 'bangor-university',
    name: 'Bangor University',
    officialDomain: 'bangor.ac.uk',
    officialHomepage: 'https://www.bangor.ac.uk',
    researchDegreesUrl: 'https://www.bangor.ac.uk/courses/postgraduate-research/accounting-banking-economics-finance-management-studies-and-marketing',
    researchDegreesPageTitle: 'Research degrees — Accounting, Banking, Economics, Finance, Management and Marketing',
    note: 'Business research degrees are advertised at school level; international fees are on a separate university page.',
  },
  {
    registerId: 'UK-PHD-010',
    rank: 10,
    slug: 'university-of-hull',
    name: 'University of Hull',
    officialDomain: 'hull.ac.uk',
    officialHomepage: 'https://www.hull.ac.uk',
    researchDegreesUrl: 'https://www.hull.ac.uk/study/postgraduate/research/engineering-research-degrees',
    researchDegreesPageTitle: 'Engineering research degrees',
    note: 'Engineering and Business research degrees are published on separate pages with different durations and intake points.',
  },
  {
    registerId: 'UK-PHD-011',
    rank: 11,
    slug: 'abertay-university',
    name: 'Abertay University',
    officialDomain: 'abertay.ac.uk',
    officialHomepage: 'https://www.abertay.ac.uk',
    researchDegreesUrl: 'https://www.abertay.ac.uk/course-search/postgraduate-research/business-and-management/',
    researchDegreesPageTitle: 'Postgraduate research — Business and Management',
    note: 'Abertay advertises MbR, MPhil and PhD routes with multiple start points; tuition fees are published separately.',
  },
  {
    registerId: 'UK-PHD-012',
    rank: 12,
    slug: 'cardiff-metropolitan-university',
    name: 'Cardiff Metropolitan University',
    officialDomain: 'cardiffmet.ac.uk',
    officialHomepage: 'https://www.cardiffmet.ac.uk',
    researchDegreesUrl: 'https://www.cardiffmet.ac.uk/research/research-degrees/',
    researchDegreesPageTitle: 'Research degrees',
    note: 'MPhil/PhD and PhD by Published Works are advertised. Professional doctorates (DBA/DEng) are separate awards and must not be presented as a PhD route.',
  },
  {
    registerId: 'UK-PHD-013',
    rank: 13,
    slug: 'university-of-gloucestershire',
    name: 'University of Gloucestershire',
    officialDomain: 'glos.ac.uk',
    officialHomepage: 'https://www.glos.ac.uk',
    researchDegreesUrl: 'https://www.glos.ac.uk/courses/course/rsbse-phd-business-and-management/',
    researchDegreesPageTitle: 'PhD Business and Management',
    note: 'The course page lists full-time and part-time durations and a February start point. Confirm dates for the target intake before relying on them.',
  },
  {
    registerId: 'UK-PHD-014',
    rank: 14,
    slug: 'university-of-the-west-of-scotland',
    name: 'University of the West of Scotland',
    officialDomain: 'uws.ac.uk',
    officialHomepage: 'https://www.uws.ac.uk',
    researchDegreesUrl: 'https://www.uws.ac.uk/study/research-degrees/study-options/engineering/',
    researchDegreesPageTitle: 'Research degrees — Engineering',
    note: 'Engineering research degrees are based at the Paisley campus. Enterprise, Innovation and Strategy research degrees are advertised separately.',
  },
  {
    registerId: 'UK-PHD-015',
    rank: 15,
    slug: 'university-of-portsmouth',
    name: 'University of Portsmouth',
    officialDomain: 'port.ac.uk',
    officialHomepage: 'https://www.port.ac.uk',
    researchDegreesUrl: 'https://www.port.ac.uk/study/courses/postgraduate-research/business-and-management-postgraduate-research-degrees',
    researchDegreesPageTitle: 'Business and Management postgraduate research degrees',
    note: 'Multiple start points are advertised across the year. Mechanical and design engineering research degrees are on a separate page.',
  },
  {
    registerId: 'UK-PHD-016',
    rank: 16,
    slug: 'university-of-liverpool',
    name: 'University of Liverpool',
    officialDomain: 'liverpool.ac.uk',
    officialHomepage: 'https://www.liverpool.ac.uk',
    researchDegreesUrl: 'https://www.liverpool.ac.uk/courses/management-phd',
    researchDegreesPageTitle: 'Management PhD',
    note: 'Management PhD is advertised for in-person study. Engineering research degrees (materials, design, manufacturing, electrical engineering) are on separate course pages.',
  },
  {
    registerId: 'UK-PHD-017',
    rank: 17,
    slug: 'university-of-plymouth',
    name: 'University of Plymouth',
    officialDomain: 'plymouth.ac.uk',
    officialHomepage: 'https://www.plymouth.ac.uk',
    researchDegreesUrl: 'https://www.plymouth.ac.uk/courses/postgraduate/phd-business-with-management',
    researchDegreesPageTitle: 'PhD Business with Management',
    note: 'Postgraduate research fees are published by fee band; the exact band for a project depends on the discipline and must be confirmed.',
  },
  {
    registerId: 'UK-PHD-018',
    rank: 18,
    slug: 'university-of-bradford',
    name: 'University of Bradford',
    officialDomain: 'bradford.ac.uk',
    officialHomepage: 'https://www.bradford.ac.uk',
    researchDegreesUrl: 'https://www.bradford.ac.uk/courses/pg/phd-management/',
    researchDegreesPageTitle: 'PhD Management',
    note: 'Full-time, part-time and distance-learning research degrees are advertised. Classroom and laboratory international fee bands differ.',
  },
  {
    registerId: 'UK-PHD-019',
    rank: 19,
    slug: 'university-of-salford',
    name: 'University of Salford',
    officialDomain: 'salford.ac.uk',
    officialHomepage: 'https://www.salford.ac.uk',
    researchDegreesUrl: 'https://www.salford.ac.uk/courses/postgraduate-researchdoctorate/business-management-and-law',
    researchDegreesPageTitle: 'Business, Management and Law postgraduate research',
    note: 'Business and engineering research degrees sit under different schools with separate fee schedules.',
  },
  {
    registerId: 'UK-PHD-020',
    rank: 20,
    slug: 'university-of-lincoln',
    name: 'University of Lincoln',
    officialDomain: 'lincoln.ac.uk',
    officialHomepage: 'https://www.lincoln.ac.uk',
    researchDegreesUrl: 'https://www.lincoln.ac.uk/course/mgtmgtrp/',
    researchDegreesPageTitle: 'Management research degrees',
    note: 'The Business School publishes a 3,000–5,000 word proposal expectation. Engineering research degrees are advertised separately.',
  },
  {
    registerId: 'UK-PHD-021',
    rank: 21,
    slug: 'university-of-derby',
    name: 'University of Derby',
    officialDomain: 'derby.ac.uk',
    officialHomepage: 'https://www.derby.ac.uk',
    researchDegreesUrl: 'https://www.derby.ac.uk/research/degrees/applicants/',
    researchDegreesPageTitle: 'Research degrees — applicants',
    note: 'Multiple start points are advertised. Tuition fees are published separately by mode and fee status.',
  },
  {
    registerId: 'UK-PHD-022',
    rank: 22,
    slug: 'goldsmiths-university-of-london',
    name: 'Goldsmiths, University of London',
    officialDomain: 'gold.ac.uk',
    officialHomepage: 'https://www.gold.ac.uk',
    researchDegreesUrl: 'https://www.gold.ac.uk/pg/mphil-phd-management/',
    researchDegreesPageTitle: 'MPhil/PhD Management',
    note: 'Management research degrees are hosted by the Institute of Management Studies. Full-time and part-time routes are both advertised.',
  },
  {
    registerId: 'UK-PHD-023',
    rank: 23,
    slug: 'queen-mary-university-of-london',
    name: 'Queen Mary University of London',
    officialDomain: 'qmul.ac.uk',
    officialHomepage: 'https://www.qmul.ac.uk',
    researchDegreesUrl: 'https://www.qmul.ac.uk/postgraduate/research/subjects/business-and-management.html',
    researchDegreesPageTitle: 'Research degrees — Business and Management',
    note: 'September and January starts are advertised. The School of Business and Management publishes entry requirements including English language requirements.',
  },
  {
    registerId: 'UK-PHD-024',
    rank: 24,
    slug: 'university-of-bath',
    name: 'University of Bath',
    officialDomain: 'bath.ac.uk',
    officialHomepage: 'https://www.bath.ac.uk',
    researchDegreesUrl: 'https://www.bath.ac.uk/courses/postgraduate-research/phd-management-full-time/',
    researchDegreesPageTitle: 'PhD Management (full-time)',
    note: 'Bath advertises both a PhD and an integrated MRes+PhD route. These are different awards with different durations and funding implications.',
  },
  {
    registerId: 'UK-PHD-025',
    rank: 25,
    slug: 'anglia-ruskin-university',
    name: 'Anglia Ruskin University',
    officialDomain: 'aru.ac.uk',
    officialHomepage: 'https://www.aru.ac.uk',
    researchDegreesUrl: 'https://www.aru.ac.uk/study/postgraduate/business-and-management',
    researchDegreesPageTitle: 'Postgraduate research — Business and Management',
    note: 'Business and the built environment are advertised as separate research areas with different modes of study.',
  },
  {
    registerId: 'UK-PHD-026',
    rank: 26,
    slug: 'heriot-watt-university',
    name: 'Heriot-Watt University',
    officialDomain: 'hw.ac.uk',
    officialHomepage: 'https://www.hw.ac.uk',
    researchDegreesUrl: 'https://www.hw.ac.uk/study/research/business-administration-dba-phd',
    researchDegreesPageTitle: 'Business Administration DBA/PhD',
    note: 'Heriot-Watt advertises both a DBA and a PhD. The DBA is a professional doctorate and must not be treated as a PhD when checking commission eligibility.',
  },
  {
    registerId: 'UK-PHD-027',
    rank: 27,
    slug: 'bath-spa-university',
    name: 'Bath Spa University',
    officialDomain: 'bathspa.ac.uk',
    officialHomepage: 'https://www.bathspa.ac.uk',
    researchDegreesUrl: 'https://www.bathspa.ac.uk/how-to-apply/research-degrees/choose-a-research-degree/',
    researchDegreesPageTitle: 'Choose a research degree',
    note: 'Bath Spa states that a supervisor should be secured before applying. That is an application-process requirement, not evidence that any particular supervisor is available.',
  },
];

export function assertRegisterIntegrity(entries: InstitutionSeed[] = TARGET_INSTITUTIONS): void {
  if (entries.length !== 27) {
    throw new Error(`Target register must contain exactly 27 institutions; found ${entries.length}.`);
  }
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const domains = new Set<string>();
  const ranks = new Set<number>();
  for (const entry of entries) {
    if (ids.has(entry.registerId)) throw new Error(`Duplicate register id: ${entry.registerId}`);
    if (slugs.has(entry.slug)) throw new Error(`Duplicate slug: ${entry.slug}`);
    if (domains.has(entry.officialDomain)) throw new Error(`Duplicate domain: ${entry.officialDomain}`);
    if (ranks.has(entry.rank)) throw new Error(`Duplicate rank: ${entry.rank}`);
    ids.add(entry.registerId);
    slugs.add(entry.slug);
    domains.add(entry.officialDomain);
    ranks.add(entry.rank);
    if (/regent'?s/i.test(entry.name)) {
      throw new Error('Regent’s University London must not appear in the commission-eligible target register.');
    }
    if (!/^https:\/\//.test(entry.researchDegreesUrl)) {
      throw new Error(`Research degrees URL must use HTTPS: ${entry.researchDegreesUrl}`);
    }
    if (!entry.researchDegreesUrl.includes(entry.officialDomain.replace(/^www\./, ''))) {
      throw new Error(`Research degrees URL is not on the official domain: ${entry.researchDegreesUrl}`);
    }
  }
}
