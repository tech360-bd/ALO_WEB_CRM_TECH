import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: Request) {
  try {
    // Try to authenticate — if logged in, show personalization
    const authResult = await authenticateRequest(req as any).catch(() => null);
    let studentId: string | null = null;
    
    if (authResult && !(authResult instanceof NextResponse)) {
      const auth = authResult as any;
      studentId = auth.userId || auth.studentId || null;
    }

    // Also check query param for studentId (for public preview)
    const { searchParams } = new URL(req.url);
    const queryStudentId = searchParams.get('studentId');
    if (!studentId) studentId = queryStudentId;

    if (!studentId) {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
        profile: null,
        message: 'Not logged in — Show general preparation guidance',
      });
    }

    // Fetch student English prep profile
    let profile: any = null;
    try {
      profile = await (db as any).studentEnglishPrepProfile?.findUnique?.({
        where: { studentId },
      });
    } catch (e) {
      console.warn('StudentEnglishPrepProfile fetch failed', e);
    }

    // Fallback to PortalStudentProfile english fields
    if (!profile) {
      try {
        const portalProfile = await db.portalStudentProfile.findFirst({
          where: { studentId },
        });
        if (portalProfile) {
          profile = {
            studentId: portalProfile.studentId,
            preferredTest: portalProfile.englishTestType || '',
            currentScore: portalProfile.englishScore ? portalProfile.englishScore.toString() : '',
            targetScore: '',
            preparationStatus: 'not_started',
            progress: portalProfile.profileCompletion || 0,
            weakestModule: '',
            strongestModule: '',
            recommendedTest: portalProfile.englishTestType || 'IELTS',
            counselorRecommendation: '',
          };
        }
      } catch (e) {
        console.warn('PortalStudentProfile fallback failed', e);
      }
    }

    // Fetch recent English test records
    let recentTests: any[] = [];
    try {
      recentTests = await db.studentEnglishTestRecord.findMany({
        where: { studentProfileId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }).catch(() => []);
    } catch {}

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      profile,
      recentTests,
      personalization: profile ? {
        currentTest: profile.currentTest || profile.preferredTest || 'IELTS',
        targetScore: profile.targetScore || '7.0',
        currentScore: profile.currentScore || 'Not assessed',
        progress: profile.progress || 0,
        weakestModule: profile.weakestModule || 'Writing',
        strongestModule: profile.strongestModule || 'Reading',
        recommendedTest: profile.recommendedTest || profile.preferredTest || 'IELTS',
        upcomingMock: profile.upcomingMock || null,
        counselorRecommendation: profile.counselorRecommendation || 'Book free assessment to get personalised plan',
        preparationStatus: profile.preparationStatus || 'not_started',
      } : null,
      note: 'Student Personalization — If user is logged in: Show My English Preparation Current Test Target Score Current Score Preparation Progress Recommended Test Upcoming Mock Weakest Module Counselor Recommendation',
    });
  } catch (error: any) {
    console.error('Student profile API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch student profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, preferredTest, currentScore, targetScore, preparationStatus, progress, weakestModule } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });
    }

    let profile: any = null;
    try {
      profile = await (db as any).studentEnglishPrepProfile?.upsert?.({
        where: { studentId },
        update: {
          preferredTest: preferredTest || undefined,
          currentScore: currentScore || undefined,
          targetScore: targetScore || undefined,
          preparationStatus: preparationStatus || undefined,
          progress: progress !== undefined ? progress : undefined,
          weakestModule: weakestModule || undefined,
        },
        create: {
          studentId,
          preferredTest: preferredTest || '',
          currentScore: currentScore || '',
          targetScore: targetScore || '',
          preparationStatus: preparationStatus || 'not_started',
          progress: progress || 0,
          weakestModule: weakestModule || '',
        },
      });
    } catch (e) {
      console.warn('StudentEnglishPrepProfile upsert failed', e);
      return NextResponse.json({ success: false, error: 'Failed to save profile — DB table may not exist yet, run migration' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile, message: 'Profile saved' });
  } catch (error: any) {
    console.error('Student profile POST error', error);
    return NextResponse.json({ success: false, error: 'Failed to save profile' }, { status: 500 });
  }
}
