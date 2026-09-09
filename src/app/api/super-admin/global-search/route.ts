import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    // Must be super admin or admin
    const isSuperAdmin =
      (auth.roles && (auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN'))) ||
      auth.email === 'alo.admin@aloeducation.com';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: { students: [], partners: [], applications: [], employees: [], visaCases: [] } });
    }

    const [students, partners, applications, employees, visaCases] = await Promise.all([
      db.student.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { studentId: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true, journeyStage: true },
      }).catch(() => []),
      db.partnerProfile.findMany({
        where: {
          OR: [
            { companyName: { contains: query } },
            { contactPerson: { contains: query } },
            { partnerId: { contains: query } },
          ],
        },
        take: 5,
      }).catch(() => []),
      db.application.findMany({
        where: {
          OR: [
            { applicationCode: { contains: query } },
            { universityName: { contains: query } },
            { courseName: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, applicationCode: true, universityName: true, courseName: true, country: true, stage: true },
      }).catch(() => []),
      db.portalUser.findMany({
        where: {
          userType: 'EMPLOYEE',
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true, status: true },
      }).catch(() => []),
      db.visaCase.findMany({
        where: {
          OR: [
            { caseCode: { contains: query } },
            { studentName: { contains: query } },
            { destinationCountry: { contains: query } },
            { university: { contains: query } },
          ],
        },
        take: 5,
      }).catch(() => []),
    ]);

    // Audit log search action
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_GLOBAL_SEARCH',
        targetCollection: 'Global',
        targetId: 'SEARCH',
        afterData: JSON.stringify({ query, matchCounts: { students: students.length, partners: partners.length, apps: applications.length } }),
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      query,
      results: {
        students,
        partners,
        applications,
        employees,
        visaCases,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Global search failed', details: error.message }, { status: 500 });
  }
}
