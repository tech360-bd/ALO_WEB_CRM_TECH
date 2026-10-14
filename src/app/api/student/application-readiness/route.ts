import { NextResponse } from 'next/server';
import { authenticateStudentRequest } from '@/lib/student-auth';
import { getFormBReadiness, FORM_B_REQUIRED_SECTIONS, FORM_B_OPTIONAL_SECTIONS, serialiseReadiness } from '@/lib/application-readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/application-readiness
 *
 * Tells the browser whether the signed-in student may create an application.
 * The same check runs again inside POST /api/applications, so this endpoint is
 * only a preview for the UI — it is never the enforcement point.
 */
export async function GET(req: Request) {
  const auth = await authenticateStudentRequest(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const readiness = await getFormBReadiness(auth.studentId);
    return NextResponse.json({
      success: true,
      ...serialiseReadiness(readiness),
      required: FORM_B_REQUIRED_SECTIONS.map((section) => ({
        key: section.key,
        label: section.label,
        href: section.href,
      })),
      optional: FORM_B_OPTIONAL_SECTIONS.map((section) => ({ key: section.key, label: section.label })),
    });
  } catch (error) {
    console.error('application-readiness error:', error);
    return NextResponse.json({ success: false, error: 'Application readiness is temporarily unavailable.' }, { status: 503 });
  }
}
