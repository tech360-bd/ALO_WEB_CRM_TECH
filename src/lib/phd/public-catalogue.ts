import { db } from '@/lib/db';

/**
 * Public research-degree catalogue rules.
 *
 * One place decides what a visitor may see, so the directory, the individual
 * programme page and the JSON API cannot disagree. The rules are deliberately
 * strict:
 *
 *   - the programme is `VERIFIED_OFFICIAL` and has an official URL;
 *   - its university's research-degrees page is `VERIFIED_OFFICIAL`;
 *   - fees, deadlines and funding are only included when *they* are also
 *     `VERIFIED_OFFICIAL`, each with its own source.
 *
 * Nothing here exposes a supervisor's identity or contact details, and a missing
 * record is never presented as a programme that does not exist.
 */

export const PUBLIC_PROGRAMME_STATUS = 'VERIFIED_OFFICIAL';

export const PROGRAMME_AWARDS = ['PhD', 'DPhil', 'MPhil', 'MRes', 'EngD', 'MSc by Research', 'MA by Research'] as const;
export const PROGRAMME_DISCIPLINES = ['BUSINESS', 'ENGINEERING', 'OTHER'] as const;

export interface PublicProgrammeQuery {
  q?: string;
  discipline?: string;
  country?: string;
  award?: string;
  page?: number;
  pageSize?: number;
}

export function publicProgrammeWhere(query: PublicProgrammeQuery = {}) {
  const q = (query.q ?? '').trim().slice(0, 120);
  return {
    verificationStatus: PUBLIC_PROGRAMME_STATUS,
    officialUrl: { not: null },
    ...(query.discipline && query.discipline !== 'all' ? { discipline: query.discipline } : {}),
    ...(query.award && query.award !== 'all' ? { award: query.award } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { specialisms: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
    university: {
      researchDegreesStatus: PUBLIC_PROGRAMME_STATUS,
      ...(query.country && query.country !== 'all' ? { country: query.country } : {}),
    },
  };
}

export async function listPublicProgrammes(query: PublicProgrammeQuery = {}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
  const where = publicProgrammeWhere(query);
  const [total, programmes] = await Promise.all([
    db.phdProgramme.count({ where }),
    db.phdProgramme.findMany({
      where,
      orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        award: true,
        discipline: true,
        officialUrl: true,
        fullTime: true,
        partTime: true,
        distanceLearning: true,
        lastVerifiedAt: true,
        university: { select: { name: true, slug: true, country: true, officialDomain: true } },
      },
    }),
  ]);
  return { total, page, pageSize, programmes };
}

export async function getPublicProgramme(programmeId: string) {
  if (!programmeId || programmeId.length > 64) return null;
  return db.phdProgramme.findFirst({
    where: {
      id: programmeId,
      verificationStatus: PUBLIC_PROGRAMME_STATUS,
      officialUrl: { not: null },
      university: { researchDegreesStatus: PUBLIC_PROGRAMME_STATUS },
    },
    include: {
      university: {
        select: {
          name: true,
          slug: true,
          country: true,
          officialDomain: true,
          officialHomepage: true,
          researchDegreesUrl: true,
          researchDegreesStatus: true,
          researchDegreesPageTitle: true,
          lastVerifiedAt: true,
        },
      },
      school: { select: { name: true, schoolType: true, researchUrl: true, websiteUrl: true } },
      requirements: {
        where: { verificationStatus: PUBLIC_PROGRAMME_STATUS },
        select: { id: true, documentType: true, mandatory: true, sourceUrl: true, notes: true },
      },
      fees: {
        where: { verificationStatus: PUBLIC_PROGRAMME_STATUS },
        select: {
          id: true,
          academicYear: true,
          studentStatus: true,
          feeBasis: true,
          amountMinor: true,
          currency: true,
          sourceUrl: true,
        },
      },
      deadlines: {
        where: { verificationStatus: PUBLIC_PROGRAMME_STATUS },
        select: { id: true, title: true, kind: true, dueDate: true, timezone: true, sourceUrl: true, status: true },
      },
    },
  });
}

export async function listPublicFundingForUniversity(universityId: string) {
  return db.phdFundingOpportunity.findMany({
    where: { universityId, verificationStatus: PUBLIC_PROGRAMME_STATUS },
    orderBy: [{ closingDate: 'asc' }],
    take: 20,
    select: {
      id: true,
      name: true,
      officialUrl: true,
      fundingType: true,
      eligibility: true,
      nationalityRestrictions: true,
      tuitionCoverage: true,
      stipendAmountMinor: true,
      currency: true,
      duration: true,
      closingDate: true,
      closingTimezone: true,
      separateAdmissionRequired: true,
      supervisorContactRequired: true,
      lastVerifiedAt: true,
    },
  });
}

export const PUBLIC_PROGRAMME_NOTICES = [
  'Annual and total course costs are labelled separately; a missing amount stays unknown.',
  'A general admissions deadline, a funding deadline and a project deadline are separate dates.',
  'A research-degree application is not the same as an advertised, funded project.',
  'Supervisor availability is never inferred from a profile — confirm it with the department.',
] as const;
