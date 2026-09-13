import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const university = searchParams.get('university') || '';
    const course = searchParams.get('course') || '';
    const studyLevel = searchParams.get('studyLevel') || '';
    const testSlug = searchParams.get('test') || '';

    // Try to fetch from EnglishPrepRequirement DB
    let requirements: any[] = [];
    try {
      const where: any = { status: 'active' };
      if (country) where.countryName = { contains: country };
      if (university) where.universityName = { contains: university };
      if (course) where.courseName = { contains: course };
      if (studyLevel) where.studyLevel = { contains: studyLevel };
      
      const dbReqs = await (db as any).englishPrepRequirement?.findMany?.({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      if (dbReqs && dbReqs.length > 0) requirements = dbReqs;
    } catch (e) {
      console.warn('EnglishPrepRequirement DB fetch failed', e);
    }

    // Fallback to CrmCourseRequirement for course finder connection
    let crmRequirements: any[] = [];
    if (requirements.length === 0) {
      try {
        const crmWhere: any = {};
        if (course) crmWhere.courseTitle = { contains: course };
        if (university) crmWhere.universityId = { contains: university };
        
        const crmReqs = await db.crmCourseRequirement.findMany({
          where: Object.keys(crmWhere).length > 0 ? crmWhere : undefined,
          take: 20,
          orderBy: { createdAt: 'desc' },
        });
        
        crmRequirements = crmReqs.map(r => ({
          id: r.id,
          testId: 'unknown',
          testName: r.englishTest || 'IELTS / PTE / TOEFL — Check university course page',
          countryName: '',
          universityName: r.universityId,
          courseName: r.courseId,
          studyLevel: '',
          minimumScore: r.ieltsOverall ? `IELTS ${r.ieltsOverall} (min ${r.ieltsMinBand})` : r.englishTest || 'Check university course page',
          componentRequirements: JSON.stringify(r.componentScores || {}),
          waiverAvailable: r.moiAccepted || false,
          remarks: `Work exp: ${r.workExperience || 'N/A'}, Interview: ${r.interviewRequired ? 'Required' : 'Not required'}, Portfolio: ${r.portfolioRequired ? 'Required' : 'Not required'}`,
          sourceUrl: r.officialRequirementUrl || '',
          sourceName: 'University Course Page',
          lastVerifiedAt: r.lastCheckedAt || '',
          status: 'active',
        }));
      } catch (e) {
        console.warn('CrmCourseRequirement fetch failed', e);
      }
    }

    const finalRequirements = requirements.length > 0 ? requirements : crmRequirements;

    if (finalRequirements.length === 0) {
      return NextResponse.json({
        success: true,
        requirements: [],
        count: 0,
        message: 'Requirement not available in database. Check university course page.',
        disclaimer: 'Acceptance varies by university, course and visa route. Information requires verification.',
      });
    }

    return NextResponse.json({
      success: true,
      requirements: finalRequirements,
      count: finalRequirements.length,
      disclaimer: 'Acceptance varies by university, course and visa route. Check university-specific acceptance. Verify via source_url and last_verified_at.',
      note: 'Score Requirement Explorer — User selects Country/University/Course/Study Level — System retrieves English test, Minimum overall, Minimum component scores, Waiver availability, Remarks, Source URL, Last verified — If unavailable: Requirement not available in database. Check university course page.',
    });
  } catch (error: any) {
    console.error('Requirements API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch requirements' }, { status: 500 });
  }
}
