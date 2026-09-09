import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('visa_officer');
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Access to sensitive medical/criminal review restricted' }, { status: 403 });
    }

    const caseId = context?.params?.caseId;
    const review = await db.visaSensitiveReview.findUnique({
      where: { caseId },
    });
    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('visa_officer');
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Access to sensitive medical/criminal review restricted' }, { status: 403 });
    }

    const caseId = context?.params?.caseId;
    const body = await req.json();

    const review = await db.visaSensitiveReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || '',
        seriousMedicalCondition: body.seriousMedicalCondition || false,
        medicalExplanation: body.medicalExplanation || '',
        criminalOffense: body.criminalOffense || false,
        criminalExplanation: body.criminalExplanation || '',
      },
      update: {
        seriousMedicalCondition: body.seriousMedicalCondition,
        medicalExplanation: body.medicalExplanation,
        criminalOffense: body.criminalOffense,
        criminalExplanation: body.criminalExplanation,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
