import { NextResponse } from 'next/server';
import {
  PUBLIC_PROGRAMME_NOTICES,
  getPublicProgramme,
  listPublicFundingForUniversity,
} from '@/lib/phd/public-catalogue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/research/programmes/[programmeId] — PUBLIC programme detail.
 * Only verified facts are returned. Supervisor identities are not exposed: the
 * response links to the university's official supervisor directory instead.
 */
export async function GET(_req: Request, context: { params: Promise<{ programmeId: string }> }) {
  const { programmeId } = await context.params;
  if (!programmeId || programmeId.length > 64) {
    return NextResponse.json({ success: false, error: 'Invalid programme identifier.' }, { status: 400 });
  }

  try {
    const programme = await getPublicProgramme(programmeId);
    if (!programme) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This programme is not published with verified information. It may exist without a verified record in our catalogue — check the university’s official page.',
        },
        { status: 404 },
      );
    }
    const funding = await listPublicFundingForUniversity(programme.universityId);

    return NextResponse.json(
      {
        success: true,
        programme: {
          id: programme.id,
          name: programme.name,
          award: programme.award,
          discipline: programme.discipline,
          officialUrl: programme.officialUrl,
          description: programme.description,
          specialisms: programme.specialisms,
          fullTime: programme.fullTime,
          partTime: programme.partTime,
          distanceLearning: programme.distanceLearning,
          applicationRequirements: programme.applicationRequirements,
          englishRequirements: programme.englishRequirements,
          proposalFormat: programme.proposalFormat,
          proposalWordLimit: programme.proposalWordLimit,
          requiredHeadings: programme.requiredHeadings,
          referencingStyle: programme.referencingStyle,
          abstractRequired: programme.abstractRequired,
          submissionFormat: programme.submissionFormat,
          requiredDocuments: programme.requiredDocuments,
          intakes: programme.intakes,
          applicationDeadline: programme.applicationDeadline,
          feesUrl: programme.feesUrl,
          fundingUrl: programme.fundingUrl,
          supervisorDirectoryUrl: programme.supervisorDirectoryUrl,
          applicationInstructions: programme.applicationInstructions,
          verificationStatus: programme.verificationStatus,
          lastVerifiedAt: programme.lastVerifiedAt,
        },
        university: programme.university,
        school: programme.school,
        requirements: programme.requirements,
        fees: programme.fees,
        deadlines: programme.deadlines,
        funding,
        notices: PUBLIC_PROGRAMME_NOTICES,
      },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'The research catalogue is temporarily unavailable. Please try again later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
